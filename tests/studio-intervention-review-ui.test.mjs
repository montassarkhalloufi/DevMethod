import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createControlView } from '../scripts/studio/public/control-view.js';

const control = {
  graph: { revisionId: 'candidate', nodes: [], edges: [] },
  risk: {
    severity: 'unknown',
    probability: 'unknown',
    evidenceQuality: 'missing',
    factors: [],
    unknowns: [],
    limits: [],
  },
  autonomy: { action: 'continue', reasons: [], requestedMode: 'guided' },
  interventions: [],
};
test('resolved control retains an explicit entry to examine consequences again', () => {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  dom.window.document
    .querySelector('main')
    .append(...createControlView(dom.window.document, control, 'candidate'));
  assert.equal(
    dom.window.document.querySelector('[data-action="intervention-review"]')?.dataset.id,
    'candidate',
  );
  dom.window.close();
});

import { setImmediate } from 'node:timers/promises';
import { createInterventionReview } from '../scripts/studio/public/intervention-review.js';
import { createStudioApi } from '../scripts/studio/public/api.js';

function review(id = 'candidate') {
  return {
    version: 3,
    revision: { id, title: 'Candidate fixture <img src=x>' },
    base: { id: 'base', title: 'Base locale' },
    reviewKey: 'key-' + id,
    canReview: true,
    reason: null,
    control: { ...control, graph: { ...control.graph, revisionId: id } },
    consequences: {
      protocol: 'studio-consequences-v1',
      fingerprint: 'source',
      baseFingerprint: 'base-source',
      contextFingerprint: 'context',
      changes: [{ kind: 'modified', path: 'app.js' }],
      signals: [],
      data: { status: 'available', version: 1, nonEmpty: false, bytes: 20 },
      issue: null,
      limits: ['Une absence d’indice ne prouve pas une absence d’impact.'],
      reviews: [],
    },
  };
}

function fixture(t, overrides = {}) {
  const dom = new JSDOM(
    '<html lang="fr" data-studio-language-ready><button id="open">Ouvrir</button>',
    { url: 'http://localhost' },
  );
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  const calls = [],
    applied = [],
    reads = [];
  if (overrides.locale) dom.window.document.documentElement.lang = overrides.locale;
  const handle = createInterventionReview({
    document: dom.window.document,
    loadReview: async (id, signal) => {
      reads.push({ id, signal });
      return overrides.loadReview ? overrides.loadReview(id, signal) : review(id);
    },
    saveReview: async (input) => {
      calls.push(input);
      return overrides.saveReview
        ? overrides.saveReview(input)
        : { state: { version: 4 }, decision: {} };
    },
    onApplied: (result) => applied.push(result),
    onError() {},
  });
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  const dialog = dom.window.document.querySelector('dialog');
  const field = (name) => dialog.querySelector(`[name="${name}"]`);
  const button = (text) =>
    [...dialog.querySelectorAll('button')].find((node) => node.textContent === text);
  const fill = (values = {}) => {
    for (const [name, value] of Object.entries({
      persistentData: 'affected',
      contractChanged: 'affected',
      resolution: 'accept-local',
      scope: 'Copie locale du candidat',
      reason: 'Conséquences examinées dans la fixture DOM',
      ...values,
    })) {
      field(name).value = value;
      field(name).dispatchEvent(new dom.window.Event('input'));
    }
  };
  const submit = () =>
    dialog
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  return { dom, handle, dialog, field, button, fill, submit, calls, applied, reads };
}

test('opening has no chosen assessment and submit records exact scope without closing or losing text', async (t) => {
  let saved = false;
  const f = fixture(t, {
    saveReview: async () => {
      saved = true;
      return { state: { version: 4 } };
    },
    loadReview: async (id) => {
      const next = review(id);
      if (saved)
        next.consequences.reviews = [
          {
            decisionId: 'new',
            resolution: 'accept-local',
            assessment: { persistentData: 'affected', contractChanged: 'affected' },
            scope: 'Copie locale',
            reason: 'Nouvel avis relu',
            freshness: 'current',
          },
        ];
      return next;
    },
  });
  await f.handle.open('candidate');
  for (const name of ['persistentData', 'contractChanged', 'resolution', 'scope', 'reason'])
    assert.equal(f.field(name).value, '');
  f.submit();
  assert.equal(f.calls.length, 0);
  assert.equal(f.dialog.querySelector('img'), null);
  assert.match(f.dialog.textContent, /Faits observés/);
  assert.match(f.dialog.textContent, /Indices à examiner/);
  f.fill();
  f.submit();
  await setImmediate();
  assert.deepEqual(f.calls[0], {
    version: 3,
    revisionId: 'candidate',
    reviewKey: 'key-candidate',
    resolution: 'accept-local',
    assessment: { persistentData: 'affected', contractChanged: 'affected' },
    scope: 'Copie locale du candidat',
    reason: 'Conséquences examinées dans la fixture DOM',
  });
  assert.equal(f.dialog.open, true);
  assert.equal(f.field('scope').value, 'Copie locale du candidat');
  assert.match(f.dialog.textContent, /Appréciation enregistrée/);
  assert.match(f.dialog.textContent, /Nouvel avis relu/);
  assert.equal(f.applied.length, 1);
});

