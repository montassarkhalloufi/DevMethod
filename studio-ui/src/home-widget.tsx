import { initializeLocale, mountLocaleControls } from './i18n';
import { createRoot } from 'react-dom/client';
import { HomeView } from './features/home/components/HomeView';
import type { HomeOptions } from './features/home/model/contracts';

export function mountHomeWidget(host: HTMLElement, options: HomeOptions = {}) {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const stopLanguage = host.ownerDocument.defaultView
    ? mountLocaleControls(host.ownerDocument, host.ownerDocument.defaultView)
    : () => {};
  const root = createRoot(host);
  root.render(<HomeView {...options} />);
  return {
    dispose: () => {
      stopLanguage();
      root.unmount();
    },
  };
}

const host = document.getElementById('studio-home');
if (host) mountHomeWidget(host);
