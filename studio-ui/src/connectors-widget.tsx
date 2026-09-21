import { initializeLocale } from './i18n';
import { createRoot } from 'react-dom/client';
import { ConnectorsView } from './features/connectors/components/ConnectorsView';
import type {
  ConnectorHandle,
  ConnectorWidgetOptions,
} from './features/connectors/model/contracts';
import './features/connectors/connectors.css';

export function mountConnectorsWidget(
  host: HTMLElement,
  options: ConnectorWidgetOptions,
): ConnectorHandle {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const root = createRoot(host);
  const render = (next: ConnectorWidgetOptions) =>
    root.render(<ConnectorsView key={next.checkId || 'catalog'} {...next} />);
  render(options);
  return { update: render, dispose: () => root.unmount() };
}
