import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';

function git(root, args, allowFailure = false) {
  const result = spawnSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', ...args], {
    cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  if (result.error || result.signal) throw new Error('Cannot inspect Git state');
  if (result.status !== 0) {
    if (allowFailure) return null;
    throw new Error('Git snapshot failed; run from a Git repository root');
  }
  return result.stdout;
}

// A submodule is fingerprinted by its checked-out commit and working-tree status, not by walking its files.
// Its own checks still need a separate validation profile.
function submoduleState(directory) {
  const top = git(directory, ['rev-parse', '--show-toplevel'], true)?.trim();
  if (!top || path.resolve(top) !== path.resolve(directory)) return 'submodule:uninitialized';
  const commit = git(directory, ['rev-parse', '--verify', 'HEAD'], true)?.trim() ?? 'unborn';
  const state = git(directory, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  return `submodule:${commit}:${createHash('sha256').update(state).digest('hex')}`;
}

export async function snapshot(root) {
  if (git(root, ['rev-parse', '--show-prefix']).trim() !== '') {
    throw new Error('--root must be the Git repository root');
  }
  const head = git(root, ['rev-parse', '--verify', 'HEAD'], true)?.trim() ?? null;
  const status = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const index = git(root, ['ls-files', '--stage', '-z']);
  const files = [...new Set(git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0').filter(Boolean))].sort();
  const gitlinks = new Set(index.split('\0').filter((entry) => entry.startsWith('160000 '))
    .map((entry) => entry.slice(entry.indexOf('\t') + 1)));
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ head, status, index }));
  for (const file of files) {
    const target = path.resolve(root, file);
    const relative = path.relative(root, target);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Invalid Git path');
    hash.update(JSON.stringify(file));
    try {
      // Never follow parent symlinks to fingerprint data outside this repository.
      const components = relative.split(path.sep);
      let current = root;
      let blockedParent = false;
      for (const component of components.slice(0, -1)) {
        current = path.join(current, component);
        if ((await lstat(current)).isSymbolicLink()) { blockedParent = true; break; }
      }
      if (blockedParent) { hash.update('symlink-parent'); continue; }
      const info = await lstat(target);
      hash.update(String(info.mode));
      if (info.isSymbolicLink()) hash.update(await readlink(target));
      else if (info.isFile()) {
        if (info.size > 64 * 1024 * 1024) throw new Error(`File too large to fingerprint: ${file}`);
        const content = await readFile(target);
        hash.update(createHash('sha256').update(content).digest());
      } else if (info.isDirectory() && gitlinks.has(file)) hash.update(submoduleState(target));
      else if (info.isDirectory()) throw new Error(`Unsupported directory entry: ${file}`);
      else throw new Error(`Unsupported file type: ${file}`);
    } catch (error) {
      if (error.code === 'ENOENT') hash.update('missing');
      else throw error;
    }
  }
  return { head, dirty: status.length > 0, fingerprint: hash.digest('hex'), files: files.length };
}
