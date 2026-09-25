import { digest, safeFile } from './files.mjs';
import { readQualityRuns, writeQualityRun } from './quality-storage.mjs';
import { qualityCatalog } from './quality-catalog.mjs';
import { businessCriteriaObjective } from './quality-criteria.mjs';
import { readConnectorTicket, validateConnectorExecution } from './connectors-tickets.mjs';
import { connectorInterfaceFingerprint } from './connectors.mjs';
import {
  connectorObject,
  connectorId,
  connectorText,
  connectorTool,
  connectorDate,
  connectorMember,
  connectorList,
  connectorDigest,
  connectorPayload,
  rejectConnector,
} from './connectors-validation.mjs';

function findingSource(source) {
  connectorObject(source, ['path', 'line'], 'Source du diagnostic');
  const result = { path: connectorText(source.path, 300, 'Chemin source') };
  if (source.line !== undefined) {
    if (!Number.isSafeInteger(source.line) || source.line < 1 || source.line > 10000000)
      rejectConnector('Ligne source invalide.');
    result.line = source.line;
  }
  return result;
}

function diagnostic(value) {
  connectorObject(value, ['message', 'source', 'target'], 'Diagnostic');
  const result = { message: connectorText(value.message, 2000, 'Message du diagnostic') };
  if (value.source !== undefined) result.source = findingSource(value.source);
  if (value.target !== undefined) {
    result.target = connectorText(value.target, 300, 'Cible du diagnostic');
    if (/https?:|[?@#]/i.test(result.target))
      rejectConnector(
        'Cible sans URL, fragment ou paramètres attendue ; utiliser un libellé expurgé.',
      );
  }
  if (!result.source && !result.target) rejectConnector('Source ou cible du diagnostic requise.');
  return result;
}

function metrics(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length > 40)
    rejectConnector('Métriques invalides.');
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    connectorId(key);
    if (
      !Number.isFinite(value) ||
      Math.abs(value) > 1e15 ||
      ['__proto__', 'prototype', 'constructor'].includes(key)
    )
      rejectConnector('Valeur de métrique invalide.');
    result[key] = value;
  }
  return result;
}

function normalizedResult(input) {
  connectorPayload(input);
  connectorObject(
    input,
    [
      'runId',
      'connectionId',
      'revisionId',
      'fingerprint',
      'tool',
      'source',
      'startedAt',
      'finishedAt',
      'status',
      'observed',
      'findings',
      'metrics',
      'limits',
    ],
    'Résultat externe',
  );
  connectorObject(input.source, ['kind', 'toolName'], 'Provenance');
  const source = {
    kind: connectorMember(
      input.source.kind,
      ['host-local', 'host-api', 'host-mcp'],
      'Type de provenance',
    ),
  };
  if (input.source.toolName !== undefined) source.toolName = connectorId(input.source.toolName);
  const result = {
    runId: connectorId(input.runId),
    connectionId: connectorId(input.connectionId),
    revisionId: connectorId(input.revisionId),
    fingerprint: connectorDigest(input.fingerprint),
    tool: connectorTool(input.tool),
    source,
    startedAt: connectorDate(input.startedAt),
    finishedAt: connectorDate(input.finishedAt),
    status: connectorMember(input.status, ['passed', 'failed', 'blocked'], 'Résultat du contrôle'),
    observed: connectorText(input.observed, 4000, 'Observation'),
    findings: connectorList(input.findings, 100, 'Diagnostics', diagnostic),
    metrics: metrics(input.metrics),
    limits: connectorList(input.limits ?? [], 20, 'Limites', (value) =>
      connectorText(value, 1000, 'Limite'),
    ),
  };
  if (result.status === 'passed' && result.findings.length)
    rejectConnector('Une réussite ne peut pas contenir de diagnostics non résolus.');
  return result;
}

function validateFindingPaths(store, snapshot, findings) {
  for (const finding of findings) {
    if (!finding.source) continue;
    safeFile(store.root, `revisions/${snapshot.revision.id}/app/${finding.source.path}`);
    if (!snapshot.revision.files.some((file) => file.path === finding.source.path))
      rejectConnector('Diagnostic visant un fichier absent de la version.');
  }
}

export function storeExternalQualityResult(store, input) {
  const result = normalizedResult(input),
    ticket = readConnectorTicket(store, result.runId);
  const receiptFingerprint = digest(JSON.stringify(result)),
    runs = readQualityRuns(store);
  const existing = runs.find((run) => run.id === ticket.runId);
  if (existing) {
    if (existing.receiptFingerprint !== receiptFingerprint)
      rejectConnector('Résultat déjà reçu avec un autre contenu.', 409);
    return existing;
  }
  if (runs.length >= 500) rejectConnector('Journal qualité plein.', 429);
  const { snapshot, connection, option } = validateConnectorExecution(store, ticket, result);
  validateFindingPaths(store, snapshot, result.findings);
  const definition = qualityCatalog.find((entry) => entry.id === ticket.checkId);
  const receivedAt = new Date().toISOString();
  const run = {
    schemaVersion: 1,
    id: ticket.runId,
    checkId: ticket.checkId,
    title: definition.title,
    revisionId: ticket.revisionId,
    fingerprint: ticket.fingerprint,
    ...(ticket.businessCriteria ? { businessCriteria: ticket.businessCriteria } : {}),
    ...(ticket.riskRequirement ? { riskRequirement: ticket.riskRequirement } : {}),
    status: result.status,
    tool: result.tool.name,
    toolVersion: result.tool.version,
    source: result.source,
    provider: {
      connectionId: connection.id,
      optionId: option.id,
      connectionVersion: connection.version,
      probeId: ticket.probeId,
      attestation: 'host-bridge',
      ...(result.source.kind === 'host-mcp'
        ? {
            interfaceFingerprint: connectorInterfaceFingerprint(
              connection.probe,
              result.source.toolName,
            ),
          }
        : {}),
    },
    environment: 'Résultat rapporté par l’agent hôte ; exécution hors du runtime Studio.',
    expected: ticket.businessCriteria
      ? businessCriteriaObjective(ticket.businessCriteria)
      : definition.objective,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: Date.parse(result.finishedAt) - Date.parse(result.startedAt),
    observed: result.observed,
    findings: result.findings,
    metrics: result.metrics,
    limits: [
      ...result.limits,
      'Provenance attestée par l’hôte authentifié ; le Studio vérifie le ticket et l’intégrité des sources, pas l’exécution distante.',
    ],
    events: [{ label: 'Résultat externe reçu, ticket et empreinte contrôlés.', at: receivedAt }],
    receiptFingerprint,
  };
  writeQualityRun(store, run);
  return run;
}
