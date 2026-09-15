import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { withGuardStore } from '../dist/guard-store.js';
import { digest } from '../dist/records.js';

test('maximum admitted attempt notes remain readable after atomic persistence', (t) => {
  const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'guard-store-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'repo');
  fs.mkdirSync(root);
  const session = path.join(parent, 'session');
  const note = 'A' + '\u0001'.repeat(8191); // Worst-case six-byte JSON escaping.
  const state = {
    format: 1,
    root,
    missionPath: 'mission.json',
    missionSha256: digest('mission'),
    status: 'active',
    featureState: 'verification-failed',
    pending: false,
    reason: null,
    receipt: null,
    contextSignature: null,
    attempts: Array.from({ length: 100 }, (_, i) => ({
      outcome: 'failed',
      failureSignature: digest(String(i)),
      contextSignature: digest('context'),
      diagnosis: note,
      adjustment: note,
    })),
  };
  withGuardStore(root, session, true, (store) => store.save(state));
  assert.ok(fs.statSync(path.join(session, 'state.json')).size > 1024 * 1024);
  withGuardStore(root, session, false, (store) => assert.deepEqual(store.state, state));
});
