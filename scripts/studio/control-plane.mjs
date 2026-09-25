import {
  evaluateControl,
  markAttentionRead,
  resolveAttention,
} from '../../dist/control-plane/engine.js';
import { businessCriteriaFingerprint } from './quality-criteria.mjs';
import { digest } from './files.mjs';
import { controlContinuation, continueVerifiedRevision } from './domain.mjs';
import { runnerStop, progressNodes, observedSecuritySignals } from './control-runtime.mjs';
import {
  sourceContext,
  checkDependencies,
  qualityNodes,
  declaredNodes,
  jobNodes,
  changeSignals,
  controlAction,
  graphEdges,
} from './control-sources.mjs';
import {
  analysisNodes,
  mcpObservations,
  runtimeNodes,
  convergenceSignature,
} from './control-observations.mjs';

const reject = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

function collectSources(store, intelligence, quality, broker, revision, sourceIssues) {
  const result = { quality: null, model: null, actions: [] };
  if (revision) {
    try {
      result.quality = quality.readProjectQuality(store, revision.id);
    } catch {
      sourceIssues.push('Qualité indisponible : journal illisible ou sources non vérifiables.');
    }
    try {
      const state = store.read();
      const job = state.jobs.find((entry) => entry.id === revision.jobId);
      result.model = intelligence.read({
        revisionId: revision.id,
        baseRevisionId: job?.baseRevision,
      });
    } catch {
      sourceIssues.push('Analyse projet indisponible ; aucune architecture validée déduite.');
    }
  } else sourceIssues.push('Aucune version disponible à vérifier.');
  try {
    result.actions = broker?.actions({}).actions ?? [];
  } catch {
    sourceIssues.push('Journal MCP indisponible ; permissions et effets inconnus.');
  }
  return result;
}

function currentDependencies(state, revision, quality) {
  const dependencies = {
    intention: digest(state.brief.outcome || state.project.idea),
    criteria: businessCriteriaFingerprint(state),
  };
  if (revision) {
    Object.assign(
      dependencies,
      Object.fromEntries(revision.files.map((file) => [`file:${file.path}`, file.sha256])),
    );
    for (const row of quality?.checks ?? [])
      Object.assign(dependencies, checkDependencies(revision, row.id));
  }
  return dependencies;
}

function collectInput(store, intelligence, quality, broker, runtimeObservation, revisionId) {
  const state = store.read(),
    at = new Date().toISOString();
  const revision =
    state.revisions.find((entry) => entry.id === (revisionId || state.activeRevision)) ??
    state.revisions.at(-1);
  const sourceIssues = [];
  const sources = collectSources(store, intelligence, quality, broker, revision, sourceIssues);
  if (revisionId && revision?.id !== revisionId) reject('Version inconnue.', 404);
  const context = {
    ...sourceContext(state, revision, at),
    projectId:
      state.controlPlane?.snapshot.input.projectId ??
      `project:${digest(state.events[0]?.id ?? store.root).slice(0, 24)}`,
  };
  const mcp = mcpObservations(context, sources.actions);
  const nodes = [
    ...declaredNodes(context, state, revision),
    ...qualityNodes(context, state, sources.quality),
    ...analysisNodes(context, sources.model),
    ...jobNodes(context, state),
    ...progressNodes(store, context, sourceIssues),
    ...mcp.nodes,
    ...(runtimeObservation
      ? runtimeNodes(context, runtimeObservation)
      : (state.controlPlane?.snapshot.input.nodes ?? []).filter((node) => node.kind === 'runtime')),
  ];
  if (sources.quality?.localChanges)
    sourceIssues.push('Les fichiers locaux diffèrent du manifeste ; vérifier leur intégrité.');
  return {
    ...context,
    requested: state.project.mode,
    action: controlAction(state, revision),
    nodes,
    edges: graphEdges(nodes),
    dependencies: currentDependencies(state, revision, sources.quality),
    signals: [...changeSignals(state, revision), ...mcp.signals, ...observedSecuritySignals(nodes)],
    sourceIssues,
    stopSignature: convergenceSignature(state, sources.actions) ?? runnerStop(store, sourceIssues),
  };
}

