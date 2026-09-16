import { createRoot } from 'react-dom/client';
import { QualityView } from './features/quality/components/QualityView';
import type { QualityHandle, QualityOptions } from './features/quality/model/contracts';
import './features/quality/quality.css';

export function mountQualityWidget(host: HTMLElement, options: QualityOptions): QualityHandle {
  const root = createRoot(host);
  let disposed = false;
  const update = (next: QualityOptions) => {
    if (!disposed) root.render(<QualityView {...next} />);
  };
  update(options);
  return {
    update,
    dispose() {
      if (!disposed) {
        disposed = true;
        root.unmount();
      }
    },
  };
}
