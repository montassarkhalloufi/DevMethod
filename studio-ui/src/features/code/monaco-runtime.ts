import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import TypeScriptWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker';
import JsonWorker from 'monaco-editor/languages/features/json/json.worker?worker';
import CssWorker from 'monaco-editor/languages/features/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/languages/features/html/html.worker?worker';

// All worker code is bundled locally by Vite; no CDN or remote worker factory.
globalThis.MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TypeScriptWorker();
    if (label === 'json') return new JsonWorker();
    if (['css', 'scss', 'less'].includes(label)) return new CssWorker();
    if (['html', 'handlebars', 'razor'].includes(label)) return new HtmlWorker();
    return new EditorWorker();
  },
};

monaco.typescript.typescriptDefaults.setCompilerOptions({
  strict: true,
  target: monaco.typescript.ScriptTarget.ESNext,
  module: monaco.typescript.ModuleKind.ESNext,
  jsx: monaco.typescript.JsxEmit.ReactJSX,
  allowNonTsExtensions: true,
});
// The widget has only the opened files, not the project's full dependency graph.
// Project-wide strict checking remains the server build's responsibility.
monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
});
monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
});
monaco.editor.defineTheme('devmethod-code', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#111a17',
    'editorLineNumber.foreground': '#87958e',
    'editorLineNumber.activeForeground': '#eef1e8',
    'editorGutter.background': '#111a17',
  },
});
export { monaco };
