import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { inspectCheckpoint, readCheckpoint } from '../dist/checkpoint.js';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-checkpoint-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const pin = (id, file, content) => {
    fs.writeFileSync(path.join(root, file), content);
    return { id, path: file, sha256: createHash('sha256').update(content).digest('hex') };
  };
  const state = { format: 1, scope: 'Fix the approved parser; no integration.', status: 'active', nextAction: 'Review the approved parser diff.',
    sources: [pin('contract', 'contract.md', 'positive integers'), pin('independent', 'independent.ts', 'export const unrelated = true;')],
    evidence: [
      { ...pin('test', 'test.log', 'parser checks passed'), sourceIds: ['contract'], dependsOn: [], outcome: 'passed' },
      { ...pin('review', 'review.md', 'Reviewed passing parser checks'), sourceIds: ['contract'], dependsOn: ['test'], outcome: 'passed' },
      { ...pin('other', 'other.log', 'independent checks passed'), sourceIds: ['independent'], dependsOn: [], outcome: 'passed' }
    ] };
  return { root, state };
}
const states = report => Object.fromEntries(report.evidence.map(item => [item.id, item.state]));

test('unchanged pins remain ready regardless of timestamps and inspection preserves files', t => {
  const { root, state } = fixture(t);
  const snapshot = () => fs.readdirSync(root).map(name => [name, fs.readFileSync(path.join(root, name), 'hex')]);
  const before = snapshot();
  const old = new Date('2000-01-01');
  for (const file of fs.readdirSync(root)) fs.utimesSync(path.join(root, file), old, old);
  const report = inspectCheckpoint(root, state);
  assert.equal(report.status, 'ready');
  assert.deepEqual(report.findings, []);
  assert.deepEqual(snapshot(), before);
});

test('source changes invalidate dependent evidence but preserve independent results', t => {
  const { root, state } = fixture(t);
  fs.writeFileSync(path.join(root, 'contract.md'), 'bounded positive integers');
  const report = inspectCheckpoint(root, state);
  assert.equal(report.status, 'reverify');
  assert.deepEqual(states(report), { test: 'invalidated', review: 'invalidated', other: 'valid' });
  assert.ok(report.findings.some(item => item.code === 'source-changed'));
});

test('artifact changes and failed prerequisites invalidate downstream evidence in any array order', t => {
  const { root, state } = fixture(t);
  state.evidence.reverse();
  fs.writeFileSync(path.join(root, 'test.log'), 'tests actually failed');
  assert.deepEqual(states(inspectCheckpoint(root, state)), { other: 'valid', review: 'invalidated', test: 'invalidated' });
  fs.writeFileSync(path.join(root, 'test.log'), 'parser checks passed');
  state.evidence.find(item => item.id === 'test').outcome = 'failed';
  assert.deepEqual(states(inspectCheckpoint(root, state)), { other: 'valid', review: 'invalidated', test: 'failed' });
});

test('missing sources, evidence and nonregular files cannot support resumption', t => {
  const { root, state } = fixture(t);
  fs.rmSync(path.join(root, 'contract.md'));
  fs.mkdirSync(path.join(root, 'contract.md'));
  fs.rmSync(path.join(root, 'other.log'));
  const report = inspectCheckpoint(root, state);
  assert.equal(report.status, 'reverify');
  assert.ok(report.findings.some(item => item.code === 'source-unavailable'));
  assert.ok(report.findings.some(item => item.code === 'evidence-unavailable'));
  assert.ok(report.evidence.every(item => item.state === 'invalidated'));
});

