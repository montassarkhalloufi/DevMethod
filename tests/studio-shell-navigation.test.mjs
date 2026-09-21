import { setLocale } from '../scripts/studio/public/i18n.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { mountStudio } from '../scripts/studio/public/app.js';
import { createInitialStudioState } from '../scripts/studio/store.mjs';

const html = await readFile(
  new URL('../scripts/studio/public/index.html', import.meta.url),
  'utf8',
);

async function fixture(t, customize = () => {}, runtime = {}) {
  const state = createInitialStudioState();
  state.project.idea = 'Un projet dont la délégation doit rester stable';
  customize(state);
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:4330/#product' });
  setLocale('fr', dom.window.document, dom.window);
  const calls = [];
  const navigations = [];
  const api = {
    state: async () => structuredClone(state),
    runtime: async () => ({
      previewOrigin: 'http://127.0.0.1:4331',
      agent: { automatic: false },
      ...runtime,
    }),
    change: async (route, version, input) => {
      calls.push({ route, version, input });
      if (route === 'project') state.project = input;
      if (route === 'draft') state.draft = input.text;
      state.version++;
      return { state: structuredClone(state) };
    },
  };
  const app = mountStudio({
    document: dom.window.document,
    window: dom.window,
    pollMs: 0,
    api,
    navigate: (url) => navigations.push(url),
  });
  t.after(() => {
    app.destroy();
    dom.window.close();
  });
  await app.ready;
  return { dom, app, api, calls, state, navigations, document: dom.window.document };
}

function type(f, id, value) {
  const input = f.document.getElementById(id);
  input.value = value;
  input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  return input;
}

async function returnHome(f) {
  const event = new f.dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  f.document.getElementById('studio-home-link').dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  await setImmediate();
  return event;
}

test('returning home immediately saves the pending request once and waits for acknowledgement', async (t) => {
  const f = await fixture(t, undefined, { homeUrl: 'http://127.0.0.1:4360' });
  const change = f.api.change;
  let release;
  f.api.change = async (...args) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    return change(...args);
  };
  type(f, 'request', 'Une demande saisie juste avant le retour');
  await returnHome(f);
  await returnHome(f);
  assert.equal(typeof release, 'function');
  assert.deepEqual(f.navigations, []);
  release();
  await f.app.settled();
  await setImmediate();
  assert.deepEqual(
    f.calls.map((call) => call.route),
    ['draft'],
  );
  assert.equal(f.state.draft, 'Une demande saisie juste avant le retour');
  assert.deepEqual(f.navigations, ['http://127.0.0.1:4360/']);
});

test('a failed home save retains the request, error and focus until a successful retry', async (t) => {
  const f = await fixture(t, undefined, { homeUrl: 'http://127.0.0.1:4360' });
  const change = f.api.change;
  f.api.change = async () => {
    throw new Error('Connexion interrompue.');
  };
  const request = type(f, 'request', 'Ne pas perdre cette demande');
  request.focus();
  await returnHome(f);
  await f.app.settled();
  assert.deepEqual(f.navigations, []);
  assert.equal(request.value, 'Ne pas perdre cette demande');
  assert.equal(f.document.activeElement, request);
  assert.match(f.document.getElementById('notice').textContent, /Connexion interrompue/);
  const unload = new f.dom.window.Event('beforeunload', { cancelable: true });
  f.dom.window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, true);
  f.api.change = change;
  await returnHome(f);
  await f.app.settled();
  await setImmediate();
  assert.equal(f.navigations.length, 1);
  const savedUnload = new f.dom.window.Event('beforeunload', { cancelable: true });
  f.dom.window.dispatchEvent(savedUnload);
  assert.equal(savedUnload.defaultPrevented, false);
});

test('returning home exposes unsaved project settings without saving or confirming them implicitly', async (t) => {
  const f = await fixture(t, undefined, { homeUrl: 'http://127.0.0.1:4360' });
  f.dom.window.confirm = () => {
    throw new Error('Unexpected confirmation');
  };
  type(f, 'idea', 'Réglages encore à relire');
  await returnHome(f);
  assert.deepEqual(f.navigations, []);
  assert.deepEqual(f.calls, []);
  assert.equal(f.document.getElementById('project-form').hidden, false);
  assert.equal(f.document.activeElement.id, 'save-project');
  assert.match(f.document.getElementById('notice').textContent, /Enregistrez les réglages/);
  assert.equal(f.document.getElementById('idea').value, 'Réglages encore à relire');
  f.document
    .getElementById('project-form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await f.app.settled();
  await returnHome(f);
  assert.equal(f.navigations.length, 1);
});

test('a new keystroke during the home save keeps the latest text on the current page', async (t) => {
  const f = await fixture(t, undefined, { homeUrl: 'http://127.0.0.1:4360' });
  const change = f.api.change;
  let release;
  f.api.change = async (...args) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    return change(...args);
  };
  const request = type(f, 'request', 'Premier texte');
  await returnHome(f);
  type(f, 'request', 'Texte plus récent');
  request.focus();
  release();
  await f.app.settled();
  await setImmediate();
  assert.deepEqual(f.navigations, []);
  assert.equal(f.state.draft, 'Premier texte');
  assert.equal(request.value, 'Texte plus récent');
  assert.equal(f.document.activeElement, request);
});

