import test from 'node:test';
import assert from 'node:assert/strict';
import { ledger, currentLoan, addObject, lendObject, returnObject } from './app/model.mjs';
const now = '2026-09-16T15:15:00.000Z';

test('empty object is initialized in memory; unknown populated formats are rejected', () => {
  assert.deepEqual(ledger({}), { format: 'loan-ledger-v1', objects: [], loans: [] });
  for (const value of [null, [], { legacy: ['keep'] }]) assert.throws(() => ledger(value));
});

test('same labels remain independent through loans and returns', () => {
  const data = ledger({});
  addObject(data, { id: 'one', label: 'Perceuse', number: 'OUT-1' }, now);
  addObject(data, { id: 'two', label: 'Perceuse', number: 'OUT-2' }, now);
  lendObject(data, { id: 'loan1', objectId: 'one', borrower: 'Lina' }, now);
  lendObject(data, { id: 'loan2', objectId: 'two', borrower: 'Noé' }, now);
  returnObject(data, { loanId: 'loan1' }, '2026-09-16T15:16:00.000Z');
  assert.equal(currentLoan(data, 'one'), undefined);
  assert.equal(currentLoan(data, 'two').borrower, 'Noé');
  assert.equal(data.loans.length, 2);
  assert.equal(data.loans[0].returnedAt, '2026-09-16T15:16:00.000Z');
  assert.deepEqual(ledger(data), data);
});

test('duplicate numbers and simultaneous double loans are refused', () => {
  const data = ledger({});
  addObject(data, { id: 'one', label: 'Perceuse', number: 'OUT-1' }, now);
  assert.throws(() => addObject(data, { id: 'two', label: 'Other', number: 'out-1' }, now), /numéro existe/);
  lendObject(data, { id: 'loan1', objectId: 'one', borrower: 'Lina' }, now);
  assert.throws(() => lendObject(data, { id: 'loan2', objectId: 'one', borrower: 'Noé' }, now), /déjà en prêt/);
  assert.equal(data.objects.length, 1);
  assert.equal(data.loans.length, 1);
});

test('return preserves completed history and permits a subsequent loan', () => {
  const data = ledger({});
  addObject(data, { id: 'one', label: 'Table', number: 'T-1' }, now);
  lendObject(data, { id: 'loan1', objectId: 'one', borrower: 'Lina' }, now);
  returnObject(data, { loanId: 'loan1' }, now);
  assert.throws(() => returnObject(data, { loanId: 'loan1' }, now), /déjà terminé/);
  lendObject(data, { id: 'loan2', objectId: 'one', borrower: 'Noé' }, now);
  assert.equal(currentLoan(data, 'one').id, 'loan2');
  assert.equal(data.loans.length, 2);
});