test('invalid schema, IDs, dependencies and cycles fail before reading sources', t => {
  const { root, state } = fixture(t);
  const edits = [s => { s.format = 2; }, s => { s.scope = ''; }, s => { s.nextAction = null; },
    s => { s.sources[0].sha256 = 'bad'; }, s => { s.sources.push(s.sources[0]); },
    s => { s.evidence[0].sourceIds = ['unknown']; }, s => { s.evidence[0].dependsOn = ['unknown']; },
    s => { s.evidence[0].dependsOn = ['review']; }, s => { s.evidence[0].sourceIds = []; },
    s => { s.evidence[0].outcome = 'done'; }, s => { s.status = 'invented'; }];
  for (const edit of edits) {
    const input = structuredClone(state); edit(input);
    const report = inspectCheckpoint(root, input);
    assert.equal(report.status, 'invalid');
    assert.equal(report.findings[0].code, 'invalid-checkpoint');
    assert.deepEqual(report.sources, []);
  }
  for (const input of [null, [], 'legacy markdown', { format: 1 }]) assert.equal(inspectCheckpoint(root, input).status, 'invalid');
});

test('portable paths reject traversal, absolute, Windows aliases and control characters', t => {
  const { root, state } = fixture(t);
  for (const file of ['../outside', '/etc/passwd', 'a/../b', './contract.md', 'a//b', 'a\\b', 'C:/file', 'a:stream', 'a\0b', 'a\nb', 'NUL', 'con.txt', 'dir/COM1', 'trailing.', 'space ']) {
    const input = structuredClone(state); input.sources[0].path = file;
    assert.equal(inspectCheckpoint(root, input).status, 'invalid', JSON.stringify(file));
    assert.equal(readCheckpoint(root, file).status, 'invalid', JSON.stringify(file));
  }
});

test('symbolic file, directory, destination and checkpoint paths are refused', t => {
  const { root, state } = fixture(t);
  fs.renameSync(path.join(root, 'contract.md'), path.join(root, 'real-contract.md'));
  fs.symlinkSync('real-contract.md', path.join(root, 'contract.md'));
  assert.equal(inspectCheckpoint(root, state).sources[0].state, 'unavailable');
  fs.mkdirSync(path.join(root, 'real'));
  fs.writeFileSync(path.join(root, 'real', 'contract.md'), 'positive integers');
  fs.symlinkSync('real', path.join(root, 'alias'), 'dir');
  state.sources[0].path = 'alias/contract.md';
  assert.equal(inspectCheckpoint(root, state).sources[0].state, 'unavailable');
  fs.writeFileSync(path.join(root, 'checkpoint.json'), JSON.stringify(state));
  fs.symlinkSync('checkpoint.json', path.join(root, 'linked.json'));
  assert.equal(readCheckpoint(root, 'linked.json').status, 'invalid');
  assert.equal(inspectCheckpoint(path.join(root, 'alias'), state).status, 'invalid');
});

test('completed scope never suggests new work; blocked state persists despite valid evidence', t => {
  const { root, state } = fixture(t);
  state.status = 'complete';
  assert.equal(inspectCheckpoint(root, state).status, 'invalid');
  state.nextAction = null;
  assert.equal(inspectCheckpoint(root, state).status, 'complete');
  fs.writeFileSync(path.join(root, 'contract.md'), 'changed');
  const report = inspectCheckpoint(root, state);
  assert.equal(report.status, 'reverify');
  assert.equal(report.nextAction, null);
  state.status = 'blocked'; state.nextAction = 'Wait for owner to resolve the contract.';
  assert.equal(inspectCheckpoint(root, state).status, 'blocked');
});

test('JSON loading, absent evidence and unrun outcomes are explicit', t => {
  const { root, state } = fixture(t);
  fs.writeFileSync(path.join(root, 'checkpoint.json'), JSON.stringify(state));
  assert.equal(readCheckpoint(root, 'checkpoint.json').status, 'ready');
  fs.writeFileSync(path.join(root, 'checkpoint.json'), '{malformed');
  assert.equal(readCheckpoint(root, 'checkpoint.json').status, 'invalid');
  assert.equal(readCheckpoint(root, 'missing.json').status, 'invalid');
  state.evidence[0].outcome = 'not-run';
  assert.equal(states(inspectCheckpoint(root, state)).test, 'not-run');
  state.evidence = [];
  assert.equal(inspectCheckpoint(root, state).status, 'reverify');
});
