import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { fileManifest } from '../scripts/studio/files.mjs';
import { qualitySnapshot } from '../scripts/studio/quality-storage.mjs';
import { runBrowserVerification } from '../scripts/studio/browser-execution.mjs';
import { runBrowserScenarios } from '../scripts/studio/browser-verifier.mjs';

// Deliberately simulated browser driver. Real preview HTTP and data files, no browser process.
// These tests exercise the product adapter contract, not real browser behavior or isolation.
function fixture(t, scenarios) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'browser-harness-'));
  const app = path.join(root, 'revisions/fixture/app');
  fs.mkdirSync(app, { recursive: true });
  fs.writeFileSync(
    path.join(app, 'index.html'),
    '<!doctype html><h1>Fixture, never executed by this harness</h1>',
  );
  fs.writeFileSync(
    path.join(app, 'devmethod.browser.json'),
    JSON.stringify({ schemaVersion: 1, scenarios }),
  );
  fs.mkdirSync(path.join(root, '.devmethod'));
  fs.writeFileSync(
    path.join(root, '.devmethod/data.json'),
    JSON.stringify({ version: 17, data: { private: 'do-not-touch' } }),
  );
  const revision = { id: 'fixture', files: fileManifest(app) };
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, app, snapshot: qualitySnapshot({ root }, revision) };
}

const visible = { action: 'expectVisible', target: { testId: 'field' } };
const scenario = (steps = [visible], id = 'scenario') => ({
  id,
  title: 'Controlled harness',
  criterionIds: ['persistence'],
  steps,
});

function driverHarness(options = {}) {
  const calls = {
    contexts: [],
    pages: [],
    launches: [],
    browserClosed: 0,
    contextClosed: 0,
    values: [],
  };
  const browser = {
    version: () => 'controlled-harness-not-a-browser',
    close: async () => {
      calls.browserClosed++;
      await options.close?.();
    },
    async newContext(contextOptions) {
      const events = {};
      const context = {
        setDefaultTimeout() {},
        setDefaultNavigationTimeout() {},
        route: async (_pattern, handler) => {
          context.httpRoute = handler;
        },
        routeWebSocket: async (_pattern, handler) => {
          context.socketRoute = handler;
        },
        on: (name, handler) => {
          events[name] = handler;
        },
        close: async () => {
          calls.contextClosed++;
        },
        async newPage() {
          let origin,
            value = '';
          const pageEvents = {};
          const page = {
            on: (name, handler) => {
              pageEvents[name] = handler;
            },
            close: async () => {},
            async goto(url) {
              origin = new URL(url).origin;
              assert.equal((await fetch(url)).status, 200);
              value = (await (await fetch(origin + '/api/data')).json()).data.value ?? '';
              await options.onGoto?.({ context, page, origin, pageEvents, events });
            },
            async reload() {
              await page.goto(origin + '/');
            },
            getByTestId() {
              return locator;
            },
            getByRole() {
              return locator;
            },
          };
          const locator = {
            async fill(next) {
              value = next;
              calls.values.push(next);
            },
            async click() {
              const data = await (await fetch(origin + '/api/data')).json();
              const response = await fetch(origin + '/api/data', {
                method: 'POST',
                headers: { Origin: origin, 'Content-Type': 'application/json' },
                body: JSON.stringify({ version: data.version, data: { value } }),
              });
              assert.equal(response.status, 200);
            },
            async waitFor() {
              await options.waitFor?.();
            },
            async inputValue() {
              return value;
            },
            async textContent() {
              return '  Saved\n successfully ';
            },
          };
          events.page?.(page);
          calls.pages.push(page);
          return page;
        },
      };
      calls.contexts.push({ context, options: contextOptions });
      return context;
    },
  };
  return {
    calls,
    browser,
    load: async () => ({
      version: 'controlled-harness',
      chromium: {
        launch: async (launchOptions) => {
          calls.launches.push(launchOptions);
          await options.launch?.();
          return browser;
        },
      },
    }),
  };
}

