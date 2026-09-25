import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { readMcpUsage } from '../scripts/studio/mcp-usage.mjs';
import { createMcpRoutes } from '../scripts/studio/mcp-routes.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'mcp-usage-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  function project(name, ids) {
    const workspace = path.join(root, name);
    fs.mkdirSync(path.join(workspace, '.devmethod'), { recursive: true });
    if (ids !== undefined)
      fs.writeFileSync(
        path.join(workspace, '.devmethod/mcp-selection.json'),
        JSON.stringify({ format: 1, connectionIds: ids }),
      );
    return { id: randomUUID(), name, workspace };
  }

  return { root, project };
}

test('connection usage lists only registered projects selecting the exact shared connection and exposes no filesystem paths', (t) => {
  const f = fixture(t),
    target = randomUUID(),
    other = randomUUID();
  const first = f.project('Documentation', [target]),
    second = f.project('Application', [other, target]);
  const unrelated = f.project('Unrelated', [other]),
    empty = f.project('Unconfigured');
  f.project('Not in Home library', [target]);
  const result = readMcpUsage([first, second, unrelated, empty], target);
  assert.deepEqual(result, {
    supported: true,
    projects: [
      { id: first.id, name: first.name },
      { id: second.id, name: second.name },
    ],
    unavailable: 0,
  });
  assert.ok(!JSON.stringify(result).includes(f.root));
  assert.deepEqual(readMcpUsage([first, second, unrelated, empty], randomUUID()).projects, []);
});

test('unreadable, removed and symlinked projects remain unknown instead of being reported as unselected', (t) => {
  const f = fixture(t),
    target = randomUUID();
  const valid = f.project('Available', [target]);
  const corrupt = f.project('Corrupt', []);
  fs.writeFileSync(path.join(corrupt.workspace, '.devmethod/mcp-selection.json'), '{broken');
  const removed = f.project('Removed', [target]);
  fs.rmSync(removed.workspace, { recursive: true });
  const linked = f.project('Linked');
  fs.symlinkSync(
    path.join(valid.workspace, '.devmethod/mcp-selection.json'),
    path.join(linked.workspace, '.devmethod/mcp-selection.json'),
  );
  const result = readMcpUsage([valid, corrupt, removed, linked], target);
  assert.deepEqual(result.projects, [{ id: valid.id, name: valid.name }]);
  assert.equal(result.unavailable, 3);
  assert.equal(
    fs.existsSync(removed.workspace),
    false,
    'A read must not recreate removed projects',
  );
});

async function routeRequest(route, origin, pathname, headers = {}, method = 'GET') {
  const response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    writeHead(status, headers) {
      this.status = status;
      Object.assign(this.headers, headers);
    },
    end(content) {
      this.body = JSON.parse(content);
    },
  };
  const handled = await route(
    { method, headers: { host: new URL(origin).host, ...headers } },
    response,
    new URL(pathname, origin),
  );
  assert.equal(handled, true);
  return response;
}

test('usage route enforces host, origin, method and one valid connection id and reports unsupported standalone inventories', async () => {
  const origin = 'http://127.0.0.1:4362',
    id = randomUUID();
  const calls = [];
  const route = createMcpRoutes(null, () => origin, {
    getUsage: (connectionId) => {
      calls.push(connectionId);
      return { supported: true, projects: [], unavailable: 0 };
    },
  });
  const pathname = '/api/mcp/usage?connectionId=' + id;
  const allowed = await routeRequest(route, origin, pathname, { origin });
  assert.equal(allowed.status, 200);
  assert.deepEqual(calls, [id]);
  for (const headers of [
    { origin: 'https://untrusted.invalid' },
    { host: 'untrusted.invalid' },
    { 'sec-fetch-site': 'cross-site' },
  ])
    assert.equal((await routeRequest(route, origin, pathname, headers)).status, 403);
  assert.equal((await routeRequest(route, origin, pathname, {}, 'POST')).status, 405);
  assert.equal((await routeRequest(route, origin, pathname + '&connectionId=' + id)).status, 400);
  assert.equal(
    (await routeRequest(route, origin, '/api/mcp/usage?connectionId=invalid')).status,
    400,
  );
  assert.equal(calls.length, 1);
  const standalone = createMcpRoutes(null, () => origin);
  assert.deepEqual((await routeRequest(standalone, origin, pathname)).body, {
    projects: [],
    supported: false,
  });
});
