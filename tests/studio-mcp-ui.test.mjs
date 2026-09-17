import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { readConnectorGuides, prepareConnectorGuide } from '../scripts/studio/connector-guides.mjs';

const entries = await Promise.all(
  ['home-widget', 'mcp-widget'].map((entry) =>
    build({
      entryPoints: [path.resolve(`studio-ui/src/${entry}.tsx`)],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: 'McpTest',
      jsx: 'automatic',
      loader: { '.svg': 'dataurl', '.css': 'empty' },
      define: { 'process.env.NODE_ENV': '"test"' },
    }),
  ),
);
const reply = (value, ok = true) => ({ ok, json: async () => value });
const connection = (extra = {}) => ({
  id: 'connection-1',
  name: 'Notion équipe',
  provider: 'notion',
  url: 'https://mcp.notion.com/mcp',
  auth: 'oauth',
  status: 'connected',
  tools: [{ name: 'search', title: 'Rechercher une page' }],
  ...extra,
});
const index = (connections = []) => ({
  supported: true,
  presets: [
    {
      id: 'notion',
      name: 'Notion',
      url: 'https://mcp.notion.com/mcp',
      auth: 'oauth',
      docs: 'https://developers.notion.com',
    },
  ],
  connections,
});

async function until(fn) {
  for (let i = 0; i < 160; i++) {
    if (fn()) return;
    await setTimeout(5);
  }
  assert.ok(fn(), 'Expected MCP UI state not reached');
}

function fixture(t, handler, { studio = false, popupBlocked = false } = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window,
    d = w.document;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new w.Event('close'));
  };
  const nativeTimeout = w.setTimeout.bind(w);
  w.setTimeout = (fn, delay, ...args) => nativeTimeout(fn, delay === 2000 ? 5 : delay, ...args);
  const popups = [];
  w.open = (url) => {
    if (popupBlocked) return null;
    const popup = {
      initial: url,
      opener: w,
      document: { title: '', body: { textContent: '' } },
      locations: [],
      closed: false,
      close() {
        this.closed = true;
      },
      location: {
        assign(value) {
          popup.locations.push(value);
        },
      },
    };
    popups.push(popup);
    return popup;
  };
  const calls = [];
  w.fetch = async (url, init) => {
    const input = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, init, input });
    if (url === '/api/connectors/guides') return reply(readConnectorGuides());
    if (url === '/api/connectors/guides/prepare') return reply(prepareConnectorGuide(input));
    if (url === '/api/home') return reply({ projects: [], limits: { projects: 200 } });
    if (url === '/api/home/catalog') return reply({ options: [], capabilities: [] });
    return handler(url, input, init);
  };
  w.eval(entries[studio ? 1 : 0].outputFiles[0].text + '\nwindow.McpTest=McpTest;');
  const navigations = [];
  const widget = studio
    ? w.McpTest.mountMcpWidget(d.getElementById('root'))
    : w.McpTest.mountHomeWidget(d.getElementById('root'), {
        navigate: (url) => navigations.push(url),
      });
  t.after(() => {
    widget.dispose();
    w.close();
  });
  return { window: w, document: d, calls, popups, widget, navigations };
}

function button(f, label) {
  return [...f.document.querySelectorAll('button')].find(
    (node) => (node.getAttribute('aria-label') || node.textContent).trim() === label,
  );
}

function type(f, name, value) {
  const node = f.document.querySelector(`[name="${name}"]`);
  const proto =
    node.tagName === 'TEXTAREA'
      ? f.window.HTMLTextAreaElement.prototype
      : node.tagName === 'SELECT'
        ? f.window.HTMLSelectElement.prototype
        : f.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
  node.dispatchEvent(
    new f.window.Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
  );
}

async function manage(f) {
  await until(() => button(f, '+ Connecter un MCP') || button(f, 'Gérer les MCP'));
  (button(f, '+ Connecter un MCP') || button(f, 'Gérer les MCP')).click();
  await until(() => f.document.querySelector('dialog[open]'));
}

const preset = (f) => f.document.querySelector('.mcp-preset-grid button');
const mcpCheckbox = (f) => f.document.querySelector('[name="mcp-connection"]');

