import { AGENTS, DEFAULT_MAX_ITERATIONS, DEFAULT_WORKSPACE } from './config.js';
import { error } from './logger.js';
import { runAgents } from './agent.js';

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function numberFlag(name: string, fallback: number): number {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const value = Number(arg.split('=')[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function main(): Promise<void> {
  const dryRun = hasFlag('--dry-run');
  const limit = numberFlag('agents', AGENTS.length);
  const maxIterations = numberFlag('iterations', DEFAULT_MAX_ITERATIONS);
  const selectedAgents = AGENTS.slice(0, limit);

  await runAgents(selectedAgents, DEFAULT_WORKSPACE, { dryRun, maxIterations });
}

main().catch((err) => {
  error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
