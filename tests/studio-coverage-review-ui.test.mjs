import { setLocale } from '../scripts/studio/public/i18n.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
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
  globalName: 'CoverageFixture',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const response = (value, ok = true) => ({ ok, json: async () => value });
const review = (revisionId = 'candidate', receiptId = 'receipt') => ({
  version: 4,
  revision: { id: revisionId, title: 'Candidate fixture' },
  receipt: {
    id: receiptId,
    status: 'passed',
    freshness: 'current',
    protocol: 'studio-browser-v1',
    driverVersion: 'fixture',
    browserVersion: 'fixture',
  },
  reviewKey: 'review-fixture',
  canReview: true,
  reason: null,
  criteria: [
    { id: 'capacity', text: 'Respecter exactement la capacité <script>injection()</script>' },
  ],
  scenarios: [
    {
      id: 'create',
      title: 'Création contrôlée',
      criterionIds: ['capacity'],
      steps: [
        { action: 'fill', target: { role: 'textbox', name: 'Titre' }, value: '{{nonce}}' },
        { action: 'expectData', path: ['items'], expected: [{ title: '{{nonce}}' }] },
      ],
      status: 'passed',
      executedSteps: 2,
      assertions: [{ step: 2, action: 'expectData', status: 'passed' }],
      canCover: true,
    },
    {
      id: 'other',
      title: 'Autre scénario',
      criterionIds: [],
      steps: [{ action: 'expectVisible', target: { testId: 'list' } }],
      status: 'not-run',
      executedSteps: 0,
      assertions: [],
      canCover: false,
    },
  ],
  reviews: [
    {
      decisionId: 'old',
      criterionId: 'capacity',
      conclusion: 'partial',
      scope: 'Liste initiale',
      reason: 'Capacité limite non couverte',
      freshness: 'reevaluate',
      scenarioIds: ['create'],
    },
  ],
  limits: ['Déclarations de scénario uniquement.'],
});

function report(revisionId) {
  return {
    schemaVersion: 1,
    revisionId,
    fingerprint: 'fixture',
    localChanges: false,
    categories: [],
    historical: [],
    limits: [],
    flowModel: null,
    checks: [
      {
        id: 'business-browser',
        title: 'Navigateur',
        category: 'functional',
        tool: 'Fixture',
        objective: 'Parcours déclaré',
        execution: 'studio',
        status: 'passed',
        freshness: 'current',
        canRun: false,
        evidence: {
          id: 'receipt-' + revisionId,
          revisionId,
          status: 'passed',
          expected: 'Parcours déclaré',
          observed: 'Assertions satisfaites',
          tool: 'Fixture',
          startedAt: '2026-09-21T10:00:00Z',
          findings: [],
          limits: [],
          events: [],
        },
      },
    ],
  };
}

