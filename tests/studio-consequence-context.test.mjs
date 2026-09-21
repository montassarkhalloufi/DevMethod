import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { digest } from '../scripts/studio/files.mjs';
import { readConsequenceContext } from '../scripts/studio/consequence-context.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'consequences-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.devmethod'));
  const state = {
    version: 1,
    project: { mode: 'delegated', delegation: { adoption: 'agent' } },
    brief: { criteria: [{ id: 'save', text: 'Save a value' }] },
    decisions: [],
    draft: '',
    activeRevision: 'base',
    jobs: [{ id: 'job', baseRevision: 'base', status: 'ready' }],
    revisions: [],
  };
  const store = { root, read: () => structuredClone(state) };
  const writeRevision = (id, sources) => {
    const directory = path.join(root, 'revisions', id, 'app');
    fs.mkdirSync(directory, { recursive: true });
    const files = Object.entries(sources).map(([name, content]) => {
      fs.writeFileSync(path.join(directory, name), content);
      return { path: name, bytes: Buffer.byteLength(content), sha256: digest(content) };
    });
    state.revisions.push({ id, ...(id === 'candidate' ? { jobId: 'job' } : {}), files });
  };
  writeRevision('base', {
    'keep.js': 'localStorage.getItem("fixture");',
    'old.js': 'fetch("/old");',
    'change.js': 'export const value = 1;',
  });
  writeRevision('candidate', {
    'keep.js': 'localStorage.getItem("fixture");',
    'change.js': 'export const value = 2;',
    'new.js': 'fetch("/api/data");',
  });
  const read = (support) => readConsequenceContext(store, state, 'candidate', support);
  return { root, store, state, read };
}

function writeData(root, data = {}, version = 1) {
  fs.writeFileSync(path.join(root, '.devmethod/data.json'), JSON.stringify({ version, data }));
}

test('deterministic verified diff and positive signals retain base persistence without claiming absence', (t) => {
  const { read, state } = fixture(t);
  const result = read();
  assert.equal(result.protocol, 'studio-consequences-v1');
  assert.equal(result.baseRevisionId, 'base');
  assert.deepEqual(result.changes, [
    { path: 'change.js', kind: 'modified' },
    { path: 'new.js', kind: 'added' },
    { path: 'old.js', kind: 'removed' },
  ]);
  assert.ok(
    result.signals.some(
      (item) => item.path === 'keep.js' && item.kind === 'persistent-data' && item.line === 1,
    ),
  );
  assert.ok(
    result.signals.some((item) => item.path === 'old.js' && item.kind === 'contract-changed'),
  );
  assert.ok(
    !result.signals.some((item) => item.path === 'keep.js' && item.kind === 'contract-changed'),
  );
  assert.deepEqual(result.data, { status: 'missing', version: null, nonEmpty: null, bytes: 0 });
  assert.equal(result.issue, null);
  state.revisions.forEach((revision) => revision.files.reverse());
  assert.deepEqual(read().changes, result.changes);
  assert.match(result.limits.join(' '), /absence.*ne prouve/);
});

test('data values bind context without exposing values or sensitive keys', (t) => {
  const { root, read } = fixture(t);
  const absent = read();
  writeData(root);
  const empty = read();
  assert.equal(empty.data.nonEmpty, false);
  writeData(root, { confidential_key: 'SECRET_VALUE' });
  const populated = read();
  assert.equal(populated.data.nonEmpty, true);
  assert.equal(populated.data.version, 1);
  assert.notEqual(populated.contextFingerprint, empty.contextFingerprint);
  assert.notEqual(empty.contextFingerprint, absent.contextFingerprint);
  assert.doesNotMatch(JSON.stringify(populated), /SECRET_VALUE|confidential_key/);
  writeData(root, { confidential_key: 'OTHER__VALUE' });
  assert.notEqual(read().contextFingerprint, populated.contextFingerprint);
});

for (const target of ['candidate', 'base'])
  test(`altered ${target} sources invalidate the context without unchecked signals`, (t) => {
    const { root, read } = fixture(t),
      before = read();
    fs.writeFileSync(
      path.join(root, 'revisions', target, 'app/change.js'),
      'indexedDB.open("tampered");',
    );
    const after = read();
    assert.ok(after.issue);
    assert.notEqual(after.contextFingerprint, before.contextFingerprint);
    assert.ok(
      !after.signals.some((item) => item.path === 'change.js' && item.kind === 'persistent-data'),
    );
  });

