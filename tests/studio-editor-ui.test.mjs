import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createCodeEditor } from '../scripts/studio/public/source-editor.js';

function draft(content = 'export const n = 1;', version = 1, extra = {}) {
  return {
    version,
    baseRevision: 'base',
    files: [{ path: 'app.js', content, editable: true }],
    diagnostics: [],
    changedPaths: [],
    criteriaToReview: [{ id: 'capacity', text: 'Respecter la capacité' }],
    buildId: null,
    builtVersion: null,
    ...extra,
  };
}

function setup(t, api, options = {}) {
  const dom = new JSDOM('<main></main>', { url: 'http://127.0.0.1:4330' });
  const root = dom.window.document.querySelector('main');
  const editor = createCodeEditor({
    document: dom.window.document,
    root,
    api,
    debounceMs: 60000,
    ...options,
  });
  const input = root.querySelector('textarea');
  const button = (label) =>
    [...root.querySelectorAll('button')].find(
      (entry) => (entry.getAttribute('aria-label') || entry.textContent) === label,
    );
  const type = (content) => {
    input.value = content;
    input.dispatchEvent(new dom.window.Event('input'));
  };
  t.after(() => {
    editor.destroy();
    dom.window.close();
  });
  return { dom, root, editor, input, button, type };
}

test('source-only snapshots never announce executed controls or a runnable preview', async (t) => {
  const extra = { sourceOnly: true, verificationProtocol: 'source-snapshot-v1' };
  const { editor, type, root, button } = setup(t, {
    read: async () => draft('original', 1, extra),
    save: async (payload) => draft(payload.changes[0].content, 2, extra),
    build: async () =>
      draft('updated', 2, {
        ...extra,
        buildId: 'snapshot',
        builtVersion: 2,
        changedPaths: ['app.js'],
      }),
  });
  await editor.open('base');
  type('updated');
  await editor.flush();
  assert.match(root.querySelector('[role=status]').textContent, /Snapshot des sources enregistré/);
  assert.doesNotMatch(root.querySelector('[role=status]').textContent, /Contrôles exécutés/);
  assert.equal(root.querySelector('iframe').getAttribute('src'), null);
  assert.equal(button('Créer une version des sources').disabled, false);
});

test('creating a source-only candidate keeps valid text distinct from the temporary editing lock', async (t) => {
  const files = [
    { path: 'README.md', content: '# Updated project\n', editable: true },
    { path: 'asset.bin', editable: false },
  ];
  let finishApplied;
  const { editor, input, root, button } = setup(
    t,
    {
      read: async () =>
        draft('', 2, {
          sourceOnly: true,
          files,
          buildId: 'snapshot',
          builtVersion: 2,
          changedPaths: ['README.md'],
        }),
      apply: async () => ({
        activated: false,
        adoptionError: 'Le plan doit être approuvé.',
        state: { activeRevision: 'base' },
        draft: draft('', 3, { sourceOnly: true, files, baseRevision: 'candidate' }),
      }),
    },
    {
      onApplied: () =>
        new Promise((resolve) => {
          finishApplied = resolve;
        }),
    },
  );
  const fileMessage = root.querySelector('.editor-file-message');
  await editor.open('base', 'asset.bin');
  assert.equal(input.disabled, true);
  assert.match(fileMessage.textContent, /binaire ou dépasse la taille éditable/);
  editor.selectFile('README.md');
  assert.equal(input.disabled, false);
  assert.equal(fileMessage.textContent, '');
  button('Créer une version des sources').click();
  await setImmediate();
  assert.equal(editor.getBaseRevision(), 'candidate');
  assert.equal(input.disabled, true, 'the transition stays locked until the application refresh');
  assert.equal(input.value, files[0].content);
  assert.equal(fileMessage.textContent, '', 'a temporary lock must not label text as binary');
  finishApplied();
  await setImmediate();
  assert.equal(input.disabled, false);
  assert.equal(fileMessage.textContent, '');
  assert.match(root.querySelector('[role=status]').textContent, /Version créée sans adoption/);
});

