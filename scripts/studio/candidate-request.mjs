import { contextKey } from './job-context.mjs';
import { queueRequest } from './domain.mjs';
import { readProjectControl } from './control.mjs';
import { qualitySnapshot } from './quality-storage.mjs';
import { digest } from './files.mjs';
import {
  assertCandidateRequestContext,
  candidateSource,
  pendingControlledCandidate,
} from './candidate-request-record.mjs';

const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

function inspectSource(store, state, revisionId) {
  const source = candidateSource(state, revisionId);
  const snapshot = qualitySnapshot(store, source.revision);
  if (snapshot.issue) reject(snapshot.issue);
  return { ...source, fingerprint: snapshot.fingerprint };
}

export function assertCandidateRequestCurrent(store, state, job) {
  if (!job.candidateRequest) return;
  assertCandidateRequestContext(state, job);
  const source = inspectSource(store, state, job.candidateRequest.sourceRevision);
  if (source.fingerprint !== job.candidateRequest.sourceFingerprint)
    reject('Les sources du candidat ont changé ; préparez une nouvelle demande.');
}

function requestEligibility(store, state, revisionId) {
  try {
    const source = inspectSource(store, state, revisionId);
    const pending = pendingControlledCandidate(state);
    if (pending && pending.id !== source.parent.id)
      reject('Un autre candidat attend une décision.');
    if (
      state.jobs.some(
        (job) =>
          ['queued', 'running'].includes(job.status) &&
          job.candidateRequest?.parentJobId === source.parent.id,
      )
    )
      reject('Une demande liée à ce candidat est déjà en attente ou en cours.');
    return {
      canRequest: true,
      reason: 'Les fichiers de ce candidat seront utilisés ; la version active est conservée.',
    };
  } catch (error) {
    return { canRequest: false, reason: error.message };
  }
}

export function readCandidateRequest(store, { revisionId, agent = {}, liveActions = [] }) {
  const state = store.read();
  const revision = state.revisions.find((entry) => entry.id === revisionId);
  if (!revision) reject('Candidat introuvable.', 404);
  const eligibility = requestEligibility(store, state, revisionId);
  return {
    version: state.version,
    revision: { id: revision.id, title: revision.title },
    activeRevision: state.activeRevision,
    reviewKey: digest(
      JSON.stringify({
        version: state.version,
        activeRevision: state.activeRevision,
        revision,
        contextKey: contextKey(state),
        eligibility,
      }),
    ),
    ...eligibility,
    control: readProjectControl(store, agent, undefined, liveActions, revisionId),
  };
}

function validateInput(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => !['version', 'revisionId', 'reviewKey', 'request'].includes(key),
    ) ||
    !Number.isSafeInteger(input.version) ||
    input.version < 1 ||
    typeof input.revisionId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(input.revisionId) ||
    typeof input.reviewKey !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.reviewKey) ||
    typeof input.request !== 'string' ||
    !input.request.trim() ||
    input.request.length > 20000
  )
    reject('Demande liée au candidat invalide.', 400);
}

export function requestCandidateChanges(store, input, support = {}) {
  validateInput(input);
  const review = readCandidateRequest(store, { ...support, revisionId: input.revisionId });
  if (review.version !== input.version || review.reviewKey !== input.reviewKey)
    reject('Le candidat ou son contexte a changé ; actualisez avant d’envoyer.');
  if (!review.canRequest) reject(review.reason);
  let job;
  const state = store.commit(input.version, (draft) => {
    const source = inspectSource(store, draft, input.revisionId);
    const savedDraft = draft.draft;
    const savedGuides = draft.draftConnectorGuides;
    job = queueRequest(draft, { request: input.request });
    draft.draft = savedDraft;
    if (savedGuides !== undefined) draft.draftConnectorGuides = savedGuides;
    job.candidateRequest = {
      parentJobId: source.parent.id,
      sourceRevision: source.revision.id,
      sourceFingerprint: source.fingerprint,
      contextKey: contextKey(draft),
    };
  });
  return { state, job };
}
