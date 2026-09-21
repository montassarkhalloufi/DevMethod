import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createRuntimeObserver } from '../scripts/studio/public/runtime-observer.js';
import { createStudioApi } from '../scripts/studio/public/api.js';

// Browser-message fixtures are not runtime evidence from a native application.
function fixture(t, submit = async () => {}) {
  const dom = new JSDOM('<iframe></iframe>', { url: 'http://localhost:4000' });
  const frame = dom.window.document.querySelector('iframe');
  let scope = { frame, origin: 'http://localhost:4001', revisionId: 'r1' };
  const calls = [],
    errors = [];
  const observer = createRuntimeObserver({
    window: dom.window,
    getScope: () => scope,
    submit: async (input) => {
      calls.push(input);
      await submit(input);
    },
    onError: (error) => errors.push(error.message),
  });
  t.after(() => {
    observer.dispose();
    dom.window.close();
  });
  return {
    calls,
    errors,
    observer,
    frame,
    scope(next) {
      scope = next;
    },
    send(data = {}, event = {}) {
      dom.window.dispatchEvent(
        new dom.window.MessageEvent('message', {
          origin: 'http://localhost:4001',
          source: frame.contentWindow,
          data: {
            type: 'devmethod-runtime-error',
            buildId: 'r1',
            message: 'Failure',
            file: 'src/App.tsx',
            line: 4,
            ...data,
          },
          ...event,
        }),
      );
    },
  };
}

test('accepts only the exact active preview source, origin, revision and error event', async (t) => {
  const f = fixture(t);
  f.send({}, { origin: 'http://localhost:4002' });
  f.send({}, { source: null });
  f.send({ buildId: 'r0' });
  f.send({ type: 'success' });
  f.send({ message: null });
  f.send({ message: '  ' });
  f.send({ file: 42 });
  assert.equal(f.calls.length, 0);
  f.send();
  await setImmediate();
  assert.deepEqual(f.calls, [
    { revisionId: 'r1', message: 'Failure', file: 'src/App.tsx', line: 4 },
  ]);
  f.scope(null);
  f.send({ message: 'Not a product preview' });
  assert.equal(f.calls.length, 1);
});

test('bounds and deduplicates normalized signals, limits each revision and serializes requests', async (t) => {
  const completions = [];
  const f = fixture(t, () => new Promise((resolve) => completions.push(resolve)));
  f.send({ message: 'x'.repeat(2100), file: 'f'.repeat(600), line: -1 });
  f.send({ message: 'x'.repeat(2200), file: 'f'.repeat(700), line: 0 });
  for (let index = 0; index < 30; index++) f.send({ message: 'Error ' + index });
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].message.length, 2000);
  assert.equal(f.calls[0].file.length, 500);
  assert.equal(f.calls[0].line, null);
  for (let index = 0; index < 20; index++) {
    completions[index]();
    await setImmediate();
  }
  assert.equal(f.calls.length, 20);
  f.scope({ frame: f.frame, origin: 'http://localhost:4001', revisionId: 'r2' });
  f.send({ buildId: 'r2' });
  assert.equal(f.calls.length, 21);
  completions[20]();
  await setImmediate();
});

test('drops queued signals when preview changes and ignores late frames and disposed observers', async (t) => {
  let complete;
  const f = fixture(
    t,
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  f.send();
  f.send({ message: 'Queued old revision' });
  f.scope({ frame: f.frame, origin: 'http://localhost:4001', revisionId: 'r2' });
  f.send({ message: 'Late event from old document' });
  complete();
  await setImmediate();
  assert.equal(f.calls.length, 1);
  f.send({ buildId: 'r2' });
  f.send({ buildId: 'r2', message: 'Queued before dispose' });
  f.observer.dispose();
  complete();
  await setImmediate();
  f.send({ buildId: 'r2', message: 'After dispose' });
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.errors, []);
});

test('submission failure is reported once without automatic retries, including duplicate errors', async (t) => {
  const f = fixture(t, async () => {
    throw new Error('Storage unavailable');
  });
  f.send();
  await setImmediate();
  f.send();
  await setImmediate();
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.errors, ['Storage unavailable']);
});