test('criteria, evidence freshness, tool receipts and local configuration independently invalidate context', (t) => {
  const { root, state, read } = fixture(t),
    original = read().contextFingerprint;
  state.brief.criteria[0].text = 'Different obligation';
  assert.notEqual(read().contextFingerprint, original);
  state.brief.criteria[0].text = 'Save a value';
  assert.notEqual(
    read({ evidence: [{ id: 'receipt', freshness: 'current' }] }).contextFingerprint,
    read({ evidence: [{ id: 'receipt', freshness: 'reevaluate' }] }).contextFingerprint,
  );
  assert.notEqual(read({ tools: { pending: ['action'] } }).contextFingerprint, original);
  fs.writeFileSync(
    path.join(root, '.devmethod/browser.json'),
    JSON.stringify({ schemaVersion: 1, version: 1, enabled: false, channel: 'chrome' }),
  );
  assert.notEqual(read().contextFingerprint, original);
  fs.writeFileSync(path.join(root, '.devmethod/connectors.json'), '{broken');
  assert.match(read().issue, /Configuration/);
});

test('draft, adoption and review decisions do not self-invalidate; other active revisions and delegation do', (t) => {
  const { read, state } = fixture(t),
    original = read().contextFingerprint;
  state.version++;
  state.draft = 'Next request';
  state.decisions.push({
    review: { note: 'Adoption' },
    intervention: { note: 'Local assessment' },
  });
  state.activeRevision = 'candidate';
  assert.equal(read().contextFingerprint, original);
  state.activeRevision = 'other';
  assert.notEqual(read().contextFingerprint, original);
  state.activeRevision = 'base';
  state.project.delegation.adoption = 'user';
  assert.notEqual(read().contextFingerprint, original);
});

test('copying identical files to another workspace cannot transfer the context', (t) => {
  const { root, store, state, read } = fixture(t);
  const copied = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'consequences-copy-'));
  t.after(() => fs.rmSync(copied, { recursive: true, force: true }));
  fs.cpSync(root, copied, { recursive: true });
  assert.notEqual(
    readConsequenceContext({ ...store, root: copied }, state, 'candidate').contextFingerprint,
    read().contextFingerprint,
  );
});

test('malformed, oversized and linked data fail closed without modifying state or disk', (t) => {
  const { root, read, state } = fixture(t),
    before = structuredClone(state);
  const file = path.join(root, '.devmethod/data.json');
  for (const contents of [
    '{',
    JSON.stringify({ version: 0, data: {} }),
    JSON.stringify({ version: 1, data: [] }),
    ' '.repeat(8 * 1024 * 1024 + 1),
  ]) {
    fs.writeFileSync(file, contents);
    const result = read();
    assert.equal(result.data.status, 'unavailable');
    assert.equal(result.data.nonEmpty, null);
    assert.ok(result.issue);
    assert.equal(fs.readFileSync(file, 'utf8'), contents);
  }
  fs.unlinkSync(file);
  fs.symlinkSync(path.join(root, 'revisions/base/app/keep.js'), file);
  assert.equal(read().data.status, 'unavailable');
  assert.ok(fs.lstatSync(file).isSymbolicLink());
  assert.deepEqual(state, before);
});

test('source-only and absent bases remain explicit unknowns, with bounded signals', (t) => {
  const { root, state, read } = fixture(t);
  state.revisions.find((item) => item.id === 'candidate').profile = 'source-only';
  const revision = state.revisions.find((item) => item.id === 'candidate');
  const content = Array.from({ length: 250 }, () => 'localStorage.clear();').join('\n');
  fs.writeFileSync(path.join(root, 'revisions/candidate/app/change.js'), content);
  Object.assign(
    revision.files.find((item) => item.path === 'change.js'),
    { bytes: Buffer.byteLength(content), sha256: digest(content) },
  );
  assert.equal(read().signals.length, 200);
  assert.match(read().limits.join(' '), /tronquée/);
  assert.match(read().issue, /tronquée/);
  state.jobs[0].baseRevision = 'missing-base';
  assert.ok(read().issue);
  assert.equal(read().baseFingerprint, null);
});

test('architecture and selected design bind the context without including unrelated decisions', (t) => {
  const { state, read } = fixture(t),
    original = read().contextFingerprint;
  state.selectedDesignId = 'design';
  assert.notEqual(read().contextFingerprint, original);
  delete state.selectedDesignId;
  state.decisions.push({
    status: 'active',
    topic: 'Architecture',
    choice: 'Local storage',
    reason: 'Bounded scope',
    source: 'user',
  });
  assert.notEqual(read().contextFingerprint, original);
  state.decisions[0].status = 'superseded';
  assert.equal(read().contextFingerprint, original);
});
