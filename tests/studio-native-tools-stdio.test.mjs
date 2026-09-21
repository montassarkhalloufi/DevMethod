import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createNativeToolsServer } from '../scripts/studio/native-tools-stdio.mjs';

const script = fileURLToPath(new URL('../scripts/studio/native-tools-stdio.mjs', import.meta.url));
const token = 'scoped-private-token-fixture-123456789';

async function fixture(t, timeoutMs) {
  let handler = (_request, response) => response.end(JSON.stringify({ status: 'pending' }));
  const requests = [];
  const httpServer = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({
      url: request.url,
      auth: request.headers.authorization,
      body: JSON.parse(Buffer.concat(chunks).toString()),
    });
    handler(request, response);
  });
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${httpServer.address().port}/native/`;
  const env = { DEVMETHOD_NATIVE_TOOLS_URL: url, DEVMETHOD_NATIVE_TOOLS_TOKEN: token };
  const client = new Client({ name: 'controlled-local-fixture', version: '1.0.0' });
  let server;
  if (timeoutMs) {
    server = createNativeToolsServer({ env, timeoutMs });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    await client.connect(b);
  } else {
    await client.connect(
      new StdioClientTransport({ command: process.execPath, args: [script], env, stderr: 'pipe' }),
    );
  }
  t.after(async () => {
    await client.close();
    await server?.close();
    httpServer.closeAllConnections();
    await new Promise((resolve) => httpServer.close(resolve));
  });
  return {
    client,
    requests,
    url,
    setHandler: (value) => {
      handler = value;
    },
  };
}

const call = () => ({
  connectionId: randomUUID(),
  toolName: 'fixture.read',
  arguments: { query: 'controlled fixture' },
  requestId: randomUUID(),
});

test('real STDIO SDK advertises only scoped tools and forwards exact arguments and request identity', async (t) => {
  const f = await fixture(t);
  const listed = await f.client.listTools();
  assert.deepEqual(
    listed.tools.map((entry) => entry.name),
    ['studio_tools', 'studio_call', 'studio_actions'],
  );
  assert.ok(listed.tools.every((entry) => !('jobId' in entry.inputSchema.properties)));
  const input = call();
  const result = await f.client.callTool({ name: 'studio_call', arguments: input });
  assert.deepEqual(f.requests, [{ url: '/native/call', auth: `Bearer ${token}`, body: input }]);
  assert.equal(result.structuredContent.status, 'pending');
  await f.client.callTool({
    name: 'studio_tools',
    arguments: { connectionId: input.connectionId },
  });
  await f.client.callTool({ name: 'studio_actions', arguments: { requestId: input.requestId } });
  assert.deepEqual(
    f.requests.map((request) => request.url),
    ['/native/call', '/native/tools', '/native/actions'],
  );
  const count = f.requests.length;
  for (const args of [
    { ...input, jobId: 'foreign' },
    { ...input, decision: 'allow' },
    { ...input, requestId: undefined },
    { ...input, connectionId: [input.connectionId] },
  ]) {
    assert.equal((await f.client.callTool({ name: 'studio_call', arguments: args })).isError, true);
  }
  assert.equal(f.requests.length, count);
});

test('STDIO preserves provider failure and suppresses HTTP body and environment secrets', async (t) => {
  const f = await fixture(t);
  f.setHandler((_request, response) =>
    response.end(JSON.stringify({ status: 'completed', isError: true, result: { text: token } })),
  );
  const result = await f.client.callTool({ name: 'studio_call', arguments: call() });
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.isError, true);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(token));
  f.setHandler((_request, response) => {
    response.writeHead(403);
    response.end(JSON.stringify({ error: token }));
  });
  const refused = await f.client.callTool({ name: 'studio_actions', arguments: {} });
  assert.equal(refused.isError, true);
  assert.match(refused.content[0].text, /403/);
  assert.doesNotMatch(JSON.stringify(refused), new RegExp(token));
});

test('STDIO rejects redirects and oversized or malformed responses without retries', async (t) => {
  const f = await fixture(t);
  for (const handler of [
    (_request, response) => {
      response.writeHead(302, { Location: f.url + 'redirected' });
      response.end();
    },
    (_request, response) => response.end(JSON.stringify({ value: 'x'.repeat(256 * 1024) })),
    (_request, response) => response.end('{private-malformed'),
  ]) {
    f.setHandler(handler);
    const before = f.requests.length;
    const result = await f.client.callTool({ name: 'studio_actions', arguments: {} });
    assert.equal(result.isError, true);
    assert.equal(f.requests.length, before + 1);
    assert.doesNotMatch(JSON.stringify(result), /private-malformed/);
  }
});

test('SDK timeout after observed HTTP dispatch never retries an uncertain effect', async (t) => {
  const f = await fixture(t, 50);
  // Control the deadline source, not fetch: HTTP must reach the local fixture before
  // this test claims an uncertain effect. Real scheduling can expire before dispatch.
  const deadline = new AbortController();
  let timeoutCalls = 0,
    received;
  const requestReceived = new Promise((resolve) => {
    received = resolve;
  });
  t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
    assert.equal(milliseconds, 50);
    timeoutCalls++;
    return deadline.signal;
  });
  f.setHandler(() => received());
  const pending = f.client.callTool({ name: 'studio_call', arguments: call() });
  await requestReceived;
  assert.equal(f.requests.length, 1);
  deadline.abort(new DOMException('Controlled deadline after reception', 'TimeoutError'));
  const result = await pending;
  assert.equal(timeoutCalls, 1);
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /effect may be unknown/);
  assert.equal(f.requests.length, 1);
});

test('configuration refuses nonliteral loopback, credentials, missing port and unsafe suffixes without echoing values', () => {
  for (const url of [
    'https://127.0.0.1:1234/',
    'http://localhost:1234/',
    'http://127.1:1234/',
    'http://127.0.0.1/',
    'http://127.0.0.1:0/',
    'http://127.0.0.1:1234/path?secret=value',
    'http://127.0.0.1:1234/#secret',
    'http://user:private@127.0.0.1:1234/',
  ]) {
    assert.throws(
      () =>
        createNativeToolsServer({
          env: { DEVMETHOD_NATIVE_TOOLS_URL: url, DEVMETHOD_NATIVE_TOOLS_TOKEN: token },
        }),
      (error) => {
        assert.doesNotMatch(error.message, /secret|private|1234/);
        return true;
      },
    );
  }
});

test('SDK timeout before HTTP dispatch performs no request and never retries', async (t) => {
  const f = await fixture(t, 50);
  let deadlines = 0;
  t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
    assert.equal(milliseconds, 50);
    deadlines++;
    return AbortSignal.abort(
      new DOMException('Controlled deadline before dispatch', 'TimeoutError'),
    );
  });
  const result = await f.client.callTool({ name: 'studio_call', arguments: call() });
  assert.equal(result.isError, true);
  assert.equal(deadlines, 1);
  assert.equal(f.requests.length, 0);
});
