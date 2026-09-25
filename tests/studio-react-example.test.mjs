import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { initializeReactExample } from '../scripts/studio/react-example.mjs';
import { effectiveDelegation } from '../scripts/studio/domain.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'react-example-authority-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return path.join(root, 'copy');
}

test('a React example requires explicit technical delegation before creating any workspace', async (t) => {
  const workspace = fixture(t);
  await assert.rejects(initializeReactExample(workspace), /delegate-technical/);
  assert.equal(fs.existsSync(workspace), false);
  await assert.rejects(
    initializeReactExample(workspace, { delegateTechnical: false }),
    /delegate-technical/,
  );
  assert.equal(fs.existsSync(workspace), false);
  const result = spawnSync(
    process.execPath,
    ['scripts/studio.mjs', 'example-react', '--workspace', workspace],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /delegate-technical/);
  assert.equal(fs.existsSync(workspace), false);
});

test('explicit delegation changes only the new example technical policy and preserves data and history', async (t) => {
  const workspace = fixture(t),
    source = new URL('../examples/studio-ateliers/state/', import.meta.url);
  const originalBytes = fs.readFileSync(new URL('studio.json', source));
  const original = JSON.parse(originalBytes),
    policy = effectiveDelegation(original);
  assert.ok((await initializeReactExample(workspace, { delegateTechnical: true })) > 0);
  const state = JSON.parse(fs.readFileSync(path.join(workspace, '.devmethod/studio.json')));
  assert.equal(state.project.mode, original.project.mode);
  assert.deepEqual(state.project.delegation, { ...policy, structure: 'agent' });
  assert.deepEqual(state.revisions.slice(0, original.revisions.length), original.revisions);
  assert.deepEqual(state.checks.slice(0, original.checks.length), original.checks);
  assert.deepEqual(state.designs, original.designs);
  assert.equal(state.selectedDesignId, original.selectedDesignId);
  const historicalUserDecisions = original.decisions.filter((d) => d.source === 'user');
  assert.deepEqual(
    state.decisions.filter((d) => d.source === 'user').map((d) => d.id),
    historicalUserDecisions.map((d) => d.id),
  );
  for (const previous of historicalUserDecisions) {
    const current = state.decisions.find((d) => d.id === previous.id);
    // Adopting a new code version can supersede the old active-version decision.
    assert.deepEqual({ ...current, status: previous.status }, previous);
  }
  assert.deepEqual(
    fs.readFileSync(path.join(workspace, '.devmethod/data.json')),
    fs.readFileSync(new URL('data.json', source)),
  );
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(workspace, '.devmethod/agent.json'))).knownTokens,
    277934,
  );
  assert.deepEqual(fs.readFileSync(new URL('studio.json', source)), originalBytes);
  assert.equal(
    state.project.constraints.includes('HTML/CSS/JS et données JSON persistantes'),
    false,
  );
  assert.ok(state.project.constraints.some((value) => /React 19/.test(value)));
  const revision = state.revisions.at(-1);
  assert.equal(revision.compilation.profile, 'react-ts');
  assert.ok(
    state.decisions.some(
      (d) =>
        d.topic === 'architecture' &&
        d.status === 'active' &&
        d.source === 'agent' &&
        /React 19/.test(d.choice),
    ),
  );
  assert.equal(
    fs.existsSync(path.join(workspace, 'revisions', revision.id, 'compiled', 'index.html')),
    true,
  );
  await assert.rejects(initializeReactExample(workspace, { delegateTechnical: true }), /vide/);
});

test('technical delegation flag is rejected outside the example command', (t) => {
  const workspace = fixture(t);
  const result = spawnSync(
    process.execPath,
    ['scripts/studio.mjs', 'serve', '--workspace', workspace, '--delegate-technical'],
    { encoding: 'utf8', timeout: 3000 },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /example-react/);
  assert.equal(fs.existsSync(workspace), false);
});
