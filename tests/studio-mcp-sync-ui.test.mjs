import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: 'tsx',
    contents: `
      import {useEffect} from 'react';
      import {createRoot} from 'react-dom/client';
      import {useMcpConnections} from './studio-ui/src/features/mcp/hooks/useMcpConnections';
      import {useMcpSelection} from './studio-ui/src/features/mcp/hooks/useMcpSelection';
      export function mount(host) {
        const root=createRoot(host), state={};
        function Harness() {
          const selection=useMcpSelection();
          const connections=useMcpConnections(id=>void selection.select(id,true),id=>void selection.select(id,false));
          useEffect(()=>{Object.assign(state,{selection,connections});});
          return <output>{JSON.stringify({connections:connections.connections,selection:selection.connectionIds})}</output>;
        }
        root.render(<Harness/>);
        return {state:()=>state,dispose:()=>root.unmount()};
      }
    `,
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'SyncTest',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});
const reply = (value, ok = true) => ({ ok, json: async () => value });
const connection = (id, extra = {}) => ({
  id,
  version: 1,
  name: id,
  provider: 'github',
  auth: 'bearer',
  url: 'https://api.githubcopilot.com/mcp/readonly',
  status: 'connected',
  tools: [{ name: 'read' }],
  ...extra,
});
const index = (connections) => ({ connections, presets: [], supported: true });
const selection = (connectionIds) => ({ connectionIds, supported: true });

