import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: "export { mountProgressWidget } from './progress-widget';",
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ProgressTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate, message = 'Expected progress state was not rendered') {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), message);
}

function job(id = 'job-a', status = 'running') {
  return {
    id,
    request: `Demande ${id}`,
    status,
    worker: 'host',
    baseRevision: 'base-a',
  };
}

function snapshot(jobId = 'job-a', overrides = {}) {
  return {
    jobId,
    baseRevision: 'base-a',
    status: 'running',
    worker: 'host',
    sequence: 1,
    updatedAt: '2026-09-17T10:00:00Z',
    plan: {
      title: `Plan déclaré ${jobId}`,
      steps: [
        { id: 'inspect', title: 'Lire le contrat', status: 'completed' },
        { id: 'change', title: 'Corriger le formulaire', status: 'running' },
        { id: 'verify', title: 'Vérifier le résultat', status: 'pending' },
      ],
    },
    actions: [
      {
        id: 'read-contract',
        kind: 'read',
        label: 'Contrat effectivement consulté',
        status: 'completed',
        at: '2026-09-17T10:00:00Z',
      },
    ],
    truncated: false,
    source: 'host',
    ...overrides,
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((pass, fail) => {
    resolve = pass;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function fixture(t, overrides = {}, configure = () => {}) {
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const unexpectedRequests = [];
  dom.window.fetch = async (url) => {
    const route = new URL(url, dom.window.location.origin);
    if (route.pathname === '/api/connectors/interactions')
      return { ok: true, json: async () => ({ interactions: [] }) };
    if (route.pathname === '/api/mcp/actions')
      return { ok: true, json: async () => ({ actions: [] }) };
    unexpectedRequests.push(String(url));
    return { ok: false, json: async () => ({ error: 'Unexpected fixture request' }) };
  };
  configure(dom.window);
  dom.window.eval(bundle.outputFiles[0].text);
  const requests = [],
    files = [];
  const props = {
    jobs: [job()],
    revisions: [],
    loadProgress: (jobId, signal) => {
      const pending = deferred();
      requests.push({ jobId, signal, ...pending });
      return pending.promise;
    },
    onOpenFile: (...args) => files.push(args),
    pollMs: 10,
    ...overrides,
  };
  const handle = dom.window.ProgressTest.mountProgressWidget(
    dom.window.document.getElementById('root'),
  );
  handle.update(props);
  t.after(() => {
    handle.dispose();
    dom.window.close();
    assert.deepEqual(unexpectedRequests, []);
  });
  return { dom, document: dom.window.document, handle, props, requests, files };
}

function summary(document, label) {
  const element = [...document.querySelectorAll('summary')].find((node) =>
    node.textContent.trim().startsWith(label),
  );
  assert.ok(element, `Missing disclosure: ${label}`);
  return element;
}

function disclosure(document, label) {
  return summary(document, label).closest('details');
}

function jobSelect(document) {
  const select = [...document.querySelectorAll('select')].find(
    (node) =>
      node.getAttribute('aria-label') === 'Demande suivie' ||
      [...node.labels].some((label) => label.textContent.includes('Demande suivie')),
  );
  assert.ok(select, 'The followed request has an accessible selector');
  return select;
}

function selectJob(f, id) {
  const select = jobSelect(f.document);
  select.value = id;
  select.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
}

function button(document, label) {
  const element = [...document.querySelectorAll('button')].find(
    (node) => node.textContent.trim() === label || node.getAttribute('aria-label') === label,
  );
  assert.ok(element, `Missing action: ${label}`);
  return element;
}

async function resolveFirst(f, data = snapshot()) {
  await until(() => f.requests.length > 0, 'The selected request was not loaded');
  f.requests[0].resolve(data);
  const expected = data.plan?.title ?? 'Aucun plan transmis';
  await until(() => f.document.body.textContent.includes(expected));
}

test('polling updates progress while preserving disclosure state and keyboard focus', async (t) => {
  const f = fixture(t);
  await resolveFirst(f);
  assert.match(f.document.body.textContent, /Plan et avancement/);
  const plan = disclosure(f.document, 'Plan'),
    journal = disclosure(f.document, 'Journal des actions');
  summary(f.document, 'Plan').click();
  summary(f.document, 'Journal des actions').click();
  const expectedOpen = [plan.open, journal.open];
  const focused = summary(f.document, 'Journal des actions');
  focused.focus();
  assert.equal(f.document.activeElement, focused);
  await until(() => f.requests.length >= 2, 'The running request was not polled');
  f.requests[1].resolve(
    snapshot('job-a', {
      sequence: 2,
      actions: [
        ...snapshot().actions,
        {
          id: 'test-form',
          kind: 'check',
          label: 'Validation supplémentaire réellement reçue',
          status: 'completed',
          at: '2026-09-17T10:00:01Z',
        },
      ],
    }),
  );
  await until(() =>
    f.document.body.textContent.includes('Validation supplémentaire réellement reçue'),
  );
  assert.deepEqual(
    [disclosure(f.document, 'Plan').open, disclosure(f.document, 'Journal des actions').open],
    expectedOpen,
  );
  assert.equal(f.document.activeElement, focused);
});

test('a delayed response from request A cannot replace the selected request B', async (t) => {
  const f = fixture(t, { jobs: [job(), job('job-b')] });
  await until(() => f.document.querySelector('select'));
  selectJob(f, 'job-a');
  await until(() => f.requests.some((request) => request.jobId === 'job-a'));
  const first = f.requests.findLast((request) => request.jobId === 'job-a');
  const beforeSwitch = f.requests.length;
  selectJob(f, 'job-b');
  await until(() => f.requests.slice(beforeSwitch).some((request) => request.jobId === 'job-b'));
  f.requests.findLast((request) => request.jobId === 'job-b').resolve(snapshot('job-b'));
  await until(() => f.document.body.textContent.includes('Plan déclaré job-b'));
  // The transport intentionally ignores cancellation: request identity must still protect B.
  first.resolve(snapshot('job-a', { plan: { title: 'Réponse A obsolète', steps: [] } }));
  await setTimeout(20);
  assert.equal(jobSelect(f.document).value, 'job-b');
  assert.match(f.document.body.textContent, /Plan déclaré job-b/);
  assert.doesNotMatch(f.document.body.textContent, /Réponse A obsolète/);
});

test('a network failure retains received evidence and offers a working retry', async (t) => {
  const polls = [];
  const pollMs = 60_000;
  const f = fixture(t, { pollMs }, (window) => {
    const schedule = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => {
      const timer = schedule(callback, delay, ...args);
      if (delay === pollMs)
        polls.push(() => {
          window.clearTimeout(timer);
          callback(...args);
        });
      return timer;
    };
  });
  await resolveFirst(f);
  await until(() => polls.length > 0, 'The running request did not schedule a refresh');
  polls[0]();
  await until(() => f.requests.length >= 2);
  f.requests[1].reject(new Error('Connexion perdue'));
  await until(() => f.document.body.textContent.includes('Actualisation interrompue'));
  assert.match(f.document.body.textContent, /Plan déclaré job-a/);
  assert.match(f.document.body.textContent, /Contrat effectivement consulté/);
  const beforeRetry = f.requests.length;
  // No scheduled poll is advanced here: only the retry action can request fresh evidence.
  button(f.document, 'Réessayer').click();
  await until(() => f.requests.length > beforeRetry, 'Retry did not request fresh progress');
  f.requests[beforeRetry].resolve(
    snapshot('job-a', {
      sequence: 2,
      plan: { title: 'Plan reçu après reprise', steps: snapshot().plan.steps },
    }),
  );
  await until(() => f.document.body.textContent.includes('Plan reçu après reprise'));
  assert.doesNotMatch(f.document.body.textContent, /Actualisation interrompue/);
});

test('a ready job does not turn unfinished reported plan steps into completed work', async (t) => {
  const f = fixture(t);
  await resolveFirst(f);
  assert.match(disclosure(f.document, 'Plan').textContent, /En cours/);
  f.handle.update({ ...f.props, jobs: [job('job-a', 'ready')] });
  for (const request of f.requests.slice(1))
    request.resolve(snapshot('job-a', { status: 'ready' }));
  await until(() => disclosure(f.document, 'Plan').textContent.includes('Non terminée'));
  const text = disclosure(f.document, 'Plan').textContent;
  assert.match(text, /Lire le contrat/);
  assert.match(text, /Corriger le formulaire/);
  assert.match(text, /Vérifier le résultat/);
  assert.match(text, /Non terminée/);
  assert.doesNotMatch(text, /En cours/);
});

for (const status of ['queued', 'ready']) {
  test(`a ${status} job without reported progress does not invent a plan`, async (t) => {
    const f = fixture(t, { jobs: [job('job-a', status)] });
    await resolveFirst(
      f,
      snapshot('job-a', {
        status,
        sequence: 0,
        updatedAt: null,
        worker: null,
        source: null,
        plan: null,
        actions: [],
      }),
    );
    assert.match(f.document.body.textContent, /Aucun plan transmis/);
    assert.doesNotMatch(f.document.body.textContent, /Lire le contrat|Corriger le formulaire/);
    assert.equal(f.files.length, 0);
  });
}

function fileAction(path) {
  return {
    id: path,
    kind: 'write',
    label: `Écriture observée : ${path}`,
    status: 'completed',
    at: '2026-09-17T10:00:00Z',
    path,
  };
}

test('source actions open only files present in a delivered revision of the same request', async (t) => {
  const delivered = 'src/delivered.tsx',
    missing = 'src/missing.tsx',
    foreign = 'src/foreign.tsx';
  const f = fixture(t, {
    jobs: [job('job-a', 'ready')],
    revisions: [
      { id: 'revision-a', jobId: 'job-a', files: [{ path: delivered }] },
      { id: 'revision-b', jobId: 'job-b', files: [{ path: foreign }] },
    ],
  });
  await resolveFirst(
    f,
    snapshot('job-a', {
      status: 'ready',
      actions: [fileAction(delivered), fileAction(missing), fileAction(foreign)],
    }),
  );
  disclosure(f.document, 'Journal des actions').open = true;
  const actions = [...f.document.querySelectorAll('button, a[href]')];
  assert.match(f.document.body.textContent, /src\/delivered\.tsx/);
  assert.match(f.document.body.textContent, /src\/missing\.tsx/);
  assert.match(f.document.body.textContent, /src\/foreign\.tsx/);
  for (const action of actions) action.click();
  assert.deepEqual(f.files, [['job-a', delivered]]);
});

test('a reported write without a delivered revision does not open a source file', async (t) => {
  const f = fixture(t);
  await resolveFirst(f, snapshot('job-a', { actions: [fileAction('src/pending.tsx')] }));
  disclosure(f.document, 'Journal des actions').open = true;
  assert.match(f.document.body.textContent, /src\/pending\.tsx/);
  for (const action of f.document.querySelectorAll('button, a[href]')) action.click();
  assert.deepEqual(f.files, []);
});
