import { readGuideInput } from './guides';
import type { GuideInput } from './guides';

export interface GuideDraft {
  optionId: string;
  version: number;
  input: GuideInput | null;
  step: number;
  updatedAt: string;
}
export interface GuideDraftSnapshot {
  drafts: Record<string, GuideDraft>;
  scopeId: string;
  loading: boolean;
  saving: boolean;
  error: string;
}
export function readGuideDraft(value: unknown): GuideDraft {
  const draft = value as GuideDraft;
  if (
    !draft ||
    typeof draft.optionId !== 'string' ||
    !Number.isSafeInteger(draft.version) ||
    draft.version < 1 ||
    ![0, 1, 2].includes(draft.step) ||
    typeof draft.updatedAt !== 'string'
  )
    throw new Error('Brouillon du guide illisible.');
  if (draft.input !== null && readGuideInput(draft.input).optionId !== draft.optionId)
    throw new Error('Le brouillon concerne un autre guide.');
  return draft;
}
export function readGuideDrafts(value: unknown) {
  const data = value as { scopeId: string; drafts: unknown[] };
  if (
    !data ||
    typeof data.scopeId !== 'string' ||
    !/^(home|project):[a-f0-9]{24}$/.test(data.scopeId) ||
    !Array.isArray(data.drafts) ||
    data.drafts.length > 12
  )
    throw new Error('Les brouillons du guide sont illisibles.');
  return { scopeId: data.scopeId, drafts: data.drafts.map(readGuideDraft) };
}
