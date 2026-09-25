import { createRoot } from 'react-dom/client';
import { HomeView } from './features/home/components/HomeView';
import type { HomeOptions } from './features/home/model/contracts';

export function mountHomeWidget(host: HTMLElement, options: HomeOptions = {}) {
  const root = createRoot(host);
  root.render(<HomeView {...options} />);
  return { dispose: () => root.unmount() };
}

const host = document.getElementById('studio-home');
if (host) mountHomeWidget(host);
