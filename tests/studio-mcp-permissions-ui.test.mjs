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
      import {createRoot} from 'react-dom/client';
      import {McpPermissions} from './studio-ui/src/features/mcp/components/McpPermissions';
      import {McpActionCards} from './studio-ui/src/features/mcp/components/McpActionCards';
      import {McpCredentialForm} from './studio-ui/src/features/mcp/components/McpCredentialForm';
      import {useMcpConnections} from './studio-ui/src/features/mcp/hooks/useMcpConnections';
      export {readMcpConnection} from './studio-ui/src/features/mcp/model/mcp';
      function CredentialHarness({input,onConnected}) {
        const controller=useMcpConnections(onConnected,()=>{});
        return <McpCredentialForm input={input} controller={controller}/>;
      }
      export function mount(host, kind, initial) {
        const root=createRoot(host);
        function render(props) {
          root.render(kind==='policy' ? <McpPermissions {...props}/> : kind==='actions' ? <McpActionCards {...props}/> : <CredentialHarness {...props}/>);
        }
        render(initial);
        return {render, dispose:()=>root.unmount()};
      }
    `,
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'McpUiTest',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});

const reply = (value, ok = true) => ({ ok, json: async () => value });
const connection = (extra = {}) => ({
  id: 'github-1',
  name: 'GitHub',
  provider: 'github',
  url: 'https://api.githubcopilot.com/mcp/readonly',
  auth: 'bearer',
  status: 'connected',
  tools: [{ name: 'get_file_contents' }],
  ...extra,
});
const policy = (extra = {}) => ({
  connectionId: 'github-1',
  version: 0,
  bulkPermission: 'ask',
  tools: ['get_file_contents', 'list_issues'].map((name, i) => ({
    name,
    inputSchemaFingerprint: String(i).repeat(64),
    permission: 'ask',
  })),
  ...extra,
});
const action = (extra = {}) => ({
  requestId: 'action-1',
  jobId: 'job-1',
  connectionId: 'github-1',
  connectionName: 'GitHub lecture seule',
  connectionUrl: 'https://api.githubcopilot.com/mcp/readonly',
  toolName: 'get_file_contents',
  arguments: { owner: 'example', repo: 'project', path: 'README.md' },
  status: 'pending',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
  ...extra,
});

async function until(predicate) {
  for (let i = 0; i < 160; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected MCP permissions UI state not reached');
}

function fixture(t, kind, props, fetcher) {
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://127.0.0.1:4330',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window,
    calls = [],
    opened = [],
    polls = new Map();
  let pollId = -1;
  const originalTimeout = w.setTimeout.bind(w),
    originalClear = w.clearTimeout.bind(w);
  w.setTimeout = (fn, delay, ...args) => {
    if (delay !== 2000) return originalTimeout(fn, delay, ...args);
    const id = pollId--;
    polls.set(id, () => fn(...args));
    return id;
  };
  w.clearTimeout = (id) => (id < 0 ? polls.delete(id) : originalClear(id));
  w.open = (...args) => {
    opened.push(args);
    return null;
  };
  w.fetch = (url, init = {}) => {
    const input = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, init, input });
    return Promise.resolve(fetcher(url, input, init));
  };
  w.eval(bundle.outputFiles[0].text + '\nwindow.McpUiTest=McpUiTest;');
  const handle = w.McpUiTest.mount(w.document.getElementById('root'), kind, props);
  t.after(() => {
    handle.dispose();
    w.close();
  });
  return {
    window: w,
    document: w.document,
    calls,
    opened,
    handle,
    runPoll() {
      const next = polls.entries().next().value;
      assert.ok(next, 'A refresh was scheduled');
      polls.delete(next[0]);
      next[1]();
    },
    hasPoll: () => polls.size > 0,
  };
}

const button = (f, label) =>
  [...f.document.querySelectorAll('button')].find((node) => node.textContent === label);

function choose(f, selector, value) {
  const select = f.document.querySelector(selector);
  assert.ok(select);
  select.value = value;
  select.dispatchEvent(new f.window.Event('change', { bubbles: true }));
}

test('connection versions preserve server identity, support legacy payloads and reject invalid versions', (t) => {
  const f = fixture(t, 'actions', { jobId: 'job-1', running: false }, () => reply({ actions: [] }));
  const read = f.window.McpUiTest.readMcpConnection;
  assert.equal(read(connection()).version, 1);
  assert.equal(read(connection({ version: 7 })).version, 7);
  for (const version of [0, -1, 1.2, '2', null, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => read(connection({ version })), /illisible/);
});

test('GitHub PAT is masked, sent once in the connection body, cleared on submit and retryable after failure', async (t) => {
  const connected = [];
  let finish,
    connectCount = 0;
  const input = { provider: 'github', auth: 'bearer', url: 'https://api.githubcopilot.com/mcp/' };
  const f = fixture(t, 'credential', { input, onConnected: (id) => connected.push(id) }, (url) => {
    if (url === '/api/mcp') return reply({ supported: true, presets: [], connections: [] });
    assert.equal(url, '/api/mcp/connect');
    connectCount++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await until(() => f.document.querySelector('input[name="github-pat"]'));
  await until(() => f.calls.some((call) => call.url === '/api/mcp'));
  await setTimeout(5);
  const token = f.document.querySelector('input[name="github-pat"]');
  assert.equal(token.type, 'password');
  assert.equal(token.autocomplete, 'off');
  token.value = 'test-pat-sensitive';
  const form = f.document.querySelector('form');
  form.dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
  form.dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => finish);
  assert.equal(connectCount, 1);
  assert.equal(token.value, '');
  assert.equal(f.opened.length, 0, 'Bearer authentication must not open OAuth');
  assert.equal(f.window.localStorage.length, 0);
  assert.ok(!f.document.documentElement.outerHTML.includes('test-pat-sensitive'));
  const post = f.calls.find((call) => call.url === '/api/mcp/connect');
  assert.deepEqual(post.input, { ...input, bearerToken: 'test-pat-sensitive' });
  assert.equal(post.init.credentials, 'same-origin');
  finish(reply({ error: 'Jeton refusé' }, false));
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.deepEqual(connected, []);
  token.value = 'replacement-test-pat';
  form.dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => connectCount === 2);
  finish(reply({ connection: connection({ url: input.url, version: 2 }) }));
  await until(() => connected.length === 1);
  assert.equal(token.value, '');
  assert.equal(f.document.querySelector('[role="alert"]'), null);
});

test('permission updates send exact version and schema identity; conflicts remain visible until reload', async (t) => {
  let reads = 0,
    finish;
  const newer = policy({ version: 2 });
  const f = fixture(t, 'policy', { connectionId: 'github-1' }, (url, input) => {
    if (!input) return reply(++reads === 1 ? policy() : newer);
    assert.equal(url, '/api/mcp/policy');
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await until(() => f.document.querySelector('.mcp-permission-tools select'));
  choose(f, '.mcp-permission-tools select', 'deny');
  await until(() => finish);
  assert.deepEqual(f.calls.at(-1).input, {
    connectionId: 'github-1',
    version: 0,
    updates: [
      { toolName: 'get_file_contents', inputSchemaFingerprint: '0'.repeat(64), permission: 'deny' },
    ],
  });
  assert.ok([...f.document.querySelectorAll('select')].every((select) => select.disabled));
  finish(reply({ error: 'Ces permissions ont changé. Rechargez-les avant de réessayer.' }, false));
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.querySelector('.mcp-permission-tools select').value, 'ask');
  button(f, 'Relire les permissions').click();
  await until(() => reads === 2 && !f.document.querySelector('[role="alert"]'));
  choose(f, '.mcp-permission-global select', 'allow');
  await until(() => f.calls.filter((call) => call.input).length === 2);
  assert.equal(f.calls.at(-1).input.version, 2);
  assert.equal(f.calls.at(-1).input.updates.length, 2);
  finish(
    reply(
      policy({
        version: 3,
        bulkPermission: 'allow',
        tools: newer.tools.map((tool) => ({ ...tool, permission: 'allow' })),
      }),
    ),
  );
  await until(() => f.document.querySelector('.mcp-permission-global select').value === 'allow');
});

test('switching connections hides stale permissions and ignores late reads', async (t) => {
  let resolveSecond;
  const f = fixture(t, 'policy', { connectionId: 'github-1' }, (url) => {
    if (url.endsWith('github-1')) return reply(policy());
    if (url.endsWith('linear-3'))
      return reply(
        policy({
          connectionId: 'linear-3',
          tools: [
            { name: 'search_issues', inputSchemaFingerprint: '3'.repeat(64), permission: 'ask' },
          ],
        }),
      );
    return new Promise((resolve) => {
      resolveSecond = resolve;
    });
  });
  await until(() => f.document.querySelector('.mcp-permission-tools select'));
  f.handle.render({ connectionId: 'notion-2' });
  await until(() => resolveSecond);
  assert.equal(f.document.querySelector('.mcp-permission-tools select'), null);
  f.handle.render({ connectionId: 'linear-3' });
  await until(() => f.document.body.textContent.includes('search_issues'));
  resolveSecond(
    reply(
      policy({
        connectionId: 'notion-2',
        tools: [
          { name: 'search_pages', inputSchemaFingerprint: '2'.repeat(64), permission: 'ask' },
        ],
      }),
    ),
  );
  await setTimeout(25);
  assert.ok(f.document.body.textContent.includes('search_issues'));
  assert.ok(!f.document.body.textContent.includes('search_pages'));
  assert.ok(!f.document.body.textContent.includes('get_file_contents'));
});

test('filtered bulk permissions change only visible tools and reflect their actual permissions', async (t) => {
  let current = policy({
    bulkPermission: 'mixed',
    tools: [
      'read_file',
      'read_issues',
      'create_issue',
      'delete_issue',
      'edit_file',
      'create_branch',
      'merge_pull_request',
    ].map((name, index) => ({
      name,
      inputSchemaFingerprint: String(index).repeat(64),
      permission: index < 2 ? 'allow' : 'ask',
    })),
  });
  const f = fixture(t, 'policy', { connectionId: 'github-1' }, (_url, input) => {
    if (input) {
      current = {
        ...current,
        version: current.version + 1,
        tools: current.tools.map((tool) => ({
          ...tool,
          permission:
            input.updates.find((update) => update.toolName === tool.name)?.permission ??
            tool.permission,
        })),
      };
    }
    return reply(current);
  });
  await until(() => f.document.querySelector('input[type="search"]'));
  const search = (value) => {
    const input = f.document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(f.window.HTMLInputElement.prototype, 'value').set.call(
      input,
      value,
    );
    input.dispatchEvent(new f.window.Event('input', { bubbles: true }));
  };
  search('read');
  await until(() => f.document.querySelectorAll('.mcp-permission-tools li').length === 2);
  const bulk = f.document.querySelector('.mcp-permission-global select');
  assert.equal(bulk.value, 'allow', 'Hidden ask tools do not make the displayed group mixed');
  assert.match(
    f.document.querySelector('.mcp-permission-global').textContent,
    /Outils affichés.*2/,
  );
  choose(f, '.mcp-permission-global select', 'deny');
  await until(() => f.calls.some((call) => call.input) && !bulk.disabled);
  assert.deepEqual(f.calls.find((call) => call.input).input.updates, [
    { toolName: 'read_file', inputSchemaFingerprint: '0'.repeat(64), permission: 'deny' },
    { toolName: 'read_issues', inputSchemaFingerprint: '1'.repeat(64), permission: 'deny' },
  ]);
  assert.ok(current.tools.slice(2).every((tool) => tool.permission === 'ask'));
  assert.equal(bulk.value, 'deny');
  search('no-matching-tool');
  await until(() => f.document.querySelectorAll('.mcp-permission-tools li').length === 0);
  assert.equal(bulk.disabled, true);
  search('');
  await until(() => f.document.querySelectorAll('.mcp-permission-tools li').length === 7);
  assert.equal(bulk.value, 'mixed');
  assert.equal(bulk.disabled, false);
  assert.match(f.document.querySelector('.mcp-permission-global').textContent, /Tous les outils/);
});

test('action approval is single-use in the UI and never carries a durable permission update', async (t) => {
  let finish;
  const f = fixture(t, 'actions', { jobId: 'job-1', running: true }, (url, input) => {
    if (!input) return reply({ actions: [action()] });
    assert.equal(url, '/api/mcp/actions/decide');
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await until(() => button(f, 'Autoriser cette action'));
  assert.match(f.document.querySelector('pre').textContent, /README\.md/);
  button(f, 'Autoriser cette action').click();
  button(f, 'Autoriser cette action').click();
  await until(() => finish);
  const posts = f.calls.filter((call) => call.input);
  assert.equal(posts.length, 1);
  assert.deepEqual(posts[0].input, { requestId: 'action-1', decision: 'allow' });
  finish(
    reply(action({ status: 'unknown', error: { code: 'timeout', message: 'Résultat inconnu' } })),
  );
  await until(() => !button(f, 'Autoriser cette action'));
  assert.match(f.document.body.textContent, /Vérifiez son résultat/);
  assert.ok(!f.calls.some((call) => call.url === '/api/mcp/policy'));
});

test('switching jobs hides old action approvals while the new job is loading', async (t) => {
  let resolveSecond;
  const f = fixture(t, 'actions', { jobId: 'job-1', running: true }, (url) => {
    if (url.endsWith('job-1')) return reply({ actions: [action()] });
    return new Promise((resolve) => {
      resolveSecond = resolve;
    });
  });
  await until(() => button(f, 'Autoriser cette action'));
  f.handle.render({ jobId: 'job-2', running: true });
  await until(() => resolveSecond);
  assert.equal(button(f, 'Autoriser cette action'), undefined);
  assert.ok(!f.document.body.textContent.includes('README.md'));
  resolveSecond(reply({ actions: [] }));
});

test('a late poll cannot resurrect an approval after the decision response', async (t) => {
  let reads = 0,
    resolvePoll;
  const f = fixture(t, 'actions', { jobId: 'job-1', running: true }, (_url, input) => {
    if (input) return reply(action({ status: 'denied' }));
    if (++reads === 1) return reply({ actions: [action()] });
    return new Promise((resolve) => {
      resolvePoll = resolve;
    });
  });
  await until(() => button(f, 'Refuser') && f.hasPoll());
  f.runPoll();
  await until(() => resolvePoll);
  button(f, 'Refuser').click();
  await until(() => f.document.body.textContent.includes('Action refusée'));
  resolvePoll(reply({ actions: [action()] }));
  await setTimeout(25);
  assert.equal(button(f, 'Autoriser cette action'), undefined);
  assert.match(f.document.body.textContent, /Action refusée/);
});

test('a delayed decision receipt cannot replace a completed action returned by polling', async (t) => {
  let reads = 0,
    resolveDecision;
  const f = fixture(t, 'actions', { jobId: 'job-1', running: true }, (_url, input) => {
    if (input)
      return new Promise((resolve) => {
        resolveDecision = resolve;
      });
    return reply({
      actions: [
        action(
          ++reads === 1
            ? {}
            : {
                status: 'completed',
                result: { content: [{ type: 'text', text: 'Provider result' }] },
              },
        ),
      ],
    });
  });
  await until(() => button(f, 'Autoriser cette action') && f.hasPoll());
  button(f, 'Autoriser cette action').click();
  await until(() => resolveDecision);
  f.runPoll();
  await until(() => f.document.body.textContent.includes('Résultat reçu'));
  resolveDecision(reply(action({ status: 'executing' })));
  await setTimeout(25);
  assert.match(f.document.body.textContent, /Résultat reçu/);
  assert.ok(!f.document.body.textContent.includes('Action en cours'));
});
