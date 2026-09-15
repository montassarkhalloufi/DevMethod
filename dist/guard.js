import fs from 'node:fs';
import path from 'node:path';
import { commandGate } from './commands.js';
import { inspectAcceptance } from './closure.js';
import { behavioralReceipt, evaluateBehavior } from './behavior.js';
import { captureGuardSnapshot } from './guard-context.js';
import { halt, haltReason } from './guard-state.js';
import { withGuardStore } from './guard-store.js';
import { captureContext, missionStatus, validateMission } from './mission.js';
import { digest, readLocal, readRecord, text } from './records.js';
import { checkPath } from './filesystem.js';
const limitations = 'Local guard only: no host interception, agent dispatch, deployment or merge. Frozen context covers declared files; external writers must be quiescent. Hashes bind bytes, not authenticity or semantic truth. Session storage is trusted local state.';
function report(state, status, allowed, reason = null) {
    return {
        format: 1,
        status,
        allowed,
        reason,
        nextAction: null,
        featureState: state?.featureState ?? null,
        attempts: state?.attempts.length ?? 0,
        failureSignature: state?.attempts.at(-1)?.failureSignature ?? null,
        behavioralEvidenceSignature: state?.receipt?.signature ?? null,
        frozenContext: state?.status === 'halted' && state.contextSignature ? 'context.json' : null,
        contextSignature: state?.contextSignature ?? null,
        limitations,
    };
}
function newState(options) {
    return {
        format: 1,
        root: options.root,
        missionPath: options.missionPath,
        missionSha256: digest(readLocal(options.root, options.missionPath)),
        status: 'active',
        featureState: 'implementation-ready',
        pending: false,
        reason: null,
        attempts: [],
        receipt: null,
        contextSignature: null,
    };
}
function gate(options, state) {
    const mission = validateMission(readRecord(options.root, options.missionPath));
    if (state &&
        (state.root !== options.root ||
            state.missionPath !== options.missionPath ||
            state.missionSha256 !== digest(readLocal(options.root, options.missionPath))))
        return 'session-scope-changed';
    captureContext(options.root, mission);
    return commandGate(options.command, {
        halted: false,
        ready: missionStatus(mission) === 'ready',
        initialized: state !== null,
        retryNeedsDiagnosis: state?.attempts.at(-1)?.outcome === 'failed',
        hasDiagnosis: text(options.diagnosis) && text(options.adjustment),
        hasBehavioralReceipt: state?.receipt != null,
    });
}
function verificationInputs(options) {
    if (!options.reportPath || !options.artifactPath)
        throw new Error('Verification requires --report and --artifacts.');
    return {
        missionPath: options.missionPath,
        reportPath: options.reportPath,
        artifactPath: options.artifactPath,
    };
}
function verify(options, state, store) {
    const inputs = verificationInputs(options);
    const before = captureGuardSnapshot(options.root, inputs);
    if (state.receipt?.signature === behavioralReceipt(before).signature &&
        state.attempts.at(-1)?.outcome === 'passed') {
        state.featureState = 'verified';
        store.save(state);
        return report(state, 'verified', true);
    }
    if (state.attempts.length >= 100) {
        halt(state, 'attempt-limit');
        store.save(state);
        return report(state, 'human-intervention', false, state.reason);
    }
    state.pending = true;
    state.receipt = null;
    state.featureState = 'verification-failed';
    store.save(state); // Persist intent before either writing a snapshot or launching the scorer.
    store.freeze(before);
    state.contextSignature = before.signature;
    store.save(state);
    const result = evaluateBehavior(options.root, before);
    state.attempts.push({
        ...result,
        contextSignature: before.signature,
        diagnosis: options.diagnosis ?? null,
        adjustment: options.adjustment ?? null,
    });
    state.pending = false;
    if (captureGuardSnapshot(options.root, inputs).signature !== before.signature)
        halt(state, 'context-changed-during-verification');
    const stop = haltReason(state);
    if (stop)
        halt(state, stop);
    if (state.status !== 'halted' && result.outcome === 'passed') {
        state.receipt = behavioralReceipt(before);
        state.featureState = 'verified';
    }
    store.save(state);
    return state.status === 'halted'
        ? report(state, 'human-intervention', false, state.reason)
        : report(state, state.featureState, result.outcome === 'passed');
}
function integrate(options, state, store) {
    if (!options.checkpointPath)
        throw new Error('Integration requires --checkpoint.');
    // Invalidate a previous acceptance before assessment; a crash cannot retain acceptance.
    state.featureState = 'verification-failed';
    store.save(state);
    const acceptance = inspectAcceptance(options.root, options.missionPath, options.checkpointPath, state.receipt);
    if (acceptance.allowed)
        state.featureState = 'accepted';
    else
        state.receipt = null;
    store.save(state);
    return report(state, acceptance.allowed ? 'accepted' : 'blocked', acceptance.allowed, acceptance.reason);
}
function execute(options, store) {
    const state = store.state;
    if (state && (state.root !== options.root || state.missionPath !== options.missionPath))
        return report(null, 'blocked', false, 'session-scope-changed');
    const stop = state && haltReason(state);
    if (state && stop) {
        halt(state, stop);
        store.save(state);
        return report(state, 'human-intervention', false, stop);
    }
    const reason = gate(options, state);
    if (reason) {
        if (state) {
            state.featureState = 'verification-failed';
            state.receipt = null;
            store.save(state);
        }
        return report(state, 'blocked', false, reason);
    }
    if (options.command === '/implement') {
        const current = state ?? newState(options);
        current.receipt = null;
        current.featureState = 'implementation-ready';
        store.save(current);
        return report(current, 'implementation-ready', true);
    }
    if (!state)
        throw new Error('Implementation gate required.');
    return options.command === '/verify'
        ? verify(options, state, store)
        : integrate(options, state, store);
}
export function runGuard(options) {
    try {
        const root = path.resolve(options.root);
        checkPath(root);
        const normalized = { ...options, root: fs.realpathSync(root) };
        return withGuardStore(normalized.root, options.session, options.command === '/implement', (store) => executeSafely(normalized, store));
    }
    catch {
        // Do not echo input JSON, child stderr or source bytes. Pending intent/stale locks remain.
        return report(null, 'human-intervention', false, 'guard-io-or-validation-error');
    }
}
function executeSafely(options, store) {
    try {
        return execute(options, store);
    }
    catch {
        const state = store.state;
        if (!state || state.root !== options.root || state.missionPath !== options.missionPath)
            throw new Error('Guard context unavailable.');
        halt(state, 'guard-io-or-validation-error');
        store.save(state);
        return report(state, 'human-intervention', false, state.reason);
    }
}
