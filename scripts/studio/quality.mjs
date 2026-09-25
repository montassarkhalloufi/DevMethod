import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import { recordCheck } from './domain.mjs';
import { projectCapabilities, qualityCatalog, qualityCategories } from './quality-catalog.mjs';
import { qualityAdapters } from './quality-adapters.mjs';
import { qualitySnapshot, readQualityRuns, writeQualityRun } from './quality-storage.mjs';
import { connectorOffers } from './connectors-catalog.mjs';
import { storeExternalQualityResult } from './quality-external.mjs';
import { readProjectConnectors, connectorInterfaceFingerprint } from './connectors.mjs';
import { businessCriteriaFingerprint } from './quality-criteria.mjs';

const activeRuns = new WeakMap();
const environment = `Node ${process.versions.node} · ${process.platform}/${process.arch} · TypeScript ${ts.version}`;
const reject = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const now = () => new Date().toISOString();

function revisionFrom(store, revisionId) {
  const state = store.read(),
    id = revisionId || state.activeRevision;
  const revision = state.revisions.find((item) => item.id === id);
  if (!revision) reject('Version inconnue : sélectionner une version disponible.', 404);
  return { state, revision };
}

function providerChanged(run, connections) {
  if (!run.provider) return false;
  const current = connections.find((connection) => connection.id === run.provider.connectionId);
  return (
    !current ||
    current.version !== run.provider.connectionVersion ||
    current.optionId !== run.provider.optionId ||
    !current.probe ||
    current.probe.tool.name !== run.tool ||
    current.probe.tool.version !== run.toolVersion ||
    (run.source?.kind === 'host-mcp' &&
      connectorInterfaceFingerprint(current.probe, run.source.toolName) !==
        run.provider.interfaceFingerprint)
  );
}

function runEvidence(run, snapshot, selectedId, active, connections, criteriaFingerprint) {
  const interrupted = run.status === 'running' && !active?.has(run.id);
  return {
    ...run,
    status: interrupted ? 'blocked' : run.status,
    observed: interrupted
      ? 'Exécution interrompue ; relancer explicitement le contrôle.'
      : run.observed,
    freshness:
      run.revisionId !== selectedId
        ? 'obsolete'
        : snapshot.issue ||
            run.fingerprint !== snapshot.fingerprint ||
            (run.checkId === 'business-journey' &&
              run.businessCriteria?.fingerprint !== criteriaFingerprint) ||
            providerChanged(run, connections)
          ? 'reevaluate'
          : 'current',
  };
}

function catalogueRow(definition, capabilities, snapshot, evidence) {
  const applicable = Boolean(capabilities[definition.scope]);
  let status = applicable ? 'notrun' : 'notapplicable';
  let reason = applicable
    ? ''
    : `Capacité ${definition.scope} non détectée dans cette version ; confirmer le périmètre si nécessaire.`;
  if (applicable && definition.execution === 'external') {
    status = 'blocked';
    reason = definition.reason;
  }
  if (snapshot.issue) {
    status = 'blocked';
    reason = snapshot.issue;
  }
  if (evidence) status = evidence.status;
  return {
    ...definition,
    status,
    reason,
    freshness: evidence?.freshness ?? (snapshot.issue ? 'reevaluate' : 'current'),
    canRun: applicable && definition.execution === 'studio' && !snapshot.issue,
    evidence: evidence ?? null,
    offers: connectorOffers(definition.id),
  };
}

