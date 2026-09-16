import assert from 'node:assert/strict';
import { initialRental, rentalActions, executeRental, rentalInvoice, POLICIES } from './domain.mjs';

// Ordinary breadth-first enumeration of legal histories. No candidate engine.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const invoicePair = (state) => Object.fromEntries(POLICIES.map((policy) => [policy, rentalInvoice(state, policy)]));
let layer = [{ state: initialRental(), actions: [] }];
const layers = [];
let witnesses = [];
for (let depth = 0; layer.length; depth += 1) {
  witnesses = layer.filter(({ state }) => {
    const [a, b] = POLICIES.map((policy) => rentalInvoice(state, policy));
    return !same(a, b);
  });
  layers.push({ depth, legalHistories: layer.length, differingHistories: witnesses.length });
  if (witnesses.length) break;
  layer = layer.flatMap(({ state, actions }) => rentalActions(state).map((action) => ({
    state: executeRental(state, action), actions: [...actions, action],
  })));
}
assert.equal(witnesses[0].actions.length, 2);
assert.deepEqual(layers, [
  { depth: 0, legalHistories: 1, differingHistories: 0 },
  { depth: 1, legalHistories: 4, differingHistories: 0 },
  { depth: 2, legalHistories: 16, differingHistories: 3 },
]);
const chosen = witnesses[0].actions;
assert.deepEqual(chosen, [{ kind: 'rent', minutes: 20 }, { kind: 'rent', minutes: 40 }]);
let state = initialRental();
const trace = [{ step: 0, action: null, invoices: invoicePair(state) }];
for (const action of chosen) {
  const before = state;
  const previous = structuredClone(before);
  const snapshot = structuredClone(action);
  state = executeRental(before, action);
  assert.deepEqual(action, snapshot);
  assert.deepEqual(before, previous);
  trace.push({ step: trace.length, action, invoices: invoicePair(state) });
}
assert.equal(trace[2].invoices['per-session'].priceCents, 900);
assert.equal(trace[2].invoices['daily-total'].priceCents, 600);
// Independent integer arithmetic for the chosen history.
assert.equal((Math.ceil(20 / 30) + Math.ceil(40 / 30)) * 300, 900);
assert.equal(Math.ceil((20 + 40) / 30) * 300, 600);
console.log(JSON.stringify({ runtime: process.version, layers, shortestWitnesses: witnesses.map((w) => w.actions), chosen, trace }, null, 2));
