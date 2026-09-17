import fs from 'node:fs';
import path from 'node:path';
import { atomicJSON, digest, safeFile } from './files.mjs';
import { qualitySnapshot } from './quality-storage.mjs';
import {
  connectorCapabilities,
  connectorOptions,
  capabilityChecks,
} from './connectors-catalog.mjs';
import {
  connectorObject,
  connectorId,
  connectorText,
  connectorReference,
  connectorTool,
  connectorDate,
  connectorMember,
  connectorList,
  connectorDigest,
  connectorPayload,
  rejectConnector,
} from './connectors-validation.mjs';

export const connectorLimits = Object.freeze({
  connections: 32,
  probes: 200,
  tools: 40,
  inputBytes: 65536,
  ticketMs: 30 * 60 * 1000,
});

function optionFrom(id) {
  const option = connectorOptions.find((entry) => entry.id === id);
  if (!option) rejectConnector('Option de connecteur inconnue.');
  return option;
}

function configureFields(input) {
  const option = optionFrom(input.optionId);
  if (input.purpose !== option.purpose) rejectConnector('Usage incompatible avec ce connecteur.');
  const refs = connectorList(
    input.secretRefs ?? [],
    8,
    'Références de secrets',
    connectorReference,
  );
  if (new Set(refs).size !== refs.length) rejectConnector('Référence de secret répétée.');
  let profileRef = null;
  if (input.profileRef != null) {
    profileRef = connectorReference(input.profileRef);
    if (!profileRef.startsWith('host:')) rejectConnector('Le profil doit référencer host:nom.');
  }
  return {
    id: connectorId(input.id),
    optionId: option.id,
    purpose: option.purpose,
    profileRef,
    secretRefs: refs,
  };
}

function storedProbe(probe, option) {
  if (probe === null) return null;
  connectorObject(
    probe,
    ['id', 'status', 'observedAt', 'receivedAt', 'tool', 'capabilities', 'tools', 'summary'],
    'Attestation',
  );
  connectorId(probe.id);
  connectorMember(probe.status, ['available', 'failed'], 'Résultat du probe');
  connectorDate(probe.observedAt);
  connectorDate(probe.receivedAt);
  connectorTool(probe.tool);
  connectorList(probe.capabilities, 8, 'Capacités', (value) =>
    connectorMember(value, option.capabilities, 'Capacité'),
  );
  connectorList(probe.tools, connectorLimits.tools, 'Outils MCP', (tool) => {
    connectorObject(
      tool,
      ['name', 'inputSchemaFingerprint', 'outputSchemaFingerprint'],
      'Outil MCP',
    );
    connectorId(tool.name);
    if (tool.inputSchemaFingerprint) connectorDigest(tool.inputSchemaFingerprint);
    if (tool.outputSchemaFingerprint) connectorDigest(tool.outputSchemaFingerprint);
  });
  connectorText(probe.summary, 2000, 'Résumé du probe');
  return probe;
}

function storedConnection(entry) {
  connectorObject(
    entry,
    ['id', 'optionId', 'purpose', 'profileRef', 'secretRefs', 'version', 'configuredAt', 'probe'],
    'Connecteur',
  );
  configureFields(entry);
  if (!Number.isSafeInteger(entry.version) || entry.version < 1)
    rejectConnector('Version de connecteur invalide.');
  connectorDate(entry.configuredAt);
  storedProbe(entry.probe, optionFrom(entry.optionId));
  return entry;
}

function readConnections(store) {
  const file = safeFile(store.root, '.devmethod/connectors.json');
  if (!fs.existsSync(file)) return { schemaVersion: 1, connections: [], receipts: [] };
  if (fs.statSync(file).size > 1024 * 1024)
    rejectConnector('Registre de connecteurs trop volumineux.');
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    rejectConnector('Registre de connecteurs illisible ; aucun remplacement.');
  }
  connectorObject(value, ['schemaVersion', 'connections', 'receipts'], 'Registre de connecteurs');
  if (value.schemaVersion !== 1) rejectConnector('Version du registre de connecteurs inconnue.');
  connectorList(value.connections, connectorLimits.connections, 'Connecteurs', storedConnection);
  if (new Set(value.connections.map((entry) => entry.id)).size !== value.connections.length)
    rejectConnector('Identifiant de connecteur répété.');
  connectorList(value.receipts, connectorLimits.probes, 'Reçus de probes', (receipt) => {
    connectorObject(receipt, ['connectionId', 'eventId', 'fingerprint'], 'Reçu de probe');
    connectorId(receipt.connectionId);
    connectorId(receipt.eventId);
    connectorDigest(receipt.fingerprint);
  });
  return value;
}

