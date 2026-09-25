import { digest } from './files.mjs';
import { evidenceNode } from './control-sources.mjs';

export function analysisNodes(context, model) {
  if (!model) return [];
  return ['architecture', 'flows', 'impact'].map((kind) =>
    evidenceNode(context, {
      id: `analysis:${kind}`,
      kind: 'analysis',
      label: { architecture: 'Architecture', flows: 'Flux', impact: 'Impact' }[kind],
      status: 'inferred',
      source: 'Analyse déterministe des sources',
      explanation:
        kind === 'flows'
          ? `${model.analysis.flows.length} parcours identifiés dans les sources.`
          : kind === 'impact'
            ? 'Analyse des différences et dépendances ; ce lien ne démontre pas une exécution.'
            : `${model.analysis.elements.length} éléments identifiés dans les sources.`,
      limits: [
        'Extraction statique partielle ; appels dynamiques et comportement runtime non prouvés.',
      ],
      dependencyScope: 'revision',
      link: { panel: 'code', revisionId: context.revisionId },
    }),
  );
}

export function mcpObservations(context, actions) {
  const nodes = actions.map((action) =>
    evidenceNode(context, {
      id: `mcp:${action.requestId}`,
      kind: 'mcp',
      label: `MCP · ${action.toolName}`,
      missionId: action.jobId,
      revisionId: action.baseRevision,
      at: action.finishedAt ?? action.createdAt,
      status: 'observed',
      source: 'Journal des actions MCP',
      explanation: `Action ${action.status}. Les arguments et résultats privés ne sont pas copiés dans le graphe.`,
      outcome: action.status === 'executing' ? 'running' : 'unknown',
      link: { panel: 'connectors', requestId: action.requestId },
    }),
  );
  const pending = actions.filter((action) => action.status === 'pending');
  return {
    nodes,
    signals: pending.map((action) => ({
      id: `mcp-permission:${action.requestId}`,
      level: 'high',
      category: 'permissions',
      reason: `Autorisation MCP requise · ${action.toolName}. Examiner l’action exacte dans Outils et services.`,
      evidenceIds: [`mcp:${action.requestId}`],
      humanResolvable: false,
    })),
  };
}

export function runtimeNodes(context, runtime) {
  return (runtime?.services ?? []).map((service) =>
    evidenceNode(context, {
      id: `runtime:${service.id}`,
      kind: 'runtime',
      label: service.name,
      status: service.health.status === 'not_checked' ? 'missing' : 'observed',
      at: service.health.observedAt ?? context.at,
      freshness: service.health.status === 'healthy' ? 'current' : 'unavailable',
      outcome: service.health.status === 'healthy' ? 'passed' : 'unknown',
      source: 'Sonde HTTP loopback du Studio',
      explanation: `État du service embarqué : ${service.health.status}.`,
      expiresAt: service.health.observedAt
        ? new Date(Date.parse(service.health.observedAt) + 60000).toISOString()
        : undefined,
      limits: runtime.limitations,
      link: { panel: 'code', path: '@runtime/preview.mjs' },
    }),
  );
}

export function convergenceSignature(state, actions) {
  const unknown = actions
    .filter((action) => action.status === 'unknown')
    .map((action) => action.requestId);
  const interrupted = state.jobs.filter((job) => job.status === 'interrupted').map((job) => job.id);
  const repeated = [];
  let previous;
  for (const job of state.jobs) {
    if (
      job.status === 'failed' &&
      previous?.status === 'failed' &&
      digest(job.error) === digest(previous.error)
    )
      repeated.push(previous.id, job.id);
    if (['ready', 'failed'].includes(job.status)) previous = job;
  }
  return unknown.length || interrupted.length || repeated.length
    ? digest(JSON.stringify({ unknown, interrupted, repeated }))
    : null;
}
