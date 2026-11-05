import { spawn } from 'node:child_process';

const maxCapture = 4 * 1024 * 1024;

// Runs a command without a shell, writes its output to stderr, and stops the whole
// process group on timeout or interrupt (POSIX). Optional input is written to stdin.
export function runCommand(command, { cwd, timeoutMs, env, input, captureStdout = false }) {
  return new Promise((resolve) => {
    const started = Date.now();
    let timedOut = false;
    let interrupted = false;
    let settled = false;
    let killTimer;
    const grouped = process.platform !== 'win32';
    const child = spawn(command[0], command.slice(1), {
      cwd, shell: false, detached: grouped, stdio: [input === undefined ? 'ignore' : 'pipe', captureStdout ? 'pipe' : 2, 2], env,
    });
    let stdout = '';
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { if (stdout.length < maxCapture) stdout += chunk; });
    if (input !== undefined) {
      child.stdin.on('error', () => {});
      child.stdin.end(input);
    }
    const signal = (name) => {
      try { if (grouped && child.pid) process.kill(-child.pid, name); else child.kill(name); }
      catch (error) { if (error.code !== 'ESRCH') console.error(`Process cleanup: ${error.code}`); }
    };
    const interrupt = () => { interrupted = true; signal('SIGKILL'); };
    process.on('SIGINT', interrupt);
    process.on('SIGTERM', interrupt);
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', interrupt);
      resolve({ ...result, durationMs: Date.now() - started, ...(captureStdout ? { stdout } : {}) });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      signal('SIGTERM');
      killTimer = setTimeout(() => signal('SIGKILL'), 500);
    }, timeoutMs);
    child.on('error', (error) => finish({ status: 'blocked', reason: `Cannot start command: ${error.code}`, exitCode: null }));
    child.on('close', (code, childSignal) => {
      // Clean up ordinary descendants even when their parent exits first.
      if (grouped) signal('SIGKILL');
      finish({
        status: interrupted || timedOut || childSignal || code !== 0 ? 'failed' : 'passed',
        reason: interrupted ? 'interrupted' : timedOut ? 'timeout' : childSignal ? `signal: ${childSignal}` : null,
        exitCode: code,
      });
    });
  });
}
