export interface ConnectorOption {
  id: string;
  title: string;
  purpose: 'diagnostics' | 'application';
  capabilities: string[];
  transport: 'local' | 'api' | 'mcp';
  docs: string;
  description: string;
  cost: string;
  limits: string[];
  checkIds: string[];
}
export interface ConnectorConnection {
  id: string;
  optionId: string;
  purpose: ConnectorOption['purpose'];
  profileRef: string | null;
  secretRefs: string[];
  version: number;
  status: 'configured' | 'attested' | 'failed';
  configuredAt: string;
  probe: null | {
    id: string;
    status: 'available' | 'failed';
    observedAt: string;
    receivedAt: string;
    tool: { name: string; version: string };
    capabilities: string[];
    tools: { name: string }[];
    summary: string;
  };
}
export interface ConnectorReport {
  schemaVersion: 1;
  revisionId: string | null;
  catalog: {
    capabilities: {
      id: string;
      title: string;
      purpose: ConnectorOption['purpose'];
      description: string;
    }[];
    options: ConnectorOption[];
  };
  connections: ConnectorConnection[];
  limits: string[];
}
export interface ConnectorWidgetOptions {
  revisionId: string | null;
  checkId?: string;
  onPrepareRequest: (request: { prompt: string }) => void;
}
export interface ConnectorHandle {
  update(options: ConnectorWidgetOptions): void;
  dispose(): void;
}
