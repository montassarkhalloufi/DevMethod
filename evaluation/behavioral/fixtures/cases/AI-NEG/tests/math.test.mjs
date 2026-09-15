import test from 'node:test'; import assert from 'node:assert/strict'; import {sum} from '../api/math.mjs'; test('sum adds',()=>assert.equal(sum(3,2),5));
