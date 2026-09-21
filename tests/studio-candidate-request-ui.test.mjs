import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createCandidateRequest } from '../scripts/studio/public/candidate-request.js';
import { createStudioApi } from '../scripts/studio/public/api.js';
import { createViews } from '../scripts/studio/public/views.js';
import { setLocale } from '../scripts/studio/public/i18n.js';

function review(id = 'candidate', extra = {}) {
  return {
    version: 7,
    revision: { id, title: 'Candidate' },
    activeRevision: 'active',
    reviewKey: 'key-' + id,
    canRequest: true,
    reason: 'Fixture diagnostic',
    control: null,
    ...extra,
  };
}

function fixture(t, overrides = {}) {
  const dom = new JSDOM(
    '<html lang="en" data-studio-language-ready><textarea id="main">Main unsaved request</textarea><button id="opener">Versions</button>',
    { url: 'http://localhost' },
  );
  const { document } = dom.window;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  const calls = [],
    reads = [],
    queued = [];
  const handle = createCandidateRequest({
    document,
    loadReview: async (id, signal) => {
      reads.push({ id, signal });
      return overrides.loadReview ? overrides.loadReview(id, signal) : review(id);
    },
    requestChanges: async (input) => {
      calls.push(input);
      return overrides.requestChanges
        ? overrides.requestChanges(input)
        : { state: { version: 8 }, job: { id: 'queued' } };
    },
    onQueued: (result) => queued.push(result),
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
    reads,
    queued,
    text: () => dialog.querySelector('textarea'),
    button: (text) => [...dialog.querySelectorAll('button')].find((b) => b.textContent === text),
    submit: () =>
      dialog
        .querySelector('form')
        .dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true })),
  };
}

