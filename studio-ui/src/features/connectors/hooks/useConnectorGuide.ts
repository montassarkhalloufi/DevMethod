import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { GuideDefinition, GuideFlow, GuideInput, GuidePreparation } from '../model/guides';
import { guideAnswered, guideInputKey, selectGuideFlow } from '../model/guides';

export function useConnectorGuide({
  definition,
  draft,
  preparation,
  preparing,
  disabled = false,
  onChange,
  onPrepare,
}: {
  definition: GuideDefinition;
  draft: GuideInput | null;
  preparation: GuidePreparation | null;
  preparing: boolean;
  disabled?: boolean;
  onChange(input: GuideInput): void;
  onPrepare(input: GuideInput): void;
}) {
  const input =
    draft?.optionId === definition.optionId && draft.guideVersion === definition.guideVersion
      ? draft
      : null;
  const flow = definition.flows.find((item) => item.id === input?.flowId);
  const confirmed =
    preparation && input && guideInputKey(preparation.input) === guideInputKey(input)
      ? preparation
      : null;
  const [step, setStep] = useState(confirmed ? 2 : flow ? 1 : 0);
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const locked = disabled || preparing;
  const complete = Boolean(flow && input && guideAnswered(flow, input));
  useLayoutEffect(() => {
    heading.current?.focus();
  }, [step, definition.optionId]);
  function chooseFlow(selected: GuideFlow) {
    if (selected.id !== input?.flowId) onChange(selectGuideFlow(definition, selected.id));
  }
  function preview() {
    if (!input || !complete || locked) return;
    setStep(2);
    onPrepare(input);
  }
  return {
    input,
    flow,
    confirmed,
    step,
    setStep,
    heading,
    headingId,
    locked,
    complete,
    chooseFlow,
    preview,
  };
}
