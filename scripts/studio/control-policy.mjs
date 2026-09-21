import { createHash } from 'node:crypto';
import { repeatedFailureSignature } from '../../dist/loop.js';

const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const criteriaFingerprint = (state) =>
  digest((state.brief?.criteria ?? []).map(({ id, text }) => ({ id, text })));
export const revisionFingerprint = (revision) =>
  digest({ files: revision.files, compiled: revision.compilation?.files ?? [] });

function evidenceFreshness(check, state, selected, revision, invalidated) {
  const fingerprint = revision ? revisionFingerprint(revision) : null;
  let freshness = ['current', 'reevaluate', 'obsolete'].includes(check.freshness)
    ? check.freshness
    : 'current';
  if (invalidated && check.revisionId === selected?.id) freshness = 'reevaluate';
  if (!revision || check.revisionId !== selected?.id) freshness = 'obsolete';
  else if (check.fingerprint && check.fingerprint !== fingerprint) freshness = 'obsolete';
  else if (
    freshness === 'current' &&
    check.kind === 'business' &&
    check.criteriaFingerprint !== criteriaFingerprint(state)
  )
    freshness = 'obsolete';
  return freshness;
}

function evidenceNode(check, state, selected, revision, invalidated) {
  const kind =
    check.kind === 'command'
      ? 'technical'
      : check.kind === 'runtime-observation'
        ? 'runtime'
        : check.kind;
  const freshness = evidenceFreshness(check, state, selected, revision, invalidated);
  const trusted = check.executor === 'studio' && check.trusted !== false;
  return {
    id: `evidence:${check.id}`,
    type: 'evidence',
    sourceId: check.id,
    revisionId: check.revisionId,
    kind,
    status: check.status,
    freshness,
    trusted,
    provenance:
      check.provenance ??
      (check.kind === 'runtime-observation'
        ? 'preview-signal'
        : trusted
          ? 'studio-executor'
          : 'unattested'),
    linkedCheckId: check.linkedCheckId ?? null,
    supersededBy: check.supersededBy ?? null,
    reportedCriterionIds: check.reportedCriterionIds ?? [],
    coverageReviews: check.coverageReviews ?? [],
    requestId: check.requestId ?? null,
    protocol: check.protocol ?? null,
    fingerprint: check.fingerprint ?? null,
    createdAt: check.createdAt ?? null,
    environment: check.environment ?? null,
    observed:
      typeof (check.observed ?? check.output) === 'string'
        ? (check.observed ?? check.output).slice(0, 4000)
        : null,
    criterionIds: check.criterionIds ?? [],
    limits: check.limits ?? ['Ce contrôle ne prouve que son périmètre déclaré.'],
  };
}

/** Evidence must come from trusted local storage, never directly from agent output.
 * Business evidence binds criterionIds AND criteriaFingerprint. Technical evidence
 * remains scoped to its immutable revision when only criteria change.
 */
export function buildEvidenceGraph({ state, revisionId, evidence = [], invalidated = false }) {
  const selected = state.revisions.find((revision) => revision.id === revisionId);
  const nodes = [],
    edges = [];
  for (const criterion of state.brief?.criteria ?? [])
    nodes.push({ id: `criterion:${criterion.id}`, type: 'criterion', text: criterion.text });
  for (const job of state.jobs)
    nodes.push({ id: `job:${job.id}`, type: 'job', status: job.status });
  for (const revision of state.revisions) {
    nodes.push({
      id: `revision:${revision.id}`,
      type: 'revision',
      fingerprint: revisionFingerprint(revision),
    });
    if (state.jobs.some((job) => job.id === revision.jobId))
      edges.push({
        from: `job:${revision.jobId}`,
        to: `revision:${revision.id}`,
        relation: 'produced',
      });
  }
  const linked = new Set(
    evidence
      .filter((entry) =>
        state.checks.some(
          (check) => check.id === entry.linkedCheckId && check.revisionId === entry.revisionId,
        ),
      )
      .map((entry) => entry.linkedCheckId),
  );
  const records = [...state.checks.filter((check) => !linked.has(check.id)), ...evidence];
  const ids = new Set();
  for (const check of records) {
    if (ids.has(check.id)) throw new Error('Identité de preuve dupliquée.');
    ids.add(check.id);
    const revision = state.revisions.find((item) => item.id === check.revisionId);
    const node = evidenceNode(check, state, selected, revision, invalidated);
    nodes.push(node);
    appendAssessmentGraph(nodes, edges, node);
    if (revision)
      edges.push({ from: `revision:${revision.id}`, to: node.id, relation: 'checked-by' });
    for (const criterionId of node.criterionIds)
      if (nodes.some((item) => item.id === `criterion:${criterionId}`))
        edges.push({ from: node.id, to: `criterion:${criterionId}`, relation: 'covers' });
  }
  edges.push(...replacementEdges(nodes));
  return { revisionId, nodes, edges, criteriaFingerprint: criteriaFingerprint(state) };
}

