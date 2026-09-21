import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';

async function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dm-connectors-http-')));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) => {
    updateProject(state, {
      name: 'HTTP fixture',
      idea: 'Local fixture',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Fixture locale' });
  });
  const job = studio.jobs.claim('Fixture');
  fs.writeFileSync(path.join(job.workDirectory, 'index.html'), '<h1>Local fixture</h1>');
  const delivered = await studio.jobs.finish({
    jobId: job.job.id,
    title: 'Fixture',
    summary: 'Local files',
  });
  const runtime = studio.runtime();
  const user = { Origin: runtime.url },
    worker = { Authorization: 'Bearer ' + runtime.token };

  async function post(route, input, headers = user) {
    const result = await fetch(runtime.url + '/api/connectors/' + route, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
    return { status: result.status, value: await result.json() };
  }

  return { studio, root, runtime, revisionId: delivered.revision.id, post, user, worker };
}

test('HTTP connector config is same-origin and host reports require worker token', async (t) => {
  const f = await fixture(t);
  const initialChecks = f.studio.store.read().checks.length;
  const initial = await (await fetch(f.runtime.url + '/api/connectors')).json();
  assert.equal(initial.connections.length, 0);
  const input = { id: 'local-node', optionId: 'node-check', purpose: 'diagnostics' };
  assert.equal(
    (await f.post('configure', input, { Origin: 'https://untrusted.invalid' })).status,
    403,
  );
  assert.equal((await f.post('configure', input)).status, 200);
  const probe = {
    connectionId: input.id,
    connectionVersion: 1,
    eventId: 'probe-1',
    status: 'available',
    tool: { name: 'Node', version: process.versions.node },
    capabilities: ['code-quality'],
    observedAt: new Date().toISOString(),
    summary: 'Fixture de transport ; aucun outil externe appelé.',
  };
  assert.equal((await f.post('probe', probe)).status, 403);
  assert.equal((await f.post('results', {})).status, 403);
  assert.equal((await f.post('probe', probe, f.worker)).status, 200);
  const prepared = await f.post('executions', {
    connectionId: input.id,
    revisionId: f.revisionId,
    checkId: 'source-syntax',
  });
  assert.equal(prepared.status, 200);
  assert.equal(prepared.value.revisionId, f.revisionId);
  assert.equal(
    f.studio.store.read().checks.length,
    initialChecks,
    'A connection probe and ticket create no success proof',
  );
  const invalid = await f.post(
    'results',
    { runId: prepared.value.runId, status: 'passed', isError: false },
    f.worker,
  );
  assert.equal(invalid.status, 400);
  assert.equal(f.studio.store.read().checks.length, initialChecks);
});

test('HTTP rejects secret values and prepares application integration without creating a job', async (t) => {
  const f = await fixture(t);
  const option = (
    await (await fetch(f.runtime.url + '/api/connectors')).json()
  ).catalog.options.find((entry) => entry.capabilities.includes('mail'));
  assert.ok(option);
  const config = { id: 'mailer', optionId: option.id, purpose: 'application' };
  assert.equal((await f.post('configure', { ...config, secretRefs: ['raw-secret'] })).status, 400);
  assert.equal(
    (await f.post('configure', { ...config, secretRefs: ['env:MAIL_ACCESS'] })).status,
    200,
  );
  const before = f.studio.store.read();
  const result = await f.post('prepare', {
    connectionId: 'mailer',
    revisionId: f.revisionId,
    capability: 'mail',
  });
  assert.equal(result.status, 200);
  assert.match(result.value.prompt, /Version/);
  assert.match(result.value.prompt, /n’autorise/);
  assert.deepEqual(f.studio.store.read(), before);
  assert.equal(
    (await f.post('configure', { ...config, profileRef: 'x'.repeat(70000) })).status,
    400,
  );
});
