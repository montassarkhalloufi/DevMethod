import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { probeCodex } from '../scripts/studio/agent-availability.mjs';
import { createAgentControl } from '../scripts/studio/agent-control.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { startStudio } from '../scripts/studio/server.mjs';

test('availability classifies ChatGPT and API access without returning CLI output or key fragments', async () => {
  for (const [login, access] of [
    ['Logged in using ChatGPT', 'chatgpt'],
    ['Logged in using an API key - sk-sentinel', 'api-key'],
    ['unexpected secret sk-sentinel', 'unknown'],
  ]) {
    const calls = [];
    const result = await probeCodex(async (args) => {
      calls.push(args);
      return { code: 0, output: args[0] === '--version' ? 'codex-cli 0.147.0' : login };
    });
    assert.deepEqual(calls, [['--version'], ['login', 'status']]);
    assert.equal(result.access, access);
    assert.equal(result.connected, access !== 'unknown');
    assert.doesNotMatch(JSON.stringify(result), /sk-sentinel/);
  }
  const unavailable = await probeCodex(async () => ({ code: null, output: 'private path' }));
  assert.equal(unavailable.available, false);
  assert.doesNotMatch(JSON.stringify(unavailable), /private path/);
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agent-control-'));
  const store = createStudioStore(root);
  const counts = { calls: 0, closes: 0 };
  const options = {
    store,
    jobs: {},
    probe: async () => ({
      available: true,
      connected: true,
      access: 'chatgpt',
      version: 'fixture',
      checkedAt: new Date().toISOString(),
    }),
    createRunner: () => ({
      status: () => ({ automatic: true, running: false }),
      wake: () => counts.calls++,
      close: async () => counts.closes++,
    }),
  };
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, store, counts, options };
}

test('configuration persists, resumes with a fresh probe, rejects stale writes and preserves an existing ledger', async (t) => {
  const f = fixture(t);
  const control = createAgentControl(f.options);
  assert.equal(control.status().availability.available, null);
  const settings = { ...control.status().settings, enabled: true, access: 'chatgpt' };
  assert.equal((await control.configure(settings)).configuring, false);
  assert.equal(f.counts.calls, 1);
  await assert.rejects(control.configure(settings), /modifiée/);
  const ledger = '{"attempts":1,"knownTokens":100001,"unknownUsage":false,"runs":[]}';
  fs.writeFileSync(path.join(f.root, '.devmethod/agent.json'), ledger);
  await assert.rejects(
    control.configure({ ...control.status().settings, maxTokens: 200000 }),
    /augmentées/,
  );
  await control.configure({ ...control.status().settings, enabled: false });
  await control.close();
  const restarted = createAgentControl(f.options);
  await restarted.start();
  assert.equal(restarted.status().settings.enabled, false);
  assert.equal(fs.readFileSync(path.join(f.root, '.devmethod/agent.json'), 'utf8'), ledger);
});

test('historical campaign cannot be reopened by saving disabled settings then enabling after restart', async (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, '.devmethod/agent.json'), '{}');
  const control = createAgentControl(f.options);
  await control.configure(control.status().settings);
  const restarted = createAgentControl(f.options);
  await assert.rejects(
    restarted.configure({ ...restarted.status().settings, enabled: true, access: 'chatgpt' }),
    /historique/,
  );
  assert.equal(f.counts.calls, 0);
});

test('failed authentication neither enables dispatch nor creates saved consent', async (t) => {
  const f = fixture(t);
  const control = createAgentControl({
    ...f.options,
    probe: async () => ({ connected: false, message: 'Not connected' }),
  });
  await assert.rejects(
    control.configure({ ...control.status().settings, enabled: true, access: 'chatgpt' }),
    /Not connected/,
  );
  assert.equal(f.counts.calls, 0);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/agent-settings.json')), false);
});

test('HTTP configuration is reserved to same-origin user action, not the worker or cross-origin page', async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agent-control-http-'));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const runtime = studio.runtime();
  const settings = runtime.agent.settings;
  for (const headers of [
    { Origin: 'https://unrelated.test' },
    { Authorization: 'Bearer ' + runtime.token },
  ]) {
    const response = await fetch(runtime.url + '/api/agent/configure', {
      method: 'POST',
      headers,
      body: JSON.stringify(settings),
    });
    assert.equal(response.status, 403);
  }
  const response = await fetch(runtime.url + '/api/agent/configure', {
    method: 'POST',
    headers: { Origin: runtime.url, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).settings.version, 1);
});

test('closing while authentication probe is pending prevents late runner creation', async (t) => {
  const f = fixture(t);
  let resolve;
  const control = createAgentControl({
    ...f.options,
    probe: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const pending = control.configure({
    ...control.status().settings,
    enabled: true,
    access: 'chatgpt',
  });
  await control.close();
  resolve({ connected: true, access: 'chatgpt' });
  await assert.rejects(pending, /fermé/);
  await assert.rejects(
    control.configure({ ...control.status().settings, enabled: true, access: 'chatgpt' }),
    /fermé/,
  );
  assert.equal(f.counts.calls, 0);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/agent-settings.json')), false);
});

test('restart and configuration cannot silently switch ChatGPT consent to API billing', async (t) => {
  const f = fixture(t);
  const control = createAgentControl(f.options);
  await control.configure({ ...control.status().settings, enabled: true, access: 'chatgpt' });
  await control.close();
  const api = createAgentControl({
    ...f.options,
    probe: async () => ({ connected: true, access: 'api-key' }),
  });
  await api.start();
  api.wake();
  assert.equal(f.counts.calls, 1);
  assert.equal(api.status().automatic, false);
  await assert.rejects(api.configure(api.status().settings), /type d’accès/);
  await api.configure({ ...api.status().settings, access: 'api-key' });
  assert.equal(f.counts.calls, 2, 'Explicitly confirming the observed access is required');
});

test('an observed loss of authentication suspends future dispatch even if access label is unchanged', async (t) => {
  const f = fixture(t);
  let connected = true;
  const control = createAgentControl({
    ...f.options,
    probe: async () => ({ connected, access: 'chatgpt' }),
  });
  await control.configure({ ...control.status().settings, enabled: true, access: 'chatgpt' });
  connected = false;
  await control.inspect();
  control.wake();
  assert.equal(f.counts.calls, 1);
  assert.equal(f.counts.closes, 1);
  assert.equal(control.status().automatic, false);
});

test('live broker observations reach both configured and resumed runners without being saved', async (t) => {
  const f = fixture(t);
  const getLiveActions = () => [];
  const received = [];
  const options = {
    ...f.options,
    getLiveActions,
    createRunner(input) {
      received.push(input.getLiveActions);
      return f.options.createRunner(input);
    },
  };
  const control = createAgentControl(options);
  await control.configure({ ...control.status().settings, enabled: true, access: 'chatgpt' });
  await control.close();
  const restarted = createAgentControl(options);
  await restarted.start();
  assert.deepEqual(received, [getLiveActions, getLiveActions]);
  assert.equal(
    Object.hasOwn(
      JSON.parse(fs.readFileSync(path.join(f.root, '.devmethod/agent-settings.json'))),
      'getLiveActions',
    ),
    false,
  );
  await restarted.close();
});
