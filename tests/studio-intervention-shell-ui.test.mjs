import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
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
  globalName: 'InterventionShell',
  plugins: [
    {
      name: 'optional-widgets',
      setup(api) {
        api.onResolve({ filter: /^\/studio-ui\// }, ({ path }) => ({ path, external: true }));
      },
    },
  ],
});
const html = await fs.readFile(
  new URL('../scripts/studio/public/index.html', import.meta.url),
  'utf8',
);

async function until(predicate) {
  for (let n = 0; n < 100; n++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected intervention shell state');
}

test('shell action opens exact candidate and successful save refreshes control without removing the modal draft', async (t) => {
  const dom = new JSDOM(html, {
    url: 'http://localhost/#checks',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const document = dom.window.document;
  document.cookie = 'devmethod-studio-language=fr';
  document.documentElement.lang = 'fr';
  document.body.removeAttribute('data-studio');
  dom.window.structuredClone = structuredClone;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  dom.window.fetch = async () => ({
    ok: true,
    json: async () => ({ interactions: [], actions: [] }),
  });
  const state = createInitialStudioState();
  state.revisions = [{ id: 'candidate', title: 'Fixture candidate', files: [] }];
  state.activeRevision = 'candidate';
  const control = {
    graph: { revisionId: 'candidate', nodes: [], edges: [] },
    risk: {
      severity: 'unknown',
      probability: 'unknown',
      evidenceQuality: 'missing',
      factors: [],
      unknowns: [],
      limits: [],
    },
    autonomy: { action: 'arbitrate', reasons: [], requestedMode: 'guided' },
    interventions: [],
  };
  let reads = 0,
    posts = 0,
    refreshes = 0;
  const api = {
    state: async () => {
      refreshes++;
      return structuredClone(state);
    },
    runtime: async () => ({
      previewOrigin: 'http://localhost:4331',
      agent: { automatic: false },
      control,
    }),
    interventionReview: async (id) => {
      reads++;
      assert.equal(id, 'candidate');
      return {
        version: state.version,
        revision: state.revisions[0],
        base: null,
        reviewKey: 'key',
        canReview: true,
        reason: null,
        control,
        consequences: {
          protocol: 'studio-consequences-v1',
          fingerprint: 'source',
          baseFingerprint: null,
          contextFingerprint: 'ctx',
          changes: [],
          signals: [],
          data: { status: 'missing', nonEmpty: null, version: null, bytes: 0 },
          issue: null,
          reviews: [],
          limits: [],
        },
      };
    },
    interventionDecision: async (input) => {
      posts++;
      assert.equal(input.revisionId, 'candidate');
      state.version++;
      return { state: structuredClone(state), decision: {} };
    },
  };
  dom.window.eval(bundle.outputFiles[0].text);
  const app = dom.window.InterventionShell.mountStudio({
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
  document.querySelector('[data-action="intervention-review"]').click();
  await until(
    () =>
      document.querySelector('.intervention-review-dialog [name=resolution]') &&
      reads === 1 &&
      document.querySelector('.intervention-review-dialog').textContent.includes('Examen chargé'),
  );
  const dialog = document.querySelector('.intervention-review-dialog');
  for (const [name, value] of Object.entries({
    persistentData: 'unknown',
    contractChanged: 'unknown',
    resolution: 'keep-stopped',
    scope: 'Scope de fixture',
    reason: 'Raison de fixture',
  })) {
    const input = dialog.querySelector(`[name=${name}]`);
    input.value = value;
    input.dispatchEvent(new dom.window.Event('input'));
  }
  dialog.querySelector('form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await until(() => reads === 2 && refreshes >= 2);
  assert.equal(posts, 1);
  assert.equal(dialog.open, true);
  assert.equal(dialog.querySelector('[name=scope]').value, 'Scope de fixture');
  assert.match(dialog.textContent, /Appréciation enregistrée/);
});
