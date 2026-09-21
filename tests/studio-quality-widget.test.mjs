import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents:
      "export { mountQualityWidget } from './quality-widget'; export {filterChecks,summarizeChecks} from './features/quality/model/selectors';",
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'QualityTest',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let index = 0; index < 60; index++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected quality state was not rendered');
}

function row(id, status, category = 'functional', revisionId = 'first') {
  const evidence = ['failed', 'passed'].includes(status)
    ? {
        id: `evidence-${id}`,
        revisionId,
        status,
        startedAt: '2026-09-17T10:00:00Z',
        finishedAt: '2026-09-17T10:00:01Z',
        durationMs: 1000,
        tool: 'Analyseur borné',
        environment: 'Fixture contrôlée',
        expected: 'Syntaxe lisible',
        observed: status === 'failed' ? 'Un défaut observé' : 'Périmètre contrôlé',
        findings:
          status === 'failed'
            ? [{ source: { path: 'main.ts', line: 4 }, message: 'Erreur de syntaxe' }]
            : [],
        limits: ['Aucun comportement exécuté'],
        events: [{ label: 'Analyse effectuée', at: '2026-09-17T10:00:01Z' }],
      }
    : null;
  return {
    id,
    title: id,
    category,
    status,
    evidence,
    freshness: 'current',
    tool: 'Analyseur',
    execution: status === 'blocked' ? 'external' : 'studio',
    objective: 'Vérifier le périmètre',
    canRun: status !== 'blocked',
    reason: status === 'blocked' ? 'Outil absent' : undefined,
  };
}

function report(revisionId = 'first') {
  return {
    schemaVersion: 1,
    revisionId,
    fingerprint: 'a'.repeat(64),
    generatedAt: '2026-09-17T10:00:00Z',
    environment: 'Fixture',
    localChanges: false,
    capabilities: {},
    categories: [
      { id: 'functional', label: 'Fonctionnel' },
      { id: 'security', label: 'Sécurité' },
    ],
    checks: [
      row('Syntaxe', 'failed', 'functional', revisionId),
      row('JSON', 'passed', 'functional', revisionId),
      row('Autorisations', 'blocked', 'security', revisionId),
    ],
    historical: [],
    limits: ['Un contrôle ne valide pas toute l’application.'],
    flowModel: null,
  };
}

const response = (value, ok = true) => ({ ok, json: async () => value });

