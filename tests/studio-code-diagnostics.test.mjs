import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localMarkers,
  SERVER_DIAGNOSTIC_OWNER,
} from '../studio-ui/src/features/code/model/diagnostics.ts';

test('server verification errors remain excluded from local syntax counts, including when mixed with worker diagnostics', () => {
  const server = {
    owner: SERVER_DIAGNOSTIC_OWNER,
    message: 'Type string is not assignable to number',
  };
  const syntax = { owner: 'typescript', message: 'Expression expected' };
  const json = { owner: 'json', message: 'Property expected' };
  const snapshot = [server, syntax, json];
  assert.deepEqual(localMarkers([server]), []);
  assert.deepEqual(localMarkers(snapshot), [syntax, json]);
  assert.deepEqual(snapshot, [server, syntax, json]);
});
