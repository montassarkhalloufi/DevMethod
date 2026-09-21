import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  readBrowserConfiguration,
  configureBrowserVerification,
} from '../scripts/studio/browser-configuration.mjs';

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'studio-browser-config-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root };
}

test('browser control is opt-in, persistent and has no inferred browser availability', (t) => {
  const store = fixture(t);
  const initial = readBrowserConfiguration(store);
  assert.equal(initial.enabled, false);
  assert.equal(initial.version, 0);
  assert.equal(initial.configurationId, null);
  assert.equal(initial.automatic, false);
  assert.equal(fs.existsSync(path.join(store.root, '.devmethod')), false);
  const saved = configureBrowserVerification(store, {
    version: 0,
    enabled: true,
    channel: 'chrome',
  });
  assert.equal(saved.version, 1);
  assert.equal(saved.enabled, true);
  assert.equal(saved.automatic, false);
  assert.match(saved.configurationId, /^[a-f0-9-]{36}$/);
  assert.deepEqual(readBrowserConfiguration({ root: store.root }), saved);
  assert.match(saved.reason, /installé|installation|pilote/);
});

test('automatic browser checks need separate explicit consent and cannot outlive browser permission', (t) => {
  const store = fixture(t);
  const saved = configureBrowserVerification(store, {
    version: 0,
    enabled: true,
    channel: 'chrome',
    automatic: true,
  });
  assert.equal(saved.automatic, true);
  assert.equal(readBrowserConfiguration(store).automatic, true);
  assert.throws(() =>
    configureBrowserVerification(store, {
      version: 1,
      enabled: false,
      channel: 'chrome',
      automatic: true,
    }),
  );
  assert.equal(readBrowserConfiguration(store).version, 1);
  const manual = configureBrowserVerification(store, {
    version: 1,
    enabled: true,
    channel: 'chrome',
  });
  assert.equal(manual.automatic, false, 'An old client cannot infer automatic consent');
});

test('stale configuration and arbitrary browser arguments cannot overwrite the selected channel', (t) => {
  const store = fixture(t);
  configureBrowserVerification(store, { version: 0, enabled: true, channel: 'msedge' });
  assert.throws(
    () => configureBrowserVerification(store, { version: 0, enabled: false, channel: 'chrome' }),
    /changé/,
  );
  for (const extra of [
    { channel: 'chromium' },
    { executablePath: '/tmp/browser' },
    { endpoint: 'http://remote' },
    { configurationId: 'caller-supplied-identity' },
  ]) {
    assert.throws(() =>
      configureBrowserVerification(store, {
        version: 1,
        enabled: true,
        channel: 'chrome',
        ...extra,
      }),
    );
  }
  assert.equal(readBrowserConfiguration(store).channel, 'msedge');
  assert.equal(readBrowserConfiguration(store).version, 1);
});

test('legacy configuration is read without mutation and gains a local identity only on explicit save', (t) => {
  const store = fixture(t);
  fs.mkdirSync(path.join(store.root, '.devmethod'));
  const file = path.join(store.root, '.devmethod/browser.json');
  const legacy = JSON.stringify({ schemaVersion: 1, version: 1, enabled: true, channel: 'chrome' });
  fs.writeFileSync(file, legacy);
  const read = readBrowserConfiguration(store);
  assert.equal(read.version, 1);
  assert.equal(read.configurationId, null);
  assert.equal(read.automatic, false);
  if (read.driverAvailable) assert.match(read.reason, /Réenregistrer/);
  assert.equal(fs.readFileSync(file, 'utf8'), legacy);
  const saved = configureBrowserVerification(store, {
    version: 1,
    enabled: true,
    channel: 'chrome',
  });
  assert.equal(saved.version, 2);
  assert.match(saved.configurationId, /^[a-f0-9-]{36}$/);
  assert.deepEqual(readBrowserConfiguration(store), saved);
});

test('corrupt or symlinked configuration is not silently replaced', (t) => {
  const store = fixture(t);
  fs.mkdirSync(path.join(store.root, '.devmethod'));
  const file = path.join(store.root, '.devmethod/browser.json');
  fs.writeFileSync(file, '{');
  assert.throws(() =>
    configureBrowserVerification(store, { version: 0, enabled: true, channel: 'chrome' }),
  );
  assert.equal(fs.readFileSync(file, 'utf8'), '{');
  fs.rmSync(file);
  const target = path.join(store.root, 'unrelated.json');
  fs.writeFileSync(target, '{}');
  fs.symlinkSync(target, file);
  assert.throws(() => readBrowserConfiguration(store), /symbolique/);
  assert.equal(fs.readFileSync(target, 'utf8'), '{}');
});
