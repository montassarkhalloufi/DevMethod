import { digest } from './files.mjs';
import { effectiveDelegation } from './domain.mjs';
import { businessCriteriaFingerprint } from './quality-criteria.mjs';

export function sourceContext(state, revision, at) {
  return {
    projectId: 'local-project',
    missionId: revision?.jobId ?? null,
    actionId: `delivery:${revision?.id ?? 'planning'}`,
    revisionId: revision?.id ?? null,
    at,
  };
}

export function evidenceNode(context, value) {
  return {
    ...context,
    status: 'declared',
    freshness: 'current',
    outcome: 'unknown',
    dependencies: {},
    dependencyScope: 'complete',
    required: false,
    limits: [],
    ...value,
  };
}

export function checkDependencies(revision, checkId) {
  const patterns = {
    'source-syntax': /\.[cm]?[jt]sx?$/,
    'json-format': /\.json$/,
    'html-accessibility': /\.html$/,
  };
  const files = revision.files.filter(
    (file) => !patterns[checkId] || patterns[checkId].test(file.path),
  );
  return {
    ...Object.fromEntries(files.map((file) => [`file:${file.path}`, file.sha256])),
    [`scope:${checkId}`]: digest(JSON.stringify(files.map((file) => file.path).sort())),
    ...(checkId === 'bundle-size'
      ? { 'compiled:manifest': digest(JSON.stringify(revision.compilation ?? null)) }
      : {}),
  };
}

function qualityNode(context, state, row) {
  const proof = row.evidence;
  const revision = state.revisions.find((entry) => entry.id === proof?.revisionId);
  const local = row.execution === 'studio' && revision;
  const dependencies = local ? checkDependencies(revision, row.id) : {};
  if (proof?.businessCriteria) dependencies.criteria = proof.businessCriteria.fingerprint;
  if (proof?.riskRequirement) dependencies[`risk:${row.id}`] = proof.riskRequirement.fingerprint;
  return evidenceNode(context, {
    id: `check:${row.id}`,
    kind: /visual|browser/.test(row.id) ? 'visual' : 'check',
    label: row.title,
    revisionId: proof?.revisionId ?? context.revisionId,
    at: proof?.finishedAt ?? proof?.startedAt ?? context.at,
    status: proof ? (row.execution === 'recorded' ? 'declared' : 'observed') : 'missing',
    freshness: row.freshness === 'reevaluate' ? 'unavailable' : 'current',
    outcome: ['passed', 'failed', 'running'].includes(row.status) ? row.status : 'unknown',
    source: proof?.tool ?? row.tool,
    explanation: proof?.observed ?? row.reason ?? 'Contrôle non exécuté.',
    limits: proof?.limits ?? [row.nextAction ?? 'Aucun résultat disponible.'],
    dependencies,
    dependencyScope: local ? 'complete' : 'revision',
    required: Boolean(
      row.canRun ||
      (['business-journey', 'visual-comparison', 'end-to-end'].includes(row.id) &&
        row.status !== 'notapplicable'),
    ),
    ...(proof ? { runId: proof.id } : {}),
    checkId: row.id,
    canRun: row.canRun,
    link: {
      panel: /visual|browser/.test(row.id) ? 'product' : 'checks',
      revisionId: proof?.revisionId ?? context.revisionId,
      checkId: row.id,
    },
  });
}

export function qualityNodes(context, state, quality) {
  if (!quality) return [];
  return quality.checks.map((row) => {
    const historical = quality.historical.find((entry) => entry.evidence?.checkId === row.id);
    return qualityNode(
      context,
      state,
      row.evidence || !historical
        ? row
        : { ...row, evidence: historical.evidence, status: historical.status },
    );
  });
}

export function declaredNodes(context, state, revision) {
  const nodes = [
    evidenceNode(context, {
      id: 'intention',
      kind: 'intention',
      label: 'Intention',
      source: 'Cadrage du projet',
      explanation: state.brief.outcome || state.project.idea || 'Intention à préciser.',
      dependencies: { intention: digest(state.brief.outcome || state.project.idea) },
      link: { panel: 'journey' },
    }),
  ];
  for (const criterion of state.brief.criteria)
    nodes.push(
      evidenceNode(context, {
        id: `criterion:${criterion.id}`,
        kind: 'criterion',
        label: `${criterion.id} · ${criterion.text}`,
        source: 'Critère déclaré',
        explanation: criterion.text,
        dependencies: { criteria: businessCriteriaFingerprint(state) },
        link: { panel: 'journey' },
      }),
    );
  for (const decision of state.decisions.filter((entry) => entry.status !== 'superseded'))
    nodes.push(
      evidenceNode(context, {
        id: `decision:${decision.id}`,
        kind: 'decision',
        label: decision.topic,
        source:
          decision.source === 'user'
            ? 'Décision humaine enregistrée'
            : 'Décision déclarée par l’agent',
        explanation: `${decision.choice} · ${decision.reason}`,
        link: { panel: 'choices' },
      }),
    );
  if (revision)
    nodes.push(
      evidenceNode(context, {
        id: `code:${revision.id}`,
        kind: 'code',
        label: 'Code',
        at: revision.createdAt,
        status: 'observed',
        source: 'Manifeste immuable du Studio',
        explanation: `${revision.title} · ${revision.files.length} fichiers`,
        dependencies: Object.fromEntries(
          revision.files.map((file) => [`file:${file.path}`, file.sha256]),
        ),
        link: { panel: 'code', revisionId: revision.id },
      }),
    );
  return nodes;
}

