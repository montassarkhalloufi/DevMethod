import test from 'node:test';
import assert from 'node:assert/strict';
import { createStock } from '../src/stock.mjs';

test('a request may consume the last available units', () => {
  const stock = createStock(3);
  assert.equal(stock.take(3), 0);
  assert.equal(stock.available(), 0);
  assert.throws(() => stock.take(1), /INSUFFICIENT_STOCK/);
  assert.equal(stock.available(), 0);
});

test('rejected requests preserve stock', () => {
  const stock = createStock(3);
  for (const amount of [0, -1, 0.5, NaN, 4]) {
    assert.throws(() => stock.take(amount));
    assert.equal(stock.available(), 3);
  }
  assert.equal(stock.take(2), 1);
});
