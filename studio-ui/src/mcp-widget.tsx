import { createRoot } from 'react-dom/client';
import { createRef } from 'react';
import { ProjectMcpTools } from './features/mcp/components/ProjectMcpTools';
import type { McpProjectHandle } from './features/mcp/components/ProjectMcpTools';

export function mountMcpWidget(host: HTMLElement) {
  const root = createRoot(host);
  const apiRef = createRef<McpProjectHandle>();
  root.render(<ProjectMcpTools apiRef={apiRef} />);
  return {
    prepareRequest: () => apiRef.current?.prepareRequest() || Promise.resolve(false),
    dispose: () => root.unmount(),
  };
}