export function jobNodes(context, state) {
  return state.jobs.slice(-50).flatMap((job) => [
    evidenceNode(context, {
      id: `job:${job.id}`,
      kind: 'job',
      label: `Mission ${job.id.slice(0, 8)}`,
      missionId: job.id,
      revisionId: job.baseRevision,
      at: job.finishedAt ?? job.createdAt,
      status: 'observed',
      source: 'Journal du runner',
      explanation: `État enregistré : ${job.status}. La livraison ne constitue pas une preuve de correction.`,
      outcome:
        job.status === 'failed' ? 'failed' : job.status === 'running' ? 'running' : 'unknown',
      link: { panel: 'history' },
    }),
    ...(job.worker
      ? [
          evidenceNode(context, {
            id: `agent:${job.id}`,
            kind: 'agent',
            label: `Agent · mission ${job.id.slice(0, 8)}`,
            missionId: job.id,
            source: 'Prise en charge Studio',
            explanation:
              'Agent enregistré sur cette mission ; ses déclarations de progression restent distinctes des preuves.',
            link: { panel: 'history' },
          }),
        ]
      : []),
  ]);
}

export function changeSignals(state, revision) {
  if (!revision) return [];
  const job = state.jobs.find((entry) => entry.id === revision.jobId);
  const base = state.revisions.find((entry) => entry.id === job?.baseRevision);
  const before = new Map((base?.files ?? []).map((file) => [file.path, file.sha256]));
  const after = new Map(revision.files.map((file) => [file.path, file.sha256]));
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter(
    (name) => before.get(name) !== after.get(name),
  );
  const signals = [];
  const add = (id, level, category, reason) =>
    signals.push({
      id,
      level,
      category,
      reason,
      evidenceIds: [`code:${revision.id}`],
      humanResolvable: true,
    });
  if (changed.length > 20)
    add(
      'broad-change',
      'medium',
      'scope',
      `${changed.length} fichiers modifiés ; étendue importante à examiner.`,
    );
  if (changed.some((name) => /(?:auth|permission|policy|credential|secret)/i.test(name)))
    add(
      'permission-change',
      'high',
      'permissions',
      'Changement dans une zone d’authentification ou de permissions ; examiner les accès exacts.',
    );
  if (changed.some((name) => /(?:migration|payment|billing|deploy)/i.test(name)))
    add(
      'critical-area',
      'high',
      'critical-area',
      'Changement dans une zone critique de données, paiement ou déploiement.',
    );
  return signals;
}

export function controlAction(state, revision) {
  return {
    id: `delivery:${revision?.id ?? 'planning'}`,
    label: revision ? 'Poursuivre et appliquer une évolution' : 'Préparer le projet',
    kind: 'delivery',
    reversible: true,
    impact: 'low',
    reserved: effectiveDelegation(state).adoption === 'user',
  };
}

export function graphEdges(nodes) {
  const edges = [];
  const add = (from, to, relation, explanation) => {
    if (from && to && from !== to)
      edges.push({ id: `${relation}:${from}:${to}`, from, to, relation, explanation });
  };
  const code = nodes.find((node) => node.kind === 'code');
  const delivery = nodes.find((node) => node.kind === 'job' && node.missionId === code?.missionId);
  add(
    code?.id,
    delivery?.id,
    'depends-on',
    'Version produite par cette mission, sans déduire sa correction.',
  );
  for (const node of nodes) {
    if (node.kind === 'criterion')
      add(node.id, 'intention', 'depends-on', 'Ce critère exprime l’intention.');
    if (node.kind === 'decision')
      add(
        code?.id,
        node.id,
        'depends-on',
        'Choix déclaré associé au code ; conformité non déduite.',
      );
    if (['check', 'visual', 'analysis'].includes(node.kind))
      add(node.id, code?.id, 'validates', 'Périmètre et limites détaillés dans cette preuve.');
    if (node.checkId === 'business-journey')
      for (const criterion of nodes.filter((entry) => entry.kind === 'criterion'))
        add(
          node.id,
          criterion.id,
          'validates',
          'Contrôle des critères déclarés ; résultat à consulter.',
        );
    if (node.kind === 'agent')
      add(node.id, `job:${node.missionId}`, 'depends-on', 'Prise en charge de la mission.');
  }
  return edges;
}
