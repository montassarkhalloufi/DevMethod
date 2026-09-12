import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from './total.mjs';
test('adds two amounts', () => assert.equal(total(2, 3), 5));
