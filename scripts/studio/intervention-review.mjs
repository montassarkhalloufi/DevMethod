import { readProjectControl } from './control.mjs';
import { recordInterventionDecision } from './domain.mjs';
import { captureInterventionObservations } from './intervention-observations.mjs';
import { interventionDigest, validateConsequenceAssessment } from './intervention-record.mjs';

const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

export function readInterventionReview(store, { revisionId, agent = {}, liveActions = [] }) {
  const state = store.read();
  const revision = state.revisions.find((item) => item.id === revisionId);
  if (!revision) reject('Version inconnue.', 404);
  const control = readProjectControl(store, agent, undefined, liveActions, revisionId);
  const consequences = control.consequences;
  const base = state.revisions.find((item) => item.id === consequences.baseRevisionId);
  let reason =
    consequences.issue ??
    (consequences.data.status !== 'available'
      ? 'Données locales absentes ou indisponibles ; examen des conséquences incomplet.'
      : null);
  try {
    captureInterventionObservations(control);
  } catch {
    reason ??= 'Observations trop volumineuses ou incomplètes ; examen à préciser.';
  }
  return {
    version: state.version,
    revision: { id: revision.id, title: revision.title },
    base: base ? { id: base.id, title: base.title } : null,
    reviewKey: interventionDigest({ version: state.version, control, agent, reason }),
    canReview: reason === null,
    reason,
    control,
    consequences,
  };
}

function validateInput(input) {
  const fields = [
    'version',
    'revisionId',
    'reviewKey',
    'resolution',
    'assessment',
    'scope',
    'reason',
  ];
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !fields.includes(key)) ||
    !Number.isSafeInteger(input.version) ||
    input.version < 1 ||
    typeof input.revisionId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(input.revisionId) ||
    typeof input.reviewKey !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.reviewKey) ||
    !['accept-local', 'keep-stopped'].includes(input.resolution)
  )
    reject('Demande d’examen invalide.', 400);
  validateConsequenceAssessment(input.assessment);
  for (const [key, maximum] of [
    ['scope', 2000],
    ['reason', 4000],
  ])
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > maximum)
      reject('Périmètre et justification explicites requis.', 400);
}

function assertAcceptance(input, context) {
  if (input.resolution !== 'accept-local') return;
  if (Object.values(input.assessment).includes('unknown'))
    reject('Une conséquence inconnue ne peut pas être déclarée examinée et acceptée.');
  const positive = new Set(context.signals.map((signal) => signal.kind));
  if (context.data.nonEmpty) positive.add('persistent-data');
  for (const [key, kind] of [
    ['persistentData', 'persistent-data'],
    ['contractChanged', 'contract-changed'],
  ])
    if (input.assessment[key] === 'not-affected' && positive.has(kind))
      reject('L’appréciation contredit un indice positif ; examinez les conséquences signalées.');
}

export function recordInterventionReview(store, input, support = {}) {
  validateInput(input);
  const current = readInterventionReview(store, { ...support, revisionId: input.revisionId });
  if (current.version !== input.version || current.reviewKey !== input.reviewKey)
    reject('L’examen a changé ; actualisez les conséquences puis confirmez de nouveau.');
  if (!current.canReview) reject(current.reason);
  assertAcceptance(input, current.consequences);
  const context = current.consequences;
  const intervention = {
    schemaVersion: 1,
    revisionId: input.revisionId,
    baseRevisionId: context.baseRevisionId,
    fingerprint: context.fingerprint,
    baseFingerprint: context.baseFingerprint,
    contextFingerprint: context.contextFingerprint,
    protocol: context.protocol,
    reviewKey: current.reviewKey,
    resolution: input.resolution,
    assessment: { ...input.assessment },
    scope: input.scope.trim(),
    createdAt: new Date().toISOString(),
    observations: captureInterventionObservations(current.control),
  };
  let decision;
  const state = store.commit(input.version, (draft) => {
    decision = recordInterventionDecision(draft, { intervention, reason: input.reason.trim() });
  });
  return { state, decision };
}
