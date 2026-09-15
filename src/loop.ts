import { object, text, id } from './records.js';

interface Attempt {
  number: number;
  outcome: 'passed' | 'failed' | 'blocked' | 'interrupted';
  observation: string;
  diagnosis: string | null;
  adjustment: string | null;
  evidenceIds: string[];
  progress: boolean;
  durationMs: number | null;
  tokens: number | null;
}
interface Loop {
  format: 1;
  missionId: string;
  state: 'active' | 'complete' | 'blocked' | 'interrupted' | 'limit-reached' | 'abandoned';
  nextAction: string | null;
  stopReason: string | null;
  limits: {
    maxAttempts: number;
    maxConsecutiveNoProgress: number;
    maxDurationMs: number | null;
    maxObservedTokens: number | null;
  };
  attempts: Attempt[];
}
interface ObservedUsage {
  known: number;
  total: number | null;
}
interface History {
  findings: string[];
  noProgress: number;
  durationMs: ObservedUsage;
  tokens: ObservedUsage;
}

const count = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const positive = (value: unknown): value is number => count(value) && value > 0;
const optionalText = (value: unknown) => value === null || text(value);
const optionalCount = (value: unknown) => value === null || count(value);
const optionalLimit = (value: unknown) => value === null || positive(value);
const enumValue = (value: unknown, values: string[]) =>
  typeof value === 'string' && values.includes(value);

function validLimits(value: unknown): value is Loop['limits'] {
  return (
    object(value) &&
    positive(value.maxAttempts) &&
    value.maxAttempts <= 100 &&
    positive(value.maxConsecutiveNoProgress) &&
    value.maxConsecutiveNoProgress <= value.maxAttempts &&
    optionalLimit(value.maxDurationMs) &&
    optionalLimit(value.maxObservedTokens)
  );
}

function validEvidenceIds(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 128 &&
    value.every(id) &&
    new Set(value).size === value.length
  );
}

function validAttempt(value: unknown, index: number): value is Attempt {
  return (
    object(value) &&
    value.number === index + 1 &&
    enumValue(value.outcome, ['passed', 'failed', 'blocked', 'interrupted']) &&
    text(value.observation) &&
    optionalText(value.diagnosis) &&
    optionalText(value.adjustment) &&
    typeof value.progress === 'boolean' &&
    optionalCount(value.durationMs) &&
    optionalCount(value.tokens) &&
    validEvidenceIds(value.evidenceIds) &&
    (value.outcome !== 'passed' || value.evidenceIds.length > 0)
  );
}

function validActions(loop: Loop): boolean {
  if (loop.state === 'active') return text(loop.nextAction) && loop.stopReason === null;
  if (!text(loop.stopReason)) return false;
  return !['complete', 'abandoned'].includes(loop.state) || loop.nextAction === null;
}

function validateLoop(input: unknown): Loop {
  if (
    !object(input) ||
    input.format !== 1 ||
    !id(input.missionId) ||
    !enumValue(input.state, [
      'active',
      'complete',
      'blocked',
      'interrupted',
      'limit-reached',
      'abandoned',
    ]) ||
    !optionalText(input.nextAction) ||
    !optionalText(input.stopReason) ||
    !validLimits(input.limits) ||
    !Array.isArray(input.attempts) ||
    input.attempts.length > 100
  )
    throw new Error(
      'Expected bounded loop format 1 with explicit state, limits and at most 100 attempts.',
    );
  const loop = input as unknown as Loop;
  if (!validActions(loop))
    throw new Error(
      'Active loop needs nextAction and null stopReason; stopped loop needs a reason; complete/abandoned have no next action.',
    );
  for (const [index, attempt] of input.attempts.entries()) {
    if (!validAttempt(attempt, index))
      throw new Error(
        'Attempts require contiguous numbers, observations, explicit usage (null when unknown), progress and evidence IDs for passing claims.',
      );
  }
  return loop;
}

function observeUsage(previous: ObservedUsage, value: number | null): ObservedUsage {
  // Nonnegative known observations remain lower bounds when the full total is unknown.
  const known = previous.known + (value ?? 0);
  if (!Number.isSafeInteger(known)) throw new Error('Usage total exceeds safe integer range.');
  return { known, total: previous.total === null || value === null ? null : known };
}

const reachedUsageLimit = (usage: ObservedUsage, limit: number | null) =>
  limit !== null && usage.known >= limit;
const needsDiagnosis = (attempt: Attempt) => !attempt.diagnosis || !attempt.adjustment;

