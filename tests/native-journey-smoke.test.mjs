import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertFrozen,
  tree,
  prepare,
  journeyAcceptance,
  journeyUsage,
  journeyProtectedInputs,
  protectedChanges,
  journeySlots,
} from '../scripts/native-journey-smoke.mjs';

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

test('fresh-state success cannot certify missing, failed, or operator-assisted continuity', () => {
  const baseline = { phase: 'maintenance', verification: { exit: 0 }, changed: [] };
  for (const continuity of [
    null,
    { exit: 1, stdout: '{"outcome":"passed"}' },
    { exit: 0, stdout: '{"outcome":"failed"}' },
    { exit: 0, stdout: '{"outcome":"assisted"}' },
    { exit: 0, stdout: 'invalid' },
  ]) {
    assert.equal(journeyAcceptance({ ...baseline, continuity }), false);
  }
  assert.equal(
    journeyAcceptance({ ...baseline, continuity: { exit: 0, stdout: '{"outcome":"passed"}' } }),
    true,
  );
  assert.equal(journeyAcceptance({ ...baseline, phase: 'initial', continuity: null }), true);
});

test('missing native usage remains unknown even when other turns have measured usage', () => {
  const measured = { usage: { inputTokens: 17, outputTokens: 3 } };
  assert.deepEqual(journeyUsage([measured]), { observedTokensLowerBound: 20, totalTokens: 20 });
  assert.deepEqual(journeyUsage([measured, { usage: null }]), {
    observedTokensLowerBound: 20,
    totalTokens: null,
  });
  assert.deepEqual(journeyUsage([{ usage: null }]), {
    observedTokensLowerBound: 0,
    totalTokens: null,
  });
});

test('maintenance cannot rewrite the operator witness to certify changed saved data', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'journey-witness-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'operator-setup.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      origin: 'created-through-initial-implementation',
      expected: { jobs: [{ id: 'old-job', status: 'done' }] },
    }),
  );
  const expected = journeyProtectedInputs(directory, {}, true);
  assert.deepEqual(protectedChanges(directory, expected), []);
  fs.writeFileSync(
    file,
    JSON.stringify({ origin: 'created-through-initial-implementation', expected: { jobs: [] } }),
  );
  const changed = protectedChanges(directory, expected);
  assert.deepEqual(changed, ['operator-setup.json']);
  assert.equal(
    journeyAcceptance({
      phase: 'maintenance',
      verification: { exit: 0 },
      continuity: { exit: 0, stdout: '{"outcome":"passed"}' },
      changed,
    }),
    false,
  );
});

test('an admitted native slot with a collection failure is unresolved, never not-run', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'journey-collection-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'ledger'));
  fs.mkdirSync(path.join(directory, 'private'));
  fs.writeFileSync(
    path.join(directory, 'ledger/A-initial.json'),
    '{"status":"running","usage":null}',
  );
  fs.writeFileSync(path.join(directory, 'private/A-initial-dispatch.json'), '{}');
  const summary = journeySlots(directory, [{ id: 'A-initial' }, { id: 'B-initial' }], []);
  assert.deepEqual(summary.notRun, ['B-initial']);
  assert.deepEqual(summary.unresolved, [
    { id: 'A-initial', status: 'unresolved', dispatchAttempted: true, usage: null },
  ]);
});
