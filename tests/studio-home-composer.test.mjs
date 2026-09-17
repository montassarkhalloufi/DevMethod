import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `import { createRoot } from 'react-dom/client';
      import { IdeaComposer } from './studio-ui/src/features/home/components/IdeaComposer';
      import { useIdeaComposer } from './studio-ui/src/features/home/hooks/useIdeaComposer';
      function Harness(props) {
        const composer = useIdeaComposer(props);
        return <IdeaComposer operation={props.operation} composer={composer} />;
      }
      export function mount(host, props) {
        const root = createRoot(host);
        const update = (value) => root.render(<Harness {...value} />);
        update(props);
        return { update, dispose: () => root.unmount() };
      }`,
    resolveDir: path.resolve('.'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ComposerTest',
  jsx: 'automatic',
  loader: { '.svg': 'dataurl', '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const reply = (value, ok = true) => ({ ok, json: async () => value });
const idle = { phase: 'idle', project: null, error: '' };
const catalog = {
  options: [
    {
      id: 'resend',
      title: 'Resend',
      description: 'Courriels transactionnels',
      capabilities: ['email'],
    },
    {
      id: 'supabase',
      title: 'Supabase',
      description: 'Base de données',
      capabilities: ['database'],
    },
  ],
  capabilities: [
    { id: 'email', title: 'Courriel' },
    { id: 'database', title: 'Données' },
  ],
};

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected composer state not reached');
}

function fixture(t, { fetcher = async () => reply(catalog), reader } = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new window.Event('close'));
  };
  if (reader) window.FileReader = reader;
  const calls = [];
  window.fetch = (url, init) => {
    if (url === '/api/mcp')
      return Promise.resolve(reply({ presets: [], connections: [], supported: true }));
    calls.push({ url, init });
    return fetcher(url, init);
  };
  window.eval(bundle.outputFiles[0].text + '\nwindow.ComposerTest = ComposerTest;');
  const submissions = [];
  let edits = 0;
  let props = {
    operation: idle,
    onSubmit: (input) => submissions.push(JSON.parse(JSON.stringify(input))),
    onEdit: () => edits++,
  };
  const handle = window.ComposerTest.mount(window.document.getElementById('root'), props);
  t.after(() => {
    handle.dispose();
    window.close();
  });
  return {
    window,
    document: window.document,
    calls,
    submissions,
    get edits() {
      return edits;
    },
    update(value) {
      props = { ...props, ...value };
      handle.update(props);
    },
    dispose: handle.dispose,
  };
}

function button(f, label, scope = f.document) {
  return [...scope.querySelectorAll('button')].find(
    (node) => (node.getAttribute('aria-label') || node.textContent).trim() === label,
  );
}

const dialog = (f) => f.document.querySelector('dialog');
const idea = (f) => f.document.querySelector('[name="idea"]');

function type(f, selector, value) {
  const node = f.document.querySelector(selector);
  const proto =
    node.tagName === 'TEXTAREA'
      ? f.window.HTMLTextAreaElement.prototype
      : node.tagName === 'SELECT'
        ? f.window.HTMLSelectElement.prototype
        : f.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
  node.dispatchEvent(
    new f.window.Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
  );
}

function submit(f) {
  f.document
    .querySelector('form')
    .dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
}

function beforeUnload(f) {
  const event = new f.window.Event('beforeunload', { cancelable: true });
  f.window.dispatchEvent(event);
  return event.defaultPrevented;
}

async function openOptions(f, section = 'references') {
  await until(() => idea(f));
  const trigger =
    section === 'references'
      ? button(f, 'Ajouter des références')
      : [...f.document.querySelectorAll('.composer-option-actions button')].find((node) =>
          node.textContent.includes(section === 'tools' ? 'Outils' : 'Design'),
        );
  trigger.focus();
  trigger.click();
  await until(() => dialog(f).open);
  return trigger;
}

function selectFiles(f, files) {
  const input = f.document.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new f.window.Event('change', { bubbles: true }));
}

