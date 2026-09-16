import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const serverModule = new URL('../scripts/atelier/server.mjs', import.meta.url).href;
const projectFile = new URL('../scripts/atelier/gazette.json', import.meta.url).href;

async function start(workspace) {
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import fs from 'node:fs';
       import { createAtelierServer } from ${JSON.stringify(serverModule)};
       const project = JSON.parse(fs.readFileSync(new URL(${JSON.stringify(projectFile)}), 'utf8'));
       const server = createAtelierServer({ workspace: process.argv[1], project });
       server.listen(0, '127.0.0.1', () => process.send(server.address().port));
       process.on('SIGTERM', () => server.close(() => process.exit(0)));`,
      workspace,
    ],
    { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] },
  );
  let errors = '';
  child.stderr.on('data', (chunk) => (errors += chunk));
  const [port] = await Promise.race([
    once(child, 'message'),
    once(child, 'exit').then(([code]) => {
      throw new Error(`Atelier exited before listening (${code}): ${errors}`);
    }),
  ]);
  const url = 'http://127.0.0.1:' + port;
  const get = async (route = 'session') => {
    const response = await fetch(url + '/api/' + route);
    assert.equal(response.status, 200);
    return response.json();
  };
  const post = async (route, input) => {
    const response = await fetch(url + '/api/' + route, {
      method: 'POST',
      headers: { Origin: url, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: (await get()).storageVersion, ...input }),
    });
    const value = await response.json();
    assert.equal(response.status, 200, JSON.stringify(value));
    return value;
  };
  const close = async () => {
    if (child.exitCode !== null) return;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    assert.deepEqual(await exited, [0, null]);
  };
  return { get, post, close, pid: child.pid };
}

test('prepared handoff preserves historical context and shared scenario through separate-process restart', async (t) => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-handoff-'));
  let api;
  t.after(async () => {
    await api?.close();
    fs.rmSync(workspace, { recursive: true, force: true });
  });
  api = await start(workspace);
  const initial = (await api.get()).session;
  const legacyResult = await api.post('request', {
    question: 'Ancienne demande, sans historique.',
  });
  const legacyFile = legacyResult.request.file;
  // Preserve the pre-fix format: these additive fields did not exist in older requests.
  const legacy = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
  delete legacy.history;
  delete legacy.scenario;
  const legacyBytes = JSON.stringify(legacy, null, 2) + '\n';
  fs.writeFileSync(legacyFile, legacyBytes);
  const shared = { actorId: 'nina', actionId: 'review', recordId: 'atelier-velo' };
  await api.post('action', { action: shared });
  await api.post('decision', {
    decision: {
      variantId: 'relecture-pairs',
      reason: 'Essai agent : préserver le relais initial.',
    },
  });
  const firstChoice = (await api.get()).session.decision;
  await api.post('intent', {
    intent: { brief: 'Besoin révisé : comparer le contrôle éditorial.', constraints: [] },
  });
  await api.post('decision', {
    decision: {
      variantId: initial.project.variants[0].id,
      reason: 'Essai agent : choix réexaminé.',
    },
  });
  await api.post('action', {
    action: { ...shared, variantId: 'relecture-pairs' },
  });
  const before = await api.get();
  const prepared = await api.post('request', { question: 'Continuer sans perdre les acquis.' });
  const request = await api.get('request/' + prepared.request.id);
  assert.ok(Array.isArray(request.history), 'Handoff must carry recorded decision history');
  assert.deepEqual(request.history, [{ ...firstChoice, reviewNeeded: true }]);
  assert.equal(request.history[0].context.brief, initial.project.brief);
  assert.deepEqual(request.history[0].context.constraints, initial.project.constraints);
  assert.deepEqual(request.scenario, [shared]);
  assert.deepEqual(request.currentLanes, before.session.lanes);
  assert.deepEqual(request.decision, before.session.decision);
  assert.deepEqual(request.project, before.session.project);
  assert.equal(request.baseRevision, before.session.revision);
  assert.equal(request.format, 1);
  const after = prepared.session;
  assert.deepEqual({ ...after, requests: before.session.requests }, before.session);
  const bytes = fs.readFileSync(prepared.request.file, 'utf8');
  const { history, scenario, ...oldShape } = request;
  t.diagnostic(
    `request bytes=${Buffer.byteLength(bytes)}; same data without added history/scenario=${Buffer.byteLength(JSON.stringify(oldShape, null, 2) + '\n')}; historical decisions=${history.length}; shared actions=${scenario.length}`,
  );
  await api.post('intent', {
    intent: { brief: 'Modification suivante, après préparation.', constraints: [] },
  });
  await api.post('decision', {
    decision: { variantId: 'relecture-pairs', reason: 'Essai agent ultérieur.' },
  });
  await api.post('replay', { steps: [] });
  const latest = await api.get();
  assert.notDeepEqual(latest.session.history, request.history);
  assert.notDeepEqual(latest.session.situation, request.scenario);
  const firstPid = api.pid;
  await api.close();
  api = await start(workspace);
  assert.notEqual(api.pid, firstPid);
  assert.deepEqual(await api.get(), latest);
  assert.deepEqual(await api.get('request/' + prepared.request.id), request);
  assert.equal(fs.readFileSync(prepared.request.file, 'utf8'), bytes);
  assert.deepEqual(await api.get('request/' + legacy.id), legacy);
  assert.equal(fs.readFileSync(legacyFile, 'utf8'), legacyBytes);
});
