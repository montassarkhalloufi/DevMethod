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

async function fixture(t, customize = () => {}, hash = '') {
  let state = createInitialStudioState();
  state.project.idea = 'Conserver mes lectures';
  customize(state);
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:4330/' + hash });
  const calls = [];
  const runtime = {
    previewOrigin: 'http://127.0.0.1:4331',
    comparisonPreviewOrigin: 'http://127.0.0.1:4332',
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

test('comparison labels, source and iframe follow the candidate identity on the read-only origin', async (t) => {
  const f = await fixture(t, (state) => {
    state.revisions = [revision('current'), revision('candidate')];
    state.activeRevision = 'current';
    state.proposals = [
      {
        id: 'change',
        topic: 'Inscription',
        stage: 'visual',
        question: 'Quel rendu ?',
        baseRevision: 'current',
        selectedOptionId: 'form',
        resolution: null,
        options: [
          {
            id: 'form',
            title: 'Formulaire',
            consequences: ['Saisie directement visible.'],
            preview: {
              kind: 'revision',
              status: 'implemented',
              revisionId: 'candidate',
              route: '/?form=join',
              element: { selector: '#form', text: 'Formulaire' },
            },
          },
        ],
      },
    ];
  });
  assert.equal(f.el('preview-version').value, 'candidate');
  assert.match(f.el('preview-status').textContent, /Proposition non appliquée.*candidate/);
  assert.match(
    f.el('preview').src,
    /^http:\/\/127\.0\.0\.1:4332\/revisions\/candidate\/index.html\?form=join$/,
  );
  assert.match(f.el('preview-data-note').textContent, /lecture seule/);
  f.el('tab-code').click();
  await setImmediate();
  assert.match(f.el('source-view').textContent, /candidate/);
  f.el('tab-product').click();
  f.el('comparison-before').click();
  assert.equal(f.el('preview-version').value, 'current');
  assert.match(f.el('preview-status').textContent, /Version appliquée.*current/);
  assert.match(f.el('preview').src, /:4332\/revisions\/current\//);
  assert.equal(f.state().activeRevision, 'current');
  f.input('request', 'Une saisie à conserver pendant la comparaison');
  f.el('comparison-toggle').click();
  assert.match(f.el('preview').src, /:4331\/revisions\/current\//);
  assert.equal(f.el('preview-version').disabled, false);
  assert.match(f.el('comparison-status').textContent, /Application interactive.*saisies/);
  assert.equal(f.el('comparison-toggle').textContent, 'Comparer');
  assert.equal(f.state().proposals[0].resolution, null);
  assert.equal(f.state().proposals[0].selectedOptionId, 'form');
  await f.app.refresh();
  assert.match(f.el('preview').src, /:4331\/revisions\/current\//);
  assert.equal(f.el('request').value, 'Une saisie à conserver pendant la comparaison');
  f.el('comparison-toggle').click();
  f.el('comparison-proposal').click();
  assert.match(f.el('preview').src, /:4332\/revisions\/candidate\//);
  f.dom.window.document.querySelector('[data-action="preview"][data-id="current"]').click();
  assert.match(f.el('preview').src, /:4331\/revisions\/current\//);
  await f.app.refresh();
  assert.match(f.el('preview').src, /:4331\/revisions\/current\//);
  assert.equal(f.el('preview-version').value, 'current');
  assert.equal(f.el('request').value, 'Une saisie à conserver pendant la comparaison');
  assert.deepEqual(f.calls, []);
});

test('visual directions use exclusive radios but persist only after explicit validation with a reason', async (t) => {
  const f = await fixture(t, (state) => {
    state.designs = ['agenda', 'catalogue'].map((id) => ({
      id,
      file: id + '.png',
      title: id,
      description: 'Direction réelle ' + id,
    }));
    state.selectedDesignId = 'agenda';
  });
  assert.equal(f.el('design-agenda').type, 'radio');
  assert.equal(f.el('design-agenda').checked, true);
  f.el('design-catalogue').click();
  assert.equal(f.el('design-catalogue').checked, true);
  assert.equal(f.el('design-agenda').checked, false);
  assert.equal(f.state().selectedDesignId, 'agenda');
  assert.equal(f.calls.length, 0);
  assert.equal(f.el('design-form').hidden, false);
  f.input('design-reason', 'Les images aident à découvrir les ateliers.');
  await f.app.refresh();
  assert.equal(f.el('design-catalogue').checked, true);
  assert.equal(f.el('design-reason').value, 'Les images aident à découvrir les ateliers.');
  await f.submit('design-form');
  assert.deepEqual(f.calls.at(-1).input, {
    id: 'catalogue',
    reason: 'Les images aident à découvrir les ateliers.',
  });
  assert.equal(f.calls.at(-1).route, 'design');
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
  assert.equal(f.el('agent-status').closest('summary')?.parentElement.open, false);
  assert.equal(f.el('draft-status').closest('details'), null);
  f.input('request', 'Conserver cette demande inachevée');
  assert.match(f.el('draft-status').textContent, /modifié/);
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
  const choices = root.querySelectorAll('.responsibility-role');
  assert.equal(choices.length, 3);
  assert.equal(choices[0].querySelector('.agent-badge').textContent, 'Agent');
  assert.equal(choices[1].querySelector('.person-badge').textContent, 'Vous');
  assert.equal(choices[2].querySelector('.person-badge').textContent, 'Vous');
  assert.doesNotMatch(root.textContent, /Accord explicite enregistré/);
  assert.match(root.querySelector('details').textContent, /ne vaut pas validation humaine/);
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
  const mode = f.el('studio-mode');
  mode.value = 'delegated';
  mode.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  await f.app.settled();
  await setImmediate();
  assert.equal(f.calls.at(-1).route, 'project');
  assert.equal(f.calls.at(-1).input.mode, 'delegated');
  f.api.change = async () => {
    throw Object.assign(new Error('Conflit'), { status: 409 });
  };
  mode.value = 'guided';
  mode.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  await f.app.settled();
  await setImmediate();
  assert.equal(mode.value, 'guided');
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

test('a conception deep link opens its workspace and leaving for Code survives a new load', async (t) => {
  const withRevision = (state) => {
    state.revisions = [revision('v1')];
    state.activeRevision = 'v1';
    state.draft = 'Une demande non envoyée';
  };
  const f = await fixture(t, withRevision, '#journey-frame');
  assert.equal(f.el('tab-journey').getAttribute('aria-selected'), 'true');
  assert.equal(f.el('preview-version').hidden, true);
  f.el('tab-code').click();
  assert.equal(f.dom.window.location.hash, '#code');
  assert.equal(f.el('request').value, 'Une demande non envoyée');
  f.el('tab-checks').click();
  assert.equal(f.dom.window.location.hash, '#checks');
  f.dom.window.history.back();
  for (let i = 0; i < 50 && f.el('tab-code').getAttribute('aria-selected') !== 'true'; i++)
    await new Promise((resolve) => f.dom.window.setTimeout(resolve, 5));
  assert.equal(f.el('tab-code').getAttribute('aria-selected'), 'true');
  f.el('tab-journey').click();
  assert.equal(f.dom.window.location.hash, '#journey-frame');
  assert.equal(f.calls.length, 0);
  const reloaded = await fixture(t, withRevision, '#code');
  assert.equal(reloaded.el('tab-code').getAttribute('aria-selected'), 'true');
  assert.equal(reloaded.el('product').hidden, true);
  assert.equal(reloaded.calls.length, 0);
});

test('displayed proofs and local scenarios follow the comparison without recording a decision or moving focus', async (t) => {
  const f = await fixture(t, (state) => {
    state.revisions = [revision('applied'), revision('candidate')];
    state.activeRevision = 'applied';
    state.checks = [
      { revisionId: 'applied', status: 'passed', kind: 'command', label: 'Only applied' },
    ];
    state.proposals = [
      {
        id: 'choice',
        stage: 'visual',
        question: 'Comparer les rendus',
        baseRevision: 'applied',
        selectedOptionId: 'candidate',
        resolution: null,
        options: [
          {
            id: 'candidate',
            title: 'Rendu réalisé',
            consequences: [],
            preview: { kind: 'revision', status: 'implemented', revisionId: 'candidate' },
          },
          {
            id: 'image',
            title: 'Maquette',
            consequences: [],
            preview: { kind: 'image', referenceId: 'mock.png' },
          },
        ],
      },
    ];
  });
  assert.match(f.el('evidence-dock').textContent, /Aucun contrôle enregistré sur candidat/);
  assert.match(f.el('checks-list').textContent, /Proposition non appliquée/);
  assert.doesNotMatch(f.el('checks-list').textContent, /Only applied/);
  assert.match(f.el('open-preview').href, /:4331\/revisions\/candidate\//);
  const scenario = f.el('preview-scenario');
  scenario.focus();
  scenario.value = 'image';
  scenario.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  assert.equal(f.dom.window.document.activeElement, scenario);
  assert.equal(f.el('proposal-image').hidden, false);
  assert.match(f.el('evidence-dock').textContent, /Simulation visuelle/);
  assert.match(f.el('preview-status').textContent, /Simulation visuelle/);
  assert.doesNotMatch(
    f.el('checks-list').textContent,
    /Only applied|Une application reste à produire/,
  );
  assert.equal(f.el('open-preview').hidden, true);
  f.el('tab-code').click();
  await f.app.refresh();
  assert.equal(f.el('proposal-comparison').hidden, true);
  f.el('tab-product').click();
  assert.equal(f.el('open-preview').hidden, true);
  assert.equal(scenario.value, 'image');
  assert.equal(f.state().proposals[0].selectedOptionId, 'candidate');
  assert.equal(f.state().activeRevision, 'applied');
  assert.deepEqual(f.calls, []);
  f.el('comparison-before').click();
  assert.match(f.el('evidence-dock').textContent, /Version appliquée/);
  assert.match(f.el('checks-list').textContent, /Only applied/);
  f.state().activeRevision = 'candidate';
  f.state().version++;
  await f.app.refresh();
  scenario.value = 'candidate';
  scenario.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  assert.match(f.el('evidence-dock').textContent, /Version appliquée/);
  assert.doesNotMatch(f.el('evidence-dock').textContent, /Proposition non appliquée/);
  assert.match(f.el('evidence-dock').textContent, /Agent.*accord encore attendu/);
});
