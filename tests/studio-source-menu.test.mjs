import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createSourceView } from '../scripts/studio/public/source-view.js';

const file = { path: 'app.js', bytes: 19, sha256: 'a'.repeat(64) };

function fixture(t) {
  const dom = new JSDOM(
    '<main id="source-view"></main><button id="outside">Autre action</button>',
    {
      url: 'http://localhost/',
    },
  );
  const { document } = dom.window,
    root = document.querySelector('main');
  const view = createSourceView({
    document,
    root,
    allowEdit: true,
    loadSource: async ({ revisionId, path }) => ({
      revisionId,
      ...file,
      path,
      content: 'export const n = 1;',
      binary: false,
      truncated: false,
    }),
    loadServices: async () => ({
      services: [],
      limitations: ['Sources locales uniquement'],
      sources: { id: 'runtime', title: 'Runtime local', scope: 'runtime', files: [file] },
    }),
    editorApi: {
      read: async () => ({
        version: 1,
        baseRevision: 'base',
        files: [{ path: 'app.js', content: 'export const n = 1;', editable: true }],
        diagnostics: [],
        changedPaths: [],
        criteriaToReview: [],
        buildId: null,
        builtVersion: null,
      }),
    },
  });
  t.after(() => {
    view.destroy();
    dom.window.close();
  });
  const flush = () => new Promise((resolve) => dom.window.setTimeout(resolve, 0));
  const button = (label) => {
    const found = [...root.querySelectorAll('button')].find(
      (element) => (element.getAttribute('aria-label') || element.textContent) === label,
    );
    assert.ok(found, label);
    return found;
  };
  return { root, document, window: dom.window, view, flush, button };
}

test('runtime Options and parent surface selector close each other without hiding the source', async (t) => {
  const f = fixture(t);
  await f.view.showRevision({ id: 'base', title: 'Application', files: [file] });
  const parentMenu = f.root.querySelector('.source-menu');
  parentMenu.querySelector('summary').click();
  f.button('Diagnostic du Studio').click();
  await f.flush();
  const runtimeMenu = f.root.querySelector('.source-runtime .source-menu');
  assert.ok(runtimeMenu);
  runtimeMenu.querySelector('summary').click();
  await f.flush();
  assert.equal(runtimeMenu.open, true);
  assert.equal(parentMenu.open, false);
  parentMenu.querySelector('summary').click();
  await f.flush();
  assert.equal(parentMenu.open, true);
  assert.equal(runtimeMenu.open, false);
  runtimeMenu.querySelector('summary').click();
  await f.flush();
  assert.equal(runtimeMenu.open, true);
  assert.equal(parentMenu.open, false);
  assert.equal(f.root.querySelector('.source-runtime').hidden, false);
  assert.match(f.root.querySelector('.source-runtime code').textContent, /export const n/);
});

test('editor actions and the surface selector are mutually exclusive without changing draft text', async (t) => {
  const f = fixture(t);
  await f.view.showRevision({ id: 'base', title: 'Application', files: [file] });
  f.button('Modifier le code').click();
  await f.flush();
  const more = f.root.querySelector('.editor-more'),
    surface = f.root.querySelector('.source-menu'),
    input = f.root.querySelector('.editor-input');
  assert.ok(more);
  const content = input.value;
  more.querySelector('summary').click();
  await f.flush();
  assert.equal(more.open, true);
  surface.querySelector('summary').click();
  await f.flush();
  assert.equal(surface.open, true);
  assert.equal(more.open, false);
  more.querySelector('summary').click();
  await f.flush();
  assert.equal(more.open, true);
  assert.equal(surface.open, false);
  assert.equal(f.root.querySelector('.editor-input'), input);
  assert.equal(input.value, content);
});

test('Escape closes the dropdown, returns focus to its trigger, and is not consumed by outer workspaces', async (t) => {
  const f = fixture(t);
  const menu = f.root.querySelector('.source-menu'),
    summary = menu.querySelector('summary'),
    action = menu.querySelector('button');
  summary.click();
  await f.flush();
  action.focus();
  let escapedWorkspace = false;
  f.window.addEventListener('keydown', () => {
    escapedWorkspace = true;
  });
  const event = new f.window.KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  action.dispatchEvent(event);
  assert.equal(menu.open, false);
  assert.equal(f.document.activeElement, summary);
  assert.equal(event.defaultPrevented, true);
  assert.equal(escapedWorkspace, false);
});

test('outside clicks and keyboard focus close dropdowns without stealing focus; inner disclosures stay usable', async (t) => {
  const f = fixture(t),
    menu = f.root.querySelector('.source-menu'),
    outside = f.document.getElementById('outside');
  menu.querySelector('summary').click();
  await f.flush();
  const provenance = menu.querySelector('.source-details');
  provenance.querySelector('summary').click();
  await f.flush();
  assert.equal(menu.open, true);
  assert.equal(provenance.open, true);
  outside.focus();
  assert.equal(menu.open, false);
  assert.equal(f.document.activeElement, outside);
  menu.querySelector('summary').click();
  await f.flush();
  outside.dispatchEvent(new f.window.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(menu.open, false);
  assert.equal(f.document.activeElement, outside);
});

test('programmatic openings also close sibling menus and size against remaining viewport space', async (t) => {
  const f = fixture(t);
  await f.view.showRevision({ id: 'base', title: 'Application', files: [file] });
  f.button('Modifier le code').click();
  await f.flush();
  const more = f.root.querySelector('.editor-more'),
    surface = f.root.querySelector('.source-menu');
  surface.querySelector('summary').click();
  await f.flush();
  more.querySelector('summary').getBoundingClientRect = () => ({ bottom: 600 });
  f.window.innerHeight = 800;
  more.open = true;
  await f.flush();
  assert.equal(more.open, true);
  assert.equal(surface.open, false);
  assert.equal(more.style.getPropertyValue('--source-menu-available-height'), '188px');
  f.window.innerHeight = 900;
  f.window.dispatchEvent(new f.window.Event('resize'));
  assert.equal(more.style.getPropertyValue('--source-menu-available-height'), '288px');
});

test('destroy removes document listeners owned by the source menus', async (t) => {
  const f = fixture(t),
    menu = f.root.querySelector('.source-menu');
  f.view.destroy();
  menu.open = true;
  f.document.body.append(menu);
  f.document.getElementById('outside').click();
  await f.flush();
  assert.equal(menu.open, true);
});
