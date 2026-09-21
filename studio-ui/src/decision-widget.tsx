import { initializeLocale } from './i18n';
import { createRoot } from 'react-dom/client';
import { DecisionCard } from './features/decisions/components/DecisionCard';
import type { DecisionCardProps } from './features/decisions/model/contracts';

export function mountDecisionWidget(host: HTMLElement) {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const root = createRoot(host);
  return {
    update(props: DecisionCardProps) {
      root.render(<DecisionCard key={props.proposal.id} {...props} />);
    },
    dispose() {
      root.unmount();
    },
  };
}
