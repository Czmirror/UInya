// Loads .harness/project.json and checks it against schemas/project.schema.json plus rules the
// schema cannot express (contained paths, at least one executable required check).
// Also holds the refusal validate-config.mjs and validate.mjs apply before running (unchanged example
// checks) and the warnings validate-config.mjs prints: unfilled AGENTS.md and steering example values,
// duplicate commands and validation gaps (example skip reasons left in place, no text style check).
// Reads files only; it never runs a check command.
import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const stages = ['lint', 'format', 'typecheck', 'test', 'build', 'security'];
const schemaUrl = new URL('../../schemas/project.schema.json', import.meta.url);
const keywords = new Set([
  '$schema', '$id', 'title', 'type', 'additionalProperties', 'required', 'properties',
  'const', 'enum', 'minLength', 'pattern', 'items', 'minItems', 'uniqueItems', 'minimum', 'maximum',
]);

// Intentionally implements only the keywords used by the bundled schema.
// Unknown keywords fail closed so a schema change cannot silently weaken checks.
function assertSupportedSchema(schema) {
  for (const key of Object.keys(schema)) {
    if (!keywords.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
  }
  for (const child of Object.values(schema.properties ?? {})) assertSupportedSchema(child);
  if (schema.items) assertSupportedSchema(schema.items);
}

export function validateSchema(value, schema, location = '$') {
  if (location === '$') assertSupportedSchema(schema);
  const errors = [];
  const error = (message) => errors.push(`${location}: ${message}`);
  const type = schema.type;
  const matches = type === undefined
    || (type === 'object' && value !== null && typeof value === 'object' && !Array.isArray(value))
    || (type === 'array' && Array.isArray(value))
    || (type === 'integer' && Number.isSafeInteger(value))
    || (type === 'string' && typeof value === 'string')
    || (type === 'boolean' && typeof value === 'boolean');
  if (!matches) return [`${location}: expected ${type}`];
  if ('const' in schema && value !== schema.const) error('unexpected constant');
  if (schema.enum && !schema.enum.includes(value)) error('unsupported value');
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) error('string is empty');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) error('invalid format');
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) error('below minimum');
    if (schema.maximum !== undefined && value > schema.maximum) error('above maximum');
  }
  if (type === 'object') {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) error(`missing ${key}`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(schema.properties ?? {}, key)) {
        errors.push(...validateSchema(child, schema.properties[key], `${location}.${key}`));
      } else if (schema.additionalProperties === false) error(`unknown property ${key}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) error('too few items');
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      error('duplicate items');
    }
    for (const [index, item] of value.entries()) {
      errors.push(...validateSchema(item, schema.items ?? {}, `${location}[${index}]`));
    }
  }
  return errors;
}

export function relativePath(value) {
  return typeof value === 'string' && value.length > 0
    && !value.includes('\0') && !value.includes('\\')
    && !path.posix.isAbsolute(value) && !/^[a-z]:/i.test(value)
    && !value.split('/').includes('..');
}

export async function containedDirectory(root, relative) {
  if (!relativePath(relative)) throw new Error(`Unsafe relative directory: ${relative}`);
  const resolved = await realpath(path.resolve(root, relative));
  const rel = path.relative(root, resolved);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Directory escapes project: ${relative}`);
  }
  if (!(await stat(resolved)).isDirectory()) throw new Error(`Not a directory: ${relative}`);
  return resolved;
}

export async function loadProfile(root, configPath = '.harness/project.json') {
  const canonicalRoot = await realpath(root);
  if (!relativePath(configPath)) throw new Error('Config must be a repository-relative path');
  const resolvedConfig = await realpath(path.resolve(canonicalRoot, configPath));
  const rel = path.relative(canonicalRoot, resolvedConfig);
  if (rel.startsWith(`..${path.sep}`) || rel === '..' || path.isAbsolute(rel)) {
    throw new Error('Config escapes project');
  }
  const profile = JSON.parse(await readFile(resolvedConfig, 'utf8'));
  const schema = JSON.parse(await readFile(schemaUrl, 'utf8'));
  const errors = validateSchema(profile, schema);
  if (errors.length) throw new Error(errors.join('\n'));
  const ids = new Set();
  for (const check of profile.checks) {
    if (ids.has(check.id)) throw new Error(`Duplicate check id: ${check.id}`);
    ids.add(check.id);
    if (check.command) {
      if ('skipReason' in check) throw new Error(`${check.id}: command and skipReason conflict`);
      if (!check.command[0].trim() || check.command[0].startsWith('-')
        || check.command.some((part) => part.includes('\0') || /[\r\n]/.test(part))) {
        throw new Error(`${check.id}: invalid command`);
      }
      if (!check.cwd || !check.timeoutMs) throw new Error(`${check.id}: cwd and timeoutMs required`);
      await containedDirectory(canonicalRoot, check.cwd);
    } else if (check.required || !check.skipReason?.trim() || 'cwd' in check || 'timeoutMs' in check) {
      throw new Error(`${check.id}: skipped checks need required=false and a reason, without execution fields`);
    }
  }
  if (!profile.checks.some((check) => check.required && check.command)) {
    throw new Error('At least one executable required check is needed');
  }
  for (const stage of stages) {
    if (!profile.checks.some((check) => check.stage === stage)) throw new Error(`Missing stage: ${stage}`);
  }
  for (const stack of profile.stacks) await containedDirectory(canonicalRoot, stack.path);
  for (const entry of profile.guard?.protectedPaths ?? []) {
    if (!relativePath(entry.replace(/\/$/, ''))) throw new Error(`guard.protectedPaths entry is not repository-relative: ${entry}`);
  }
  return { root: canonicalRoot, profile };
}

