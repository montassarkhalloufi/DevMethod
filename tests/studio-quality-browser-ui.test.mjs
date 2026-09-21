import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: "export { mountQualityWidget } from './quality-widget';",
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'BrowserTest',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const config = (version = 1) => ({
  version,
  enabled: false,
  channel: 'chrome',
  driverAvailable: true,
  driverVersion: 'fixture-driver',
  reason: 'Configuration fixture DOM',
});
const response = (value, ok = true) => ({ ok, json: async () => value });

async function until(predicate) {
  for (let n = 0; n < 80; n++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected browser configuration state');
}

function fixture(t, fetcher, revisionId = null) {
  const dom = new JSDOM('<main></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.fetch = fetcher;
  dom.window.document.documentElement.lang = 'fr';
  dom.window.localStorage.setItem('devmethod:studio:language:v1', 'fr');
  dom.window.eval(bundle.outputFiles[0].text);
  const handle = dom.window.BrowserTest.mountQualityWidget(
    dom.window.document.querySelector('main'),
    { revisionId, onOpenSource() {} },
  );
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  const root = () => dom.window.document.querySelector('.quality-browser');
  return {
    dom,
    handle,
    root,
    button: (label) =>
      [...root().querySelectorAll('button')].find((node) => node.textContent === label),
  };
}

test('browser configuration is available without a candidate and saves only explicit CAS choices', async (t) => {
  const calls = [];
  const f = fixture(t, async (url, init) => {
    calls.push([url, init]);
    return response(config(calls.length));
  });
  await until(() => f.root()?.querySelector('select')?.disabled === false);
  f.root().querySelector('input').click();
  const select = f.root().querySelector('select');
  select.value = 'msedge';
  select.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  await setTimeout(10);
  assert.equal(calls.length, 1);
  f.button('Enregistrer le réglage').click();
  await until(() => calls.length === 2 && f.root().textContent.includes('Aucun navigateur lancé'));
  assert.deepEqual(JSON.parse(calls[1][1].body), {
    version: 1,
    enabled: true,
    channel: 'msedge',
    automatic: false,
  });
  assert.equal(calls[1][0], '/api/project/browser/configure');
  assert.equal(calls[1][1].credentials, 'same-origin');
  assert.match(f.root().textContent, /Aucun navigateur lancé/);
  assert.equal(
    calls.some(([url]) => url.includes('/run')),
    false,
  );
});

test('stale save retains choices, rereads version explicitly, and requires a new save click', async (t) => {
  let gets = 0,
    posts = 0;
  const payloads = [];
  const f = fixture(t, async (url, init) => {
    if (!init.method) return response(config(++gets));
    payloads.push(JSON.parse(init.body));
    return ++posts === 1
      ? response({ error: 'Version périmée' }, false)
      : response({ ...config(3), ...payloads.at(-1) });
  });
  await until(() => f.root()?.querySelector('input')?.disabled === false);
  f.root().querySelector('input').click();
  f.button('Enregistrer le réglage').click();
  await until(() => f.root().querySelector('[role=alert]'));
  assert.equal(f.root().querySelector('input').checked, true);
  assert.equal(f.button('Enregistrer le réglage').disabled, true);
  f.button('Relire la configuration').click();
  await until(() => !f.button('Enregistrer le réglage').disabled);
  assert.equal(f.root().querySelector('input').checked, true);
  assert.equal(posts, 1);
  f.button('Enregistrer le réglage').click();
  await until(() => posts === 2);
  assert.equal(payloads[1].version, 2);
  assert.equal(payloads[1].enabled, true);
});

test('configuration survives quality failure, save refreshes quality without running a check', async (t) => {
  let checks = 0;
  const f = fixture(
    t,
    async (url) => {
      if (url.startsWith('/api/project/checks')) {
        checks++;
        return response({ error: 'Rapport indisponible' }, false);
      }
      return response({ ...config(), reason: '<img src=x onerror=alert(1)>' });
    },
    'candidate',
  );
  await until(() => checks === 1 && f.root()?.querySelector('input')?.disabled === false);
  assert.equal(f.root().querySelector('img'), null);
  f.button('Enregistrer le réglage').click();
  await until(() => checks === 2);
  assert.equal(f.root().querySelector('input').disabled, false);
});

test('pending reads abort on disposal and cannot restore removed UI', async (t) => {
  let signal, finish;
  const f = fixture(t, (_url, init) => {
    signal = init.signal;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await until(() => signal);
  f.handle.dispose();
  assert.equal(signal.aborted, true);
  finish(response(config()));
  await setTimeout(10);
  assert.equal(f.root(), null);
});

test('revision changes keep browser choices and a pending save cannot submit twice', async (t) => {
  let finish,
    posts = 0;
  const f = fixture(t, async (url, init) => {
    if (url.startsWith('/api/project/checks'))
      return response({ error: 'Fixture sans rapport' }, false);
    if (init.method) {
      posts++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    }
    return response({ ...config(), enabled: true });
  });
  await until(() => f.root()?.querySelector('input')?.disabled === false);
  f.root().querySelector('input').click();
  f.handle.update({ revisionId: 'another', onOpenSource() {} });
  await setTimeout(10);
  assert.equal(f.root().querySelector('input').checked, false);
  f.button('Enregistrer le réglage').click();
  f.button('Enregistrer le réglage').click();
  await until(() => posts === 1);
  assert.equal(f.button('Enregistrer le réglage').disabled, true);
  finish(response(config(2)));
  await until(() => f.root().textContent.includes('Aucun navigateur lancé'));
  assert.equal(posts, 1);
});

test('browser receipt exposes assertion outcomes and provenance without promoting declared criteria', async (t) => {
  const receipt = {
    protocol: 'studio-browser-v1',
    channel: 'msedge',
    driverVersion: '1.fixture',
    browserVersion: '2.fixture',
    manifestFingerprint: 'manifest-fixture',
    sourceFingerprint: 'source-fixture',
    scenarios: [
      {
        id: 'create',
        title: '<img src=x onerror=alert(1)>',
        criterionIds: ['capacity'],
        status: 'failed',
        executedSteps: 3,
        assertions: [
          { step: 2, action: 'expectText', status: 'passed' },
          { step: 3, action: 'expectData', status: 'failed' },
        ],
      },
      {
        id: 'later',
        title: 'Scénario suivant',
        criterionIds: [],
        status: 'not-run',
        executedSteps: 0,
        assertions: [],
      },
    ],
  };
  const check = {
    id: 'business-browser',
    title: 'Parcours navigateur',
    category: 'functional',
    tool: 'Navigateur',
    objective: 'Capacité respectée',
    execution: 'studio',
    status: 'failed',
    freshness: 'current',
    canRun: false,
    evidence: {
      id: 'receipt',
      revisionId: 'candidate',
      status: 'failed',
      startedAt: '2026-09-21T10:00:00Z',
      finishedAt: null,
      durationMs: null,
      tool: 'Navigateur',
      environment: 'Fixture DOM',
      expected: 'Parcours déclaré satisfait',
      observed: 'Assertion de données non satisfaite',
      browser: receipt,
      findings: [
        { target: 'create:step-3', message: 'Données observées différentes du résultat attendu.' },
      ],
      limits: ['Couverture déclarée uniquement'],
      events: [],
    },
  };
  const report = {
    schemaVersion: 1,
    revisionId: 'candidate',
    fingerprint: 'fixture',
    generatedAt: '2026-09-21T10:00:00Z',
    environment: 'Fixture DOM',
    localChanges: false,
    capabilities: {},
    categories: [{ id: 'functional', label: 'Fonctionnel' }],
    checks: [check],
    historical: [],
    limits: [],
    flowModel: null,
  };
  const f = fixture(
    t,
    async (url) => response(url.startsWith('/api/project/checks') ? report : config()),
    'candidate',
  );
  await until(() => f.dom.window.document.querySelector('.quality-browser-receipt'));
  const detail = f.dom.window.document.querySelector('.quality-detail');
  assert.match(detail.textContent, /Parcours déclaré satisfait/);
  assert.match(detail.textContent, /Assertion de données non satisfaite/);
  assert.match(detail.textContent, /Étape 2 · Texte attendu · Satisfait/);
  assert.match(detail.textContent, /Étape 3 · Données attendues · En échec/);
  assert.match(detail.textContent, /Critères déclarés, non validés : capacity/);
  assert.match(detail.textContent, /Aucune assertion exécutée/);
  assert.match(detail.textContent, /2.fixture.*1.fixture.*studio-browser-v1/);
  assert.match(detail.textContent, /create:step-3/);
  assert.equal(detail.querySelector('img'), null);
});

function automaticCheckbox(f) {
  const label = [...(f.root()?.querySelectorAll('label') ?? [])].find((entry) =>
    entry.textContent.includes('Exécuter automatiquement après chaque candidat de l’agent'),
  );
  return label?.querySelector('input');
}

test('automatic browser consent defaults off for legacy settings, saves explicitly and clears on disable', async (t) => {
  const writes = [];
  const f = fixture(t, async (_url, init) => {
    if (!init.method) return response(config());
    const input = JSON.parse(init.body);
    writes.push(input);
    return response({ ...config(2), ...input, configurationId: 'local-identity' });
  });
  await until(() => f.root()?.querySelector('input')?.disabled === false);
  assert.ok(automaticCheckbox(f));
  assert.equal(automaticCheckbox(f).checked, false);
  assert.equal(automaticCheckbox(f).disabled, true);
  f.root().querySelector('input').click();
  automaticCheckbox(f).click();
  assert.equal(writes.length, 0);
  f.button('Enregistrer le réglage').click();
  await until(() => f.root().textContent.includes('Réglage enregistré'));
  assert.equal(writes[0].automatic, true);
  assert.match(f.root().textContent, /n’adopte aucune version/);
  f.root().querySelector('input').click();
  assert.equal(automaticCheckbox(f).checked, false);
  f.button('Enregistrer le réglage').click();
  await until(() => writes.length === 2);
  assert.equal(writes[1].automatic, false);
});

const emptyReport = (revisionId) => ({
  schemaVersion: 1,
  revisionId,
  fingerprint: 'fixture',
  generatedAt: '2026-09-21T10:00:00Z',
  environment: 'Fixture',
  localChanges: false,
  capabilities: {},
  categories: [],
  checks: [],
  historical: [],
  limits: [],
  flowModel: null,
});

test('automatic verification refreshes a constant revision only at transitions and rejects a late running report', async (t) => {
  let reads = 0,
    late;
  const f = fixture(
    t,
    async (url) => {
      if (url === '/api/project/browser') return response(config());
      reads++;
      if (reads === 2)
        return new Promise((resolve) => {
          late = resolve;
        });
      return response(emptyReport('candidate'));
    },
    'candidate',
  );
  await until(() => f.dom.window.document.querySelector('#quality-heading'));
  const running = { jobId: 'job', revisionId: 'candidate', status: 'running' };
  f.handle.update({ revisionId: 'candidate', verification: running, onOpenSource() {} });
  await until(() => reads === 2);
  assert.match(f.dom.window.document.body.textContent, /Vérification navigateur.*en cours/);
  for (let n = 0; n < 4; n++)
    f.handle.update({ revisionId: 'candidate', verification: { ...running }, onOpenSource() {} });
  await setTimeout(20);
  assert.equal(reads, 2);
  f.handle.update({
    revisionId: 'candidate',
    verification: { ...running, status: 'passed', receiptId: 'receipt', finishedAt: 'now' },
    onOpenSource() {},
  });
  await until(() => reads === 3 && f.dom.window.document.querySelector('#quality-heading'));
  late(response({ ...emptyReport('candidate'), limits: ['STALE RUNNING REPORT'] }));
  await setTimeout(20);
  assert.doesNotMatch(f.dom.window.document.body.textContent, /STALE RUNNING REPORT/);
  assert.match(f.dom.window.document.body.textContent, /Assertions satisfaites/);
  assert.equal(reads, 3);
});

test('automatic consent survives a conflict without saving itself after configuration reread', async (t) => {
  let posts = 0,
    reads = 0;
  const f = fixture(t, async (_url, init) => {
    if (!init.method)
      return response({
        ...config(++reads),
        enabled: true,
        automatic: false,
        configurationId: 'fixture-local',
      });
    posts++;
    return response({ error: 'Version périmée' }, false);
  });
  await until(() => automaticCheckbox(f)?.disabled === false);
  automaticCheckbox(f).click();
  f.button('Enregistrer le réglage').click();
  await until(() => f.root().querySelector('[role=alert]'));
  assert.equal(automaticCheckbox(f).checked, true);
  f.button('Relire la configuration').click();
  await until(() => !f.button('Enregistrer le réglage').disabled);
  assert.equal(automaticCheckbox(f).checked, true);
  assert.equal(posts, 1);
});

test('verification on another revision blocks competing runs without refreshing or relabeling this report', async (t) => {
  let reads = 0,
    posts = 0;
  const check = {
    id: 'syntax',
    title: 'Syntaxe',
    category: 'technical',
    tool: 'Fixture',
    objective: 'Syntaxe lisible',
    execution: 'studio',
    status: 'notrun',
    freshness: 'current',
    canRun: true,
    evidence: null,
  };
  const f = fixture(
    t,
    async (url, init) => {
      if (url === '/api/project/browser') return response(config());
      if (init.method === 'POST') posts++;
      reads++;
      return response({ ...emptyReport('displayed'), checks: [check] });
    },
    'displayed',
  );
  await until(() => f.dom.window.document.querySelector('.quality-primary'));
  f.handle.update({
    revisionId: 'displayed',
    verification: { jobId: 'job', revisionId: 'other', status: 'running' },
    onOpenSource() {},
  });
  await until(() => f.dom.window.document.querySelector('.quality-primary').disabled);
  f.dom.window.document.querySelector('.quality-primary').click();
  assert.equal(posts, 0);
  assert.equal(reads, 1);
  assert.match(f.dom.window.document.body.textContent, /ne concerne pas la version affichée/);
  assert.equal(
    f.dom.window.document.querySelector('.quality-heading strong').textContent,
    'displaye',
  );
  f.handle.update({
    revisionId: 'displayed',
    verification: { jobId: 'job', revisionId: 'other', status: 'blocked' },
    onOpenSource() {},
  });
  await until(() => !f.dom.window.document.querySelector('.quality-primary').disabled);
  assert.equal(reads, 1);
});

test('a late automatic report cannot replace the next selected revision', async (t) => {
  let finish;
  const f = fixture(
    t,
    async (url) => {
      if (url === '/api/project/browser') return response(config());
      const id = new URL(url, 'http://localhost').searchParams.get('revision');
      if (id === 'first')
        return new Promise((resolve) => {
          finish = resolve;
        });
      return response(emptyReport(id));
    },
    'first',
  );
  await until(() => finish);
  f.handle.update({
    revisionId: 'second',
    verification: { jobId: 'job', revisionId: 'first', status: 'passed' },
    onOpenSource() {},
  });
  await until(
    () => f.dom.window.document.querySelector('.quality-heading strong')?.textContent === 'second',
  );
  finish(response(emptyReport('first')));
  await setTimeout(20);
  assert.equal(
    f.dom.window.document.querySelector('.quality-heading strong').textContent,
    'second',
  );
});
