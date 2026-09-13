import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseJson, checkPath } from './filesystem.js';
import { gitState, validGit } from './records.js';
const object = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const identifier = (value) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
// Portable repository-relative paths only: no Windows aliases, drives or streams.
function safePath(value) {
    return typeof value === 'string' && value.length > 0 && !/[\\:\x00-\x1f\x7f]/.test(value)
        && value.split('/').every(part => part.length > 0 && part !== '.' && part !== '..'
            && !/[. ]$/.test(part) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
}
function pinned(value) {
    return object(value) && identifier(value.id) && safePath(value.path)
        && typeof value.sha256 === 'string' && /^[a-f0-9]{64}$/.test(value.sha256);
}
function ids(value) {
    return Array.isArray(value) && value.every(identifier) && new Set(value).size === value.length;
}
function validate(input) {
    if (!object(input) || input.format !== 1)
        throw new Error('Expected checkpoint format 1. Markdown checkpoints remain a manual workflow.');
    if (!nonempty(input.scope) || typeof input.status !== 'string' || !['active', 'blocked', 'complete'].includes(input.status))
        throw new Error('Checkpoint needs a nonempty scope and status active, blocked or complete.');
    if (input.nextAction !== null && !nonempty(input.nextAction))
        throw new Error('nextAction must be a nonempty string or null.');
    if (input.status === 'complete' && input.nextAction !== null)
        throw new Error('Completed scope must have nextAction null; completion authorizes no new work.');
    if (input.status !== 'complete' && !nonempty(input.nextAction))
        throw new Error('Active or blocked scope needs an explicit nextAction.');
    if (!Array.isArray(input.sources) || !input.sources.every(pinned) || input.sources.length === 0)
        throw new Error('sources must contain pinned IDs, safe relative paths and lowercase SHA-256 hashes.');
    if (!Array.isArray(input.evidence) || !input.evidence.every(item => pinned(item) && object(item)
        && ids(item.sourceIds) && item.sourceIds.length > 0 && ids(item.dependsOn)
        && typeof item.outcome === 'string' && ['passed', 'failed', 'blocked', 'not-run'].includes(item.outcome)))
        throw new Error('evidence needs pinned artifacts, sourceIds, dependsOn and outcome passed, failed or not-run.');
    if (input.sources.length > 256 || input.evidence.length > 256)
        throw new Error('Checkpoint supports at most 256 sources and evidence items.');
    if (input.git !== undefined && !validGit(input.git))
        throw new Error('Invalid Git checkpoint provenance.');
    if (input.blockers !== undefined && (!Array.isArray(input.blockers) || !input.blockers.every(nonempty)))
        throw new Error('blockers must be nonempty strings.');
    for (const item of input.evidence) {
        if (item.criterionIds !== undefined && (!ids(item.criterionIds) || !item.criterionIds.length))
            throw new Error('criterionIds must be nonempty unique IDs.');
        if (item.kind !== undefined && (typeof item.kind !== 'string' || !['automated', 'manual', 'design-review', 'recommendation'].includes(item.kind)))
            throw new Error('Invalid verification kind.');
        if (item.revision !== undefined && !nonempty(item.revision))
            throw new Error('Invalid evidence revision.');
    }
    const state = input;
    const sources = new Set(state.sources.map(source => source.id));
    const evidence = new Map(state.evidence.map(item => [item.id, item]));
    if (sources.size !== state.sources.length || evidence.size !== state.evidence.length)
        throw new Error('Source IDs and evidence IDs must each be unique.');
    if (new Set(state.sources.map(source => source.path)).size !== state.sources.length
        || new Set(state.evidence.map(item => item.path)).size !== state.evidence.length)
        throw new Error('Source paths and evidence paths must each be unique.');
    for (const item of state.evidence) {
        if (item.sourceIds.some(id => !sources.has(id)) || item.dependsOn.some(id => !evidence.has(id)))
            throw new Error(`Evidence ${item.id} references an unknown source or evidence ID.`);
    }
    // Iterative topological traversal avoids stack exhaustion on an untrusted graph.
    const done = new Set();
    while (done.size < evidence.size) {
        let progress = false;
        for (const item of state.evidence)
            if (!done.has(item.id) && item.dependsOn.every(id => done.has(id))) {
                done.add(item.id);
                progress = true;
            }
        if (!progress)
            throw new Error('Evidence dependencies contain a cycle.');
    }
    return state;
}
function readPinned(destination, relative) {
    if (!safePath(relative))
        throw new Error('Expected a safe repository-relative path.');
    const file = path.join(destination, relative);
    checkPath(file);
    if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).size > 1024 * 1024)
        throw new Error('Expected a regular file.');
    return fs.readFileSync(file);
}
function emptyReport(destination) {
    return { format: 1, destination: path.resolve(destination), status: 'invalid', findings: [], sources: [], evidence: [] };
}
/** Read-only inspection; report readiness never grants execution or integration permission. */
export function inspectCheckpoint(destination, input) {
    const report = emptyReport(destination);
    let state;
    try {
        state = validate(input);
        checkPath(report.destination);
        if (!fs.statSync(report.destination).isDirectory())
            throw new Error('Destination must be a directory.');
    }
    catch (error) {
        report.findings.push({ code: 'invalid-checkpoint', message: error.message });
        return report;
    }
    report.scope = state.scope;
    report.nextAction = state.nextAction;
    const compare = (item, kind) => {
        try {
            const digest = createHash('sha256').update(readPinned(report.destination, item.path)).digest('hex');
            if (digest === item.sha256)
                return 'unchanged';
            report.findings.push({ code: `${kind}-changed`, id: item.id, path: item.path, message: `Pinned ${kind} content changed; inspect the difference and repeat affected verification.` });
            return 'changed';
        }
        catch (error) {
            report.findings.push({ code: `${kind}-unavailable`, id: item.id, path: item.path, message: `Cannot inspect pinned ${kind}: ${error.message}` });
            return 'unavailable';
        }
    };
    report.sources = state.sources.map(source => ({ id: source.id, state: compare(source, 'source') }));
    const sourceStates = new Map(report.sources.map(source => [source.id, source.state]));
    const artifactStates = new Map(state.evidence.map(item => [item.id, compare(item, 'evidence')]));
    const evidenceStates = new Map();
    while (evidenceStates.size < state.evidence.length) {
        for (const item of state.evidence) {
            if (evidenceStates.has(item.id) || !item.dependsOn.every(id => evidenceStates.has(id)))
                continue;
            const invalidated = artifactStates.get(item.id) !== 'unchanged'
                || item.sourceIds.some(id => sourceStates.get(id) !== 'unchanged')
                || item.dependsOn.some(id => evidenceStates.get(id) !== 'valid');
            const result = invalidated ? 'invalidated' : item.outcome === 'passed' ? 'valid' : item.outcome;
            evidenceStates.set(item.id, result);
            if (result !== 'valid')
                report.findings.push({ code: `evidence-${result}`, id: item.id, path: item.path,
                    message: `Evidence ${item.id} is ${result}; it cannot support resumption until affected verification is recorded again.` });
        }
    }
    report.evidence = state.evidence.map(item => ({ id: item.id, state: evidenceStates.get(item.id) }));
    let gitChanged = false;
    if (state.git) {
        try {
            const current = gitState(report.destination);
            gitChanged = Object.entries(state.git).some(([key, value]) => current[key] !== value);
            if (gitChanged)
                report.findings.push({ code: 'git-changed', message: 'Branch, commit or worktree changed; reassess scope and omitted dependencies. Independent pins are retained.' });
        }
        catch {
            gitChanged = true;
            report.findings.push({ code: 'git-unavailable', message: 'Cannot compare recorded Git provenance.' });
        }
    }
    for (const blocker of state.blockers ?? [])
        report.findings.push({ code: 'dependency-blocked', message: blocker });
    const needsVerification = gitChanged || report.sources.some(source => source.state !== 'unchanged')
        || report.evidence.some(item => item.state !== 'valid') || report.evidence.length === 0;
    if (!report.evidence.length)
        report.findings.push({ code: 'evidence-empty', message: 'No evidence was pinned; establish verification before relying on this checkpoint.' });
    report.status = state.status === 'blocked' || (state.blockers?.length ?? 0) > 0 || state.evidence.some(item => item.outcome === 'blocked') ? 'blocked' : needsVerification ? 'reverify' : state.status === 'complete' ? 'complete' : 'ready';
    return report;
}
/** Load a JSON checkpoint within the project; never follows symbolic paths or changes files. */
export function readCheckpoint(destination, checkpointPath) {
    try {
        return inspectCheckpoint(destination, parseJson(readPinned(path.resolve(destination), checkpointPath).toString('utf8')));
    }
    catch (error) {
        const report = emptyReport(destination);
        report.findings.push({ code: 'invalid-checkpoint', path: checkpointPath, message: error.message });
        return report;
    }
}
