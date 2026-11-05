// Reference wrapper for running Godot headless checks from .harness/project.json.
// Godot can print SCRIPT ERROR and still exit 0, or keep running after an error,
// so the exit code alone is not a pass. Copy this file into the project (for example scripts/).
//
// Usage: node scripts/run-godot.mjs [--timeout-ms N] -- <godot arguments...>
// The Godot binary is GODOT_BIN, or `godot` on PATH.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const errorPattern = /^(?:SCRIPT ERROR|ERROR|USER ERROR):/m;

// Returns { ok, reason } for one finished Godot process.
export function judgeGodotRun({ status, signal, error, stdout = '', stderr = '', timedOut = false }) {
  if (error) return { ok: false, reason: `Godot could not start: ${error.message}` };
  if (timedOut) return { ok: false, reason: 'Godot did not exit before the timeout (an error before quit() can keep it running)' };
  if (signal) return { ok: false, reason: `Godot was stopped by ${signal}` };
  const output = `${stdout}\n${stderr}`;
  const match = output.match(errorPattern);
  if (match) {
    const line = output.slice(match.index).split('\n', 1)[0];
    return { ok: false, reason: `Godot reported an error: ${line}` };
  }
  if (status !== 0) return { ok: false, reason: `Godot exited with status ${status}` };
  return { ok: true, reason: 'passed' };
}

export function parseArgs(argv) {
  let timeoutMs = 90000;
  const separator = argv.indexOf('--');
  if (separator === -1 || separator === argv.length - 1) throw new Error('Pass Godot arguments after --');
  const own = argv.slice(0, separator);
  for (let i = 0; i < own.length; i++) {
    if (own[i] === '--timeout-ms' && /^\d+$/.test(own[i + 1] ?? '') && Number(own[i + 1]) > 0) timeoutMs = Number(own[++i]);
    else throw new Error(`Unknown or invalid option: ${own[i]}`);
  }
  return { timeoutMs, godotArgs: argv.slice(separator + 1) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  const result = spawnSync(process.env.GODOT_BIN || 'godot', options.godotArgs, {
    encoding: 'utf8', timeout: options.timeoutMs, killSignal: 'SIGKILL', maxBuffer: 16 * 1024 * 1024,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  const timedOut = result.error?.code === 'ETIMEDOUT';
  const verdict = judgeGodotRun({ ...result, error: timedOut ? undefined : result.error, timedOut });
  console.error(`run-godot: ${verdict.reason}`);
  process.exit(verdict.ok ? 0 : 1);
}
