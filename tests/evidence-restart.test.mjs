import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { inspectEvidence, runEvidence } from '../dist/evidence-runtime.js';
import {
  prepareRestartFixture,
  runRestartComparison,
} from '../scripts/evidence-restart-comparison.mjs';

test(
  'the same ordinary and calibrated assertions reject every known queue fault',
  {
    skip: process.platform === 'win32',
  },
  async (t) => {
    const result = await runRestartComparison();
    t.after(() => fs.rmSync(result.workspace, { recursive: true, force: true }));
    assert.deepEqual(result.runnerInvocations, { ordinary: 4, lab: 16 });
    for (const row of result.cases) {
      const healthy = row.candidate === 'healthy';
      assert.equal(row.ordinary.status, healthy ? 0 : 1, row.candidate);
      assert.equal(row.lab.status, healthy ? 'supported' : 'failed', row.candidate);
      assert.deepEqual(row.lab.results.at(-1).verdicts, row.ordinary.verdicts);
    }
    assert.deepEqual(result.cases.at(-1).ordinary.verdicts, {
      idempotency: 'failed',
      finality: 'failed',
    });
  },
);

test(
  'an import crash remains an unavailable check, never a semantic fault detection',
  {
    skip: process.platform === 'win32',
  },
  async (t) => {
    const workspace = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'restart-crash-'));
    t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
    const options = prepareRestartFixture(workspace);
    const root = path.join(workspace, 'healthy');
    fs.writeFileSync(
      path.join(root, 'queue.mjs'),
      "throw new Error('Unexpected dependency crash');\n",
    );
    const ordinary = spawnSync(
      process.execPath,
      [path.join(options.evaluatorRoot, 'restart-check.mjs'), root, 'candidate', 'queue-partial'],
      { encoding: 'utf8', timeout: 15000, maxBuffer: 32768 },
    );
    assert.notEqual(ordinary.status, 0);
    assert.equal(ordinary.stdout, '');
    const plan = inspectEvidence({ ...options, root });
    const lab = await runEvidence({
      ...options,
      root,
      session: path.join(workspace, 'session'),
      permit: plan.permit,
    });
    assert.equal(lab.status, 'halted');
    assert.equal(lab.results.at(-1).status, 'interrupted');
    assert.ok(lab.criteria.every(({ status }) => status === 'interrupted'));
  },
);