test('controlled harness exercises nonce, real private data endpoint and restart without user data mutation', async (t) => {
  const steps = [
    { action: 'expectData', path: [], expected: {} },
    { action: 'fill', target: { testId: 'field' }, value: 'unique-{{nonce}}' },
    { action: 'click', target: { role: 'button', name: 'Save' } },
    { action: 'expectData', path: ['value'], expected: 'unique-{{nonce}}' },
    { action: 'restart' },
    { action: 'expectValue', target: { testId: 'field' }, value: 'unique-{{nonce}}' },
    { action: 'expectText', target: { testId: 'status' }, text: 'Saved successfully' },
    { action: 'reload' },
    visible,
  ];
  const f = fixture(t, [
    scenario(steps),
    scenario([{ action: 'expectData', path: [], expected: {} }], 'empty-next'),
  ]);
  const harness = driverHarness();
  const result = await runBrowserVerification(f.snapshot, { channel: 'chrome' }, harness.load);
  assert.equal(result.status, 'passed', JSON.stringify(result));
  assert.equal(result.browser.protocol, 'studio-browser-v1');
  assert.equal(result.browser.browserVersion, 'controlled-harness-not-a-browser');
  assert.equal(result.browser.scenarios[0].assertions.length, 5);
  assert.ok(result.browser.scenarios.every((entry) => entry.status === 'passed'));
  assert.match(harness.calls.values[0], /^unique-[a-f0-9-]{36}$/);
  assert.equal(harness.calls.contexts.length, 3);
  assert.ok(
    harness.calls.contexts.every(
      (entry) =>
        entry.options.serviceWorkers === 'block' &&
        entry.options.acceptDownloads === false &&
        entry.options.permissions.length === 0,
    ),
  );
  assert.equal(harness.calls.launches[0].chromiumSandbox, true);
  assert.equal(harness.calls.launches[0].headless, true);
  assert.deepEqual(
    Object.keys(harness.calls.launches[0].env).sort(),
    ['HOME', 'LANG', 'TEMP', 'TMP', 'TMPDIR', 'USERPROFILE'].sort(),
  );
  assert.equal(fs.existsSync(harness.calls.launches[0].env.HOME), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root, '.devmethod/data.json'))), {
    version: 17,
    data: { private: 'do-not-touch' },
  });
  assert.equal(harness.calls.contextClosed, 3);
  assert.equal(harness.calls.browserClosed, 1);
});

test('controlled harness failed assertion is failure and does not claim later scenarios ran', async (t) => {
  const f = fixture(t, [scenario(), scenario([visible], 'later')]);
  const harness = driverHarness({
    waitFor: () => {
      throw new Error('private browser error');
    },
  });
  const result = await runBrowserVerification(f.snapshot, { channel: 'msedge' }, harness.load);
  assert.equal(result.status, 'failed');
  assert.equal(result.browser.scenarios[0].assertions[0].status, 'failed');
  assert.equal(result.browser.scenarios[1].status, 'not-run');
  assert.doesNotMatch(JSON.stringify(result), /private browser error/);
});

test('controlled routing refuses external origins, websocket and popup without making external requests', async (t) => {
  const f = fixture(t, [scenario()]);
  let continued = 0,
    aborted = 0,
    socketsClosed = 0,
    popupClosed = 0;
  const harness = driverHarness({
    onGoto: async ({ context, origin, events }) => {
      await context.httpRoute({
        request: () => ({ url: () => origin + '/api/data' }),
        continue: () => {
          continued++;
        },
      });
      await context.httpRoute({
        request: () => ({ url: () => 'https://example.invalid/private' }),
        abort: () => {
          aborted++;
        },
      });
      context.socketRoute({
        close: () => {
          socketsClosed++;
        },
      });
      events.page({
        close: async () => {
          popupClosed++;
        },
      });
    },
  });
  const result = await runBrowserVerification(f.snapshot, { channel: 'chrome' }, harness.load);
  assert.equal(result.status, 'failed');
  assert.deepEqual([continued, aborted, socketsClosed, popupClosed], [1, 1, 1, 1]);
  assert.doesNotMatch(JSON.stringify(result), /example.invalid/);
});

