import { readProjectControl } from './control.mjs';
import { activateControlledRevision, planApprovalKey } from './domain.mjs';
import { captureInterventionObservations } from './intervention-observations.mjs';
import { interventionDigest } from './intervention-record.mjs';

const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

function validateInput(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !['version', 'revisionId'].includes(key)) ||
    !Number.isSafeInteger(input.version) ||
    input.version < 1 ||
    typeof input.revisionId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(input.revisionId)
  )
    reject('Demande d’application invalide.', 400);
}

function assertAvailable(state, revision, agent, trigger) {
  const job = state.jobs.find((entry) => entry.id === revision.jobId);
  if (!job || job.status !== 'ready' || revision.profile === 'source-only')
    reject('Cette version ne peut pas être appliquée automatiquement.');
  if (job.baseRevision !== state.activeRevision)
    reject('La base de cette candidate n’est plus la version active.');
  if (agent.automatic !== true || agent.configuring || agent.verification?.status === 'running')
    reject('Le moteur est indisponible ou sa configuration est en cours.');
  if (
    state.jobs.some((entry) => entry.status === 'running') ||
    (trigger === 'local' && agent.running)
  )
    reject('Une exécution est en cours ; attendez sa fin avant d’appliquer.');
  return job;
}

function captureApplication(state, revision, job, control, trigger) {
  return {
    schemaVersion: 1,
    protocol: 'studio-controlled-activation-v1',
    trigger,
    jobId: job.id,
    revisionId: revision.id,
    baseRevisionId: job.baseRevision,
    contextFingerprint: control.consequences.contextFingerprint,
    controlKey: interventionDigest(control),
    fingerprint: control.consequences.fingerprint,
    criteriaFingerprint: control.graph.criteriaFingerprint,
    planKey: planApprovalKey(state),
    consequenceDecisionId: control.risk.review.decisionId,
    coverageDecisionIds: [
      ...new Set(
        control.graph.nodes
          .filter((node) => node.type === 'evidence' && node.revisionId === revision.id)
          .flatMap((node) =>
            (node.coverageReviews ?? [])
              .filter((review) => review.contributes)
              .map((review) => review.decisionId),
          ),
      ),
    ],
    createdAt: new Date().toISOString(),
    observations: captureInterventionObservations(control),
  };
}

/** Synchronous local effect. Never wakes the provider or rewrites historical job control. */
export function applyControlledRevision(store, input, support = {}, trigger = 'local') {
  validateInput(input);
  if (!['runner', 'local'].includes(trigger)) reject('Déclencheur invalide.', 400);
  const state = store.read();
  if (state.version !== input.version) reject('Le projet a changé ; relisez son contrôle.');
  const revision = state.revisions.find((entry) => entry.id === input.revisionId);
  if (!revision) reject('Version inconnue.', 404);
  if (state.activeRevision === revision.id) return { state, applied: false, decision: null };
  const agent = support.agent ?? {};
  const job = assertAvailable(state, revision, agent, trigger);
  const control = readProjectControl(store, agent, job.id, support.liveActions, revision.id);
  if (control.autonomy.action !== 'continue' || control.autonomy.operation !== 'activate')
    reject('Les contrôles actuels ne permettent pas l’application de cette version.');
  if (control.consequences?.issue || !control.risk.review?.contributes)
    reject('Les conséquences doivent être examinées dans le contexte courant.');
  const application = captureApplication(state, revision, job, control, trigger);
  let decision;
  const saved = store.commit(input.version, (draft) => {
    decision = activateControlledRevision(draft, { application });
  });
  return { state: saved, applied: true, decision };
}
