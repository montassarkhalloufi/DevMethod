import { test } from 'node:test';
import assert from 'node:assert/strict';
import { label } from './label.mjs';
test('current contract', () => assert.equal(label, 'Ready'));
