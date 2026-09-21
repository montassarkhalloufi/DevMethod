import { useI18n } from '../../../i18n';
import { useLayoutEffect, useRef } from 'react';
import { monaco } from '../monaco-runtime';
import { languageForPath } from '../model/language';
import { localMarkers, SERVER_DIAGNOSTIC_OWNER } from '../model/diagnostics';
import type {
  CodeDiagnostic,
  CodeDocument,
  CodeWidgetHandle,
  CodeWidgetOptions,
} from '../model/contracts';

type Props = CodeWidgetOptions & { onReady(handle: CodeWidgetHandle): void };
type Entry = { model: monaco.editor.ITextModel; state: monaco.editor.ICodeEditorViewState | null };
let sequence = 0;

function marker(item: CodeDiagnostic): monaco.editor.IMarkerData {
  const line = Math.max(1, item.line ?? 1);
  const column = Math.max(1, item.column ?? 1);
  return {
    severity:
      item.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : item.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
    message: item.message,
    source: 'DevMethod',
    startLineNumber: line,
    startColumn: column,
    endLineNumber: Math.max(line, item.endLine ?? line),
    endColumn: Math.max(column + 1, item.endColumn ?? column + 1),
  };
}

export function useMonacoEditor(props: Props) {
  const { t } = useI18n();
  const ariaLabel = t('Code source multicolore', 'Syntax-highlighted source code');
  const localizedLabel = useRef(ariaLabel);
  const updateLabel = useRef<((value: string) => void) | null>(null);
  useLayoutEffect(() => {
    localizedLabel.current = ariaLabel;
    updateLabel.current?.(ariaLabel);
  }, [ariaLabel]);
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef(props);
  useLayoutEffect(() => {
    callbacks.current = props;
  }, [props]);
  useLayoutEffect(() => {
    if (!host.current) return;
    const id = ++sequence;
    const models = new Map<string, Entry>();
    const originals = new Map<string, monaco.editor.ITextModel>();
    const common: monaco.editor.IStandaloneEditorConstructionOptions = {
      theme: 'devmethod-code',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      lineHeight: 22,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      padding: { top: 10, bottom: 10 },
      wordWrap: 'off',
      tabSize: 2,
      glyphMargin: true,
      folding: true,
      renderValidationDecorations: 'on',
      ariaLabel: localizedLabel.current,
      accessibilitySupport: 'auto',
      // Keep the established textarea input path across browsers and assistive tooling.
      editContext: false,
    };
    let editor = monaco.editor.create(host.current, { ...common, model: null });
    let difference: monaco.editor.IStandaloneDiffEditor | null = null;
    updateLabel.current = (value) => {
      common.ariaLabel = value;
      editor.updateOptions({ ariaLabel: value });
      difference?.getOriginalEditor().updateOptions({ ariaLabel: value });
    };
    let current: CodeDocument | null = null;
    let muted = false;
    let dead = false;
    let subscriptions: monaco.IDisposable[] = [];
    let diagnostics: CodeDiagnostic[] = [];

    function listen() {
      subscriptions.forEach((subscription) => subscription.dispose());
      subscriptions = [
        editor.onDidChangeModelContent(() => {
          if (!muted && current) callbacks.current.onChange?.(editor.getValue());
        }),
        editor.onDidChangeCursorPosition(({ position }) => {
          const model = editor.getModel();
          if (model)
            callbacks.current.onSelection?.({
              line: position.lineNumber,
              column: position.column,
              offset: model.getOffsetAt(position),
            });
        }),
      ];
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
        callbacks.current.onSave?.(),
      );
    }
    listen();
    function annotate() {
      for (const [path, entry] of models)
        monaco.editor.setModelMarkers(
          entry.model,
          SERVER_DIAGNOSTIC_OWNER,
          diagnostics.filter((item) => !item.file || item.file === path).map(marker),
        );
    }
    function remember() {
      const entry = current && models.get(current.path);
      if (entry) entry.state = editor.saveViewState();
    }
    function switchEditor(diff: boolean) {
      if (Boolean(difference) === diff) return;
      subscriptions.forEach((subscription) => subscription.dispose());
      if (difference) difference.dispose();
      else editor.dispose();
      if (diff) {
        difference = monaco.editor.createDiffEditor(host.current!, {
          ...common,
          readOnly: true,
          originalEditable: false,
          renderSideBySide: false,
        });
        editor = difference.getModifiedEditor();
      } else {
        difference = null;
        editor = monaco.editor.create(host.current!, { ...common, model: null });
      }
      listen();
    }
    function reportDiagnostics() {
      const model = editor.getModel();
      if (!model) return;
      callbacks.current.onDiagnostics?.(
        localMarkers(monaco.editor.getModelMarkers({ resource: model.uri })).map((item) => ({
          ...(current ? { file: current.path } : {}),
          line: item.startLineNumber,
          column: item.startColumn,
          severity:
            item.severity === monaco.MarkerSeverity.Error
              ? 'error'
              : item.severity === monaco.MarkerSeverity.Warning
                ? 'warning'
                : 'info',
          message: item.message,
        })),
      );
    }
    const markers = monaco.editor.onDidChangeMarkers((uris) => {
      const model = editor.getModel();
      if (model && uris.some((uri) => uri.toString() === model.uri.toString())) reportDiagnostics();
    });
    const handle: CodeWidgetHandle = {
      setDocument(next) {
        if (dead) return;
        const changedPath = current?.path !== next.path;
        if (changedPath || Boolean(difference) !== (next.original !== undefined)) remember();
        switchEditor(next.original !== undefined);
        let entry = models.get(next.path);
        if (!entry) {
          const uri = monaco.Uri.parse(
            `file:///studio-${id}/${next.path.split('/').map(encodeURIComponent).join('/')}`,
          );
          entry = {
            model: monaco.editor.createModel(next.value, languageForPath(next.path), uri),
            state: null,
          };
          models.set(next.path, entry);
        }
        current = next;
        muted = true;
        if (entry.model.getValue() !== next.value) entry.model.setValue(next.value);
        if (difference && next.original !== undefined) {
          let original = originals.get(next.path);
          if (!original) {
            original = monaco.editor.createModel(next.original, languageForPath(next.path));
            originals.set(next.path, original);
          } else if (original.getValue() !== next.original) original.setValue(next.original);
          difference.setModel({ original, modified: entry.model });
        } else if (editor.getModel() !== entry.model) editor.setModel(entry.model);
        editor.updateOptions({ readOnly: next.readOnly });
        if (changedPath && entry.state) editor.restoreViewState(entry.state);
        muted = false;
        host.current!.dataset.language = languageForPath(next.path);
        const position = editor.getPosition();
        if (position)
          callbacks.current.onSelection?.({
            line: position.lineNumber,
            column: position.column,
            offset: entry.model.getOffsetAt(position),
          });
        annotate();
        reportDiagnostics();
      },
      setDiagnostics(next) {
        diagnostics = next;
        annotate();
      },
      focus(position) {
        if (position) {
          editor.setPosition({ lineNumber: position.line, column: position.column ?? 1 });
          editor.revealLineInCenter(position.line);
        }
        editor.focus();
      },
      dispose() {
        if (dead) return;
        dead = true;
        updateLabel.current = null;
        markers.dispose();
        subscriptions.forEach((subscription) => subscription.dispose());
        if (difference) difference.dispose();
        else editor.dispose();
        for (const entry of models.values()) {
          monaco.editor.setModelMarkers(entry.model, SERVER_DIAGNOSTIC_OWNER, []);
          entry.model.dispose();
        }
        originals.forEach((model) => model.dispose());
      },
    };
    callbacks.current.onReady(handle);
    return () => handle.dispose();
  }, []);
  return host;
}
