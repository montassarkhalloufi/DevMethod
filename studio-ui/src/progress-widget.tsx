import { createRoot } from 'react-dom/client';
import { ProgressView } from './features/progress/components/ProgressView';
import type { ProgressWidgetProps } from './features/progress/model/contracts';

export function mountProgressWidget(host: HTMLElement) {
  const root = createRoot(host);
  return {
    update(props: ProgressWidgetProps) {
      root.render(<ProgressView {...props} />);
    },
    dispose() {
      root.unmount();
    },
  };
}
