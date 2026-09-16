import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createAtelierServer } from '../scripts/atelier/server.mjs';

const project = JSON.parse(
  fs.readFileSync(new URL('../scripts/atelier/gazette.json', import.meta.url), 'utf8'),
);

async function running(t, workspace) {
  const server = createAtelierServer({ workspace, project });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port;
  const close = () =>
    new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  t.after(async () => {
    if (server.listening) await close();
  });
  const get = async () => (await fetch(url + '/api/session')).json();
  const post = async (route, input, version) => {
    const response = await fetch(url + '/api/' + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: url },
      body: JSON.stringify({ version: version ?? (await get()).storageVersion, ...input }),
    });
    return { status: response.status, body: await response.json() };
  };
  return { url, get, post, close };
}

function workspace(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-api-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('atelier persists observed differences, choices and live records through changed needs and restart', async (t) => {
  const directory = workspace(t);
  let api = await running(t, directory);
  const action = { actorId: 'nina', actionId: 'review', recordId: 'atelier-velo' };
  const observed = await api.post('action', { action });
  assert.equal(observed.status, 200);
  assert.deepEqual(
    observed.body.outcomes.map((item) => item.allowed),
    [false, true],
  );
  await api.post('action', {
    action: {
      actorId: 'camille',
      actionId: 'create',
      recordId: 'new-item',
      title: 'Un sujet ajouté',
    },
  });
  await api.post('decision', {
    decision: {
      variantId: 'relecture-pairs',
      reason: 'Essai interne : conserver le relais entre pairs.',
    },
  });
  const before = await api.get();
  const changed = await api.post('intent', {
    intent: {
      brief: 'Besoin fictif modifié : le retrait doit rester possible.',
      constraints: project.constraints,
    },
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.session.decision.reviewNeeded, true);
  assert.deepEqual(changed.body.session.lanes, before.session.lanes);
  await api.close();
  api = await running(t, directory);
  assert.deepEqual(await api.get(), changed.body);
  const exportData = await (await fetch(api.url + '/api/export')).json();
  assert.equal(exportData.decision.reason, before.session.decision.reason);
  assert.equal(exportData.lanes['relecture-pairs'].records.at(-1).title, 'Un sujet ajouté');
});

test('atelier rejects stale tabs, cross-origin writes and malformed proposals without losing state', async (t) => {
  const api = await running(t, workspace(t));
  const before = await api.get();
  const denied = await fetch(api.url + '/api/intent', {
    method: 'POST',
    headers: { Origin: 'https://example.com', 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(denied.status, 403);
  assert.equal(
    (
      await api.post('proposal', {
        proposal: { baseRevision: 0, summary: 'stale', variants: project.variants },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api.post('proposal', {
        proposal: { baseRevision: 1, summary: 'invalid', variants: [] },
      })
    ).status,
    400,
  );
  assert.deepEqual(await api.get(), before);
  await api.post('decision', { decision: { variantId: project.variants[0].id, reason: 'Essai' } });
  assert.equal(
    (
      await api.post(
        'decision',
        { decision: { variantId: project.variants[1].id, reason: 'Onglet périmé' } },
        before.storageVersion,
      )
    ).status,
    409,
  );
  assert.equal((await api.get()).session.decision.reason, 'Essai');
});

test('discovery is read-only, replays real consequences and rejects a stale project', async (t) => {
  const api = await running(t, workspace(t));
  await api.post('action', {
    action: { actorId: 'camille', actionId: 'create', recordId: 'my-draft', title: 'À conserver' },
  });
  const before = await api.get();
  const result = await api.post('discover', {});
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'witness');
  assert.equal(result.body.storageVersion, before.storageVersion);
  assert.deepEqual(await api.get(), before);
  const steps = result.body.trace.map((entry) => entry.action);
  const played = await api.post('replay', { steps }, before.storageVersion);
  assert.equal(played.status, 200);
  for (const observation of result.body.trace.at(-1).observations) {
    const lane = played.body.session.lanes[observation.variantId];
    assert.equal(lane.events.at(-1).allowed, observation.value.allowed);
    assert.deepEqual(lane.records, observation.value.records);
  }
  assert.equal((await api.post('discover', {}, before.storageVersion)).status, 409);
  assert.equal((await fetch(api.url + '/discovery-view.js')).status, 200);
});

test('agent request is an actual retained handoff; imported response preserves data and is auditable', async (t) => {
  const api = await running(t, workspace(t));
  const result = await api.post('request', { question: 'Explorer le retrait d’un article.' });
  assert.equal(result.status, 200);
  const request = await (await fetch(api.url + '/api/request/' + result.body.request.id)).json();
  assert.equal(request.baseRevision, 1);
  assert.equal(request.question, 'Explorer le retrait d’un article.');
  assert.match(request.contract, /applyProposal/);
  assert.deepEqual(request.project, project);
  const before = await api.get();
  const variant = structuredClone(project.variants[1]);
  variant.actions.push({
    id: 'withdraw',
    label: 'Retirer',
    kind: 'transition',
    from: ['published'],
    to: 'draft',
    actors: project.actors.map((actor) => actor.id),
    otherOwner: false,
  });
  const imported = await api.post('proposal', {
    proposal: {
      baseRevision: 1,
      summary: 'Retrait local ; aucun effet sur une publication externe.',
      variants: [variant],
    },
  });
  assert.equal(imported.status, 200);
  assert.deepEqual(imported.body.session.lanes, before.session.lanes);
  assert.equal(
    imported.body.session.requests.at(-1).summary,
    'Retrait local ; aucun effet sur une publication externe.',
  );
  assert.equal(
    (await fetch(api.url + '/api/request/00000000-0000-0000-0000-000000000000')).status,
    404,
  );
});

test('a corrupt persisted lane fails on opening and is not silently reset', async (t) => {
  const directory = workspace(t);
  const api = await running(t, directory);
  const saved = await api.get();
  await api.close();
  saved.session.lanes['relecture-pairs'].records[0].owner = 'not-an-actor';
  const file = path.join(directory, 'session.json');
  const content = JSON.stringify(saved);
  fs.writeFileSync(file, content);
  assert.throws(() => createAtelierServer({ workspace: directory, project }), /unknown owner/);
  assert.equal(fs.readFileSync(file, 'utf8'), content);
  assert.equal(fs.existsSync(path.join(directory, '.atelier-lock')), false);
});
