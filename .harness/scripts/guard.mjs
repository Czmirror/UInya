// Guard entry point for product hooks and the Git pre-push hook.
//   node scripts/guard.mjs check [--adapter generic|claude-code] [--root <dir>]   (operation JSON on stdin)
//   node scripts/guard.mjs pre-push <remote> <url> [--root <dir>]                (Git's pre-push stdin)
// The guard never allows: an operation it does not recognise is left to the product's own check.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { evaluate, evaluatePrePush, guardSettings } from './lib/guard.mjs';
import { loadProfile } from './lib/profile.mjs';

const usage = `Usage:
  node scripts/guard.mjs check [--adapter generic|claude-code] [--root <dir>]
  node scripts/guard.mjs pre-push <remote> <url> [--root <dir>]`;

function parse(args) {
  const options = { mode: args[0], adapter: 'generic', root: process.cwd(), positional: [] };
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--adapter' || arg === '--root') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = args[++i];
    } else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    else options.positional.push(arg);
  }
  if (!['check', 'pre-push'].includes(options.mode)) throw new Error(usage);
  if (!['generic', 'claude-code'].includes(options.adapter)) throw new Error(`Unknown adapter: ${options.adapter}`);
  return options;
}

// A missing profile means the defaults; an invalid one is an error so a typo cannot disable the guard.
async function settingsFor(root) {
  try {
    const { root: canonical, profile } = await loadProfile(root);
    return { root: canonical, settings: guardSettings(profile) };
  } catch (error) {
    if (error.code === 'ENOENT') return { root, settings: guardSettings(null) };
    throw new Error(`Guard settings unavailable: ${error.message.split('\n')[0]}`);
  }
}

const fileTools = {
  Read: 'read', NotebookRead: 'read', Grep: 'read',
  Write: 'write', Edit: 'write', MultiEdit: 'write', NotebookEdit: 'write',
};

// Claude Code PreToolUse input → the generic operation shape. null means "not a guarded tool".
function fromClaudeCode(input) {
  const tool = input?.tool_name;
  const args = input?.tool_input ?? {};
  if (tool === 'Bash') return { kind: 'command', command: args.command, cwd: input.cwd };
  const kind = fileTools[tool];
  const file = args.file_path ?? args.notebook_path ?? args.path;
  if (!kind || (tool === 'Grep' && !file)) return null;
  return { kind, path: file, cwd: input.cwd };
}

function emit(adapter, decision) {
  if (adapter === 'generic') {
    console.log(JSON.stringify(decision));
    return;
  }
  if (decision.decision === 'none') return;
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision.decision,
      permissionDecisionReason: `Harness guard (${decision.rule}): ${decision.reason}`,
    },
  }));
}

async function check(options) {
  let decision;
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    const { root, settings } = await settingsFor(options.root);
    const operation = options.adapter === 'claude-code' ? fromClaudeCode(input) : input;
    decision = operation === null ? { decision: 'none', rule: null, reason: null } : evaluate(settings, root, operation);
  } catch (error) {
    // Fail towards asking: a broken guard must not silently let operations through.
    decision = { decision: 'ask', rule: 'guard-error', reason: error.message };
  }
  emit(options.adapter, decision);
}

async function prePush(options) {
  const { root, settings } = await settingsFor(options.root);
  const lines = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  const isAncestor = (ancestor, descendant) => {
    const out = spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: root, timeout: 10000 });
    return out.status === 0 ? true : out.status === 1 ? false : null;
  };
  const problems = evaluatePrePush(settings, lines, isAncestor);
  if (problems.length) {
    for (const problem of problems) console.error(`Harness guard: ${problem}`);
    console.error('Harness guard: push blocked. A human can bypass this hook with git push --no-verify after review.');
    process.exitCode = 1;
  }
}

try {
  const options = parse(process.argv.slice(2));
  if (options.mode === 'check') await check(options);
  else await prePush(options);
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
