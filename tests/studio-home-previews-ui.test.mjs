import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `
      import { createRoot } from 'react-dom/client';
      import { createRef } from 'react';
      import { RecentProjects } from './studio-ui/src/features/home/components/RecentProjects';
      export function mount(element, initial) {
        const root = createRoot(element), searchRef = createRef();
        let props = initial;
        const render = () => root.render(<RecentProjects searchRef={searchRef} {...props} />);
        render();
        return { update(value) { props = {...props, ...value}; render(); }, dispose() { root.unmount(); } };
      }`,
    resolveDir: path.resolve('.'),
    sourcefile: 'home-previews-harness.tsx',
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'PreviewTest',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});

const project = (id, preview) => ({
  id,
  name: `Projet ${id}`,
  kind: 'new',
  workspace: `/example/projects/${id}`,
  createdAt: '2026-09-17T10:00:00Z',
  lastOpenedAt: null,
  preview,
});
const ready = (id, revisionId = 'revision-1', selection = 'active') => ({
  status: 'ready',
  revisionId,
  selection,
  url: `http://127.0.0.1:4500/projects/${id}/revisions/${revisionId}/index.html`,
});

async function until(predicate) {
  for (let index = 0; index < 100; index++) {
    if (predicate()) return;
    await delay(5);
  }
  assert.ok(predicate(), 'Expected project preview state not reached');
}