function unknownBoundedUsage(limits: Loop['limits'], history: History): boolean {
  return (
    (limits.maxDurationMs !== null && history.durationMs.total === null) ||
    (limits.maxObservedTokens !== null && history.tokens.total === null)
  );
}

function inspectPrefix(loop: Loop, index: number, history: History): void {
  if (index === 0) return;
  const current = loop.attempts[index]!;
  const afterLimit =
    index >= loop.limits.maxAttempts ||
    history.noProgress >= loop.limits.maxConsecutiveNoProgress ||
    reachedUsageLimit(history.durationMs, loop.limits.maxDurationMs) ||
    reachedUsageLimit(history.tokens, loop.limits.maxObservedTokens);
  if (afterLimit) history.findings.push(`attempt-${current.number}-after-limit`);
  if (unknownBoundedUsage(loop.limits, history) && needsDiagnosis(current))
    history.findings.push(`attempt-${current.number}-unknown-usage-not-reconciled`);
}

function retryFindings(attempts: Attempt[]): string[] {
  const findings: string[] = [];
  for (let index = 1; index < attempts.length; index++) {
    const previous = attempts[index - 1]!;
    const current = attempts[index]!;
    if (!needsDiagnosis(current)) continue;
    if (previous.outcome === 'failed')
      findings.push(`attempt-${current.number}-retry-without-diagnosis`);
    if (['blocked', 'interrupted'].includes(previous.outcome))
      findings.push(`attempt-${current.number}-reconciliation-missing`);
  }
  return findings;
}

function inspectHistory(loop: Loop): History {
  const history: History = {
    findings: [],
    noProgress: 0,
    durationMs: { known: 0, total: 0 },
    tokens: { known: 0, total: 0 },
  };
  for (const [index, attempt] of loop.attempts.entries()) {
    inspectPrefix(loop, index, history);
    history.noProgress = attempt.progress ? 0 : history.noProgress + 1;
    history.durationMs = observeUsage(history.durationMs, attempt.durationMs);
    history.tokens = observeUsage(history.tokens, attempt.tokens);
  }
  // Retain the report contract: all prefix findings precede retry diagnostics.
  history.findings.push(...retryFindings(loop.attempts));
  return history;
}

function inspectLimits(loop: Loop, history: History): string[] {
  const reasons: string[] = [];
  if (loop.attempts.length >= loop.limits.maxAttempts) reasons.push('attempt-limit');
  if (history.noProgress >= loop.limits.maxConsecutiveNoProgress) reasons.push('stagnation');
  if (reachedUsageLimit(history.durationMs, loop.limits.maxDurationMs))
    reasons.push('duration-limit');
  if (reachedUsageLimit(history.tokens, loop.limits.maxObservedTokens))
    reasons.push('observed-token-limit');
  return reasons;
}

function loopStatus(loop: Loop, history: History, limitReasons: string[]) {
  const last = loop.attempts.at(-1);
  if (loop.state === 'abandoned') return 'abandoned';
  if (
    loop.state === 'interrupted' ||
    last?.outcome === 'interrupted' ||
    unknownBoundedUsage(loop.limits, history)
  )
    return 'needs-reconciliation';
  if (loop.state === 'blocked' || last?.outcome === 'blocked') return 'blocked';
  if (history.findings.length) return 'correct-course';
  // Success at its limit allows closure assessment, never another attempt.
  if (loop.state === 'complete' && last?.outcome === 'passed') return 'closure-required';
  if (loop.state === 'limit-reached' || limitReasons.length) return 'limit-reached';
  if (loop.state === 'complete' || last?.outcome === 'failed') return 'correct-course';
  return 'eligible';
}

/** Stateless inspection only. Limits do not constrain a host process or a rewritten history. */
export function inspectLoop(input: unknown) {
  const loop = validateLoop(input);
  const history = inspectHistory(loop);
  const limitReasons = inspectLimits(loop, history);
  const status = loopStatus(loop, history, limitReasons);
  return {
    format: 1,
    missionId: loop.missionId,
    status,
    eligibleToConsider: status === 'eligible',
    attempts: loop.attempts.length,
    consecutiveNoProgress: history.noProgress,
    observed: { tokens: history.tokens.total, durationMs: history.durationMs.total },
    findings: history.findings,
    limitReasons,
    nextAction: status === 'eligible' ? loop.nextAction : null,
    recordedNextAction: loop.nextAction,
    stopReason: loop.stopReason,
    limitations:
      'Read-only operator-supplied history; no dispatch, retry, runtime budget enforcement, authorization or evidence certification. Usage is observed, not a hard cap. A rewritten/omitted history and semantic diagnosis require review. Complete claims require separate criterion coverage and relevance assessment.',
  };
}
