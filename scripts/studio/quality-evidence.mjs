import { qualitySnapshot, readQualityRuns } from './quality-storage.mjs';
import { qualityCatalog } from './quality-catalog.mjs';
import { readProjectConnectors, connectorInterfaceFingerprint } from './connectors.mjs';
import { businessCriteriaFingerprint } from './quality-criteria.mjs';
import { readBrowserConfiguration, browserConfigurationMatches } from './browser-configuration.mjs';
import { readBrowserScenarios } from './browser-scenarios.mjs';
import { projectBrowserCoverage } from './business-coverage.mjs';

// Shared only with the quality executor. A persisted running record is not a process.
export const activeQualityRuns = new WeakMap();

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

function runEvidence(
  run,
  snapshot,
  selectedId,
  active,
  connections,
  criteriaFingerprint,
  browserConfiguration,
) {
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
            ((run.checkId === 'business-journey' || run.businessCriteria) &&
              run.businessCriteria?.fingerprint !== criteriaFingerprint) ||
            (run.checkId === 'business-browser' &&
              !browserConfigurationMatches(run, browserConfiguration)) ||
            providerChanged(run, connections)
          ? 'reevaluate'
          : 'current',
  };
}

// Successful/failed executions replace only the same question, bytes and executor.
// Starting another run, an interrupted run or a changed provider cannot erase a result.
function replacementScope(run) {
  const provider = run.provider;
  return JSON.stringify({
    checkId: run.checkId,
    revisionId: run.revisionId,
    fingerprint: run.fingerprint,
    criteriaFingerprint: run.businessCriteria?.fingerprint ?? null,
    source: run.source?.kind ?? 'legacy-recorded',
    toolName: run.source?.toolName ?? null,
    tool: run.tool,
    toolVersion: run.toolVersion ?? null,
    protocol: run.protocol ?? null,
    browserChannel: run.browserChannel ?? null,
    browserVersion: run.browser?.browserVersion ?? null,
    provider: provider
      ? {
          connectionId: provider.connectionId,
          optionId: provider.optionId,
          connectionVersion: provider.connectionVersion,
          interfaceFingerprint: provider.interfaceFingerprint ?? null,
          attestation: provider.attestation ?? null,
        }
      : null,
  });
}

function orderedAfter(later, earlier) {
  const started = Date.parse(later.startedAt) - Date.parse(earlier.startedAt);
  return (
    started > 0 || (started === 0 && Date.parse(later.finishedAt) > Date.parse(earlier.finishedAt))
  );
}

function replacePreviousRuns(runs) {
  const scopes = new Map(),
    latestByScope = new Map();
  for (const run of runs) {
    if (
      run.freshness !== 'current' ||
      !['passed', 'failed'].includes(run.status) ||
      !Number.isFinite(Date.parse(run.finishedAt))
    )
      continue;
    const scope = replacementScope(run),
      previous = latestByScope.get(scope);
    scopes.set(run.id, scope);
    if (!previous || orderedAfter(run, previous)) latestByScope.set(scope, run);
  }
  return runs.map((run) => {
    const latest = latestByScope.get(scopes.get(run.id));
    return latest && orderedAfter(latest, run)
      ? { ...run, freshness: 'obsolete', supersededBy: latest.id }
      : run;
  });
}

/** Read-only normalization shared by quality UI and execution control. */
export function readNormalizedQualityRuns(
  store,
  revision,
  snapshot = qualitySnapshot(store, revision),
) {
  const runs = readQualityRuns(store);
  let connections = [];
  if (runs.some((run) => run.provider)) {
    try {
      connections = readProjectConnectors(store).connections;
    } catch {
      // Unavailable provider state invalidates dependent evidence only.
    }
  }
  const criteria = businessCriteriaFingerprint(store.read());
  let browserConfiguration = null;
  if (runs.some((run) => run.checkId === 'business-browser')) {
    try {
      browserConfiguration = readBrowserConfiguration(store);
    } catch {
      /* Only browser evidence is invalidated. */
    }
  }
  return replacePreviousRuns(
    runs.map((run) =>
      runEvidence(
        run,
        snapshot,
        revision.id,
        activeQualityRuns.get(store),
        connections,
        criteria,
        browserConfiguration,
      ),
    ),
  );
}

function controlEvidence(run, coverageReviews = []) {
  const definition = qualityCatalog.find((entry) => entry.id === run.checkId);
  // Only the local executor writes this explicit provenance. Legacy or externally
  // attested records remain inspectable without acquiring new execution authority.
  const trusted =
    definition?.execution === 'studio' && run.source?.kind === 'studio-adapter' && !run.provider;
  const provenance =
    run.provider || run.source?.kind?.startsWith('host-')
      ? 'host-attested'
      : trusted
        ? 'studio-adapter'
        : 'legacy-recorded';
  return {
    id: `quality:${run.id}`,
    linkedCheckId: run.linkedCheckId ?? null,
    revisionId: run.revisionId,
    checkId: run.checkId,
    kind: ['business-journey', 'business-browser'].includes(run.checkId) ? 'business' : 'technical',
    provenance,
    trusted,
    ...(trusted ? { executor: 'studio' } : {}),
    protocol: `quality:${run.checkId}`,
    status: run.status,
    freshness: run.freshness,
    supersededBy: run.supersededBy ? `quality:${run.supersededBy}` : null,
    fingerprint: run.fingerprint,
    criteriaFingerprint: run.businessCriteria?.fingerprint ?? null,
    // Executed assertions and local interpretation keep distinct provenance.
    criterionIds: [
      ...new Set(
        coverageReviews.filter((item) => item.contributes).map((item) => item.criterionId),
      ),
    ],
    coverageReviews,
    reportedCriterionIds:
      run.checkId === 'business-browser'
        ? (run.reportedCriterionIds ?? [])
        : (run.businessCriteria?.criteria ?? []).map((criterion) => criterion.id),
    createdAt: run.finishedAt ?? run.startedAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt ?? null,
    environment: run.environment,
    observed: run.observed,
    limits: [...run.limits, ...(trusted ? [] : ['Exécution non attestée par le runtime Studio.'])],
  };
}

/** Synchronous, no TypeScript/compiler import and no mutation. Deduplicate a
 * linkedCheckId against state.checks at the graph boundary, retaining this richer
 * record. Consumers must respect freshness, not only executor and status.
 */
export function readControlQuality(store, revisionId) {
  const state = store.read();
  const revision = state.revisions.find((entry) => entry.id === revisionId);
  if (!revision)
    throw Object.assign(new Error('Version inconnue pour les preuves de contrôle.'), {
      status: 404,
    });
  const snapshot = qualitySnapshot(store, revision);
  let manifest = null;
  try {
    manifest = readBrowserScenarios(snapshot);
  } catch {
    /* Other evidence remains usable. */
  }
  return {
    evidence: readNormalizedQualityRuns(store, revision, snapshot).map((run) =>
      controlEvidence(
        run,
        run.checkId === 'business-browser' ? projectBrowserCoverage(state, run, manifest) : [],
      ),
    ),
    issue: snapshot.issue,
  };
}

export function readControlEvidence(store, revisionId) {
  return readControlQuality(store, revisionId).evidence;
}
