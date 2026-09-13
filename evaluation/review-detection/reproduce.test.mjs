import test from 'node:test';
import assert from 'node:assert/strict';
import { connectAccount } from './fixtures/sensitive.mjs';
import { submit } from './fixtures/submission.mjs';
import { orderResponse } from './fixtures/compatibility.mjs';
import { invoiceTotal, existingOrder } from './fixtures/consumer.mjs';
import { normalizeLabel } from './fixtures/control.mjs';

test('LEAK: application outputs expose synthetic values before any report masking', async () => {
  const token = 'SYNTHETIC-ONLY-TOKEN', email = 'fixture@example.invalid';
  const logs = [], telemetry = [];
  const result = await connectAccount({ token, email }, async () => { throw new Error(`Provider rejected ${token}`); }, {
    log: x => logs.push(x), telemetry: x => telemetry.push(x),
  });
  for (const sink of [logs, telemetry, result.body]) {
    assert.ok(JSON.stringify(sink).includes(token));
    assert.ok(JSON.stringify(sink).includes(email));
  }
  assert.ok(result.body.message.includes(token));
});
test('RACE: controlled double submission duplicates the external effect', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  let charges = 0; const state = new Map();
  const charge = async () => { charges++; await gate; return 'receipt'; };
  const first = submit('same', state, charge, async () => {});
  const second = submit('same', state, charge, async () => {});
  release(); await Promise.all([first, second]);
  assert.equal(charges, 2);
});
test('PARTIAL: retry after notification failure duplicates a successful charge', async () => {
  const state = new Map(); let charges = 0;
  const charge = async () => `receipt-${++charges}`;
  await assert.rejects(submit('same', state, charge, async () => { throw new Error('interrupted'); }));
  assert.equal(state.has('same'), false);
  await submit('same', state, charge, async () => {});
  assert.equal(charges, 2);
});
test('TIMEOUT: applied external effect can survive a timeout and be retried', async () => {
  const state = new Map(); let effects = 0;
  const charge = async () => { effects++; if (effects === 1) throw new Error('timeout after commit'); return 'receipt'; };
  await assert.rejects(submit('same', state, charge, async () => {}));
  await submit('same', state, charge, async () => {});
  assert.equal(effects, 2);
});
test('CONTRACT: existing data and unchanged consumer break outside the diff', () => {
  const response = orderResponse(existingOrder);
  assert.equal(response.totalCents, undefined);
  assert.ok(Number.isNaN(invoiceTotal(response)));
});
test('CONTROL: accepted simple implementation meets its contract without extra layers', () => {
  assert.equal(normalizeLabel(' ready '), 'ready');
  assert.throws(() => normalizeLabel(null), TypeError);
});
