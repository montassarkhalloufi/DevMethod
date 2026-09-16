import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createSourceView } from '../scripts/studio/public/source-view.js';

const file = (path) => ({ path, bytes: 20, sha256: 'a'.repeat(64) });
const app = { id: 'app-one', title: 'Application réelle', files: [file('index.html')] };
const services = () => ({
  processModel: 'single-node-process',
  services: [
    {
      id: 'application',
      name: 'Application locale',
      health: {
        status: 'timeout',
        observedAt: '2026-09-16T20:00:00Z',
        elapsedMs: 1200,
        error: { code: 'HEALTH_TIMEOUT', message: 'Le service n’a pas répondu.' },
      },
    },
  ],
  limitations: ['Deux serveurs HTTP dans un seul processus Node.'],
  sources: {
    id: 'runtime-abc',
    scope: 'runtime',
    title: 'Backend local DevMethod',
    files: [file('preview.mjs')],
    provenance: 'Sources du runtime installé.',
  },
  project: {
    revisionId: 'app-one',
    topology: 'services',
    services: [
      {
        id: 'api',
        name: 'API métier',
        root: 'backend',
        runtime: 'Fastify',
        execution: 'not_connected',
        files: [file('backend/main.ts')],
        reason: 'Non lancé.',
      },
    ],
  },
});

function fixture(t, loadServices) {
  const dom = new JSDOM('<main></main>');
  const root = dom.window.document.querySelector('main');
  const calls = [];
  const view = createSourceView({
    document: dom.window.document,
    root,
    allowEdit: true,
    loadServices,
    loadSource: async ({ revisionId, path, scope }) => {
      calls.push({ revisionId, path, scope });
      return {
        revisionId,
        ...file(path),
        scope,
        content: scope === 'runtime' ? 'ACTUAL RUNTIME' : 'PROJECT SOURCE',
        binary: false,
        truncated: false,
      };
    },
  });
  const button = (text) =>
    [...root.querySelectorAll('button')].find((node) => node.textContent === text);
  t.after(() => {
    view.destroy();
    dom.window.close();
  });
  return { root, view, calls, button };
}

test('backend sources have a separate read-only tree and genuine health failures stay visible', async (t) => {
  const requested = [];
  const f = fixture(t, async ({ revisionId }) => {
    requested.push(revisionId);
    return services();
  });
  await f.view.showRevision(app);
  f.button('Backend et services').click();
  await setImmediate();
  const backend = f.root.querySelector('.source-runtime');
  assert.equal(backend.hidden, false);
  assert.equal(backend.querySelector('code').textContent, 'ACTUAL RUNTIME');
  assert.match(backend.textContent, /délai dépassé — état indéterminé/);
  assert.match(backend.textContent, /API métier.*non connecté/);
  assert.equal(
    [...backend.querySelectorAll('button')].some((button) => /Modifier/.test(button.textContent)),
    false,
  );
  assert.deepEqual(f.calls.at(-1), {
    revisionId: 'runtime-abc',
    path: 'preview.mjs',
    scope: 'runtime',
  });
  assert.deepEqual(requested, ['app-one']);
  f.button('Application').click();
  assert.equal(backend.hidden, true);
  assert.equal(f.root.querySelector('.source-reading code').textContent, 'PROJECT SOURCE');
  assert.equal(f.button('Modifier le code').disabled, false);
});

test('failed health refresh removes stale success and an old request cannot replace a new revision catalog', async (t) => {
  let oldResolve;
  let count = 0;
  const f = fixture(t, async () => {
    count++;
    if (count === 1)
      return new Promise((resolve) => {
        oldResolve = resolve;
      });
    if (count === 3) throw new Error('Connexion interrompue');
    const result = services();
    result.project.revisionId = 'app-two';
    return result;
  });
  await f.view.showRevision(app);
  f.button('Backend et services').click();
  await f.view.showRevision({ ...app, id: 'app-two' });
  await setImmediate();
  oldResolve(services());
  await setImmediate();
  const backend = f.root.querySelector('.source-runtime');
  assert.match(backend.textContent, /version app-two/);
  assert.doesNotMatch(backend.textContent, /version app-one/);
  f.button('Actualiser les services').click();
  await setImmediate();
  assert.match(backend.textContent, /État non vérifié : Connexion interrompue/);
  assert.doesNotMatch(backend.textContent, /ACTUAL RUNTIME|stockage joignable/);
});
