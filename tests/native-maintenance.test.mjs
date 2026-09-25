import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  terminalNativeResponse,
  assertMaintenanceInput,
  retainMaintenanceOutput,
  maintenanceReady,
  maintenanceReadProfile,
  maintenanceConfigPreflight,
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

test(
  'outer read isolation permits canonical worker paths without exposing protected data',
  { skip: process.platform !== 'darwin' },
  (t) => {
    const temporaryRoot = temporary(t);
    const root = path.join(temporaryRoot, 'campaign');
    const directory = path.join(root, 'workers/readiness');
    const sibling = path.join(root, 'workers/sibling');
    const fixture = path.join(temporaryRoot, 'fixture');
    for (const folder of [directory, sibling, fixture]) fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(directory, 'task.txt'), 'visible fictional task');
    const protectedFiles = [
      path.join(root, 'frozen.json'),
      path.join(sibling, 'task.txt'),
      path.join(fixture, 'manifest.json'),
    ];
    for (const file of protectedFiles) fs.writeFileSync(file, 'private fictional input');
    protectedFiles.push(fileURLToPath(new URL('../package.json', import.meta.url)));
    const code = `
      const fs = require('node:fs'), assert = require('node:assert/strict');
      assert.equal(fs.realpathSync(process.cwd()), ${JSON.stringify(directory)});
      assert.equal(fs.readFileSync('task.txt', 'utf8'), 'visible fictional task');
      for (const file of ${JSON.stringify(protectedFiles)}) {
        assert.throws(() => fs.readFileSync(file), { code: 'EPERM' });
        assert.throws(() => fs.statSync(file), { code: 'EPERM' });
      }
      assert.throws(() => fs.readdirSync(${JSON.stringify(root)}), { code: 'EPERM' });
      assert.throws(() => fs.readdirSync(${JSON.stringify(path.dirname(directory))}), { code: 'EPERM' });
    `;
    const result = spawnSync(
      '/usr/bin/sandbox-exec',
      ['-p', maintenanceReadProfile(root, directory, fixture), process.execPath, '-e', code],
      { cwd: directory, encoding: 'utf8', timeout: 5000, maxBuffer: 65536 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
  },
);

test(
  'startup preflight checks the second sandbox before any Codex process',
  { skip: process.platform !== 'darwin' },
  (t) => {
    const root = temporary(t);
    const directory = path.join(root, 'workers/readiness');
    const fixture = path.join(root, 'evaluator');
    fs.mkdirSync(directory, { recursive: true });
    fs.mkdirSync(fixture);
    // Local stub only: the regression must never invoke a model or authentication.
    const marker = path.join(directory, 'codex-was-invoked');
    fs.writeFileSync(
      path.join(directory, 'codex'),
      "#!/bin/sh\n: > codex-was-invoked\nprintf '%s\\n' 'invalid type: string \"devmethod-preflight-invalid\", expected a boolean' 'in `allow_login_shell`' >&2\nexit 1\n",
      { mode: 0o700 },
    );
    const profile = maintenanceReadProfile(root, directory, fixture);
    const nested = spawnSync(
      '/usr/bin/sandbox-exec',
      [
        '-p',
        profile,
        '/usr/bin/sandbox-exec',
        '-p',
        '(version 1) (allow default)',
        '/usr/bin/true',
      ],
      { cwd: directory, encoding: 'utf8', timeout: 5000, maxBuffer: 65536 },
    );
    assert.ifError(nested.error);
    const previous = process.env.PATH;
    process.env.PATH = `${directory}${path.delimiter}${previous}`;
    try {
      if (nested.status !== 0) {
        assert.throws(
          () => maintenanceConfigPreflight(profile, directory, []),
          /Nested tool sandbox unavailable before admission/,
        );
        assert.equal(fs.existsSync(marker), false);
      } else {
        assert.equal(maintenanceConfigPreflight(profile, directory, []).toolSandbox.exit, 0);
      }
    } finally {
      process.env.PATH = previous;
    }
  },
);
