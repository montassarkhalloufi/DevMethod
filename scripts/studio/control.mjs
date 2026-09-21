import { readControlQuality } from './quality-evidence.mjs';
import { readControlTools } from './control-tools.mjs';
import { evaluateControl } from './control-policy.mjs';
import { revisionAdmission } from './admission.mjs';
import { effectiveDelegation, planApprovalKey } from './domain.mjs';
import { readConsequenceContext } from './consequence-context.mjs';
import { projectInterventionReviews } from './intervention-record.mjs';
import { correctionAttempts } from './candidate-request-record.mjs';

// Scope is the local candidate operation, not an assertion that app behavior is safe.
function selectedScope(state, jobId, revisionId) {
  if (revisionId !== undefined) {
    const revision = state.revisions.find((item) => item.id === revisionId);
    return { revision, job: state.jobs.find((item) => item.id === revision?.jobId) };
  }
  const candidateJobs = new Set(state.revisions.map((item) => item.jobId));
  const job = jobId
    ? state.jobs.find((item) => item.id === jobId)
    : (state.jobs.findLast((item) => candidateJobs.has(item.id)) ?? state.jobs.at(-1));
  const revision =
    state.revisions.find((item) => item.jobId && item.jobId === job?.id) ??
    (!jobId ? state.revisions.find((item) => item.id === state.activeRevision) : undefined);
  return { job, revision };
}

export function projectControl(state, agent = {}, jobId, support = {}) {
  const { job, revision } = selectedScope(state, jobId, support.revisionId);
  const delegation = effectiveDelegation(state);
  const checks = state.checks.filter((check) => check.revisionId === revision?.id);
  const budgetClosed =
    agent.automatic === false &&
    ((Number.isSafeInteger(agent.maxJobs) && agent.attempts >= agent.maxJobs) ||
      (Number.isSafeInteger(agent.maxTokens) && agent.knownTokens >= agent.maxTokens));
  return evaluateControl({
    state,
    evidence: support.evidence ?? [],
    consequences: support.consequences,
    invalidated: Boolean(support.issue),
    revisionId: revision?.id ?? null,
    delegation: {
      adoption: delegation.adoption,
      correction:
        delegation.structure === 'agent' && delegation.adoption === 'agent' ? 'agent' : 'user',
    },
    admission: revision ? revisionAdmission(state, revision) : { allowed: false },
    execution: {
      toolPending: support.tools?.pending ?? [],
      toolFailures: support.tools?.failures ?? [],
      externalOutcomeUnknown: support.tools?.externalOutcomeUnknown === true,
      usageUnknown: agent.usageUnknown === true,
      interrupted: ['cancelled', 'interrupted'].includes(job?.status),
      candidateDiscarded: state.decisions.some(
        (decision) =>
          decision.topic === `control:${job?.id}` &&
          decision.choice === 'discard' &&
          decision.source === 'user' &&
          decision.status === 'active',
      ),
      contextChanged: Boolean(
        support.issue || (job?.correction && job.correction.contextKey !== planApprovalKey(state)),
      ),
      budgetClosed,
      executionDisabled: agent.automatic === false && !budgetClosed && agent.usageUnknown !== true,
      correctionAttempts: correctionAttempts(state, job),
      technicalFailureAttributable: checks.some(
        (check) =>
          check.executor === 'studio' && check.kind === 'command' && check.status === 'failed',
      ),
      localOnly: true,
      reversible: true,
      // Whether generated code changes data contracts remains unknown until checked.
    },
  });
}

/** Read normalized evidence immediately before deciding; never start an executor here. */
export function readProjectControl(store, agent = {}, jobId, liveActions, revisionId) {
  const state = store.read();
  const { job, revision } = selectedScope(state, jobId, revisionId);
  let quality = { evidence: [], issue: null };
  let tools;
  try {
    if (revision) quality = readControlQuality(store, revision.id);
  } catch {
    quality.issue = 'Les preuves qualité sont illisibles ; vérification requise.';
  }
  try {
    tools = readControlTools(store, job?.id, liveActions);
  } catch {
    tools = {
      externalOutcomeUnknown: true,
      pending: [],
      failures: [{ reason: 'tool-ledger-unreadable' }],
      evidence: [],
    };
  }
  const evidence = [
    ...quality.evidence,
    ...tools.evidence.map((entry) => ({ ...entry, revisionId: revision?.id ?? null })),
  ];
  const consequences = revision
    ? readConsequenceContext(store, state, revision.id, { evidence, tools })
    : null;
  if (consequences) consequences.reviews = projectInterventionReviews(state, consequences);
  return {
    ...projectControl(state, agent, jobId, {
      ...quality,
      evidence,
      tools,
      revisionId,
      consequences,
    }),
    tools,
    consequences,
  };
}
