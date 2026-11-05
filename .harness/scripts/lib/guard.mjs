// Guard decisions for operations an AI tool is about to run.
// The guard only narrows: it returns deny, ask or none, never allow, so it cannot widen
// what the product's own permission check would permit. It recognises plain command lines
// only; indirection such as scripts, aliases or command substitution is not analysed.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { defaultProtectedPaths, matchesProtectedPath } from './protected-paths.mjs';

export const defaultGuard = {
  protectedBranches: ['main', 'master', 'release/*'],
  secretPaths: ['.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', 'id_rsa', 'id_rsa.*',
    'id_ecdsa', 'id_ecdsa.*', 'id_ed25519', 'id_ed25519.*', 'credentials', 'credentials.*', '.netrc', '.dev.vars', '.dev.vars.*'],
  secretPathExceptions: ['.env.example', '.env.sample', '.env.template', '.dev.vars.example', '*.pub'],
};

// Names used to test a glob in a command argument (for example `cat .env*`) against the defaults.
const secretSamples = ['.env', '.env.local', '.env.production', 'server.pem', 'server.key',
  'id_rsa', 'id_ed25519', 'credentials', 'credentials.json', '.netrc', '.dev.vars', '.dev.vars.production'];

const rank = { none: 0, ask: 1, deny: 2 };
const none = { decision: 'none', rule: null, reason: null };

// protectedBranches and secretPaths replace the defaults when set; exceptions and protected
// paths are added to the defaults, so the default protected paths cannot be removed.
export function guardSettings(profile) {
  const guard = profile?.guard ?? {};
  return {
    protectedBranches: guard.protectedBranches ?? defaultGuard.protectedBranches,
    secretPaths: guard.secretPaths ?? defaultGuard.secretPaths,
    secretPathExceptions: [...new Set([...defaultGuard.secretPathExceptions, ...(guard.secretPathExceptions ?? [])])],
    protectedPaths: [...new Set([...defaultProtectedPaths, ...(guard.protectedPaths ?? [])])],
  };
}

// Reported by validate-config.mjs. Weakening is allowed but must be visible.
export function guardWarnings(profile) {
  const guard = profile?.guard;
  if (!guard) return [];
  const warnings = [];
  if (guard.protectedBranches && guard.protectedBranches.length === 0) {
    warnings.push('Warning: guard.protectedBranches is empty; no branch is protected by the guard');
  }
  const dropped = defaultGuard.secretPaths.filter((entry) => guard.secretPaths && !guard.secretPaths.includes(entry));
  if (dropped.length) warnings.push(`Warning: guard.secretPaths omits default entries: ${dropped.join(', ')}`);
  const excepted = secretSamples.filter((name) => (guard.secretPathExceptions ?? []).some((entry) => globMatch(entry, name)));
  if (excepted.length) warnings.push(`Warning: guard.secretPathExceptions exempts usual secret files: ${excepted.join(', ')}`);
  return warnings;
}

function globRegExp(glob) {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === '*' && glob[i + 1] === '*') { source += '.*'; i++; }
    else if (char === '*') source += '[^/]*';
    else if (char === '?') source += '[^/]';
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}

export function globMatch(glob, value) {
  return globRegExp(glob).test(value);
}

// Returns the POSIX path relative to root, or null when the path is outside root.
function relativeTo(root, cwd, file) {
  const rel = path.relative(root, path.resolve(cwd, file)).split(path.sep).join('/');
  return rel === '' || rel === '..' || rel.startsWith('../') || path.isAbsolute(rel) ? null : rel;
}

// Patterns without "/" match the file name anywhere; patterns with "/" match the path inside root.
function matchesAny(patterns, name, rel) {
  return patterns.some((pattern) => (pattern.includes('/') ? rel !== null && globMatch(pattern, rel) : globMatch(pattern, name)));
}

export function isSecretPath(settings, root, cwd, file) {
  const name = path.posix.basename(file.replace(/\\/g, '/'));
  const rel = relativeTo(root, cwd, file);
  return matchesAny(settings.secretPaths, name, rel) && !matchesAny(settings.secretPathExceptions, name, rel);
}

