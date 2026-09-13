const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../build/http');
test('Nest HTTP contract validates input and exposes created tasks', async (t) => {
  const rows = [];
  const app = await createApp({ list: async () => rows, insert: async (row) => { rows.push(row); return row; } });
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const url = await app.getUrl();
  const post = (body) => fetch(`${url}/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  for (const body of [{ title: '' }, { title: 42 }, { title: 'before\u0000after' }, { title: 'x'.repeat(121) }, { title: 'ok', admin: true }, []]) {
    assert.equal((await post(body)).status, 400);
  }
  assert.equal(rows.length, 0);
  const response = await post({ title: '  Publish evidence  ' });
  assert.equal(response.status, 201);
  const task = await response.json();
  assert.equal(task.title, 'Publish evidence');
  const listed = await fetch(`${url}/tasks`);
  assert.equal(listed.status, 200);
  assert.deepEqual(await listed.json(), [task]);
});
test('infrastructure failure returns 500 without exposing driver secrets', async (t) => {
  const app = await createApp({ list: async () => { throw new Error('private-db-credential'); }, insert: async () => { throw new Error('private-db-credential'); } });
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const response = await fetch(`${await app.getUrl()}/tasks`);
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private-db-credential/);
});
