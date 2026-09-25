import {
  readGuideDefinitions,
  readGuideInput,
  readGuidePreparation,
} from '../connectors/model/guides';
import type { GuideDefinition, GuideInput, GuidePreparation } from '../connectors';

export interface ConnectorInteraction {
  id: string;
  jobId: string;
  version: number;
  optionId: string;
  status: 'pending' | 'answered' | 'cancelled';
  step: number;
  input: GuideInput | null;
  preparation: GuidePreparation | null;
  requestedFlowId: string | null;
  definition: GuideDefinition;
  prerequisites: { label: string; status: 'to-configure' }[];
  accessObservation:
    | { status: 'not-observed' }
    | {
        status: 'verified';
        kind: 'mcp-discovery';
        connectionId: string;
        connectionVersion: number;
        observedAt: string;
        tools: number;
      };
}
export function readInteraction(value: unknown): ConnectorInteraction {
  const item = value as ConnectorInteraction;
  if (
    !item ||
    typeof item.id !== 'string' ||
    typeof item.jobId !== 'string' ||
    !Number.isSafeInteger(item.version) ||
    item.version < 1 ||
    ![0, 1, 2].includes(item.step) ||
    !['pending', 'answered', 'cancelled'].includes(item.status)
  )
    throw new Error('Questionnaire illisible.');
  readGuideDefinitions({ guides: [item.definition] });
  if (item.definition.optionId !== item.optionId) throw new Error('Guide incohérent.');
  if (item.input !== null && readGuideInput(item.input).optionId !== item.optionId)
    throw new Error('Réponses incohérentes.');
  if (item.preparation !== null) readGuidePreparation(item.preparation);
  if (
    !Array.isArray(item.prerequisites) ||
    !item.prerequisites.every(
      (entry) => typeof entry.label === 'string' && entry.status === 'to-configure',
    ) ||
    !item.accessObservation ||
    !['verified', 'not-observed'].includes(item.accessObservation.status)
  )
    throw new Error('Prérequis illisibles.');
  return item;
}
export function readInteractions(value: unknown, jobId: string) {
  const data = value as { interactions: unknown[] };
  if (!data || !Array.isArray(data.interactions) || data.interactions.length > 200)
    throw new Error('Questionnaires illisibles.');
  const items = data.interactions.map(readInteraction);
  if (items.some((item) => item.jobId !== jobId))
    throw new Error('Questionnaire d’une autre mission refusé.');
  return items;
}
