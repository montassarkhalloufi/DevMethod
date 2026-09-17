import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createInitialStudioState } from '../scripts/studio/store.mjs';

const bundle = await build({
  stdin: {
    contents: "export { mountStudio } from './scripts/studio/public/app.js';",
    resolveDir: path.resolve('.'),
    loader: 'js',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'NavigationTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
  plugins: [
    {
      name: 'actual-project-and-progress-widgets',
      setup(api) {
        api.onResolve({ filter: /^\/studio-ui\// }, ({ path: requested }) => {
          const name = path.basename(requested, '.js');
          return ['project-widget', 'progress-widget'].includes(name)
            ? { path: path.resolve(`studio-ui/src/${name}.tsx`) }
            : { path: requested, external: true };
        });
      },
    },
  ],
});

const html = await fs.readFile(
  new URL('../scripts/studio/public/index.html', import.meta.url),
  'utf8',
);
const sourcePath = 'src/features/card.tsx';

async function until(predicate, message = 'Expected navigation state was not rendered') {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), message);
}

function findButton(root, label) {
  const button = [...root.querySelectorAll('button')].find(
    (node) => node.textContent.trim() === label || node.getAttribute('aria-label') === label,
  );
  assert.ok(button, `Missing button: ${label}`);
  return button;
}

async function fixture(t, otherActive = false) {
  const state = createInitialStudioState();
  const files = ['index.html', sourcePath].map((name) => ({
    path: name,
    bytes: 20,
    sha256: 'a'.repeat(64),
  }));
  state.project.idea = 'Un produit local';
  state.revisions = [
    { id: 'delivered', jobId: 'job-a', title: 'Version livrée', summary: '', files },
    ...(otherActive
      ? [{ id: 'active', jobId: 'job-b', title: 'Version active', summary: '', files }]
      : []),
  ];
  state.activeRevision = otherActive ? 'active' : 'delivered';
  state.jobs = [
    {
      id: 'job-a',
      request: 'Créer une carte',
      status: 'ready',
      baseRevision: null,
      worker: 'host',
    },
  ];
  const dom = new JSDOM(html, {
    url: 'http://localhost/#code',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { document } = dom.window;
  document.body.removeAttribute('data-studio');
  dom.window.structuredClone = structuredClone;
  dom.window.fetch = async (url) => {
    const route = new URL(url, dom.window.location.origin);
    if (route.pathname === '/api/connectors/interactions')
      return { ok: true, json: async () => ({ interactions: [] }) };
    if (route.pathname === '/api/mcp/actions')
      return { ok: true, json: async () => ({ actions: [] }) };
    return {
      ok: String(url).startsWith('/api/editor?'),
      json: async () =>
        String(url).startsWith('/api/editor?')
          ? {
              version: 1,
              baseRevision: state.activeRevision,
              files: files.map((file) => ({
                path: file.path,
                content: 'brouillon initial',
                editable: true,
              })),
              diagnostics: [],
              changedPaths: [],
              criteriaToReview: [],
              buildId: null,
              builtVersion: null,
            }
          : { error: 'Analyse indisponible dans cette fixture de navigation' },
    };
  };
  dom.window.eval(bundle.outputFiles[0].text);
  const reads = [];
  const api = {
    state: async () => structuredClone(state),
    runtime: async () => ({
      previewOrigin: 'http://localhost:4331',
      agent: { automatic: false },
      planApproved: true,
    }),
    source: async ({ revisionId, path: selected }) => {
      reads.push([revisionId, selected]);
      return {
        revisionId,
        path: selected,
        bytes: 20,
        sha256: 'a'.repeat(64),
        content: `${revisionId}: ${selected}`,
        binary: false,
        truncated: false,
      };
    },
    progress: async () => ({
      jobId: 'job-a',
      baseRevision: null,
      status: 'ready',
      worker: 'host',
      sequence: 1,
      updatedAt: '2026-09-17T10:00:00Z',
      plan: null,
      source: 'host',
      truncated: false,
      actions: [
        {
          id: 'write',
          kind: 'write',
          label: 'Carte modifiée',
          status: 'completed',
          at: '2026-09-17T10:00:00Z',
          path: sourcePath,
        },
      ],
    }),
  };
  const app = dom.window.NavigationTest.mountStudio({
    document,
    window: dom.window,
    api,
    pollMs: 0,
  });
  t.after(() => {
    app.destroy();
    dom.window.close();
  });
  await app.ready;
  await until(() => document.querySelector('[aria-label="Vues du code"]'));
  await until(() => document.querySelector('#job-progress button'));
  return { dom, document, app, reads };
}

for (const label of ['Architecture', 'Flux', 'Impact']) {
  test(`opening a delivered file from ${label} reveals its source and preserves the local editor draft`, async (t) => {
    const f = await fixture(t);
    const sourceHost = f.document.getElementById('source-view');
    findButton(sourceHost, 'Modifier le code').click();
    await until(() => sourceHost.querySelector('textarea')?.value === 'brouillon initial');
    const editor = sourceHost.querySelector('textarea');
    sourceHost.querySelector('[aria-label="Aperçu automatique"]').checked = false;
    editor.value = 'modification locale non enregistrée';
    editor.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
    const retainedDraft = Object.entries(f.dom.window.localStorage);
    assert.ok(retainedDraft.length > 0);
    findButton(f.document.querySelector('[aria-label="Vues du code"]'), label).click();
    await until(() => sourceHost.closest('[hidden]'));
    findButton(f.document.getElementById('job-progress'), 'Ouvrir le fichier ↗').click();
    await until(
      () => !sourceHost.closest('[hidden]'),
      'The delivered source remains hidden behind the previous code view',
    );
    await until(() => sourceHost.querySelector('code')?.textContent === `delivered: ${sourcePath}`);
    assert.equal(
      f.document.querySelector('[aria-label="Vues du code"] [aria-current="page"]').textContent,
      'Fichiers',
    );
    assert.equal(sourceHost.dataset.editing, 'false');
    assert.equal(sourceHost.querySelector('textarea'), editor);
    assert.equal(editor.value, 'modification locale non enregistrée');
    assert.deepEqual(Object.entries(f.dom.window.localStorage), retainedDraft);
    assert.deepEqual(f.reads.at(-1), ['delivered', sourcePath]);
  });
}

test('a progress source link selects the job delivery even when another revision is active', async (t) => {
  const f = await fixture(t, true);
  findButton(f.document.querySelector('[aria-label="Vues du code"]'), 'Impact').click();
  await until(() => f.document.getElementById('source-view').closest('[hidden]'));
  findButton(f.document.getElementById('job-progress'), 'Ouvrir le fichier ↗').click();
  const sourceHost = f.document.getElementById('source-view');
  await until(
    () => !sourceHost.closest('[hidden]'),
    'The historical delivered source remains hidden',
  );
  await until(() => sourceHost.querySelector('code')?.textContent === `delivered: ${sourcePath}`);
  assert.deepEqual(f.reads.at(-1), ['delivered', sourcePath]);
  assert.equal(findButton(sourceHost, 'Modifier le code').disabled, true);
});
