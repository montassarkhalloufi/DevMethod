import { guideResponse } from '../hooks/useConnectorGuides';
import type { GuideInput } from './guides';
import { readGuideDraft, readGuideDrafts } from './guide-drafts';
import type { GuideDraft, GuideDraftSnapshot } from './guide-drafts';

type Edit = { input: GuideInput | null; step: number };
const endpoint = '/api/connectors/guide-drafts';

export class GuideDraftSession {
  private value: GuideDraftSnapshot = {
    drafts: {},
    scopeId: '',
    loading: false,
    saving: false,
    error: '',
  };
  private listeners = new Set<() => void>();
  private pending = new Map<string, Edit>();
  private versions = new Map<string, number>();
  private active = new Set<string>();
  private failures = new Map<string, string>();
  private alive = true;
  private loaded = false;
  private reading = false;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.value;
  private publish(patch: Partial<GuideDraftSnapshot>) {
    if (!this.alive) return;
    this.value = { ...this.value, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private syncStatus() {
    this.publish({ saving: this.active.size > 0, error: [...this.failures.values()][0] ?? '' });
  }
  async load() {
    if (this.reading) return;
    this.reading = true;
    this.publish({ loading: true });
    try {
      const data = readGuideDrafts(
        await guideResponse(
          await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(15000) }),
        ),
      );
      if (!this.alive) return;
      const drafts = { ...this.value.drafts };
      for (const draft of data.drafts) {
        if (
          this.active.has(draft.optionId) ||
          draft.version < (this.versions.get(draft.optionId) ?? 0)
        )
          continue;
        this.versions.set(draft.optionId, draft.version);
        if (!this.pending.has(draft.optionId)) drafts[draft.optionId] = draft;
      }
      this.loaded = true;
      this.failures.clear();
      this.publish({ drafts, scopeId: data.scopeId, error: '' });
      for (const id of this.pending.keys()) void this.flush(id);
    } catch {
      this.publish({
        error: 'Enregistrement indisponible. Vos réponses locales sont conservées ; réessayez.',
      });
    } finally {
      this.reading = false;
      this.publish({ loading: false });
    }
  }
  edit(optionId: string, input: GuideInput | null, step: number) {
    const edit = { input, step };
    this.pending.set(optionId, edit);
    this.publish({
      drafts: {
        ...this.value.drafts,
        [optionId]: {
          optionId,
          input,
          step,
          version: this.versions.get(optionId) ?? 0,
          updatedAt: '',
        },
      },
    });
    void this.flush(optionId);
  }
  private accept(optionId: string, edit: Edit, draft: GuideDraft) {
    this.versions.set(optionId, draft.version);
    if (this.pending.get(optionId) !== edit) return;
    this.pending.delete(optionId);
    this.publish({ drafts: { ...this.value.drafts, [optionId]: draft } });
  }
  private async flush(optionId: string) {
    if (!this.alive || !this.loaded || this.active.has(optionId) || this.failures.has(optionId))
      return;
    const edit = this.pending.get(optionId);
    if (!edit) return;
    this.active.add(optionId);
    this.syncStatus();
    try {
      const response = (await guideResponse(
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            optionId,
            expectedVersion: this.versions.get(optionId) ?? 0,
            ...edit,
          }),
          signal: AbortSignal.timeout(15000),
        }),
      )) as { scopeId: string; draft: unknown };
      const draft = readGuideDraft(response.draft);
      if (response.scopeId !== this.value.scopeId || draft.optionId !== optionId)
        throw new Error('scope');
      if (this.alive) this.accept(optionId, edit, draft);
    } catch {
      this.failures.set(
        optionId,
        'Brouillon non enregistré ou modifié ailleurs. Vos réponses sont conservées. Réessayez pour enregistrer cette saisie.',
      );
    } finally {
      this.active.delete(optionId);
      this.syncStatus();
      if (this.pending.has(optionId) && !this.failures.has(optionId)) void this.flush(optionId);
    }
  }
  resume() {
    this.alive = true;
    void this.load();
  }
  dispose() {
    this.alive = false;
  }
}