test('missing driver, missing manifest, invalid configuration and changed bytes are blocked without browser launch', async (t) => {
  const f = fixture(t, [scenario()]);
  const missing = await runBrowserVerification(f.snapshot, { channel: 'chrome' }, async () => {
    throw new Error('secret module path');
  });
  assert.equal(missing.status, 'blocked');
  assert.match(missing.observed, /Pilote/);
  assert.doesNotMatch(JSON.stringify(missing), /secret module/);
  assert.equal((await runBrowserScenarios(f.snapshot, { channel: 'arbitrary' })).status, 'blocked');
  assert.equal((await runBrowserScenarios({ files: [] }, { channel: 'chrome' })).status, 'blocked');
  const harness = driverHarness();
  fs.appendFileSync(path.join(f.app, 'index.html'), 'changed');
  assert.equal(
    (await runBrowserVerification(f.snapshot, { channel: 'chrome' }, harness.load)).status,
    'blocked',
  );
  assert.equal(harness.calls.launches.length, 0);
});

test('source mutation during a controlled run prevents a passing receipt', async (t) => {
  const f = fixture(t, [scenario()]);
  const harness = driverHarness({
    waitFor: () => fs.appendFileSync(path.join(f.app, 'index.html'), 'changed'),
  });
  const result = await runBrowserVerification(f.snapshot, { channel: 'chrome' }, harness.load);
  assert.equal(result.status, 'blocked');
});

test('deadline and abort reject late driver completion and close its own simulated instance', async (t) => {
  // Start the product deadline only in controlled time: overloaded CI may spend more
  // than 20 wall-clock milliseconds preparing files before the launch seam is reached.
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.now() });
  const f = fixture(t, [scenario()]);
  for (const aborting of [false, true]) {
    let launched, entered, closed;
    const started = new Promise((resolve) => {
      entered = resolve;
    });
    const browserClosed = new Promise((resolve) => {
      closed = resolve;
    });
    const controller = new AbortController();
    const harness = driverHarness({
      launch: () =>
        new Promise((resolve) => {
          launched = resolve;
          entered();
        }),
      close: closed,
    });
    const pending = runBrowserVerification(
      f.snapshot,
      { channel: 'chrome', signal: controller.signal, timeoutMs: aborting ? 5000 : 20 },
      harness.load,
    );
    await started;
    assert.equal(harness.calls.launches.length, 1);
    if (aborting) controller.abort();
    else t.mock.timers.tick(20);
    const result = await pending;
    assert.equal(result.status, 'blocked');
    assert.match(result.observed, /interrompu|délai/);
    assert.equal(harness.calls.browserClosed, 0);
    launched();
    await browserClosed;
    assert.equal(harness.calls.browserClosed, 1);
    assert.equal(harness.calls.contexts.length, 0);
    assert.ok(result.browser.scenarios.every((item) => item.status === 'not-run'));
  }
});

test('cancellation while an assertion waits cannot become a late positive receipt', async (t) => {
  const f = fixture(t, [scenario()]);
  const controller = new AbortController();
  let entered, release;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const harness = driverHarness({
    waitFor: () => {
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const pending = runBrowserVerification(
    f.snapshot,
    { channel: 'chrome', signal: controller.signal },
    harness.load,
  );
  await started;
  controller.abort();
  const result = await pending;
  assert.equal(result.status, 'blocked');
  assert.equal(result.browser.scenarios[0].assertions[0].status, 'blocked');
  release();
  await delay(5);
  assert.equal(result.status, 'blocked');
  assert.equal(result.browser.scenarios[0].status, 'blocked');
  assert.equal(harness.calls.browserClosed, 1);
  assert.equal(fs.existsSync(harness.calls.launches[0].env.HOME), false);
});

test('a failed browser cleanup prevents a passing receipt without leaking diagnostics', async (t) => {
  const f = fixture(t, [scenario()]);
  const harness = driverHarness({
    close: () => {
      throw new Error('private cleanup diagnostic');
    },
  });
  const result = await runBrowserVerification(f.snapshot, { channel: 'chrome' }, harness.load);
  assert.equal(result.status, 'blocked');
  assert.match(result.observed, /Fermeture/);
  assert.doesNotMatch(JSON.stringify(result), /private cleanup diagnostic/);
});
