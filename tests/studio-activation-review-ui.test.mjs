import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createActivationReview } from '../scripts/studio/public/activation-review.js';
import { createControlView } from '../scripts/studio/public/control-view.js';

// Controlled DOM fixtures. Dialog methods simulate native visibility only, not human consent.
function review(id = 'candidate', extra = {}) {
  return {
    version: 7,
    revision: { id, title: 'Candidate locale' },
    activeRevision: 'active',
    reviewKey: 'key-' + id,
    canActivate: true,
    admission: { allowed: true, reason: 'Syntaxe vérifiée, comportement non établi.' },
    control: {
      graph: { revisionId: id, nodes: [], edges: [] },
      risk: {
        severity: 'unknown',
        probability: 'unknown',
        evidenceQuality: 'missing',
        factors: [],
        unknowns: ['persistentData'],
        limits: [],
      },
      autonomy: {
        requestedMode: 'guided',
        action: 'strengthen-verification',
        reasons: ['business-evidence-missing'],
      },
      interventions: [],
    },
    ...extra,
  };
}

function fixture(t, overrides = {}) {
  const dom = new JSDOM(
    '<html lang="fr" data-studio-language-ready><button id="opener">Historique</button>',
    { url: 'http://localhost' },
  );
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  const document = dom.window.document;
  const calls = [],
    applied = [],
    errors = [],
    reads = [];
  if (overrides.locale) dom.window.document.documentElement.lang = overrides.locale;
  const handle = createActivationReview({
    document,
    loadReview: async (id, signal) => {
      reads.push({ id, signal });
      return overrides.loadReview ? overrides.loadReview(id, signal) : review(id);
    },
    activate: async (input) => {
      calls.push(input);
      return overrides.activate ? overrides.activate(input) : { state: { version: 8 } };
    },
    onApplied: (result) => applied.push(result),
    onError: (error) => errors.push(error),
  });
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  const dialog = document.querySelector('dialog');
  return {
    dom,
    document,
    handle,
    dialog,
    calls,
    applied,
    errors,
    reads,
    reason: () => dialog.querySelector('textarea'),
    submit() {
      dialog
        .querySelector('form')
        .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    },
    button(text) {
      return [...dialog.querySelectorAll('button')].find((button) => button.textContent === text);
    },
  };
}

test('review evidence links target their dialog without duplicating the workspace graph identities', async (t) => {
  const report = review();
  report.control.graph.nodes = [
    { id: 'revision:candidate', type: 'revision', fingerprint: 'abc' },
    {
      id: 'evidence:syntax',
      type: 'evidence',
      kind: 'technical',
      sourceId: 'syntax',
      status: 'passed',
      freshness: 'current',
      trusted: true,
      provenance: 'studio-executor',
      criterionIds: [],
    },
  ];
  report.control.graph.edges = [
    { from: 'revision:candidate', to: 'evidence:syntax', relation: 'checked-by' },
  ];
  const f = fixture(t, { loadReview: async () => report });
  f.document.body.append(...createControlView(f.document, report.control, 'candidate'));
  await f.handle.open('candidate');
  const ids = [...f.document.querySelectorAll('[id]')].map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const link of f.dialog.querySelectorAll('a[href^="#"]')) {
    const target = f.document.getElementById(decodeURIComponent(link.hash.slice(1)));
    assert.ok(target && f.dialog.contains(target));
  }
  assert.ok(f.dialog.querySelectorAll('a[href^="#"]').length > 0);
});

