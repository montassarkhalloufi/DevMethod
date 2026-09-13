import { object, text, id, safePath, secretPath, readLocal, digest, hash, gitState, validGit } from './records.js';
const list = (v) => Array.isArray(v) && v.length <= 256 && v.every(text);
const oneOf = (v, values) => typeof v === 'string' && values.includes(v);
export function validateMission(v) {
    if (!object(v) || v.format !== 1 || !id(v.id) || !oneOf(v.path, ['quick', 'standard', 'major']) || !text(v.outcome)
        || !text(v.owner) || !oneOf(v.status, ['active', 'blocked', 'complete']))
        throw new Error('Mission format 1 requires id, path, outcome, owner and status.');
    for (const key of ['scope', 'exclusions', 'invariants', 'uncertainties', 'stopConditions'])
        if (!list(v[key]))
            throw new Error(`Mission ${key} must be a bounded string array.`);
    if (!v.scope.length || !v.stopConditions.length)
        throw new Error('Scope and stop conditions cannot be empty.');
    if (v.status === 'complete' ? v.nextAction !== null : !text(v.nextAction))
        throw new Error('Active/blocked mission needs nextAction; complete requires null.');
    if (!Array.isArray(v.sources) || v.sources.length === 0 || v.sources.length > 64 || !v.sources.every(s => object(s)
        && id(s.id) && safePath(s.path) && !secretPath(s.path) && oneOf(s.level, ['project', 'domain', 'mission', 'execution'])
        && oneOf(s.kind, ['fact', 'assumption', 'proposal', 'accepted-decision']) && text(s.reason) && text(s.authority) && text(s.revision)))
        throw new Error('Select 1–64 safe sources with level, reason, authority, kind and revision; secret paths are excluded.');
    if (!Array.isArray(v.acceptance) || !v.acceptance.length || v.acceptance.length > 128 || !v.acceptance.every(c => object(c)
        && id(c.id) && text(c.description) && list(c.changes) && c.changes.length > 0 && c.changes.every(safePath)
        && text(c.verification) && oneOf(c.kind, ['automated', 'manual', 'design-review', 'recommendation'])))
        throw new Error('Acceptance criteria require IDs, changes, verification and verification kind.');
    if (!Array.isArray(v.dependencies) || v.dependencies.length > 128 || !v.dependencies.every(d => object(d) && id(d.id) && text(d.owner) && text(d.detail) && oneOf(d.status, ['resolved', 'blocked'])))
        throw new Error('Dependencies require id, owner, detail and resolved/blocked status.');
    const mission = v;
    const sourceIds = new Set(mission.sources.map(s => s.id));
    if (sourceIds.size !== mission.sources.length || new Set(mission.sources.map(s => s.path)).size !== mission.sources.length
        || new Set(mission.acceptance.map(c => c.id)).size !== mission.acceptance.length
        || new Set(mission.dependencies.map(d => d.id)).size !== mission.dependencies.length)
        throw new Error('IDs and source paths must be unique.');
    if (!Array.isArray(v.contradictions) || v.contradictions.length > 128 || !v.contradictions.every(c => object(c)
        && list(c.sourceIds) && c.sourceIds.length >= 2 && c.sourceIds.every(s => sourceIds.has(s)) && text(c.detail) && typeof c.resolved === 'boolean'))
        throw new Error('Contradictions require at least two selected source IDs, detail and resolved boolean.');
    return { format: 1, id: mission.id, path: mission.path, outcome: mission.outcome,
        scope: [...mission.scope], exclusions: [...mission.exclusions], invariants: [...mission.invariants], uncertainties: [...mission.uncertainties],
        owner: mission.owner, status: mission.status, nextAction: mission.nextAction, stopConditions: [...mission.stopConditions],
        acceptance: mission.acceptance.map(c => ({ id: c.id, description: c.description, changes: [...c.changes], verification: c.verification, kind: c.kind })),
        sources: mission.sources.map(s => ({ id: s.id, path: s.path, level: s.level, reason: s.reason, authority: s.authority, kind: s.kind, revision: s.revision })),
        dependencies: mission.dependencies.map(d => ({ id: d.id, owner: d.owner, status: d.status, detail: d.detail })),
        contradictions: mission.contradictions.map(c => ({ sourceIds: [...c.sourceIds], detail: c.detail, resolved: c.resolved })) };
}
export function missionStatus(mission) {
    if (mission.status === 'blocked' || mission.dependencies.some(d => d.status === 'blocked') || mission.contradictions.some(c => !c.resolved))
        return 'blocked';
    return mission.status === 'complete' ? 'complete' : 'ready';
}
function sourceHash(root, file) {
    const bytes = readLocal(root, file, 256 * 1024);
    const body = bytes.toString('utf8');
    if (body.includes('\0') || /-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_-]?key|password|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_\-/+]{20,}/i.test(body))
        throw new Error(`Potential credential or binary source excluded: ${file}`);
    return digest(bytes);
}
/** Metadata only; source text and command execution are deliberately excluded. */
export function captureContext(root, input) {
    const mission = validateMission(input);
    return { format: 1, mission, git: gitState(root), sources: mission.sources.map(s => ({ ...s, sha256: sourceHash(root, s.path) })) };
}
export function inspectContext(root, input) {
    if (!object(input) || input.format !== 1 || !validGit(input.git))
        throw new Error('Expected context format 1 with Git provenance.');
    const mission = validateMission(input.mission);
    if (!Array.isArray(input.sources) || input.sources.length !== mission.sources.length)
        throw new Error('Context pins must match mission selection.');
    const pins = input.sources;
    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        if (!object(pin) || !hash(pin.sha256) || Object.entries(mission.sources[i]).some(([k, value]) => pin[k] !== value))
            throw new Error('Context source metadata differs from mission selection.');
    }
    const sources = mission.sources.map((s, i) => {
        try {
            return { id: s.id, state: sourceHash(root, s.path) === pins[i].sha256 ? 'unchanged' : 'changed' };
        }
        catch {
            return { id: s.id, state: 'unavailable' };
        }
    });
    const current = gitState(root);
    const gitChanged = Object.entries(input.git).some(([key, value]) => current[key] !== value);
    const stale = gitChanged || sources.some(s => s.state !== 'unchanged');
    return { format: 1, missionId: mission.id, status: missionStatus(mission) === 'blocked' ? 'blocked' : stale ? 'reverify' : missionStatus(mission),
        sources, gitChanged, currentGit: current, nextAction: mission.nextAction,
        limitations: 'Explicit pins only. Git changes require reassessment; semantic contradictions, external state and untracked file contents need manual review. No execution authorization.' };
}
