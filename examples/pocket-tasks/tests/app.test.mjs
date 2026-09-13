import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { createTaskServer } from '../server.mjs';
import { validateBody } from '../src/domain.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'pocket-tasks-'));
  const file = join(dir, 'tasks.json');
  const servers = [];
  async function start() {
    const server = createTaskServer({ dataFile: file }); servers.push(server);
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    return { server, call: (path = '/api/tasks', method = 'GET', payload) => fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(payload === undefined ? {} : { body: typeof payload === 'string' ? payload : JSON.stringify(payload) }) }) };
  }
  t.after(async () => { for (const server of servers) if (server.listening) await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); });
  return { dir, file, start, ...await start() };
}

test('domain normalizes titles and rejects invalid shapes/fields', () => {
  assert.deepEqual(validateBody({ title: '  hello  ' }), { title: 'hello' });
  assert.deepEqual(validateBody({ done: false }, true), { done: false });
  for (const body of [null, [], {}, { title: '' }, { title: ' ' }, { title: 1 }, { title: 'x'.repeat(121) }]) assert.throws(() => validateBody(body));
  for (const body of [null, [], {}, { extra: true }, { done: 'true' }, { title: ' ' }, { done: null }]) assert.throws(() => validateBody(body, true));
  assert.equal(validateBody({ title: 'x'.repeat(120) }).title.length, 120);
});

test('HTTP CRUD and restart preserve titles, completion and deletion', async t => {
  const f = await fixture(t);
  assert.deepEqual(await (await f.call()).json(), { tasks: [] });
  const created = await f.call('/api/tasks', 'POST', { title: '  <img src=x onerror=alert(1)>  ' });
  assert.equal(created.status, 201); const { task } = await created.json();
  assert.equal(task.title, '<img src=x onerror=alert(1)>'); assert.equal(task.done, false); assert.equal(typeof task.id, 'string');
  const updated = await f.call(`/api/tasks/${task.id}`, 'PATCH', { title: ' Revised ', done: true });
  assert.equal(updated.status, 200); assert.deepEqual((await updated.json()).task, { id: task.id, title: 'Revised', done: true });
  await new Promise(resolve => f.server.close(resolve));
  const restarted = await f.start();
  assert.deepEqual((await (await restarted.call()).json()).tasks, [{ id: task.id, title: 'Revised', done: true }]);
  assert.equal((await restarted.call(`/api/tasks/${task.id}`, 'PATCH', { done: false })).status, 200);
  assert.equal((await restarted.call(`/api/tasks/${task.id}`, 'DELETE')).status, 204);
  assert.deepEqual(JSON.parse(await readFile(f.file, 'utf8')), []);
  assert.equal((await restarted.call(`/api/tasks/${task.id}`, 'DELETE')).status, 404);
});

test('bad HTTP input and oversized body never change persisted state', async t => {
  const f = await fixture(t);
  const { task } = await (await f.call('/api/tasks', 'POST', { title: 'Keep me' })).json();
  const before = await readFile(f.file, 'utf8');
  for (const payload of ['{', 'null', '[]', { title: false }, { title: '' }, { title: 'x'.repeat(121) }]) {
    const response = await f.call('/api/tasks', 'POST', payload); assert.equal(response.status, 400); assert.equal(typeof (await response.json()).error, 'string');
  }
  for (const payload of [{}, { done: 1 }, { title: null }, { extra: 'value' }]) assert.equal((await f.call(`/api/tasks/${task.id}`, 'PATCH', payload)).status, 400);
  const large = await f.call('/api/tasks', 'POST', { title: 'x'.repeat(17000) }); assert.equal(large.status, 413); assert.equal(typeof (await large.json()).error, 'string');
  assert.equal((await f.call('/api/tasks/missing', 'PATCH', { done: true })).status, 404);
  assert.equal(await readFile(f.file, 'utf8'), before);
});

test('concurrent mutations serialize without losing tasks or leaking temp files', async t => {
  const f = await fixture(t);
  const responses = await Promise.all(Array.from({ length: 20 }, (_, n) => f.call('/api/tasks', 'POST', { title: `Task ${n}` })));
  assert.ok(responses.every(response => response.status === 201));
  const tasks = (await (await f.call()).json()).tasks;
  assert.equal(tasks.length, 20); assert.equal(new Set(tasks.map(task => task.id)).size, 20);
  assert.deepEqual(await readdir(f.dir), ['tasks.json']);
});

