import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/studio-ui/',
  plugins: [
    {
      name: 'studio-monaco-dompurify',
      enforce: 'pre',
      resolveId(source, importer) {
        // Monaco vendors this relative module; an npm override alone cannot replace it.
        const owner = importer?.replaceAll('\\', '/');
        if (
          source === './dompurify/dompurify.js' &&
          owner?.endsWith('/monaco-editor/esm/vs/base/browser/domSanitize.js')
        )
          return fileURLToPath(import.meta.resolve('dompurify'));
      },
    },
  ],
  build: {
    outDir: fileURLToPath(new URL('../dist/studio-ui', import.meta.url)),
    emptyOutDir: true,
    lib: {
      entry: {
        'code-widget': fileURLToPath(new URL('./src/code-widget.tsx', import.meta.url)),
        layout: fileURLToPath(new URL('./src/layout.ts', import.meta.url)),
        'decision-widget': fileURLToPath(new URL('./src/decision-widget.tsx', import.meta.url)),
        'journey-widget': fileURLToPath(new URL('./src/journey-widget.tsx', import.meta.url)),
        'project-widget': fileURLToPath(new URL('./src/project-widget.tsx', import.meta.url)),
        'quality-widget': fileURLToPath(new URL('./src/quality-widget.tsx', import.meta.url)),
        'progress-widget': fileURLToPath(new URL('./src/progress-widget.tsx', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, entryName) => entryName + '.js',
      cssFileName: 'code-widget',
    },
    sourcemap: false,
  },
  worker: { format: 'es' },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});
