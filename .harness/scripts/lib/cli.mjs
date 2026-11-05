export function parseArgs(args, extra = []) {
  const result = { root: process.cwd(), config: '.harness/project.json', execute: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--root' || arg === '--config') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
      result[arg.slice(2)] = args[++i];
    } else if (extra.includes(arg)) result[arg.slice(2)] = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return result;
}