// bootstrap-project.mjs copies examples/minimal, whose checks are placeholders for another project.
// Left unchanged they can pass without checking this project, so the CLIs refuse them.
// Only examples/minimal is compared: examples/nextjs holds real npm scripts a project may legitimately reuse.
// The comparison ignores check order and the bootstrap-resolved paths of the bundled check scripts.
// Neither reordering nor placing the harness in a different submodule directory replaces placeholder checks.
// loadProfile itself does not check this, because check-harness.mjs validates the examples with it.
const bundledCheckScripts = { 'source-headers': 'check-file-headers.mjs', 'text-style': 'check-text-style.mjs', secrets: 'check-secrets.mjs' };

export async function assertNotExampleChecks(profile) {
  let example;
  try {
    example = JSON.parse(await readFile(new URL('../../examples/minimal/project.json', import.meta.url), 'utf8'));
  } catch (error) {
    // The copy-based adoption does not copy examples/, so there is nothing to compare with.
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const byId = (checks) => checks.map((check) => {
    // Only normalize the bundled check script paths, not arbitrary project commands or other arguments.
    const script = bundledCheckScripts[check.id];
    if (script && check.command?.[1]?.endsWith(`/scripts/${script}`)) {
      return { ...check, command: [check.command[0], `.harness/scripts/${script}`, ...check.command.slice(2)] };
    }
    return check;
  }).sort((a, b) => a.id.localeCompare(b.id));
  if (isDeepStrictEqual(byId(profile.checks), byId(example.checks))) {
    throw new Error('Checks are unchanged from examples/minimal/project.json; replace them with this project\'s real commands');
  }
}

// bootstrap-project.mjs writes example values on the language and toolchain lines of the steering files.
// Projects bootstrapped before steering existed have the same lines in AGENTS.md, so both are checked.
// Unfilled values are only reported (a warning, not a failure) so existing adopters keep working.
const placeholderFiles = ['AGENTS.md', '.harness/steering/policy.md', '.harness/steering/tech.md'];
const placeholders = [
  { label: 'Issue/PR language', line: 'Issue・PRのタイトル・本文・コメントの言語:', example: '（例: 日本語）' },
  { label: 'commit message language', line: 'commitメッセージの言語:', example: '（例: 英語）' },
  { label: 'code comment language', line: 'コードコメントの言語:', example: '（例: 日本語）' },
  { label: 'engine and toolchain versions', line: '使用するエンジン・toolchainとversion:', example: '（例: Godot 4.5.1、Node.js 22）' },
];

export async function findUnfilledSteeringItems(root) {
  const warnings = [];
  for (const name of placeholderFiles) {
    const file = path.join(root, name);
    let info;
    try {
      // lstat only checks the last component, so a symlinked parent (.harness/steering -> elsewhere)
      // is rejected here instead of being followed outside the root.
      let current = root;
      for (const component of name.split('/').slice(0, -1)) {
        current = path.join(current, component);
        if (!(await lstat(current)).isDirectory()) throw Object.assign(new Error('not a directory'), { code: 'NOTDIR' });
      }
      info = await lstat(file);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      if (error.code === 'NOTDIR') {
        warnings.push(`Warning: a parent of ${name} is not a regular directory; skipped the placeholder check`);
        continue;
      }
      throw error;
    }
    // A directory, FIFO or symlink would turn this warning-only check into a failure or a hang.
    if (!info.isFile()) {
      warnings.push(`Warning: ${name} is not a regular file; skipped the placeholder check`);
      continue;
    }
    const lines = (await readFile(file, 'utf8')).split('\n');
    warnings.push(...placeholders
      .filter(({ line, example }) => lines.some((item) => item.includes(line) && item.includes(example)))
      .map(({ label }) => `Warning: ${name} still has the example value for the ${label}; write the project's choice`));
  }
  return warnings;
}

// Two checks running the same command in the same directory run one verification but are
// counted (and reported as passed) twice. Warn instead of failing: an existing profile may
// rely on it, and the fix is a human choice between removing one and adding a real check.
export function findDuplicateCommands(profile) {
  const seen = new Map();
  const warnings = [];
  for (const check of profile.checks) {
    if (!check.command) continue;
    const key = JSON.stringify([check.cwd, check.command]);
    const first = seen.get(key);
    if (first) {
      warnings.push(`Warning: checks "${first.id}" (${first.stage}) and "${check.id}" (${check.stage}) run the same command; `
        + 'it is one verification, not two. Remove one, use a real tool, or mark a stage skipped with a reason');
    } else seen.set(key, check);
  }
  return warnings;
}

// Validation gaps the AI should propose fixing (rules/core/quality.md, "検証の穴"). Warnings only:
// existing profiles keep working, and whether to add a check is a human decision.
// The examples mark placeholder skips with this prefix; a project writes its own reason instead.
const exampleSkipPrefix = 'Example only:';

export function findValidationGaps(profile) {
  const warnings = profile.checks
    .filter((check) => check.skipReason?.startsWith(exampleSkipPrefix))
    .map((check) => `Warning: check "${check.id}" (${check.stage}) still has the example skip reason; `
      + 'configure the project\'s command or write why it does not apply');
  // A check with the id text-style counts even when skipped, so a project that checks encoding
  // with another tool can record that once instead of seeing this warning every time.
  const textStyle = profile.checks.some((check) => check.id === 'text-style'
    || check.command?.some((part) => part.includes('check-text-style')));
  if (!textStyle) {
    warnings.push('Warning: no text style check (UTF-8 without BOM, LF); add check-text-style.mjs as a format check, '
      + 'or a skipped check with the id "text-style" that names the tool doing it (rules/core/coding-style.md)');
  }
  return warnings;
}
