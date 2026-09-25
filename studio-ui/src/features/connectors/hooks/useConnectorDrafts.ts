import { useState } from 'react';
import type { ConnectorConnection, ConnectorOption } from '../model/contracts';
import type { GuideInput } from '../model/guides';
import { useGuideDrafts } from './useGuideDrafts';

export interface ConnectorDraft {
  profile: string;
  references: string;
  control: string;
  capability: string;
  guide: GuideInput | null;
  baseVersion: number;
  dirty: boolean;
}

function initialDraft(
  option: ConnectorOption,
  connection: ConnectorConnection | undefined,
  checkId?: string,
): ConnectorDraft {
  return {
    profile: connection?.profileRef || '',
    references: connection?.secretRefs.join('\n') || '',
    control: option.checkIds.includes(checkId || '') ? checkId! : option.checkIds[0] || '',
    capability: option.capabilities[0] || '',
    guide: connection?.guide || null,
    baseVersion: connection?.version || 0,
    dirty: false,
  };
}

export function useConnectorDrafts(checkId?: string) {
  const persistence = useGuideDrafts();
  const [drafts, setDrafts] = useState<Record<string, ConnectorDraft>>({});
  function get(option: ConnectorOption, connection?: ConnectorConnection) {
    const existing = drafts[option.id];
    const base =
      existing && (existing.dirty || existing.baseVersion >= (connection?.version || 0))
        ? existing
        : initialDraft(option, connection, checkId);
    const restored = persistence.drafts[option.id]?.input;
    return !base.dirty && restored ? { ...base, guide: restored } : base;
  }
  function update(optionId: string, current: ConnectorDraft, patch: Partial<ConnectorDraft>) {
    if (patch.guide !== undefined)
      persistence.edit(optionId, patch.guide, persistence.drafts[optionId]?.step ?? 0);
    const dirty = current.dirty || ['profile', 'references', 'guide'].some((key) => key in patch);
    setDrafts((values) => ({ ...values, [optionId]: { ...current, ...patch, dirty } }));
  }
  function saved(optionId: string, submitted: ConnectorDraft, version: number) {
    setDrafts((values) => {
      const current = values[optionId];
      if (current && current !== submitted) return values;
      return { ...values, [optionId]: { ...submitted, baseVersion: version, dirty: false } };
    });
  }
  return { get, update, saved, persistence };
}
