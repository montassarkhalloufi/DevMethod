import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, gitState, object, readLocal, readRecord, safePath, secretPath, } from './records.js';
import { validateMission } from './mission.js';
import { parseJson } from './filesystem.js';
export const packageRoot = fileURLToPath(new URL('../', import.meta.url));
export const evaluatorPath = path.join(packageRoot, 'scripts/evaluate-behavior.mjs');
function engineSignature() {
    const files = [
        'scripts/evaluate-behavior.mjs',
        'evaluation/behavioral/cases.json',
        'evaluation/behavioral/oracle.json',
        'dist/behavior.js',
        'dist/guard-context.js',
        'dist/loop.js',
        'dist/commands.js',
        'dist/closure.js',
        'dist/guard.js',
        'dist/guard-store.js',
        'dist/guard-cli.js',
        'dist/guard-state.js',
        'dist/guard-revision.js',
        'dist/records.js',
        'dist/filesystem.js',
        'dist/mission.js',
        'dist/checkpoint.js',
        'dist/cli.js',
    ];
    return digest(JSON.stringify(files.map((file) => [file, digest(readLocal(packageRoot, file))])));
}
function artifactPaths(report, artifactPath) {
    if (!object(report) || !Array.isArray(report.runs))
        throw new Error('Invalid behavioral report.');
    return report.runs.flatMap((run) => {
        if (!object(run) || !Array.isArray(run.artifacts))
            throw new Error('Invalid behavioral artifacts.');
        return run.artifacts.map((artifact) => {
            if (!object(artifact) || !safePath(artifact.path))
                throw new Error('Unsafe behavioral artifact.');
            return `${artifactPath}/${artifact.path}`;
        });
    });
}
function snapshotFiles(root, paths) {
    const selected = [...new Set(paths)].sort();
    if (selected.length > 512)
        throw new Error('Guard context exceeds 512 declared files.');
    let total = 0;
    return selected.map((file) => {
        if (secretPath(file))
            throw new Error('Secret-like guard context is excluded.');
        const bytes = readLocal(root, file, 8 * 1024 * 1024);
        total += bytes.length;
        if (total > 32 * 1024 * 1024)
            throw new Error('Guard context exceeds 32 MiB.');
        if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(bytes.toString('utf8')))
            throw new Error('Private key material cannot be frozen.');
        return { path: file, sha256: digest(bytes), content: bytes.toString('base64') };
    });
}
/** Snapshot declared bytes, not the entire filesystem. Requires a quiescent workspace. */
export function captureGuardSnapshot(root, inputs) {
    const selected = {
        missionPath: inputs.missionPath,
        reportPath: inputs.reportPath,
        artifactPath: inputs.artifactPath,
    };
    if (Object.values(selected).some((file) => !safePath(file) || secretPath(file)))
        throw new Error('Expected safe, non-secret guard input paths.');
    const mission = validateMission(readRecord(root, inputs.missionPath));
    const report = parseJson(readLocal(root, inputs.reportPath, 2 * 1024 * 1024).toString('utf8'));
    const paths = [
        inputs.missionPath,
        inputs.reportPath,
        ...mission.sources.map((source) => source.path),
        ...mission.acceptance.flatMap((criterion) => criterion.changes),
        ...artifactPaths(report, inputs.artifactPath),
    ];
    const files = snapshotFiles(root, paths);
    const context = {
        format: 1,
        ...selected,
        git: gitState(root),
        engineSignature: engineSignature(),
    };
    const signature = digest(JSON.stringify({ ...context, files: files.map(({ path, sha256 }) => ({ path, sha256 })) }));
    return { ...context, files, signature };
}