function appendAssessmentGraph(nodes, edges, node) {
  for (const review of node.coverageReviews) {
    const id = `decision:${review.decisionId}`;
    nodes.push({ ...review, id, type: 'assessment', revisionId: node.revisionId, source: 'user' });
    edges.push({ from: node.id, to: id, relation: 'assessed-by' });
    if (nodes.some((item) => item.id === `criterion:${review.criterionId}`))
      edges.push({ from: id, to: `criterion:${review.criterionId}`, relation: 'assesses' });
  }
}

function replacementEdges(nodes) {
  const ids = new Set(nodes.map((node) => node.id));
  return nodes
    .filter((node) => node.supersededBy && ids.has(`evidence:${node.supersededBy}`))
    .map((node) => ({
      from: node.id,
      to: `evidence:${node.supersededBy}`,
      relation: 'superseded-by',
    }));
}

function hasRuntimeSignal(graph) {
  return graph.nodes.some(
    (node) =>
      node.type === 'evidence' &&
      node.kind === 'runtime' &&
      node.status === 'failed' &&
      node.freshness === 'current',
  );
}

function consequenceAppraisal(consequences) {
  const review =
    consequences?.reviews?.findLast((item) => item.contributes || item.holds) ??
    consequences?.reviews?.at(-1) ??
    null;
  const accepted = review?.contributes === true && review.freshness === 'current';
  const positive = new Set((consequences?.signals ?? []).map((signal) => signal.kind));
  if (consequences?.data?.nonEmpty === true) positive.add('persistent-data');
  for (const [key, factor] of [
    ['persistentData', 'persistent-data'],
    ['contractChanged', 'contract-changed'],
  ])
    if (review?.assessment[key] === 'affected' && review.freshness === 'current')
      positive.add(factor);
  return { review, accepted, positive };
}

function riskAssessment(execution, graph, consequences) {
  const appraisal = consequenceAppraisal(consequences);
  const factors = [];
  const add = (id, severity, reason) => factors.push({ id, severity, reason });
  if (execution.permissionRevoked)
    add('permission-revoked', 'critical', 'Une permission a été retirée.');
  if (execution.externalOutcomeUnknown)
    add('external-outcome-unknown', 'critical', 'Le résultat de l’action externe est inconnu.');
  if (hasRuntimeSignal(graph))
    add(
      'runtime-observation-failed',
      'moderate',
      'Le navigateur rapporte une erreur ; reproduction indépendante nécessaire.',
    );
  if (execution.irreversible)
    add('irreversible', 'high', 'Une opération irréversible est signalée.');
  factors.push(...consequenceFactors(execution, appraisal.positive));
  const unknowns = ['localOnly', 'reversible', 'persistentData', 'contractChanged'].filter(
    (key) => typeof execution[key] !== 'boolean',
  );
  if (execution.localOnly === false)
    add('external-scope', 'high', 'Une action hors du périmètre local exige un arbitrage.');
  if (execution.reversible === false)
    add('not-reversible', 'high', 'La réversibilité n’est pas disponible.');
  const severity =
    ['critical', 'high', 'moderate'].find((level) =>
      factors.some((factor) => factor.severity === level),
    ) ?? (unknowns.length ? 'unknown' : 'low');
  return {
    severity,
    probability: 'unknown',
    factors,
    unknowns,
    review: appraisal.review,
    reviewedUnknowns: appraisal.accepted
      ? unknowns.filter(
          (key) =>
            ['persistentData', 'contractChanged'].includes(key) &&
            appraisal.review.assessment[key] !== 'unknown',
        )
      : [],
    acceptedFactors: appraisal.accepted
      ? factors
          .filter((factor) => ['persistent-data', 'contract-changed'].includes(factor.id))
          .map((factor) => factor.id)
      : [],
    evidenceQuality: graph.nodes.some(
      (node) => node.type === 'evidence' && node.trusted && node.freshness === 'current',
    )
      ? 'scoped'
      : 'missing',
    limits: [
      'Facteurs fournis par le runtime ; aucune analyse sémantique exhaustive ni probabilité mesurée.',
      'Les indices textuels et appréciations locales ne sont pas des preuves d’absence de conséquence ; accepter conserve les facteurs et inconnues observés.',
    ],
  };
}

