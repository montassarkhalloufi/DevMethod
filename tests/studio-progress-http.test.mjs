import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { startStudio } from '../scripts/studio/server.mjs';
import { queueRequest } from '../scripts/studio/domain.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-progress-http-'));
  let studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) =>
    queueRequest(state, { request: 'Corriger localement' }),
  );
  const job = studio.jobs.claim('host-worker').job;
  const get = () => fetch(studio.runtime().url + '/api/jobs/progress?jobId=' + job.id);
  const post = async (input, headers) => {
    const response = await fetch(studio.runtime().url + '/api/jobs/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? { Authorization: 'Bearer ' + studio.runtime().token }),
      },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  };
  return {
    root,
    job,
    get,
    post,
    studio: () => studio,
    restart: async () => {
      await studio.close();
      studio = await startStudio({ workspace: root, port: 0 });
    },
  };
}

const report = (jobId, eventId = 'read-start') => ({
  jobId,
  eventId,
  event: {
    type: 'action',
    id: 'read',
    kind: 'read',
    label: 'Lire la source',
    path: 'src/main.tsx',
    status: 'running',
  },
});

test('HTTP progress is worker-only, returns persisted snapshots and leaves project CAS unchanged', async (t) => {
  const f = await fixture(t);
  const before = f.studio().store.read();
  const value = report(f.job.id);
  const absent = await (await f.get()).json();
  assert.equal(absent.plan, null);
  assert.deepEqual(absent.actions, []);
  for (const headers of [
    {},
    { Origin: f.studio().runtime().url },
    { Origin: 'https://untrusted.invalid' },
    { Authorization: 'Bearer wrong' },
  ])
    assert.equal((await f.post(value, headers)).status, 403);
  const accepted = await f.post(value);
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.sequence, 1);
  assert.equal(accepted.body.source, 'host');
  assert.equal(accepted.body.worker, 'host-worker');
  assert.equal(accepted.body.actions[0].path, 'src/main.tsx');
  assert.deepEqual(await (await f.get()).json(), accepted.body);
  assert.deepEqual(await f.post(value), accepted);
  const collision = await f.post({ ...value, event: { ...value.event, status: 'completed' } });
  assert.equal(collision.status, 409);
  assert.deepEqual(f.studio().store.read(), before);
  assert.equal(JSON.stringify(accepted.body).includes(f.studio().runtime().token), false);
});

test('HTTP progress rejects unknown fields, invalid paths, oversized bodies and unexpected Host', async (t) => {
  const f = await fixture(t);
  const value = report(f.job.id);
  for (const invalid of [
    { ...value, version: f.studio().store.read().version },
    { ...value, source: 'runner' },
    { ...value, stdout: 'raw output', env: {} },
    { ...value, event: { ...value.event, path: '../.devmethod/runtime.json' } },
  ])
    assert.equal((await f.post(invalid)).status, 400);
  assert.equal(
    (await f.post({ ...value, event: { ...value.event, label: 'x'.repeat(40000) } })).status,
    400,
  );
  const runtime = f.studio().runtime();
  const wrongHost = await new Promise((resolve, reject) => {
    const request = http.get(
      runtime.url + '/api/jobs/progress?jobId=' + f.job.id,
      { headers: { Host: 'untrusted.invalid' } },
      (response) => {
        response.resume();
        response.once('end', () => resolve(response.statusCode));
      },
    );
    request.once('error', reject);
  });
  assert.equal(wrongHost, 403);
  assert.equal((await fetch(runtime.url + '/api/jobs/progress')).status, 400);
  assert.equal((await fetch(runtime.url + '/api/jobs/progress?jobId=missing')).status, 404);
  assert.equal((await (await f.get()).json()).sequence, 0);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/progress')), false);
});

test('HTTP restart preserves declared work, derives terminal job status and refuses new late events', async (t) => {
  const f = await fixture(t);
  const value = report(f.job.id);
  assert.equal((await f.post(value)).status, 200);
  const file = path.join(f.root, `.devmethod/progress/${f.job.id}.json`);
  const bytes = fs.readFileSync(file, 'utf8');
  await f.restart();
  const read = await (await f.get()).json();
  assert.equal(read.status, 'interrupted');
  assert.equal(read.actions[0].status, 'running');
  assert.equal(read.plan, null);
  assert.deepEqual(await f.post(value), { status: 200, body: read });
  assert.equal((await f.post(report(f.job.id, 'late'))).status, 409);
  assert.equal(fs.readFileSync(file, 'utf8'), bytes);
});

test('HTTP corrupt journal is an explicit error and never silently replaced by an empty snapshot', async (t) => {
  const f = await fixture(t);
  const value = report(f.job.id);
  assert.equal((await f.post(value)).status, 200);
  const file = path.join(f.root, `.devmethod/progress/${f.job.id}.json`);
  fs.writeFileSync(file, '{broken');
  const response = await f.get();
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /aucun remplacement/);
  assert.equal((await f.post(report(f.job.id, 'new'))).status, 400);
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
});
