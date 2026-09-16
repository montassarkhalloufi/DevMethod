import test from 'node:test';
import assert from 'node:assert/strict';
import { findWitness } from '../scripts/discovery/search.mjs';
import { rentalMachine } from '../scripts/discovery/transfer/machine.mjs';
import {
  initialRental,
  rentalActions,
  executeRental,
  rentalInvoice,
} from '../scripts/discovery/transfer/domain.mjs';

// Separate arithmetic oracle: no domain execution, adapter, key or engine calls.
function directInvoices(actions) {
  const rentals = actions.filter((action) => action.kind === 'rent');
  const elapsedMinutes = actions.reduce((sum, action) => sum + action.minutes, 0);
  const usedMinutes = rentals.reduce((sum, action) => sum + action.minutes, 0);
  const sessionUnits = rentals.reduce(
    (sum, action) => sum + Math.trunc((action.minutes + 29) / 30),
    0,
  );
  const totalUnits = Math.trunc((usedMinutes + 29) / 30);
  return [sessionUnits, totalUnits].map((units) => ({
    elapsedMinutes,
    usedMinutes,
    chargedMinutes: units * 30,
    priceCents: units * 300,
  }));
}

function sequences(length, prefix = []) {
  if (prefix.length === length) return [prefix];
  const alphabet = [
    { kind: 'rent', minutes: 20 },
    { kind: 'rent', minutes: 40 },
    { kind: 'rent', minutes: 60 },
    { kind: 'pause', minutes: 20 },
  ];
  const elapsed = prefix.reduce((sum, action) => sum + action.minutes, 0);
  return alphabet
    .filter((action) => elapsed + action.minutes <= 120)
    .flatMap((action) => sequences(length, [...prefix, action]));
}

test('rental arithmetic handles fragmentation, free pauses and the exact closing boundary', () => {
  const initial = initialRental();
  const one = executeRental(initial, { kind: 'rent', minutes: 20 });
  assert.deepEqual(initial, { elapsedMinutes: 0, usedMinutes: 0, sessionUnits: 0 });
  assert.equal(rentalInvoice(one, 'per-session').priceCents, 300);
  assert.equal(rentalInvoice(one, 'daily-total').priceCents, 300);
  const paused = executeRental(one, { kind: 'pause', minutes: 20 });
  assert.equal(rentalInvoice(paused, 'daily-total').priceCents, 300);
  const fragmented = executeRental(paused, { kind: 'rent', minutes: 40 });
  assert.equal(rentalInvoice(fragmented, 'per-session').priceCents, 900);
  assert.equal(rentalInvoice(fragmented, 'daily-total').priceCents, 600);
  const closed = executeRental(fragmented, { kind: 'rent', minutes: 40 });
  assert.equal(closed.elapsedMinutes, 120);
  assert.deepEqual(rentalActions(closed), []);
  assert.throws(() => executeRental(closed, { kind: 'pause', minutes: 20 }), /two-hour/);
  assert.throws(() => executeRental(one, { kind: 'rent', minutes: 25 }), /available/);
});

test('frozen engine finds a replayable shortest rental witness, independently enumerated', () => {
  const result = findWitness(rentalMachine());
  assert.equal(result.status, 'witness');
  assert.equal(result.trace.length, 2);
  let state = initialRental();
  const prefix = [];
  for (const item of result.trace) {
    assert.ok(
      rentalActions(state).some((action) => JSON.stringify(action) === JSON.stringify(item.action)),
    );
    prefix.push(item.action);
    state = executeRental(state, item.action);
    const oracle = directInvoices(prefix);
    assert.deepEqual(
      item.observations.map((item) => item.value),
      oracle,
    );
    assert.deepEqual(rentalInvoice(state, 'per-session'), oracle[0]);
    assert.deepEqual(rentalInvoice(state, 'daily-total'), oracle[1]);
  }
  for (let depth = 0; depth < result.trace.length; depth += 1)
    for (const actions of sequences(depth)) {
      const [first, second] = directInvoices(actions);
      assert.deepEqual(first, second);
    }
  const differentAtDepthTwo = sequences(2).filter((actions) => {
    const [first, second] = directInvoices(actions);
    return first.priceCents !== second.priceCents;
  });
  assert.ok(differentAtDepthTwo.length > 0);
  const [first, second] = directInvoices(prefix);
  assert.notDeepEqual(first, second);
});

test('short rental search remains bounded and identical policies exhaust the finite window', () => {
  const short = findWitness(rentalMachine(), { maxDepth: 1 });
  assert.equal(short.status, 'bounded');
  assert.equal(short.reason, 'maxDepth');
  assert.deepEqual(short.trace, []);
  const equivalent = findWitness(rentalMachine(['daily-total', 'daily-total']), { maxDepth: 6 });
  assert.equal(equivalent.status, 'exhausted');
  assert.deepEqual(equivalent.trace, []);
  // Exhaustively check the arithmetic domain against the oracle for all legal
  // sequences, without using the adapter's state abstraction or search traversal.
  for (let depth = 0; depth <= 6; depth += 1)
    for (const actions of sequences(depth)) {
      const state = actions.reduce(executeRental, initialRental());
      const oracle = directInvoices(actions);
      assert.deepEqual(rentalInvoice(state, 'per-session'), oracle[0]);
      assert.deepEqual(rentalInvoice(state, 'daily-total'), oracle[1]);
    }
});