test('code changes survive a save in flight and only the newest acknowledged text becomes buildable', async (t) => {
  let release;
  const saved = [],
    builds = [];
  const { editor, type, input, button } = setup(t, {
    read: async () => draft(),
    save: async (payload) => {
      saved.push(payload);
      if (saved.length === 1)
        await new Promise((resolve) => {
          release = resolve;
        });
      return draft(payload.changes[0].content, payload.version + 1, { changedPaths: ['app.js'] });
    },
    build: async (payload) => {
      builds.push(payload);
      return draft('newest', payload.version, {
        buildId: 'built',
        builtVersion: payload.version,
        changedPaths: ['app.js'],
      });
    },
  });
  await editor.open('base');
  type('first');
  const pending = editor.flush();
  type('newest');
  release();
  await pending;
  assert.equal(input.value, 'newest');
  assert.equal(builds.length, 0);
  assert.equal(button('Adopter cette version').disabled, true);
  await editor.flush();
  assert.equal(saved[1].version, 2);
  assert.equal(saved[1].changes[0].content, 'newest');
  assert.equal(builds[0].version, 3);
  assert.equal(button('Adopter cette version').disabled, false);
});

test('a conflict preserves text and local recovery, without an automatic retry or adoption', async (t) => {
  let calls = 0;
  const { editor, type, input, root, button, dom } = setup(t, {
    read: async () => draft(),
    save: async () => {
      calls++;
      throw Object.assign(new Error('Conflit détecté.'), { status: 409 });
    },
  });
  await editor.open('base');
  type('my unsaved code');
  await editor.flush();
  await editor.flush();
  assert.equal(calls, 1);
  assert.equal(input.value, 'my unsaved code');
  assert.match(dom.window.localStorage.getItem('devmethod-code-draft:base'), /my unsaved code/);
  assert.match(root.querySelector('[role=status]').textContent, /conservées/);
  assert.equal(button('Adopter cette version').disabled, true);
});

test('syntax failure leaves the last good preview visible, exposes direction and cannot be adopted', async (t) => {
  let state = draft('valid', 1, {
    buildId: 'good',
    builtVersion: 1,
    previewUrl: 'http://127.0.0.1:9999/builds/good/index.html',
  });
  const { editor, type, root, button } = setup(t, {
    read: async () => state,
    save: async ({ changes }) =>
      (state = {
        ...state,
        version: 2,
        files: [{ path: 'app.js', content: changes[0].content, editable: true }],
        changedPaths: ['app.js'],
      }),
    build: async () => ({
      ...state,
      diagnostics: [
        {
          severity: 'error',
          file: 'app.js',
          line: 1,
          message: 'Unexpected token',
          direction: 'Refermer la parenthèse.',
        },
      ],
    }),
  });
  await editor.open('base');
  const preview = root.querySelector('.editor-preview');
  const frame = preview.querySelector('iframe');
  const frameWindow = frame.contentWindow;
  assert.equal(preview.open, false);
  preview.open = true;
  preview.open = false;
  assert.equal(frame.contentWindow, frameWindow);
  assert.equal(root.querySelector('.editor-diagnostics-drawer').open, false);
  type('const n = (');
  await editor.flush();
  assert.equal(root.querySelector('.editor-diagnostics-drawer').open, true);
  assert.match(root.querySelector('.editor-diagnostics-drawer > summary').textContent, /1 erreur/);
  assert.equal(preview.querySelector('iframe'), frame);
  assert.equal(frame.contentWindow, frameWindow);
  assert.match(root.querySelector('iframe').src, /good/);
  assert.match(root.querySelector('.editor-diagnostics').textContent, /Refermer la parenthèse/);
  assert.match(root.querySelector('.editor-preview p').textContent, /ne représente pas/);
  assert.equal(button('Adopter cette version').disabled, true);
  assert.equal(root.querySelectorAll('.editor-diagnostics script').length, 0);
});

test('manual adoption uses the exact built draft and a later keystroke disables it again', async (t) => {
  let applied;
  const { editor, type, button } = setup(t, {
    read: async () =>
      draft('ready', 8, { buildId: 'built', builtVersion: 8, changedPaths: ['app.js'] }),
    apply: async (payload) => {
      applied = payload;
      return {
        activated: true,
        revision: { id: 'new' },
        state: { activeRevision: 'new' },
        draft: { ...draft('ready', 9), baseRevision: 'new' },
      };
    },
  });
  await editor.open('base');
  button('Adopter cette version').click();
  await setImmediate();
  assert.deepEqual(applied, {
    version: 8,
    baseRevision: 'base',
    title: 'Modification manuelle du code',
  });
  type('new change');
  assert.equal(button('Adopter cette version').disabled, true);
});

