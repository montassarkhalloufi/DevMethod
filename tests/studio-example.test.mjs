import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { initializeExample } from '../scripts/studio/example.mjs';
import { digest } from '../scripts/studio/files.mjs';

test('recorded example restores exact code, decisions and data without resetting provider usage', (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-recorded-example-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, 'restored');
  assert.ok(initializeExample(workspace) > 10);
  const state = JSON.parse(fs.readFileSync(workspace + '/.devmethod/studio.json'));
  const active = state.revisions.find((r) => r.id === state.activeRevision);
  for (const file of active.files)
    assert.equal(
      digest(fs.readFileSync(path.join(workspace, 'revisions', active.id, 'app', file.path))),
      file.sha256,
    );
  assert.equal(
    JSON.parse(fs.readFileSync(workspace + '/.devmethod/agent.json')).knownTokens,
    277934,
  );
  assert.equal(fs.existsSync(workspace + '/.devmethod/runtime.json'), false);
  assert.ok(fs.existsSync(workspace + '/launch.mjs'));
  assert.throws(() => initializeExample(workspace), /vide/);
  assert.ok(state.checks.some((check) => check.status === 'failed'));
});