test('launcher sessions expose a local home link without changing the current view or draft', async (t) => {
  const { document, dom, app } = await fixture(t, undefined, { homeUrl: 'http://127.0.0.1:4360' });
  const link = document.getElementById('studio-home-link');
  assert.equal(link.href, 'http://127.0.0.1:4360/');
  assert.equal(link.getAttribute('aria-label'), 'Accueil — Mes projets');
  const draft = document.querySelector('textarea');
  draft.value = 'Une idée encore en cours';
  draft.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await app.refresh();
  assert.equal(dom.window.location.hash, '#product');
  assert.equal(draft.value, 'Une idée encore en cours');
});

test('standalone and untrusted home URLs retain the local Studio entry', async (t) => {
  for (const homeUrl of [
    undefined,
    'https://external.example',
    'http://localhost:4360/?token=bad',
    'http://user@localhost:4360',
  ]) {
    const { document } = await fixture(t, undefined, { homeUrl });
    assert.equal(document.getElementById('studio-home-link').getAttribute('href'), '/');
  }
});

test('the header owns one tablist with unique IDs, labelled panels and a form-associated mode', async (t) => {
  const { document } = await fixture(t);
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  assert.equal(document.querySelectorAll('[role="tablist"]').length, 1);
  assert.ok(document.querySelector('.topbar > .workspace-tabs'));
  assert.equal(document.querySelector('#workspace .workspace-tabs'), null);
  assert.deepEqual(
    tabs.map((tab) => tab.dataset.panel),
    ['journey', 'product', 'code', 'choices', 'checks', 'history'],
  );
  const allIds = [...document.querySelectorAll('[id]')].map((node) => node.id);
  assert.equal(new Set(allIds).size, allIds.length);
  for (const tab of tabs) {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    assert.equal(panel.getAttribute('aria-labelledby'), tab.id);
  }
  const mode = document.getElementById('studio-mode');
  assert.equal(mode.form.id, 'project-form');
  assert.deepEqual(
    [...mode.options].map((option) => [option.value, option.textContent]),
    [
      ['guided', 'Guidé'],
      ['devauto', 'DevAuto'],
      ['delegated', 'Autonome'],
    ],
  );
  assert.equal(document.querySelectorAll('[name="mode"]').length, 1);
  const css = [...document.querySelectorAll('link[rel="stylesheet"]')].map(
    (link) => new URL(link.href).pathname,
  );
  assert.ok(css.indexOf('/shell-navigation.css') > css.indexOf('/technical.css'));
  assert.ok(css.indexOf('/source-compact.css') > css.indexOf('/editor.css'));
});

test('header tabs preserve roving focus, selected panels and navigation hashes', async (t) => {
  const { document, dom } = await fixture(t);
  const keyboard = (id, key) =>
    document
      .getElementById(id)
      .dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
  keyboard('tab-product', 'ArrowRight');
  assert.equal(document.activeElement.id, 'tab-code');
  assert.equal(document.getElementById('code').hidden, false);
  assert.equal(document.getElementById('product').hidden, true);
  assert.equal(dom.window.location.hash, '#code');
  keyboard('tab-code', 'End');
  assert.equal(document.activeElement.id, 'tab-history');
  keyboard('tab-history', 'ArrowRight');
  assert.equal(document.activeElement.id, 'tab-journey');
  assert.match(dom.window.location.hash, /^#journey-/);
  keyboard('tab-journey', 'ArrowLeft');
  assert.equal(document.activeElement.id, 'tab-history');
  keyboard('tab-history', 'Home');
  assert.equal(document.activeElement.id, 'tab-journey');
  assert.equal(document.querySelectorAll('[role="tab"][tabindex="0"]').length, 1);
  assert.equal(document.querySelectorAll('[role="tabpanel"]:not([hidden])').length, 1);
  await setImmediate();
});

test('mode dropdown persists the selected mode and preserves explicit responsibilities', async (t) => {
  const delegation = { structure: 'agent', visual: 'user', adoption: 'user' };
  const { document, dom, app, calls } = await fixture(t, (state) => {
    state.project.mode = 'devauto';
    state.project.delegation = delegation;
  });
  const mode = document.getElementById('studio-mode');
  assert.equal(mode.value, 'devauto');
  mode.focus();
  mode.value = 'delegated';
  mode.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await app.settled();
  await setImmediate();
  assert.equal(calls.at(-1).input.mode, 'delegated');
  assert.deepEqual(calls.at(-1).input.delegation, delegation);
  assert.equal(document.getElementById('project-mode').textContent, 'Autonome');
  assert.equal(document.activeElement, mode);
});

test('a dirty project keeps the mode local until its existing save action', async (t) => {
  const { document, dom, app, calls, state } = await fixture(t);
  const idea = document.getElementById('idea');
  idea.value = 'Une idée encore en cours de modification';
  idea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const mode = document.getElementById('studio-mode');
  mode.value = 'devauto';
  mode.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await app.settled();
  await app.refresh();
  assert.equal(calls.length, 0);
  assert.equal(mode.value, 'devauto');
  assert.equal(idea.value, 'Une idée encore en cours de modification');
  assert.notEqual(state.project.idea, idea.value);
  document
    .getElementById('project-form')
    .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await app.settled();
  assert.equal(calls.at(-1).input.mode, 'devauto');
  assert.equal(calls.at(-1).input.idea, idea.value);
});
