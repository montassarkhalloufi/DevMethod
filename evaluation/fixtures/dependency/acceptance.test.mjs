import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagination } from './api.mjs';
test('blocked API remains unchanged', () => assert.equal(pagination, 'undecided'));