async function fixture(t, fetcher, configure = () => {}) {
  const dom = new JSDOM('<html lang="fr"><main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.fetch = (url, init) =>
    url === '/api/project/browser'
      ? Promise.resolve(
          response({
            version: 1,
            enabled: false,
            channel: 'chrome',
            driverAvailable: false,
            driverVersion: null,
            reason: 'Fixture navigateur désactivé',
          }),
        )
      : fetcher(url, init);
  configure(dom.window);
  dom.window.document.documentElement.lang = 'fr';
  dom.window.localStorage.setItem('devmethod:studio:language:v1', 'fr');
  dom.window.eval(bundle.outputFiles[0].text);
  const sources = [],
    options = { revisionId: 'first', onOpenSource: (...args) => sources.push(args) };
  const handle = dom.window.QualityTest.mountQualityWidget(
    dom.window.document.getElementById('root'),
    options,
  );
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  return { dom, document: dom.window.document, handle, options, sources };
}

test('filters and counters describe the displayed scope; a real failure opens its source', async (t) => {
  const f = await fixture(t, async () => response(report()));
  await until(() => f.document.querySelectorAll('tbody tr').length === 3);
  assert.equal(f.document.querySelector('.quality-summary-passed strong').textContent, '1');
  assert.equal(f.document.querySelector('.quality-summary-failed strong').textContent, '1');
  const source = [...f.document.querySelectorAll('button')].find((button) =>
    button.textContent.includes('main.ts:4'),
  );
  source.click();
  assert.deepEqual(f.sources, [['main.ts', 4, 'first']]);
  [...f.document.querySelectorAll('.quality-categories button')]
    .find((button) => button.textContent === 'Sécurité')
    .click();
  await until(() => f.document.querySelectorAll('tbody tr').length === 1);
  assert.equal(f.document.querySelector('.quality-summary-passed strong').textContent, '0');
  assert.equal(f.document.querySelector('.quality-summary-waiting strong').textContent, '1');
  assert.equal(f.document.querySelector('.quality-primary'), null);
  assert.match(f.document.querySelector('.quality-detail').textContent, /Outil absent/);
});

test('external evidence identifies the reported tool and version without claiming the whole planned method ran', async (t) => {
  const value = report();
  const external = value.checks[0];
  external.tool = 'Node --check / parseur TypeScript installé';
  external.evidence.tool = 'Node.js --check';
  external.evidence.toolVersion = '24.10.0';
  external.evidence.provider = {
    connectionId: 'node-local',
    optionId: 'node-check',
    connectionVersion: 1,
    probeId: 'probe-node',
    attestation: 'host-bridge',
  };
  external.evidence.source = { kind: 'host-local' };
  const f = await fixture(t, async () => response(value));
  await until(() => f.document.querySelectorAll('tbody tr').length === 3);
  const methods = [...f.document.querySelectorAll('tbody .quality-method')];
  assert.match(methods[0].textContent, /Node\.js --check 24\.10\.0/);
  assert.match(methods[0].textContent, /rapport de l’hôte/);
  assert.doesNotMatch(methods[0].textContent, /TypeScript/);
  assert.equal(methods[1].textContent, value.checks[1].tool);
  assert.equal(methods[2].textContent, value.checks[2].tool);
});

test('refresh hides old successes until a current report is read, including after an integrity error', async (t) => {
  let reads = 0,
    finishRefresh;
  const f = await fixture(t, async () => {
    if (++reads === 2)
      return new Promise((resolve) => {
        finishRefresh = resolve;
      });
    return response(report());
  });
  await until(() => f.document.querySelector('.quality-summary-passed strong'));
  [...f.document.querySelectorAll('.quality-categories button')]
    .find((button) => button.textContent === 'Fonctionnel')
    .click();
  await until(() => f.document.querySelectorAll('tbody tr').length === 2);
  assert.equal(f.document.querySelector('.quality-summary-passed strong').textContent, '1');
  [...f.document.querySelectorAll('button')]
    .find((button) => button.textContent === 'Actualiser')
    .click();
  await until(() => finishRefresh);
  assert.equal(f.document.querySelector('.quality-summary-passed'), null);
  assert.equal(f.document.querySelector('[data-quality-run-all]'), null);
  finishRefresh(response({ error: 'Intégrité indisponible' }, false));
  await until(() => f.document.body.textContent.includes('Intégrité indisponible'));
  assert.equal(f.document.querySelector('.quality-summary-passed'), null);
  f.document.querySelector('.quality-workspace:not(.quality-browser) button').click();
  await until(() => f.document.querySelector('tbody'));
  assert.equal(f.document.querySelectorAll('tbody tr').length, 2);
  assert.equal(
    f.document.querySelector('.quality-categories [aria-pressed="true"]').textContent,
    'Fonctionnel',
  );
});

function captureDeadlines(window, deadlines) {
  window.AbortSignal.timeout = (milliseconds) => {
    const controller = new window.AbortController();
    deadlines.push({
      milliseconds,
      expire: () => controller.abort(new window.DOMException('Transport timeout', 'TimeoutError')),
    });
    return controller.signal;
  };
}

function waitForTransportAbort(signal) {
  return new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}

test('reading checks has a 15 second transport deadline and can retry without inventing evidence', async (t) => {
  const deadlines = [];
  let reads = 0;
  const f = await fixture(
    t,
    async (_url, init) => {
      if (++reads === 1) return waitForTransportAbort(init.signal);
      return response(report());
    },
    (window) => captureDeadlines(window, deadlines),
  );
  await until(() => deadlines.length === 1);
  assert.equal(deadlines[0].milliseconds, 15_000);
  deadlines[0].expire();
  await until(() => f.document.body.textContent.includes('Délai de réponse dépassé (15 s)'));
  assert.equal(f.document.querySelector('.quality-summary'), null);
  f.document.querySelector('.quality-workspace:not(.quality-browser) button').click();
  await until(() => f.document.querySelector('tbody'));
  assert.equal(reads, 2);
  assert.equal(f.document.querySelector('.quality-summary-passed strong').textContent, '1');
});

test('a 30 second run transport timeout stops the batch and clears unconfirmed results', async (t) => {
  const deadlines = [],
    calls = [],
    changes = [];
  const f = await fixture(
    t,
    async (_url, init) => {
      if (init?.method !== 'POST') return response(report());
      calls.push(JSON.parse(init.body));
      return waitForTransportAbort(init.signal);
    },
    (window) => captureDeadlines(window, deadlines),
  );
  f.handle.update({ ...f.options, onStateChanged: () => changes.push('changed') });
  await until(() => f.document.querySelector('[data-quality-run-all]'));
  f.document.querySelector('[data-quality-run-all]').click();
  await until(() => calls.length === 1);
  assert.deepEqual(
    deadlines.map((item) => item.milliseconds),
    [15_000, 30_000],
  );
  deadlines[1].expire();
  await until(() => f.document.body.textContent.includes('Délai de réponse dépassé (30 s)'));
  assert.match(f.document.body.textContent, /une exécution peut continuer côté serveur/);
  assert.equal(f.document.querySelector('.quality-summary-passed'), null);
  assert.equal(calls.length, 1);
  assert.equal(changes.length, 0);
  assert.equal(
    f.document.querySelector('.quality-workspace:not(.quality-browser) button').textContent,
    'Réessayer',
  );
});

test('run sends the exact revision; delayed response never replaces another revision', async (t) => {
  let finishRun, requestBody;
  const f = await fixture(t, async (url, init) => {
    if (init?.method === 'POST') {
      requestBody = JSON.parse(init.body);
      return new Promise((resolve) => {
        finishRun = resolve;
      });
    }
    return response(report(url.includes('second') ? 'second' : 'first'));
  });
  await until(() => f.document.querySelector('.quality-primary'));
  f.document.querySelector('.quality-primary').click();
  await until(() => finishRun);
  assert.deepEqual(requestBody, { revisionId: 'first', checkId: 'Syntaxe' });
  assert.equal(f.document.querySelector('.quality-primary').disabled, true);
  assert.equal(f.document.querySelector('.quality-summary-failed strong').textContent, '0');
  assert.match(
    f.document.querySelector('.quality-workspace:not(.quality-browser) .quality-filters')
      .textContent,
    /1 en cours/,
  );
  f.handle.update({ ...f.options, revisionId: 'second' });
  await until(() => f.document.querySelector('.quality-heading strong')?.textContent === 'second');
  finishRun(response({ ...report('first'), checks: [row('Obsolete result', 'passed')] }));
  await setTimeout(20);
  assert.equal(f.document.querySelector('.quality-heading strong').textContent, 'second');
  assert.equal(f.document.body.textContent.includes('Obsolete result'), false);
});

test('stale proof is not counted as current success and a loading failure can be retried', async (t) => {
  let reads = 0;
  const f = await fixture(t, async () => {
    if (++reads === 1) return response({ error: 'Sources indisponibles' }, false);
    const data = report();
    data.checks[1].freshness = 'reevaluate';
    return response(data);
  });
  await until(() => f.document.body.textContent.includes('Sources indisponibles'));
  f.document.querySelector('.quality-workspace:not(.quality-browser) button').click();
  await until(() => f.document.querySelector('tbody'));
  assert.equal(f.document.querySelector('.quality-summary-passed strong').textContent, '0');
  assert.match(f.document.body.textContent, /À réévaluer/);
  const filtered = f.dom.window.QualityTest.filterChecks(report().checks, 'security', 'all');
  assert.equal(filtered.length, 1);
  assert.equal(f.dom.window.QualityTest.summarizeChecks(filtered).configure, 1);
});

test('available checks run sequentially on the selected revision and never run external techniques', async (t) => {
  const calls = [];
  let releaseFirst;
  const data = report();
  const f = await fixture(t, async (_url, init) => {
    if (init?.method !== 'POST') return response(data);
    const body = JSON.parse(init.body);
    calls.push(body);
    if (calls.length === 1)
      await new Promise((resolve) => {
        releaseFirst = resolve;
      });
    data.checks = data.checks.map((check) =>
      check.id === body.checkId ? row(check.id, 'passed') : check,
    );
    return response(structuredClone(data));
  });
  await until(() => f.document.querySelector('[data-quality-run-all]'));
  f.document.querySelector('[data-quality-run-all]').click();
  await until(() => releaseFirst);
  assert.equal(calls.length, 1);
  assert.match(f.document.querySelector('.quality-batch').textContent, /0.*2/);
  releaseFirst();
  await until(() => f.document.querySelector('.quality-batch').textContent.includes('Terminés'));
  assert.deepEqual(calls, [
    { revisionId: 'first', checkId: 'Syntaxe' },
    { revisionId: 'first', checkId: 'JSON' },
  ]);
  assert.equal(f.document.querySelector('.quality-summary-passed strong').textContent, '2');
});

test('changing revision during a batch never starts the remaining old checks', async (t) => {
  const calls = [];
  let release;
  const f = await fixture(t, async (url, init) => {
    if (init?.method !== 'POST')
      return response(report(url.includes('second') ? 'second' : 'first'));
    calls.push(JSON.parse(init.body));
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  await until(() => f.document.querySelector('[data-quality-run-all]'));
  f.document.querySelector('[data-quality-run-all]').click();
  await until(() => release);
  f.handle.update({ ...f.options, revisionId: 'second' });
  await until(() => f.document.querySelector('.quality-heading strong')?.textContent === 'second');
  release(response(report('first')));
  await setTimeout(20);
  assert.equal(calls.length, 1);
  assert.equal(f.document.querySelector('.quality-heading strong').textContent, 'second');
});

test('failure and tool configuration prepare contextual DevMethod requests without executing an agent', async (t) => {
  let posts = 0;
  const f = await fixture(t, async (_url, init) => {
    if (init?.method) posts++;
    return response(report());
  });
  const prepared = [];
  f.handle.update({ ...f.options, onPrepareRequest: (value) => prepared.push(value) });
  await until(() => f.document.querySelector('[data-quality-prepare]'));
  f.document.querySelector('[data-quality-prepare]').click();
  assert.equal(prepared[0].kind, 'fix');
  assert.equal(prepared[0].revisionId, 'first');
  assert.match(prepared[0].prompt, /main.ts:4/);
  assert.match(prepared[0].prompt, /Un défaut observé/);
  [...f.document.querySelectorAll('.quality-categories button')]
    .find((b) => b.textContent === 'Sécurité')
    .click();
  await until(
    () =>
      f.document.querySelector('[data-quality-prepare]')?.textContent ===
      'Préparer le raccordement de ce contrôle',
  );
  assert.match(f.document.querySelector('.quality-table').textContent, /Connexion nécessaire/);
  assert.equal(f.document.querySelector('.quality-summary-failed strong').textContent, '0');
  f.document.querySelector('[data-quality-prepare]').click();
  assert.equal(prepared[1].kind, 'connect');
  assert.match(prepared[1].prompt, /Outil absent/);
  assert.equal(posts, 0);
});

test('stopping a batch lets its current check finish but does not start the remaining checks', async (t) => {
  const calls = [];
  let release;
  const f = await fixture(t, async (_url, init) => {
    if (init?.method !== 'POST') return response(report());
    calls.push(JSON.parse(init.body));
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  await until(() => f.document.querySelector('[data-quality-run-all]'));
  f.document.querySelector('[data-quality-run-all]').click();
  await until(() => release);
  [...f.document.querySelectorAll('.quality-batch button')]
    .find((b) => b.textContent === 'Arrêter après ce contrôle')
    .click();
  release(response(report()));
  await until(() =>
    f.document.querySelector('.quality-batch').textContent.includes('Série interrompue'),
  );
  assert.equal(calls.length, 1);
  assert.match(f.document.querySelector('.quality-batch').textContent, /1 \/ 2/);
});
