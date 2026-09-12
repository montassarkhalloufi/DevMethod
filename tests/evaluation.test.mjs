import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fixtures, prepare, collect, snapshot } from '../scripts/evaluation.mjs';
function temp(t) { const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'evaluation-')); t.after(() => fs.rmSync(dir, {recursive:true, force:true})); return dir; }
for (const fixture of fixtures) test(`${fixture.id} pinned starting state and objective check`, t => {
  const dir = path.join(temp(t), 'case');
  const record = prepare(fixture.id, dir);
  const report = collect(fixture.id, dir, record.baseline);
  assert.equal(report.check.exit, fixture.baselineExit);
  assert.deepEqual(report.changed, []);
  assert.equal(report.behavioralReview, 'pending');
  assert.throws(() => prepare(fixture.id, dir), /fresh/);
});
test('collector detects altered tests, unrelated writes and deleted files', t => {
  const dir = path.join(temp(t), 'case');
  const record = prepare('B1', dir);
  fs.writeFileSync(path.join(dir, 'acceptance.test.mjs'), 'throw new Error("must not execute")');
  fs.writeFileSync(path.join(dir, 'unrelated'), 'bad');
  fs.unlinkSync(path.join(dir, 'page-size.mjs'));
  const report = collect('B1', dir, record.baseline);
  assert.equal(report.testsIntact, false);
  assert.ok(report.check.skipped);
  assert.deepEqual(report.unauthorizedChanges.sort(), ['acceptance.test.mjs', 'unrelated']);
  assert.throws(() => collect('B1', dir, {}), /pinned/);
});
test('evidence refuses symbolic paths', t => {
  const dir = temp(t);
  fs.symlinkSync(import.meta.filename, path.join(dir, 'link'));
  assert.throws(() => snapshot(dir), /Symbolic/);
});
