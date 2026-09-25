import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { openUI } from './ui-probe.mjs';
const directory = path.dirname(fileURLToPath(import.meta.url));
const [caseId, givenRoot] = process.argv.slice(2);
const root = path.resolve(givenRoot);
const criteria = JSON.parse(fs.readFileSync(path.join(directory, 'criteria.json')))[caseId];
if (!criteria) throw new Error('Unknown frozen maintenance case');
const report = { format: 1, case: caseId, verdicts: {}, details: {}, manualReview: criteria.manualReview, processes: 0 };
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function criterion(id, operation) {
  try { await operation(); report.verdicts[id] = 'passed'; }
  catch (error) { report.verdicts[id] = error.code === 'ERR_ASSERTION' ? 'failed' : 'interrupted'; report.details[id] = String(error.stack).slice(0, 2000); }
}
const domain = await import(pathToFileURL(path.join(root, 'src/domain.mjs')));
const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'maintenance-evaluation-'));
function persisted(command, file, id, value) {
  const child = spawnSync(process.execPath, [path.join(directory, 'store-probe.mjs'), root, file, command, id ?? '', value === undefined ? '' : JSON.stringify(value)], { encoding: 'utf8', timeout: 3000, maxBuffer: 16384 });
  report.processes++;
  if (child.error || child.signal) throw new Error(`Persistence probe could not execute: ${child.error?.message ?? child.signal}`);
  assert.equal(child.status, 0, `Expected supported operation to succeed: ${child.stderr}`);
  return JSON.parse(child.stdout);
}
try {
  if (caseId === 'resume-filter') {
    await criterion('restore-choice', async () => {
      for (const choice of ['active', 'completed']) {
        const ui = await openUI(root, { storage: new Map([['pocket-tasks.filter', choice]]) });
        assert.deepEqual(ui.selected(), [choice]); assert.equal(ui.nodes.get('#tasks').children.length, 1);
      }
    });
    await criterion('persist-change', async () => {
      const storage = new Map(); const ui = await openUI(root, { storage }); await ui.clickFilter('completed');
      assert.equal(storage.get('pocket-tasks.filter'), 'completed');
      assert.deepEqual((await openUI(root, { storage })).selected(), ['completed']);
    });
    await criterion('invalid-or-denied-storage', async () => {
      assert.deepEqual((await openUI(root)).selected(), ['all']);
      for (const value of ['', 'deleted', '__proto__']) assert.deepEqual((await openUI(root, { storage: new Map([['pocket-tasks.filter', value]]) })).selected(), ['all']);
      const denied = await openUI(root, { denied: true }); assert.deepEqual(denied.selected(), ['all']); await denied.clickFilter('active'); assert.deepEqual(denied.selected(), ['active']);
    });
    await criterion('preserve-user-edit', () => assert.equal(hash(path.join(root, 'public/styles.css')), criteria.userStylesSha256));
    await criterion('baseline-evidence-still-applies', () => assert.equal(hash(path.join(root, 'src/domain.mjs')), criteria.domainSha256));
  }
  if (caseId === 'title-policy') {
    await criterion('new-title-boundary', () => {
      for (const patch of [false, true]) {
        assert.equal(domain.validateBody({ title: `  ${'x'.repeat(80)}  ` }, patch).title.length, 80);
        for (const title of ['x'.repeat(81), 'x'.repeat(120)]) assert.throws(() => domain.validateBody({ title }, patch), (error) => /80/.test(error.message) && !/120/.test(error.message));
      }
    });
    await criterion('legacy-read-does-not-rewrite', () => {
      const file = path.join(temp, 'legacy-read.json'); const bytes = ' [ {"id":"old","title":"' + 'L'.repeat(120) + '","done":false} ]\n'; fs.writeFileSync(file, bytes);
      assert.equal(persisted('list', file)[0].title.length, 120); assert.equal(fs.readFileSync(file, 'utf8'), bytes);
      assert.throws(() => domain.validateStoredTasks([{ id: 'invalid', title: 'x'.repeat(121), done: false }]));
    });
    await criterion('legacy-completion-survives-process-restart', () => {
      const file = path.join(temp, 'legacy-mark.json'); const old = [{ id: 'old81', title: 'L'.repeat(81), done: false }, { id: 'old120', title: 'Z'.repeat(120), done: true }]; fs.writeFileSync(file, JSON.stringify(old));
      persisted('update', file, 'old81', { done: true }); old[0].done = true; assert.deepEqual(persisted('list', file), old);
      persisted('update', file, 'old120', { done: false }); old[1].done = false; assert.deepEqual(persisted('list', file), old);
    });
    await criterion('both-ui-inputs-follow-new-limit', async () => {
      const ui = await openUI(root, { tasks: [{ id: 'old', title: 'L'.repeat(120), done: false }] });
      assert.equal(ui.nodes.get('#new-title').maxLength, 80); const edit = await ui.edit('old'); assert.equal(edit.maxLength, 80); assert.equal(edit.value.length, 120);
    });
    await criterion('existing-fixture-preserved', () => assert.equal(hash(path.join(root, 'data/tasks.json')), criteria.dataSha256));
  }
  if (caseId === 'trim-boundary') {
    await criterion('trim-before-length', () => {
      assert.equal(domain.title(' '.repeat(150) + 'Keep' + '\t'.repeat(20)), 'Keep');
      assert.equal(domain.title('  ' + 'x'.repeat(120) + '  '), 'x'.repeat(120));
    });
    await criterion('retain-existing-rejections', () => {
      for (const value of [null, 3, false, '', '   ', ' ' + 'x'.repeat(121) + ' ']) assert.throws(() => domain.title(value));
      assert.deepEqual(domain.validateBody({ done: false }, true), { done: false });
    });
    await criterion('normalize-without-changing-boundary', () => {
      assert.equal(domain.title('\t Ordinary task \n'), 'Ordinary task'); assert.equal(domain.title('x'.repeat(120)).length, 120);
    });
  }
  await criterion('preserve-accepted-boundaries', () => {
    for (const [file, expected] of Object.entries(criteria.unchangedFiles)) assert.equal(hash(path.join(root, file)), expected, `${file} is outside this bounded change`);
  });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
report.kind = 'deterministic-domain-and-vm-checks-not-browser-or-native-evidence';
console.log(JSON.stringify(report));
process.exitCode = Object.values(report.verdicts).includes('interrupted') ? 2 : Object.values(report.verdicts).includes('failed') ? 1 : 0;
