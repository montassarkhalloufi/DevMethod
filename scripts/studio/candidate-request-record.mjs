import { digest } from './files.mjs';
import { contextKey } from './job-context.mjs';

const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const fingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

export const jobSourceRevision = (job) =>
  job.candidateRequest?.sourceRevision ?? job.correction?.sourceRevision ?? job.baseRevision;

export const candidateFingerprint = (revision) =>
  digest(JSON.stringify({ files: revision.files, compiled: revision.compilation?.files ?? [] }));

export function candidateDiscarded(state, jobId) {
  return state.decisions.some(
    (decision) =>
      decision.topic === `control:${jobId}` &&
      decision.choice === 'discard' &&
      decision.source === 'user' &&
      decision.status === 'active',
  );
}

export function pendingControlledCandidate(state, exceptJobId) {
  const job = state.jobs.findLast((entry) => entry.control?.revisionId && entry.id !== exceptJobId);
  return job &&
    job.control.revisionId !== state.activeRevision &&
    !candidateDiscarded(state, job.id)
    ? job
    : null;
}

// A correction of the blocking candidate can pass earlier ordinary requests without
// changing their order, base, authorization or stored text.
export function nextQueuedJob(state) {
  const pending = pendingControlledCandidate(state);
  return (
    state.jobs.find(
      (job) =>
        job.status === 'queued' &&
        job.candidateRequest?.parentJobId === pending?.id &&
        job.candidateRequest?.sourceRevision === pending?.control.revisionId,
    ) ?? state.jobs.find((job) => job.status === 'queued')
  );
}

export function candidateSource(state, revisionId) {
  const revision = state.revisions.find((entry) => entry.id === revisionId);
  if (!revision) reject('Candidat introuvable.', 404);
  const parent = state.jobs.find((entry) => entry.id === revision.jobId);
  if (!parent || parent.status !== 'ready')
    reject('Le candidat ne provient pas d’une demande terminée.');
  if (revision.id === state.activeRevision) reject('Cette version est déjà active.');
  if (parent.baseRevision !== state.activeRevision) reject('La base du candidat a changé.');
  if (candidateDiscarded(state, parent.id)) reject('Ce candidat a été écarté.');
  return { revision, parent };
}

export function validateCandidateRequest(record, job, state) {
  const keys = ['parentJobId', 'sourceRevision', 'contextKey', 'sourceFingerprint'];
  if (
    !record ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    Object.keys(record).some((key) => !keys.includes(key)) ||
    !identifier(record.parentJobId) ||
    !identifier(record.sourceRevision) ||
    !fingerprint(record.contextKey) ||
    !fingerprint(record.sourceFingerprint) ||
    job.correction ||
    job.recovery
  )
    reject('Demande liée au candidat invalide.', 400);
  const parentIndex = state.jobs.findIndex((entry) => entry.id === record.parentJobId);
  const jobIndex = state.jobs.findIndex((entry) => entry.id === job.id);
  const parent = state.jobs[parentIndex];
  const revision = state.revisions.find((entry) => entry.id === record.sourceRevision);
  if (
    parentIndex < 0 ||
    parentIndex >= jobIndex ||
    parent.status !== 'ready' ||
    revision?.jobId !== parent.id ||
    parent.baseRevision !== job.baseRevision ||
    candidateFingerprint(revision) !== record.sourceFingerprint
  )
    reject('Filiation de demande liée au candidat incohérente.', 400);
}

export function assertCandidateRequestContext(state, job) {
  if (!job.candidateRequest) return;
  const { revision, parent } = candidateSource(state, job.candidateRequest.sourceRevision);
  if (
    parent.id !== job.candidateRequest.parentJobId ||
    job.baseRevision !== state.activeRevision ||
    contextKey(state) !== job.candidateRequest.contextKey ||
    candidateFingerprint(revision) !== job.candidateRequest.sourceFingerprint
  )
    reject('Le contexte de la demande liée au candidat a changé ; préparez une nouvelle demande.');
}

function requestFamily(state, job) {
  let current = job;
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const parentId = current.candidateRequest?.parentJobId ?? current.correction?.parentJobId;
    if (!parentId) return current.id;
    current = state.jobs.find((entry) => entry.id === parentId);
  }
  return null;
}

export function correctionAttempts(state, job) {
  if (!job) return 0;
  const family = requestFamily(state, job);
  return state.jobs.reduce((count, attempt) => {
    if (!attempt.correction || requestFamily(state, attempt) !== family) return count;
    // The direct pending repair is the reservation being assessed for dispatch.
    // Other branches, including failed jobs that delivered no revision, still count.
    if (attempt.correction.parentJobId === job.id && ['queued', 'running'].includes(attempt.status))
      return count;
    return count + attempt.correction.attempt;
  }, 0);
}
