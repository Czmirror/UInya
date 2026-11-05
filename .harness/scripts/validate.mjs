import { parseArgs } from './lib/cli.mjs';
import { assertNotExampleChecks, containedDirectory, loadProfile, stages } from './lib/profile.mjs';
import { runCommand } from './lib/process.mjs';
import { snapshot } from './lib/snapshot.mjs';

try {
  const options = parseArgs(process.argv.slice(2), ['--execute']);
  const { root, profile } = await loadProfile(options.root, options.config);
  await assertNotExampleChecks(profile);
  const checks = stages.flatMap((stage) => profile.checks.filter((check) => check.stage === stage));
  if (!options.execute) {
    console.log(JSON.stringify({ status: 'planned', commandsExecuted: false, checks }, null, 2));
  } else {
    const before = await snapshot(root);
    const results = [];
    let stopped = false;
    for (const check of checks) {
      if (!check.command || stopped) {
        results.push({ id: check.id, stage: check.stage, required: check.required,
          status: 'skipped', reason: stopped ? 'Earlier check failed or was blocked' : check.skipReason });
        continue;
      }
      const cwd = await containedDirectory(root, check.cwd);
      const result = await runCommand(check.command, { cwd, timeoutMs: check.timeoutMs,
        env: { ...process.env, CI: 'true', GIT_TERMINAL_PROMPT: '0' } });
      results.push({ id: check.id, stage: check.stage, required: check.required,
        command: check.command, cwd: check.cwd, ...result });
      if (result.status !== 'passed') stopped = true;
    }
    const after = await snapshot(root);
    const changed = before.fingerprint !== after.fingerprint;
    const status = changed || results.some((item) => item.status === 'blocked') ? 'blocked'
      : results.some((item) => item.status === 'failed') ? 'failed' : 'passed';
    console.log(JSON.stringify({
      version: 1, status, generatedAt: new Date().toISOString(),
      runtime: { node: process.version, platform: process.platform }, before, after,
      reason: changed ? 'Source changed during validation; review changes and rerun' : null,
      results,
    }, null, 2));
    process.exitCode = status === 'passed' ? 0 : status === 'failed' ? 1 : 2;
  }
} catch (error) {
  console.log(JSON.stringify({ version: 1, status: 'blocked', reason: error.message }, null, 2));
  process.exitCode = 2;
}
