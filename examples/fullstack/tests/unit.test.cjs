const { test } = require('node:test');
const assert = require('node:assert/strict');
const { taskTitle, InvalidTitle } = require('../build/domain/task');
const { Tasks } = require('../build/application/tasks');
test('title normalization and boundaries are authoritative', () => {
  assert.equal(taskTitle('  Review contract  '), 'Review contract');
  assert.equal(taskTitle('x'.repeat(120)).length, 120);
  for (const value of [null, 12, '', '   ', 'x'.repeat(121), '\u0000', 'before\u0000after'])
    assert.throws(() => taskTitle(value), InvalidTitle);
});
test('invalid input never reaches persistence and valid creation returns its durable identifier', async () => {
  const writes = [];
  const service = new Tasks({
    list: async () => writes,
    insert: async (task) => {
      writes.push(task);
      return task;
    },
  });
  assert.throws(() => service.create(' '), InvalidTitle);
  assert.throws(() => service.create('before\u0000after'), InvalidTitle);
  assert.equal(writes.length, 0);
  const created = await service.create('  Read ADR  ');
  assert.equal(created.title, 'Read ADR');
  assert.match(created.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  const second = await service.create('Read ADR');
  assert.notEqual(second.id, created.id, 'Each creation must receive a distinct UUID.');
  assert.deepEqual(await service.list(), [created, second]);
});