function consequenceFactors(execution, positive) {
  return [
    {
      id: 'persistent-data',
      key: 'persistentData',
      runtime: 'Le runtime signale des données persistantes concernées.',
      indication:
        'Données persistantes présentes, indiquées dans les sources ou concernées selon l’appréciation locale.',
    },
    {
      id: 'contract-changed',
      key: 'contractChanged',
      runtime: 'Le runtime signale un changement de contrat consommé.',
      indication:
        'Un changement de contrat est indiqué dans les sources ou selon l’appréciation locale ; sa compatibilité n’est pas prouvée.',
    },
  ]
    .filter(({ id, key }) => execution[key] || positive.has(id))
    .map(({ id, key, runtime, indication }) => ({
      id,
      severity: 'moderate',
      reason: execution[key] ? runtime : indication,
    }));
}

function blockers(execution) {
  const reasons = [];
  for (const [key, reason] of [
    ['usageUnknown', 'usage-unknown'],
    ['interrupted', 'interrupted'],
    ['candidateDiscarded', 'candidate-discarded'],
    ['contextChanged', 'context-changed'],
    ['permissionRevoked', 'permission-revoked'],
    ['externalOutcomeUnknown', 'external-outcome-unknown'],
    ['budgetClosed', 'budget-closed'],
    ['executionDisabled', 'agent-unavailable'],
  ])
    if (execution[key]) reasons.push(reason);
  if (repeatedFailureSignature(execution.attempts ?? [])) reasons.push('repeated-failure');
  return reasons;
}

function decision({ state, revisionId, delegation, admission, execution }, graph, risk) {
  const stopped = blockers(execution);
  if (risk.review?.holds) stopped.push('consequences-held');
  if (stopped.length) return { action: 'stop', reasons: stopped };
  if (execution.toolPending?.length)
    return { action: 'arbitrate', reasons: ['tool-action-pending'] };
  if (execution.toolFailures?.length)
    return { action: 'arbitrate', reasons: ['tool-action-failed'] };
  if (!state.revisions.some((revision) => revision.id === revisionId))
    return { action: 'stop', reasons: ['revision-missing'] };
  if (risk.severity === 'high')
    return {
      action: 'arbitrate',
      reasons: risk.factors
        .filter((factor) => factor.severity === 'high')
        .map((factor) => factor.id),
    };
  if (hasRuntimeSignal(graph))
    return { action: 'strengthen-verification', reasons: ['runtime-observation-failed'] };
  const current = graph.nodes.filter(
    (node) => node.type === 'evidence' && node.trusted && node.freshness === 'current',
  );
  const failed = current.filter((node) => node.status === 'failed');
  if (failed.length) return correctionDecision(execution, delegation, failed);
  if (!admission?.allowed)
    return { action: 'strengthen-verification', reasons: ['admission-missing'] };
  const missing = (state.brief?.criteria ?? []).filter(
    (criterion) =>
      !current.some(
        (node) =>
          node.kind === 'business' &&
          node.status === 'passed' &&
          node.criterionIds.includes(criterion.id),
      ),
  );
  if (missing.length || !(state.brief?.criteria ?? []).length)
    return { action: 'strengthen-verification', reasons: ['business-evidence-missing'] };
  if (
    risk.unknowns.some((key) => !risk.reviewedUnknowns.includes(key)) ||
    risk.factors.some(
      (factor) => factor.severity === 'moderate' && !risk.acceptedFactors.includes(factor.id),
    )
  )
    return { action: 'strengthen-verification', reasons: ['consequences-to-check'] };
  if (delegation.adoption !== 'agent')
    return { action: 'arbitrate', reasons: ['adoption-reserved'] };
  return { action: 'continue', operation: 'activate', reasons: ['scoped-evidence-sufficient'] };
}