test('unknown assessment and positive facts prevent accept-local but not keep-stopped', async (t) => {
  const f = fixture(t, {
    loadReview: async () => {
      const value = review();
      value.consequences.data.nonEmpty = true;
      value.consequences.signals = [{ kind: 'contract-changed', path: 'api.js', line: 5 }];
      return value;
    },
  });
  await f.handle.open('candidate');
  for (const values of [
    { persistentData: 'unknown' },
    { persistentData: 'not-affected' },
    { contractChanged: 'not-affected' },
  ]) {
    f.fill(values);
    f.submit();
    assert.equal(f.calls.length, 0);
  }
  f.fill({ persistentData: 'unknown', contractChanged: 'unknown', resolution: 'keep-stopped' });
  f.submit();
  await setImmediate();
  assert.equal(f.calls.length, 1);
});

test('409 preserves all fields and requires a fresh key plus another explicit click', async (t) => {
  let reads = 0;
  const f = fixture(t, {
    loadReview: async () => ({ ...review(), version: ++reads + 2, reviewKey: 'key-' + reads }),
    saveReview: async () => {
      throw Object.assign(new Error('Examen périmé'), { status: 409 });
    },
  });
  await f.handle.open('candidate');
  f.fill();
  f.submit();
  await setImmediate();
  assert.equal(f.field('reason').value, 'Conséquences examinées dans la fixture DOM');
  f.submit();
  assert.equal(f.calls.length, 1);
  f.button('Actualiser l’examen').click();
  await setImmediate();
  assert.equal(f.calls.length, 1);
  f.submit();
  await setImmediate();
  assert.equal(f.calls[1].reviewKey, 'key-2');
});

