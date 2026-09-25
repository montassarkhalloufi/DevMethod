import { createRoot } from 'react-dom/client';
import { CodeEditor } from './features/code/components/CodeEditor';
import type { CodeWidgetHandle, CodeWidgetOptions } from './features/code/model/contracts';

export function mountCodeWidget(
  host: HTMLElement,
  options: CodeWidgetOptions = {},
): Promise<CodeWidgetHandle> {
  return new Promise((resolve, reject) => {
    let disposed = false;
    const root = createRoot(host, {
      onUncaughtError(error) {
        reject(error);
        queueMicrotask(() => root.unmount());
      },
    });
    root.render(
      <CodeEditor
        {...options}
        onReady={(handle) =>
          resolve({
            ...handle,
            dispose() {
              if (disposed) return;
              disposed = true;
              handle.dispose();
              root.unmount();
            },
          })
        }
      />,
    );
  });
}
