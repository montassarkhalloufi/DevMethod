import { useState } from 'react';
import { guideInputKey, useConnectorGuides, useGuidePreparation } from '../../connectors';
import type { GuideInput, GuidePreparation } from '../../connectors';

interface GuideDraft {
  input: GuideInput;
  preparation: GuidePreparation | null;
}

const same = (left?: GuideInput | null, right?: GuideInput | null) =>
  guideInputKey(left) === guideInputKey(right);

export function useComposerGuides({
  busy,
  selected,
  onApply,
  onEdit,
}: {
  busy: boolean;
  selected: GuideInput[];
  onApply(preparation: GuidePreparation, application: boolean): boolean;
  onEdit(): void;
}) {
  const [enabled, setEnabled] = useState(false);
  const catalogue = useConnectorGuides({ enabled });
  const validation = useGuidePreparation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GuideDraft>>({});
  const definition = catalogue.guides.find((guide) => guide.optionId === activeId) ?? null;
  const current = activeId ? drafts[activeId] : undefined;

  function open(optionId: string) {
    if (busy) return;
    setEnabled(true);
    validation.reset();
    setActiveId(optionId);
  }
  function change(input: GuideInput) {
    if (busy) return;
    validation.reset();
    setDrafts((previous) => ({ ...previous, [input.optionId]: { input, preparation: null } }));
    onEdit();
  }
  async function prepare(input: GuideInput) {
    if (busy) return;
    setDrafts((previous) => ({ ...previous, [input.optionId]: { input, preparation: null } }));
    const result = await validation.prepare(input);
    if (!result) return;
    setDrafts((previous) => {
      if (!same(previous[input.optionId]?.input, input)) return previous;
      return { ...previous, [input.optionId]: { input: result.input, preparation: result } };
    });
  }
  function apply(preparation: GuidePreparation) {
    if (busy || current?.preparation !== preparation) return;
    const flow = definition?.flows.find((item) => item.id === preparation.input.flowId);
    if (!flow || !onApply(preparation, flow.usage !== 'assistant')) return;
    setActiveId(null);
  }
  function forget(optionId: string) {
    validation.reset();
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[optionId];
      return next;
    });
  }
  return {
    ...catalogue,
    activeId,
    definition,
    input: current?.input ?? null,
    preparation: current?.preparation ?? null,
    preparationFor: (optionId: string) => drafts[optionId]?.preparation ?? null,
    preparing: validation.loading,
    preparationError: validation.error,
    hasPendingDraft: Object.values(drafts).some(
      ({ input }) =>
        !same(
          input,
          selected.find((item) => item.optionId === input.optionId),
        ),
    ),
    hasPendingSelection: selected.some((input) => {
      const edited = drafts[input.optionId];
      return edited && !same(input, edited.input);
    }),
    open,
    load: () => setEnabled(true),
    change,
    prepare,
    apply,
    forget,
    back: () => {
      validation.reset();
      setActiveId(null);
    },
  };
}