test('opening reads context without consent, requires reason and sends exact review identity on explicit submission', async (t) => {
  let resolve;
  const f = fixture(t, {
    activate: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  f.document.getElementById('opener').focus();
  await f.handle.open('candidate');
  assert.equal(f.dialog.open, true);
  assert.equal(f.calls.length, 0);
  assert.match(
    f.dialog.textContent,
    /Cette adoption locale ne relance pas l’agent et ne valide pas les critères/,
  );
  assert.match(f.dialog.textContent, /Des critères attendent une preuve de fonctionnement/);
  f.submit();
  assert.equal(f.calls.length, 0);
  assert.equal(f.document.activeElement, f.reason());
  f.reason().value = '  Accepter cette version locale avec ses limites exposées.  ';
  f.submit();
  f.submit();
  assert.deepEqual(f.calls, [
    {
      version: 7,
      id: 'candidate',
      reviewKey: 'key-candidate',
      reason: 'Accepter cette version locale avec ses limites exposées.',
    },
  ]);
  const cancel = new f.dom.window.Event('cancel', { cancelable: true });
  f.dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true);
  assert.equal(f.button('Fermer').disabled, true);
  resolve({ state: { version: 8 } });
  await setImmediate();
  assert.equal(f.applied.length, 1);
  assert.equal(f.dialog.open, false);
  assert.equal(f.document.activeElement.id, 'opener');
});

test('409 preserves reason, requires refreshed review and a new explicit submission', async (t) => {
  let version = 7;
  const f = fixture(t, {
    loadReview: (id) => review(id, { version, reviewKey: 'key-' + version }),
    activate: async () => {
      if (version === 7) throw Object.assign(new Error('Contexte modifié'), { status: 409 });
      return { state: { version: 9 } };
    },
  });
  await f.handle.open('candidate');
  f.reason().value = 'Motif conservé';
  f.submit();
  await setImmediate();
  assert.equal(f.reason().value, 'Motif conservé');
  assert.match(f.dialog.textContent, /Contexte modifié/);
  assert.equal(f.button('Utiliser cette version').disabled, true);
  f.submit();
  assert.equal(f.calls.length, 1);
  version = 8;
  f.button('Actualiser l’examen').click();
  await setImmediate();
  assert.equal(f.reason().value, 'Motif conservé');
  assert.equal(f.calls.length, 1);
  assert.equal(f.button('Utiliser cette version').disabled, false);
  f.submit();
  await setImmediate();
  assert.equal(f.calls[1].version, 8);
  assert.equal(f.calls[1].reviewKey, 'key-8');
  assert.equal(f.applied.length, 1);
});

test('reopening cancels stale reads, resets reason, and ignores late completion after closing', async (t) => {
  const pending = new Map();
  const f = fixture(t, { loadReview: (id) => new Promise((resolve) => pending.set(id, resolve)) });
  const first = f.handle.open('first');
  f.reason().value = 'Ancienne raison';
  const second = f.handle.open('second');
  assert.equal(f.reads[0].signal.aborted, true);
  assert.equal(f.reason().value, '');
  pending.get('first')(review('first'));
  await first;
  assert.doesNotMatch(f.dialog.textContent, /Candidate locale · first/);
  f.button('Fermer').click();
  assert.equal(f.reads[1].signal.aborted, true);
  pending.get('second')(review('second'));
  await second;
  assert.equal(f.dialog.open, false);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.errors, []);
});

test('technical refusal and untrusted text remain inspectable without an enabled adoption', async (t) => {
  const f = fixture(t, {
    loadReview: (id) =>
      review(id, {
        revision: { id, title: '<img src=x onerror=approve()>' },
        canActivate: false,
        admission: { allowed: false, reason: '<script>Échec technique</script>' },
      }),
  });
  await f.handle.open('candidate');
  assert.equal(f.button('Utiliser cette version').disabled, true);
  assert.match(f.dialog.textContent, /Adoption indisponible : <script>Échec technique<\/script>/);
  assert.match(f.dialog.textContent, /<img src=x onerror=approve\(\)>/);
  assert.equal(f.dialog.querySelectorAll('img,script').length, 0);
  f.reason().value = 'Ne contourne pas le refus';
  f.submit();
  assert.equal(f.calls.length, 0);
});

