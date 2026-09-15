const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../build/http');
test('Nest HTTP contract validates input and exposes created tasks', async (t) => {
  const rows = [];
  const app = await createApp({
    list: async () => rows,
    insert: async (row) => {
      rows.push(row);
      return row;
    },
  });
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const url = await app.getUrl();
  const post = (body) =>
    fetch(`${url}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  for (const body of [
    { title: '' },
    { title: 42 },
    { title: 'before\u0000after' },
    { title: 'x'.repeat(121) },
    { title: 'ok', admin: true },
    [],
  ]) {
    assert.equal((await post(body)).status, 400);
  }
  const multipart = new FormData();
  multipart.set('title', 'Do not accept uploads');
  for (const options of [
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://untrusted.example',
      },
      body: 'title=Do+not+persist',
    },
    { headers: { 'content-type': 'text/plain' }, body: '{"title":"Do not persist"}' },
    { body: multipart },
  ]) {
    const response = await fetch(`${url}/tasks`, { method: 'POST', ...options });
    assert.equal(response.status, 415);
    assert.equal((await response.json()).statusCode, 415);
    assert.equal(rows.length, 0, 'Unsupported media must never reach persistence.');
  }
  assert.equal(rows.length, 0);
  const response = await fetch(`${url}/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ title: '  Publish evidence  ' }),
  });
  assert.equal(response.status, 201);
  const task = await response.json();
  assert.equal(task.title, 'Publish evidence');
  const listed = await fetch(`${url}/tasks`);
  assert.equal(listed.status, 200);
  assert.deepEqual(await listed.json(), [task]);
});
test('infrastructure failure returns 500 without exposing driver secrets', async (t) => {
  const app = await createApp({
    list: async () => {
      throw new Error('private-db-credential');
    },
    insert: async () => {
      throw new Error('private-db-credential');
    },
  });
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const response = await fetch(`${await app.getUrl()}/tasks`);
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private-db-credential/);
});
test('failed creation returns a generic 500 after reaching persistence', async (t) => {
  let insertCalls = 0;
  const app = await createApp({
    list: async () => [],
    insert: async () => {
      insertCalls += 1;
      throw new Error('private-insert-credential');
    },
  });
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  const response = await fetch(`${await app.getUrl()}/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'A valid task' }),
  });
  assert.equal(insertCalls, 1);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    statusCode: 500,
    message: 'Internal server error',
  });
});