// A command argument such as `.env*` is a glob the shell expands later; test it against usual names.
function argumentNamesSecret(settings, root, cwd, arg) {
  // curl uses @file and name=@file;type=... to upload a file.
  const upload = /^(?:[\w.-]+=)?@([^;]+)/.exec(arg);
  const value = upload ? upload[1] : arg;
  if (!value || value.startsWith('-')) return false;
  if (!/[*?[]/.test(value)) return isSecretPath(settings, root, cwd, value);
  const base = path.posix.basename(value);
  if (!/[^*?[\]]/.test(base)) return false;
  return secretSamples.some((sample) => globMatch(base, sample) && isSecretPath(settings, root, cwd, sample));
}

function isProtectedPath(settings, root, cwd, file) {
  const rel = relativeTo(root, cwd, file);
  return rel !== null && matchesProtectedPath(rel, settings.protectedPaths);
}

function isProtectedBranch(settings, branch) {
  return settings.protectedBranches.some((pattern) => globMatch(pattern, branch));
}

function result(decision, rule, reason) {
  return { decision, rule, reason };
}

function strongest(results) {
  return results.reduce((best, item) => (rank[item.decision] > rank[best.decision] ? item : best), none);
}

// --- shell parsing -------------------------------------------------------------------------

// Splits a command line into simple commands. Quotes and backslashes are honoured;
// command substitution and parameter expansion stay as literal text.
export function parseCommandLine(text) {
  const segments = [];
  let segment = { words: [], redirects: [], stdin: '' };
  let word = null;
  let quote = null;
  let pendingRedirect = null;
  const heredocs = [];
  const finishWord = () => {
    if (word === null) return;
    if (pendingRedirect) {
      if (pendingRedirect === '<<') heredocs.push({ segment, delimiter: word.replace(/^-/, '') });
      else segment.redirects.push({ op: pendingRedirect, target: word });
      pendingRedirect = null;
    } else segment.words.push(word);
    word = null;
  };
  const finishSegment = (piped = false) => {
    finishWord();
    const empty = !segment.words.length && !segment.redirects.length;
    if (!empty) segments.push(segment);
    // A line break right after "|" continues the pipe, so an empty segment passes its pipe on.
    segment = { words: [], redirects: [], stdin: '', piped: piped || (empty && Boolean(segment.piped)) };
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote === "'") {
      if (char === "'") quote = null; else word += char;
      continue;
    }
    if (quote === '"') {
      if (char === '"') quote = null;
      else if (char === '\\' && i + 1 < text.length && '"\\$`'.includes(text[i + 1])) word += text[++i];
      else word += char;
      continue;
    }
    if (char === "'" || char === '"') { quote = char; word ??= ''; continue; }
    if (char === '\\' && i + 1 < text.length) {
      if (text[i + 1] !== '\n') word = (word ?? '') + text[i + 1];
      i++;
      continue;
    }
    if (char === '\n') {
      finishSegment();
      // Heredoc bodies are data for the previous command, not commands of their own.
      while (heredocs.length) {
        const { segment: owner, delimiter } = heredocs.shift();
        let end = text.indexOf('\n', i + 1);
        while (true) {
          const line = text.slice(i + 1, end === -1 ? text.length : end);
          if (line.trim() === delimiter) { i = end === -1 ? text.length : end; break; }
          owner.stdin += `${line}\n`;
          if (end === -1) { i = text.length; break; }
          i = end;
          end = text.indexOf('\n', i + 1);
        }
      }
      continue;
    }
    if (char === ' ' || char === '\t') { finishWord(); continue; }
    if (char === '<' || char === '>' || (char === '&' && text[i + 1] === '>')) {
      // A word made only of digits (2>) or "&" (&>) names a file descriptor, not an argument.
      if (word !== null && /^\d+$/.test(word)) word = null;
      finishWord();
      let op = char;
      while ('<>&|'.includes(text[i + 1] ?? '') && op.length < 3) op += text[++i];
      if (op.startsWith('<<<')) pendingRedirect = '<<<';
      else if (op.startsWith('<<')) pendingRedirect = '<<';
      else pendingRedirect = op.replace(/[&|]/g, '').startsWith('<') ? '<' : '>';
      if (/[&]$/.test(op) && /\d/.test(text[i + 1] ?? '')) {
        // fd duplication such as 2>&1
        while (/\d/.test(text[i + 1] ?? '')) i++;
        pendingRedirect = null;
      }
      continue;
    }
    if (char === '&' && text[i - 1] === '|') continue; // "|&" is a pipe as well
    if (';|&()'.includes(char)) {
      // A single "|" feeds the next command's stdin; "||" only chains commands.
      const pipe = char === '|' && text[i + 1] !== '|' && text[i - 1] !== '|';
      finishSegment(pipe);
      continue;
    }
    word = (word ?? '') + char;
  }
  finishSegment();
  return segments;
}

