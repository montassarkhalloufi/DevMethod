import { hash, object, safePath, text } from './records.js';
import { isBehaviorReceipt, type BehaviorReceipt, type BehaviorResult } from './behavior.js';
import { repeatedFailureSignature } from './loop.js';

const member = (value: unknown, choices: readonly string[]): boolean =>
  typeof value === 'string' && choices.includes(value);

export interface GuardAttempt extends BehaviorResult {
  diagnosis: string | null;
  adjustment: string | null;
  contextSignature: string;
}

export interface GuardState {
  format: 1;
  root: string;
  missionPath: string;
  missionSha256: string;
  status: 'active' | 'halted';
  featureState: 'implementation-ready' | 'verification-failed' | 'verified' | 'accepted';
  pending: boolean;
  reason: string | null;
  attempts: GuardAttempt[];
  receipt: BehaviorReceipt | null;
  contextSignature: string | null;
}

function validAttempt(value: unknown): value is GuardAttempt {
  if (!object(value) || !hash(value.contextSignature)) return false;
  if (
    !(value.diagnosis === null || text(value.diagnosis)) ||
    !(value.adjustment === null || text(value.adjustment))
  )
    return false;
  if (value.outcome === 'failed') return hash(value.failureSignature);
  return member(value.outcome, ['passed', 'interrupted']) && value.failureSignature === null;
}

export function validateGuardState(input: unknown): GuardState {
  if (
    !object(input) ||
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
    !input.attempts.every(validAttempt)
  )
    throw new Error('Invalid guard state; human reconciliation required.');
  const state = input as unknown as GuardState;
  if (['verified', 'accepted'].includes(state.featureState) && !state.receipt)
    throw new Error('Verified or accepted state requires behavioral evidence.');
  return state;
}

export function haltReason(state: GuardState): string | null {
  if (state.status === 'halted') return state.reason ?? 'halted-session';
  if (state.pending) return 'interrupted-verification';
  if (repeatedFailureSignature(state.attempts)) return 'repeated-failure-signature';
  if (state.attempts.at(-1)?.outcome === 'interrupted') return 'interrupted-verification';
  if (state.attempts.length >= 100 && state.attempts.at(-1)?.outcome !== 'passed')
    return 'attempt-limit';
  return null;
}

export function halt(state: GuardState, reason: string): void {
  state.status = 'halted';
  state.reason = reason;
  state.pending = false;
  state.receipt = null;
  state.featureState = 'verification-failed';
}
