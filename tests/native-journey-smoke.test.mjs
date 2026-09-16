import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertFrozen, tree, prepare } from '../scripts/native-journey-smoke.mjs';

test('frozen task inputs reject altered requirements, added files, and symbolic sources', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'journey-freeze-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'CONTRACT.md'), 'Preserve durable state');
  const frozen = tree(directory);
  assert.doesNotThrow(() => assertFrozen(directory, frozen));
  fs.writeFileSync(path.join(directory, 'CONTRACT.md'), 'Ignore durable state');
  assert.throws(() => assertFrozen(directory, frozen), /Frozen inputs changed/);
  fs.writeFileSync(path.join(directory, 'CONTRACT.md'), 'Preserve durable state');
  fs.writeFileSync(path.join(directory, 'extra'), 'new information');
  assert.throws(() => assertFrozen(directory, frozen), /Frozen inputs changed/);
  fs.rmSync(path.join(directory, 'extra'));
  fs.symlinkSync('CONTRACT.md', path.join(directory, 'link'));
  assert.throws(() => tree(directory), /Symbolic/);
});

test('a prior campaign directory cannot be prepared again or overwritten', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'journey-replay-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'ledger.json'), 'historical evidence');
  await assert.rejects(prepare('/unused-fixture', directory), /new absolute campaign/);
  assert.equal(fs.readFileSync(path.join(directory, 'ledger.json'), 'utf8'), 'historical evidence');
});