test('the inline idea starts immediately, type suggestions preserve written text, and keyboard submits once', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  assert.equal(idea(f).value, '');
  assert.equal(f.document.querySelector('[name="launch-action"]').value, 'build');
  submit(f);
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.activeElement, idea(f));
  button(f, 'Application').click();
  await until(() => idea(f).value.includes('application web'));
  type(f, '[name="idea"]', 'Un carnet pour mon association.');
  await setTimeout(10);
  button(f, 'Présentation web').click();
  await setTimeout(10);
  assert.equal(idea(f).value, 'Un carnet pour mon association.');
  idea(f).dispatchEvent(
    new f.window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }),
  );
  submit(f);
  assert.equal(f.submissions.length, 1);
  assert.deepEqual(f.submissions[0], {
    kind: 'new',
    idea: 'Un carnet pour mon association.',
    launch: {
      action: 'build',
      projectType: 'slides',
      design: '',
      connectors: [],
      mcpConnectionIds: [],
      links: [],
      attachments: [],
    },
  });
});

test('gallery seeds append once, update preferences and focus, clear stale errors and defer while busy', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  submit(f);
  await until(() => f.document.querySelector('[role="alert"]'));
  f.update({
    seed: {
      id: 1,
      idea: 'Une galerie photographique',
      projectType: 'website',
      design: 'Éditorial',
    },
  });
  await until(
    () =>
      idea(f).value === 'Une galerie photographique' && !f.document.querySelector('[role="alert"]'),
  );
  await until(() => f.document.activeElement === idea(f));
  type(f, '[name="idea"]', 'Mon brief existant');
  await setTimeout(10);
  f.update({
    seed: { id: 2, idea: 'Un second angle', projectType: 'prototype', design: 'Chaleureux' },
  });
  await until(() => idea(f).value === 'Mon brief existant\n\nUn second angle');
  f.update({});
  await setTimeout(10);
  assert.equal(idea(f).value, 'Mon brief existant\n\nUn second angle');
  f.update({
    operation: { ...idle, phase: 'creating' },
    seed: { id: 3, idea: 'Une suite', projectType: 'app' },
  });
  await until(() => idea(f).disabled);
  assert.equal(idea(f).value, 'Mon brief existant\n\nUn second angle');
  f.update({ operation: idle });
  await until(() => idea(f).value.endsWith('\n\nUne suite'));
  submit(f);
  assert.equal(f.submissions[0].launch.projectType, 'app');
  assert.equal(f.submissions[0].launch.design, 'Chaleureux');
});

test('one native options dialog keeps panel input, restores focus on Escape and transmits the selected context', async (t) => {
  const f = fixture(t);
  const trigger = await openOptions(f);
  assert.equal(f.document.querySelectorAll('dialog').length, 1);
  assert.equal(f.document.activeElement.id, 'composer-options-title');
  type(f, '#composer-reference-link', 'https://example.com/inspiration');
  await setTimeout(10);
  button(f, 'Ajouter').click();
  await until(() => f.document.querySelectorAll('.composer-reference-url').length === 1);
  selectFiles(f, [
    new f.window.File(['Une référence écrite'], 'brief.md', { type: 'text/markdown' }),
  ]);
  await until(() => f.document.querySelector('[aria-label="Fichiers joints"]'));
  button(f, 'Design', dialog(f)).click();
  await setTimeout(10);
  f.document.querySelector('.composer-style').click();
  button(f, 'Projet', dialog(f)).click();
  await setTimeout(10);
  type(f, '[name="project-name"]', 'Mon projet');
  button(f, 'Outils et services', dialog(f)).click();
  await until(() => f.document.querySelector('[value="resend"]'));
  f.document.querySelector('[value="resend"]').click();
  await setTimeout(10);
  const cancel = new f.window.Event('cancel', { cancelable: true });
  dialog(f).dispatchEvent(cancel);
  if (!cancel.defaultPrevented) dialog(f).close();
  await until(() => !dialog(f).open);
  assert.equal(f.document.activeElement, trigger);
  type(f, '[name="idea"]', 'Une demande concrète');
  type(f, '[name="launch-action"]', 'plan');
  await setTimeout(10);
  submit(f);
  const input = f.submissions[0];
  assert.equal(input.name, 'Mon projet');
  assert.equal(input.launch.action, 'plan');
  assert.match(input.launch.design, /^Sobre et précis\./);
  assert.deepEqual(input.launch.connectors, ['resend']);
  assert.deepEqual(input.launch.links, ['https://example.com/inspiration']);
  assert.deepEqual(input.launch.attachments, [
    {
      name: 'brief.md',
      mime: 'text/markdown',
      base64: Buffer.from('Une référence écrite').toString('base64'),
    },
  ]);
  button(f, 'Retirer Resend').focus();
  button(f, 'Retirer Resend').click();
  await until(() => !button(f, 'Retirer Resend'));
  assert.equal(f.document.activeElement, idea(f));
});