async function until(predicate) {
  for (let i = 0; i < 160; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected shared MCP state not reached');
}

function fixture(t, handler) {
  const dom = new JSDOM('<main><div id="guide"></div><div id="prompt"></div></main>', {
    url: 'http://127.0.0.1:4362',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const calls = [],
    handles = [];
  dom.window.fetch = (url, init = {}) => {
    const call = { url, init, input: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    return Promise.resolve(handler(call));
  };
  // The prompt and progress are separate bundles in Studio. Each gets its own hook module.
  for (const id of ['guide', 'prompt']) {
    dom.window.eval(bundle.outputFiles[0].text);
    handles.push(dom.window.SyncTest.mount(dom.window.document.getElementById(id)));
  }
  t.after(() => {
    handles.forEach((handle) => handle.dispose());
    dom.window.close();
  });
  return { window: dom.window, calls, guide: handles[0], prompt: handles[1] };
}

const ids = (handle) => Array.from(handle.state().selection.connectionIds);

async function ready(f) {
  await until(() =>
    [f.guide, f.prompt].every(
      (handle) =>
        handle.state().selection &&
        !handle.state().selection.loading &&
        !handle.state().connections.loading,
    ),
  );
}

test('an inline connection, tool refresh and disconnect propagate to a separately bundled prompt without event loops', async (t) => {
  let connections = [],
    selected = [];
  const f = fixture(t, ({ url, input }) => {
    if (url === '/api/mcp') return reply(index(connections));
    if (url === '/api/mcp/selection') {
      if (input) selected = input.connectionIds;
      return reply(selection(selected));
    }
    const next = url.endsWith('/connect')
      ? connection('github-1')
      : url.endsWith('/refresh')
        ? connection('github-1', { version: 2, tools: [{ name: 'read' }, { name: 'search' }] })
        : connection('github-1', { version: 3, status: 'disconnected', tools: [] });
    connections = [next];
    return reply({ connection: next });
  });
  await ready(f);
  const notifications = [];
  for (const eventName of ['devmethod:mcp-connections-changed', 'devmethod:mcp-selection-changed'])
    f.window.addEventListener(eventName, (event) => notifications.push(event.detail));
  await f.guide.state().connections.connect({
    provider: 'github',
    auth: 'bearer',
    bearerToken: 'fixture-pat-only-in-post',
  });
  await until(
    () =>
      f.prompt.state().connections.connections[0]?.status === 'connected' &&
      ids(f.prompt).includes('github-1'),
  );
  await f.guide.state().connections.change('github-1', 'refresh');
  await until(() => f.prompt.state().connections.connections[0]?.tools.length === 2);
  await f.guide.state().connections.change('github-1', 'disconnect');
  await until(
    () =>
      f.prompt.state().connections.connections[0]?.status === 'disconnected' &&
      ids(f.prompt).length === 0,
  );
  const count = f.calls.length;
  await setTimeout(30);
  assert.equal(f.calls.length, count, 'Reloads must not emit further mutations');
  assert.equal(f.calls.filter((call) => call.url === '/api/mcp/selection' && call.input).length, 2);
  assert.equal(f.window.localStorage.length, 0);
  assert.equal(notifications.length, 5);
  assert.ok(
    notifications.every((value) => typeof value === 'symbol'),
    'Change events carry no connection, selection or credential payload',
  );
});

test('a delayed prompt read cannot overwrite the selection propagated from the inline guide', async (t) => {
  let selected = [],
    reads = 0,
    stale;
  const f = fixture(t, (call) => {
    if (call.url === '/api/mcp') return reply(index([connection('github-1')]));
    if (call.input) {
      selected = call.input.connectionIds;
      return reply(selection(selected));
    }
    if (++reads === 2)
      return new Promise((resolve) => {
        stale = { resolve, signal: call.init.signal };
      });
    return reply(selection(selected));
  });
  await until(() => stale && f.guide.state().selection && !f.guide.state().selection.loading);
  await f.guide.state().selection.select('github-1', true);
  await until(() => f.prompt.state().selection && ids(f.prompt).includes('github-1'));
  assert.equal(stale.signal.aborted, true);
  stale.resolve(reply(selection([])));
  await setTimeout(25);
  assert.deepEqual(ids(f.prompt), ['github-1']);
});

test('peer connection changes defer reload during a local mutation and converge after it settles', async (t) => {
  let connections = [],
    localWrite;
  const f = fixture(t, ({ url, input }) => {
    if (url === '/api/mcp') return reply(index(connections));
    if (url === '/api/mcp/selection') return reply(selection(input?.connectionIds || []));
    if (input.bearerToken === 'deferred-local')
      return new Promise((resolve) => {
        localWrite = () => {
          const next = connection('github-local');
          connections = [...connections, next];
          resolve(reply({ connection: next }));
        };
      });
    const next = connection('github-peer');
    connections = [next];
    return reply({ connection: next });
  });
  await ready(f);
  const pending = f.guide
    .state()
    .connections.connect({ provider: 'github', auth: 'bearer', bearerToken: 'deferred-local' });
  await until(() => localWrite);
  await f.prompt
    .state()
    .connections.connect({ provider: 'github', auth: 'bearer', bearerToken: 'immediate-peer' });
  assert.equal(
    f.calls.filter((call) => call.url === '/api/mcp').length,
    2,
    'Do not start a GET that can race the local write',
  );
  localWrite();
  await pending;
  await until(
    () =>
      f.guide.state().connections.connections.length === 2 &&
      f.prompt.state().connections.connections.length === 2,
  );
});

test('preparing a request waits for the peer reload queued behind a local selection write', async (t) => {
  let selected = [],
    localWrite,
    queuedRead,
    delayReads = false;
  const f = fixture(t, (call) => {
    if (call.url === '/api/mcp') return reply(index([connection('local'), connection('peer')]));
    if (call.input?.connectionIds.includes('local'))
      return new Promise((resolve) => {
        localWrite = () => {
          selected = ['local'];
          delayReads = true;
          resolve(reply(selection(selected)));
        };
      });
    if (call.input) {
      selected = call.input.connectionIds;
      return reply(selection(selected));
    }
    if (delayReads)
      return new Promise((resolve) => {
        queuedRead = () => resolve(reply(selection(selected)));
      });
    return reply(selection(selected));
  });
  await ready(f);
  const local = f.guide.state().selection.select('local', true);
  await until(() => localWrite);
  await f.prompt.state().selection.select('peer', true);
  let prepared = false;
  const readyRequest = f.guide
    .state()
    .selection.prepareRequest()
    .then((value) => {
      prepared = true;
      return value;
    });
  localWrite();
  await local;
  await until(() => queuedRead);
  await setTimeout(10);
  assert.equal(prepared, false);
  queuedRead();
  assert.equal(await readyRequest, true);
});

test('peer refresh preserves a failed local selection so request submission stays blocked', async (t) => {
  let selected = [],
    rejectLocal;
  const f = fixture(t, ({ url, input }) => {
    if (url === '/api/mcp') return reply(index([connection('local'), connection('peer')]));
    if (input?.connectionIds.includes('local'))
      return new Promise((resolve) => {
        rejectLocal = () => resolve(reply({ error: 'Sélection locale refusée' }, false));
      });
    if (input) selected = input.connectionIds;
    return reply(selection(selected));
  });
  await ready(f);
  const local = f.guide.state().selection.select('local', true);
  await until(() => rejectLocal);
  await f.prompt.state().selection.select('peer', true);
  rejectLocal();
  await local;
  await until(() => !f.guide.state().selection.loading && ids(f.guide).includes('peer'));
  assert.equal(f.guide.state().selection.error, 'Sélection locale refusée');
  assert.equal(await f.guide.state().selection.prepareRequest(), false);
});