async function fixture(t, projects, observers = true) {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><div id="root"></div></html>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const window = dom.window;
  const intersections = [],
    resizes = [],
    timers = new Map();
  const geometry = { width: 320, top: 100 };
  window.HTMLElement.prototype.getBoundingClientRect = () => ({
    width: geometry.width,
    height: 200,
    top: geometry.top,
    bottom: geometry.top + 200,
    left: 0,
    right: geometry.width,
  });
  class Observer {
    constructor(callback, list) {
      this.callback = callback;
      list.push(this);
    }
    observe(target) {
      this.target = target;
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  if (observers) {
    window.IntersectionObserver = class extends Observer {
      constructor(callback) {
        super(callback, intersections);
      }
    };
    window.ResizeObserver = class extends Observer {
      constructor(callback) {
        super(callback, resizes);
      }
    };
  }
  const setTimer = window.setTimeout.bind(window),
    clearTimer = window.clearTimeout.bind(window);
  let timerId = 10000;
  window.setTimeout = (callback, ms, ...args) => {
    if (ms !== 20000) return setTimer(callback, ms, ...args);
    timers.set(++timerId, callback);
    return timerId;
  };
  window.clearTimeout = (id) => {
    if (!timers.delete(id)) clearTimer(id);
  };
  window.fetch = () => {
    throw new Error('The thumbnail UI must not fetch or execute project APIs.');
  };
  window.eval(bundle.outputFiles[0].text + '\nwindow.PreviewTest = PreviewTest;');
  const opened = [],
    other = [],
    refresh = [];
  const handle = window.PreviewTest.mount(window.document.getElementById('root'), {
    projects,
    loading: false,
    error: '',
    busy: false,
    onOpen: (value) => opened.push(value.id),
    onOther: (trigger) => other.push(trigger),
    onRefresh: () => refresh.push(true),
  });
  t.after(() => {
    handle.dispose();
    window.close();
  });
  await until(() => window.document.querySelectorAll('.home-project').length === projects.length);
  if (observers)
    await until(
      () => intersections.filter((observer) => observer.target).length === projects.length,
    );
  const card = (id) =>
    window.document.querySelector(`[aria-label="Ouvrir Projet ${id}"]`).closest('li');
  const intersect = (id, visible) => {
    const target = card(id).querySelector('.home-project-preview');
    const observer = intersections.findLast(
      (entry) => entry.target === target && !entry.disconnected,
    );
    assert.ok(observer, 'Missing viewport observer');
    observer.callback([{ target, isIntersecting: visible }]);
  };
  return {
    window,
    document: window.document,
    card,
    intersect,
    intersections,
    resizes,
    timers,
    geometry,
    opened,
    other,
    refresh,
    ...handle,
  };
}

test('recent cards distinguish real revision, not generated, source-only and unavailable without fabricated thumbnails', async (t) => {
  const f = await fixture(t, [
    project('generated', ready('generated')),
    project('idea', { status: 'empty', reason: 'no-revision' }),
    project('sources', { status: 'unavailable', reason: 'source-only', revisionId: 'import' }),
    project('broken', { status: 'unavailable', reason: 'state-unavailable' }),
    project('legacy'),
  ]);
  assert.equal(f.document.querySelectorAll('iframe').length, 0);
  assert.match(f.card('idea').textContent, /Aucune version générée/);
  assert.match(f.card('sources').textContent, /Sources sans aperçu/);
  assert.match(f.card('broken').textContent, /Aperçu indisponible/);
  assert.match(f.card('legacy').textContent, /Aperçu indisponible/);
  assert.match(f.card('generated').textContent, /Version active/);
  f.intersect('generated', true);
  await until(() => f.card('generated').querySelector('iframe'));
  const iframe = f.card('generated').querySelector('iframe');
  assert.equal(iframe.src, ready('generated').url);
  assert.equal(iframe.getAttribute('sandbox'), 'allow-scripts');
  assert.equal(iframe.getAttribute('loading'), 'lazy');
  assert.equal(iframe.getAttribute('aria-hidden'), 'true');
  assert.equal(iframe.getAttribute('tabindex'), '-1');
  assert.equal(iframe.getAttribute('referrerpolicy'), 'no-referrer');
  assert.ok(iframe.closest('[inert]'));
  assert.equal(iframe.closest('button'), null);
  assert.equal(iframe.width, '1280');
  assert.equal(iframe.height, '800');
  assert.equal(iframe.style.transform, 'scale(0.25)');
  iframe.dispatchEvent(new f.window.Event('load'));
  await until(() => !f.card('generated').querySelector('.home-preview-loading'));
  assert.doesNotMatch(f.card('generated').textContent, /vérifi|validé|succès/i);
});

test('frames resize as a desktop canvas, leave the viewport and dispose observers cleanly', async (t) => {
  const f = await fixture(t, [project('one', ready('one')), project('two', ready('two'))]);
  f.intersect('one', true);
  await until(() => f.document.querySelectorAll('iframe').length === 1);
  assert.equal(f.card('two').querySelector('iframe'), null);
  f.geometry.width = 640;
  f.resizes.forEach((observer) => observer.callback([]));
  await until(() => f.card('one').querySelector('iframe').style.transform === 'scale(0.5)');
  f.intersect('one', false);
  await until(() => f.document.querySelectorAll('iframe').length === 0);
  await until(() => f.timers.size === 0);
  f.intersect('two', true);
  await until(() => f.card('two').querySelector('iframe'));
  f.dispose();
  assert.ok([...f.intersections, ...f.resizes].every((observer) => observer.disconnected));
  assert.equal(f.timers.size, 0);
});

test('frame errors and bounded load timeout keep an honest state and the project opening action', async (t) => {
  const f = await fixture(t, [
    project('error', ready('error')),
    project('timeout', ready('timeout')),
  ]);
  f.intersect('error', true);
  await until(() => f.card('error').querySelector('iframe'));
  f.card('error').querySelector('iframe').dispatchEvent(new f.window.Event('error'));
  await until(() => f.card('error').textContent.includes('Aperçu indisponible'));
  assert.equal(f.card('error').querySelector('iframe'), null);
  f.card('error').querySelector('.home-project').click();
  assert.deepEqual(f.opened, ['error']);
  // React may commit the fallback before its effect has disposed the old frame's timer.
  await until(() => f.timers.size === 0);
  f.intersect('timeout', true);
  await until(() => f.card('timeout').querySelector('iframe'));
  await until(() => f.timers.size === 1);
  [...f.timers.values()][0]();
  await until(() => f.card('timeout').textContent.includes('Le chargement n’a pas abouti'));
  assert.equal(f.card('timeout').querySelector('iframe'), null);
});

test('an updated revision resets a failed frame and identifies candidates without calling them active', async (t) => {
  const f = await fixture(t, [project('one', ready('one'))]);
  f.intersect('one', true);
  await until(() => f.card('one').querySelector('iframe'));
  f.card('one').querySelector('iframe').dispatchEvent(new f.window.Event('error'));
  await until(() => f.card('one').textContent.includes('Aperçu indisponible'));
  f.update({ projects: [project('one', ready('one', 'revision-2', 'candidate'))] });
  await until(() => f.card('one').querySelector('iframe')?.src.includes('revision-2'));
  assert.match(f.card('one').textContent, /Version proposée/);
  assert.doesNotMatch(f.card('one').textContent, /Version active/);
  assert.ok(f.card('one').querySelector('.home-preview-loading'));
});

test('untrusted or non-isolated destinations never become iframe sources', async (t) => {
  const urls = [
    'https://example.test/projects/unsafe/revisions/revision-1/index.html',
    'javascript:alert(1)',
    'data:text/html,hello',
    'file:///private/notes',
    'http://127.0.0.1:4330/projects/unsafe/revisions/revision-1/index.html',
    'http://user:password@127.0.0.1:4500/projects/unsafe/revisions/revision-1/index.html',
    'http://127.0.0.1:4500/api/home',
    'http://127.0.0.1:4500/projects/other/revisions/revision-1/index.html',
    ready('unsafe').url + '?redirect=external',
    ready('unsafe').url + '#unexpected',
  ];
  const f = await fixture(t, [project('unsafe', { ...ready('unsafe'), url: urls[0] })]);
  f.intersect('unsafe', true);
  for (const url of urls) {
    f.update({ projects: [project('unsafe', { ...ready('unsafe'), url })] });
    await delay(5);
    assert.equal(f.card('unsafe').querySelector('iframe'), null);
    assert.match(f.card('unsafe').textContent, /Aperçu indisponible/);
  }
});

test('search, busy state and existing open/other callbacks remain usable with preview cards', async (t) => {
  const f = await fixture(t, [
    project('école', ready('école')),
    project('atelier', ready('atelier')),
  ]);
  const input = f.document.querySelector('[name="project-search"]');
  Object.getOwnPropertyDescriptor(f.window.HTMLInputElement.prototype, 'value').set.call(
    input,
    'ECOLE',
  );
  input.dispatchEvent(new f.window.Event('input', { bubbles: true }));
  await until(() => f.document.querySelectorAll('.home-project').length === 1);
  f.card('école').querySelector('.home-project').click();
  assert.deepEqual(f.opened, ['école']);
  const other = f.document.querySelector('.home-other');
  other.click();
  assert.equal(f.other[0], other);
  f.update({ busy: true });
  await until(() => other.disabled);
  f.card('école').querySelector('.home-project').click();
  assert.equal(f.opened.length, 1);
  assert.equal(f.document.querySelector('button button'), null);
});

test('without viewport observers the scroll fallback still waits for the visible viewport', async (t) => {
  const f = await fixture(t, [project('one', ready('one'))], false);
  await until(() => f.document.querySelector('iframe'));
  f.geometry.top = 5000;
  f.window.dispatchEvent(new f.window.Event('scroll'));
  await until(() => !f.document.querySelector('iframe'));
  f.geometry.top = 100;
  f.window.dispatchEvent(new f.window.Event('scroll'));
  await until(() => f.document.querySelector('iframe'));
});