test('closing or superseding reads ignores late data and disposal ignores late submit', async (t) => {
  let finish;
  const f = fixture(t, {
    loadReview: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = f.handle.open('old');
  f.button('Fermer').click();
  assert.equal(f.reads[0].signal.aborted, true);
  finish(review('old'));
  await pending;
  assert.doesNotMatch(f.dialog.textContent, /Candidate fixture/);
  const next = f.handle.open('new');
  finish(review('new'));
  await next;
  assert.equal(f.field('scope').value, '');
  const late = fixture(t, {
    saveReview: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  await late.handle.open('candidate');
  late.fill();
  late.submit();
  late.submit();
  assert.equal(late.calls.length, 1);
  late.handle.dispose();
  finish({ state: {} });
  await setImmediate();
  assert.equal(late.applied.length, 0);
});

test('unavailable context and response for another revision never submit', async (t) => {
  const f = fixture(t, {
    loadReview: async () => ({ ...review(), canReview: false, reason: 'Données illisibles' }),
  });
  await f.handle.open('candidate');
  f.fill();
  f.submit();
  assert.equal(f.calls.length, 0);
  assert.match(f.dialog.textContent, /Données illisibles/);
  await f.handle.open('another');
  assert.match(f.dialog.textContent, /ne correspond pas/);
});

test('API uses dedicated user endpoint and exact POST body', async () => {
  const calls = [];
  const api = createStudioApi(async (url, init) => {
    calls.push([url, init]);
    return { ok: true, json: async () => ({}) };
  });
  const controller = new AbortController();
  await api.interventionReview('candidate', controller.signal);
  await api.interventionDecision({ version: 3, revisionId: 'candidate' });
  assert.equal(calls[0][0], '/api/intervention-review?revision=candidate');
  assert.equal(calls[0][1].signal, controller.signal);
  assert.equal(calls[1][0], '/api/intervention-review');
  assert.equal(calls[1][1].credentials, 'same-origin');
  assert.deepEqual(JSON.parse(calls[1][1].body), { version: 3, revisionId: 'candidate' });
});

test('tool interventions retain their broker path while non-tool interventions offer the local review', () => {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const basic = {
    revisionId: 'candidate',
    impact: 'unknown',
    reasons: ['consequences-held'],
    uncertainties: [],
    evidenceIds: [],
    options: ['inspect'],
    recommendation: 'arbitrate',
  };
  dom.window.document.querySelector('main').append(
    ...createControlView(
      dom.window.document,
      {
        ...control,
        interventions: [
          { ...basic, id: 'local' },
          { ...basic, id: 'tool', requestId: 'tool' },
        ],
      },
      'candidate',
    ),
  );
  const buttons = [...dom.window.document.querySelectorAll('button')].filter(
    (button) => button.textContent === 'Résoudre cette intervention',
  );
  assert.equal(buttons.length, 1);
  assert.match(dom.window.document.body.textContent, /maintiennent l’arrêt/);
  dom.window.close();
});

test('consequence assessment graph retains local provenance and scoped effects without upgrading signals to facts', () => {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const value = {
    ...control,
    graph: {
      ...control.graph,
      nodes: [
        {
          id: 'decision:local',
          type: 'consequence-assessment',
          revisionId: 'candidate',
          decisionId: 'local',
          resolution: 'accept-local',
          assessment: { persistentData: 'affected', contractChanged: 'unknown' },
          scope: 'Copie locale uniquement',
          reason: '<script>Pas une preuve</script>',
          freshness: 'reevaluate',
          contributes: false,
          holds: false,
        },
      ],
      edges: [],
    },
    autonomy: { ...control.autonomy, reasons: ['persistent-data', 'contract-changed'] },
  };
  const root = dom.window.document.querySelector('main');
  root.append(...createControlView(dom.window.document, value, 'candidate'));
  assert.match(root.textContent, /Appréciation locale des conséquences/);
  assert.match(root.textContent, /Contribution actuelle à l’appréciation : non/);
  assert.match(root.textContent, /Contrats consommés : inconnu/);
  assert.match(root.textContent, /source utilisateur, distincte des observations/);
  assert.match(root.textContent, /Un changement de contrat est signalé et doit être examiné/);
  assert.match(root.textContent, /présentes ou signalées/);
  assert.equal(root.querySelector('script'), null);
  dom.window.close();
});

test('saved historical observations remain distinct from changed current facts after re-reading', async (t) => {
  let saved = false;
  const observations = {
    data: {
      status: 'available',
      version: 1,
      nonEmpty: true,
      bytes: 123,
      privateValue: 'PRIVATE_DATA_SENTINEL',
    },
    changes: [{ path: 'old-contract.js', kind: 'modified' }],
    signals: [{ kind: 'contract-changed', path: 'old-contract.js', line: 4 }],
    evidence: [
      {
        id: 'old-proof',
        status: 'passed',
        freshness: 'current',
        trusted: true,
        provenance: 'studio-adapter',
        fingerprint: 'old-fingerprint',
      },
    ],
    unknowns: ['contractChanged'],
    riskFactors: [
      {
        id: 'contract-changed',
        severity: 'moderate',
        reason: 'Indice historique, compatibilité non démontrée.',
      },
    ],
    limits: ['Périmètre historique limité.'],
  };
  const f = fixture(t, {
    saveReview: async () => {
      saved = true;
      return { state: { version: 4 } };
    },
    loadReview: async () => {
      const next = review();
      if (saved) {
        next.consequences.data = { status: 'available', version: 2, nonEmpty: false, bytes: 20 };
        next.consequences.changes = [{ path: 'current-contract.js', kind: 'added' }];
        next.consequences.reviews = [
          {
            decisionId: 'historical',
            resolution: 'accept-local',
            assessment: { persistentData: 'affected', contractChanged: 'affected' },
            scope: 'Périmètre ancien',
            reason: 'Examen historique',
            freshness: 'reevaluate',
            contributes: false,
            holds: false,
            observations,
          },
        ];
      }
      return next;
    },
  });
  await f.handle.open('candidate');
  f.fill();
  f.submit();
  await setImmediate();
  assert.match(f.dialog.textContent, /Données locales : disponibles · version 2 · vides/);
  assert.match(
    f.dialog.textContent,
    /Observations au moment de l’examen — leur validité actuelle est recalculée/,
  );
  assert.match(
    f.dialog.textContent,
    /Données à l’examen : disponibles · version 1 · non vides · 123 octets/,
  );
  assert.match(f.dialog.textContent, /1 changement\(s\), 1 indice\(s\), 1 preuve\(s\)/);
  assert.match(f.dialog.textContent, /Changement à l’examen : modifié · old-contract.js/);
  assert.match(f.dialog.textContent, /Ajouté : current-contract.js/);
  assert.match(f.dialog.textContent, /Preuve à l’examen : old-proof/);
  assert.doesNotMatch(f.dialog.textContent, /PRIVATE_DATA_SENTINEL/);
  assert.equal(observations.data.version, 1);
});

test('historical details are bounded while preserving totals and render only whitelisted observation fields', () => {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const observation = {
    data: { status: 'missing', version: null, nonEmpty: null, bytes: 0 },
    changes: Array.from({ length: 12 }, (_, index) => ({
      kind: 'added',
      path: `file-${index}.js`,
    })),
    signals: [],
    evidence: [],
    unknowns: [],
    riskFactors: [],
    limits: ['<script>historical untrusted text</script>'],
  };
  const node = {
    id: 'decision:old',
    type: 'consequence-assessment',
    revisionId: 'candidate',
    decisionId: 'old',
    resolution: 'keep-stopped',
    assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
    scope: 'Fixture',
    reason: 'Fixture',
    freshness: 'obsolete',
    observations: observation,
  };
  const root = dom.window.document.querySelector('main');
  root.append(
    ...createControlView(
      dom.window.document,
      { ...control, graph: { ...control.graph, nodes: [node] } },
      'candidate',
    ),
  );
  assert.match(root.textContent, /12 changement\(s\)/);
  assert.match(root.textContent, /7 autre\(s\) conservé\(s\), non affiché\(s\)/);
  assert.doesNotMatch(root.textContent, /file-5.js/);
  assert.equal(root.querySelector('script'), null);
  dom.window.close();
});

test('review fields are separated and technical identities and history are progressive disclosures', async (t) => {
  const next = review();
  next.consequences.reviews = [
    {
      decisionId: 'historical',
      resolution: 'keep-stopped',
      assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
      scope: 'Ancien périmètre',
      reason: 'Avis historique',
      freshness: 'reevaluate',
    },
  ];
  const f = fixture(t, { loadReview: async () => next });
  await f.handle.open('candidate');
  for (const name of ['persistentData', 'contractChanged', 'resolution', 'scope', 'reason']) {
    const input = f.field(name);
    const group = input.parentElement;
    assert.ok(group.matches('form > .delegation-field'));
    assert.equal(group.style.marginBlock, '12px');
    assert.equal(group.children.length, 2);
    assert.equal(group.firstElementChild.tagName, 'LABEL');
    assert.equal(group.firstElementChild.htmlFor, input.id);
  }
  const facts = f.dialog.querySelector('[aria-label="Faits et indices de conséquences"]');
  const details = [...facts.querySelectorAll(':scope > details')];
  assert.deepEqual(
    details.map((entry) => entry.querySelector('summary').textContent),
    ['Identités de l’examen', 'Appréciations conservées (1)'],
  );
  assert.ok(details.every((entry) => !entry.open));
  assert.match(details[0].textContent, /studio-consequences-v1.*base-source.*context/);
  assert.match(details[1].textContent, /Avis historique/);
  assert.equal(f.dialog.querySelector('.activation-review-control').closest('details'), null);
  assert.match(facts.querySelector('p').textContent, /Données locales/);
  f.fill();
  f.button('Actualiser l’examen').click();
  await setImmediate();
  assert.match(
    f.dialog.querySelector('[role="status"]').textContent,
    /Examen actualisé\. Vos saisies sont conservées/,
  );
  assert.equal(f.field('persistentData').value, 'affected');
  assert.equal(f.calls.length, 0);
});

import { setLocale } from '../scripts/studio/public/i18n.js';

test('an open consequence review switches authored labels while preserving assessment, scope and reason', async (t) => {
  const f = fixture(t, { locale: 'en' });
  await f.handle.open('candidate');
  assert.equal(f.dialog.querySelector('h2').textContent, 'Review consequences');
  assert.match(f.dialog.textContent, /Observed facts/);
  f.fill();
  const original = Object.fromEntries(
    ['persistentData', 'contractChanged', 'resolution', 'scope', 'reason'].map((name) => [
      name,
      f.field(name).value,
    ]),
  );
  setLocale('fr', f.dom.window.document, f.dom.window);
  assert.equal(f.dialog.querySelector('h2').textContent, 'Examiner les conséquences');
  assert.match(f.dialog.textContent, /Faits observés/);
  assert.equal(f.field('persistentData').selectedOptions[0].textContent, 'Concerné');
  for (const [name, value] of Object.entries(original)) assert.equal(f.field(name).value, value);
  assert.equal(f.reads.length, 1);
  assert.equal(f.calls.length, 0);
  assert.equal(f.dialog.open, true);
  setLocale('en', f.dom.window.document, f.dom.window);
  assert.equal(f.field('persistentData').selectedOptions[0].textContent, 'Affected');
  assert.match(f.dialog.querySelector('[role="status"]').textContent, /Review loaded/);
  assert.equal(f.button('Save assessment').disabled, false);
  f.submit();
  await setImmediate();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].scope, original.scope);
  assert.equal(f.calls[0].reason, original.reason);
  assert.deepEqual(f.calls[0].assessment, {
    persistentData: original.persistentData,
    contractChanged: original.contractChanged,
  });
});
