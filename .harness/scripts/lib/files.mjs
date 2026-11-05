import { readdir } from 'node:fs/promises';
import path from 'node:path';

const ignored = new Set(['.git', 'node_modules', 'vendor', '.next', 'coverage', 'dist', 'build', 'Library', 'Temp', '.godot',
  '.venv', 'venv', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.tox', '.nox', 'target', 'reports']);

export async function filesUnder(root, depth = 10) {
  const files = [];
  let visited = 0;
  async function walk(directory, remaining) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (++visited > 20000) throw new Error('Scan limit exceeded; narrow the root');
      if (entry.isSymbolicLink() || ignored.has(entry.name)) continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (remaining === 0) throw new Error('Scan depth exceeded; narrow the root');
        await walk(target, remaining - 1);
      } else if (entry.isFile()) files.push(target);
    }
  }
  await walk(root, depth);
  return files.sort();
}