test('malformed persisted data fails closed and recovers only after explicit repair', async t => {
  const f = await fixture(t);
  for (const malformed of ['{broken', '{}', '[{"id":"x","title":"","done":false}]', '[{"id":"x","title":"hello","done":"yes"}]', '[{"id":"x","title":"hello","done":false},{"id":"x","title":"again","done":true}]']) {
    await writeFile(f.file, malformed);
    assert.equal((await f.call()).status, 500);
    assert.equal((await f.call('/api/tasks', 'POST', { title: 'New' })).status, 500);
    assert.equal(await readFile(f.file, 'utf8'), malformed);
  }
  await writeFile(f.file, '[]');
  assert.equal((await f.call('/api/tasks', 'POST', { title: 'Recovered' })).status, 201);
});

test('static allowlist serves UI and rejects private assets and unknown methods', async t => {
  const f = await fixture(t);
  const page = await f.call('/'); assert.equal(page.status, 200); assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await page.text(), /aria-live="polite"/);
  for (const path of ['/server.mjs', '/BRIEF.md', '/data/tasks.json', '/%2e%2e%2fserver.mjs', '/missing']) assert.equal((await f.call(path)).status, 404);
  assert.equal((await f.call('/api/tasks', 'PUT', {})).status, 404);
  const js = await (await f.call('/app.js')).text(); assert.ok(!js.includes('innerHTML'));
});


test('local HTTP boundary rejects cross-site writes, rebinding hosts and simple MIME without mutation', async t => {
  const f = await fixture(t);
  const { task } = await (await f.call('/api/tasks', 'POST', { title: 'Keep local' })).json();
  const before = await readFile(f.file, 'utf8');
  const port = f.server.address().port;
  const send = (method, path, headers, payload = '{}') => new Promise((resolve, reject) => {
    const request = httpRequest({ hostname: '127.0.0.1', port, method, path, headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) } }, response => {
      let text = ''; response.setEncoding('utf8'); response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, text }));
    });
    request.on('error', reject); request.end(payload);
  });
  const local = { Host: `127.0.0.1:${port}`, 'Content-Type': 'application/json' };
  for (const headers of [
    { ...local, Origin: 'https://attacker.example' },
    { ...local, Origin: 'null' },
    { ...local, Origin: `http://127.0.0.1:${port + 1}` },
    { ...local, Origin: `http://127.0.0.1:${port}`, 'Sec-Fetch-Site': 'cross-site' },
    { ...local, Host: `attacker.example:${port}` },
    { ...local, Host: `127.0.0.1:${port + 1}` },
    { ...local, Host: `localhost:${port}` },
    { ...local, Host: `127.0.0.1:${port}.attacker.example` },
  ]) {
    for (const [method, path] of [['POST', '/api/tasks'], ['PATCH', `/api/tasks/${task.id}`], ['DELETE', `/api/tasks/${task.id}`]]) {
      const response = await send(method, path, headers, JSON.stringify({ title: 'Injected' }));
      assert.equal(response.status, 403); assert.equal(typeof JSON.parse(response.text).error, 'string');
    }
  }
  for (const mime of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', '']) {
    for (const [method, path] of [['POST', '/api/tasks'], ['PATCH', `/api/tasks/${task.id}`]]) {
      assert.equal((await send(method, path, { ...local, 'Content-Type': mime }, '{"title":"Injected"}')).status, 415);
    }
  }
  assert.equal((await send('GET', '/api/tasks', { ...local, Host: `attacker.example:${port}` })).status, 403);
  assert.equal(await readFile(f.file, 'utf8'), before);
  assert.equal((await send('PATCH', `/api/tasks/${task.id}`, { ...local, Origin: `http://127.0.0.1:${port}`, 'Content-Type': 'application/json; charset=utf-8' }, '{"done":true}')).status, 200);
  assert.equal((await send('PATCH', `/api/tasks/${task.id}`, local, '{"done":false}')).status, 200);
});
