import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { digest, text } from './records.js';
import {
  boundedFile,
  canonicalOptions,
  filesSignature,
  freezeFiles,
  inspectEvidence,
  limitations,
  type EvidenceCheck,
  type EvidenceContract,
  type EvidenceOptions,
} from './evidence-contract.js';
import { executeCheck, type EvidenceResult } from './evidence-process.js';
import {
  openEvidenceStore,
  type CriterionEvidence,
  type EvidenceAttempt,
  type EvidenceState,
} from './evidence-store.js';

export { inspectEvidence } from './evidence-contract.js';
export type { EvidenceOptions, EvidenceContract } from './evidence-contract.js';

type Plan = ReturnType<typeof inspectEvidence>;
type Store = NonNullable<ReturnType<typeof openEvidenceStore>>;

function initialState(plan: Plan): EvidenceState {
  return {
    format: 1,
    scope: plan.options,
    pending: false,
    halted: false,
    reason: null,
    maxAttempts: plan.contract.limits.maxAttempts,
    maxNoProgress: plan.contract.limits.maxNoProgress,
    revisions: [],
    attempts: [],
  };
}

function halt(state: EvidenceState, reason: string) {
  state.halted = true;
  state.reason ??= reason;
}

function stopReason(state: EvidenceState): string | null {
  if (state.halted) return state.reason ?? 'persistent-halt';
  if (state.pending) return 'interrupted-pending-attempt';
  return historyStop(state);
}

function historyStop(state: EvidenceState): string | null {
  let previous: EvidenceAttempt | undefined;
  let best = Infinity;
  let noProgress = 0;
  for (const attempt of state.attempts) {
    if (attempt.outcome === 'interrupted') return 'interrupted-attempt';
    if (attempt.signature && previous?.signature === attempt.signature)
      return 'repeated-criterion-failure';
    const remaining = attempt.criteria.filter(
      (criterion) => criterion.status !== 'supported',
    ).length;
    if (remaining < best) {
      best = remaining;
      noProgress = 0;
    } else {
      noProgress++;
    }
    if (attempt.outcome === 'supported') {
      best = Infinity;
      noProgress = 0;
    }
    if (noProgress >= state.maxNoProgress) return 'no-progress-limit';
    previous = attempt;
  }
  if (state.attempts.length >= state.maxAttempts && state.attempts.at(-1)?.outcome !== 'supported')
    return 'attempt-limit';
  return null;
}

function calibrationFailed(check: EvidenceCheck, runs: EvidenceResult[]): boolean {
  if (
    check.healthy &&
    check.criteria.some(
      (id) => runs.find((run) => run.mode === check.healthy)?.verdicts?.[id] !== 'passed',
    )
  )
    return true;
  // A fault can affect correlated behaviors; only its declared target must fail.
  return check.faults.some(
    (fault) => runs.find((run) => run.mode === fault.id)?.verdicts?.[fault.target] !== 'failed',
  );
}

function criterionResult(
  id: string,
  checks: EvidenceCheck[],
  results: EvidenceResult[],
): CriterionEvidence {
  const covering = checks.filter((check) => check.criteria.includes(id));
  if (!covering.length) return { id, status: 'unchallenged' };
  let unchallenged = false;
  let failed = false;
  let invalidCalibration = false;
  for (const check of covering) {
    const runs = results.filter((result) => result.check === check.id);
    if (
      runs.some(
        (result) =>
          result.status === 'interrupted' ||
          (result.status === 'not-run' && result.reason !== 'calibration-failed'),
      )
    )
      return { id, status: 'interrupted' };
    const candidate = runs.find((result) => result.mode === 'candidate');
    failed ||= candidate?.verdicts?.[id] !== 'passed';
    const faults = check.faults.filter((fault) => fault.target === id);
    unchallenged ||= !check.healthy || faults.length === 0;
    invalidCalibration ||= calibrationFailed(check, runs);
  }
  if (invalidCalibration) return { id, status: 'calibration-failed' };
  if (failed) return { id, status: 'failed' };
  return { id, status: unchallenged ? 'unchallenged' : 'supported' };
}

