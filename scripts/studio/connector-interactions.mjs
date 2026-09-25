import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { safeFile } from './files.mjs';
import { prepareConnectorGuide, validateConnectorGuideSnapshots } from './connector-guides.mjs';
import {
  connectorObject,
  connectorId,
  connectorDigest,
  connectorDate,
  rejectConnector,
} from './connectors-validation.mjs';
import {
  interactionFile,
  interactionHash,
  interactionVersion,
  knownInteractionGuide,
  partialInteractionGuide,
} from './connector-interactions-storage.mjs';

const contextKey = (state) =>
  interactionHash({
    project: state.project,
    brief: state.brief,
    decisions: state.decisions,
    selectedDesignId: state.selectedDesignId,
    designs: state.designs,
    proposals: state.proposals,
    designJourney: state.designJourney,
  });

function currentClaim(store, jobId, state) {
  try {
    const file = safeFile(store.root, `.devmethod/job-keys/${jobId}.txt`);
    return fs.statSync(file).size === 64 && fs.readFileSync(file, 'utf8') === contextKey(state);
  } catch {
    return false;
  }
}

function validateRecord(record) {
  connectorObject(
    record,
    [
      'id',
      'jobId',
      'optionId',
      'guideVersion',
      'requestedFlowId',
      'version',
      'status',
      'step',
      'input',
      'preparation',
      'createdAt',
      'updatedAt',
      'baseRevision',
      'contextFingerprint',
      'definitionFingerprint',
      'requestEventId',
      'requestFingerprint',
      'lastMutation',
      'cancelReason',
    ],
    'Interaction',
  );
  for (const id of [record.id, record.jobId, record.requestEventId]) connectorId(id);
  if (record.baseRevision !== null) connectorId(record.baseRevision);
  interactionVersion(record.version);
  if (
    record.version < 1 ||
    ![0, 1, 2].includes(record.step) ||
    !['pending', 'answered', 'cancelled'].includes(record.status)
  )
    rejectConnector('État interaction invalide.');
  connectorDigest(record.contextFingerprint);
  connectorDigest(record.definitionFingerprint);
  connectorDigest(record.requestFingerprint);
  connectorDate(record.createdAt);
  connectorDate(record.updatedAt);
  const definition = knownInteractionGuide(record.optionId, record.guideVersion);
  if (
    record.requestedFlowId !== null &&
    !definition.flows.some((flow) => flow.id === record.requestedFlowId)
  )
    rejectConnector('Parcours demandé invalide.');
  partialInteractionGuide(record.optionId, record.input);
  if (record.preparation) validateConnectorGuideSnapshots([record.preparation]);
  if (record.status === 'answered' && !record.preparation) rejectConnector('Réponse absente.');
  if (
    record.preparation &&
    (record.status !== 'answered' ||
      interactionHash(record.preparation.input) !== interactionHash(record.input))
  )
    rejectConnector('Réponse incohérente.');
  if (record.lastMutation) connectorDigest(record.lastMutation);
  if (
    record.cancelReason &&
    !['job-terminal', 'revision-stale', 'context-stale', 'guide-stale'].includes(
      record.cancelReason,
    )
  )
    rejectConnector('Motif invalide.');
}

function validateJournal(value) {
  connectorObject(value, ['format', 'interactions'], 'Journal');
  if (value.format !== 1 || !Array.isArray(value.interactions) || value.interactions.length > 200)
    rejectConnector('Journal invalide.');
  value.interactions.forEach(validateRecord);
  if (new Set(value.interactions.map((entry) => entry.id)).size !== value.interactions.length)
    rejectConnector('Interaction répétée.');
}