test('local unacknowledged changes recover without overwriting them from polling, and correction stays a draft', async (t) => {
  let correction;
  const { editor, input, button, dom } = setup(
    t,
    { read: async () => draft() },
    {
      onCorrection: (text) => {
        correction = text;
      },
    },
  );
  dom.window.localStorage.setItem(
    'devmethod-code-draft:base',
    JSON.stringify([{ path: 'app.js', content: '<script>untrusted()</script>' }]),
  );
  await editor.open('base');
  await editor.open('base');
  assert.equal(input.value, '<script>untrusted()</script>');
  button('Préparer une correction').click();
  assert.match(correction, /Respecter la capacité/);
  assert.match(correction, /<script>/);
  assert.equal(button('Adopter cette version').disabled, true);
});

test('adoption locks typing until the response so an intermediate keystroke cannot be discarded', async (t) => {
  let release;
  const { editor, input, button } = setup(t, {
    read: async () =>
      draft('ready', 8, { buildId: 'built', builtVersion: 8, changedPaths: ['app.js'] }),
    apply: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  await editor.open('base');
  button('Adopter cette version').click();
  assert.equal(input.disabled, true);
  release({
    activated: true,
    state: { activeRevision: 'new' },
    draft: { ...draft('ready', 9), baseRevision: 'new' },
  });
  await setImmediate();
  assert.equal(input.disabled, false);
  assert.equal(input.value, 'ready');
});

test('only the current draft iframe can report a runtime error and disable adoption', async (t) => {
  const ready = draft('ready', 8, {
    buildId: 'built',
    builtVersion: 8,
    changedPaths: ['app.js'],
    previewUrl: 'http://127.0.0.1:4999/builds/built/',
  });
  const { editor, root, button, dom } = setup(t, { read: async () => ready });
  await editor.open('base');
  const send = (source, origin, buildId) =>
    dom.window.dispatchEvent(
      new dom.window.MessageEvent('message', {
        source,
        origin,
        data: {
          type: 'devmethod-runtime-error',
          buildId,
          message: 'Missing variable',
          file: 'app.js',
          line: 2,
        },
      }),
    );
  send(dom.window, 'http://127.0.0.1:4999', 'built');
  send(root.querySelector('iframe').contentWindow, 'https://invalid.example', 'built');
  send(root.querySelector('iframe').contentWindow, 'http://127.0.0.1:4999', 'old');
  assert.equal(button('Adopter cette version').disabled, false);
  send(root.querySelector('iframe').contentWindow, 'http://127.0.0.1:4999', 'built');
  assert.equal(button('Adopter cette version').disabled, true);
  assert.match(root.querySelector('.editor-diagnostics').textContent, /Missing variable/);
});

test('opening after another version became active recovers the previous draft instead of overwriting it', async (t) => {
  const calls = [];
  const { editor, input, button } = setup(t, {
    read: async (base) => {
      calls.push(base);
      if (base) throw Object.assign(new Error('Another base'), { status: 409 });
      return draft('saved earlier');
    },
  });
  await editor.open('new-active');
  assert.deepEqual(calls, ['new-active', undefined]);
  assert.equal(input.value, 'saved earlier');
  assert.equal(button('Reprendre la version active').hidden, false);
});

test('explicit conflict reload retires the old local recovery only after a successful read', async (t) => {
  let reads = 0;
  const api = {
    read: async () => {
      if (++reads === 2) throw new Error('Temporary outage');
      return draft(reads === 1 ? 'initial' : 'theirs');
    },
    save: async () => {
      throw Object.assign(new Error('Conflict'), { status: 409 });
    },
  };
  const { editor, type, input, button, dom } = setup(t, api);
  dom.window.HTMLAnchorElement.prototype.click = () => {};
  await editor.open('base');
  type('mine');
  await editor.flush();
  button('Relire le brouillon partagé (copie à télécharger)').click();
  await setImmediate();
  assert.equal(input.value, 'mine');
  assert.match(dom.window.localStorage.getItem('devmethod-code-draft:base'), /mine/);
  button('Relire le brouillon partagé (copie à télécharger)').click();
  await setImmediate();
  assert.equal(input.value, 'theirs');
  assert.equal(dom.window.localStorage.getItem('devmethod-code-draft:base'), null);
  editor.destroy();
  const reopened = setup(t, api, { storage: dom.window.localStorage });
  await reopened.editor.open('base');
  assert.equal(reopened.input.value, 'theirs');
});

test('changing the base removes the previous preview and retires its downloaded local recovery', async (t) => {
  const { editor, type, root, button, dom } = setup(t, {
    read: async () =>
      draft('A', 1, {
        buildId: 'A',
        builtVersion: 1,
        previewUrl: 'http://127.0.0.1:4999/builds/A/',
      }),
    reset: async () => draft('B', 2, { baseRevision: 'base-B' }),
  });
  dom.window.HTMLAnchorElement.prototype.click = () => {};
  await editor.open('base');
  type('A unsaved');
  editor.setActiveRevision('base-B');
  button('Reprendre la version active').click();
  await setImmediate();
  assert.equal(root.querySelector('iframe').hidden, true);
  assert.equal(root.querySelector('iframe').getAttribute('src'), null);
  assert.equal(dom.window.localStorage.getItem('devmethod-code-draft:base'), null);
  assert.match(root.querySelector('.editor-preview p').textContent, /Aucun aperçu valide/);
});

test('editing invalidates server markers while retaining explicitly historical diagnostics until a fresh check', async (t) => {
  const oldDiagnostic = {
    file: 'app.js',
    line: 1,
    severity: 'error',
    message: 'SyntaxError: Unexpected token =',
  };
  let state = draft('export const = ;', 2, {
    diagnostics: [oldDiagnostic],
    changedPaths: ['app.js'],
  });
  let markers = [];
  let mounted = false;
  const { editor, type, root, button, dom } = setup(
    t,
    {
      read: async () => state,
      save: async ({ version, changes }) =>
        (state = draft(changes[0].content, version + 1, {
          diagnostics: [],
          changedPaths: ['app.js'],
        })),
      build: async ({ version }) =>
        (state = {
          ...state,
          diagnostics: [],
          buildId: 'fresh-build',
          builtVersion: version,
        }),
    },
    {
      loadWidget: async () => ({
        mountCodeWidget: async () => {
          mounted = true;
          return {
            setDocument() {},
            setDiagnostics(value) {
              markers = structuredClone(value);
            },
            dispose() {},
          };
        },
      }),
    },
  );
  dom.window.Worker = class {};
  await editor.open('base');
  await setImmediate();
  assert.equal(mounted, true);
  assert.ok(markers.some((item) => item.message === oldDiagnostic.message));
  root.querySelector('.editor-auto input').checked = false;
  type('export const valid = 1;');
  assert.equal(markers.length, 0);
  const diagnosticText = root.querySelector('.editor-diagnostics').textContent;
  assert.match(diagnosticText, /SyntaxError/);
  assert.match(diagnosticText, /ancien|précédent|obsolète/i);
  assert.equal(button('Adopter cette version').disabled, true);
  await editor.flush();
  assert.equal(markers.length, 0);
  assert.doesNotMatch(root.querySelector('.editor-diagnostics').textContent, /SyntaxError/);
  assert.equal(button('Adopter cette version').disabled, false);
});

test('external explorer selection preserves edits and emits analysis refresh only after saving', async (t) => {
  const selections = [];
  const source = draft('export const n = 1;', 1, {
    files: [
      { path: 'app.js', content: 'export const n = 1;', editable: true },
      { path: 'backend/api.js', content: 'export const api = true;', editable: true },
    ],
  });
  const { editor, type, input, dom } = setup(
    t,
    {
      read: async () => source,
      save: async (payload) => ({
        ...source,
        version: 2,
        changedPaths: ['app.js'],
        files: source.files.map((file) => ({
          ...file,
          content:
            payload.changes.find((change) => change.path === file.path)?.content || file.content,
        })),
      }),
      build: async () => ({ ...source, version: 2, diagnostics: [] }),
    },
    { onSelect: (path) => selections.push(path) },
  );
  let notifications = 0;
  dom.window.document.addEventListener('studio:editor-saved', () => notifications++);
  await editor.open('base', 'app.js');
  type('export const n = 2;');
  assert.equal(notifications, 0);
  assert.equal(editor.selectFile('backend/api.js'), true);
  assert.match(input.value, /api = true/);
  assert.equal(editor.selectFile('app.js'), true);
  assert.equal(input.value, 'export const n = 2;');
  assert.equal(editor.selectFile('outside.js'), false);
  await editor.flush();
  assert.equal(notifications, 1);
  assert.ok(selections.includes('backend/api.js'));
});
