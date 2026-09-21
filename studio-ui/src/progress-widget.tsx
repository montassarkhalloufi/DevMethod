import { initializeLocale } from './i18n';
import { createRoot } from 'react-dom/client';
import { McpActionCards, GuidedConnection } from './features/mcp';
import { ConnectorInteractions } from './features/connectors';
import { ProgressView } from './features/progress/components/ProgressView';
import type { ProgressJob, ProgressWidgetProps } from './features/progress/model/contracts';

function interactions(job: ProgressJob) {
  return (
    <div key={'interactions:' + job.id}>
      <ConnectorInteractions
        jobId={job.id}
        renderConnection={(preparation) => <GuidedConnection preparation={preparation} />}
      />
      <McpActionCards jobId={job.id} running={job.status === 'running'} />
    </div>
  );
}

export function mountProgressWidget(host: HTMLElement) {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const root = createRoot(host);
  return {
    update(props: ProgressWidgetProps) {
      root.render(<ProgressView {...props} renderInteractions={interactions} />);
    },
    dispose() {
      root.unmount();
    },
  };
}
