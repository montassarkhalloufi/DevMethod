import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `import { StrictMode, useState } from 'react'; import { createRoot } from 'react-dom/client';
      import { FileExplorer } from './components/FileExplorer'; import { fileGroups, fileAppearance } from './model/explorer';
      const root = createRoot(document.getElementById('root'));
      function Harness({ analysis }) { const [selected, setSelected] = useState(null); return <FileExplorer analysis={analysis} selected={selected} onSelect={path => { window.selections.push(path); setSelected(path); }} />; }
      window.renderExplorer = analysis => root.render(<StrictMode><Harness analysis={analysis} /></StrictMode>);
      window.unmountExplorer = () => root.unmount(); window.fileGroups = fileGroups; window.fileAppearance = fileAppearance;`,
    resolveDir: path.resolve('studio-ui/src/features/project'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});

function file(source, layer = 'unclassified') {
  return {
    path: source,
    sha256: source,
    bytes: 100,
    layer,
    feature: '',
    language: 'unknown',
    role: 'Source',
    test: false,
  };
}

function analysis() {
  return {
    files: [
      'README.md',
      'package.json',
      'src/App.tsx',
      'src/model/types.ts',
      'src/model/domain.ts',
      'src/components/Item10.tsx',
      'src/components/Item2.tsx',
      '.gitignore',
    ].map((source) => file(source)),
    backendDetected: true,
  };
}

async function until(predicate) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Explorer did not reach the expected state');
}

async function fixture(t, preference) {
  const dom = new JSDOM('<section class="project-files-layout"><main id="root"></main></section>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.selections = [];
  window.layoutWidth = 900;
  window.observers = [];
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      window.observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  };
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return { width: this.classList.contains('project-files-layout') ? window.layoutWidth : 230 };
  };
  window.HTMLElement.prototype.setPointerCapture = function (id) {
    this.capturedPointer = id;
  };
  window.HTMLElement.prototype.hasPointerCapture = function (id) {
    return this.capturedPointer === id;
  };
  window.HTMLElement.prototype.releasePointerCapture = function () {
    this.capturedPointer = undefined;
  };
  if (preference !== undefined)
    window.localStorage.setItem('devmethod.studio.explorer-width.v1', preference);
  window.eval(bundle.outputFiles[0].text);
  window.renderExplorer(analysis());
  t.after(() => {
    window.unmountExplorer();
    window.close();
  });
  await until(() => window.document.querySelector('.explorer-resizer'));
  return { window, document: window.document, dom };
}

function input(f, value) {
  const search = f.document.querySelector('input');
  Object.getOwnPropertyDescriptor(f.window.HTMLInputElement.prototype, 'value').set.call(
    search,
    value,
  );
  search.dispatchEvent(new f.window.Event('input', { bubbles: true }));
  search.focus();
}

