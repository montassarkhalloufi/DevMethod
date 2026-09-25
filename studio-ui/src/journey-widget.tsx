import { createRoot } from 'react-dom/client';
import { JourneyView } from './features/journey/components/JourneyView';
import type { JourneyHandle, JourneyOptions } from './features/journey/model/contracts';

export function mountJourneyWidget(host: HTMLElement, options: JourneyOptions): JourneyHandle {
  const root = createRoot(host);
  let disposed = false;
  const update = (next: JourneyOptions) => {
    if (!disposed) root.render(<JourneyView {...next} />);
  };
  update(options);
  return {
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      root.unmount();
    },
  };
}
