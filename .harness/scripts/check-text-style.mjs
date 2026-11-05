// Text style check for projects that adopt the harness.
// Checks UTF-8 without BOM, LF, final newline, trailing whitespace, tabs and hidden characters
// on files Git tracks or would track. Binary files and file types it does not know are skipped,
// so .DS_Store, images and audio never reach the decoder.
//
// Usage: node .harness/scripts/check-text-style.mjs [--root DIR]
import { spawnSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTextStyle, isStyleTarget } from './lib/text-style.mjs';

function git(root, args) {
  const result = spawnSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed; run inside a Git repository`);
  return result.stdout;
}

// Files Git marks as binary or -text in .gitattributes are skipped even when the extension is known.
function binaryByAttributes(root, files) {
  if (!files.length) return new Set();
  const result = spawnSync('git', ['check-attr', '-z', '--stdin', 'binary', 'text'], {
    cwd: root, input: files.join('\0'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error('git check-attr failed');
  const parts = result.stdout.split('\0');
  const binary = new Set();
  for (let i = 0; i + 2 < parts.length; i += 3) {
    const [file, attribute, value] = [parts[i], parts[i + 1], parts[i + 2]];
    if ((attribute === 'binary' && value === 'set') || (attribute === 'text' && value === 'unset')) binary.add(file);
  }
  return binary;
}

export async function checkProject(root) {
  const listed = git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean);
  const files = [...new Set(listed)].filter(isStyleTarget).sort();
  const binary = binaryByAttributes(root, files);
  const problems = [];
  let checked = 0;
  for (const file of files) {
    if (binary.has(file)) continue;
    const target = path.join(root, file);
    let info;
    try {
      info = await lstat(target);
    } catch (error) {
      if (error.code === 'ENOENT') continue; // deleted in the working tree
      throw error;
    }
    if (!info.isFile()) continue; // symlinks and submodule directories are not read
    checked++;
    for (const issue of checkTextStyle(await readFile(target), file)) problems.push(`${file}: ${issue}`);
  }
  return { checked, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let root = process.cwd();
  if (args.length === 2 && args[0] === '--root') root = path.resolve(args[1]);
  else if (args.length) {
    console.error('Usage: node check-text-style.mjs [--root DIR]');
    process.exit(2);
  }
  try {
    const { checked, problems } = await checkProject(root);
    for (const problem of problems) console.error(problem);
    console.log(`text style: ${problems.length ? 'FAILED' : 'passed'} (${checked} files)`);
    process.exitCode = problems.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
