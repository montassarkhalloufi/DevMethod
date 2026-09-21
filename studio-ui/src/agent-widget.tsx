import { initializeLocale } from './i18n';
import { createRoot } from 'react-dom/client';
import { AgentConfiguration } from './features/agent/components/AgentConfiguration';
import type { AgentWidgetProps } from './features/agent/model/contracts';

export function mountAgentWidget(host: HTMLElement) {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const root = createRoot(host);
  return {
    update(props: AgentWidgetProps) {
      root.render(<AgentConfiguration {...props} />);
    },
    dispose() {
      root.unmount();
    },
  };
}