function resultReport(
  state: EvidenceState | null,
  contract: EvidenceContract | null,
  status: string,
  fresh: boolean,
  reason: string | null = null,
) {
  const last = state?.attempts.at(-1);
  const criteria =
    contract?.criteria.map(({ id }) => ({
      id,
      status:
        status === 'stale'
          ? 'stale'
          : (last?.criteria.find((criterion) => criterion.id === id)?.status ?? 'not-run'),
    })) ??
    last?.criteria ??
    [];
  return {
    format: 1,
    status,
    fresh,
    reason: state?.reason ?? reason,
    attempts: state?.attempts.length ?? 0,
    permit: last?.permit ?? null,
    failureSignature: last?.signature ?? null,
    candidateBefore: last?.before ?? null,
    candidateAfter: last?.after ?? null,
    criteria,
    results: last?.results ?? [],
    revisions: state?.revisions.length ?? 0,
    startedAt: last?.startedAt ?? null,
    durationMs: last?.durationMs ?? null,
    modelTokens: null,
    modelCost: null,
    limitations,
  };
}

function currentReport(state: EvidenceState, plan: Plan) {
  const last = state.attempts.at(-1);
  const current = filesSignature(freezeFiles(plan.options.root, plan.contract.candidateInputs));
  const fresh =
    !state.halted &&
    !state.pending &&
    last?.permit === plan.permit &&
    last.before === current &&
    last.after === current;
  const status = state.halted ? 'halted' : !last ? 'not-run' : fresh ? last.outcome : 'stale';
  return resultReport(state, plan.contract, status, fresh);
}

export function evidenceStatus(raw: EvidenceOptions & { session: string }) {
  // Scope validation precedes state access; halted sessions never execute evaluator code.
  const options = {
    root: path.resolve(raw.root),
    evaluatorRoot: path.resolve(raw.evaluatorRoot),
    contractPath: path.resolve(raw.contractPath),
  };
  const store = openEvidenceStore(options, raw.session, false);
  if (!store) return resultReport(null, inspectEvidence(options).contract, 'not-run', false);
  try {
    const state = store.state;
    if (!state) return resultReport(null, null, 'not-run', false);
    const reason = stopReason(state);
    if (reason) {
      halt(state, reason);
      store.save(state);
      return resultReport(state, null, 'halted', false);
    }
    try {
      return currentReport(state, inspectEvidence(options));
    } catch {
      return resultReport(state, null, 'stale', false, 'current-inputs-unreadable-or-invalid');
    }
  } finally {
    store.close();
  }
}

async function evaluate(plan: Plan, started: number): Promise<EvidenceResult[]> {
  const results: EvidenceResult[] = plan.invocations.map(({ check, mode }) => ({
    check,
    mode,
    status: 'not-run',
  }));
  for (let index = 0; index < results.length; index++) {
    const result = results[index]!;
    const remaining = plan.contract.limits.attemptTimeoutMs - (performance.now() - started);
    if (remaining <= 0) {
      results[index] = { ...result, status: 'interrupted', reason: 'attempt-timeout' };
      break;
    }
    const check = plan.contract.checks.find((check) => check.id === result.check)!;
    if (
      result.mode === 'candidate' &&
      calibrationFailed(
        check,
        results.filter((run) => run.check === check.id),
      )
    ) {
      results[index] = { ...result, reason: 'calibration-failed' };
      continue;
    }
    results[index] = await executeCheck({
      ...plan.options,
      check,
      mode: result.mode,
      timeoutMs: Math.min(remaining, plan.contract.limits.childTimeoutMs),
      maxOutputBytes: plan.contract.limits.maxOutputBytes,
    });
    if (results[index]!.status === 'interrupted') break;
  }
  return results;
}

function recordOutcome(
  plan: Plan,
  results: EvidenceResult[],
  started: number,
  startedAt: string,
  before: string,
  notes: { diagnosis?: string; adjustment?: string },
): EvidenceAttempt {
  const criteria = plan.contract.criteria.map(({ id }) =>
    criterionResult(id, plan.contract.checks, results),
  );
  const interrupted = results.some((result) => result.status === 'interrupted');
  const failures = criteria.filter((criterion) =>
    ['failed', 'calibration-failed'].includes(criterion.status),
  );
  const outcome = interrupted
    ? 'interrupted'
    : failures.length
      ? 'failed'
      : criteria.every((criterion) => criterion.status === 'supported')
        ? 'supported'
        : 'unchallenged';
  const signature =
    outcome === 'failed'
      ? digest(
          JSON.stringify(
            failures.map(({ id, status }) => [id, status]).sort(([a], [b]) => a!.localeCompare(b!)),
          ),
        )
      : null;
  return {
    startedAt,
    durationMs: performance.now() - started,
    outcome,
    permit: plan.permit,
    before,
    after: null,
    signature,
    criteria,
    results,
    diagnosis: notes.diagnosis ?? null,
    adjustment: notes.adjustment ?? null,
  };
}

