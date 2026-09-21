import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createMcpFetch } from '../scripts/studio/mcp-network.mjs';

async function responseServer(t) {
  const server = http.createServer((request, response) => {
    response.writeHead(Number(request.url.slice(1)), { 'Content-Type': 'text/plain' });
    response.end('Fixture body');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  return 'http://127.0.0.1:' + server.address().port;
}

test(
  'MCP HTTP 204, 205 and HEAD responses have null bodies and leave the client usable',
  { timeout: 2000 },
  async (t) => {
    const origin = await responseServer(t),
      request = createMcpFetch(origin);
    for (const [status, method] of [
      [204, 'GET'],
      [205, 'GET'],
      [200, 'HEAD'],
    ]) {
      const response = await request(origin + '/' + status, { method });
      assert.equal(response.status, status);
      assert.equal(response.body, null);
      assert.equal(await response.text(), '');
    }
    assert.equal(await (await request(origin + '/200')).text(), 'Fixture body');
  },
);

test(
  'a real out-of-range upstream status rejects the request without escaping the HTTP callback',
  { timeout: 2000 },
  async (t) => {
    const origin = await responseServer(t),
      request = createMcpFetch(origin);
    await assert.rejects(request(origin + '/700'), RangeError);
    assert.equal((await request(origin + '/200')).status, 200);
  },
);

test(
  'invalid upstream headers destroy the response and reject instead of crashing the process',
  { timeout: 2000 },
  async (t) => {
    const incoming = new PassThrough();
    incoming.statusCode = 200;
    incoming.headers = { 'bad header': 'invalid' };
    t.mock.method(http, 'request', (_url, _options, callback) => {
      const request = new EventEmitter();
      request.end = () => queueMicrotask(() => callback(incoming));
      return request;
    });
    await assert.rejects(createMcpFetch('http://127.0.0.1')('http://127.0.0.1'), TypeError);
    assert.equal(incoming.destroyed, true);
  },
);
