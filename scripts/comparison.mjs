import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const arms = ['none', 'devmethod', 'bmad'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
/** Validate a complete matched batch, including blocked/failed runs. Never dispatch models. */
export function summarize(batch) {
  if (!batch || batch.format !== 1 || !Array.isArray(batch.runs) || !batch.runs.length) throw new Error('Expected format 1 nonempty batch');
  const { budget } = batch;
  if (!budget || !Number.isSafeInteger(budget.runs) || budget.runs < 1 || !Number.isSafeInteger(budget.tokens) || budget.tokens < 1 || !finite(budget.costUSD) || !nonempty(budget.authorization)) throw new Error('Explicit run/token/cost budget and authorization required');
  if (batch.runs.length > budget.runs) throw new Error('Run budget exceeded');
  const groups = new Map();
  const matchedKeys = ['fixtureDigest', 'promptDigest', 'hostVersion', 'model', 'toolsDigest', 'permissionsDigest', 'perRunTokens', 'perRunCostUSD', 'timeoutSeconds'];
  const digests = ['fixtureDigest', 'promptDigest', 'toolsDigest', 'permissionsDigest'];
  for (const run of batch.runs) {
    if (!run || !nonempty(run.caseId) || !Number.isSafeInteger(run.repetition) || run.repetition < 1 || !arms.includes(run.arm) || !['passed', 'failed', 'blocked', 'timeout'].includes(run.status)) throw new Error('Invalid run identity or status');
    if (!matchedKeys.every(key => ['perRunTokens', 'perRunCostUSD', 'timeoutSeconds'].includes(key) ? finite(run[key]) && (key === 'perRunCostUSD' || run[key] > 0) : nonempty(run[key])) || !digests.every(key => /^[a-f0-9]{64}$/.test(run[key]))) throw new Error('Missing pinned matched conditions');
    if (!nonempty(run.methodRevision) || !nonempty(run.wrapper) || (run.arm === 'none' && run.methodRevision !== 'none')) throw new Error('Pin method revision and invocation wrapper');
    if (!nonempty(run.evidence) || !nonempty(run.review)) throw new Error('Evidence reference and review or blocked reason required');
    for (const metric of ['tokens', 'costUSD', 'elapsedSeconds']) if (run[metric] !== null && !finite(run[metric])) throw new Error('Usage must be measured nonnegative values or null (unavailable)');
    if ((run.tokens !== null && run.tokens > run.perRunTokens) || (run.costUSD !== null && run.costUSD > run.perRunCostUSD)) throw new Error('Per-run budget exceeded');
    const key = `${run.caseId}:${run.repetition}`;
    const group = groups.get(key) ?? [];
    if (group.some(other => other.arm === run.arm)) throw new Error('Duplicate arm');
    if (group.length && matchedKeys.some(key => run[key] !== group[0][key])) throw new Error('Unmatched conditions');
    group.push(run); groups.set(key, group);
  }
  for (const group of groups.values()) if (group.length !== 3) throw new Error('Each case/repetition requires all three arms, including blocked records');
  for (const metric of ['tokens', 'costUSD']) if (batch.runs.reduce((sum, run) => sum + (run[metric] ?? 0), 0) > budget[metric]) throw new Error('Total budget exceeded');
  const cells = [];
  for (const caseId of new Set(batch.runs.map(run => run.caseId))) for (const arm of arms) {
    const runs = batch.runs.filter(run => run.caseId === caseId && run.arm === arm);
    cells.push({ caseId, arm, denominator: runs.length, ...Object.fromEntries(['passed', 'failed', 'blocked', 'timeout'].map(status => [status, runs.filter(run => run.status === status).length])) });
  }
  return { format: 1, cells, usageComplete: batch.runs.every(run => run.tokens !== null && run.costUSD !== null),
    limitation: 'Validates record consistency only. Evidence authenticity and behavioral claims require independent inspection; no aggregate superiority score.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { if (process.argv.length !== 3) throw new Error('Usage: node scripts/comparison.mjs BATCH_JSON'); console.log(JSON.stringify(summarize(JSON.parse(fs.readFileSync(process.argv[2]))), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
