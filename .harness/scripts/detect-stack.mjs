import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from './lib/cli.mjs';
import { filesUnder } from './lib/files.mjs';

try {
  const { root: input } = parseArgs(process.argv.slice(2));
  const root = await realpath(input);
  const findings = new Map();
  const warnings = [];
  function add(directory, rules, evidence) {
    const relative = path.relative(root, directory).split(path.sep).join('/') || '.';
    const value = findings.get(relative) ?? { path: relative, rules: [], evidence: [] };
    value.rules = [...new Set([...value.rules, ...rules])].sort();
    value.evidence.push(path.relative(root, evidence).split(path.sep).join('/'));
    findings.set(relative, value);
  }
  for (const file of await filesUnder(root)) {
    const name = path.basename(file);
    const directory = path.dirname(file);
    if (name === 'package.json' || name === 'composer.json') {
      try {
        if ((await stat(file)).size > 1024 * 1024) throw new Error('manifest too large');
        const value = JSON.parse(await readFile(file, 'utf8'));
        const deps = name === 'package.json'
          ? { ...value.dependencies, ...value.devDependencies }
          : { ...value.require, ...value['require-dev'] };
        const rules = name === 'composer.json' ? ['php'] : [];
        if (Object.hasOwn(deps, 'typescript')) rules.push('typescript');
        if (Object.hasOwn(deps, 'next')) rules.push('nextjs', 'web');
        if (Object.hasOwn(deps, 'laravel/framework')) rules.push('laravel');
        if (rules.length) add(directory, rules, file);
      } catch (error) { warnings.push(`${path.relative(root, file)}: ${error.message}`); }
    }
    if (/^tsconfig(?:\..+)?\.json$/.test(name)) add(directory, ['typescript'], file);
    if (/^next\.config\.(js|mjs|cjs|ts)$/.test(name)) add(directory, ['nextjs', 'web'], file);
    if (/\.(?:html?|css)$/.test(name)) add(directory, ['web'], file);
    if (/\.sql$/i.test(name)) add(directory, ['sql'], file);
    if (name === 'go.mod') add(directory, ['go'], file);
    if (name === 'Cargo.toml') add(directory, ['rust'], file);
    if (['pyproject.toml', 'setup.py', 'setup.cfg', 'Pipfile'].includes(name)
      || /^requirements(?:[-.][a-zA-Z0-9_-]+)?\.txt$/.test(name)) add(directory, ['python'], file);
    if (name.endsWith('.csproj')) add(directory, ['csharp'], file);
    if (name === 'project.godot') add(directory, ['godot'], file);
    if (name === 'ProjectVersion.txt' && path.basename(directory) === 'ProjectSettings') {
      add(path.dirname(directory), ['csharp', 'unity'], file);
    }
  }
  console.log(JSON.stringify({ status: warnings.length ? 'incomplete' : 'detected',
    advisoryOnly: true, commandsExecuted: false, candidates: [...findings.values()], warnings }, null, 2));
  if (warnings.length) process.exitCode = 2;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
