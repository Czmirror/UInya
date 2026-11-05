import { parseArgs } from './lib/cli.mjs';
import { guardWarnings } from './lib/guard.mjs';
import { assertNotExampleChecks, findDuplicateCommands, findUnfilledSteeringItems, findValidationGaps, loadProfile } from './lib/profile.mjs';

try {
  const options = parseArgs(process.argv.slice(2));
  const { root, profile } = await loadProfile(options.root, options.config);
  await assertNotExampleChecks(profile);
  for (const warning of await findUnfilledSteeringItems(root)) console.error(warning);
  for (const warning of guardWarnings(profile)) console.error(warning);
  for (const warning of findDuplicateCommands(profile)) console.error(warning);
  for (const warning of findValidationGaps(profile)) console.error(warning);
  console.log(`Profile valid: ${profile.name} (${profile.checks.length} checks); no commands executed.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
