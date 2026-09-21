import { initializeLocale } from './i18n';
import { createRoot } from 'react-dom/client';
import { ProjectMcpTools } from './features/mcp/components/ProjectMcpTools';
import type { McpProjectHandle } from './features/mcp/components/ProjectMcpTools';
import type { GuideInput } from './features/connectors';

export function mountMcpWidget(
  host: HTMLElement,
  options?: { onGuidesChange?(values: GuideInput[]): void },
) {
  initializeLocale(host.ownerDocument, host.ownerDocument.defaultView ?? undefined);
  const root = createRoot(host);
  let api: McpProjectHandle | null = null;
  let pendingRestore: GuideInput[] | undefined;
  const apiRef = (value: McpProjectHandle | null) => {
    api = value;
    if (value && pendingRestore) {
      const values = pendingRestore;
      pendingRestore = undefined;
      value.restoreGuides(values);
    }
  };
  root.render(<ProjectMcpTools apiRef={apiRef} onGuidesChange={options?.onGuidesChange} />);
  return {
    prepareRequest: () => api?.prepareRequest() || Promise.resolve(false),
    restoreGuides: (values: GuideInput[]) => {
      if (api) api.restoreGuides(values);
      else pendingRestore = values;
    },
    addGuides: (values: GuideInput[]) => api?.addGuides(values) ?? false,
    requestGuides: () => api?.requestGuides() ?? pendingRestore ?? [],
    clearGuides: (sent: GuideInput[]) => api?.clearGuides(sent),
    dispose: () => root.unmount(),
  };
}
