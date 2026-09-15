import { validateMission, missionStatus } from './mission.js';
import { inspectCheckpoint, type Checkpoint } from './checkpoint.js';
import { readRecord, readLocal, digest, secretPath, object } from './records.js';

/** Coverage of operator-recorded evidence, not an execution receipt or a semantic verdict. */
export function inspectClosure(root: string, missionPath: string, checkpointPath: string) {
  const mission = validateMission(readRecord(root, missionPath));
  const input = readRecord(root, checkpointPath);
  // Preflight before the checkpoint inspector reads any pinned files.
  if (object(input)) for (const key of ['sources', 'evidence']) {
    const entries = input[key];
    if (Array.isArray(entries) && entries.some(e => object(e) && typeof e.path === 'string' && secretPath(e.path)))
      throw new Error('Secret-like checkpoint pins cannot support closure.');
  }
  if (mission.acceptance.some(c => c.changes.some(secretPath))) throw new Error('Secret-like change paths cannot support closure.');
  const checkpoint = inspectCheckpoint(root, input);
  const limitations = 'Read-only coverage of declared criteria and recorded evidence. No commands executed, truth certification, external-state validation, status mutation or execution authorization. A supported report still requires assessment of criterion completeness and evidence relevance.';
  if (checkpoint.status === 'invalid') return { format: 1, missionId: mission.id, status: 'invalid', findings: checkpoint.findings, criteria: [], limitations };
  const state = input as Checkpoint;
  const findings: { code: string; message: string }[] = [];
  const sourceByPath = new Map(state.sources.map(s => [s.path, s]));
  const pinnedMission = sourceByPath.get(missionPath);
  if (!pinnedMission || pinnedMission.sha256 !== digest(readLocal(root, missionPath)))
    findings.push({ code: 'mission-not-pinned', message: 'Pin this exact mission before relying on criterion coverage.' });
  for (const source of mission.sources) {
    const pin = sourceByPath.get(source.path);
    if (!pin || pin.id !== source.id) findings.push({ code: 'context-not-pinned', message: `Mission source ${source.id} must use the same ID and path in checkpoint sources.` });
  }
  if (!state.git) findings.push({ code: 'revision-missing', message: 'Closure requires a Git-aware checkpoint; legacy resume remains supported.' });
  const knownCriteria = new Set(mission.acceptance.map(c => c.id));
  for (const e of state.evidence) if (e.criterionIds?.some(id => !knownCriteria.has(id)))
    findings.push({ code: 'unknown-criterion', message: `Evidence ${e.id} names a criterion outside this mission.` });
  const evidenceStates = new Map(checkpoint.evidence.map(e => [e.id, e.state]));
  const criteria = mission.acceptance.map(criterion => {
    const changes = criterion.changes.map(p => sourceByPath.get(p));
    const candidates = state.evidence.filter(e => e.criterionIds?.includes(criterion.id));
    const supporting = candidates.filter(e => evidenceStates.get(e.id) === 'valid'
      && e.kind === criterion.kind && !!state.git && e.revision === state.git.commit
      && !!pinnedMission && e.sourceIds.includes(pinnedMission.id)
      && changes.every(pin => pin && e.sourceIds.includes(pin.id)));
    const reasons = [];
    if (changes.some(pin => !pin)) reasons.push('changed-path-not-pinned');
    if (!candidates.length) reasons.push('evidence-missing');
    else if (!supporting.length) reasons.push('no-current-matching-evidence');
    return { id: criterion.id, status: supporting.length ? 'supported' : 'unmet', evidenceIds: supporting.map(e => e.id), reasons };
  });
  const blocked = missionStatus(mission) === 'blocked' || checkpoint.status === 'blocked';
  const status = blocked ? 'blocked' : checkpoint.status === 'reverify' ? 'reverify'
    : findings.length || criteria.some(c => c.status !== 'supported') ? 'unmet' : 'supported';
  return { format: 1, missionId: mission.id, status, checkpointStatus: checkpoint.status,
    findings: [...checkpoint.findings, ...findings], criteria, limitations };
}
