import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createAgentController } from '../scripts/studio/public/agent-controller.js';

// DOM fixtures exercise configuration transport and draft behavior, never a native agent.
const bundle = await build({
  stdin: {
    contents: `export { mountAgentWidget } from './agent-widget';`,
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'AgentTest',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const status = () => ({
  settings: {
    version: 1,
    enabled: false,
    access: null,
    maxJobs: 2,
    maxTokens: 100000,
    timeoutMs: 300000,
  },
  availability: {
    available: null,
    connected: false,
    access: 'unknown',
    version: null,
    checkedAt: null,
    message: '',
  },
  historicalBudget: false,
  configuring: false,
  running: false,
  automatic: false,
  message: '',
});

async function until(predicate) {
  for (let i = 0; i < 70; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected agent configuration state');
}

async function fixture(t) {
  const dom = new JSDOM('<html lang="fr"><main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.document.documentElement.lang = 'fr';
  dom.window.localStorage.setItem('devmethod:studio:language:v1', 'fr');
  dom.window.eval(bundle.outputFiles[0].text);
  const handle = dom.window.AgentTest.mountAgentWidget(dom.window.document.querySelector('main'));
  const props = {
    agent: status(),
    onStatus(agent) {
      props.agent = agent;
      handle.update(props);
    },
  };
  const calls = [];
  let reply = async () => props.agent;
  dom.window.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    const result = await reply();
    return { ok: !result.error, json: async () => result };
  };
  handle.update(props);
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  await until(() => dom.window.document.querySelector('input'));
  return {
    dom,
    document: dom.window.document,
    props,
    handle,
    calls,
    respond(fn) {
      reply = fn;
    },
  };
}

function button(f, text) {
  return [...f.document.querySelectorAll('button')].find((node) => node.textContent.includes(text));
}

function type(f, name, value) {
  const node = f.document.querySelector(`[name="${name}"]`);
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLInputElement.prototype, 'value').set.call(
    node,
    value,
  );
  node.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
}

function connected(f) {
  f.props.agent = {
    ...f.props.agent,
    availability: {
      ...f.props.agent.availability,
      available: true,
      connected: true,
      access: 'chatgpt',
    },
  };
  f.handle.update(f.props);
}

test('probe is explicit, shows existing access and never activates; activation transmits exact limits once', async (t) => {
  const f = await fixture(t);
  assert.equal(f.calls.length, 0);
  assert.equal(button(f, 'Activer').disabled, true);
  f.respond(async () => ({
    ...f.props.agent,
    availability: {
      ...f.props.agent.availability,
      available: true,
      connected: true,
      access: 'chatgpt',
    },
  }));
  button(f, 'Vérifier').click();
  await until(() => f.document.body.textContent.includes('Abonnement ChatGPT'));
  assert.equal(f.props.agent.settings.enabled, false);
  assert.equal(f.calls[0].url, '/api/agent/probe');
  assert.deepEqual(f.calls[0].body, {});
  type(f, 'maxJobs', '1');
  let resolve;
  f.respond(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  button(f, 'Activer').click();
  button(f, 'Activer').click();
  await until(() => f.calls.length === 2);
  assert.deepEqual(f.calls[1].body, {
    version: 1,
    enabled: true,
    access: 'chatgpt',
    maxJobs: 1,
    maxTokens: 100000,
    timeoutMs: 300000,
  });
  assert.equal(f.calls[1].options.credentials, 'same-origin');
  resolve({ ...f.props.agent, settings: { ...f.calls[1].body, version: 2 }, automatic: true });
  await until(() => button(f, 'Désactiver'));
  assert.match(f.document.body.textContent, /ne constitue pas un plafond dur/);
});

test('polling and failed writes preserve edited limits; concurrent version requires deliberate reload', async (t) => {
  const f = await fixture(t);
  connected(f);
  await until(() => !button(f, 'Activer').disabled);
  type(f, 'maxTokens', '40000');
  f.props.agent = structuredClone(f.props.agent);
  f.handle.update(f.props);
  await setTimeout(15);
  assert.equal(f.document.querySelector('[name=maxTokens]').value, '40000');
  f.respond(async () => ({ error: 'Configuration obsolète. Rechargez les limites.' }));
  button(f, 'Activer').click();
  await until(() => f.document.body.textContent.includes('Configuration obsolète'));
  assert.equal(f.document.querySelector('[name=maxTokens]').value, '40000');
  f.props.agent = {
    ...f.props.agent,
    settings: { ...f.props.agent.settings, version: 2, maxTokens: 80000 },
  };
  f.handle.update(f.props);
  await until(() => f.document.querySelector('[role=alert]'));
  assert.equal(button(f, 'Activer').disabled, true);
  assert.equal(f.document.querySelector('[name=maxTokens]').value, '40000');
  button(f, 'Recharger').click();
  await until(() => f.document.querySelector('[name=maxTokens]').value === '80000');
  assert.equal(button(f, 'Activer').disabled, false);
});

test('stop remains available during a running historical campaign and uses persisted bounds, never an edited increase', async (t) => {
  const f = await fixture(t);
  connected(f);
  type(f, 'maxJobs', '10');
  f.props.agent = {
    ...f.props.agent,
    running: true,
    historicalBudget: true,
    settings: { ...f.props.agent.settings, enabled: true },
  };
  f.handle.update(f.props);
  await until(() => button(f, 'Arrêter'));
  assert.equal(f.document.querySelector('fieldset').disabled, true);
  f.respond(async () => ({
    ...f.props.agent,
    running: false,
    settings: { ...f.props.agent.settings, version: 2, enabled: false },
  }));
  button(f, 'Arrêter').click();
  await until(() => f.calls.length === 1);
  assert.deepEqual(f.calls[0].body, {
    version: 1,
    enabled: false,
    access: null,
    maxJobs: 2,
    maxTokens: 100000,
    timeoutMs: 300000,
  });
});

test('controller loads on opening only, preserves newer settings against a late poll and disposes', async (t) => {
  const dom = new JSDOM(
    '<details><summary>Agent</summary><div id="agent-configuration"></div></details>',
  );
  t.after(() => dom.window.close());
  let loads = 0,
    disposals = 0;
  const rendered = [];
  const controller = createAgentController({
    document: dom.window.document,
    onStatus() {},
    loadWidget: async () => {
      loads++;
      return {
        mountAgentWidget: () => ({
          update: (props) => rendered.push(props),
          dispose: () => disposals++,
        }),
      };
    },
  });
  controller.update(status());
  assert.equal(loads, 0);
  dom.window.document.querySelector('details').open = true;
  await until(() => rendered.length);
  controller.update({ ...status(), settings: { ...status().settings, version: 3 } });
  controller.update(status());
  assert.equal(rendered.at(-1).agent.settings.version, 3);
  assert.equal(loads, 1);
  controller.dispose();
  assert.equal(disposals, 1);
});
