import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import { recordCheck } from './domain.mjs';
import { projectCapabilities, qualityCatalog, qualityCategories } from './quality-catalog.mjs';
import { qualityAdapters } from './quality-adapters.mjs';
import { qualitySnapshot, readQualityRuns, writeQualityRun } from './quality-storage.mjs';
import { connectorOffers } from './connectors-catalog.mjs';
import { storeExternalQualityResult } from './quality-external.mjs';
import { activeQualityRuns as activeRuns, readNormalizedQualityRuns } from './quality-evidence.mjs';
import { readBrowserConfiguration, browserConfigurationMatches } from './browser-configuration.mjs';
import { readBrowserScenarios } from './browser-scenarios.mjs';
import { captureBusinessCriteria, businessCriteriaFingerprint } from './quality-criteria.mjs';
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

function runtimeRow(check, snapshot, selectedId) {
  const row = legacyRow(check, snapshot, selectedId);
  return {
    ...row,
    category: 'operations',
    tool: 'Signal de l’aperçu navigateur — non attesté',
    reason: 'Signal à reproduire ; aucune commande exécutée ni validation métier déduite.',
    evidence: {
      ...row.evidence,
      fingerprint: check.fingerprint,
      environment: 'Aperçu intégré du Studio ; événement rapporté par la page',
      tool: 'Collecteur navigateur',
      observed: check.output,
      limits: [
        'La page peut imiter ce signal. Une reproduction indépendante est requise ; aucune réussite ne peut être déduite de son absence.',
      ],
    },
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

function browserConfiguration(store) {
  try {
    return readBrowserConfiguration(store);
  } catch {
    return {
      enabled: false,
      driverAvailable: false,
      reason: 'Configuration du navigateur illisible ; aucune exécution autorisée.',
    };
  }
}

function browserRow(row, snapshot, configuration, state) {
  if (row.id !== 'business-browser' || row.status === 'notapplicable') return row;
  let reason = '';
  try {
    const plan = readBrowserScenarios(snapshot);
    const known = new Set((state.brief?.criteria ?? []).map(({ id }) => id));
    if (plan.scenarios.some((scenario) => scenario.criterionIds.some((id) => !known.has(id))))
      reason =
        'Un scénario désigne un critère absent du cadrage actuel ; corriger son lien avant exécution.';
  } catch (error) {
    reason = error.message;
  }
  if (!configuration.enabled || !configuration.driverAvailable || !configuration.configurationId)
    reason = configuration.reason;
  if (reason) return { ...row, canRun: false, status: row.evidence?.status ?? 'blocked', reason };
  return row;
}

export function readProjectQuality(store, revisionId, analysis) {
  const { state, revision } = revisionFrom(store, revisionId),
    snapshot = qualitySnapshot(store, revision);
  const normalized = readNormalizedQualityRuns(store, revision, snapshot);
  const capabilities = projectCapabilities(revision, snapshot.sources);
  const browser = browserConfiguration(store);
  const checks = qualityCatalog.map((definition) =>
    browserRow(
      catalogueRow(
        projectDefinition(definition, state),
        capabilities,
        snapshot,
        normalized.find((run) => run.revisionId === revision.id && run.checkId === definition.id),
      ),
      snapshot,
      browser,
      state,
    ),
  );
  const linked = new Set(normalized.map((run) => run.linkedCheckId));
  const recorded = state.checks
    .filter((check) => !linked.has(check.id))
    .map((check) =>
      check.kind === 'runtime-observation'
        ? runtimeRow(check, snapshot, revision.id)
        : legacyRow(check, snapshot, revision.id),
    );
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
    browser,
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

function finishRun(store, run, result, snapshot, signal) {
  const exact = qualitySnapshot(store, snapshot.revision);
  const changed =
    exact.issue ||
    exact.fingerprint !== snapshot.fingerprint ||
    (run.businessCriteria &&
      run.businessCriteria.fingerprint !== businessCriteriaFingerprint(store.read())) ||
    (run.checkId === 'business-browser' &&
      !browserConfigurationMatches(run, browserConfiguration(store)));
  run.status =
    changed || signal?.aborted
      ? 'blocked'
      : result.status || (result.findings.length ? 'failed' : 'passed');
  run.observed = signal?.aborted
    ? 'Contrôle interrompu ; aucun résultat tardif positif enregistré.'
    : changed
      ? 'Sources, critères ou configuration modifiés pendant le contrôle ; résultat à réévaluer, aucune réussite enregistrée.'
      : result.observed;
  run.findings = result.findings.slice(0, 100);
  if (result.metrics) run.metrics = result.metrics;
  if (result.browser) {
    run.browser = result.browser;
    run.protocol = result.browser.protocol;
    run.toolVersion = result.browser.driverVersion;
    run.environment += ` · ${result.browser.channel} ${result.browser.browserVersion || 'version inconnue'}`;
    run.reportedCriterionIds = [
      ...new Set(result.browser.scenarios.flatMap((scenario) => scenario.criterionIds)),
    ];
  }
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

export async function runProjectQuality(store, revisionId, checkId, { signal, timeoutMs } = {}) {
  const definition = qualityCatalog.find((check) => check.id === checkId);
  if (!definition) reject('Contrôle inconnu.');
  const { revision } = revisionFrom(store, revisionId),
    snapshot = qualitySnapshot(store, revision);
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
    schemaVersion: 1,
    id: randomUUID(),
    checkId,
    source: { kind: 'studio-adapter' },
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
  if (checkId === 'business-browser') {
    run.browserConfigurationVersion = report.browser.version;
    run.browserConfigurationId = report.browser.configurationId;
    run.browserChannel = report.browser.channel;
    run.browserDriverVersion = report.browser.driverVersion;
    run.reportedCriterionIds = [
      ...new Set(
        readBrowserScenarios(snapshot).scenarios.flatMap((scenario) => scenario.criterionIds),
      ),
    ];
    const state = store.read();
    run.businessCriteria = state.brief?.criteria?.length
      ? captureBusinessCriteria(state)
      : { criteria: [], fingerprint: businessCriteriaFingerprint(state) };
  }
  active.set(run.id, run);
  try {
    writeQualityRun(store, run);
    signal?.throwIfAborted();
    const result = await qualityAdapters[definition.adapter](snapshot, {
      channel: report.browser.channel,
      signal,
      ...(timeoutMs !== undefined ? { timeoutMs } : {}),
    });
    finishRun(store, run, result, snapshot, signal);
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
