import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const arms = ['none', 'devmethod', 'bmad'];
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const finite = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const matchedKeys = [
  'fixtureDigest',
  'promptDigest',
  'hostVersion',
  'model',
  'toolsDigest',
  'permissionsDigest',
  'perRunTokens',
  'perRunCostUSD',
  'timeoutSeconds',
];
const digests = ['fixtureDigest', 'promptDigest', 'toolsDigest', 'permissionsDigest'];
const matchedLimits = ['perRunTokens', 'perRunCostUSD', 'timeoutSeconds'];
const statuses = ['passed', 'failed', 'blocked', 'timeout'];

function validateBatch(batch) {
  if (!batch || batch.format !== 1 || !Array.isArray(batch.runs) || !batch.runs.length)
    throw new Error('Expected format 1 nonempty batch');
  const { budget } = batch;
  if (
    !budget ||
    !Number.isSafeInteger(budget.runs) ||
    budget.runs < 1 ||
    !Number.isSafeInteger(budget.tokens) ||
    budget.tokens < 1 ||
    !finite(budget.costUSD) ||
    !nonempty(budget.authorization)
  )
    throw new Error('Explicit run/token/cost budget and authorization required');
  if (batch.runs.length > budget.runs) throw new Error('Run budget exceeded');
}

function validMatchedCondition(run, key) {
  if (matchedLimits.includes(key))
    return finite(run[key]) && (key === 'perRunCostUSD' || run[key] > 0);
  return nonempty(run[key]);
}

function validateRun(run) {
  if (
    !run ||
    !nonempty(run.caseId) ||
    !Number.isSafeInteger(run.repetition) ||
    run.repetition < 1 ||
    !arms.includes(run.arm) ||
    !statuses.includes(run.status)
  )
    throw new Error('Invalid run identity or status');
  if (
    !matchedKeys.every((key) => validMatchedCondition(run, key)) ||
    !digests.every((key) => /^[a-f0-9]{64}$/.test(run[key]))
  )
    throw new Error('Missing pinned matched conditions');
  if (
    !nonempty(run.methodRevision) ||
    !nonempty(run.wrapper) ||
    (run.arm === 'none' && run.methodRevision !== 'none')
  )
    throw new Error('Pin method revision and invocation wrapper');
  if (!nonempty(run.evidence) || !nonempty(run.review))
    throw new Error('Evidence reference and review or blocked reason required');
  validateRunUsage(run);
}

function validateRunUsage(run) {
  for (const metric of ['tokens', 'costUSD', 'elapsedSeconds']) {
    if (run[metric] !== null && !finite(run[metric]))
      throw new Error('Usage must be measured nonnegative values or null (unavailable)');
  }
  if (
    (run.tokens !== null && run.tokens > run.perRunTokens) ||
    (run.costUSD !== null && run.costUSD > run.perRunCostUSD)
  )
    throw new Error('Per-run budget exceeded');
}

function groupMatchedRuns(runs) {
  const groups = new Map();
  for (const run of runs) {
    validateRun(run);
    const key = `${run.caseId}:${run.repetition}`;
    const group = groups.get(key) ?? [];
    if (group.some((other) => other.arm === run.arm)) throw new Error('Duplicate arm');
    if (group.length && matchedKeys.some((key) => run[key] !== group[0][key]))
      throw new Error('Unmatched conditions');
    group.push(run);
    groups.set(key, group);
  }
  return groups;
}

function validateBatchCompletion(batch, groups) {
  for (const group of groups.values()) {
    if (group.length !== 3)
      throw new Error('Each case/repetition requires all three arms, including blocked records');
  }
  for (const metric of ['tokens', 'costUSD']) {
    if (batch.runs.reduce((sum, run) => sum + (run[metric] ?? 0), 0) > batch.budget[metric])
      throw new Error('Total budget exceeded');
  }
}

function summarizeCells(runs) {
  const cells = [];
  for (const caseId of new Set(runs.map((run) => run.caseId))) {
    for (const arm of arms) {
      const matching = runs.filter((run) => run.caseId === caseId && run.arm === arm);
      cells.push({
        caseId,
        arm,
        denominator: matching.length,
        ...Object.fromEntries(
          statuses.map((status) => [
            status,
            matching.filter((run) => run.status === status).length,
          ]),
        ),
      });
    }
  }
  return cells;
}

/** Validate a complete matched batch, including blocked/failed runs. Never dispatch models. */
export function summarize(batch) {
  validateBatch(batch);
  const groups = groupMatchedRuns(batch.runs);
  validateBatchCompletion(batch, groups);
  return {
    format: 1,
    cells: summarizeCells(batch.runs),
    usageComplete: batch.runs.every((run) => run.tokens !== null && run.costUSD !== null),
    limitation:
      'Validates record consistency only. Evidence authenticity and behavioral claims require independent inspection; no aggregate superiority score.',
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/comparison.mjs BATCH_JSON');
    console.log(JSON.stringify(summarize(JSON.parse(fs.readFileSync(process.argv[2]))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
