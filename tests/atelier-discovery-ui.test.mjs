import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createSession, performAction, replaySituation } from '../scripts/atelier/domain.mjs';
import { discoverProject } from '../scripts/atelier/discovery.mjs';
import { discoveryView } from '../scripts/atelier/public/discovery-view.js';

test('a discovered situation stays an unchanged preview until the explicit replay confirmation', async (t) => {
  const publicRoot = new URL('../scripts/atelier/public/', import.meta.url);
  const project = JSON.parse(
    await fs.readFile(new URL('../scripts/atelier/gazette.json', import.meta.url), 'utf8'),
  );
  const dom = new JSDOM(await fs.readFile(new URL('index.html', publicRoot), 'utf8'), {
    url: 'http://localhost/',
  });
  const { document } = dom.window;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const previous = ['document', 'location'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]);
  t.after(() => {
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.document = document;
  globalThis.location = dom.window.location;
  let stored = {
    storageVersion: 2,
    session: performAction(createSession(project), {
      actorId: 'camille',
      actionId: 'create',
      recordId: 'draft-kept',
      title: 'Mon brouillon',
    }).session,
  };
  const before = structuredClone(stored);
  const requests = [];
  let pendingLoad;
  let delayLoad = false;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push(url);
    if (url === '/api/session' && delayLoad)
      await new Promise((resolve) => {
        pendingLoad = resolve;
      });
    if (url === '/api/discover')
      return {
        ok: true,
        json: async () => ({ ...discoverProject(project), storageVersion: stored.storageVersion }),
      };
    if (url === '/api/replay') {
      const input = JSON.parse(options.body);
      assert.equal(input.version, stored.storageVersion);
      stored = {
        storageVersion: stored.storageVersion + 1,
        session: replaySituation(stored.session, input.steps),
      };
    }
    return { ok: true, json: async () => structuredClone(stored) };
  });
  await import(new URL('app.js', publicRoot));
  await setImmediate();
  document.querySelector('#discover-situation').focus();
  document.querySelector('#discover-situation').click();
  await setImmediate();
  assert.equal(document.activeElement.id, 'discover-situation');
  assert.match(document.querySelector('.discovery-panel').textContent, /Un premier écart/);
  assert.deepEqual(stored, before);
  document.querySelector('#play-discovery').click();
  assert.equal(document.querySelector('#reset-dialog').open, true);
  assert.equal(requests.includes('/api/replay'), false);
  document.querySelector('[data-close="reset-dialog"]').click();
  assert.deepEqual(stored, before);
  document.querySelector('#play-discovery').click();
  document.querySelector('#confirm-reset').click();
  await setImmediate();
  assert.equal(requests.filter((url) => url === '/api/replay').length, 1);
  assert.ok(stored.session.situation.length > 0);
  assert.equal(
    stored.session.lanes[project.variants[0].id].records.some(
      (record) => record.id === 'draft-kept',
    ),
    false,
  );
  assert.equal(document.querySelector('#play-discovery'), null);

  document.querySelector('#discover-situation').click();
  await setImmediate();
  document.querySelector('#reconsider-discovery').click();
  assert.equal(document.querySelector('#agent-dialog').open, true);
  assert.match(document.querySelector('#question').value, /Voici ce qui manque/);
  assert.equal(requests.includes('/api/request'), false);
  document.querySelector('[data-close="agent-dialog"]').click();

  delayLoad = true;
  document.querySelector('#reload').click();
  document.querySelector('#play-discovery').click();
  stored.storageVersion += 1;
  stored.session.project.brief = 'Contexte modifié pendant la confirmation';
  const latest = structuredClone(stored);
  pendingLoad();
  await setImmediate();
  document.querySelector('#confirm-reset').click();
  await setImmediate();
  assert.equal(requests.filter((url) => url === '/api/replay').length, 1);
  assert.deepEqual(stored, latest);
  assert.match(document.querySelector('#notice').textContent, /Relancez la recherche/);
});

test('identical display labels cannot hide the actual values compared by discovery', async (t) => {
  const project = JSON.parse(
    await fs.readFile(new URL('../scripts/atelier/gazette.json', import.meta.url), 'utf8'),
  );
  const dom = new JSDOM('<body></body>');
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = dom.window.document;
  t.after(() => {
    dom.window.close();
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  project.variants.forEach((variant, index) => {
    variant.states.forEach((state) => {
      if (['ready', 'published'].includes(state.id)) state.label = 'Traité';
    });
    variant.actions = [
      {
        id: 'probe',
        label: 'Traiter',
        kind: 'transition',
        from: ['submitted'],
        to: index ? 'published' : 'ready',
        actors: ['camille'],
        otherOwner: false,
      },
    ];
  });
  const result = discoverProject(project);
  assert.equal(result.status, 'witness');
  const view = discoveryView(project, result, false, { search() {}, replay() {}, reconsider() {} });
  const compared = [...view.querySelectorAll('pre')].map((node) => JSON.parse(node.textContent));
  assert.deepEqual(
    compared,
    result.trace.at(-1).observations.map((entry) => entry.value),
  );
  assert.notDeepEqual(compared[0], compared[1]);
});