test('late rejected submission after disposal does not surface a stale notice', async (t) => {
  let reject;
  const f = fixture(
    t,
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  f.send();
  f.observer.dispose();
  reject(new Error('Late failure'));
  await setImmediate();
  assert.deepEqual(f.errors, []);
});

test('observation API sends only the captured revision and fields, without project version or authentication token', async () => {
  const calls = [];
  const api = createStudioApi(async (path, options) => {
    calls.push({ path, options });
    return {
      ok: true,
      json: async () => ({ state: { version: 2 }, observation: { id: 'observed' } }),
    };
  });
  const input = { revisionId: 'r1', message: 'Failure', file: 'main.js', line: null };
  const result = await api.runtimeObservation(input);
  assert.equal(calls[0].path, '/api/runtime/observations');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(calls[0].options.body), input);
  assert.deepEqual(calls[0].options.headers, { 'Content-Type': 'application/json' });
  assert.equal(result.observation.id, 'observed');
});

test('preview diagnostic remains plain text and cannot become HTML or approval', async () => {
  const { createControlView } = await import('../scripts/studio/public/control-view.js');
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const control = {
    graph: {
      revisionId: 'r1',
      nodes: [
        {
          id: 'error',
          type: 'evidence',
          kind: 'runtime',
          status: 'failed',
          freshness: 'current',
          provenance: 'preview-signal',
          sourceId: 'signal',
          observed: '<img src=x onerror="approve()">'.repeat(200),
          criterionIds: [],
        },
      ],
      edges: [],
    },
    risk: {
      severity: 'unknown',
      probability: 'unknown',
      evidenceQuality: 'missing',
      factors: [],
      unknowns: [],
      limits: [],
    },
    autonomy: {
      requestedMode: 'guided',
      action: 'strengthen-verification',
      reasons: ['runtime-observation-failed'],
    },
    interventions: [],
  };
  const root = dom.window.document.querySelector('main');
  root.append(...createControlView(dom.window.document, control, 'r1'));
  assert.match(root.textContent, /signal de l’aperçu — non attesté, à diagnostiquer/);
  assert.match(root.textContent, /Une erreur a été signalée dans l’aperçu/);
  const diagnostic = [...root.querySelectorAll('li')].find((node) =>
    node.textContent.startsWith('Diagnostic observé : '),
  );
  assert.equal(diagnostic.textContent.length, 'Diagnostic observé : '.length + 4000);
  assert.equal(root.querySelectorAll('img, form').length, 0);
  assert.equal(diagnostic.querySelectorAll('*').length, 0);
  assert.deepEqual(
    [...root.querySelectorAll('button')].map((button) => button.dataset.action),
    ['intervention-review'],
  );
  dom.window.close();
});

test('Studio records a current product preview signal and stops observing when its code view replaces the product', async (t) => {
  const [{ readFile }, { mountStudio }, { createInitialStudioState }] = await Promise.all([
    import('node:fs/promises'),
    import('../scripts/studio/public/app.js'),
    import('../scripts/studio/store.mjs'),
  ]);
  const html = await readFile(
    new URL('../scripts/studio/public/index.html', import.meta.url),
    'utf8',
  );
  const dom = new JSDOM(html, { url: 'http://localhost:4000/#product' });
  const state = createInitialStudioState();
  state.project.idea = 'Fixture runtime observer';
  state.revisions = [
    {
      id: 'r1',
      title: 'Fixture',
      summary: '',
      files: [{ path: 'index.html' }],
      createdAt: '2026-09-21T12:00:00Z',
    },
  ];
  state.activeRevision = 'r1';
  const calls = [];
  const app = mountStudio({
    document: dom.window.document,
    window: dom.window,
    pollMs: 0,
    api: {
      state: async () => structuredClone(state),
      runtime: async () => ({
        previewOrigin: 'http://localhost:4001',
        comparisonPreviewOrigin: 'http://localhost:4002',
        agent: { automatic: false },
        planApproved: false,
      }),
      runtimeObservation: async (input) => {
        calls.push(input);
        state.version++;
        return { state: structuredClone(state), observation: { id: 'fixture-signal' } };
      },
    },
  });
  t.after(() => {
    app.destroy();
    dom.window.close();
  });
  await app.ready;
  const send = (message) =>
    dom.window.dispatchEvent(
      new dom.window.MessageEvent('message', {
        origin: 'http://localhost:4001',
        source: dom.window.document.getElementById('preview').contentWindow,
        data: {
          type: 'devmethod-runtime-error',
          buildId: 'r1',
          message,
          file: 'main.js',
          line: null,
        },
      }),
    );
  send('Real message boundary fixture');
  await setImmediate();
  assert.equal(calls.length, 1);
  dom.window.document.getElementById('tab-code').click();
  send('Hidden product, not the editor draft');
  await setImmediate();
  assert.equal(calls.length, 1);
  app.destroy();
  send('After destroy');
  await setImmediate();
  assert.equal(calls.length, 1);
});