function key(f, value, shiftKey = false) {
  f.document.querySelector('.explorer-resizer').dispatchEvent(
    new f.window.KeyboardEvent('keydown', {
      key: value,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function pointer(f, type, clientX) {
  const event = new f.window.MouseEvent(type, {
    clientX,
    button: 0,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  f.document.querySelector('.explorer-resizer').dispatchEvent(event);
}

function width(f) {
  return Number(f.document.querySelector('.explorer-resizer').getAttribute('aria-valuenow'));
}

test('the default explorer reproduces source folders, sorts folders first and keeps full source paths', async (t) => {
  const f = await fixture(t);
  const tree = f.window.fileGroups(analysis().files, 'files', '');
  assert.deepEqual(
    Array.from(tree, (entry) => entry.name),
    ['src', '.gitignore', 'package.json', 'README.md'],
  );
  assert.deepEqual(
    Array.from(tree[0].children, (entry) => entry.name),
    ['components', 'model', 'App.tsx'],
  );
  assert.deepEqual(
    Array.from(tree[0].children[0].children, (entry) => entry.name),
    ['Item2.tsx', 'Item10.tsx'],
  );
  assert.equal(f.document.querySelector('select').value, 'files');
  assert.doesNotMatch(
    f.document.querySelector('.project-file-tree').textContent,
    /Non classé|Frontend|Infrastructure/,
  );
  assert.equal(f.document.querySelector('summary[title="src/model"]').textContent, 'model');
  assert.equal(
    f.document.querySelector('button[title="src/model/types.ts"]').getAttribute('aria-label'),
    'types.ts · TypeScript',
  );
});

test('file badges describe the actual extension independently of semantic classification', async (t) => {
  const f = await fixture(t);
  for (const [source, kind] of [
    ['App.tsx', 'react'],
    ['view.jsx', 'react'],
    ['lib.ts', 'typescript'],
    ['run.mjs', 'javascript'],
    ['package.json', 'json'],
    ['styles.css', 'css'],
    ['README.md', 'markdown'],
    ['index.html', 'html'],
    ['compose.yaml', 'yaml'],
    ['.gitignore', 'config'],
    ['Dockerfile', 'config'],
    ['file.bin', 'file'],
  ]) {
    assert.equal(f.window.fileAppearance(file(source)).kind, kind, source);
  }
});

test('folder expansion survives analysis refresh and choosing a search result reveals its original ancestors', async (t) => {
  const f = await fixture(t);
  const folder = f.document.querySelector('summary[title="src/model"]').parentElement;
  folder.querySelector('summary').click();
  await until(() => !folder.open);
  f.window.renderExplorer(analysis());
  await setTimeout(20);
  assert.equal(f.document.querySelector('summary[title="src/model"]').parentElement.open, false);
  input(f, 'types.ts');
  await until(() => f.document.querySelectorAll('.project-file').length === 1);
  assert.equal(f.document.querySelector('summary[title="src/model"]').parentElement.open, true);
  f.document.querySelector('button[title="src/model/types.ts"]').click();
  input(f, '');
  await until(() => f.document.querySelectorAll('.project-file').length === 8);
  assert.equal(f.document.querySelector('summary[title="src/model"]').parentElement.open, true);
  assert.equal(f.document.querySelector('[aria-current="true"]').title, 'src/model/types.ts');
  assert.deepEqual(Array.from(f.window.selections), ['src/model/types.ts']);
  assert.equal(f.document.activeElement, f.document.querySelector('input'));
});

test('explorer width supports keyboard controls and persists only valid versioned preferences', async (t) => {
  const f = await fixture(t, '{"version":1,"width":"wrong"}');
  assert.equal(width(f), 230);
  key(f, 'ArrowRight');
  await until(() => width(f) === 246);
  key(f, 'ArrowRight', true);
  await until(() => width(f) === 286);
  key(f, 'Home');
  await until(() => width(f) === 160);
  key(f, 'End');
  await until(() => width(f) === 420);
  key(f, 'Enter');
  await until(() => width(f) === 230);
  assert.deepEqual(
    JSON.parse(f.window.localStorage.getItem('devmethod.studio.explorer-width.v1')),
    { version: 1, width: 230 },
  );
});

test('pointer resize clamps to available space, restores the preferred width and disables dragging when stacked', async (t) => {
  const f = await fixture(t);
  pointer(f, 'pointerdown', 230);
  pointer(f, 'pointermove', 350);
  pointer(f, 'pointerup', 350);
  await until(() => width(f) === 350);
  assert.equal(
    f.document.querySelector('.project-files-layout').dataset.explorerResizing,
    undefined,
  );
  f.window.layoutWidth = 500;
  f.window.dispatchEvent(new f.window.Event('resize'));
  await until(() => width(f) === 240);
  assert.equal(
    JSON.parse(f.window.localStorage.getItem('devmethod.studio.explorer-width.v1')).width,
    350,
  );
  f.window.layoutWidth = 900;
  f.window.dispatchEvent(new f.window.Event('resize'));
  await until(() => width(f) === 350);
  pointer(f, 'pointerdown', 350);
  pointer(f, 'pointermove', 390);
  pointer(f, 'pointercancel', 390);
  await until(() => width(f) === 350);
  f.window.innerWidth = 640;
  f.window.dispatchEvent(new f.window.Event('resize'));
  await until(() => f.document.querySelector('.explorer-resizer').hidden);
  assert.equal(f.document.querySelector('.explorer-resizer').tabIndex, -1);
  pointer(f, 'pointerdown', 350);
  pointer(f, 'pointermove', 400);
  pointer(f, 'pointerup', 400);
  assert.equal(width(f), 350);
  f.window.unmountExplorer();
  assert.equal(
    f.window.observers.every((observer) => observer.disconnected),
    true,
  );
});
