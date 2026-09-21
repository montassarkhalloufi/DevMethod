import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { safeFile, atomicJSON } from './files.mjs';
import { connectorObject, connectorPayload, rejectConnector } from './connectors-validation.mjs';
import { readConnectorGuides } from './connector-guides.mjs';

export const interactionHash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function knownInteractionGuide(optionId, guideVersion = 1) {
  const definition = readConnectorGuides().guides.find(
    (guide) => guide.optionId === optionId && guide.guideVersion === guideVersion,
  );
  if (!definition) rejectConnector('Guide ou version inconnue.');
  return definition;
}

export function partialInteractionGuide(optionId, input) {
  const definition = knownInteractionGuide(optionId);
  if (input === null) return null;
  connectorObject(input, ['optionId', 'guideVersion', 'flowId', 'answers'], 'Brouillon du guide');
  connectorPayload(input);
  if (input.optionId !== optionId || input.guideVersion !== definition.guideVersion)
    rejectConnector('Le brouillon concerne un autre guide.');
  const flow = definition.flows.find((entry) => entry.id === input.flowId);
  if (!flow) rejectConnector('Parcours inconnu.');
  connectorObject(
    input.answers,
    flow.questions.map((question) => question.id),
    'Réponses partielles',
  );
  const answers = {};
  for (const question of flow.questions) {
    const answer = input.answers[question.id];
    if (answer === undefined) continue;
    const selected = question.multiple ? answer : [answer];
    if (
      !Array.isArray(selected) ||
      new Set(selected).size !== selected.length ||
      selected.some((id) => !question.options.some((option) => option.id === id))
    )
      rejectConnector('Réponse inconnue ou sensible refusée.');
    answers[question.id] = question.multiple
      ? question.options.filter((option) => selected.includes(option.id)).map((option) => option.id)
      : answer;
  }
  return { optionId, guideVersion: 1, flowId: flow.id, answers };
}

export function interactionVersion(value) {
  if (!Number.isSafeInteger(value) || value < 0) rejectConnector('Version attendue invalide.');
  return value;
}

export function interactionFile(root, relative, initial, validate) {
  const file = safeFile(root, relative);
  return {
    read() {
      const current = safeFile(root, relative);
      if (!fs.existsSync(current)) return structuredClone(initial);
      try {
        const info = fs.lstatSync(current);
        if (!info.isFile() || info.size > 2 * 1024 * 1024) throw new Error('size');
        const value = JSON.parse(fs.readFileSync(current, 'utf8'));
        validate(value);
        return value;
      } catch {
        rejectConnector('Journal des guides illisible ; aucun remplacement effectué.', 409);
      }
    },
    write(value) {
      validate(value);
      if (Buffer.byteLength(JSON.stringify(value)) > 2 * 1024 * 1024)
        rejectConnector('Journal des guides plein.', 429);
      try {
        safeFile(root, relative);
        fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
        atomicJSON(file, value);
      } catch {
        rejectConnector(
          'Enregistrement des guides impossible. Réessayez après réparation du stockage.',
          503,
        );
      }
    },
  };
}