async function until(predicate) {
  for (let n = 0; n < 100; n++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected coverage UI state');
}

function fixture(t, responder, makeReport = report) {
  const dom = new JSDOM('<main></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  setLocale('fr', dom.window.document, dom.window);
  const calls = [],
    changed = [];
  dom.window.fetch = async (url, init = {}) => {
    calls.push([url, init]);
    if (url === '/api/project/browser')
      return response({
        version: 1,
        enabled: false,
        automatic: false,
        channel: 'chrome',
        driverAvailable: false,
        driverVersion: null,
        reason: 'Fixture DOM',
      });
    if (url.startsWith('/api/project/checks?'))
      return response(makeReport(new URL(url, 'http://localhost').searchParams.get('revision')));
    return responder(url, init);
  };
  dom.window.eval(bundle.outputFiles[0].text);
  const options = {
    revisionId: 'candidate',
    onOpenSource() {},
    onStateChanged() {
      changed.push('changed');
    },
  };
  const handle = dom.window.CoverageFixture.mountQualityWidget(
    dom.window.document.querySelector('main'),
    options,
  );
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  const root = () => dom.window.document.querySelector('.quality-coverage-review');
  const button = (text) =>
    [...root().querySelectorAll('button')].find((node) => node.textContent === text);
  const field = (text) =>
    [...root().querySelectorAll('label')]
      .find((node) => node.textContent.startsWith(text))
      ?.querySelector('input,select,textarea');
  const type = (text, value) => {
    const input = field(text);
    const prototype =
      input.tagName === 'TEXTAREA'
        ? dom.window.HTMLTextAreaElement.prototype
        : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  return { dom, handle, options, calls, changed, root, button, field, type };
}

async function open(f) {
  await until(() => f.root());
  f.button('Examiner la couverture métier').click();
  await until(() => f.root().querySelector('select'));
}

function choose(f, conclusion = 'partial') {
  const select = f.field('Critère à examiner');
  select.value = 'capacity';
  select.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  f.field('Création contrôlée').click();
  f.root().querySelector(`input[value="${conclusion}"]`).click();
  f.type('Périmètre', 'Scénario de création uniquement');
  f.type('Justification', 'La limite de capacité reste à examiner');
}

test('coverage is read on demand, exposes exact declarations and requires explicit choices before saving', async (t) => {
  let recorded = false;
  const f = fixture(t, async (_url, init) => {
    if (init.method) {
      recorded = true;
      return response({ state: {}, decision: {} });
    }
    const value = review('candidate', 'receipt-candidate');
    if (recorded)
      value.reviews.push({
        ...value.reviews[0],
        decisionId: 'new-decision',
        reason: 'Nouvelle appréciation effectivement relue',
      });
    return response(value);
  });
  await until(() => f.root());
  assert.equal(f.calls.filter(([url]) => url.startsWith('/api/coverage-review')).length, 0);
  await open(f);
  assert.equal(f.root().querySelectorAll('input:checked').length, 0);
  assert.equal(f.field('Critère à examiner').value, '');
  assert.equal(f.button('Enregistrer l’appréciation').disabled, true);
  assert.match(
    f.root().textContent,
    /Respecter exactement la capacité <script>injection\(\)<\/script>/,
  );
  assert.equal(f.root().querySelector('script'), null);
  assert.match(f.root().textContent, /\{\{nonce\}\}/);
  assert.match(f.root().textContent, /Liste initiale/);
  assert.match(f.root().textContent, /réévaluer/i);
  choose(f);
  f.type('Justification', '   ');
  assert.equal(f.button('Enregistrer l’appréciation').disabled, true);
  f.type('Justification', 'La limite de capacité reste à examiner');
  await until(() => !f.button('Enregistrer l’appréciation').disabled);
  f.button('Enregistrer l’appréciation').click();
  await until(() => f.changed.length === 1);
  const post = f.calls.find(
    ([url, init]) => url === '/api/coverage-review' && init.method === 'POST',
  );
  assert.deepEqual(JSON.parse(post[1].body), {
    version: 4,
    revisionId: 'candidate',
    receiptId: 'receipt-candidate',
    reviewKey: 'review-fixture',
    criterionId: 'capacity',
    scenarioIds: ['create'],
    conclusion: 'partial',
    scope: 'Scénario de création uniquement',
    reason: 'La limite de capacité reste à examiner',
  });
  await until(() => f.calls.filter(([url]) => url.startsWith('/api/project/checks?')).length === 2);
  await until(() => f.root()?.textContent.includes('Appréciation enregistrée'));
  assert.match(
    f.root().querySelector('form').nextElementSibling.textContent,
    /Appréciation enregistrée/,
  );
  assert.equal(f.field('Périmètre').value, 'Scénario de création uniquement');
  assert.equal(f.field('Création contrôlée').checked, true);
  await until(() => f.root().textContent.includes('Nouvelle appréciation effectivement relue'));
  assert.equal(
    f.calls.some(([url]) => url.includes('/run') || url.includes('/activate')),
    false,
  );
});

test('conflict keeps every draft field and requires a fresh examination then another submit', async (t) => {
  let reads = 0,
    posts = 0;
  const f = fixture(t, async (_url, init) => {
    if (init.method) {
      posts++;
      return response({ error: 'Contexte périmé' }, false);
    }
    return response({ ...review('candidate', 'receipt-candidate'), version: ++reads + 3 });
  });
  await open(f);
  choose(f, 'sufficient');
  await until(() => !f.button('Enregistrer l’appréciation').disabled);
  f.button('Enregistrer l’appréciation').click();
  await until(() => f.root().querySelector('[role=alert]'));
  assert.equal(f.root().querySelector('form').nextElementSibling.getAttribute('role'), 'alert');
  assert.equal(f.field('Périmètre').value, 'Scénario de création uniquement');
  assert.equal(f.field('Justification').value, 'La limite de capacité reste à examiner');
  assert.equal(f.field('Création contrôlée').checked, true);
  assert.equal(f.root().querySelector('input[value=sufficient]').checked, true);
  assert.equal(f.button('Enregistrer l’appréciation').disabled, true);
  f.button('Actualiser l’examen').click();
  await until(() => !f.button('Enregistrer l’appréciation').disabled);
  assert.equal(posts, 1);
  f.button('Enregistrer l’appréciation').click();
  await until(() => posts === 2);
  const payloads = f.calls
    .filter(([, init]) => init.method === 'POST')
    .map(([, init]) => JSON.parse(init.body));
  assert.equal(payloads[1].version, 5);
});

test('sufficient conclusion requires a passing receipt and every selected scenario canCover', async (t) => {
  let value = review('candidate', 'receipt-candidate');
  const f = fixture(t, async () => response(value));
  await open(f);
  choose(f);
  assert.equal(f.root().querySelector('input[value=sufficient]').disabled, false);
  f.field('Autre scénario').click();
  assert.equal(f.root().querySelector('input[value=sufficient]').disabled, true);
  assert.equal(f.root().querySelector('input[value=partial]').disabled, false);
  f.field('Autre scénario').click();
  f.root().querySelector('input[value=sufficient]').click();
  value = { ...value, receipt: { ...value.receipt, status: 'failed' } };
  f.button('Actualiser l’examen').click();
  await until(() => f.root().querySelector('input[value=sufficient]').disabled);
  assert.equal(f.button('Enregistrer l’appréciation').disabled, true);
});

test('late reads for a previous revision or receipt cannot restore the old examination', async (t) => {
  let finish, signal;
  const f = fixture(t, (_url, init) => {
    signal = init.signal;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await until(() => f.root());
  f.button('Examiner la couverture métier').click();
  await until(() => finish);
  f.handle.update({ ...f.options, revisionId: 'next' });
  await until(
    () => f.dom.window.document.querySelector('.quality-heading strong')?.textContent === 'next',
  );
  assert.equal(signal.aborted, true);
  finish(response(review('candidate', 'receipt-candidate')));
  await setTimeout(20);
  assert.equal(f.root().querySelector('select'), null);
  assert.ok(f.button('Examiner la couverture métier'));
});

test('pending submit is single-flight and disposal prevents late notification', async (t) => {
  let finish,
    posts = 0;
  const f = fixture(t, async (_url, init) => {
    if (init.method) {
      posts++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    }
    return response(review('candidate', 'receipt-candidate'));
  });
  await open(f);
  choose(f);
  await until(() => !f.button('Enregistrer l’appréciation').disabled);
  f.button('Enregistrer l’appréciation').click();
  f.root()
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => posts === 1);
  f.handle.dispose();
  finish(response({ state: {}, decision: {} }));
  await setTimeout(20);
  assert.equal(posts, 1);
  assert.equal(f.changed.length, 0);
});

test('unavailable reviews remain inspectable without permitting a decision', async (t) => {
  const f = fixture(t, async () =>
    response({
      ...review('candidate', 'receipt-candidate'),
      canReview: false,
      reason: 'Reçu obsolète',
    }),
  );
  await open(f);
  assert.match(f.root().textContent, /Examen indisponible : Reçu obsolète/);
  assert.equal(f.root().querySelector('form fieldset').disabled, true);
  assert.match(f.root().textContent, /Capacité limite non couverte/);
});

test('refresh preserves removed scenario choices and lets the reviewer explicitly clear them', async (t) => {
  let next = review('candidate', 'receipt-candidate');
  const f = fixture(t, async () => response(next));
  await open(f);
  choose(f);
  next = { ...next, scenarios: next.scenarios.filter((scenario) => scenario.id !== 'create') };
  f.button('Actualiser l’examen').click();
  await until(() => f.root().textContent.includes('Scénario devenu indisponible'));
  assert.equal(f.button('Enregistrer l’appréciation').disabled, true);
  f.field('Scénario devenu indisponible').click();
  f.field('Autre scénario').click();
  assert.equal(f.button('Enregistrer l’appréciation').disabled, false);
  assert.equal(f.field('Périmètre').value, 'Scénario de création uniquement');
});

test('a mismatched receipt response is rejected without enabling a decision', async (t) => {
  const f = fixture(t, async () => response(review('candidate', 'wrong-receipt')));
  await until(() => f.root());
  f.button('Examiner la couverture métier').click();
  await until(() => f.root().querySelector('[role=alert]'));
  assert.match(f.root().textContent, /ne correspond pas/);
  assert.equal(f.button('Actualiser l’examen').nextElementSibling.getAttribute('role'), 'alert');
  assert.equal(f.root().querySelector('form'), null);
});

test('replacing the receipt on the same revision aborts the previous review and requires reopening', async (t) => {
  let finish,
    signal,
    receiptId = 'receipt-candidate';
  const f = fixture(
    t,
    (_url, init) => {
      signal = init.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    (revisionId) => {
      const value = report(revisionId);
      value.checks[0].evidence.id = receiptId;
      return value;
    },
  );
  await until(() => f.root());
  f.button('Examiner la couverture métier').click();
  await until(() => finish);
  receiptId = 'replacement';
  f.handle.update({
    ...f.options,
    verification: {
      jobId: 'job',
      revisionId: 'candidate',
      status: 'passed',
      receiptId: 'replacement',
    },
  });
  await until(() => signal.aborted && f.root() && f.button('Examiner la couverture métier'));
  finish(response(review('candidate', 'receipt-candidate')));
  await setTimeout(20);
  assert.equal(f.root().querySelector('select'), null);
});

test('historical appreciation names the recorded criterion instead of attributing it to edited text', async (t) => {
  const value = review('candidate', 'receipt-candidate');
  value.criteria[0].text = 'Nouveau critère de capacité';
  value.reviews[0].criterionText = 'Ancien critère apprécié avec une limite différente';
  const f = fixture(t, async () => response(value));
  await open(f);
  const existing = [...f.root().querySelectorAll('details')].find((entry) =>
    entry.querySelector('summary')?.textContent.startsWith('Appréciations enregistrées'),
  );
  assert.equal(existing.querySelector('h4').textContent, value.reviews[0].criterionText);
  assert.doesNotMatch(existing.textContent, /Nouveau critère/);
  assert.match(f.field('Critère à examiner').textContent, /Nouveau critère/);
});
