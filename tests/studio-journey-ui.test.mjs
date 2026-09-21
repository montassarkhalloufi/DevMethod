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

async function mount(t, state, onApproveMaster, onChooseDirection, extra = {}) {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><div id="root"></div></html>', {
    url: extra.url || 'http://localhost/#journey-design-master',
    runScripts: 'outside-only',
  });
  dom.window.eval(bundled.outputFiles[0].text + '\nwindow.JourneyWidget = JourneyWidget;');
  const requests = [];
  const options = {
    state,
    onRequest: (...args) => requests.push(args),
    onApproveMaster,
    onChooseDirection,
    onOpenPrototype: extra.onOpenPrototype,
    onOpenSource: extra.onOpenSource,
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
  return { document: dom.window.document, window: dom.window, handle, options, requests };
}

async function navigate(f, hash) {
  f.document.querySelector(`a[href="${hash}"]`).click();
  await until(() => f.document.querySelector(`a[href="${hash}"][aria-current="step"]`));
}

function button(document, label) {
  return [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === label);
}

test('foundation offers greenfield and existing-project entry without importing on navigation', async (t) => {
  const f = await mount(t, createInitialStudioState(), undefined, undefined, {
    url: 'http://localhost/#journey-foundation',
  });
  assert.match(f.document.body.textContent, /Deux points de départ/);
  assert.match(f.document.body.textContent, /Créer de zéro/);
  assert.match(f.document.body.textContent, /devmethod studio import --source/);
  assert.match(f.document.body.textContent, /--dry-run/);
  assert.equal(f.requests.length, 0);
});

test('imported foundation exposes provenance and unknowns and opens the original baseline source', async (t) => {
  const state = createInitialStudioState();
  state.import = {
    format: 1,
    baselineRevision: 'baseline-1',
    source: {
      name: 'Produit existant',
      importedAt: '2026-09-17T10:00:00Z',
      fingerprint: 'a'.repeat(64),
    },
    inventory: {
      included: 3,
      bytes: 1200,
      excluded: [{ path: '.env', reason: 'Configuration sensible exclue' }],
    },
    context: {
      facts: [
        {
          kind: 'command',
          label: 'Commande déclarée, non exécutée',
          value: 'npm run test',
          provenance: { kind: 'declared', path: 'package.json', sha256: 'b'.repeat(64) },
        },
      ],
      unknowns: ['Aucune exécution du produit observée.'],
      analysis: { status: 'partial', protocol: 'test', stack: ['React'], issues: [] },
    },
  };
  const opened = [];
  const f = await mount(t, state, undefined, undefined, {
    url: 'http://localhost/#journey-foundation',
    onOpenSource: (...args) => opened.push(args),
  });
  assert.match(f.document.body.textContent, /Projet repris · Produit existant/);
  assert.match(f.document.body.textContent, /Aucune exécution du produit observée/);
  assert.match(f.document.body.textContent, /Déclaré dans le projet/);
  button(f.document, 'package.json ↗').click();
  assert.deepEqual(opened, [['package.json', 'baseline-1']]);
  assert.equal(f.requests.length, 0);
  assert.doesNotMatch(f.document.body.textContent, /Tous les contrôles réussis/);
});

test('three directions and a selection do not imply a validated detailed master', async (t) => {
  const f = await mount(t, stateWithDirections());
  assert.equal(f.document.querySelectorAll('.journey-stage').length, 1);
  await navigate(f, '#journey-design-directions');
  assert.equal(f.document.querySelectorAll('.journey-image-grid img').length, 3);
  await navigate(f, '#journey-design-master');
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
  assert.equal(button(f.document, 'Valider ce master'), undefined);
  await navigate(f, '#journey-design-prototype');
  assert.match(f.document.body.textContent, /Aucun prototype exécutable n’est relié/);
  assert.equal(button(f.document, 'Essayer ce prototype'), undefined);
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
  await navigate(f, '#journey-design-directions');
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
  await navigate(f, '#journey-design-master');
  assert.match(f.document.body.textContent, /Le master n’est pas encore enregistré/);
});