function verifyAfter(plan: Plan, attempt: EvidenceAttempt, state: EvidenceState) {
  try {
    attempt.after = filesSignature(freezeFiles(plan.options.root, plan.contract.candidateInputs));
    if (attempt.before !== attempt.after || inspectEvidence(plan.options).permit !== plan.permit)
      halt(state, 'declared-inputs-changed-during-attempt');
  } catch {
    halt(state, 'declared-inputs-unreadable-after-attempt');
  }
}

async function attemptRun(
  plan: Plan,
  state: EvidenceState,
  store: Store,
  notes: { diagnosis?: string; adjustment?: string },
) {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const candidate = freezeFiles(plan.options.root, plan.contract.candidateInputs);
  const evaluator = freezeFiles(plan.options.evaluatorRoot, plan.contract.evaluatorFiles);
  const contract = boundedFile(plan.options.contractPath, 1024 * 1024).toString('base64');
  if (
    [...candidate, ...evaluator].reduce(
      (total, file) => total + Buffer.byteLength(file.bytes, 'base64'),
      0,
    ) >
    32 * 1024 * 1024
  )
    throw new Error('Combined declared bytes exceed 32 MiB.');
  if (inspectEvidence(plan.options).permit !== plan.permit)
    throw new Error('Permit changed before execution.');
  if (state.revisions.at(-1)?.permit !== plan.permit)
    state.revisions.push({
      permit: plan.permit,
      contractSha256: plan.contractSha256,
      adoptedAt: new Date().toISOString(),
    });
  state.maxAttempts = Math.min(state.maxAttempts, plan.contract.limits.maxAttempts);
  state.maxNoProgress = Math.min(state.maxNoProgress, plan.contract.limits.maxNoProgress);
  state.pending = true;
  store.save(state);
  store.freeze(state.attempts.length + 1, {
    candidate,
    evaluator,
    contract,
    permit: plan.permit,
    engine: plan.engine,
  });
  const results = await evaluate(plan, started);
  const attempt = recordOutcome(
    plan,
    results,
    started,
    startedAt,
    filesSignature(candidate),
    notes,
  );
  verifyAfter(plan, attempt, state);
  attempt.durationMs = performance.now() - started;
  if (attempt.durationMs > plan.contract.limits.attemptTimeoutMs) halt(state, 'attempt-timeout');
  state.attempts.push(attempt);
  state.pending = false;
  const reason = stopReason(state);
  if (reason) halt(state, reason);
  store.save(state);
  return resultReport(
    state,
    plan.contract,
    state.halted ? 'halted' : attempt.outcome,
    !state.halted && attempt.before === attempt.after,
  );
}

export async function runEvidence(
  raw: EvidenceOptions & {
    session: string;
    permit: string;
    diagnosis?: string;
    adjustment?: string;
  },
) {
  const options = {
    root: path.resolve(raw.root),
    evaluatorRoot: path.resolve(raw.evaluatorRoot),
    contractPath: path.resolve(raw.contractPath),
  };
  const store = openEvidenceStore(options, raw.session, true)!;
  try {
    const existing = store.state;
    if (existing) {
      const reason = stopReason(existing);
      if (reason) {
        halt(existing, reason);
        store.save(existing);
        return resultReport(existing, null, 'halted', false);
      }
    }
    const plan = inspectEvidence(canonicalOptions(options));
    if (raw.permit !== plan.permit)
      throw new Error('Explicit current execution permit required. Run evidence plan first.');
    if (
      (raw.diagnosis !== undefined && !text(raw.diagnosis)) ||
      (raw.adjustment !== undefined && !text(raw.adjustment))
    )
      throw new Error('Diagnosis and adjustment must be nonempty bounded text.');
    if (!plan.executionSupported)
      throw new Error('Execution requires the POSIX process-group profile.');
    const state = existing ?? initialState(plan);
    if (state.attempts.length >= Math.min(state.maxAttempts, plan.contract.limits.maxAttempts)) {
      halt(state, 'attempt-limit');
      store.save(state);
      return resultReport(state, plan.contract, 'halted', false);
    }
    if (
      state.attempts.at(-1) &&
      state.attempts.at(-1)!.outcome !== 'supported' &&
      (!text(raw.diagnosis) || !text(raw.adjustment))
    )
      throw new Error('Retry requires diagnosis and adjustment.');
    return await attemptRun(plan, state, store, raw);
  } finally {
    store.close();
  }
}
