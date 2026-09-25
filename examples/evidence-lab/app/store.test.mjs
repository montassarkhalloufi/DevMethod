import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createStore } from './store.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'volunteer-store-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, 'state.json');
  return { path, store: createStore(path) };
}

test('starts lazily, exposes seeded capacities, and does not leak mutable records', (t) => {
  const { path, store } = fixture(t);
  assert.equal(existsSync(path), false);
  const slots = store.listSlots();
  assert.deepEqual(
    slots.map(({ id, capacity, remaining }) => ({ id, capacity, remaining })),
    [
      { id: 'welcome', capacity: 2, remaining: 2 },
      { id: 'garden', capacity: 3, remaining: 3 },
    ],
  );
  assert.equal(existsSync(path), true);
  slots[0].capacity = 500;
  const reservation = store.reserve({ slotId: 'welcome', requestId: 'first', seats: 1 });
  reservation.seats = 500;
  const records = store.listReservations();
  records[0].status = 'cancelled';
  assert.equal(store.listSlots()[0].remaining, 1);
  assert.equal(store.listReservations()[0].status, 'active');
});

test('retries and cancellations are idempotent across restarts and never resurrect a booking', (t) => {
  const { path, store } = fixture(t);
  const input = { slotId: 'garden', requestId: 'durable', seats: 2 };
  const first = store.reserve(input);
  assert.deepEqual(createStore(path).reserve(input), first);
  assert.equal(store.listSlots()[1].remaining, 1);
  const cancelled = createStore(path).cancel(first.id);
  assert.equal(cancelled.status, 'cancelled');
  const bytes = readFileSync(path, 'utf8');
  assert.deepEqual(store.cancel(first.id), cancelled);
  assert.deepEqual(createStore(path).reserve(input), cancelled);
  assert.equal(store.listSlots()[1].remaining, 3);
  assert.equal(readFileSync(path, 'utf8'), bytes);
});

test('rejected mutations preserve exact durable bytes', (t) => {
  const { path, store } = fixture(t);
  store.reserve({ slotId: 'welcome', requestId: 'booked', seats: 2 });
  const before = readFileSync(path, 'utf8');
  const cases = [
    [{ slotId: 'welcome', requestId: 'another', seats: 1 }, 'CAPACITY_EXCEEDED'],
    [{ slotId: 'garden', requestId: 'booked', seats: 2 }, 'REQUEST_CONFLICT'],
    [{ slotId: 'welcome', requestId: 'booked', seats: 1 }, 'REQUEST_CONFLICT'],
    [{ slotId: 'missing', requestId: 'unknown-slot', seats: 1 }, 'SLOT_NOT_FOUND'],
    [{ slotId: 'garden', requestId: '', seats: 1 }, 'INVALID_REQUEST'],
    ...[0, -1, 1.2, '1', null, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1].map((seats) => [
      { slotId: 'garden', requestId: 'invalid', seats },
      'INVALID_SEATS',
    ]),
  ];
  for (const [input, code] of cases) {
    assert.throws(() => store.reserve(input), { code });
    assert.equal(readFileSync(path, 'utf8'), before);
  }
  assert.throws(() => store.cancel('missing'), { code: 'RESERVATION_NOT_FOUND' });
  assert.equal(readFileSync(path, 'utf8'), before);
});

test('an unsuccessful first mutation does not create a file', (t) => {
  const { path, store } = fixture(t);
  assert.throws(() => store.reserve({ slotId: 'missing', requestId: 'one', seats: 1 }), {
    code: 'SLOT_NOT_FOUND',
  });
  assert.equal(existsSync(path), false);
});

test('changing the new-event seed from three to four preserves an existing event and its reservations', async (t) => {
  const { path, store } = fixture(t);
  store.reserve({ slotId: 'garden', requestId: 'existing-event', seats: 1 });
  const before = readFileSync(path, 'utf8');
  const updatedPath = `${path}.updated.mjs`;
  const source = readFileSync(new URL('./store.mjs', import.meta.url), 'utf8');
  assert.equal(
    source.split('capacity: 3').length,
    2,
    'The maintenance edit must identify one seed value.',
  );
  writeFileSync(updatedPath, source.replace('capacity: 3', 'capacity: 4'));
  const updated = await import(pathToFileURL(updatedPath).href);
  const reopened = updated.createStore(path);
  assert.equal(reopened.listSlots().find((slot) => slot.id === 'garden').capacity, 3);
  assert.equal(reopened.listSlots().find((slot) => slot.id === 'garden').remaining, 2);
  assert.equal(readFileSync(path, 'utf8'), before);
  const fresh = updated.createStore(`${path}.new-event`);
  assert.equal(fresh.listSlots().find((slot) => slot.id === 'garden').capacity, 4);
});

test('corrupt, unrelated and inconsistent files fail closed without replacement', (t) => {
  const { path, store } = fixture(t);
  store.reserve({ slotId: 'welcome', requestId: 'one', seats: 1 });
  const original = JSON.parse(readFileSync(path, 'utf8'));
  const overCapacity = structuredClone(original);
  overCapacity.reservations[0].seats = 3;
  const duplicated = structuredClone(original);
  duplicated.reservations.push({ ...duplicated.reservations[0] });
  const invalidStatus = structuredClone(original);
  invalidStatus.reservations[0].status = 'unknown';
  for (const contents of [
    '{bad json',
    '{}',
    'null',
    JSON.stringify(overCapacity),
    JSON.stringify(duplicated),
    JSON.stringify(invalidStatus),
  ]) {
    writeFileSync(path, contents);
    assert.throws(() => store.listSlots(), { code: 'DATA_CORRUPT' });
    assert.throws(() => store.reserve({ slotId: 'garden', requestId: 'two', seats: 1 }), {
      code: 'DATA_CORRUPT',
    });
    assert.equal(readFileSync(path, 'utf8'), contents);
  }
});

test('a symbolic data path is refused without modifying its target', (t) => {
  const { path, store } = fixture(t);
  const target = `${path}.unrelated`;
  writeFileSync(target, 'unrelated content');
  symlinkSync(target, path);
  assert.throws(() => store.listReservations(), { code: 'DATA_CORRUPT' });
  assert.equal(readFileSync(target, 'utf8'), 'unrelated content');
});
