import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyIntent,
  cancel,
  decodeData,
  decodePayload,
  initialData,
  placesLeft,
  register,
} from '../src/features/workshops/model/domain.ts';

test('initial empty storage is distinct from unknown existing data', () => {
  assert.deepEqual(decodePayload({ version: 1, data: {} }), { version: 1, data: null });
  assert.throws(() => decodePayload({ version: 1, data: { unrelated: ['keep'] } }), /incompatible/);
  assert.throws(() => decodePayload({ version: 0, data: {} }), /Version/);
});

test('strict validation refuses malformed capacities and references without mutation', () => {
  const invalid = {
    ...initialData(),
    workshops: [{ ...initialData().workshops[0], capacity: '2' }],
  };
  const before = structuredClone(invalid);
  assert.throws(() => decodeData(invalid), /incompatible/);
  assert.deepEqual(invalid, before);
  assert.throws(
    () =>
      decodeData({
        ...initialData(),
        registrations: [{ id: 'r', workshopId: 'missing', name: 'Noa' }],
      }),
    /références/,
  );
});

test('the additive waitlist migration retains existing names and unknown fields', () => {
  const original = {
    ...initialData(),
    note: { keep: true },
    waitlist: undefined,
    registrations: [
      { id: 'a', workshopId: 'repair-bike', name: 'Amina', externalId: 'keep-a' },
      { id: 'n', workshopId: 'season-cooking', name: 'Noa' },
      { id: 'o', workshopId: 'repair-bike', name: 'Omar' },
    ],
  };
  const decoded = decodeData(original);
  assert.ok(decoded);
  assert.deepEqual(decoded.registrations, original.registrations);
  assert.deepEqual(decoded.note, original.note);
  assert.deepEqual(decoded.waitlist, []);
  assert.equal(original.waitlist, undefined);
});

test('capacity overflow joins FIFO and cancellation promotes only the matching first person', () => {
  let data = register(initialData(), 'repair-bike', 'Amina', 'a');
  data = register(data, 'repair-bike', 'Omar', 'o');
  data = register(data, 'season-cooking', 'Noa', 'n');
  data = register(data, 'repair-bike', ' Lina ', 'l');
  data = register(data, 'repair-bike', 'Sami', 's');
  const before = structuredClone(data);
  const persisted = decodeData(JSON.parse(JSON.stringify(data)));
  assert.ok(persisted);
  const next = cancel(persisted, 'a');
  assert.deepEqual(
    next.registrations.map((entry) => entry.name),
    ['Omar', 'Noa', 'Lina'],
  );
  assert.deepEqual(
    next.waitlist.map((entry) => entry.name),
    ['Sami'],
  );
  assert.equal(placesLeft(next, 'repair-bike'), 0);
  assert.deepEqual(data, before);
  assert.deepEqual(cancel(next, 'a'), next);
});

test('leaving waitlist does not consume a seat or erase unrelated fields', () => {
  let data = register(initialData(), 'repair-bike', 'Amina', 'a');
  data = register(data, 'repair-bike', 'Omar', 'o');
  data = register(data, 'repair-bike', 'Lina', 'l');
  data = {
    ...data,
    note: 'keep',
    waitlist: data.waitlist.map((entry) => ({ ...entry, source: 'keep' })),
  };
  const promoted = cancel(data, 'a');
  assert.equal(promoted.registrations.at(-1)?.source, 'keep');
  const next = applyIntent(data, { type: 'leave-waitlist', registrationId: 'l' });
  assert.deepEqual(next.waitlist, []);
  assert.equal(next.note, 'keep');
  assert.equal(placesLeft(next, 'repair-bike'), 0);
});

test('retry on fresh data preserves the competing booking and queue order', () => {
  let data = register(initialData(), 'repair-bike', 'Amina', 'a');
  data = register(data, 'repair-bike', 'Omar', 'o');
  const fresh = register(data, 'repair-bike', 'Concurrente', 'remote');
  const retried = register(fresh, 'repair-bike', 'Locale', 'local');
  const next = cancel(retried, 'a');
  assert.equal(next.registrations.at(-1)?.name, 'Concurrente');
  assert.equal(next.waitlist[0]?.name, 'Locale');
  assert.throws(() => register(next, 'repair-bike', ' ', 'empty'), /nom/);
  assert.throws(() => register(next, 'missing', 'Nom', 'missing'), /existe/);
  assert.throws(() => register(next, 'repair-bike', 'Doublon', 'local'), /déjà/);
});
