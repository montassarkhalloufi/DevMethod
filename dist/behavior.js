import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { digest, hash, object, safePath } from './records.js';
import { hasCommittedGuardInputs } from './guard-revision.js';
import { captureGuardSnapshot, evaluatorPath, } from './guard-context.js';
export function isBehaviorReceipt(input) {
    return (object(input) &&
        input.format === 1 &&
        safePath(input.missionPath) &&
        safePath(input.reportPath) &&
        safePath(input.artifactPath) &&
        hash(input.contextSignature) &&
        hash(input.reportSha256) &&
        hash(input.signature));
}
/** Execute only the bundled offline scorer once; never execute a mission's command text. */
export function evaluateBehavior(root, inputs) {
    const process = spawnSync(globalThis.process.execPath, [
        evaluatorPath,
        path.resolve(root, inputs.reportPath),
        path.resolve(root, inputs.artifactPath),
        '--guard',
    ], {
        encoding: 'utf8',
        timeout: 30000,
        killSignal: 'SIGKILL',
        maxBuffer: 2 * 1024 * 1024,
        windowsHide: true,
        env: { ...globalThis.process.env, NODE_OPTIONS: '', NODE_PATH: '' },
    });
    if (process.error || process.signal)
        return { outcome: 'interrupted', failureSignature: null };
    if (process.status !== 0)
        return {
            outcome: 'failed',
            failureSignature: digest(JSON.stringify(['evaluator-error/v1', process.status, process.stderr])),
        };
    const result = JSON.parse(process.stdout);
    if (!object(result) || result.format !== 1)
        throw new Error('Invalid evaluator response.');
    if (result.status === 'passed' && result.failureSignature === null)
        return revisionMatches(inputs) && hasCommittedGuardInputs(root, inputs)
            ? { outcome: 'passed', failureSignature: null }
            : { outcome: 'failed', failureSignature: digest('behavior-revision-mismatch/v1') };
    if (result.status === 'failed' && hash(result.failureSignature))
        return { outcome: 'failed', failureSignature: result.failureSignature };
    throw new Error('Invalid evaluator verdict.');
}
function revisionMatches(snapshot) {
    const file = snapshot.files.find((file) => file.path === snapshot.reportPath);
    if (!file)
        return false;
    const report = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    return (object(report) &&
        Array.isArray(report.runs) &&
        report.runs.length > 0 &&
        report.runs.every((run) => object(run) &&
            object(run.provenance) &&
            run.provenance.methodRevision === snapshot.git.commit));
}
export function behavioralReceipt(snapshot) {
    const report = snapshot.files.find((file) => file.path === snapshot.reportPath);
    if (!report)
        throw new Error('Behavioral report is absent from the frozen inputs.');
    const record = {
        format: 1,
        missionPath: snapshot.missionPath,
        reportPath: snapshot.reportPath,
        artifactPath: snapshot.artifactPath,
        contextSignature: snapshot.signature,
        reportSha256: report.sha256,
    };
    return { ...record, signature: digest(JSON.stringify(['verified-behavior/v1', record])) };
}
/** Re-score observations, not native trials; a digest alone never establishes a pass. */
export function verifyBehaviorReceipt(root, missionPath, receipt) {
    if (!isBehaviorReceipt(receipt) || receipt.missionPath !== missionPath)
        return false;
    try {
        const before = captureGuardSnapshot(root, receipt);
        const current = behavioralReceipt(before);
        if (current.signature !== receipt.signature ||
            current.reportSha256 !== receipt.reportSha256 ||
            before.signature !== receipt.contextSignature)
            return false;
        if (evaluateBehavior(root, before).outcome !== 'passed')
            return false;
        return captureGuardSnapshot(root, receipt).signature === before.signature;
    }
    catch {
        return false;
    }
}
