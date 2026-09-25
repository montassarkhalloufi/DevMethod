import { useState } from 'react';
import { useConnectorGuides } from './useConnectorGuides';
import { useGuidePreparation } from './useGuidePreparation';
import { guideInputKey } from '../model/guides';
import type { GuideInput, GuidePreparation } from '../model/guides';

export function useProjectGuide(
  optionId: string | undefined,
  input: GuideInput | null | undefined,
) {
  const [prepared, setPrepared] = useState<Record<string, GuidePreparation>>({});
  const catalog = useConnectorGuides({ enabled: optionId === 'slack' });
  const request = useGuidePreparation();
  const definition = catalog.guides.find((guide) => guide.optionId === optionId);
  const candidate = optionId ? prepared[optionId] : null;
  const confirmed =
    candidate && guideInputKey(candidate.input) === guideInputKey(input) ? candidate : null;
  async function prepare(value: GuideInput) {
    const result = await request.prepare(value);
    if (result) setPrepared((values) => ({ ...values, [value.optionId]: result }));
  }
  return {
    enabled: optionId === 'slack',
    catalog,
    request,
    definition,
    confirmed,
    ready: !input || Boolean(confirmed),
    prepare,
  };
}