export function createConnectorInteractions(
  store,
  { mcpManager, now = () => new Date().toISOString() } = {},
) {
  const file = interactionFile(
    store.root,
    '.devmethod/connector-interactions.json',
    { format: 1, interactions: [] },
    validateJournal,
  );

  function stale(record, state) {
    const job = state.jobs.find((entry) => entry.id === record.jobId);
    if (!job || job.status !== 'running') return 'job-terminal';
    if (job.baseRevision !== state.activeRevision || record.baseRevision !== state.activeRevision)
      return 'revision-stale';
    if (record.contextFingerprint !== contextKey(state)) return 'context-stale';
    if (
      record.definitionFingerprint !==
      interactionHash(knownInteractionGuide(record.optionId, record.guideVersion))
    )
      return 'guide-stale';
    return null;
  }

  function reconcile() {
    const journal = file.read(),
      state = store.read();
    let changed = false;
    for (const record of journal.interactions) {
      const reason = record.status === 'pending' ? stale(record, state) : null;
      if (!reason) continue;
      Object.assign(record, {
        status: 'cancelled',
        cancelReason: reason,
        updatedAt: now(),
        version: record.version + 1,
      });
      changed = true;
    }
    if (changed) file.write(journal);
    return journal;
  }

  function publicRecord(record) {
    const publicValue = structuredClone(record);
    for (const key of [
      'contextFingerprint',
      'requestFingerprint',
      'requestEventId',
      'lastMutation',
    ])
      delete publicValue[key];
    const native = record.preparation?.nativeConnection;
    const observed =
      native &&
      mcpManager
        ?.list()
        .connections.find(
          (connection) =>
            connection.provider === native.providerId &&
            connection.url === native.url &&
            connection.status === 'connected',
        );
    return {
      ...structuredClone(publicValue),
      definition: knownInteractionGuide(record.optionId, record.guideVersion),
      prerequisites: (record.preparation?.prerequisites ?? []).map((label) => ({
        label,
        status: 'to-configure',
      })),
      accessObservation: observed
        ? {
            status: 'verified',
            kind: 'mcp-discovery',
            connectionId: observed.id,
            connectionVersion: observed.version,
            observedAt: observed.connectedAt,
            tools: observed.tools.length,
          }
        : { status: 'not-observed' },
    };
  }

  function request(input) {
    connectorObject(
      input,
      ['jobId', 'eventId', 'optionId', 'guideVersion', 'flowId'],
      'Demande de guide',
    );
    connectorId(input.jobId);
    connectorId(input.eventId);
    if (input.guideVersion !== 1) rejectConnector('Version de guide requise.');
    const definition = knownInteractionGuide(input.optionId, input.guideVersion);
    const requestedFlowId = input.flowId ?? null;
    if (requestedFlowId && !definition.flows.some((flow) => flow.id === requestedFlowId))
      rejectConnector('Parcours demandé inconnu.');
    const normalized = {
        jobId: input.jobId,
        eventId: input.eventId,
        optionId: definition.optionId,
        guideVersion: definition.guideVersion,
        flowId: requestedFlowId,
      },
      fingerprint = interactionHash(normalized);
    const journal = reconcile(),
      state = store.read();
    const prior = journal.interactions.find(
      (entry) => entry.jobId === input.jobId && entry.requestEventId === input.eventId,
    );
    if (prior) {
      if (prior.requestFingerprint !== fingerprint)
        rejectConnector('Identifiant de demande déjà utilisé avec un autre guide.', 409);
      return { interaction: publicRecord(prior) };
    }
    const job = state.jobs.find((entry) => entry.id === input.jobId);
    if (!job || job.status !== 'running' || job.baseRevision !== state.activeRevision)
      rejectConnector('Mission terminée ou obsolète.', 409);
    if (!currentClaim(store, job.id, state))
      rejectConnector('Le contexte de la mission a changé depuis sa prise en charge.', 409);
    if (
      journal.interactions.length >= 200 ||
      journal.interactions.filter((entry) => entry.jobId === job.id && entry.status === 'pending')
        .length >= 12
    )
      rejectConnector('Limite de questionnaires atteinte.', 429);
    const timestamp = now();
    const record = {
      id: randomUUID(),
      jobId: job.id,
      optionId: definition.optionId,
      guideVersion: 1,
      requestedFlowId,
      version: 1,
      status: 'pending',
      step: requestedFlowId ? 1 : 0,
      input: requestedFlowId
        ? { optionId: definition.optionId, guideVersion: 1, flowId: requestedFlowId, answers: {} }
        : null,
      preparation: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      baseRevision: job.baseRevision,
      contextFingerprint: contextKey(state),
      definitionFingerprint: interactionHash(definition),
      requestEventId: input.eventId,
      requestFingerprint: fingerprint,
    };
    journal.interactions.push(record);
    file.write(journal);
    return { interaction: publicRecord(record) };
  }

  function mutate(input, complete) {
    connectorObject(
      input,
      ['interactionId', 'expectedVersion', 'input', 'step'],
      'Réponse du guide',
    );
    connectorId(input.interactionId);
    interactionVersion(input.expectedVersion);
    const journal = reconcile(),
      record = journal.interactions.find((entry) => entry.id === input.interactionId);
    if (!record) rejectConnector('Questionnaire absent.', 404);
    const draft = partialInteractionGuide(record.optionId, input.input);
    const step = complete ? 2 : (input.step ?? record.step);
    if (![0, 1, 2].includes(step)) rejectConnector('Étape du guide invalide.');
    const fingerprint = interactionHash({
      expectedVersion: input.expectedVersion,
      complete,
      step,
      input: draft,
    });
    if (record.lastMutation === fingerprint && record.status !== 'cancelled')
      return { interaction: publicRecord(record) };
    if (record.status !== 'pending' || record.version !== input.expectedVersion)
      rejectConnector('Questionnaire modifié, terminé ou obsolète. Rechargez son état.', 409);
    if (record.requestedFlowId && draft?.flowId !== record.requestedFlowId)
      rejectConnector('Le parcours demandé doit être conservé.');
    const preparation = complete ? prepareConnectorGuide(draft) : null;
    Object.assign(record, {
      input: preparation?.input ?? draft,
      preparation,
      step,
      status: complete ? 'answered' : 'pending',
      version: record.version + 1,
      updatedAt: now(),
      lastMutation: fingerprint,
    });
    file.write(journal);
    return { interaction: publicRecord(record) };
  }

  return {
    request,
    reconcile,
    list: (jobId) => {
      if (jobId !== undefined) connectorId(jobId);
      return {
        interactions: reconcile()
          .interactions.filter((record) => !jobId || record.jobId === jobId)
          .map(publicRecord),
      };
    },
    saveDraft: (input) => mutate(input, false),
    answer: (input) => mutate(input, true),
  };
}
