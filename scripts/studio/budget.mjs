import fs from 'node:fs';

const unavailable = () => ({
  attempts: 1,
  knownTokens: 0,
  unknownUsage: true,
  runs: [{ jobId: 'unavailable', status: 'failed', usage: null }],
});
const count = (value) => Number.isSafeInteger(value) && value >= 0;

// Keep the admission stop across export without exporting arbitrary provider metadata.
export function portableBudget(file) {
  try {
    const input = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (
      !count(input.attempts) ||
      !count(input.knownTokens) ||
      typeof input.unknownUsage !== 'boolean' ||
      !Array.isArray(input.runs) ||
      input.runs.length !== input.attempts
    )
      return unavailable();
    const runs = input.runs.map(projectReceipt);
    const total = runs.reduce(
      (sum, run) => sum + (run.usage?.inputTokens ?? 0) + (run.usage?.outputTokens ?? 0),
      0,
    );
    if (total !== input.knownTokens) return unavailable();
    return {
      attempts: input.attempts,
      knownTokens: total,
      unknownUsage: input.unknownUsage || runs.some((r) => !r.usage),
      runs,
    };
  } catch {
    return unavailable();
  }
}

function projectReceipt(run) {
  if (
    !run ||
    typeof run.jobId !== 'string' ||
    !/^[\w-]{1,128}$/.test(run.jobId) ||
    !['running', 'completed', 'failed'].includes(run.status)
  )
    throw new Error('Reçu invalide.');
  const usage = run.usage;
  if (usage && (!count(usage.inputTokens) || !count(usage.outputTokens)))
    throw new Error('Consommation invalide.');
  return {
    jobId: run.jobId,
    status: run.status,
    usage: usage
      ? {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cachedInputTokens: count(usage.cachedInputTokens) ? usage.cachedInputTokens : null,
          costUSD: null,
        }
      : null,
  };
}
