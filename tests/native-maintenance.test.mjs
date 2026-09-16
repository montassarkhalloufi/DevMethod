import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  terminalNativeResponse,
  assertMaintenanceInput,
  retainMaintenanceOutput,
  maintenanceReady,
} from '../scripts/native-maintenance.mjs';
import { tree } from '../scripts/native-journey-smoke.mjs';
import { gitState } from '../dist/records.js';
import { reserveRun } from '../scripts/native-host.mjs';

const complete = { type: 'turn.completed', usage: { input_tokens: 12, output_tokens: 4 } };
const message = {
  type: 'item.completed',
  item: { type: 'agent_message', text: 'Starting checks.' },
};
const command = { type: 'item.completed', item: { type: 'command_execution', exit_code: 0 } };

function temporary(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'maintenance-regression-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('a commentary message followed by work is not a terminal native response', () => {
  assert.equal(terminalNativeResponse([message, command, complete]), false);
  assert.equal(terminalNativeResponse([message, command]), false);
  assert.equal(
    terminalNativeResponse([
      command,
      { ...message, item: { type: 'agent_message', text: '' } },
      complete,
    ]),
    false,
  );
  assert.equal(terminalNativeResponse([command, message, complete]), true);
});

test('collection failure preserves already observed native accounting and blocks readiness', (t) => {
  const root = temporary(t);
  fs.mkdirSync(path.join(root, 'private'));
  const slot = reserveRun(path.join(root, 'ledger'), 'readiness');
  fs.writeFileSync(path.join(root, 'private/readiness.jsonl'), 'preserve prior bytes');
  const captured = retainMaintenanceOutput(root, 'readiness', slot, {
    status: 'exited',
    exit: 0,
    elapsedSeconds: 1,
    stdout: JSON.stringify(complete) + '\n',
    stderr: '',
  });
  const ledger = JSON.parse(fs.readFileSync(slot));
  assert.equal(ledger.status, 'exited');
  assert.equal(ledger.usage.inputTokens, 12);
  assert.equal(ledger.usage.outputTokens, 4);
  assert.equal(
    fs.readFileSync(path.join(root, 'private/readiness.jsonl'), 'utf8'),
    'preserve prior bytes',
  );
  assert.equal(captured.collectionErrors.length, 1);
  assert.equal(
    maintenanceReady({
      ...ledger,
      finalResponse: true,
      protectedChanges: [],
      readinessPassed: true,
      collectionErrors: captured.collectionErrors,
    }),
    false,
  );
});

test('staging unchanged working bytes invalidates frozen resumption attribution', (t) => {
  const root = temporary(t);
  const git = (args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git(['init', '-q']);
  fs.writeFileSync(path.join(root, 'task.txt'), 'original');
  git(['add', '.']);
  git([
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '-qm',
    'baseline',
  ]);
  fs.writeFileSync(path.join(root, 'task.txt'), 'partial work');
  const entry = { directory: root, initial: tree(root), initialGit: gitState(root) };
  assert.doesNotThrow(() => assertMaintenanceInput(entry));
  git(['add', 'task.txt']);
  assert.deepEqual(tree(root), entry.initial);
  assert.throws(() => assertMaintenanceInput(entry), /Git attribution changed/);
});