function correctionDecision(execution, delegation, failed) {
  const count = execution.correctionAttempts;
  if (!Number.isSafeInteger(count) || count < 0)
    return { action: 'stop', reasons: ['correction-history-unknown'] };
  if (count >= 1) return { action: 'stop', reasons: ['correction-limit'] };
  const attributable =
    failed.every((node) => node.kind === 'technical') &&
    execution.technicalFailureAttributable === true;
  if (!attributable) return { action: 'arbitrate', reasons: ['diagnosis-required'] };
  if (delegation.correction !== 'agent')
    return { action: 'arbitrate', reasons: ['correction-reserved'] };
  if (execution.localOnly !== true || execution.reversible !== true)
    return { action: 'arbitrate', reasons: ['correction-consequences-unknown'] };
  return { action: 'continue', operation: 'correct', reasons: ['attributable-technical-failure'] };
}

/** Pure policy only. Caller persists its inputs/decision before dispatch and checks
 * them again on resume. correctionAttempts counts prior correction calls, not the
 * initial generation; it is mandatory for a retry. `delegation.correction` must be
 * resolved from explicit authority, independently of adoption and the mode label.
 */
export function evaluateControl(input) {
  const normalized = {
    ...input,
    delegation: input.delegation ?? {},
    execution: input.execution ?? {},
  };
  const graph = buildEvidenceGraph(normalized);
  for (const review of input.consequences?.reviews ?? []) {
    const id = `decision:${review.decisionId}`;
    graph.nodes.push({
      ...review,
      id,
      type: 'consequence-assessment',
      revisionId: input.revisionId,
      source: 'user',
    });
    graph.edges.push({ from: `revision:${input.revisionId}`, to: id, relation: 'assessed-by' });
  }
  const risk = riskAssessment(normalized.execution, graph, input.consequences);
  const autonomy = {
    requestedMode: input.state.project.mode,
    ...decision(normalized, graph, risk),
  };
  const interventions =
    autonomy.action === 'continue'
      ? []
      : [
          {
            id: digest({
              revisionId: input.revisionId,
              reasons: autonomy.reasons,
              criteria: graph.criteriaFingerprint,
            }),
            revisionId: input.revisionId,
            reasons: autonomy.reasons,
            impact: risk.severity,
            uncertainties: risk.unknowns,
            evidenceIds: graph.nodes
              .filter((node) => node.type === 'evidence' && node.revisionId === input.revisionId)
              .map((node) => node.id),
            options:
              autonomy.action === 'stop'
                ? ['inspect', 'keep-stopped']
                : ['inspect', 'verify', 'decide'],
            recommendation: autonomy.action,
          },
        ];
  for (const tool of normalized.execution.toolPending ?? [])
    interventions.push({
      id: tool.requestId,
      requestId: tool.requestId,
      revisionId: input.revisionId,
      reasons: ['tool-action-pending'],
      impact: 'unknown',
      uncertainties: ['external-outcome'],
      evidenceIds: [],
      options: ['inspect-tool-request'],
      recommendation: 'arbitrate',
      scope: tool,
    });
  return { graph, risk, interventions, autonomy };
}
