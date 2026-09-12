import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePageSize } from './page-size.mjs';

test('accepts positive safe integers and caps them at 100', () => {
  for (const [input, expected] of [[1, 1], [25, 25], [' 12 ', 12], ['005', 5], [100, 100], [150, 100], ['150', 100]]) {
    assert.equal(parsePageSize(input), expected, String(input));
  }
});

test('invalid inputs return the default 20 without coercing objects', () => {
  for (const input of [undefined, null, '', ' ', 0, -1, 1.5, NaN, Infinity, true, false,
    [], [2], {}, '1.5', '-2', '+2', '1e2', '0x10', 'Infinity', Number.MAX_SAFE_INTEGER + 1,
    { valueOf() { throw new Error('Must not coerce objects'); } }]) {
    assert.equal(parsePageSize(input), 20);
  }
});
