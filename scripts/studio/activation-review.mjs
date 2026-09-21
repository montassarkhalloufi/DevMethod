import { readProjectConnectors } from './connectors.mjs';
import { createHash } from 'node:crypto';
import { activateRevision, effectiveDelegation } from './domain.mjs';
import { readProjectControl } from './control.mjs';
import { qualitySnapshot } from './quality-storage.mjs';
import { revisionAdmission } from './admission.mjs';
import { criteriaFingerprint } from './control-policy.mjs';
import { readBrowserConfiguration } from './browser-configuration.mjs';

const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

export function readActivationReview(store, { revisionId, agent = {}, liveActions = [] }) {
  const state = store.read();
  const revision = state.revisions.find((item) => item.id === revisionId);
  if (!revision) reject('Version inconnue.', 404);
  const snapshot = qualitySnapshot(store, revision);
  let admission = revisionAdmission(state, revision);
  if (snapshot.issue) admission = { allowed: false, reason: snapshot.issue };
  if (admission.allowed) {
    try {
      activateRevision(structuredClone(state), { id: revisionId, reason: '' });
    } catch (error) {
      admission = { allowed: false, reason: error.message };
    }
  }
  const control = readProjectControl(store, agent, undefined, liveActions, revisionId);
  let connectors;
  try {
    connectors = readProjectConnectors(store, revisionId).connections;
  } catch {
    connectors = 'unreadable';
  }
  let browser;
  try {
    browser = readBrowserConfiguration(store);
  } catch {
    browser = 'unreadable';
  }
  const reviewKey = digest({
    connectors,
    browser,
    version: state.version,
    revision,
    activeRevision: state.activeRevision,
    criteria: state.brief,
    delegation: effectiveDelegation(state),
    decisions: state.decisions,
    admission,
    control,
    agent,
  });
  return {
    version: state.version,
    revision: { id: revision.id, title: revision.title },
    activeRevision: state.activeRevision,
    reviewKey,
    canActivate: admission.allowed,
    admission,
    control,
  };
}

export function activateReviewedRevision(store, input, support = {}) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !['version', 'id', 'reviewKey', 'reason'].includes(key)) ||
    !Number.isSafeInteger(input.version) ||
    input.version < 1 ||
    typeof input.id !== 'string' ||
    !input.id ||
    input.id.length > 500 ||
    typeof input.reviewKey !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.reviewKey) ||
    typeof input.reason !== 'string' ||
    !input.reason.trim() ||
    input.reason.length > 4000
  )
    reject('Demande d’adoption invalide.', 400);
  const current = readActivationReview(store, { ...support, revisionId: input.id });
  if (current.version !== input.version || current.reviewKey !== input.reviewKey)
    reject('L’examen a changé ; relisez les preuves avant d’adopter.');
  if (!current.canActivate) reject(current.admission.reason);
  const state = store.read();
  const revision = state.revisions.find((item) => item.id === input.id);
  const bounded = (values) =>
    [...new Set(values)].slice(0, 500).map((value) => value.slice(0, 500));
  const review = {
    revisionId: input.id,
    fingerprint: qualitySnapshot(store, revision).fingerprint,
    criteriaFingerprint: criteriaFingerprint(state),
    reviewKey: current.reviewKey,
    reasons: bounded(current.control.autonomy.reasons),
    unknowns: bounded(current.control.risk.unknowns),
    action: current.control.autonomy.action,
    riskSeverity: current.control.risk.severity,
    riskFactors: current.control.risk.factors
      .slice(0, 500)
      .map(({ id, severity }) => ({ id, severity })),
    evidence: current.control.graph.nodes
      .filter((node) => node.type === 'evidence' && node.revisionId === input.id)
      .slice(0, 500)
      .map((node) => ({
        id: node.id,
        status: node.status,
        freshness: node.freshness,
        trusted: node.trusted,
        provenance: node.provenance,
        fingerprint: node.fingerprint,
        coverageDecisionIds: (node.coverageReviews ?? [])
          .map((item) => item.decisionId)
          .slice(0, 500),
      })),
    interventions: bounded(current.control.interventions.map((item) => item.id)),
  };
  return {
    state: store.commit(input.version, (draft) =>
      activateRevision(draft, { id: input.id, reason: input.reason }, { review }),
    ),
  };
}
