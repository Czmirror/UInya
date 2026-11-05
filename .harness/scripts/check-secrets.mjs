// Secret check for projects that adopt the harness. Looks for private keys, some cloud and
// GitHub tokens, and payment card numbers in files Git tracks or would track. A match is
// reported by file and kind only; the matched value is never printed. This is a limited
// pattern check, not a full secret scanner (see rules/core/sensitive-data.md).
//
// Usage: node .harness/scripts/check-secrets.mjs [--root DIR] [--exclude PATH_PREFIX]...
// The harness files under .harness/ (rules, templates, scripts, ...) are skipped: the harness's own CI
// checks them. Project-owned files there, such as .harness/project.json, are still scanned.
// A file whose staged copy differs from the working tree is scanned in both versions, so a secret
// that is staged but removed only from the working tree is still reported.
// Files over the size limit are not read and make the check fail, since they were not verified.
import { spawnSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeKind, secretKinds } from './lib/secrets.mjs';

// Files larger than this are not read (generated data, archives); they fail the check until excluded.
const maxBytes = 5 * 1024 * 1024;

// Directories that bootstrap fills with harness files. Anything else under .harness/ belongs to the project.
const harnessDirectories = ['rules', 'templates', 'scripts', 'schemas', 'examples', 'docs', 'upstream'].map((name) => `.harness/${name}/`);

function git(root, args) {
  const result = spawnSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed; run inside a Git repository`);
  return result.stdout;
}

// Paths whose index entry differs from the working tree (`git diff` without --cached).
function changedSinceStaged(root) {
  return new Set(git(root, ['diff', '-z', '--name-only']).split('\0').filter(Boolean));
}

function stagedContent(root, file) {
  const result = spawnSync('git', ['--no-optional-locks', 'show', `:${file}`], { cwd: root, maxBuffer: maxBytes + 1 });
  return result.status === 0 ? result.stdout : null;
}

// A NUL byte in the first 8 KiB is how Git itself decides a file is binary.
const isBinary = (bytes) => bytes.subarray(0, 8192).includes(0);

export async function checkSecrets(root, { exclude = [] } = {}) {
  const skip = [...harnessDirectories, ...exclude.map((prefix) => prefix.replace(/^\.\//, ''))];
  const excluded = (file) => skip.some((prefix) => file === prefix.replace(/\/$/, '') || file.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`));
  const listed = git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean);
  const files = [...new Set(listed)].filter((file) => !excluded(file)).sort();
  const staged = changedSinceStaged(root);
  const findings = [];
  const skipped = [];
  let checked = 0;
  for (const file of files) {
    const target = path.join(root, file);
    let info = null;
    try {
      info = await lstat(target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      // Deleted in the working tree: the index may still hold the content that would be committed.
      if (!staged.has(file)) continue;
    }
    if (info && !info.isFile()) continue; // symlinks and submodule directories are not read
    if (info && info.size > maxBytes) { skipped.push(file); continue; }
    const versions = info ? [await readFile(target)] : [];
    if (staged.has(file)) {
      const blob = stagedContent(root, file);
      if (blob) versions.push(blob);
    }
    const texts = versions.filter((bytes) => !isBinary(bytes) && bytes.length <= maxBytes).map((bytes) => bytes.toString('utf8'));
    if (!texts.length) continue;
    checked++;
    const kinds = new Set(texts.flatMap((text) => secretKinds(text)));
    for (const kind of kinds) findings.push(`${file}: ${describeKind(kind)}`);
  }
  return { checked, findings, skipped };
}

function parse(args) {
  const options = { root: process.cwd(), exclude: [] };
  for (let i = 0; i < args.length; i++) {
    const value = args[i + 1];
    if ((args[i] === '--root' || args[i] === '--exclude') && value && !value.startsWith('--')) {
      if (args[i] === '--root') options.root = path.resolve(value);
      else options.exclude.push(value);
      i++;
    } else throw new Error('Usage: node check-secrets.mjs [--root DIR] [--exclude PATH_PREFIX]...');
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parse(process.argv.slice(2));
    const { checked, findings, skipped } = await checkSecrets(options.root, options);
    for (const finding of findings) console.error(finding);
    for (const file of skipped) console.error(`${file}: not checked, larger than ${maxBytes} bytes; exclude it with a reason or remove it`);
    const failed = findings.length || skipped.length;
    console.log(`secrets: ${failed ? 'FAILED' : 'passed'} (${checked} files${skipped.length ? `, ${skipped.length} not checked` : ''})`);
    process.exitCode = failed ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
