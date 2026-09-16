export interface CodeDocument {
  path: string;
  value: string;
  readOnly: boolean;
  original?: string;
}

export interface CodeDiagnostic {
  file?: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface CodeWidgetOptions {
  onChange?: (value: string) => void;
  onSelection?: (position: { line: number; column: number; offset: number }) => void;
  onSave?: () => void;
  onDiagnostics?: (diagnostics: CodeDiagnostic[]) => void;
}

export interface CodeWidgetHandle {
  setDocument(document: CodeDocument): void;
  setDiagnostics(diagnostics: CodeDiagnostic[]): void;
  focus(position?: { line: number; column?: number }): void;
  dispose(): void;
}