function legacyRow(check, snapshot, selectedId) {
  return {
    id: `recorded-${check.id}`,
    title: check.label,
    category: 'functional',
    tool: check.command || 'Observation enregistrée par un agent',
    objective: 'Consulter une preuve enregistrée dans le projet.',
    execution: 'recorded',
    canRun: false,
    status: check.status,
    reason: 'Commande historique consultable ; aucun lancement arbitraire depuis ce panneau.',
    freshness:
      check.revisionId !== selectedId ? 'obsolete' : snapshot.issue ? 'reevaluate' : 'current',
    evidence: {
      id: check.id,
      revisionId: check.revisionId,
      status: check.status,
      startedAt: check.createdAt,
      finishedAt: check.createdAt,
      environment: 'Non renseigné dans la preuve historique',
      tool: check.command || check.kind,
      observed:
        'Résultat enregistré par le parcours de livraison. Le journal brut reste accessible dans les preuves historiques ; il n’est pas recopié ici pour éviter d’exposer des valeurs sensibles.',
      expected: check.label,
      durationMs: null,
      findings: [],
      events: [],
      limits: [
        'Périmètre limité à ce contrôle ; ni validation globale, ni validation humaine déduite. Provenance héritée, empreinte détaillée non enregistrée.',
      ],
    },
  };
}

function projectDefinition(definition, state) {
  if (definition.id !== 'business-journey') return definition;
  const criteria = (state.brief?.criteria ?? []).map((criterion) => criterion.text);
  return {
    ...definition,
    objective: criteria.length
      ? `Critères enregistrés dans le cadrage : ${criteria.join(' ; ').slice(0, 4000)}`
      : 'Aucun critère métier enregistré dans le cadrage de ce projet.',
    nextAction: criteria.length
      ? 'Exercer ces critères sur une copie autorisée, conserver les étapes, les résultats attendus et observés et la version exacte.'
      : 'Enregistrer d’abord les critères observables dans Conception, puis choisir les scénarios utiles au projet.',
  };
}

export function readProjectQuality(store, revisionId, analysis) {
  const { state, revision } = revisionFrom(store, revisionId),
    snapshot = qualitySnapshot(store, revision);
  const runs = readQualityRuns(store),
    active = activeRuns.get(store);
  let connections = [];
  if (runs.some((run) => run.provider)) {
    try {
      connections = readProjectConnectors(store).connections;
    } catch {
      /* Unavailable configuration invalidates dependent evidence only. */
    }
  }
  const criteriaFingerprint = businessCriteriaFingerprint(state);
  const normalized = runs.map((run) =>
    runEvidence(run, snapshot, revision.id, active, connections, criteriaFingerprint),
  );
  const capabilities = projectCapabilities(revision, snapshot.sources);
  const checks = qualityCatalog.map((definition) =>
    catalogueRow(
      projectDefinition(definition, state),
      capabilities,
      snapshot,
      normalized.find((run) => run.revisionId === revision.id && run.checkId === definition.id),
    ),
  );
  const linked = new Set(runs.map((run) => run.linkedCheckId));
  const recorded = state.checks
    .filter((check) => !linked.has(check.id))
    .map((check) => legacyRow(check, snapshot, revision.id));
  const historical = normalized
    .filter((run) => run.revisionId !== revision.id)
    .map((evidence) => ({
      ...qualityCatalog.find((check) => check.id === evidence.checkId),
      id: `history-${evidence.id}`,
      status: evidence.status,
      freshness: 'obsolete',
      canRun: false,
      evidence,
    }));
  return {
    schemaVersion: 1,
    revisionId: revision.id,
    fingerprint: snapshot.fingerprint,
    generatedAt: now(),
    localChanges: Boolean(snapshot.issue),
    environment,
    capabilities,
    categories: qualityCategories,
    checks: [...checks, ...recorded.filter((check) => check.freshness !== 'obsolete')],
    historical: [...historical, ...recorded.filter((check) => check.freshness === 'obsolete')],
    limits: [
      snapshot.issue,
      'Un contrôle réussi ne valide que son périmètre. Les procédures externes ne sont pas exécutées par ce Studio.',
      'L’analyse statique ne démontre ni le comportement réel, ni la qualité visuelle.',
    ].filter(Boolean),
    flowModel:
      analysis?.revisionId === revision.id
        ? { flows: analysis.flows, elements: analysis.elements }
        : null,
  };
}

