// Checks source/test header comments for adopters; required for new projects in supported languages.
// It only checks that a comment is there, not that it describes the file correctly; review does that
// (rules/core/comments.md). Lines a language requires first (extends, <?php, using, shebang...) are skipped.
//
// Usage: node .harness/scripts/check-file-headers.mjs [--root DIR] [--since REV] [--exclude PATH_PREFIX]...
//   --since REV     check only files added or modified since REV (plus untracked files), for gradual adoption
//   --exclude PATH  skip files under this path prefix; .harness/ is always skipped
import { spawnSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Per extension: lines that may come before the header, and what counts as a header comment.
const languages = [
  { ext: /\.(?:[cm]?js|jsx|tsx?)$/, preamble: /^(?:#!|['"]use strict['"];?$)/, comment: /^(?:\/\/|\/\*)/ },
  { ext: /\.go$/, preamble: /^\/\/go:build\b|^\/\/ \+build\b/, comment: /^\/\// },
  { ext: /\.gd$/, preamble: /^(?:@tool\b|@icon\(|extends\b|class_name\b)/, comment: /^##/ },
  { ext: /\.pyi?$/, preamble: /^#!|^#.*coding[:=]/, comment: /^(?:#|[rRuUbB]?(?:"""|'''))/ },
  { ext: /\.rs$/, preamble: /^#!\[/, comment: /^\/\/[!/]?/ },
  { ext: /\.php$/, preamble: /^(?:<\?php\b|declare\s*\()/, comment: /^(?:\/\*\*?|\/\/|#)/ },
  { ext: /\.cs$/, preamble: /^(?:using\b|namespace\b|\{$|\[)/, comment: /^\/\/\/?/ },
  { ext: /\.sql$/i, preamble: /^$/, comment: /^(?:--|\/\*)/ },
];

export function languageFor(file) {
  return languages.find((language) => language.ext.test(file)) ?? null;
}

// Returns true when the first meaningful line, after the allowed preamble, is a comment.
export function hasHeader(text, file) {
  const language = languageFor(file);
  if (!language) return true;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '') continue;
    if (language.comment.test(line) && !language.preamble.test(line)) return true;
    if (language.preamble.test(line)) continue;
    return false;
  }
  // An empty file has nothing to describe yet.
  return text.trim() === '';
}

function git(root, args) {
  const result = spawnSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed${args[0] === 'diff' ? '; check the --since revision' : '; run inside a Git repository'}`);
  return result.stdout.split('\0').filter(Boolean);
}

export async function checkHeaders(root, { since = null, exclude = [] } = {}) {
  const untracked = git(root, ['ls-files', '-z', '--others', '--exclude-standard']);
  const candidates = since
    ? [...git(root, ['diff', '-z', '--name-only', '--diff-filter=AM', since, '--']), ...untracked]
    : [...git(root, ['ls-files', '-z', '--cached']), ...untracked];
  const skip = ['.harness/', ...exclude.map((prefix) => prefix.replace(/^\.\//, ''))];
  const files = [...new Set(candidates)]
    .filter((file) => languageFor(file) && !skip.some((prefix) => file === prefix || file.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)))
    .sort();
  const missing = [];
  let checked = 0;
  for (const file of files) {
    let info;
    try {
      info = await lstat(path.join(root, file));
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (!info.isFile()) continue;
    checked++;
    if (!hasHeader(await readFile(path.join(root, file), 'utf8'), file)) missing.push(file);
  }
  return { checked, missing };
}

function parse(args) {
  const options = { root: process.cwd(), since: null, exclude: [] };
  for (let i = 0; i < args.length; i++) {
    const value = args[i + 1];
    if (!['--root', '--since', '--exclude'].includes(args[i]) || !value || value.startsWith('--')) {
      throw new Error('Usage: node check-file-headers.mjs [--root DIR] [--since REV] [--exclude PATH_PREFIX]...');
    }
    if (args[i] === '--root') options.root = path.resolve(value);
    else if (args[i] === '--since') options.since = value;
    else options.exclude.push(value);
    i++;
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parse(process.argv.slice(2));
    const { checked, missing } = await checkHeaders(options.root, options);
    for (const file of missing) console.error(`${file}: no header comment describing the file (see rules/core/comments.md)`);
    console.log(`file headers: ${missing.length ? 'FAILED' : 'passed'} (${checked} files)`);
    process.exitCode = missing.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