function writeConnections(store, value) {
  const file = safeFile(store.root, '.devmethod/connectors.json');
  if (Buffer.byteLength(JSON.stringify(value)) > 1024 * 1024)
    rejectConnector('Registre de connecteurs plein.');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  atomicJSON(file, value);
}

function publicConnection(entry) {
  return {
    ...entry,
    status: entry.probe
      ? entry.probe.status === 'available'
        ? 'attested'
        : 'failed'
      : 'configured',
  };
}

export function readProjectConnectors(store, revisionId) {
  const state = store.read();
  const selected = revisionId || state.activeRevision || null;
  if (selected && !state.revisions.some((revision) => revision.id === selected))
    rejectConnector('Version inconnue.', 404);
  return {
    schemaVersion: 1,
    revisionId: selected,
    catalog: { capabilities: connectorCapabilities, options: connectorOptions },
    connections: readConnections(store).connections.map(publicConnection),
    limits: [
      'Configuration et attestation hôte ne signifient pas intégration exécutée dans l’application.',
      'Aucun client MCP/API, installation, provisionnement ou envoi de mail automatique dans ce panneau.',
      'Les références de secrets désignent des accès conservés par l’hôte ; le Studio ne les résout pas.',
    ],
  };
}

export function configureProjectConnector(store, input) {
  connectorPayload(input);
  connectorObject(
    input,
    ['id', 'optionId', 'purpose', 'profileRef', 'secretRefs', 'expectedVersion'],
    'Configuration',
  );
  const fields = configureFields(input),
    data = readConnections(store);
  const current = data.connections.find((entry) => entry.id === fields.id);
  if ((input.expectedVersion ?? 0) !== (current?.version ?? 0))
    rejectConnector('Configuration modifiée ; relire avant de sauvegarder.', 409);
  if (!current && data.connections.length >= connectorLimits.connections)
    rejectConnector('Limite de connecteurs atteinte.', 429);
  const next = {
    ...fields,
    version: (current?.version ?? 0) + 1,
    configuredAt: new Date().toISOString(),
    probe: null,
  };
  if (current) data.connections[data.connections.indexOf(current)] = next;
  else data.connections.push(next);
  writeConnections(store, data);
  return readProjectConnectors(store);
}

function schemaFingerprint(schema) {
  if (schema === undefined) return undefined;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema))
    rejectConnector('Schéma d’outil invalide.');
  const text = JSON.stringify(schema);
  if (text.length > 4096) rejectConnector('Schéma d’outil trop long.');
  connectorText(text, 4096, 'Schéma d’outil');
  return digest(text);
}

function probeTools(input) {
  const tools = connectorList(input ?? [], connectorLimits.tools, 'Outils MCP', (tool) => {
    connectorObject(tool, ['name', 'inputSchema', 'outputSchema'], 'Outil MCP');
    const result = { name: connectorId(tool.name) };
    const inputSchemaFingerprint = schemaFingerprint(tool.inputSchema),
      outputSchemaFingerprint = schemaFingerprint(tool.outputSchema);
    if (inputSchemaFingerprint) result.inputSchemaFingerprint = inputSchemaFingerprint;
    if (outputSchemaFingerprint) result.outputSchemaFingerprint = outputSchemaFingerprint;
    return result;
  });
  if (new Set(tools.map((tool) => tool.name)).size !== tools.length)
    rejectConnector('Outil MCP répété.');
  return tools;
}

export function reportConnectorProbe(store, input) {
  connectorPayload(input);
  connectorObject(
    input,
    [
      'connectionId',
      'connectionVersion',
      'eventId',
      'status',
      'tool',
      'capabilities',
      'tools',
      'observedAt',
      'summary',
    ],
    'Rapport de probe',
  );
  const data = readConnections(store);
  const connection = data.connections.find((entry) => entry.id === connectorId(input.connectionId));
  if (!connection) rejectConnector('Connecteur inconnu.', 404);
  const option = optionFrom(connection.optionId);
  const probe = {
    id: connectorId(input.eventId),
    status: connectorMember(input.status, ['available', 'failed'], 'Résultat du probe'),
    observedAt: connectorDate(input.observedAt),
    receivedAt: new Date().toISOString(),
    tool: connectorTool(input.tool),
    capabilities: connectorList(input.capabilities, 8, 'Capacités', (value) =>
      connectorMember(value, option.capabilities, 'Capacité'),
    ),
    tools: probeTools(input.tools),
    summary: connectorText(
      input.summary ?? 'Observation rapportée par l’agent hôte.',
      2000,
      'Résumé du probe',
    ),
  };
  const fingerprint = digest(
    JSON.stringify({ ...probe, receivedAt: undefined, connectionVersion: input.connectionVersion }),
  );
  const previous = data.receipts.find(
    (receipt) => receipt.connectionId === connection.id && receipt.eventId === probe.id,
  );
  if (previous) {
    if (previous.fingerprint !== fingerprint)
      rejectConnector('Rejeu du probe avec un contenu différent.', 409);
    return readProjectConnectors(store);
  }
  if (input.connectionVersion !== connection.version)
    rejectConnector('Probe lié à une ancienne configuration.', 409);
  if (connection.probe && Date.parse(probe.observedAt) < Date.parse(connection.probe.observedAt))
    rejectConnector('Probe antérieur à la dernière observation enregistrée.', 409);
  if (
    Date.parse(probe.observedAt) < Date.parse(connection.configuredAt) ||
    Date.parse(probe.observedAt) > Date.now() + 300000
  )
    rejectConnector('Date du probe hors de la configuration courante.', 409);
  if (
    probe.status === 'available' &&
    (!probe.capabilities.length || (option.transport === 'mcp' && !probe.tools.length))
  )
    rejectConnector('Capacités et outils observés manquants.');
  if (data.receipts.length >= connectorLimits.probes)
    rejectConnector('Journal de probes plein.', 429);
  connection.probe = probe;
  data.receipts.push({ connectionId: connection.id, eventId: probe.id, fingerprint });
  writeConnections(store, data);
  return readProjectConnectors(store);
}