// Shell options whose value is the next word, such as `-o pipefail`.
const shellValueOptions = new Set(['-o', '+o', '-O', '+O', '--rcfile', '--init-file']);

// Without a script operand, or with -s, a shell runs whatever arrives on stdin (`curl ... | sh`).
function readsCommandsFromStdin(words) {
  const args = words.slice(1);
  for (let i = 0; i < args.length; i++) {
    const word = args[i];
    if (word === '--') return true;
    if (/^-[A-Za-z]*s[A-Za-z]*$/.test(word)) return true;
    if (shellValueOptions.has(word)) { i++; continue; }
    if (!/^[-+]/.test(word)) return false;
  }
  return true;
}

const wrappers = new Set(['sudo', 'doas', 'command', 'builtin', 'exec', 'time', 'nohup', 'nice', 'env', 'stdbuf']);
const shells = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);

// Drops variable assignments and wrappers so that `sudo env A=1 git push` is seen as `git push`.
function unwrap(words) {
  let rest = [...words];
  for (let guard = 0; guard < 10 && rest.length; guard++) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(rest[0])) { rest.shift(); continue; }
    const name = path.posix.basename(rest[0]);
    if (name === 'timeout') { rest = rest.slice(1); while (rest[0]?.startsWith('-')) rest.shift(); rest.shift(); continue; }
    if (!wrappers.has(name)) break;
    rest.shift();
    while (rest[0]?.startsWith('-') || /^[A-Za-z_][A-Za-z0-9_]*=/.test(rest[0] ?? '')) rest.shift();
  }
  return rest;
}

// --- command rules -------------------------------------------------------------------------

function currentBranch(cwd) {
  const out = spawnSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd, encoding: 'utf8', timeout: 3000 });
  return out.status === 0 ? out.stdout.trim() || null : null;
}