test('explicit submission queues exact candidate context once without touching the main draft', async (t) => {
  let resolve;
  const f = fixture(t, {
    requestChanges: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await f.handle.open('candidate');
  assert.equal(f.calls.length, 0);
  assert.match(f.dialog.textContent, /limits|Limits/);
  f.submit();
  assert.equal(f.calls.length, 0);
  f.text().value = '  Fix the failed scenario  ';
  f.submit();
  f.submit();
  assert.deepEqual(f.calls, [
    {
      version: 7,
      revisionId: 'candidate',
      reviewKey: 'key-candidate',
      request: 'Fix the failed scenario',
    },
  ]);
  assert.equal(f.document.querySelector('#main').value, 'Main unsaved request');
  resolve({ state: { version: 8, activeRevision: 'active' }, job: { id: 'queued' } });
  await setImmediate();
  assert.equal(f.queued.length, 1);
  assert.equal(f.dialog.open, false);
});

test('conflict preserves request and refresh requires a second explicit submission', async (t) => {
  let version = 7;
  const f = fixture(t, {
    loadReview: (id) => review(id, { version, reviewKey: 'key-' + version }),
    requestChanges: async () => {
      if (version === 7) throw Object.assign(new Error('Context changed'), { status: 409 });
      return { state: { version: 9 }, job: { id: 'queued' } };
    },
  });
  await f.handle.open('candidate');
  f.text().value = 'Keep this exact text';
  f.submit();
  await setImmediate();
  assert.equal(f.text().value, 'Keep this exact text');
  assert.equal(f.button('Request changes').disabled, true);
  f.submit();
  assert.equal(f.calls.length, 1);
  version = 8;
  f.button('Refresh review').click();
  await setImmediate();
  assert.equal(f.text().value, 'Keep this exact text');
  assert.equal(f.calls.length, 1);
  f.submit();
  await setImmediate();
  assert.equal(f.calls[1].reviewKey, 'key-8');
  assert.equal(f.queued.length, 1);
});

test('closed or superseded reads and disposed writes cannot update the dialog or notify queued', async (t) => {
  const pending = new Map();
  let complete;
  const f = fixture(t, {
    loadReview: (id) => new Promise((resolve) => pending.set(id, resolve)),
    requestChanges: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  });
  const first = f.handle.open('first');
  const second = f.handle.open('second');
  assert.equal(f.reads[0].signal.aborted, true);
  pending.get('first')(review('first'));
  await first;
  assert.doesNotMatch(f.dialog.textContent, /Candidate · first/);
  pending.get('second')(review('second'));
  await second;
  f.text().value = 'Fix';
  f.submit();
  f.handle.dispose();
  complete({ state: { version: 8 }, job: { id: 'queued' } });
  await setImmediate();
  assert.equal(f.queued.length, 0);
  assert.equal(f.document.querySelector('dialog'), null);
});

test('refusal, mismatched revision and injected titles never permit submission', async (t) => {
  const f = fixture(t, {
    loadReview: (id) =>
      review(id, {
        canRequest: false,
        reason: '<script>blocked</script>',
        revision: { id, title: '<img src=x>' },
      }),
  });
  await f.handle.open('candidate');
  assert.equal(f.button('Request changes').disabled, true);
  assert.equal(f.dialog.querySelectorAll('script,img').length, 0);
  f.text().value = 'Fix';
  f.submit();
  assert.equal(f.calls.length, 0);
  const wrong = fixture(t, { loadReview: () => review('wrong') });
  await wrong.handle.open('candidate');
  assert.equal(wrong.button('Request changes').disabled, true);
  assert.match(wrong.dialog.textContent, /does not match/);
});

test('FR/EN changes preserve request, selection and evidence without requests', async (t) => {
  const f = fixture(t);
  await f.handle.open('candidate');
  f.text().value = 'My exact draft';
  f.text().setSelectionRange(3, 8);
  setLocale('fr', f.document, f.dom.window);
  assert.equal(f.dialog.querySelector('h2').textContent, 'Corriger cette version');
  assert.equal(f.text().value, 'My exact draft');
  assert.equal(f.text().selectionStart, 3);
  assert.equal(f.text().selectionEnd, 8);
  setLocale('en', f.document, f.dom.window);
  assert.equal(f.dialog.querySelector('h2').textContent, 'Request changes');
  assert.equal(f.reads.length, 1);
  assert.equal(f.calls.length, 0);
});

test('versions expose correction only for non-active candidates and API uses dedicated exact contracts', async () => {
  const dom = new JSDOM('<html lang="en" data-studio-language-ready>', { url: 'http://localhost' });
  const views = createViews(dom.window.document);
  const revisions = ['active', 'candidate'].map((id) => ({
    id,
    title: id,
    summary: '',
    createdAt: '2026-01-01T00:00:00Z',
    files: [],
  }));
  dom.window.document.body.append(
    ...views.versions({ activeRevision: 'active', revisions, checks: [] }, 'active'),
  );
  const buttons = [...dom.window.document.querySelectorAll('[data-action="candidate-request"]')];
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].dataset.id, 'candidate');
  assert.equal(buttons[0].textContent, 'Request changes');
  const calls = [];
  const api = createStudioApi(async (path, options) => {
    calls.push({ path, options });
    return { ok: true, json: async () => ({}) };
  });
  const signal = new AbortController().signal;
  await api.loadCandidateRequest('candidate /?', signal);
  const input = { version: 7, revisionId: 'candidate', reviewKey: 'key', request: 'Fix' };
  await api.requestCandidateChanges(input);
  assert.equal(
    new URL(calls[0].path, 'http://localhost').searchParams.get('revision'),
    'candidate /?',
  );
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[1].path, '/api/candidate-request');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), input);
  dom.window.close();
});

import { readFile } from 'node:fs/promises';
import { mountStudio } from '../scripts/studio/public/app.js';
import { createInitialStudioState } from '../scripts/studio/store.mjs';

test('mounted Studio version action opens its own dialog and refreshes queued state without adopting or rewriting draft', async (t) => {
  const html = await readFile(
    new URL('../scripts/studio/public/index.html', import.meta.url),
    'utf8',
  );
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:4330/#product' });
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  const state = createInitialStudioState();
  state.activeRevision = 'active';
  state.draft = 'Independent main draft';
  state.revisions = ['active', 'candidate'].map((id) => ({
    id,
    title: id,
    summary: '',
    createdAt: '2026-01-01T00:00:00Z',
    files: [],
    profile: 'source-only',
  }));
  const changes = [],
    requests = [];
  let reads = 0;
  const api = {
    state: async () => {
      reads++;
      return structuredClone(state);
    },
    runtime: async () => ({ agent: { automatic: false } }),
    change: async (...args) => {
      changes.push(args);
      throw new Error('Unexpected ordinary mutation');
    },
    loadCandidateRequest: async (id) => review(id, { version: state.version }),
    requestCandidateChanges: async (input) => {
      requests.push(input);
      state.version++;
      return { state: structuredClone(state), job: { id: 'queued' } };
    },
  };
  const app = mountStudio({ document: dom.window.document, window: dom.window, api, pollMs: 0 });
  t.after(() => {
    app.destroy();
    dom.window.close();
  });
  await app.ready;
  const document = dom.window.document;
  document.querySelector('[data-action="candidate-request"]').click();
  await setImmediate();
  const dialog = document.querySelector('dialog[open]');
  assert.ok(dialog);
  assert.equal(requests.length, 0);
  dialog.querySelector('textarea').value = 'Candidate-specific correction';
  dialog
    .querySelector('form')
    .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await setImmediate();
  await app.settled();
  await setImmediate();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].revisionId, 'candidate');
  assert.deepEqual(changes, []);
  assert.equal(document.getElementById('request').value, 'Independent main draft');
  assert.equal(state.activeRevision, 'active');
  assert.ok(reads >= 2);
  assert.equal(dialog.open, false);
});