export function diagnosticConnector(store, connectionId, checkId) {
  const connection = readConnections(store).connections.find(
    (entry) => entry.id === connectorId(connectionId),
  );
  if (!connection) rejectConnector('Connecteur inconnu.', 404);
  const option = optionFrom(connection.optionId);
  if (connection.purpose !== 'diagnostics' || !option.checkIds.includes(checkId))
    rejectConnector('Ce connecteur ne prend pas en charge ce contrôle.');
  if (connection.probe?.status !== 'available')
    rejectConnector('Un probe disponible attesté par l’hôte est requis.', 409);
  if (
    !connection.probe.capabilities.some((capability) =>
      capabilityChecks[capability]?.includes(checkId),
    )
  )
    rejectConnector('La capacité de ce contrôle n’a pas été attestée.', 409);
  return { connection: publicConnection(connection), option };
}

export function connectorInterfaceFingerprint(probe, toolName) {
  const tool = probe?.tools.find((entry) => entry.name === toolName);
  return tool ? digest(JSON.stringify(tool)) : null;
}

export function selectedConnectorRevision(store, revisionId) {
  const state = store.read(),
    revision = state.revisions.find((entry) => entry.id === revisionId);
  if (!revision) rejectConnector('Version inconnue.', 404);
  const snapshot = qualitySnapshot(store, revision);
  if (snapshot.issue) rejectConnector(snapshot.issue, 409);
  return snapshot;
}

export function currentConnectorRevision(store, revisionId) {
  if (revisionId !== store.read().activeRevision)
    rejectConnector('Version obsolète ; sélectionner la version appliquée.', 409);
  return selectedConnectorRevision(store, revisionId);
}

export function prepareConnectorIntegration(store, input) {
  connectorObject(input, ['connectionId', 'revisionId', 'capability'], 'Demande d’intégration');
  const snapshot = currentConnectorRevision(store, input.revisionId);
  const connection = readConnections(store).connections.find(
    (entry) => entry.id === connectorId(input.connectionId),
  );
  if (!connection || connection.purpose !== 'application')
    rejectConnector('Connecteur applicatif attendu.');
  const option = optionFrom(connection.optionId);
  connectorMember(input.capability, option.capabilities, 'Capacité');
  const title = `Préparer l’intégration : ${option.title}`;
  const prompt = [
    title,
    `Capacité : ${input.capability}. Version : ${snapshot.revision.id}. Empreinte : ${snapshot.fingerprint}.`,
    `Connecteur : ${connection.id}, configuration ${connection.version}. État : ${publicConnection(connection).status}. Documentation : ${option.docs}.`,
    'Examiner les dépendances et services existants, proposer les changements et les contrôles utiles, puis respecter la délégation et les décisions du projet.',
    'Cette demande prépare une intégration : elle n’autorise ni provisionnement, dépense, migration de production, envoi de mail, ni modification d’un service externe.',
    'Utiliser seulement les références de secrets conservées par l’hôte. Ne jamais placer les clés dans le code client, les documents du projet ou un export.',
    'Rapporter ce qui est implémenté, ce qui a réellement été essayé et les accès ou décisions encore nécessaires. Ne pas simuler un service absent.',
  ].join('\n');
  return {
    kind: 'integrate',
    title,
    prompt,
    revisionId: snapshot.revision.id,
    connectionId: connection.id,
    capability: input.capability,
  };
}

export { prepareExternalQualityRun } from './connectors-tickets.mjs';