const shortBranch = (ref) => ref.replace(/^refs\/heads\//, '');

// True when name is an existing local tag, so `git push origin v1.0.0` pushes that tag.
function isLocalTag(cwd, name) {
  if (!name || name.startsWith('-')) return false;
  const out = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/tags/${name}`], { cwd, timeout: 3000 });
  return out.status === 0;
}

function gitPush(settings, cwd, args) {
  let force = false; let remove = false; let mirror = false; let all = false; let noVerify = false; let tags = false;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') { positional.push(...args.slice(i + 1)); break; }
    if (arg === '--force' || arg.startsWith('--force-with-lease') || arg === '--force-if-includes') force = true;
    else if (arg === '--delete') remove = true;
    else if (arg === '--mirror') mirror = true;
    else if (arg === '--all' || arg === '--branches') all = true;
    else if (arg === '--no-verify') noVerify = true;
    else if (arg === '--tags' || arg === '--follow-tags') tags = true;
    else if (arg === '--dry-run') return none;
    else if (arg === '-o' || arg === '--push-option' || arg === '--repo' || arg === '--receive-pack' || arg === '--exec') i++;
    else if (/^-[A-Za-z]+$/.test(arg)) {
      if (arg.includes('f')) force = true;
      if (arg.includes('d')) remove = true;
      if (arg.includes('n')) return none;
      if (arg.includes('o')) i++;
    } else if (!arg.startsWith('-')) positional.push(arg);
  }
  const results = [];
  if (noVerify) results.push(result('ask', 'git-push-no-verify', 'git push --no-verify skips the pre-push guard'));
  // A pushed tag is treated as permanent: it is not deleted or moved afterwards (rules/core/release.md).
  const tagPush = () => result('ask', 'git-push-tag', 'git push publishes a tag, which is treated as irreversible');
  if (tags) results.push(tagPush());
  if (mirror) return result('deny', 'git-push-mirror', 'git push --mirror can overwrite and delete protected branches');
  const refspecs = positional.slice(1);
  const targets = [];
  if (all) targets.push(...settings.protectedBranches.map((branch) => ({ branch, force, remove: false, all: true })));
  for (const spec of refspecs) {
    const plus = spec.startsWith('+');
    const body = plus ? spec.slice(1) : spec;
    const [src, dst] = body.includes(':') ? body.split(/:(.*)/s) : [body, body];
    // Only a tag destination is a tag push; `refs/tags/v1:refs/heads/main` still updates the branch below.
    const tagTarget = body.includes(':') ? dst.startsWith('refs/tags/') : src.startsWith('refs/tags/') || isLocalTag(cwd, src);
    if (tagTarget) {
      results.push(tagPush());
      continue;
    }
    const target = dst === 'HEAD' || dst === '' && src === 'HEAD' ? currentBranch(cwd) : shortBranch(dst || src);
    targets.push({ branch: target, force: force || plus, remove: remove || (body.includes(':') && src === '') });
  }
  if (!refspecs.length && !all) targets.push({ branch: currentBranch(cwd), force, remove });
  for (const target of targets) {
    const protectedTarget = target.branch !== null && isProtectedBranch(settings, target.branch);
    const name = target.branch ?? 'an unresolved branch';
    if (target.remove) {
      results.push(protectedTarget
        ? result('deny', 'git-push-delete-protected', `Deleting protected branch ${name} is not allowed`)
        : result('ask', 'git-push-delete', `git push deletes ${name}`));
    } else if (target.force) {
      results.push(protectedTarget
        ? result('deny', 'git-push-force-protected', `Force push to protected branch ${name} is not allowed`)
        : result('ask', 'git-push-force', `Force push to ${name} rewrites remote history`));
    } else if (target.all) {
      results.push(result('ask', 'git-push-protected', 'git push --all includes protected branches'));
      break;
    } else if (protectedTarget) {
      results.push(result('ask', 'git-push-protected', `Push to protected branch ${name}`));
    }
  }
  return strongest(results);
}

// Listing and verifying options make `git tag` read-only; any other call with a name creates a tag.
const tagReadOnly = /^(?:-l|--list|-v|--verify|-n\d*|--contains|--no-contains|--points-at|--merged|--no-merged|--sort|--column|--format)(?:=|$)/;

function createsTag(args) {
  if (args.some((arg) => tagReadOnly.test(arg))) return false;
  const valued = new Set(['-m', '--message', '-F', '--file', '-u', '--local-user', '--cleanup', '--trailer']);
  for (let i = 0; i < args.length; i++) {
    if (valued.has(args[i])) { i++; continue; }
    if (!args[i].startsWith('-')) return true;
  }
  return false;
}

function gitCommand(settings, cwd, words) {
  let i = 1;
  let dir = cwd;
  const results = [];
  while (i < words.length && words[i].startsWith('-')) {
    if (words[i] === '-C') { dir = path.resolve(dir, words[i + 1] ?? '.'); i += 2; }
    else if (words[i] === '-c') {
      if (/^core\.hookspath=/i.test(words[i + 1] ?? '')) {
        results.push(result('ask', 'git-hooks-path', 'Overriding core.hooksPath can bypass the pre-push guard'));
      }
      i += 2;
    } else i++;
  }
  const sub = words[i];
  const args = words.slice(i + 1);
  const has = (...flags) => args.some((arg) => flags.includes(arg));
  const ask = (rule, reason) => results.push(result('ask', rule, reason));
  if (sub === 'push') results.push(gitPush(settings, dir, args));
  else if (sub === 'reset' && has('--hard', '--merge', '--keep')) ask('git-reset-hard', 'git reset discards working tree changes');
  else if (sub === 'clean' && args.some((arg) => arg === '--force' || /^-[A-Za-z]*f/.test(arg))
    && !args.some((arg) => arg === '--dry-run' || /^-[A-Za-z]*n/.test(arg))) ask('git-clean', 'git clean deletes untracked files');
  else if (sub === 'branch' && args.some((arg) => arg === '--delete' || /^-[A-Za-z]*[dD]/.test(arg))) ask('git-branch-delete', 'git branch deletes a branch');
  else if (sub === 'tag' && args.some((arg) => arg === '--delete' || /^-[A-Za-z]*d/.test(arg))) ask('git-tag-delete', 'git tag deletes a tag');
  else if (sub === 'tag' && createsTag(args)) ask('git-tag-create', 'git tag creates a release tag');
  else if (sub === 'checkout' && (has('--', '.', '-f', '--force'))) ask('git-checkout-discard', 'git checkout can discard working tree changes');
  else if (sub === 'restore' && !(args.includes('--staged') && !args.includes('--worktree') && !args.includes('-W'))) ask('git-restore', 'git restore discards working tree changes');
  else if (sub === 'stash' && ['drop', 'clear'].includes(args[0])) ask('git-stash-drop', 'git stash drop/clear deletes stashed changes');
  else if (sub === 'rebase' && !has('--abort', '--continue', '--skip', '--quit')) ask('git-history-rewrite', 'git rebase rewrites history');
  else if (sub === 'commit' && has('--amend')) ask('git-history-rewrite', 'git commit --amend rewrites history');
  else if (sub === 'filter-branch' || sub === 'filter-repo') ask('git-history-rewrite', `git ${sub} rewrites history`);
  else if (sub === 'remote' && ['remove', 'rm', 'set-url', 'rename'].includes(args[0])) ask('git-remote-change', 'git remote changes where pushes go');
  else if (sub === 'config' && args.some((arg) => /^core\.hookspath$/i.test(arg)) && args.length > 1
    && !has('--get', '--list', '-l', '--get-all')) ask('git-hooks-path', 'Changing core.hooksPath can disable the pre-push guard');
  return strongest(results);
}

const dbClients = new Set(['psql', 'mysql', 'mariadb', 'sqlite3', 'sqlcmd', 'cockroach', 'clickhouse-client', 'duckdb']);

function destructiveSql(text) {
  if (/\b(drop|truncate)\s+\w/i.test(text)) return 'DROP/TRUNCATE';
  if (/\balter\s+(table|database|schema|user|role)\b/i.test(text)) return 'ALTER';
  for (const match of text.matchAll(/\bdelete\s+from\b([^;]*)/gi)) if (!/\bwhere\b/i.test(match[1])) return 'DELETE without WHERE';
  for (const match of text.matchAll(/\bupdate\s+\S+\s+set\b([^;]*)/gi)) if (!/\bwhere\b/i.test(match[1])) return 'UPDATE without WHERE';
  return null;
}

// Keyed by the command name after package runners are removed; tested against the remaining arguments.
const migrationCommands = {
  prisma: /\bmigrate (deploy|reset|dev)\b|\bdb (push|execute)\b/,
  artisan: /^(migrate\S*|db:(wipe|seed))\b/,
  rails: /\bdb:(migrate|rollback|drop|reset|schema:load|setup|seed|purge|truncate_all)\b/,
  rake: /\bdb:(migrate|rollback|drop|reset|schema:load|setup|seed|purge|truncate_all)\b/,
  'manage.py': /^(migrate|flush|loaddata)\b/,
  alembic: /\b(upgrade|downgrade|stamp)\b/,
  knex: /\b(migrate:(latest|up|down|rollback)|seed:run)\b/,
  sequelize: /\bdb:(migrate|seed|drop)/,
  'sequelize-cli': /\bdb:(migrate|seed|drop)/,
  typeorm: /\b(migration:(run|revert)|schema:(sync|drop))\b/,
  'drizzle-kit': /\b(push|migrate|drop)\b/,
  flyway: /\b(migrate|clean|repair|undo|baseline)\b/,
  liquibase: /\b(update\S*|rollback\S*|drop-?all)\b/i,
  goose: /\b(up|up-by-one|up-to|down|down-to|redo|reset)\b/,
  migrate: /\b(up|down|drop|force|goto)\b/,
  dotnet: /\bef database (update|drop)\b/,
  supabase: /\bdb (reset|push)\b/,
  dropdb: /(?:)/,
  mysqladmin: /\bdrop\b/,
  'redis-cli': /\bflush(all|db)\b/i,
};

const runners = [['npx'], ['bunx'], ['yarn'], ['pnpm', 'dlx'], ['pnpm', 'exec'], ['pnpm'], ['npm', 'exec'],
  ['bundle', 'exec'], ['poetry', 'run'], ['uv', 'run'], ['pipenv', 'run']];

function migration(words) {
  let rest = [...words];
  for (const runner of runners) {
    if (runner.every((part, index) => rest[index] === part)) { rest = rest.slice(runner.length); break; }
  }
  while (rest[0]?.startsWith('-')) rest.shift();
  let name = path.posix.basename(rest[0] ?? '');
  if (/^python[\d.]*$/.test(name) && rest[1]?.endsWith('.py')) { rest = rest.slice(1); name = path.posix.basename(rest[0]); }
  if ((name === 'php' || name === 'sail') && rest[1] === 'artisan') { rest = rest.slice(1); name = 'artisan'; }
  if (/^typeorm/.test(name)) name = 'typeorm';
  const pattern = migrationCommands[name];
  const args = rest.slice(1).join(' ');
  if (pattern && pattern.test(args)) return result('ask', 'db-migration', `${name} ${args} changes a database`);
  return none;
}

// --- package managers and releases ----------------------------------------------------------

// Positional arguments after the subcommand, skipping options that take a separate value.
function positionals(args, valued = new Set()) {
  const found = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--') { found.push(...args.slice(i + 1)); break; }
    if (valued.has(args[i])) { i++; continue; }
    if (!args[i].startsWith('-')) found.push(args[i]);
  }
  return found;
}

// pip arguments that name a local path or requirements file install what the project already declares.
const pipValued = new Set(['-r', '--requirement', '-c', '--constraint', '-i', '--index-url',
  '--extra-index-url', '-t', '--target', '--prefix', '--root', '-f', '--find-links', '--python']);
const isLocalPath = (arg) => arg === '.' || /^(?:\.\.?\/|\/|~\/)/.test(arg);

// `-e` takes a path or a VCS URL; only a local path is exempt, so its value is checked like a positional.
function pipInstall(args) {
  if (args[0] !== 'install') return false;
  const rest = args.slice(1).flatMap((arg) => /^--editable=/.test(arg) ? [arg.slice('--editable='.length)] : [arg])
    .filter((arg) => arg !== '-e' && arg !== '--editable');
  return positionals(rest, pipValued).some((arg) => !isLocalPath(arg));
}

// Subcommands that add a named dependency, keyed by tool. `true` means any positional argument names a package.
const addCommands = {
  npm: ['install', 'i', 'add', 'isntall', 'in'], pnpm: ['add', 'install', 'i'], yarn: ['add'], bun: ['add', 'install', 'i'],
  cargo: ['add'], go: ['get'], composer: ['require'], gem: ['install'], poetry: ['add'], uv: ['add'],
};
const publishCommands = {
  npm: ['publish'], pnpm: ['publish'], yarn: ['publish'], bun: ['publish'], cargo: ['publish'], poetry: ['publish'],
  twine: ['upload'], gem: ['push'],
};

// Global options that take a separate value before the subcommand (e.g. `npm --prefix . publish`, `gh -R o/r release`).
const globalValued = {
  npm: new Set(['--prefix', '-w', '--workspace', '--userconfig', '--registry', '--cache']),
  pnpm: new Set(['-C', '--dir', '-F', '--filter', '--registry']),
  yarn: new Set(['--cwd']),
  bun: new Set(['--cwd', '--config', '-c']),
  cargo: new Set(['-C', '--config', '-Z']),
  poetry: new Set(['-C', '--directory', '-P', '--project']),
  uv: new Set(['--directory', '--project', '--config-file', '--cache-dir']),
  gh: new Set(['-R', '--repo']),
  go: new Set(['-C']),
  composer: new Set(['-d', '--working-dir']),
  dotnet: new Set([]),
};

function packageCommand(words) {
  let rest = words;
  let name = path.posix.basename(rest[0] ?? '');
  if (/^python[\d.]*$/.test(name) && rest[1] === '-m' && rest[2]) { rest = rest.slice(2); name = rest[0]; }
  if (name === 'pip3' || /^pip[\d.]*$/.test(name)) name = 'pip';
  const args = rest.slice(1);
  let index = 0;
  for (; index < args.length; index++) {
    if (globalValued[name]?.has(args[index])) index++;
    else if (!args[index].startsWith('-')) break;
  }
  const sub = args[index];
  const after = sub === undefined ? [] : args.slice(index + 1);
  // A dry run only reports what would be published, like `git push --dry-run`.
  const publish = (command = `${name} ${sub}`) => args.includes('--dry-run') ? none : result('ask', 'package-publish', `${command} publishes a package version, which is treated as irreversible`);
  const add = () => result('ask', 'dependency-add', `${name} ${sub} adds a dependency`);
  if (name === 'yarn' && sub === 'npm' && positionals(after)[0] === 'publish') return publish('yarn npm publish');
  if (publishCommands[name]?.includes(sub)) return publish();
  if (name === 'dotnet' && sub === 'nuget' && positionals(after)[0] === 'push') return publish('dotnet nuget push');
  if (name === 'pip') return pipInstall([sub, ...after]) ? add() : none;
  if (name === 'uv' && sub === 'pip') return pipInstall(after) ? result('ask', 'dependency-add', 'uv pip install adds a dependency') : none;
  if (name === 'dotnet' && sub === 'add' && positionals(after).includes('package')) return result('ask', 'dependency-add', 'dotnet add package adds a dependency');
  if (addCommands[name]?.includes(sub) && positionals(after).length) return add();
  const action = name === 'gh' ? positionals(after, globalValued.gh)[0] : undefined;
  if (name === 'gh' && sub === 'release' && ['create', 'upload', 'edit', 'delete'].includes(action)) {
    return result('ask', 'release-create', `gh release ${action} changes a published release`);
  }
  return none;
}

// Commands that print, copy or send a file named in their arguments.
const readers = new Set(['cat', 'less', 'more', 'head', 'tail', 'bat', 'batcat', 'nl', 'tac', 'view', 'cp', 'scp', 'rsync',
  'base64', 'xxd', 'od', 'hexdump', 'strings', 'grep', 'egrep', 'fgrep', 'rg', 'ag', 'sed', 'awk', 'sort', 'uniq',
  'cut', 'diff', 'cmp', 'jq', 'yq', 'vi', 'vim', 'nano', 'emacs', 'source', '.', 'curl', 'wget', 'nc', 'openssl',
  'tar', 'zip', 'gzip']);

function commandSegment(settings, root, state, segment, fullText, depth) {
  const words = unwrap(segment.words);
  const results = [];
  for (const redirect of segment.redirects) {
    if (redirect.op === '<' && isSecretPath(settings, root, state.cwd, redirect.target)) {
      results.push(result('deny', 'secret-read', `Reading secret file ${redirect.target} is not allowed`));
    } else if (redirect.op === '>' && isSecretPath(settings, root, state.cwd, redirect.target)) {
      results.push(result('ask', 'secret-write', `Writing secret file ${redirect.target}`));
    } else if (redirect.op === '>' && isProtectedPath(settings, root, state.cwd, redirect.target)) {
      results.push(result('ask', 'protected-path-write', `Writing protected path ${redirect.target}`));
    }
  }
  if (!words.length) return strongest(results);
  const name = path.posix.basename(words[0]);
  if (name === 'cd') {
    state.cwd = path.resolve(state.cwd, words[1] ?? root);
    return strongest(results);
  }
  if (shells.has(name)) {
    const index = words.findIndex((word, i) => i > 0 && /^-[A-Za-z]*c[A-Za-z]*$/.test(word));
    if (index !== -1 && words[index + 1] && depth < 3) results.push(evaluateCommand(settings, root, state.cwd, words[index + 1], depth + 1));
    if (segment.piped && index === -1 && readsCommandsFromStdin(words)) {
      results.push(result('ask', 'pipe-to-shell', `${name} runs commands from a pipe the guard cannot inspect`));
    }
  }
  if (name === 'eval' && depth < 3) results.push(evaluateCommand(settings, root, state.cwd, words.slice(1).join(' '), depth + 1));
  if (name === 'git') results.push(gitCommand(settings, state.cwd, words));
  if (readers.has(name)) {
    const secret = words.slice(1).find((arg) => argumentNamesSecret(settings, root, state.cwd, arg));
    if (secret) results.push(result('deny', 'secret-read', `${name} would read secret file ${secret}`));
  }
  if (words.some((word) => dbClients.has(path.posix.basename(word)))) {
    const kind = destructiveSql(`${fullText}\n${segment.stdin}`);
    if (kind) results.push(result('ask', 'db-destructive-sql', `${kind} statement sent to a database client`));
    else if (dbClients.has(name) && (words.some((word) => word === '-f' || word.startsWith('--file'))
      || segment.redirects.some((redirect) => redirect.op === '<'))) {
      results.push(result('ask', 'db-sql-file', `${name} runs SQL from a file the guard cannot inspect`));
    }
  }
  results.push(migration(words));
  results.push(packageCommand(words));
  return strongest(results);
}

export function evaluateCommand(settings, root, cwd, text, depth = 0) {
  const state = { cwd };
  const results = parseCommandLine(text).map((segment) => commandSegment(settings, root, state, segment, text, depth));
  return strongest(results);
}

// input: { kind: 'command' | 'read' | 'write', command?, path?, cwd? }
export function evaluate(settings, root, input) {
  const cwd = path.resolve(root, input?.cwd ?? '.');
  if (input?.kind === 'command' && typeof input.command === 'string') return evaluateCommand(settings, root, cwd, input.command);
  if ((input?.kind === 'read' || input?.kind === 'write') && typeof input.path === 'string' && input.path) {
    if (isSecretPath(settings, root, cwd, input.path)) {
      return input.kind === 'read'
        ? result('deny', 'secret-read', `Reading secret file ${input.path} is not allowed`)
        : result('ask', 'secret-write', `Writing secret file ${input.path}`);
    }
    if (input.kind === 'write' && isProtectedPath(settings, root, cwd, input.path)) {
      return result('ask', 'protected-path-write', `Writing protected path ${input.path}`);
    }
    return none;
  }
  return result('ask', 'invalid-input', 'The guard could not interpret the operation');
}

// --- pre-push ------------------------------------------------------------------------------

const zero = /^0+$/;

// lines: "<local ref> <local sha> <remote ref> <remote sha>" as Git passes them to pre-push.
// isAncestor(remoteSha, localSha) returns true, false, or null when the remote commit is unknown.
export function evaluatePrePush(settings, lines, isAncestor) {
  const problems = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 4) continue;
    const [, localSha, remoteRef, remoteSha] = parts;
    if (!remoteRef.startsWith('refs/heads/')) continue;
    const branch = shortBranch(remoteRef);
    if (!isProtectedBranch(settings, branch)) continue;
    if (zero.test(localSha)) problems.push(`Deleting protected branch ${branch} is not allowed`);
    else if (!zero.test(remoteSha) && isAncestor(remoteSha, localSha) !== true) {
      problems.push(`Push to protected branch ${branch} is not a fast-forward (or the remote commit is not fetched)`);
    } else problems.push(`Direct push to protected branch ${branch}; open a pull request instead`);
  }
  return problems;
}