async function connectNotion(f) {
  preset(f).click();
  await until(() => f.document.querySelector('.connector-guide-choice input'));
  assert.equal(f.calls.filter((call) => call.url === '/api/mcp/connect').length, 0);
  f.document.querySelector('.connector-guide-choice input').click();
  await until(() => !button(f, 'Préciser la configuration →').disabled);
  button(f, 'Préciser la configuration →').click();
  await until(() => f.document.querySelector('.connector-guide-question input[type="checkbox"]'));
  f.document.querySelector('.connector-guide-question input[type="checkbox"]').click();
  await until(() => !button(f, 'Vérifier la préparation →').disabled);
  button(f, 'Vérifier la préparation →').click();
  await until(() => button(f, 'Connecter Notion'));
  button(f, 'Connecter Notion').click();
  f.document.querySelector('.connector-guide-steps button').click();
  await until(() => button(f, '← Retour au catalogue'));
  button(f, '← Retour au catalogue').click();
  await until(() => preset(f));
}

test('OAuth opens from the user gesture, waits for real tool discovery and forwards the selected connection id', async (t) => {
  let authorized = false;
  let finishConnect;
  const f = fixture(t, async (url, input) => {
    if (url === '/api/mcp') return reply(index(authorized ? [connection()] : []));
    if (url === '/api/mcp/connect')
      return new Promise((resolve) => {
        finishConnect = resolve;
      });
    if (url === '/api/home/projects')
      return reply({
        project: {
          id: 'project-1',
          name: 'Projet',
          kind: 'new',
          workspace: '/tmp/project-1',
          createdAt: '2026-09-17T10:00:00Z',
          lastOpenedAt: null,
        },
      });
    if (url === '/api/home/open') return reply({ error: 'Keep this test on home' }, false);
    throw new Error('Unexpected ' + url + JSON.stringify(input));
  });
  await manage(f);
  await until(() => preset(f));
  await connectNotion(f);
  assert.equal(f.popups.length, 1);
  assert.equal(f.popups[0].initial, 'about:blank');
  assert.equal(f.popups[0].opener, null);
  await until(() => finishConnect);
  assert.equal(f.document.querySelectorAll('.mcp-prompt-chip').length, 0);
  const pending = connection({ status: 'authorization-required', tools: [] });
  finishConnect(
    reply({ connection: pending, authorizationUrl: 'https://auth.example/authorize?state=opaque' }),
  );
  await until(() => f.popups[0].locations.length === 1);
  assert.equal(mcpCheckbox(f).checked, false);
  assert.equal(mcpCheckbox(f).disabled, true);
  authorized = true;
  await until(() => mcpCheckbox(f)?.checked);
  assert.equal(f.popups[0].closed, true);
  assert.match(f.document.querySelector('.mcp-status').textContent, /Connecté · 1 outil/);
  assert.equal(f.document.querySelector('.mcp-prompt-chip').getAttribute('aria-pressed'), 'true');
  button(f, 'Terminé').click();
  type(f, 'idea', 'Construire un carnet documentaire');
  await setTimeout(10);
  f.document
    .querySelector('.idea-composer')
    .dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => f.calls.some((call) => call.url === '/api/home/projects'));
  assert.deepEqual(
    f.calls.find((call) => call.url === '/api/home/projects').input.launch.mcpConnectionIds,
    ['connection-1'],
  );
  assert.deepEqual(f.calls.find((call) => call.url === '/api/mcp/connect').input, {
    provider: 'notion',
  });
});

test('blocked OAuth popup does not start a server connection', async (t) => {
  const f = fixture(t, async () => reply(index()), { popupBlocked: true });
  await manage(f);
  await until(() => preset(f));
  await connectNotion(f);
  await until(() => f.document.querySelector('.mcp-connection-error'));
  assert.match(
    f.document.querySelector('.mcp-connection-error').textContent,
    /fenêtres de connexion/,
  );
  assert.equal(f.calls.filter((call) => call.url === '/api/mcp/connect').length, 0);
  assert.equal(preset(f).disabled, false);
});

