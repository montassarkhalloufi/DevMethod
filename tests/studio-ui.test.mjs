import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { mountStudio } from '../scripts/studio/public/app.js';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import { createStudioApi } from '../scripts/studio/public/api.js';
import { createViews } from '../scripts/studio/public/views.js';

const html = await fs.readFile(
  new URL('../scripts/studio/public/index.html', import.meta.url),
  'utf8',
);
const revision = (id) => ({
  id,
  title: id,
  summary: 'Version réalisée',
  files: [{ path: 'index.html' }],
  createdAt: '2026-09-16T10:00:00Z',
});

async function fixture(t, customize = () => {}) {
  let state = createInitialStudioState();
  state.project.idea = 'Conserver mes lectures';
  customize(state);
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:4330/' });
  const calls = [];
  const runtime = {
    previewOrigin: 'http://127.0.0.1:4331',
    agent: { automatic: false },
    planApproved: false,
  };
  const api = {
    state: async () => structuredClone(state),
    runtime: async () => runtime,
    change: async (route, version, input) => {
      calls.push({ route, version, input });
      if (route === 'project') state.project = input;
      if (route === 'draft') state.draft = input.text;
      if (route === 'requests') state.draft = '';
      if (route === 'approve') runtime.planApproved = true;
      state.version++;
      return { state: structuredClone(state) };
    },
  };
  const app = mountStudio({ document: dom.window.document, window: dom.window, api, pollMs: 0 });
  t.after(() => {
    app.destroy();
    dom.window.close();
  });
  await app.ready;
  const el = (id) => dom.window.document.getElementById(id);
  const input = (id, value) => {
    el(id).value = value;
    el(id).dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  const submit = async (id) => {
    el(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await app.settled();
    await setImmediate();
  };
  return { app, api, dom, calls, runtime, el, input, submit, state: () => state };
}

test('polling preserves edits, focus, open context and a live preview without reloading it', async (t) => {
  const f = await fixture(t, (state) => {
    state.revisions = [revision('v1')];
    state.activeRevision = 'v1';
  });
  f.input('idea', 'Une intention encore en rédaction');
  f.input('request', 'Ajouter un tri');
  f.el('request').focus();
  const iframe = f.el('preview');
  const iframeWindow = iframe.contentWindow;
  f.el('context').querySelector('details').open = true;
  f.state().version++;
  f.state().project.idea = 'Autre texte enregistré par un agent';
  await f.app.refresh();
  assert.equal(f.el('idea').value, 'Une intention encore en rédaction');
  assert.equal(f.el('request').value, 'Ajouter un tri');
  assert.equal(f.dom.window.document.activeElement.id, 'request');
  assert.equal(f.el('preview').contentWindow, iframeWindow);
  assert.equal(f.el('context').querySelector('details').open, true);
});

test('a conflict retains the draft, refreshes the version and never resubmits the request automatically', async (t) => {
  const f = await fixture(t);
  f.input('request', 'Préparer les choix');
  let attempts = 0;
  const original = f.api.change;
  f.api.change = async (...args) => {
    if (args[0] === 'requests' && ++attempts === 1) {
      f.state().version = 5;
      throw Object.assign(new Error('Conflit'), { status: 409 });
    }
    return original(...args);
  };
  await f.submit('request-form');
  assert.equal(attempts, 1);
  assert.equal(f.el('request').value, 'Préparer les choix');
  assert.match(f.el('notice').textContent, /Votre saisie est conservée/);
  await f.submit('request-form');
  assert.equal(attempts, 2);
  assert.equal(f.calls.at(-1).version, 5);
  assert.equal(f.el('request').value, '');
});

test('a new draft typed during a request response is retained', async (t) => {
  const f = await fixture(t);
  let resolve;
  const original = f.api.change;
  f.api.change = async (...args) => {
    if (args[0] === 'requests')
      await new Promise((done) => {
        resolve = done;
      });
    return original(...args);
  };
  f.input('request', 'Première demande');
  const pending = f.submit('request-form');
  await setImmediate();
  f.input('request', 'Demande suivante en rédaction');
  resolve();
  await pending;
  assert.equal(f.el('request').value, 'Demande suivante en rédaction');
  f.el('save-draft').click();
  await f.app.settled();
  assert.equal(f.state().draft, 'Demande suivante en rédaction');
});

test('element targeting accepts only the preview origin and the actual iframe window', async (t) => {
  const f = await fixture(t, (state) => {
    state.revisions = [revision('v1')];
    state.activeRevision = 'v1';
  });
  f.el('inspect-element').click();
  const data = { type: 'devmethod-element', selector: '#title', text: 'Mes lectures' };
  const send = (origin, source) =>
    f.dom.window.dispatchEvent(new f.dom.window.MessageEvent('message', { data, origin, source }));
  send('https://example.com', f.el('preview').contentWindow);
  send(f.runtime.previewOrigin, f.dom.window);
  assert.equal(f.el('element-selection').hidden, true);
  send(f.runtime.previewOrigin, f.el('preview').contentWindow);
  assert.equal(f.el('element-selection').hidden, false);
  f.input('request', 'Agrandir ce titre');
  await f.submit('request-form');
  assert.deepEqual(f.calls.at(-1).input.element, { selector: '#title', text: 'Mes lectures' });
});

test('approval is explicit for DevAuto and new active versions follow until the user chooses an older one', async (t) => {
  const f = await fixture(t, (state) => {
    state.project.mode = 'devauto';
    state.brief = {
      outcome: 'Lire plus régulièrement',
      scope: [],
      excluded: [],
      criteria: [{ id: 'c1', text: 'Ajouter une lecture' }],
    };
    state.revisions = [revision('v1')];
    state.activeRevision = 'v1';
  });
  assert.equal(f.el('approval-form').hidden, false);
  assert.equal(f.calls.length, 0);
  await f.submit('approval-form');
  assert.equal(f.calls.at(-1).route, 'approve');
  assert.equal(f.el('approval-form').hidden, true);
  f.state().revisions.push(revision('v2'));
  f.state().activeRevision = 'v2';
  f.state().version++;
  await f.app.refresh();
  assert.match(f.el('preview').src, /v2\/index.html$/);
  f.el('preview-v1').click();
  f.state().revisions.push(revision('v3'));
  f.state().activeRevision = 'v3';
  f.state().version++;
  await f.app.refresh();
  assert.match(f.el('preview').src, /v1\/index.html$/);
});

test('API propagates conflict status and sends the optimistic version without losing unicode', async () => {
  let posted;
  const api = createStudioApi(async (_url, options) => {
    posted = JSON.parse(options.body);
    return { ok: false, status: 409, json: async () => ({ error: 'Révision modifiée' }) };
  });
  await assert.rejects(api.change('requests', 8, { request: 'Élargir l’en-tête' }), {
    status: 409,
    message: 'Révision modifiée',
  });
  assert.deepEqual(posted, { version: 8, request: 'Élargir l’en-tête' });
});

test('a connected runner stopped by its budget is visibly suspended, not described as manual', async (t) => {
  const f = await fixture(t);
  f.runtime.agent = {
    kind: 'codex-cli',
    connected: true,
    automatic: false,
    message: 'Limite de budget atteinte.',
  };
  await f.app.refresh();
  assert.match(f.el('agent-status').textContent, /connecté · appels suspendus/);
  assert.match(f.el('agent-description').textContent, /Limite de budget atteinte/);
  assert.doesNotMatch(f.el('agent-description').textContent, /ne lance pas un agent/);
});

test('first use keeps the idea composer open, then a saved project collapses without recreating its fields', async (t) => {
  const f = await fixture(t, (state) => {
    state.project.idea = '';
  });
  const idea = f.el('idea');
  assert.equal(f.el('project-form').hidden, false);
  assert.equal(f.el('edit-project').hidden, true);
  f.input('idea', 'Un carnet de lectures personnel');
  await f.submit('project-form');
  assert.equal(f.el('project-form').hidden, true);
  assert.equal(f.el('project-summary').hidden, false);
  assert.equal(f.el('project-idea-summary').textContent, 'Un carnet de lectures personnel');
  assert.equal(f.el('project-mode').textContent, 'Guidé');
  assert.equal(f.dom.window.document.activeElement.id, 'edit-project');
  f.el('edit-project').click();
  assert.equal(f.el('idea'), idea);
  assert.equal(f.el('idea').value, 'Un carnet de lectures personnel');
  assert.equal(f.el('project-form').hidden, false);
  assert.equal(f.dom.window.document.activeElement.id, 'idea');
});

test('an existing project is compact and its open edits survive polling and a save conflict', async (t) => {
  const f = await fixture(t);
  assert.equal(f.el('project-form').hidden, true);
  assert.equal(f.el('edit-project').getAttribute('aria-expanded'), 'false');
  f.el('edit-project').click();
  f.input('idea', 'Une intention en cours de précision');
  f.state().version++;
  await f.app.refresh();
  assert.equal(f.el('project-form').hidden, false);
  assert.equal(f.el('idea').value, 'Une intention en cours de précision');
  f.api.change = async () => {
    throw Object.assign(new Error('Conflit'), { status: 409 });
  };
  await f.submit('project-form');
  assert.equal(f.el('project-form').hidden, false);
  assert.equal(f.el('idea').value, 'Une intention en cours de précision');
  assert.match(f.el('notice').textContent, /Votre saisie est conservée/);
  f.el('edit-project').click();
  assert.equal(f.el('project-unsaved').hidden, false);
  f.input('request', 'Faire avancer le projet');
  await f.submit('request-form');
  assert.equal(f.el('project-form').hidden, false);
  assert.equal(f.dom.window.document.activeElement.id, 'save-project');
  assert.equal(f.el('request').value, 'Faire avancer le projet');
  assert.equal(f.el('idea').value, 'Une intention en cours de précision');
});

test('exploration context includes active exploration decisions and hypotheses but excludes superseded ones', async (t) => {
  const f = await fixture(t, (state) => {
    state.decisions = [
      {
        id: 'd1',
        topic: 'Exploration',
        choice: 'Comparer le carnet papier au suivi numérique',
        status: 'active',
      },
      {
        id: 'd2',
        topic: 'Usage',
        choice: 'Un rituel hebdomadaire pourrait suffire',
        status: 'hypothesis',
      },
      { id: 'd3', topic: 'Exploration', choice: 'Ancienne piste écartée', status: 'superseded' },
    ];
  });
  const exploration = [...f.el('context').querySelectorAll('section')].find(
    (section) => section.querySelector('h3').textContent === 'Ce qu’on explore',
  );
  assert.match(exploration.textContent, /Comparer le carnet papier/);
  assert.match(exploration.textContent, /Un rituel hebdomadaire/);
  assert.doesNotMatch(exploration.textContent, /Ancienne piste/);
  assert.doesNotMatch(exploration.textContent, /apparaîtront ici/);
});

test('method surfaces keep the intended result visible and distinguish delegation from an actual human agreement', (t) => {
  const dom = new JSDOM('<main></main>');
  t.after(() => dom.window.close());
  const state = createInitialStudioState();
  state.brief = {
    outcome: 'Retrouver les objets prêtés',
    scope: ['Prêter et retourner'],
    excluded: ['Paiements'],
    criteria: [
      { id: 'one', text: 'Historique conservé' },
      { id: 'two', text: 'Deux objets homonymes restent distincts' },
      { id: 'three', text: 'Reprise après arrêt' },
    ],
  };
  const views = createViews(dom.window.document);
  const root = dom.window.document.querySelector('main');
  root.append(...views.cap(state));
  assert.equal(root.querySelector('h2').textContent, state.brief.outcome);
  assert.equal(root.querySelector('ul').children.length, 2);
  assert.match(root.querySelector('details').textContent, /Reprise après arrêt/);
  assert.match(root.querySelector('details').textContent, /Paiements/);
  root.replaceChildren(
    ...views.policy(state, {
      delegation: { structure: 'agent', visual: 'user', adoption: 'user' },
      approval: { recorded: { structure: false, visual: true } },
    }),
  );
  const choices = root.querySelectorAll('.policy-choice');
  assert.match(choices[0].textContent, /Délégué/);
  assert.equal(choices[0].querySelector('.policy-agreement'), null);
  assert.match(choices[1].querySelector('.policy-agreement').textContent, /Accord explicite/);
  assert.equal(choices[2].querySelector('.policy-agreement'), null);
});

test('evidence dock excludes checks from other revisions and exposes interrupted work and unknown costs', (t) => {
  const dom = new JSDOM('<main></main>');
  t.after(() => dom.window.close());
  const state = createInitialStudioState();
  state.revisions = [revision('old'), revision('active')];
  state.activeRevision = 'active';
  state.checks = [
    { revisionId: 'old', status: 'passed', label: 'Ancien test inapplicable', kind: 'command' },
    { revisionId: 'active', status: 'failed', label: 'Reprise en échec', kind: 'command' },
  ];
  state.jobs = [{ id: 'last', status: 'interrupted', error: 'Arrêt du processus' }];
  const root = dom.window.document.querySelector('main');
  root.append(
    ...createViews(dom.window.document).evidence(state, {
      agent: {
        connected: true,
        automatic: false,
        knownTokens: 10,
        usageUnknown: true,
        costUSD: null,
        message: 'Consommation inconnue',
      },
    }),
  );
  assert.doesNotMatch(root.textContent, /Ancien test inapplicable/);
  assert.match(root.textContent, /Reprise en échec/);
  assert.match(root.textContent, /0 contrôle\(s\) passé\(s\) · 1 échoué/);
  assert.match(root.textContent, /Arrêt du processus/);
  assert.match(root.textContent, /Coût monétaire non disponible/);
  assert.match(root.textContent, /consommation partiellement inconnue/);
});

test('workspace tabs preserve the live app and typed request while loading actual code on demand', async (t) => {
  const f = await fixture(t, (state) => {
    state.revisions = [
      { ...revision('v1'), files: [{ path: 'index.html', bytes: 12, sha256: 'a'.repeat(64) }] },
    ];
    state.activeRevision = 'v1';
  });
  const reads = [];
  f.api.source = async ({ revisionId, path }) => {
    reads.push([revisionId, path]);
    return {
      revisionId,
      path,
      bytes: 12,
      sha256: 'a'.repeat(64),
      content: 'actual source',
      binary: false,
      truncated: false,
    };
  };
  const frame = f.el('preview').contentWindow;
  f.input('request', 'Une modification toujours en rédaction');
  f.el('tab-code').click();
  await setImmediate();
  assert.equal(f.el('product').hidden, true);
  assert.equal(f.el('code').hidden, false);
  assert.equal(f.el('tab-code').getAttribute('aria-selected'), 'true');
  assert.equal(f.el('source-view').querySelector('code').textContent, 'actual source');
  assert.deepEqual(reads, [['v1', 'index.html']]);
  f.el('tab-code').dispatchEvent(
    new f.dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
  );
  assert.equal(f.el('choices').hidden, false);
  assert.equal(f.dom.window.document.activeElement.id, 'tab-choices');
  f.el('tab-product').click();
  assert.equal(f.el('preview').contentWindow, frame);
  assert.equal(f.el('request').value, 'Une modification toujours en rédaction');
});

test('explicit policy overrides survive project saves and visual approval blocks structural approval independently of the mode name', async (t) => {
  const f = await fixture(t, (state) => {
    state.project.delegation = { structure: 'agent', visual: 'user', adoption: 'agent' };
    state.brief.outcome = 'Un résultat explicite';
    state.brief.criteria = [{ id: 'one', text: 'Le résultat est essayable' }];
  });
  f.runtime.delegation = { structure: 'agent', visual: 'user', adoption: 'agent' };
  f.runtime.approval = {
    structureApproved: true,
    visualApproved: false,
    planApproved: false,
    missing: ['visual'],
    recorded: { structure: false, visual: false },
  };
  await f.app.refresh();
  assert.equal(f.el('approval-form').hidden, false);
  assert.equal(f.el('approve-plan').disabled, true);
  f.el('adjust-policy').click();
  assert.equal(f.el('project-form').hidden, false);
  assert.equal(f.el('delegate-visual').value, 'user');
  f.input('idea', 'Une idée affinée');
  await f.submit('project-form');
  assert.deepEqual(f.calls.at(-1).input.delegation, {
    structure: 'agent',
    visual: 'user',
    adoption: 'agent',
  });
  assert.equal(f.el('policy').querySelector('.policy-agreement'), null);
});

test('a header mode change is persisted but a conflicting choice stays visible for retry', async (t) => {
  const f = await fixture(t);
  const delegated = f.dom.window.document.querySelector('[name=mode][value=delegated]');
  delegated.checked = true;
  delegated.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  await f.app.settled();
  await setImmediate();
  assert.equal(f.calls.at(-1).route, 'project');
  assert.equal(f.calls.at(-1).input.mode, 'delegated');
  f.api.change = async () => {
    throw Object.assign(new Error('Conflit'), { status: 409 });
  };
  const guided = f.dom.window.document.querySelector('[name=mode][value=guided]');
  guided.checked = true;
  guided.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  await f.app.settled();
  await setImmediate();
  assert.equal(guided.checked, true);
  assert.match(f.el('notice').textContent, /saisie est conservée/);
});

test('ready work and active revisions remain distinct from verified results', (t) => {
  const dom = new JSDOM('<main></main>');
  t.after(() => dom.window.close());
  const state = createInitialStudioState();
  state.revisions = [revision('old'), revision('active')];
  state.activeRevision = 'active';
  state.checks = [{ revisionId: 'old', status: 'passed', label: 'Ancien contrôle' }];
  state.jobs = [
    { id: 'job', status: 'ready', request: 'Faire évoluer', summary: 'Résultat livré' },
  ];
  const root = dom.window.document.querySelector('main');
  const views = createViews(dom.window.document);
  root.append(...views.evidence(state, {}));
  assert.match(root.querySelector('.badge').textContent, /Non vérifié sur cette version/);
  assert.doesNotMatch(root.textContent, /Ancien contrôle/);
  root.replaceChildren(...views.versions(state, 'active'));
  const active = root.querySelector('.version-card');
  assert.match(active.textContent, /Active/);
  assert.match(active.textContent, /Non vérifiée/);
  assert.equal(active.querySelector('.badge.success'), null);
  root.replaceChildren(...views.jobs(state));
  assert.match(root.querySelector('.job-verification-note').textContent, /résultat vérifié/);
  assert.match(root.querySelector('.job-heading').textContent, /Résultat disponible/);
});

test('the recent request flow keeps three compact excerpts and exposes every full original', (t) => {
  const dom = new JSDOM('<main></main>');
  t.after(() => dom.window.close());
  const state = createInitialStudioState();
  state.jobs = Array.from({ length: 5 }, (_, index) => ({
    id: 'job-' + index,
    status: 'ready',
    request: 'Demande ' + index + ' ' + 'Conserver le contexte. '.repeat(25),
    summary: 'Résultat ' + index + ' ' + 'Explication fournie. '.repeat(20),
  }));
  const root = dom.window.document.querySelector('main');
  root.append(...createViews(dom.window.document).jobs(state));
  assert.equal(root.querySelectorAll(':scope > .job-card').length, 3);
  assert.equal(root.querySelectorAll(':scope > details > .job-card').length, 2);
  const latest = root.querySelector('.job-card');
  assert.ok(latest.querySelector('.job-request').textContent.length <= 151);
  assert.ok(latest.querySelector('.job-summary').textContent.length <= 151);
  const disclosure = latest.querySelector('details');
  assert.equal(disclosure.open, false);
  assert.ok(disclosure.textContent.includes(state.jobs[4].request));
  assert.ok(disclosure.textContent.includes(state.jobs[4].summary));
});
