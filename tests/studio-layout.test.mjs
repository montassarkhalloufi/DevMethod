import { setLocale } from '../scripts/studio/public/i18n.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountStudioLayout } from '../studio-ui/src/layout.ts';

function fixture(t, deniedStorage = false) {
  const dom = new JSDOM(
    fs.readFileSync(new URL('../scripts/studio/public/index.html', import.meta.url), 'utf8'),
    { url: 'http://localhost/' },
  );
  setLocale('fr', dom.window.document, dom.window);
  const { window } = dom,
    { document } = window;
  window.innerWidth = 1440;
  const layout = document.querySelector('.studio-layout');
  layout.style.padding = '16px';
  layout.style.columnGap = '8px';
  Object.defineProperty(layout, 'clientWidth', { get: () => window.innerWidth });
  if (deniedStorage)
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('storage denied');
      },
    });
  const controller = mountStudioLayout(document, window);
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });
  const separator = document.getElementById('conversation-resizer');
  const width = () => Number(separator.getAttribute('aria-valuenow'));
  const key = (value) =>
    separator.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    );
  return { document, window, separator, layout, width, key };
}

test('keyboard resizing respects bounds, persists, and clamps again after a viewport resize', (t) => {
  const f = fixture(t),
    initial = f.width();
  f.key('ArrowRight');
  assert.equal(f.width(), initial + 16);
  f.key('End');
  assert.equal(f.width(), 720);
  f.window.innerWidth = 980;
  f.window.dispatchEvent(new f.window.Event('resize'));
  assert.equal(f.width(), 504);
  f.window.innerWidth = 1440;
  f.window.dispatchEvent(new f.window.Event('resize'));
  assert.equal(f.width(), 720);
  f.key('Home');
  assert.equal(f.width(), 300);
  assert.equal(f.window.localStorage.getItem('devmethod:studio:conversation-width:v1'), '300');
  f.separator.dispatchEvent(new f.window.MouseEvent('dblclick', { bubbles: true }));
  assert.equal(f.width(), initial);
  assert.equal(f.window.localStorage.getItem('devmethod:studio:conversation-width:v1'), null);
});

test('mouse dragging works without browser storage and mobile cannot resize the desktop columns', (t) => {
  const f = fixture(t, true);
  const pointer = (target, type, clientX) => {
    const event = new f.window.MouseEvent(type, {
      button: 0,
      clientX,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    target.dispatchEvent(event);
  };
  pointer(f.separator, 'pointerdown', 400);
  pointer(f.window, 'pointermove', 500);
  assert.equal(f.width(), 515);
  assert.ok(f.layout.classList.contains('layout-resizing'));
  pointer(f.window, 'pointerup', 500);
  assert.equal(f.layout.classList.contains('layout-resizing'), false);
  f.window.innerWidth = 390;
  f.window.dispatchEvent(new f.window.Event('resize'));
  const mobileWidth = f.width();
  f.key('ArrowRight');
  assert.equal(f.width(), mobileWidth);
  assert.equal(f.separator.tabIndex, -1);
});

test('render events retain the visible message anchor when earlier messages are inserted', (t) => {
  const f = fixture(t),
    flow = f.document.getElementById('conversation-flow');
  flow.innerHTML = '<article data-scroll-key="job:old">Reading this message</article>';
  let contentTop = 280;
  Object.defineProperty(flow, 'clientHeight', { value: 200 });
  flow.getBoundingClientRect = () => ({ top: 100, bottom: 300, height: 200 });
  const measure = () => ({
    top: 100 + contentTop - flow.scrollTop,
    bottom: 220 + contentTop - flow.scrollTop,
    height: 120,
  });
  flow.firstElementChild.getBoundingClientRect = measure;
  flow.scrollTop = 250;
  f.document.dispatchEvent(new f.window.Event('studio:before-render'));
  flow.innerHTML =
    '<article data-scroll-key="job:new">New message</article><details><summary>Earlier messages</summary><article data-scroll-key="job:old">Reading this message</article></details>';
  const anchor = flow.querySelector('[data-scroll-key="job:old"]');
  anchor.getBoundingClientRect = () =>
    flow.querySelector('details').open ? measure() : { top: 0, bottom: 0, height: 0 };
  contentTop += 180;
  f.document.dispatchEvent(new f.window.Event('studio:after-render'));
  assert.equal(flow.scrollTop, 430);
  assert.equal(flow.querySelector('details').open, true);
  assert.equal(anchor.getBoundingClientRect().top, 130);
});

test('expanded mode preserves editor DOM and input, restores layout, and respects a consumed Escape', (t) => {
  const f = fixture(t),
    expand = f.document.getElementById('expand-workspace');
  const editor = f.document.createElement('textarea');
  editor.value = 'Unsaved code';
  f.document.getElementById('source-view').append(editor);
  const iframe = f.document.getElementById('preview'),
    originalWidth = f.width();
  expand.click();
  assert.equal(expand.getAttribute('aria-pressed'), 'true');
  assert.equal(f.document.getElementById('discussion').hasAttribute('inert'), true);
  const consumed = new f.window.KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  consumed.preventDefault();
  editor.dispatchEvent(consumed);
  assert.equal(expand.getAttribute('aria-pressed'), 'true');
  editor.dispatchEvent(
    new f.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  assert.equal(expand.getAttribute('aria-pressed'), 'false');
  assert.equal(f.document.getElementById('discussion').hasAttribute('inert'), false);
  assert.equal(f.document.getElementById('preview'), iframe);
  assert.equal(editor.value, 'Unsaved code');
  assert.equal(editor.isConnected, true);
  assert.equal(f.width(), originalWidth);
  assert.equal(f.document.activeElement, expand);
});