test('unsafe authorization destination is rejected and no selected connection is invented', async (t) => {
  const f = fixture(t, async (url) =>
    url === '/api/mcp'
      ? reply(index())
      : reply({
          connection: connection({ status: 'authorization-required', tools: [] }),
          authorizationUrl: 'javascript:alert(1)',
        }),
  );
  await manage(f);
  await until(() => preset(f));
  await connectNotion(f);
  await until(() => f.document.querySelector('.mcp-connection-error'));
  assert.equal(f.popups[0].locations.length, 0);
  assert.equal(f.popups[0].closed, true);
  assert.equal(mcpCheckbox(f).checked, false);
});

test('a custom bearer secret is sent only in the connection body and cleared before the response', async (t) => {
  let finishConnect;
  const f = fixture(t, async (url) =>
    url === '/api/mcp'
      ? reply(index())
      : new Promise((resolve) => {
          finishConnect = resolve;
        }),
  );
  await manage(f);
  button(f, '+ Ajouter un serveur personnalisé').click();
  await until(() => f.document.querySelector('[name="mcp-name"]'));
  type(f, 'mcp-name', 'Documents internes');
  type(f, 'mcp-url', 'https://mcp.example/tools');
  type(f, 'mcp-auth', 'bearer');
  await until(() => f.document.querySelector('[name="mcp-token"]'));
  type(f, 'mcp-token', 'secret-only-body');
  f.document
    .querySelector('.mcp-custom-connection form')
    .dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => finishConnect);
  assert.equal(f.document.querySelector('[name="mcp-token"]').value, '');
  assert.equal(f.window.localStorage.length, 0);
  assert.equal(f.popups.length, 0);
  const call = f.calls.find((call) => call.url === '/api/mcp/connect');
  assert.equal(call.input.bearerToken, 'secret-only-body');
  assert.equal(call.init.credentials, 'same-origin');
  assert.equal(call.init.headers['Content-Type'], 'application/json');
  assert.ok(!f.document.body.textContent.includes('secret-only-body'));
  finishConnect(
    reply({
      connection: connection({ name: 'Documents internes', provider: 'custom', auth: 'bearer' }),
    }),
  );
  await until(() => mcpCheckbox(f)?.checked);
});

test('cancelling OAuth disconnects the pending server and ignores a late connected poll', async (t) => {
  let readCount = 0;
  let finishPoll;
  const f = fixture(t, async (url) => {
    if (url === '/api/mcp') {
      readCount++;
      return readCount === 1
        ? reply(index())
        : new Promise((resolve) => {
            finishPoll = resolve;
          });
    }
    if (url === '/api/mcp/connect')
      return reply({
        connection: connection({ status: 'authorization-required', tools: [] }),
        authorizationUrl: 'https://auth.example/authorize',
      });
    if (url === '/api/mcp/disconnect')
      return reply({ connection: connection({ status: 'disconnected', tools: [] }) });
    throw new Error('Unexpected request');
  });
  await manage(f);
  await until(() => preset(f));
  await connectNotion(f);
  await until(() => finishPoll);
  button(f, 'Annuler la connexion').click();
  await until(() => f.document.querySelector('.mcp-status')?.textContent === 'Déconnecté');
  finishPoll(reply(index([connection()])));
  await setTimeout(20);
  assert.equal(f.document.querySelector('.mcp-status').textContent, 'Déconnecté');
  assert.equal(mcpCheckbox(f).checked, false);
  assert.equal(f.popups[0].closed, true);
});

test('Studio selection is persistent, its save is awaited before request submission, and failures remain visible', async (t) => {
  let finishSave;
  let selected = [];
  const f = fixture(
    t,
    async (url, input) => {
      if (url === '/api/mcp') return reply(index([connection()]));
      if (url === '/api/mcp/selection' && !input)
        return reply({ supported: true, nativeRunner: false, connectionIds: selected });
      if (url === '/api/mcp/selection')
        return new Promise((resolve) => {
          finishSave = (ok) => {
            if (ok) selected = input.connectionIds;
            resolve(
              ok
                ? reply({ supported: true, nativeRunner: false, connectionIds: selected })
                : reply({ error: 'Sélection non enregistrée' }, false),
            );
          };
        });
      throw new Error('Unexpected request');
    },
    { studio: true },
  );
  await until(
    () =>
      button(f, 'Utiliser Notion équipe pour ce projet') &&
      !button(f, 'Utiliser Notion équipe pour ce projet').disabled,
  );
  button(f, 'Utiliser Notion équipe pour ce projet').click();
  await until(() => finishSave);
  let settled = false;
  const pending = f.widget.prepareRequest().then((value) => {
    settled = true;
    return value;
  });
  await setTimeout(10);
  assert.equal(settled, false);
  finishSave(true);
  assert.equal(await pending, true);
  await until(
    () =>
      button(f, 'Utiliser Notion équipe pour ce projet').getAttribute('aria-pressed') === 'true',
  );
  finishSave = null;
  button(f, 'Utiliser Notion équipe pour ce projet').click();
  await until(() => finishSave);
  finishSave(false);
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(await f.widget.prepareRequest(), false);
  assert.equal(
    button(f, 'Utiliser Notion équipe pour ce projet').getAttribute('aria-pressed'),
    'true',
  );
});

