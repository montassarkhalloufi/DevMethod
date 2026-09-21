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

import { createViews } from '../scripts/studio/public/views.js';
import { createControlView } from '../scripts/studio/public/control-view.js';
const control = {
  graph: { revisionId: 'candidate', nodes: [], edges: [] },
  risk: {
    severity: 'low',
    probability: 'unknown',
    evidenceQuality: 'missing',
    factors: [],
    unknowns: [],
    limits: [],
  },
  autonomy: { action: 'continue', operation: 'activate', reasons: [], requestedMode: 'guided' },
  interventions: [],
};

function project() {
  const state = createInitialStudioState();
  state.revisions = [
    { id: 'base', title: 'Base', files: [] },
    { id: 'candidate', title: 'Candidate', files: [] },
  ];
  state.activeRevision = 'base';
  return state;
}

test('only eligible checks offer controlled application, targeting the evaluated candidate', () => {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const root = dom.window.document.querySelector('main');
  const views = createViews(dom.window.document);
  const state = project();
  const render = (value) => root.replaceChildren(...views.evidence(state, { control: value }));
  render(control);
  assert.equal(root.querySelector('[data-action="control-apply"]').dataset.id, 'candidate');
  for (const autonomy of [
    { action: 'continue', operation: 'correct' },
    { action: 'arbitrate', operation: 'activate' },
  ]) {
    render({ ...control, autonomy: { ...control.autonomy, ...autonomy } });
    assert.equal(root.querySelector('[data-action="control-apply"]'), null);
  }
  state.activeRevision = 'candidate';
  render(control);
  assert.equal(root.querySelector('[data-action="control-apply"]'), null);
  root.replaceChildren(...createControlView(dom.window.document, control, 'candidate', 'modal-'));
  assert.equal(root.querySelector('[data-action="control-apply"]'), null);
  dom.window.close();
});
test('engine decisions preserve provenance and escape retained identity and observation text', () => {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const state = project();
  state.decisions = [
    {
      id: 'd',
      topic: 'Application',
      status: 'active',
      source: 'agent',
      choice: 'Candidate',
      reason: 'Contrôles',
      application: {
        trigger: 'local',
        protocol: 'studio-controlled-activation-v1',
        revisionId: '<img src=x>',
        observations: { changes: [{ kind: 'modified', path: '<script>bad</script>' }] },
      },
    },
  ];
  const root = dom.window.document.querySelector('main');
  root.append(...createViews(dom.window.document).context(state));
  assert.match(root.textContent, /Moteur Studio/);
  assert.match(root.textContent, /<img src=x>/);
  assert.match(root.textContent, /<script>bad<\/script>/);
  assert.equal(root.querySelector('img,script'), null);
  dom.window.close();
});
for (const conflict of [false, true])
  test(`controlled application serializes once and ${conflict ? 'refreshes a conflict without losing draft' : 'reports success without supplier call'}`, async (t) => {
    const dom = new JSDOM(html, {
      url: 'http://localhost/#checks',
      runScripts: 'outside-only',
      pretendToBeVisual: true,
    });
    const document = dom.window.document;
    document.documentElement.lang = 'fr';
    document.documentElement.setAttribute('data-studio-language-ready', '');
    document.body.removeAttribute('data-studio');
    dom.window.structuredClone = structuredClone;
    dom.window.fetch = async () => ({
      ok: true,
      json: async () => ({ interactions: [], actions: [] }),
    });
    const state = project();
    const initialVersion = state.version;
    let release,
      calls = [],
      reads = 0;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const api = {
      state: async () => {
        reads++;
        return structuredClone(state);
      },
      runtime: async () => ({
        previewOrigin: 'http://localhost:4331',
        agent: { automatic: false },
        control,
      }),
      change: async (route, version, input) => {
        calls.push({ route, version, input });
        await gate;
        if (conflict) {
          const error = new Error('Périmé');
          error.status = 409;
          throw error;
        }
        state.version++;
        state.activeRevision = 'candidate';
        return { state: structuredClone(state), applied: true, decision: {} };
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
    const button = document.querySelector('[data-action="control-apply"]');
    button.click();
    button.click();
    await until(() => calls.length === 1);
    assert.equal(button.disabled, true);
    const input = document.querySelector('#request');
    input.value = 'Saisie concurrente conservée';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    release();
    await app.settled();
    assert.deepEqual(
      calls.map((call) => JSON.parse(JSON.stringify(call))),
      [{ route: 'control/apply', version: initialVersion, input: { revisionId: 'candidate' } }],
    );
    assert.ok(reads >= 2);
    assert.equal(input.value, 'Saisie concurrente conservée');
    assert.match(
      document.querySelector('#notice').textContent,
      conflict ? /projet a changé.*saisie est conservée/ : /Aucun nouvel appel fournisseur/,
    );
    assert.equal(state.activeRevision, conflict ? 'base' : 'candidate');
  });
