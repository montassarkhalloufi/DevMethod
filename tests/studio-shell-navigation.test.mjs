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

async function fixture(t, customize = () => {}) {
  const state = createInitialStudioState();
  state.project.idea = 'Un projet dont la délégation doit rester stable';
  customize(state);
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:4330/#product' });
  const calls = [];
  const app = mountStudio({
    document: dom.window.document,
    window: dom.window,
    pollMs: 0,
    api: {
      state: async () => structuredClone(state),
      runtime: async () => ({
        previewOrigin: 'http://127.0.0.1:4331',
        agent: { automatic: false },
      }),
      change: async (route, version, input) => {
        calls.push({ route, version, input });
        if (route === 'project') state.project = input;
        state.version++;
        return { state: structuredClone(state) };
      },
    },
  });
  t.after(() => {
    app.destroy();
    dom.window.close();
  });
  await app.ready;
  return { dom, app, calls, state, document: dom.window.document };
}

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