test('framing deep link displays scope and exclusions without inventing acceptance', async (t) => {
  const state = stateWithDirections();
  state.brief = {
    outcome: 'Partager les livres du quartier',
    scope: ['Prêter et rendre un livre'],
    excluded: ['Aucun paiement'],
    criteria: [{ id: 'keep', text: 'Les prêts survivent au redémarrage' }],
  };
  const f = await mount(t, state, undefined, undefined, { url: 'http://localhost/#journey-frame' });
  assert.match(f.document.body.textContent, /Prêter et rendre un livre/);
  assert.match(f.document.body.textContent, /Aucun paiement/);
  assert.match(f.document.body.textContent, /Les prêts survivent au redémarrage/);
  assert.match(f.document.body.textContent, /ne vaut pas approbation/);
  assert.equal(f.requests.length, 0);
  await navigate(f, '#journey-exploration');
  assert.match(f.document.body.textContent, /Exploration à documenter/);
  assert.doesNotMatch(f.document.body.textContent, /Prêter et rendre un livre/);
  f.window.history.back();
  await until(() => f.document.body.textContent.includes('Prêter et rendre un livre'));
  assert.equal(f.requests.length, 0);
  button(f.document, 'Préparer une demande').click();
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0][0], 'frame');
});

test('only an actual linked prototype can be opened and opening does not approve or adopt it', async (t) => {
  const state = stateWithDirections();
  state.activeRevision = 'active';
  state.revisions = [
    { id: 'active', title: 'Version en usage' },
    { id: 'prototype', title: 'Essai réel' },
  ];
  state.designJourney = {
    activeMasterId: 'm',
    masters: [{ id: 'm', designId: 'b', referenceId: 'b', approvedBy: null }],
    screens: [],
    prototypes: [{ id: 'p', masterId: 'm', revisionId: 'prototype' }],
  };
  const opened = [];
  const f = await mount(t, state, () => assert.fail('No approval from preview'), undefined, {
    url: 'http://localhost/#journey-design-prototype',
    onOpenPrototype: (id) => opened.push(id),
  });
  assert.match(f.document.body.textContent, /Son master est à réexaminer ou à valider/);
  button(f.document, 'Essayer ce prototype').click();
  assert.deepEqual(opened, ['prototype']);
  assert.equal(state.activeRevision, 'active');
  assert.equal(state.designJourney.masters[0].approvedBy, null);
  assert.equal(f.requests.length, 0);
  const next = structuredClone(state);
  next.revisions = [state.revisions[0]];
  f.handle.update({ ...f.options, state: next });
  await until(() => !button(f.document, 'Essayer ce prototype'));
  assert.match(f.document.body.textContent, /Aucun prototype exécutable/);
});

test('Discovery retains active exploration choices and their reasons without turning hypotheses into evidence', async (t) => {
  const state = stateWithDirections();
  state.decisions = [
    {
      id: 'e',
      topic: 'exploration',
      choice: 'Catalogue retenu',
      reason: 'À éprouver avec des lecteurs.',
      status: 'active',
    },
    {
      id: 'h',
      topic: 'Recherche',
      choice: 'Le filtre réduit les erreurs',
      reason: 'Hypothèse non mesurée.',
      status: 'hypothesis',
    },
    {
      id: 'old',
      topic: 'exploration',
      choice: 'Ancienne piste remplacée',
      reason: '',
      status: 'superseded',
    },
  ];
  const f = await mount(t, state, undefined, undefined, {
    url: 'http://localhost/#journey-exploration',
  });
  assert.match(f.document.body.textContent, /Choix actif : exploration — Catalogue retenu/);
  assert.match(f.document.body.textContent, /À éprouver avec des lecteurs/);
  assert.match(f.document.body.textContent, /Hypothèse : Recherche — Le filtre réduit les erreurs/);
  assert.doesNotMatch(f.document.body.textContent, /Ancienne piste remplacée/);
  assert.equal(f.requests.length, 0);
});