test('catalog failure is retryable and tool search, categories and selection survive panel changes', async (t) => {
  let unavailable = true;
  const f = fixture(t, {
    fetcher: async () => {
      if (unavailable) throw new Error('Catalogue hors ligne');
      return reply(catalog);
    },
  });
  await openOptions(f, 'tools');
  await until(() => button(f, 'Réessayer le catalogue'));
  assert.match(dialog(f).querySelector('[role="alert"]').textContent, /Chargement impossible/);
  unavailable = false;
  button(f, 'Réessayer le catalogue').click();
  await until(() => f.document.querySelectorAll('.composer-tool-option').length === 2);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].url, '/api/home/catalog');
  assert.equal(f.calls[0].init.credentials, 'same-origin');
  assert.equal(f.calls[0].init.method, undefined);
  f.document.querySelector('[value="supabase"]').click();
  type(f, '[name="composer-tool-search"]', 'donnees');
  await until(() => f.document.querySelectorAll('.composer-tool-option').length === 1);
  assert.match(f.document.querySelector('.composer-tool-option').textContent, /Supabase/);
  type(f, 'select[aria-label="Catégorie des outils"]', 'email');
  await until(() => dialog(f).textContent.includes('Aucun outil ne correspond'));
  button(f, 'Références', dialog(f)).click();
  button(f, 'Outils et services', dialog(f)).click();
  await setTimeout(10);
  assert.equal(f.document.querySelector('[name="composer-tool-search"]').value, 'donnees');
  assert.equal(
    f.document.querySelector('select[aria-label="Catégorie des outils"]').value,
    'email',
  );
  type(f, 'select[aria-label="Catégorie des outils"]', 'all');
  await until(() => f.document.querySelector('[value="supabase"]'));
  assert.equal(f.document.querySelector('[value="supabase"]').checked, true);
  assert.equal(f.calls.length, 2);
});

test('references reject unsafe links and oversized files without removing accepted context', async (t) => {
  const f = fixture(t);
  await openOptions(f);
  type(f, '#composer-reference-link', 'https://user:secret@example.com');
  await setTimeout(10);
  button(f, 'Ajouter').click();
  await until(() => dialog(f).textContent.includes('sans identifiant ni mot de passe'));
  assert.equal(
    f.document.querySelector('#composer-reference-link').value,
    'https://user:secret@example.com',
  );
  type(f, '#composer-reference-link', 'https://example.com');
  await setTimeout(10);
  button(f, 'Ajouter').click();
  await until(() => f.document.querySelector('.composer-reference-url'));
  selectFiles(f, [new f.window.File(['notes'], 'notes.txt', { type: 'text/plain' })]);
  await until(() => f.document.querySelector('[aria-label="Fichiers joints"] li'));
  selectFiles(f, [
    new f.window.File([new Uint8Array(2 * 1024 * 1024 + 1)], 'too-large.png', {
      type: 'image/png',
    }),
  ]);
  await until(() => dialog(f).textContent.includes('entre 1 octet et 2 Mio'));
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 1);
  assert.match(f.document.querySelector('[aria-label="Fichiers joints"]').textContent, /notes.txt/);
  assert.equal(
    f.document.querySelector('.composer-reference-url').textContent,
    'https://example.com/',
  );
  selectFiles(f, [
    new f.window.File(['valid'], 'valid.txt', { type: 'text/plain' }),
    new f.window.File(['bad'], 'script.js', { type: 'application/javascript' }),
  ]);
  await until(() => dialog(f).textContent.includes('Choisissez une image'));
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 1);
});

