import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { evaluateControl } from '../dist/control-plane/engine.js';

const bundle = await build({
  stdin: {
    contents: "export { mountControlWidget } from './control-widget';",
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ControlTest',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const response = (value, ok = true) => ({ ok, json: async () => value });

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(10);
  }
  assert.ok(predicate(), 'Control UI did not reach expected state');
}

function report() {
  const at = '2026-09-25T10:00:00Z';
  const node = {
    id: 'visual',
    kind: 'visual',
    label: 'Preuve visuelle',
    projectId: 'fixture',
    missionId: null,
    actionId: 'apply',
    revisionId: 'r1',
    at,
    status: 'observed',
    freshness: 'stale',
    outcome: 'passed',
    source: 'Fixture navigateur',
    explanation: 'Comparaison à renouveler',
    limits: ['Fixture de contrat UI'],
    dependencies: {},
    dependencyScope: 'revision',
    required: true,
    link: { panel: 'product', revisionId: 'r1' },
  };
  const input = {
    projectId: 'fixture',
    missionId: null,
    revisionId: 'r1',
    requested: 'delegated',
    at,
    action: {
      id: 'apply',
      label: 'Appliquer',
      kind: 'delivery',
      reversible: true,
      impact: 'low',
      reserved: false,
    },
    nodes: [
      node,
      {
        ...node,
        id: 'declared-success',
        kind: 'check',
        status: 'declared',
        freshness: 'current',
        required: false,
        label: 'Déclaration héritée',
      },
      {
        ...node,
        id: 'syntax',
        kind: 'check',
        label: 'Syntaxe',
        freshness: 'current',
        outcome: 'unknown',
        status: 'missing',
        checkId: 'source-syntax',
        canRun: true,
        link: { panel: 'checks', revisionId: 'r1' },
      },
    ],
    edges: [],
    dependencies: {},
    sourceIssues: [],
    signals: [],
    stopSignature: null,
  };
  return {
    ...evaluateControl(input),
    version: 1,
    revisions: [{ id: 'r1', title: 'Version actuelle' }],
  };
}

async function fixture(t, fetcher) {
  const dom = new JSDOM('<div id="sidebar"></div><div id="modes"></div><main id="root"></main>', {
    url: 'http://localhost/#control',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.fetch = fetcher;
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.eval(bundle.outputFiles[0].text);
  const document = dom.window.document,
    opened = [],
    modes = [],
    changes = [];
  const options = {
    revisionId: 'r1',
    mode: 'delegated',
    sidebar: document.getElementById('sidebar'),
    modes: document.getElementById('modes'),
    onOpen: (link) => opened.push(link),
    onMode: (mode) => modes.push(mode),
    onStateChanged: () => changes.push(true),
  };
  const handle = dom.window.ControlTest.mountControlWidget(
    document.getElementById('root'),
    options,
  );
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  const button = (text) =>
    [...document.querySelectorAll('button')].find((element) => element.textContent.includes(text));
  return { dom, document, button, handle, options, opened, modes, changes };
}

test('missing-proof navigation, keyboard node selection and preview links use the observed revision', async (t) => {
  const f = await fixture(t, async () => response(report()));
  await until(() => f.button('Voir les preuves manquantes'));
  assert.match(f.document.querySelector('.cp-metrics').textContent, /0\/2 actuelles/);
  f.button('Voir les preuves manquantes').click();
  await until(() => f.document.querySelector('.cp-inspector'));
  assert.equal(f.dom.window.location.hash, '#control');
  assert.equal(new URLSearchParams(f.dom.window.location.search).get('control'), 'graph');
  assert.match(f.document.querySelector('.cp-inspector').textContent, /À renouveler/);
  f.button('Ouvrir dans l’aperçu').click();
  assert.equal(f.opened[0].revisionId, 'r1');
  const node = f.document.querySelector('g[role="button"][aria-label*="Syntaxe"]');
  node.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await until(() => f.document.querySelector('.cp-inspector h2').textContent === 'Syntaxe');
  f.document.querySelector('[aria-label="Fermer l’inspecteur"]').click();
  await until(() => !f.document.querySelector('.cp-inspector'));
  f.dom.window.history.pushState(null, '', '?control=attention#control');
  f.dom.window.dispatchEvent(new f.dom.window.PopStateEvent('popstate'));
  await until(() => f.document.querySelector('h1').textContent === 'Votre attention');
  assert.equal(
    f.document.querySelector('.cp-attention-card.cp-green'),
    null,
    'a declared success is not an observed passing control',
  );
});

test('check actions wait for the returned run, expose failure and never announce an invented success', async (t) => {
  const calls = [];
  let resolve;
  const f = await fixture(t, (url, options) => {
    calls.push([url, options]);
    if (url.endsWith('/verify'))
      return new Promise((done) => {
        resolve = done;
      });
    return Promise.resolve(response(report()));
  });
  await until(() => f.button('Lancer les vérifications'));
  const launch = f.button('Lancer les vérifications');
  launch.click();
  await until(() => resolve);
  assert.equal(launch.disabled, true);
  assert.equal(f.changes.length, 0);
  assert.match(f.document.querySelector('.cp-job-status').textContent, /0 \/ 1/);
  const payload = JSON.parse(calls.at(-1)[1].body);
  assert.equal(payload.checkId, 'source-syntax');
  assert.equal(payload.revisionId, 'r1');
  assert.ok(payload.requestId);
  resolve(response({ error: 'Le contrôle est interrompu' }, false));
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.match(f.document.querySelector('[role="alert"]').textContent, /interrompu/);
  assert.equal(f.document.querySelectorAll('.cp-report-outdated').length, 1);
  assert.equal(f.changes.length, 0);
});

test('loading, unavailable source, retry and empty filter states are explicit', async (t) => {
  let resolve;
  const f = await fixture(
    t,
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await until(() => f.document.querySelector('.cp-loading') && typeof resolve === 'function');
  assert.equal(f.document.querySelector('.cp-metrics'), null);
  resolve(response({ error: 'Source indisponible' }, false));
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.querySelector('.cp-metrics'), null);
  f.dom.window.fetch = async () =>
    response({ ...report(), snapshot: { ...report().snapshot, nodes: [] } });
  f.button('Réessayer').click();
  await until(() => f.document.querySelector('.cp-metrics'));
  f.button('Graphe des preuves').click();
  await until(() => f.document.querySelector('.cp-empty'));
  assert.match(f.document.querySelector('.cp-empty').textContent, /Aucune preuve/);
  f.button('Guidé').click();
  assert.deepEqual(f.modes, ['guided']);
});

test('detailed graph keeps all labels and follows real relations with return navigation', async (t) => {
  const value = report();
  const template = value.snapshot.nodes[0];
  value.snapshot.nodes.push({
    ...template,
    id: 'code',
    kind: 'code',
    label: 'Code du projet',
    required: false,
  });
  value.snapshot.edges.push({
    id: 'syntax-code',
    from: 'syntax',
    to: 'code',
    relation: 'validates',
    explanation: 'Le contrôle de syntaxe porte sur ce code.',
  });
  value.snapshot.edges.push({
    id: 'visual-code',
    from: 'visual',
    to: 'code',
    relation: 'validates',
    explanation: 'La comparaison porte sur cette version.',
  });
  const f = await fixture(t, async () => response(value));
  f.dom.window.HTMLElement.prototype.scrollTo = function () {};
  await until(() => f.button('Graphe des preuves'));
  f.button('Graphe des preuves').click();
  await until(() => f.button('Tous les nœuds'));
  f.button('Tous les nœuds').click();
  await until(() => f.document.querySelector('.cp-detailed-canvas'));
  assert.equal(f.document.querySelectorAll('.cp-detail-node').length, value.snapshot.nodes.length);
  assert.ok(f.document.querySelector('.cp-detail-label').textContent);
  const relations = f.document.querySelector('.cp-node-relations');
  assert.match(relations.textContent, /Examine dans son périmètre/);
  const code = [...relations.querySelectorAll('button')].find((entry) =>
    entry.textContent.includes('Code du projet'),
  );
  code.click();
  await until(() => f.document.querySelector('.cp-inspector h2').textContent === 'Code du projet');
  assert.match(f.document.querySelector('.cp-node-relations').textContent, /Est examiné par/);
  assert.equal(
    f.document.querySelectorAll('.cp-edge-bundle').length,
    1,
    'same-type links share one explicit route',
  );
  f.button('Isoler ce lien').click();
  await until(() => f.document.querySelector('.cp-edge-isolated'));
  assert.equal(f.document.querySelectorAll('.cp-detailed-canvas .cp-edge').length, 1);
  assert.equal(f.document.querySelectorAll('.cp-detail-node').length, value.snapshot.nodes.length);
  f.button('Afficher tous les liens').click();
  await until(() => f.document.querySelector('.cp-edge-bundle'));
  f.button('Nœud précédent').click();
  await until(() => f.document.querySelector('.cp-inspector h2').textContent === 'Preuve visuelle');
  assert.equal(
    f.document
      .querySelector('.cp-detail-node[aria-pressed="true"]')
      .getAttribute('aria-label')
      .includes('Preuve visuelle'),
    true,
  );
  const number = f.document
    .querySelector('.cp-detail-node[aria-pressed="true"]')
    .getAttribute('aria-label');
  f.document.querySelectorAll('.cp-filters input')[1].click();
  await until(() => f.document.querySelectorAll('.cp-detail-node').length === 2);
  assert.equal(
    f.document.querySelector('.cp-detail-node[aria-pressed="true"]').getAttribute('aria-label'),
    number,
    'filtering must keep stable node references',
  );
  [...f.document.querySelectorAll('.cp-node-relations button')]
    .find((entry) => entry.textContent.includes('Code du projet'))
    .click();
  await until(
    () => f.document.querySelectorAll('.cp-detail-node').length === value.snapshot.nodes.length,
  );
  assert.equal(
    f.document.querySelectorAll('.cp-filters input')[1].checked,
    false,
    'following an out-of-filter relationship restores its graph context',
  );
});