function finishRun(store, run, result, snapshot) {
  const exact = qualitySnapshot(store, snapshot.revision);
  const changed = exact.issue || exact.fingerprint !== snapshot.fingerprint;
  run.status = changed
    ? 'blocked'
    : result.status || (result.findings.length ? 'failed' : 'passed');
  run.observed = changed
    ? 'Fichiers modifiés pendant le contrôle ; résultat à réévaluer, aucune réussite enregistrée.'
    : result.observed;
  run.findings = result.findings.slice(0, 100);
  if (result.metrics) run.metrics = result.metrics;
  run.limits = [
    ...(result.limits ?? []),
    ...(result.findings.length > 100
      ? ['Les 100 premiers diagnostics sont affichés ; le total reste dans le résumé.']
      : []),
  ];
  run.finishedAt = now();
  run.durationMs = Date.parse(run.finishedAt) - Date.parse(run.startedAt);
  run.events.push({ label: run.observed, at: run.finishedAt });
  if (['passed', 'failed'].includes(run.status)) {
    store.commit(store.read().version, (state) => {
      const recorded = recordCheck(state, {
        revisionId: run.revisionId,
        label: run.title,
        status: run.status,
        kind: 'command',
        command: run.tool,
        output: `${run.observed}\n${run.limits.join('\n')}`.slice(0, 16000),
      });
      run.linkedCheckId = recorded.id;
    });
  }
  writeQualityRun(store, run);
}

export async function runProjectQuality(store, revisionId, checkId, requestId) {
  const definition = qualityCatalog.find((check) => check.id === checkId);
  if (!definition) reject('Contrôle inconnu.');
  const { revision } = revisionFrom(store, revisionId),
    snapshot = qualitySnapshot(store, revision);
  if (qualityRequestReplay(store, revision.id, checkId, requestId))
    return readProjectQuality(store, revision.id);
  const report = readProjectQuality(store, revision.id),
    row = report.checks.find((check) => check.id === checkId);
  if (snapshot.issue) reject(snapshot.issue, 409);
  if (!row.canRun) return report;
  let active = activeRuns.get(store);
  if (!active) {
    active = new Map();
    activeRuns.set(store, active);
  }
  if (active.size) reject('Un contrôle est déjà en cours dans ce projet.', 409);
  if (readQualityRuns(store).length >= 500)
    reject('Journal qualité plein ; archiver explicitement avant de continuer.');
  const run = {
    ...(requestId ? { requestId } : {}),
    schemaVersion: 1,
    id: randomUUID(),
    checkId,
    title: definition.title,
    revisionId: revision.id,
    fingerprint: snapshot.fingerprint,
    status: 'running',
    tool: definition.tool,
    environment,
    expected: definition.objective,
    startedAt: now(),
    finishedAt: null,
    durationMs: null,
    observed: 'Contrôle en cours sur les fichiers de cette version.',
    findings: [],
    limits: [],
    events: [
      { label: 'Empreintes des fichiers confrontées au manifeste de la version.', at: now() },
    ],
  };
  active.set(run.id, run);
  try {
    writeQualityRun(store, run);
    const result = await qualityAdapters[definition.adapter](snapshot);
    finishRun(store, run, result, snapshot);
  } catch {
    run.status = 'blocked';
    run.observed = 'Outil indisponible ou contrôle interrompu ; aucun résultat positif enregistré.';
    run.finishedAt = now();
    run.durationMs = Date.parse(run.finishedAt) - Date.parse(run.startedAt);
    writeQualityRun(store, run);
  } finally {
    active.delete(run.id);
  }
  return readProjectQuality(store, revision.id);
}

export function importExternalQualityResult(store, input) {
  const run = storeExternalQualityResult(store, input);
  return readProjectQuality(store, run.revisionId);
}

function qualityRequestReplay(store, revisionId, checkId, requestId) {
  if (requestId === undefined) return false;
  if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(requestId))
    reject('Identifiant de vérification invalide.');
  const previous = readQualityRuns(store).find((run) => run.requestId === requestId);
  if (!previous) return false;
  if (previous.revisionId !== revisionId || previous.checkId !== checkId)
    reject('Identifiant déjà utilisé pour une autre vérification.', 409);
  return true;
}