test('reconnecting a custom server retains its endpoint and name required by the real manager contract', async (t) => {
  const custom = connection({
    provider: 'custom',
    name: 'Serveur local',
    url: 'http://127.0.0.1:4555/mcp',
    auth: 'none',
    status: 'disconnected',
    tools: [],
  });
  const f = fixture(t, async (url) =>
    url === '/api/mcp'
      ? reply(index([custom]))
      : reply({
          connection: { ...custom, status: 'connected', tools: [{ name: 'read_context' }] },
        }),
  );
  await manage(f);
  await until(() => button(f, 'Reconnecter'));
  button(f, 'Reconnecter').click();
  await until(() => mcpCheckbox(f)?.checked);
  assert.deepEqual(f.calls.find((call) => call.url === '/api/mcp/connect').input, {
    id: custom.id,
    provider: 'custom',
    auth: 'none',
    name: custom.name,
    url: custom.url,
  });
});

const notionGuideInput = {
  optionId: 'notion',
  guideVersion: 1,
  flowId: 'notion-context',
  answers: { actions: ['read-content'] },
};
test('project restores prepared context before mount and preserves edits made during dispatch', async (t) => {
  const f = fixture(
    t,
    async (url) =>
      url === '/api/mcp'
        ? reply(index())
        : reply({ supported: true, nativeRunner: false, connectionIds: [] }),
    { studio: true },
  );
  f.widget.restoreGuides([notionGuideInput]);
  await until(() => f.document.querySelector('.connector-guide-chips'));
  assert.deepEqual(JSON.parse(JSON.stringify(f.widget.requestGuides())), [notionGuideInput]);
  const sent = f.widget.requestGuides();
  const changed = { ...notionGuideInput, answers: { actions: ['prepare-changes'] } };
  assert.equal(f.widget.addGuides([changed]), true);
  f.widget.clearGuides(sent);
  assert.deepEqual(JSON.parse(JSON.stringify(f.widget.requestGuides())), [changed]);
});

test('project rechecks a changed guide after waiting for selection persistence', async (t) => {
  let finish;
  const f = fixture(
    t,
    async (url, input) => {
      if (url === '/api/mcp') return reply(index([connection()]));
      if (url === '/api/mcp/selection' && !input)
        return reply({ supported: true, nativeRunner: false, connectionIds: [] });
      return new Promise((resolve) => {
        finish = () =>
          resolve(reply({ supported: true, nativeRunner: false, connectionIds: ['connection-1'] }));
      });
    },
    { studio: true },
  );
  await until(
    () =>
      button(f, 'Utiliser Notion équipe pour ce projet') &&
      !button(f, 'Utiliser Notion équipe pour ce projet').disabled,
  );
  f.widget.addGuides([notionGuideInput]);
  await until(() => f.document.querySelector('.connector-guide-chips'));
  button(f, 'Utiliser Notion équipe pour ce projet').click();
  await until(() => finish);
  const pending = f.widget.prepareRequest();
  f.document.querySelector('.connector-guide-chips button').click();
  await until(() => f.document.querySelector('.connector-guide-question input[type="checkbox"]'));
  const inputs = f.document.querySelectorAll('.connector-guide-question input[type="checkbox"]');
  inputs[1].click();
  await until(() => f.document.body.textContent.includes('Des réponses ont changé'));
  finish();
  assert.equal(await pending, false);
  assert.deepEqual(JSON.parse(JSON.stringify(f.widget.requestGuides())), [notionGuideInput]);
});
