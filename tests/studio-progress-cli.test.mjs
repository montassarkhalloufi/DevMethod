import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { startStudio } from '../scripts/studio/server.mjs';
import { queueRequest } from '../scripts/studio/domain.mjs';

const execute = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

async function run(args) {
  try {
    return {
      code: 0,
      ...(await execute(process.execPath, [cli, 'studio', ...args], { timeout: 10000 })),
    };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test('studio progress CLI sends the worker payload, replays idempotently and reports collisions', async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm progress cli-'));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) =>
    queueRequest(state, { request: 'Inspecter le produit' }),
  );
  const claimed = await run(['claim', '--workspace', root, '--worker', 'CLI host']);
  assert.equal(claimed.code, 0, claimed.stderr);
  const claim = JSON.parse(claimed.stdout);
  const file = path.join(root, 'payload.json');
  const payload = {
    jobId: claim.job.id,
    eventId: 'host-plan-1',
    event: {
      type: 'plan',
      title: 'Inspecter puis corriger',
      steps: [{ id: 'inspect', title: 'Lire la règle', status: 'running' }],
    },
  };
  fs.writeFileSync(file, JSON.stringify(payload));
  const before = studio.store.read();
  const args = ['progress', '--workspace', root, '--file', file];
  const first = await run(args);
  assert.equal(first.code, 0, first.stderr);
  const progress = JSON.parse(first.stdout);
  assert.equal(progress.sequence, 1);
  assert.deepEqual(progress.plan, { title: payload.event.title, steps: payload.event.steps });
  assert.deepEqual(JSON.parse((await run(args)).stdout), progress);
  fs.writeFileSync(
    file,
    JSON.stringify({ ...payload, event: { ...payload.event, title: 'Autre plan' } }),
  );
  const collision = await run(args);
  assert.equal(collision.code, 1);
  assert.match(collision.stderr, /autre événement/);
  assert.equal(collision.stdout, '');
  assert.deepEqual(studio.store.read(), before);
  assert.equal(JSON.stringify([first, collision]).includes(studio.runtime().token), false);
  assert.equal(claim.context.progress.endpoint, '/api/jobs/progress');
  assert.deepEqual(claim.context.progress.command, [
    'devmethod',
    'studio',
    'progress',
    '--workspace',
    root,
    '--file',
    'payload.json',
  ]);
  assert.match(claim.context.progress.instructions, /not verification evidence/);
});

test('studio progress help documents the payload command and missing payload fails explicitly', async () => {
  const help = await run(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /progress/);
  assert.match(help.stdout, /--file payload\.json/);
  const missing = await run(['progress', '--workspace', fs.realpathSync(os.tmpdir())]);
  assert.equal(missing.code, 1);
  assert.match(missing.stderr, /progress.*--file/);
});
