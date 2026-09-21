import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { setTimeout } from 'node:timers/promises';
import { createTechnicalWorkspace } from '../scripts/studio/public/technical-workspace.js';
import { createViews } from '../scripts/studio/public/views.js';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import { evaluateControl } from '../scripts/studio/control-policy.mjs';

// Real React mount with fixture HTTP responses; no provider or native execution.
const bundle = await build({
  stdin: {
    contents: "export { mountQualityWidget } from './quality-widget';",
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'Quality',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let i = 0; i < 80; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate());
}

function policy(state, revisionId) {
  return evaluateControl({
    state,
    revisionId,
    execution: { usageUnknown: true },
    admission: { allowed: false },
    delegation: {},
  });
}

async function fixture(t, fail = false) {
  const dom = new JSDOM(
    '<main><div id="checks-list"></div><div id="quality-workbench"><p>Initial quality host sentinel</p></div></main>',
    { url: 'http://localhost', runScripts: 'outside-only', pretendToBeVisual: true },
  );
  const document = dom.window.document;
  document.cookie = 'devmethod-studio-language=fr';
  document.documentElement.lang = 'fr';
  dom.window.eval(bundle.outputFiles[0].text);
  const requests = [];
  dom.window.fetch = async (url) => {
    requests.push(url);
    if (url === '/api/project/browser')
      return {
        ok: true,
        json: async () => ({
          version: 1,
          enabled: false,
          channel: 'chrome',
          driverAvailable: false,
          driverVersion: null,
          reason: 'Réglage navigateur désactivé dans cette fixture DOM.',
        }),
      };
    return {
      ok: true,
      json: async () => ({
        schemaVersion: 1,
        revisionId: new URL(url, 'http://localhost').searchParams.get('revision'),
        fingerprint: 'fixture',
        environment: 'Fixture',
        generatedAt: '2026-09-21T12:00:00Z',
        localChanges: false,
        capabilities: {},
        categories: [],
        checks: [],
        historical: [],
        limits: [],
        flowModel: null,
      }),
    };
  };
  const state = createInitialStudioState();
  state.revisions = [
    { id: 'active', title: 'Active', files: [], createdAt: '2026-09-21T12:00:00Z' },
    { id: 'candidate', title: 'Candidate', files: [], createdAt: '2026-09-21T12:00:00Z' },
  ];
  state.activeRevision = 'active';
  const views = createViews(document);
  const checks = document.getElementById('checks-list');
  const workspace = createTechnicalWorkspace({
    document,
    window: dom.window,
    sourceView: {},
    openPanel() {},
    refresh() {},
    comparisonBase() {},
    showVersion() {},
    loadQualityWidget: async () => {
      if (fail) throw new Error('Fixture load failure');
      return dom.window.Quality;
    },
  });
  t.after(() => {
    workspace.destroy();
    dom.window.close();
  });

  function render(control = policy(state, 'candidate'), shownId = 'active', verification = null) {
    checks.replaceChildren(...views.evidence(state, { control }));
    workspace.update(state, shownId, 'checks', verification);
  }

  return { document, state, workspace, render, checks, requests };
}

test('real quality React root coexists with version-scoped control across polling without duplicated legacy evidence', async (t) => {
  const f = await fixture(t);
  f.render();
  await until(() => f.document.querySelector('section[aria-labelledby="quality-heading"]'));
  await until(() => f.document.querySelector('.quality-browser input')?.disabled === false);
  assert.doesNotMatch(
    f.document.getElementById('quality-workbench').textContent,
    /Initial quality host sentinel/,
  );
  assert.equal(f.checks.hidden, false);
  const control = f.checks.querySelector('.execution-control');
  assert.equal(control.hidden, false);
  assert.match(control.textContent, /La consommation est inconnue/);
  assert.match(control.textContent, /ne concerne pas la version affichée \(active\)/);
  assert.ok([...f.checks.children].filter((node) => node !== control).every((node) => node.hidden));
  for (let index = 0; index < 4; index++) f.render();
  assert.equal(f.document.querySelectorAll('.execution-control').length, 1);
  assert.equal(f.document.querySelectorAll('section[aria-labelledby="quality-heading"]').length, 1);
  assert.equal(f.document.querySelectorAll('section[aria-label="Réglage navigateur"]').length, 1);
  assert.equal(f.document.querySelector('.quality-browser [role=alert]'), null);
  f.state.activeRevision = 'candidate';
  f.state.version++;
  f.render(policy(f.state, 'candidate'), 'candidate');
  assert.doesNotMatch(
    f.checks.querySelector('.execution-control').textContent,
    /ne concerne pas la version affichée/,
  );
  f.render(null, 'candidate');
  assert.equal(f.checks.hidden, true);
  assert.equal(f.document.querySelectorAll('.execution-control').length, 0);
});

test('failed quality loading preserves legacy checks and control rather than hiding fallback content', async (t) => {
  const f = await fixture(t, true);
  f.render();
  await until(() =>
    f.document.getElementById('quality-workbench').textContent.includes('ne peut pas être chargé'),
  );
  assert.equal(f.checks.hidden, false);
  assert.ok([...f.checks.children].every((node) => !node.hidden));
  assert.equal(f.checks.querySelectorAll('.execution-control').length, 1);
});

test('fallback summary uses scoped delivery counts and keeps observations outside delivery successes and failures', () => {
  const dom = new JSDOM('<html lang="fr"><main></main></html>');
  const state = createInitialStudioState();
  state.revisions = [{ id: 'r1', files: [], title: 'Fixture' }];
  state.activeRevision = 'r1';
  const root = dom.window.document.querySelector('main');
  root.append(
    ...createViews(dom.window.document).evidence(
      state,
      {},
      {
        displayed: { revisionId: 'r1', label: 'Fixture' },
        checks: {
          passed: 1,
          failed: 0,
          observations: 1,
          items: [
            {
              id: 'browser',
              kind: 'runtime-observation',
              status: 'failed',
              revisionId: 'r1',
              command: '',
              output: 'Fixture runtime error',
            },
            {
              id: 'syntax',
              kind: 'command',
              status: 'passed',
              revisionId: 'r1',
              command: 'syntax',
              output: '',
            },
          ],
        },
      },
    ),
  );
  assert.match(
    root.querySelector('.evidence-summary').textContent,
    /1 contrôle\(s\) de livraison passé\(s\) · 0 échoué\(s\) · 1 observation/,
  );
  assert.doesNotMatch(root.textContent, /1 contrôle\(s\) de livraison échoué/);
  assert.doesNotMatch(root.querySelector('.badge').textContent, /en échec/);
  dom.window.close();
});

test('technical workspace forwards automatic verification transitions to the real React quality root', async (t) => {
  const f = await fixture(t);
  const verification = { jobId: 'native-job', revisionId: 'candidate', status: 'running' };
  f.render(null, 'candidate', verification);
  await until(() => f.document.querySelector('#quality-heading'));
  assert.match(
    f.document.body.textContent,
    /Vérification navigateur du candidat candidate · en cours/,
  );
  const count = () => f.requests.filter((url) => url.startsWith('/api/project/checks?')).length;
  assert.equal(count(), 1);
  for (let index = 0; index < 4; index++) f.render(null, 'candidate', { ...verification });
  await setTimeout(20);
  assert.equal(count(), 1);
  f.render(null, 'candidate', { ...verification, status: 'blocked', finishedAt: 'fixture-finish' });
  await until(() => count() === 2 && f.document.querySelector('#quality-heading'));
  assert.match(f.document.body.textContent, /Bloquée ou interrompue/);
  assert.equal(f.document.querySelectorAll('section[aria-label="Réglage navigateur"]').length, 1);
});

test('controlled application remains visible beside the real quality mount across refreshes', async (t) => {
  const f = await fixture(t);
  const control = policy(f.state, 'candidate');
  control.autonomy = { ...control.autonomy, action: 'continue', operation: 'activate' };
  f.render(control);
  await until(() => f.document.querySelector('#quality-heading'));
  for (let index = 0; index < 3; index++) {
    f.render(control);
    const buttons = f.checks.querySelectorAll('[data-action="control-apply"]');
    assert.equal(buttons.length, 1);
    assert.equal(buttons[0].dataset.id, 'candidate');
    assert.equal(buttons[0].closest('[hidden]'), null);
    assert.equal(buttons[0].closest('.execution-control')?.hidden, false);
  }
  f.state.activeRevision = 'candidate';
  f.render(control, 'candidate');
  assert.equal(f.checks.querySelector('[data-action="control-apply"]'), null);
  assert.ok(f.document.querySelector('#quality-heading'));
});
