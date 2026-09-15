import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReservations } from './reservations.mjs';
let value = { capacity: 1, confirmed: [] };
let reads = 0;
let releaseReads;
const bothRead = new Promise(resolve => { releaseReads = resolve; });
let releaseSecondSave;
const firstReturned = new Promise(resolve => { releaseSecondSave = resolve; });
const snapshots = [];
const reserve = createReservations({
  async get() {
    const snapshot = structuredClone(value);
    if (++reads === 2) releaseReads();
    await bothRead;
    return snapshot;
  },
  async save(_, next) {
    if (next.confirmed.includes('Fictional Two')) await firstReturned;
    value = structuredClone(next);
    snapshots.push(structuredClone(value));
  }
});
const first = reserve('A', 'Fictional One').then(result => {
  console.log('first returned:', JSON.stringify(result), 'stored:', JSON.stringify(value));
  releaseSecondSave();
  return result;
});
const second = reserve('A', 'Fictional Two');
const results = await Promise.all([first, second]);
console.log(JSON.stringify({results, snapshots, finalState: value}));
test('capacity: concurrent requests confirm at most one reservation', () => {
  assert.equal(results.filter(result => result.status === 'confirmed').length, 1);
});
test('retention: later stale save preserves already confirmed reservation', () => {
  assert.ok(value.confirmed.includes('Fictional One'));
});