test('closing suppresses late reads and late successful queue notifications', async (t) => {
  let resolveRead, resolveWrite;
  const f = fixture(t, {
    loadReview: (id) =>
      new Promise((resolve) => {
        resolveRead = () => resolve(review(id));
      }),
    requestChanges: () =>
      new Promise((resolve) => {
        resolveWrite = resolve;
      }),
  });
  const pending = f.handle.open('candidate');
  f.button('Close').click();
  resolveRead();
  await pending;
  assert.equal(f.dialog.open, false);
  assert.equal(f.reads[0].signal.aborted, true);
  assert.equal(f.calls.length, 0);
  const reopened = f.handle.open('candidate');
  resolveRead();
  await reopened;
  assert.equal(f.text().maxLength, 20000);
  f.text().value = 'Retained while the server responds';
  f.submit();
  f.dialog.close(); // Programmatic/native lifecycle closure, even though the close button is disabled while saving.
  resolveWrite({ state: { version: 8 }, job: { id: 'queued' } });
  await setImmediate();
  assert.equal(f.queued.length, 0);
  assert.equal(f.dialog.open, false);
  assert.equal(f.text().value, 'Retained while the server responds');
});

test('known server reasons and errors relocalize while unknown diagnostics remain verbatim', async (t) => {
  const f = fixture(t, {
    loadReview: (id) =>
      review(id, {
        reason: 'Les fichiers de ce candidat seront utilisés ; la version active est conservée.',
      }),
    requestChanges: async () => {
      throw new Error('Le candidat ou son contexte a changé ; actualisez avant d’envoyer.');
    },
  });
  await f.handle.open('candidate');
  assert.match(
    f.dialog.textContent,
    /This candidate’s files will be used; the active version is preserved/,
  );
  f.text().value = 'Fix';
  f.submit();
  await setImmediate();
  assert.match(f.dialog.textContent, /The candidate or its context has changed/);
  setLocale('fr', f.document, f.dom.window);
  assert.match(f.dialog.textContent, /Le candidat ou son contexte a changé/);
  assert.equal(f.text().value, 'Fix');
  const unknown = fixture(t, {
    loadReview: (id) => review(id, { reason: 'Diagnostic précis PRIVATE_IDENTIFIER' }),
  });
  await unknown.handle.open('candidate');
  assert.match(unknown.dialog.textContent, /Diagnostic précis PRIVATE_IDENTIFIER/);
});

import { translateAgentMessage } from '../scripts/studio/public/i18n.js';

test('candidate request history distinguishes copied source from active base without rewriting user text', () => {
  const dom = new JSDOM('<html lang="en" data-studio-language-ready>', { url: 'http://localhost' });
  const state = createInitialStudioState();
  state.jobs = [
    {
      id: 'child',
      status: 'queued',
      request: 'Texte utilisateur intact',
      createdAt: '2026-01-01T00:00:00Z',
      baseRevision: 'active-base',
      candidateRequest: { sourceRevision: 'source-candidate', parentJobId: 'parent' },
    },
  ];
  dom.window.document.body.append(...createViews(dom.window.document).jobs(state));
  const text = dom.window.document.body.textContent;
  assert.match(text, /Request active base: active-base/);
  assert.match(text, /Candidate source version: source-candidate/);
  assert.match(text, /Parent request: parent/);
  assert.match(text, /Texte utilisateur intact/);
  const fr = 'La demande liée au candidat reste suspendue par ses contrôles courants.';
  const en = translateAgentMessage(fr, 'en');
  assert.equal(en, 'The candidate-linked request remains suspended by its current controls.');
  assert.equal(translateAgentMessage(en, 'fr'), fr);
  dom.window.close();
});
