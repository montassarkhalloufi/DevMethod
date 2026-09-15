import { object, text, id } from './records.js';
const count = (n) => Number.isSafeInteger(n) && n >= 0;
const positive = (n) => count(n) && n > 0;
const optionalText = (v) => v === null || text(v);
const optionalCount = (v) => v === null || count(v);
const optionalLimit = (v) => v === null || positive(v);
const enumValue = (v, values) => typeof v === 'string' && values.includes(v);
/** Stateless inspection only. Limits do not constrain a host process or a rewritten history. */
export function inspectLoop(input) {
    if (!object(input) || input.format !== 1 || !id(input.missionId)
        || !enumValue(input.state, ['active', 'complete', 'blocked', 'interrupted', 'limit-reached', 'abandoned'])
        || !optionalText(input.nextAction) || !optionalText(input.stopReason) || !object(input.limits)
        || !positive(input.limits.maxAttempts) || input.limits.maxAttempts > 100
        || !positive(input.limits.maxConsecutiveNoProgress) || input.limits.maxConsecutiveNoProgress > input.limits.maxAttempts
        || !optionalLimit(input.limits.maxDurationMs) || !optionalLimit(input.limits.maxObservedTokens)
        || !Array.isArray(input.attempts) || input.attempts.length > 100)
        throw new Error('Expected bounded loop format 1 with explicit state, limits and at most 100 attempts.');
    if (input.state === 'active' ? !text(input.nextAction) || input.stopReason !== null
        : !text(input.stopReason) || (['complete', 'abandoned'].includes(input.state) && input.nextAction !== null))
        throw new Error('Active loop needs nextAction and null stopReason; stopped loop needs a reason; complete/abandoned have no next action.');
    for (const [index, a] of input.attempts.entries())
        if (!object(a) || a.number !== index + 1
            || !enumValue(a.outcome, ['passed', 'failed', 'blocked', 'interrupted']) || !text(a.observation)
            || !optionalText(a.diagnosis) || !optionalText(a.adjustment) || typeof a.progress !== 'boolean'
            || !optionalCount(a.durationMs) || !optionalCount(a.tokens) || !Array.isArray(a.evidenceIds)
            || a.evidenceIds.length > 128 || !a.evidenceIds.every(id) || new Set(a.evidenceIds).size !== a.evidenceIds.length
            || (a.outcome === 'passed' && !a.evidenceIds.length))
            throw new Error('Attempts require contiguous numbers, observations, explicit usage (null when unknown), progress and evidence IDs for passing claims.');
    const loop = input;
    const findings = [];
    let streak = 0, elapsed = 0, used = 0;
    for (const [index, current] of loop.attempts.entries()) {
        if (index > 0 && (index >= loop.limits.maxAttempts || streak >= loop.limits.maxConsecutiveNoProgress
            || (loop.limits.maxDurationMs !== null && elapsed !== null && elapsed >= loop.limits.maxDurationMs)
            || (loop.limits.maxObservedTokens !== null && used !== null && used >= loop.limits.maxObservedTokens)))
            findings.push(`attempt-${current.number}-after-limit`);
        if (index > 0 && ((loop.limits.maxDurationMs !== null && elapsed === null)
            || (loop.limits.maxObservedTokens !== null && used === null)) && (!current.diagnosis || !current.adjustment))
            findings.push(`attempt-${current.number}-unknown-usage-not-reconciled`);
        streak = current.progress ? 0 : streak + 1;
        elapsed = elapsed === null || current.durationMs === null ? null : elapsed + current.durationMs;
        used = used === null || current.tokens === null ? null : used + current.tokens;
    }
    for (let i = 1; i < loop.attempts.length; i++) {
        const previous = loop.attempts[i - 1];
        const current = loop.attempts[i];
        if (previous.outcome === 'failed' && (!current.diagnosis || !current.adjustment))
            findings.push(`attempt-${current.number}-retry-without-diagnosis`);
        if (['blocked', 'interrupted'].includes(previous.outcome) && (!current.diagnosis || !current.adjustment))
            findings.push(`attempt-${current.number}-reconciliation-missing`);
    }
    const total = (key) => {
        if (loop.attempts.some(a => a[key] === null))
            return null;
        const n = loop.attempts.reduce((sum, a) => sum + a[key], 0);
        if (!Number.isSafeInteger(n))
            throw new Error('Usage total exceeds safe integer range.');
        return n;
    };
    const tokens = total('tokens'), durationMs = total('durationMs');
    const last = loop.attempts.at(-1);
    let noProgress = 0;
    for (const a of [...loop.attempts].reverse()) {
        if (a.progress)
            break;
        noProgress++;
    }
    const limitReasons = [];
    if (loop.attempts.length >= loop.limits.maxAttempts)
        limitReasons.push('attempt-limit');
    if (noProgress >= loop.limits.maxConsecutiveNoProgress)
        limitReasons.push('stagnation');
    if (loop.limits.maxDurationMs !== null && durationMs !== null && durationMs >= loop.limits.maxDurationMs)
        limitReasons.push('duration-limit');
    if (loop.limits.maxObservedTokens !== null && tokens !== null && tokens >= loop.limits.maxObservedTokens)
        limitReasons.push('observed-token-limit');
    const unknownUsage = (loop.limits.maxDurationMs !== null && durationMs === null) || (loop.limits.maxObservedTokens !== null && tokens === null);
    // A successful last attempt can be assessed for closure at its attempt limit; it authorizes no further run.
    const successfulStop = loop.state === 'complete' && last?.outcome === 'passed';
    const status = loop.state === 'abandoned' ? 'abandoned'
        : loop.state === 'interrupted' || last?.outcome === 'interrupted' || unknownUsage ? 'needs-reconciliation'
            : loop.state === 'blocked' || last?.outcome === 'blocked' ? 'blocked'
                : findings.length ? 'correct-course'
                    : successfulStop ? 'closure-required'
                        : loop.state === 'limit-reached' || limitReasons.length ? 'limit-reached'
                            : loop.state === 'complete' || last?.outcome === 'failed' ? 'correct-course' : 'eligible';
    return { format: 1, missionId: loop.missionId, status, eligibleToConsider: status === 'eligible',
        attempts: loop.attempts.length, consecutiveNoProgress: noProgress, observed: { tokens, durationMs },
        findings, limitReasons, nextAction: status === 'eligible' ? loop.nextAction : null,
        recordedNextAction: loop.nextAction, stopReason: loop.stopReason,
        limitations: 'Read-only operator-supplied history; no dispatch, retry, runtime budget enforcement, authorization or evidence certification. Usage is observed, not a hard cap. A rewritten/omitted history and semantic diagnosis require review. Complete claims require separate criterion coverage and relevance assessment.' };
}
