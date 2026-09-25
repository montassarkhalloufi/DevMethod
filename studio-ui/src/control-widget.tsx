import { createRoot } from 'react-dom/client';
import { ControlPlane } from './features/control/ControlPlane';
import type { ControlOptions } from './features/control/model';
export function mountControlWidget(element: HTMLElement, options: ControlOptions) {
  const root = createRoot(element);
  root.render(<ControlPlane options={options} />);
  return {
    update(next: ControlOptions) {
      root.render(<ControlPlane options={next} />);
    },
    dispose() {
      root.unmount();
    },
  };
}