test('wrong revision and disposal suppress consent and late effects', async (t) => {
  const f = fixture(t, { loadReview: () => review('other') });
  await f.handle.open('candidate');
  assert.match(f.dialog.textContent, /ne correspond pas/);
  assert.equal(f.button('Utiliser cette version').disabled, true);
  f.handle.dispose();
  assert.equal(f.document.querySelector('dialog'), null);
  await f.handle.open('candidate');
  assert.equal(f.reads.length, 1);
  assert.equal(f.calls.length, 0);
});

test('dispose aborts pending review and removes handlers; late mutation completion cannot call onApplied', async (t) => {
  let resolve;
  const f = fixture(t, {
    activate: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await f.handle.open('candidate');
  f.reason().value = 'Fixture uniquement';
  f.submit();
  f.handle.dispose();
  resolve({ state: { version: 8 } });
  await setImmediate();
  assert.equal(f.applied.length, 0);
  assert.equal(f.document.querySelector('dialog'), null);
});

test('a queued native close event from the previous opening does not cancel the new review', async (t) => {
  let resolve;
  const f = fixture(t, {
    loadReview: (id) =>
      new Promise((done) => {
        resolve = () => done(review(id));
      }),
  });
  const first = f.handle.open('first');
  resolve();
  await first;
  f.button('Fermer').click();
  const second = f.handle.open('second');
  f.dialog.dispatchEvent(new f.dom.window.Event('close'));
  assert.equal(f.reads[1].signal.aborted, false);
  resolve();
  await second;
  assert.match(f.dialog.textContent, /Candidate locale · second/);
  assert.equal(f.button('Utiliser cette version').disabled, false);
});

import { setLocale } from '../scripts/studio/public/i18n.js';

test('an open activation review switches language without dropping the reason or reloading evidence', async (t) => {
  const f = fixture(t, { locale: 'en' });
  await f.handle.open('candidate');
  assert.equal(f.dialog.querySelector('h2').textContent, 'Use this version');
  assert.match(f.dialog.textContent, /Some criteria still need behavioral evidence/);
  f.reason().value = 'Mon appréciation personnelle reste identique.';
  const details = f.dialog.querySelector('details');
  if (details) details.open = true;
  setLocale('fr', f.document, f.dom.window);
  assert.equal(f.dialog.querySelector('h2').textContent, 'Utiliser cette version');
  assert.match(f.dialog.textContent, /Des critères attendent une preuve de fonctionnement/);
  assert.equal(f.reason().value, 'Mon appréciation personnelle reste identique.');
  assert.equal(f.reads.length, 1);
  assert.equal(f.calls.length, 0);
  assert.equal(f.dialog.open, true);
  if (details) assert.equal(f.dialog.querySelector('details').open, true);
  setLocale('en', f.document, f.dom.window);
  assert.equal(f.button('Use this version').disabled, false);
  assert.equal(f.reason().value, 'Mon appréciation personnelle reste identique.');
  assert.match(f.dialog.querySelector('[role="status"]').textContent, /Review loaded/);
  f.submit();
  await setImmediate();
  assert.equal(f.calls[0].reason, 'Mon appréciation personnelle reste identique.');
});

test('an activation error changes its authored guidance without rewriting the external diagnostic', async (t) => {
  const f = fixture(t, {
    locale: 'en',
    activate: async () => {
      throw new Error('Diagnostic conservé');
    },
  });
  await f.handle.open('candidate');
  f.reason().value = 'Choix conservé';
  f.submit();
  await setImmediate();
  assert.match(
    f.dialog.querySelector('[role="status"]').textContent,
    /Your reason is preserved.*Diagnostic conservé/,
  );
  setLocale('fr', f.document, f.dom.window);
  assert.match(
    f.dialog.querySelector('[role="status"]').textContent,
    /Votre raison est conservée.*Diagnostic conservé/,
  );
  assert.equal(f.reason().value, 'Choix conservé');
  assert.equal(f.reads.length, 1);
  assert.equal(f.calls.length, 1);
});
