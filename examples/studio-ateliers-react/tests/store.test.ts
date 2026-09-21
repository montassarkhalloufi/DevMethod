import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWorkshopStore,
  DataConflict,
} from '../src/features/workshops/services/workshop-store.ts';
import { initialData, register } from '../src/features/workshops/model/domain.ts';

test('stored data is decoded without a write or initialization', async () => {
  let writes = 0;
  const existing = register(initialData(), 'repair-bike', 'Amina', 'a');
  const store = createWorkshopStore(async (_url, init) => {
    if (init?.method === 'POST') writes++;
    return Response.json({ version: 9, data: existing });
  });
  assert.deepEqual(await store.load(), { version: 9, data: existing });
  assert.equal(writes, 0);
});

test('first use initializes empty data with the exact version and retains a concurrent initializer', async () => {
  const concurrent = register(initialData(), 'repair-bike', 'Noa', 'n');
  let requests = 0;
  const store = createWorkshopStore(async (_url, init) => {
    requests++;
    if (requests === 1) return Response.json({ version: 1, data: {} });
    if (requests === 2) {
      assert.equal(init?.method, 'POST');
      assert.equal(JSON.parse(String(init.body)).version, 1);
      return Response.json({ error: 'conflict', version: 2 }, { status: 409 });
    }
    return Response.json({ version: 2, data: concurrent });
  });
  assert.deepEqual(await store.load(), { version: 2, data: concurrent });
  assert.equal(requests, 3);
});

test('HTTP 409 is never an acknowledged save or a blind retry', async () => {
  let calls = 0;
  const store = createWorkshopStore(async (_url, init) => {
    calls++;
    assert.deepEqual(JSON.parse(String(init?.body)), { version: 5, data: initialData() });
    return Response.json({ error: 'conflict' }, { status: 409 });
  });
  await assert.rejects(store.save(5, initialData()), DataConflict);
  assert.equal(calls, 1);
});

test('failed acknowledgement and incompatible existing data cannot announce persistence', async () => {
  const failed = createWorkshopStore(async () => Response.json({ error: 'disk' }, { status: 500 }));
  await assert.rejects(failed.save(3, initialData()), /500/);
  let calls = 0;
  const incompatible = createWorkshopStore(async () => {
    calls++;
    return Response.json({ version: 2, data: { otherApp: true } });
  });
  await assert.rejects(incompatible.load(), /incompatible/);
  assert.equal(calls, 1);
});