test('pending file reads disable edits and submission, apply one batch, and abort on disposal', async (t) => {
  const readers = [];
  class DeferredReader {
    constructor() {
      readers.push(this);
      this.aborted = false;
    }
    readAsDataURL(file) {
      this.file = file;
    }
    abort() {
      this.aborted = true;
      this.onabort?.();
    }
    finish(value) {
      this.result = 'data:text/plain;base64,' + Buffer.from(value).toString('base64');
      this.onload?.();
    }
  }
  const f = fixture(t, { reader: DeferredReader });
  await openOptions(f);
  selectFiles(f, [
    new f.window.File(['one'], 'one.txt', { type: 'text/plain' }),
    new f.window.File(['two'], 'two.txt', { type: 'text/plain' }),
  ]);
  await until(() => idea(f).disabled);
  assert.equal(readers.length, 2);
  assert.equal(f.document.querySelector('[name="reference-link"]').disabled, true);
  submit(f);
  assert.equal(f.submissions.length, 0);
  readers[0].finish('one');
  await setTimeout(10);
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 0);
  readers[1].finish('two');
  await until(() => !idea(f).disabled);
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 2);
  selectFiles(f, [new f.window.File(['three'], 'three.txt', { type: 'text/plain' })]);
  await until(() => readers.length === 3);
  f.dispose();
  assert.equal(readers[2].aborted, true);
});

test('busy state alone cannot suppress the unsaved guard and errors retain the draft until disposal', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  assert.equal(beforeUnload(f), false);
  type(f, '[name="idea"]', 'Un projet à conserver');
  await until(() => beforeUnload(f));
  f.update({ operation: { ...idle, phase: 'opening' } });
  await until(() => idea(f).disabled);
  assert.equal(beforeUnload(f), true);
  assert.equal(button(f, 'Ajouter des références').disabled, true);
  f.update({ operation: { ...idle, error: 'Ouverture impossible' } });
  await until(() => !idea(f).disabled && beforeUnload(f));
  assert.equal(idea(f).value, 'Un projet à conserver');
  assert.match(f.document.querySelector('[role="alert"]').textContent, /Ouverture impossible/);
  f.dispose();
  assert.equal(beforeUnload(f), false);
});

test('the tool picker caps preferences at twelve and preserves the selection after rejection', async (t) => {
  const options = Array.from({ length: 13 }, (_, index) => ({
    id: `tool-${index}`,
    title: `Outil ${index}`,
    description: 'Service proposé',
    capabilities: ['email'],
  }));
  const f = fixture(t, { fetcher: async () => reply({ ...catalog, options }) });
  await openOptions(f, 'tools');
  await until(() => f.document.querySelectorAll('[name="preferred-connector"]').length === 13);
  for (let index = 0; index < 12; index++) {
    f.document.querySelector(`[value="tool-${index}"]`).click();
    await until(
      () =>
        f.document.querySelectorAll('[name="preferred-connector"]:checked').length === index + 1,
    );
  }
  f.document.querySelector('[value="tool-12"]').click();
  await until(() => dialog(f).textContent.includes('au maximum 12 outils'));
  assert.equal(f.document.querySelectorAll('[name="preferred-connector"]:checked').length, 12);
  assert.equal(f.document.querySelector('[value="tool-12"]').checked, false);
  f.document.querySelector('[value="tool-0"]').click();
  await until(
    () => f.document.querySelectorAll('[name="preferred-connector"]:checked').length === 11,
  );
  f.document.querySelector('[value="tool-12"]').click();
  await until(() => f.document.querySelector('[value="tool-12"]').checked);
});

test('an overlong gallery addition leaves the original brief and project preferences intact', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  type(f, '[name="idea"]', 'a'.repeat(16000));
  await setTimeout(10);
  f.update({
    seed: { id: 1, idea: 'Une idée supplémentaire', projectType: 'slides', design: 'Audacieux' },
  });
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(idea(f).value, 'a'.repeat(16000));
  assert.match(
    f.document.querySelector('[role="alert"]').textContent,
    /dépasse la place disponible/,
  );
  assert.equal(button(f, 'Site web').getAttribute('aria-pressed'), 'true');
  assert.equal(button(f, 'Retirer la direction visuelle'), undefined);
});
