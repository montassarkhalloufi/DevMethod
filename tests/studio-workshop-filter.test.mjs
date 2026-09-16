import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { initialData } from '../examples/studio-ateliers-react/src/features/workshops/model/domain.ts';

const root = path.resolve('examples/studio-ateliers-react/src');
const bundled = await build({
  stdin: {
    contents: `import { StrictMode } from 'react';
      import { createRoot } from 'react-dom/client';
      import { App } from './app/App';
      const root = createRoot(document.getElementById('root'));
      window.unmountTestApp = () => root.unmount();
      root.render(<StrictMode><App /></StrictMode>);`,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  alias: { '@': root },
  define: { 'process.env.NODE_ENV': '"test"' },
  plugins: [
    {
      name: 'filter-test-no-css',
      setup(api) {
        api.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      },
    },
  ],
});

async function until(predicate) {
  for (let count = 0; count < 50; count++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Filter navigation did not settle');
}

async function fixture(t, suffix, drafts = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: `http://localhost:4999/${suffix}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  t.after(() => {
    dom.window.unmountTestApp?.();
    dom.window.close();
  });
  const data = initialData();
  const before = structuredClone(data);
  let writes = 0;
  dom.window.localStorage.setItem('les-ateliers:drafts:v1', JSON.stringify(drafts));
  dom.window.history.replaceState({ preserved: 'navigation-state' }, '', dom.window.location.href);
  dom.window.fetch = async (_url, options = {}) => {
    if (options.method === 'POST') writes++;
    return { ok: true, json: async () => ({ version: 1, data }) };
  };
  dom.window.eval(bundled.outputFiles[0].text);
  const document = dom.window.document;
  await until(() => document.querySelector('.workshop-card'));
  return {
    dom,
    document,
    selected: () => document.querySelector('.filter[aria-pressed="true"]')?.textContent,
    choose: (label) =>
      [...document.querySelectorAll('.filter')].find((item) => item.textContent === label).click(),
    unchanged: () => {
      assert.equal(writes, 0);
      assert.deepEqual(data, before);
      assert.deepEqual(
        JSON.parse(dom.window.localStorage.getItem('les-ateliers:drafts:v1')),
        drafts,
      );
    },
  };
}

test('deep-linked category is restored and browser back/forward preserve drafts, data, other query and anchor', async (t) => {
  const drafts = { 'repair-bike': 'Noa en cours de saisie' };
  const f = await fixture(t, '?campaign=local&category=repair#inscriptions', drafts);
  assert.equal(f.selected(), 'Réparation');
  assert.equal(f.document.querySelectorAll('.workshop-card').length, 1);
  assert.equal(f.document.querySelector('input').value, drafts['repair-bike']);
  f.choose('Cuisine');
  await until(() => f.selected() === 'Cuisine');
  assert.equal(f.dom.window.location.search, '?campaign=local&category=cooking');
  assert.equal(f.dom.window.location.hash, '#inscriptions');
  assert.deepEqual(f.dom.window.history.state, { preserved: 'navigation-state' });
  f.dom.window.history.back();
  await until(() => f.selected() === 'Réparation');
  assert.equal(f.document.querySelector('input').value, drafts['repair-bike']);
  f.dom.window.history.forward();
  await until(() => f.selected() === 'Cuisine');
  f.choose('Tous');
  await until(() => f.selected() === 'Tous');
  assert.equal(f.dom.window.location.search, '?campaign=local');
  assert.equal(f.dom.window.location.hash, '#inscriptions');
  const historyLength = f.dom.window.history.length;
  f.choose('Tous');
  assert.equal(
    f.dom.window.history.length,
    historyLength,
    'Selecting the current URL must not add history entries',
  );
  assert.equal(f.document.querySelectorAll('.workshop-card').length, 3);
  f.unchanged();
});

test('unknown category falls back to all without rewriting unrelated query or anchor', async (t) => {
  const f = await fixture(t, '?category=unknown&source=mail&source=poster#programme');
  assert.equal(f.selected(), 'Tous');
  assert.equal(f.document.querySelectorAll('.workshop-card').length, 3);
  assert.equal(f.dom.window.location.search, '?category=unknown&source=mail&source=poster');
  f.choose('Couture');
  await until(() => f.selected() === 'Couture');
  assert.deepEqual(
    [...new URLSearchParams(f.dom.window.location.search).getAll('source')],
    ['mail', 'poster'],
  );
  assert.equal(f.dom.window.location.hash, '#programme');
  f.dom.window.history.back();
  await until(() => f.selected() === 'Tous');
  f.unchanged();
});

test('filter hook can render without a browser global', async () => {
  const compiled = await build({
    entryPoints: [path.join(root, 'features/workshops/hooks/useWorkshopFilter.ts')],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react'],
  });
  const module = { exports: {} };
  const react = await import('react');
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
    (name) => {
      assert.equal(name, 'react');
      return react;
    },
    module,
    module.exports,
  );

  function Probe() {
    return createElement('span', null, module.exports.useWorkshopFilter().filter);
  }

  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(renderToString(createElement(Probe)), '<span>all</span>');
});
