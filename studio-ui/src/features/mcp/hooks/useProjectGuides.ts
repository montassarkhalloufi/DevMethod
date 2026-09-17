import { useRef, useState } from 'react';
import {
  guideInputKey,
  useConnectorGuides,
  useGuidePreparation,
  useGuideDrafts,
} from '../../connectors';
import type { GuideInput, GuidePreparation } from '../../connectors';

export function useProjectGuides(onChange?: (values: GuideInput[]) => void) {
  const catalog = useConnectorGuides();
  const validation = useGuidePreparation();
  const persistence = useGuideDrafts();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GuideInput>>({});
  const [selected, setSelected] = useState<GuideInput[]>([]);
  const [error, setError] = useState('');
  const current = useRef({ selected, drafts });
  function setChoices(values: GuideInput[], notify = true) {
    current.current = { ...current.current, selected: values };
    setSelected(values);
    if (notify) onChange?.(values);
  }
  function setAnswers(values: Record<string, GuideInput>) {
    current.current = { ...current.current, drafts: values };
    setDrafts(values);
  }
  const definition = catalog.guides.find((guide) => guide.optionId === activeId) ?? null;
  const input = activeId
    ? (drafts[activeId] ??
      persistence.drafts[activeId]?.input ??
      selected.find((item) => item.optionId === activeId) ??
      null)
    : null;
  const pending = selected.some((item) => {
    const candidate = drafts[item.optionId] ?? persistence.drafts[item.optionId]?.input;
    return candidate && guideInputKey(item) !== guideInputKey(candidate);
  });

  function open(optionId: string) {
    validation.reset();
    setError('');
    setActiveId(optionId);
  }
  function change(value: GuideInput) {
    validation.reset();
    setAnswers({ ...current.current.drafts, [value.optionId]: value });
    persistence.edit(value.optionId, value, persistence.drafts[value.optionId]?.step ?? 0);
  }
  function add(values: GuideInput[]) {
    const ids = new Set([...current.current.selected, ...values].map((item) => item.optionId));
    if (ids.size > 12) {
      setError('Vous pouvez préparer jusqu’à 12 services par demande.');
      return false;
    }
    setChoices([
      ...current.current.selected.filter(
        (item) => !values.some((value) => value.optionId === item.optionId),
      ),
      ...values,
    ]);
    setAnswers({
      ...current.current.drafts,
      ...Object.fromEntries(values.map((value) => [value.optionId, value])),
    });
    return true;
  }
  function apply(value: GuidePreparation) {
    if (guideInputKey(value.input) !== guideInputKey(input)) return;
    if (add([value.input])) setActiveId(null);
  }
  function clear(sent: GuideInput[]) {
    setChoices(
      current.current.selected.filter(
        (item) => !sent.some((value) => guideInputKey(value) === guideInputKey(item)),
      ),
    );
  }
  return {
    catalog,
    definition,
    input,
    selected,
    pending,
    error,
    activeId,
    requestGuides: () => current.current.selected,
    ready: () =>
      !current.current.selected.some((item) => {
        const candidate =
          current.current.drafts[item.optionId] ?? persistence.drafts[item.optionId]?.input;
        return candidate && guideInputKey(item) !== guideInputKey(candidate);
      }),
    restore: (values: GuideInput[]) => setChoices(values, false),
    preparation: validation.preparation,
    preparing: validation.loading,
    preparationError: validation.error,
    persistence,
    step: activeId ? persistence.drafts[activeId]?.step : undefined,
    setStep: (step: number) => {
      if (activeId) persistence.edit(activeId, input, step);
    },
    prepare: validation.prepare,
    open,
    change,
    apply,
    add,
    clear,
    remove: (optionId: string) =>
      setChoices(current.current.selected.filter((item) => item.optionId !== optionId)),
    back: () => {
      validation.reset();
      setActiveId(null);
    },
  };
}
export type ProjectGuides = ReturnType<typeof useProjectGuides>;
