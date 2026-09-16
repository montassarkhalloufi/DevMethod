import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createInitialStudioState } from '../scripts/studio/store.mjs';

const bundled = await build({
  entryPoints: [path.resolve('studio-ui/src/journey-widget.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'JourneyWidget',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let i = 0; i < 40; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Journey did not reach its expected state');
}

function stateWithDirections() {
  const state = createInitialStudioState();
  state.project.idea = 'Une bibliothèque partagée';
  state.references = ['a', 'b', 'c'].map((id) => ({
    id,
    name: id,
    file: `references/${id}.png`,
    mime: 'image/png',
  }));
  state.designs = state.references.map((item) => ({
    id: item.id,
    file: item.id,
    title: `Direction ${item.id}`,
    description: 'Une composition proposée',
  }));
  state.selectedDesignId = 'b';
  return state;
}

async function mount(t, state, onApproveMaster, onChooseDirection) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
  });
  dom.window.eval(bundled.outputFiles[0].text + '\nwindow.JourneyWidget = JourneyWidget;');
  const requests = [];
  const options = {
    state,
    onRequest: (...args) => requests.push(args),
    onApproveMaster,
    onChooseDirection,
  };
  const handle = dom.window.JourneyWidget.mountJourneyWidget(
    dom.window.document.getElementById('root'),
    options,
  );
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  await until(() => dom.window.document.querySelector('.journey-stage'));
  return { document: dom.window.document, handle, options, requests };
}

function button(document, label) {
  return [...document.querySelectorAll('button')].find((node) => node.textContent === label);
}

test('three directions and a selection do not imply a validated detailed master', async (t) => {
  const f = await mount(t, stateWithDirections());
  assert.equal(f.document.querySelectorAll('.journey-stage').length, 6);
  assert.equal(f.document.querySelectorAll('.journey-image-grid img').length, 3);
  assert.match(f.document.body.textContent, /Le master n’est pas encore enregistré/);
  assert.doesNotMatch(f.document.body.textContent, /Master validé par vous/);
  assert.equal(button(f.document, 'Valider ce master'), undefined);
  button(f.document, 'Préparer le master').click();
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0][0], 'design');
  assert.match(f.requests[0][1], /validation avant le code UI/);
});

test('taking visual approval back exposes an insufficient historical agreement and a connected recovery action', async (t) => {
  const state = stateWithDirections();
  state.project.delegation = { structure: 'agent', visual: 'agent', adoption: 'user' };
  state.designJourney = {
    activeMasterId: 'master-b',
    masters: [
      {
        id: 'master-b',
        designId: 'b',
        referenceId: 'b',
        source: 'agent',
        createdAt: '2026-09-16T20:00:00Z',
        approvedBy: 'agent',
        approvedAt: '2026-09-16T20:01:00Z',
        approvalReason: 'Accord délégué historique',
      },
    ],
    screens: [],
    prototypes: [],
  };
  const f = await mount(t, state, async () => assert.fail('Do not rewrite the old approval'));
  assert.match(f.document.body.textContent, /Master retenu par délégation/);
  const reserved = structuredClone(state);
  reserved.project.delegation.visual = 'user';
  f.handle.update({ ...f.options, state: reserved });
  await until(() => f.document.body.textContent.includes('accord historique ne suffit plus'));
  assert.doesNotMatch(f.document.body.textContent, /Master retenu par délégation/);
  assert.equal(button(f.document, 'Valider ce master'), undefined);
  button(f.document, 'Préparer un nouveau master').click();
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0][0], 'design');
  assert.match(f.requests[0][1], /nouveau master.*validation/i);
  assert.equal(reserved.designJourney.masters[0].approvedBy, 'agent');
  f.handle.update({ ...f.options, state: reserved, onRequest: undefined });
  await until(() => f.document.body.textContent.includes('préparation n’est pas connectée'));
  assert.equal(button(f.document, 'Préparer un nouveau master'), undefined);
});

test('failed master approval remains pending validation until an updated server record arrives', async (t) => {
  const state = stateWithDirections();
  state.designJourney = {
    activeMasterId: 'master-b',
    masters: [
      {
        id: 'master-b',
        designId: 'b',
        referenceId: 'b',
        source: 'agent',
        createdAt: '2026-09-16T20:00:00Z',
        approvedBy: null,
        approvedAt: null,
        approvalReason: null,
      },
    ],
    screens: [],
    prototypes: [],
  };
  let reject;
  let calls = 0;
  const f = await mount(t, state, () => {
    calls++;
    return new Promise((_resolve, fail) => {
      reject = fail;
    });
  });
  button(f.document, 'Valider ce master').click();
  await until(() => button(f.document, 'Validation en cours…'));
  assert.equal(button(f.document, 'Validation en cours…').disabled, true);
  assert.equal(calls, 1);
  reject(new Error('Conflit : relisez la nouvelle référence.'));
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.match(f.document.body.textContent, /Master proposé — à valider/);
  assert.doesNotMatch(f.document.body.textContent, /Master validé par vous/);
  const next = structuredClone(state);
  next.designJourney.masters[0].approvedBy = 'user';
  f.handle.update({ ...f.options, state: next });
  await until(() => f.document.body.textContent.includes('Master validé par vous'));
  assert.equal(button(f.document, 'Valider ce master'), undefined);
});

test('a replaced direction exposes a stale master without offering approval or inventing a prototype', async (t) => {
  const state = stateWithDirections();
  state.designJourney = {
    activeMasterId: 'master-a',
    masters: [
      {
        id: 'master-a',
        designId: 'a',
        referenceId: 'a',
        source: 'agent',
        createdAt: '2026-09-16T20:00:00Z',
        approvedBy: null,
        approvedAt: null,
        approvalReason: null,
      },
    ],
    screens: [],
    prototypes: [],
  };
  const f = await mount(t, state, async () =>
    assert.fail('A stale master must not be approved from the view'),
  );
  assert.match(f.document.body.textContent, /Ce master correspond à une autre direction/);
  assert.match(f.document.body.textContent, /Aucun prototype exécutable n’est relié/);
  assert.equal(button(f.document, 'Valider ce master'), undefined);
});

test('choosing a direction emits only the choice and waits for server state before marking it retained', async (t) => {
  const state = stateWithDirections();
  const chosen = [];
  const f = await mount(
    t,
    state,
    async () => assert.fail('Direction selection cannot approve a master'),
    async (id) => {
      chosen.push(id);
    },
  );
  f.document.querySelector('[aria-label="Choisir la direction Direction a"]').click();
  await until(() => chosen.length === 1);
  assert.deepEqual(chosen, ['a']);
  assert.equal(
    f.document
      .querySelector('[aria-label="Choisir la direction Direction a"]')
      .getAttribute('aria-pressed'),
    'false',
  );
  assert.equal(
    f.document
      .querySelector('[aria-label="Choisir la direction Direction b"]')
      .getAttribute('aria-pressed'),
    'true',
  );
  const next = structuredClone(state);
  next.selectedDesignId = 'a';
  f.handle.update({ ...f.options, state: next });
  await until(
    () =>
      f.document
        .querySelector('[aria-label="Choisir la direction Direction a"]')
        .getAttribute('aria-pressed') === 'true',
  );
  assert.match(f.document.body.textContent, /Le master n’est pas encore enregistré/);
});