export async function createControlPlane({ store, editor, broker, agent }) {
  const modules = await Promise.allSettled([
    import('./quality.mjs'),
    import('./intelligence.mjs'),
    import('./risk-service.mjs'),
  ]);
  const quality = modules[0].status === 'fulfilled' ? modules[0].value : null;
  const intelligence =
    modules[1].status === 'fulfilled'
      ? modules[1].value.createProjectIntelligence({ store, editor })
      : null;
  let runtimeObservation;
  const riskModule = modules[2].status === 'fulfilled' ? modules[2].value : null;
  const riskService = riskModule?.createRiskService({ store, agent });

  function read(revisionId) {
    const input = collectInput(
      store,
      intelligence,
      quality,
      broker,
      runtimeObservation,
      revisionId,
    );
    let hybrid;
    if (input.revisionId) {
      try {
        hybrid = riskService.read(input.revisionId).report;
        riskModule.applyRiskProfile(input, hybrid);
        input.edges = graphEdges(input.nodes);
      } catch {
        input.sourceIssues.push('Analyse de changement indisponible ; aucune couverture déduite.');
      }
    }
    const previous = store.read();
    const plane = evaluateControl(input, previous.controlPlane);
    const next =
      JSON.stringify(plane) === JSON.stringify(previous.controlPlane)
        ? previous
        : store.commit(previous.version, (draft) => {
            draft.controlPlane = plane;
          });
    return {
      ...next.controlPlane,
      ...(hybrid ? { hybrid } : {}),
      version: next.version,
      revisions: next.revisions.map(({ id, title }) => ({ id, title })),
      continuation: controlContinuation(next),
    };
  }

  function mutate(input, action) {
    const current = store.read();
    if (input.snapshotKey !== current.controlPlane?.snapshot.key)
      reject('L’état a changé ; rechargez avant de décider.', 409);
    const report = read(current.controlPlane.snapshot.input.revisionId);
    if (input.version !== report.version || input.snapshotKey !== report.snapshot.key)
      reject('L’état a changé ; rechargez avant de décider sur cette version.', 409);
    store.commit(input.version, (draft) => action(draft.controlPlane));
    return read(report.snapshot.input.revisionId);
  }

  return {
    read,
    analyze(input) {
      read(input.revisionId);
      if (!riskService) reject('Analyse contextuelle indisponible : dépendances manquantes.', 503);
      riskService.start(input);
      return read(input.revisionId);
    },
    cancelAnalysis(input) {
      if (!riskService) reject('Analyse contextuelle indisponible.', 503);
      riskService.cancel(input.id);
      return read();
    },
    async close() {
      await riskService?.close();
    },
    continue(input) {
      const report = read(store.read().controlPlane?.snapshot.input.revisionId);
      if (report.version !== input.version || report.snapshot.key !== input.snapshotKey)
        reject('Les preuves ont changé ; rechargez avant de poursuivre.', 409);
      store.commit(report.version, continueVerifiedRevision);
      return read(report.snapshot.input.revisionId);
    },
    decide(input) {
      const existing = store
        .read()
        .controlPlane?.interventions.find((entry) => entry.itemId === input.itemId);
      if (existing?.resolution === input.resolution && existing?.reason === input.reason)
        return read();
      return mutate(input, (plane) =>
        resolveAttention(
          plane,
          { itemId: input.itemId, resolution: input.resolution, reason: input.reason },
          new Date().toISOString(),
        ),
      );
    },
    markRead(input) {
      return mutate(input, (plane) => markAttentionRead(plane, new Date().toISOString()));
    },
    async verify(input) {
      const report = read(input.revisionId);
      const node = report.snapshot.nodes.find((entry) => entry.checkId === input.checkId);
      if (!node?.canRun)
        reject(
          'Ce contrôle nécessite un outil externe ; ouvrez Vérifications pour préparer sa procédure.',
          409,
        );
      await quality.runProjectQuality(
        store,
        report.snapshot.input.revisionId,
        node.checkId,
        input.requestId,
      );
      return read(input.revisionId);
    },
    observeRuntime(value) {
      runtimeObservation = value;
      return read();
    },
    admit(kind) {
      const report = read();
      const decision = report.snapshot.decision;
      const blocked =
        decision.effective === 'Bounded Stop' ||
        (kind === 'external' && decision.effective !== 'Auto-Continue');
      if (blocked) reject(`${decision.effective} : ${decision.justification}`, 409);
      return decision;
    },
  };
}
