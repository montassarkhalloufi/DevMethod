import { hash, object, safePath, text } from './records.js';
import { isBehaviorReceipt } from './behavior.js';
import { repeatedFailureSignature } from './loop.js';
const member = (value, choices) => typeof value === 'string' && choices.includes(value);
function validAttempt(value) {
    if (!object(value) || !hash(value.contextSignature))
        return false;
    if (!(value.diagnosis === null || text(value.diagnosis)) ||
        !(value.adjustment === null || text(value.adjustment)))
        return false;
    if (value.outcome === 'failed')
        return hash(value.failureSignature);
    return member(value.outcome, ['passed', 'interrupted']) && value.failureSignature === null;
}
export function validateGuardState(input) {
    if (!object(input) ||
        input.format !== 1 ||
        !text(input.root) ||
        !safePath(input.missionPath) ||
        !hash(input.missionSha256) ||
        !member(input.status, ['active', 'halted']) ||
        !member(input.featureState, [
            'implementation-ready',
            'verification-failed',
            'verified',
            'accepted',
        ]) ||
        typeof input.pending !== 'boolean' ||
        !(input.reason === null || text(input.reason)) ||
        !(input.receipt === null || isBehaviorReceipt(input.receipt)) ||
        !(input.contextSignature === null || hash(input.contextSignature)) ||
        !Array.isArray(input.attempts) ||
        input.attempts.length > 100 ||
        !input.attempts.every(validAttempt))
        throw new Error('Invalid guard state; human reconciliation required.');
    const state = input;
    if (['verified', 'accepted'].includes(state.featureState) && !state.receipt)
        throw new Error('Verified or accepted state requires behavioral evidence.');
    return state;
}
export function haltReason(state) {
    if (state.status === 'halted')
        return state.reason ?? 'halted-session';
    if (state.pending)
        return 'interrupted-verification';
    if (repeatedFailureSignature(state.attempts))
        return 'repeated-failure-signature';
    if (state.attempts.at(-1)?.outcome === 'interrupted')
        return 'interrupted-verification';
    if (state.attempts.length >= 100 && state.attempts.at(-1)?.outcome !== 'passed')
        return 'attempt-limit';
    return null;
}
export function halt(state, reason) {
    state.status = 'halted';
    state.reason = reason;
    state.pending = false;
    state.receipt = null;
    state.featureState = 'verification-failed';
}
