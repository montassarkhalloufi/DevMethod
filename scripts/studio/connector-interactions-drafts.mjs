import {
  connectorObject,
  connectorDate,
  connectorDigest,
  rejectConnector,
} from './connectors-validation.mjs';
import {
  interactionFile,
  interactionHash,
  interactionVersion,
  knownInteractionGuide,
  partialInteractionGuide,
} from './connector-interactions-storage.mjs';

function readDraft(value) {
  connectorObject(
    value,
    ['optionId', 'version', 'input', 'step', 'updatedAt', 'lastMutation'],
    'Brouillon enregistré',
  );
  knownInteractionGuide(value.optionId);
  interactionVersion(value.version);
  if (value.version < 1 || ![0, 1, 2].includes(value.step))
    rejectConnector('Étape du guide invalide.');
  partialInteractionGuide(value.optionId, value.input);
  connectorDate(value.updatedAt);
  connectorDigest(value.lastMutation);
}

export function createConnectorGuideDrafts(
  directory,
  { scope, now = () => new Date().toISOString() },
) {
  if (!['home', 'project'].includes(scope)) rejectConnector('Périmètre de brouillon invalide.');
  const scopeId = `${scope}:${interactionHash(directory).slice(0, 24)}`;
  const file = interactionFile(
    directory,
    '.devmethod/connector-guide-drafts.json',
    { format: 1, drafts: [] },
    (value) => {
      connectorObject(value, ['format', 'drafts'], 'Brouillons');
      if (value.format !== 1 || !Array.isArray(value.drafts) || value.drafts.length > 12)
        rejectConnector('Brouillons invalides.');
      value.drafts.forEach(readDraft);
      if (new Set(value.drafts.map((draft) => draft.optionId)).size !== value.drafts.length)
        rejectConnector('Brouillon répété.');
    },
  );
  const publicDraft = (draft) => {
    const value = structuredClone(draft);
    delete value.lastMutation;
    return value;
  };
  const manager = {
    list: () => ({ scopeId, drafts: file.read().drafts.map(publicDraft) }),
    save(input) {
      connectorObject(input, ['optionId', 'expectedVersion', 'input', 'step'], 'Brouillon');
      interactionVersion(input.expectedVersion);
      if (![0, 1, 2].includes(input.step)) rejectConnector('Étape du guide invalide.');
      const normalized = {
        optionId: input.optionId,
        input: partialInteractionGuide(input.optionId, input.input),
        step: input.step,
        expectedVersion: input.expectedVersion,
      };
      const fingerprint = interactionHash(normalized),
        journal = file.read(),
        prior = journal.drafts.find((draft) => draft.optionId === input.optionId);
      if (prior?.lastMutation === fingerprint) return { scopeId, draft: publicDraft(prior) };
      if ((prior?.version ?? 0) !== input.expectedVersion)
        rejectConnector('Brouillon modifié ailleurs. Votre saisie locale est conservée.', 409);
      if (!prior && journal.drafts.length >= 12)
        rejectConnector('Maximum 12 brouillons de guides.', 429);
      const draft = {
        optionId: input.optionId,
        input: normalized.input,
        step: input.step,
        version: (prior?.version ?? 0) + 1,
        updatedAt: now(),
        lastMutation: fingerprint,
      };
      journal.drafts = [
        ...journal.drafts.filter((entry) => entry.optionId !== input.optionId),
        draft,
      ];
      file.write(journal);
      return { scopeId, draft: publicDraft(draft) };
    },
    remove(input) {
      connectorObject(input, ['optionId', 'expectedVersion'], 'Suppression du brouillon');
      return { ...manager.save({ ...input, input: null, step: 0 }), removed: true };
    },
  };
  return manager;
}
