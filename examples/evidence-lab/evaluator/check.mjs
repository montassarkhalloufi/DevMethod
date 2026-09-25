import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { referenceFactory } from './reference.mjs';

const [candidateRoot, mode, checkId] = process.argv.slice(2);
const expected = JSON.parse(
  readFileSync(new URL('./expected-seeds.json', import.meta.url), 'utf8'),
);
const modes = new Set([
  'healthy',
  'capacity-fault',
  'idempotency-fault',
  'cancellation-fault',
  'durability-fault',
]);
if (!candidateRoot || checkId !== 'domain' || (mode !== 'candidate' && !modes.has(mode))) {
  throw new Error('Invalid checker invocation');
}
if (
  expected.slots.length !== 2 ||
  expected.slots.some((slot) => !Number.isSafeInteger(slot.capacity) || slot.capacity <= 0)
) {
  throw new Error('Invalid independent seed expectations');
}
const factory =
  mode === 'candidate'
    ? (await import(pathToFileURL(resolve(candidateRoot, 'store.mjs')).href)).createStore
    : referenceFactory(expected, mode);
if (typeof factory !== 'function') throw new Error('createStore export missing');

class BusinessMismatch extends Error {}
const demand = (condition, message) => {
  if (!condition) throw new BusinessMismatch(message);
};
const equal = (actual, wanted, message) =>
  demand(JSON.stringify(actual) === JSON.stringify(wanted), message);
const expectRejected = (operation, message) => {
  let rejected = false;
  try {
    operation();
  } catch {
    rejected = true;
  }
  demand(rejected, message);
};
const temporaryRoot = mkdtempSync(join(tmpdir(), 'devmethod-independent-oracle-'));
const slotCapacity = (id) => expected.slots.find((slot) => slot.id === id).capacity;
const left = (store, id) => store.listSlots().find((slot) => slot.id === id)?.remaining;
const snapshot = (store) => ({ slots: store.listSlots(), reservations: store.listReservations() });
const verdicts = {};
const evaluate = (criterion, check) => {
  const file = join(temporaryRoot, `${criterion}.json`);
  const store = factory(file);
  try {
    check(store, file);
    verdicts[criterion] = 'passed';
  } catch (error) {
    if (!(error instanceof BusinessMismatch)) throw error;
    process.stderr.write(`${criterion}: ${error.message}\n`);
    verdicts[criterion] = 'failed';
  }
};

try {
  evaluate('capacity', (store, file) => {
    const initialSlots = store.listSlots();
    demand(initialSlots.length === expected.slots.length, 'Seed slot count differs');
    for (const wanted of expected.slots) {
      const actual = initialSlots.find((slot) => slot.id === wanted.id);
      demand(
        actual && Number.isSafeInteger(actual.capacity) && actual.capacity > 0,
        'Invalid capacity',
      );
      demand(
        actual.capacity === wanted.capacity && actual.remaining === wanted.capacity,
        'Seed capacity differs',
      );
      demand(typeof actual.title === 'string' && actual.title.length > 0, 'Missing slot title');
    }
    for (const seats of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1', undefined]) {
      const before = snapshot(store);
      const persistedBefore = snapshot(factory(file));
      expectRejected(
        () => store.reserve({ slotId: 'garden', requestId: `invalid-${String(seats)}`, seats }),
        'Invalid seats accepted',
      );
      equal(snapshot(store), before, 'Failed request changed live state');
      equal(snapshot(factory(file)), persistedBefore, 'Failed request changed durable state');
    }
    const seats = slotCapacity('welcome');
    const first = store.reserve({ slotId: 'welcome', requestId: 'full', seats });
    demand(
      first.status === 'active' && first.seats === seats && first.slotId === 'welcome',
      'Reservation fields differ',
    );
    demand(left(store, 'welcome') === 0, 'Full booking not reflected');
    const before = snapshot(store);
    const persistedBefore = snapshot(factory(file));
    expectRejected(
      () => store.reserve({ slotId: 'welcome', requestId: 'overflow', seats: 1 }),
      'Overbooking accepted',
    );
    equal(snapshot(store), before, 'Rejected overflow changed state');
    equal(snapshot(factory(file)), persistedBefore, 'Rejected overflow changed durable state');
  });
  evaluate('idempotency', (store, file) => {
    const request = { slotId: 'garden', requestId: 'repeat', seats: 1 };
    const first = store.reserve(request);
    equal(store.reserve(request), first, 'Replay created another reservation');
    demand(store.listReservations().length === 1, 'Duplicate reservation recorded');
    demand(left(store, 'garden') === slotCapacity('garden') - 1, 'Replay consumed capacity');
    const reopened = factory(file);
    equal(reopened.reserve(request), first, 'Replay after reopen differs');
    const before = snapshot(reopened);
    expectRejected(
      () => reopened.reserve({ ...request, seats: 2 }),
      'Changed seats reused requestId',
    );
    expectRejected(
      () => reopened.reserve({ ...request, slotId: 'welcome' }),
      'Changed slot reused requestId',
    );
    equal(snapshot(reopened), before, 'Rejected conflict changed state');
    equal(snapshot(factory(file)), before, 'Rejected conflict changed durable state');
  });
  evaluate('cancellation', (store, file) => {
    const request = { slotId: 'garden', requestId: 'cancel-me', seats: 1 };
    const first = store.reserve(request);
    const cancelled = store.cancel(first.id);
    demand(
      cancelled.status === 'cancelled' && cancelled.id === first.id,
      'Cancellation not applied',
    );
    demand(
      left(store, 'garden') === slotCapacity('garden'),
      'Cancellation did not restore capacity',
    );
    equal(store.cancel(first.id), cancelled, 'Repeated cancellation differs');
    equal(store.reserve(request), cancelled, 'Replay resurrected cancelled reservation');
    const reopened = factory(file);
    equal(reopened.reserve(request), cancelled, 'Replay after reopen resurrected reservation');
    demand(
      left(reopened, 'garden') === slotCapacity('garden'),
      'Cancellation replay consumed capacity',
    );
    demand(reopened.listReservations().length === 1, 'Cancellation replay duplicated reservation');
  });
  evaluate('durability', (store, file) => {
    store.reserve({ slotId: 'welcome', requestId: 'durable-active', seats: 1 });
    const other = store.reserve({ slotId: 'garden', requestId: 'durable-cancel', seats: 1 });
    store.cancel(other.id);
    const before = snapshot(store);
    equal(snapshot(factory(file)), before, 'State was not preserved after reopen');
    equal(snapshot(factory(file)), before, 'Second reopen changed state');
  });
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

// Technical failures above never produce valid semantic evidence.
process.stdout.write(`${JSON.stringify({ format: 1, check: checkId, verdicts })}\n`);
process.exitCode = Object.values(verdicts).every((verdict) => verdict === 'passed') ? 0 : 1;
