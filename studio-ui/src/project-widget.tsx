import { initializeLocale } from './i18n';
import { createRoot } from 'react-dom/client';
import { ProjectWorkbench } from './features/project/components/ProjectWorkbench';
import type { ProjectWidgetHandle, ProjectWidgetOptions } from './features/project/model/widget';
export function mountProjectWidget(
  host: HTMLElement,
  options: ProjectWidgetOptions,
): ProjectWidgetHandle {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const root = createRoot(host);
  const render = (next: ProjectWidgetOptions) => root.render(<ProjectWorkbench {...next} />);
  render(options);
  return { update: render, dispose: () => root.unmount() };
}
