import { useMonacoEditor } from '../hooks/useMonacoEditor';
import type { CodeWidgetHandle, CodeWidgetOptions } from '../model/contracts';

export function CodeEditor(props: CodeWidgetOptions & { onReady(handle: CodeWidgetHandle): void }) {
  const host = useMonacoEditor(props);
  return <div className="monaco-code-surface" translate="no" ref={host} />;
}
