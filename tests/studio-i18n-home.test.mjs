import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `
      import { createRoot } from 'react-dom/client';
      import { HomeView } from './studio-ui/src/features/home/components/HomeView';
      import { StarterGallery } from './studio-ui/src/features/home/components/StarterGallery';
      import { JourneyView } from './studio-ui/src/features/journey/components/JourneyView';
      import { DecisionCard } from './studio-ui/src/features/decisions/components/DecisionCard';
      import { ProgressView } from './studio-ui/src/features/progress/components/ProgressView';
      import { initializeLocale, setLocale } from './studio-ui/src/i18n';
      export { setLocale };
      export function mount(element, surface, props) {
        initializeLocale();
        const View = { home: HomeView, gallery: StarterGallery, journey: JourneyView, decision: DecisionCard, progress: ProgressView }[surface];
        const root = createRoot(element);
        root.render(<View {...props} />);
        return () => root.unmount();
      }`,
    resolveDir: path.resolve('.'),
    sourcefile: 'studio-i18n-home-harness.tsx',
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'I18nHomeTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected localized view was not rendered');
}

function fixture(t, surface, props = {}, savedLocale) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom,
    { document } = window;
  if (savedLocale) window.localStorage.setItem('devmethod:studio:language:v1', savedLocale);
  window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new window.Event('close'));
  };
  window.fetch = async (url) => ({
    ok: true,
    json: async () =>
      url === '/api/mcp' ? { presets: [], connections: [], supported: true } : { projects: [] },
  });
  window.eval(bundle.outputFiles[0].text + '\nwindow.I18nHomeTest = I18nHomeTest;');
  const dispose = window.I18nHomeTest.mount(document.getElementById('root'), surface, props);
  t.after(() => {
    dispose();
    window.close();
  });
  return { window, document, locale: (value) => window.I18nHomeTest.setLocale(value) };
}

function button(scope, label) {
  return [...scope.querySelectorAll('button')].find((node) =>
    (node.getAttribute('aria-label') || node.textContent).trim().includes(label),
  );
}

function input(f, node, value) {
  const prototype =
    node.tagName === 'TEXTAREA'
      ? f.window.HTMLTextAreaElement.prototype
      : f.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value);
  node.dispatchEvent(new f.window.Event('input', { bubbles: true }));
}

test('home defaults to English and switching language preserves the idea and open dialog', async (t) => {
  const f = fixture(t, 'home');
  await until(() => button(f.document, 'Start project'));
  assert.equal(f.document.documentElement.lang, 'en');
  const idea = f.document.querySelector('textarea[name="idea"]');
  input(f, idea, 'Mon texte personnel reste exactement ici.');
  button(f.document, 'Import a project').click();
  await until(() => f.document.querySelector('dialog.home-dialog').open);
  f.locale('fr');
  await until(() => button(f.document.querySelector('dialog.home-dialog'), 'Importer et ouvrir'));
  assert.equal(idea.value, 'Mon texte personnel reste exactement ici.');
  assert.equal(f.document.querySelector('dialog.home-dialog').open, true);
  assert.equal(f.window.localStorage.getItem('devmethod:studio:language:v1'), 'fr');
  f.locale('en');
  await until(() => button(f.document.querySelector('dialog.home-dialog'), 'Import and open'));
  assert.equal(idea.value, 'Mon texte personnel reste exactement ici.');
});

test('gallery switches its open preview and seed without resetting an interactive selection', async (t) => {
  const seeds = [],
    f = fixture(t, 'gallery', { onChoose: (seed) => seeds.push(seed) });
  await until(() => button(f.document, 'Explore Pause — Appointments'));
  button(f.document, 'Explore Pause — Appointments').click();
  const dialog = f.document.querySelector('dialog.sg-dialog');
  await until(() => dialog.open);
  button(dialog, 'Wednesday').click();
  button(dialog, '14:00').click();
  await until(() => dialog.textContent.includes('Wednesday at 14:00'));
  f.locale('fr');
  await until(() => dialog.textContent.includes('Mercredi à 14:00'));
  assert.equal(button(dialog, 'Mercredi').getAttribute('aria-pressed'), 'true');
  f.locale('en');
  await until(() => button(dialog, 'Use this idea'));
  button(dialog, 'Use this idea').click();
  await until(() => seeds.length === 1);
  assert.match(seeds[0].idea, /^Prototype an appointment journey:/);
});

test('journey labels and prepared requests follow locale while project history remains verbatim', async (t) => {
  const requests = [],
    state = {
      project: {
        name: 'Projet existant',
        idea: 'Ne pas traduire mon besoin',
        mode: 'autonomous',
        constraints: [],
      },
      brief: { outcome: '', scope: [], excluded: [], criteria: [] },
      decisions: [],
      designs: [],
      selectedDesignId: null,
      references: [],
      revisions: [],
      checks: [],
    };
  const f = fixture(t, 'journey', { state, onRequest: (...args) => requests.push(args) });
  await until(() => button(f.document, 'Prepare a request'));
  assert.match(f.document.body.textContent, /Ne pas traduire mon besoin/);
  button(f.document, 'Prepare a request').click();
  assert.match(requests[0][1], /^Review the project context/);
  f.locale('fr');
  await until(() => button(f.document, 'Préparer une demande'));
  button(f.document, 'Préparer une demande').click();
  assert.match(requests[1][1], /^Reprends le contexte/);
  assert.equal(state.project.idea, 'Ne pas traduire mon besoin');
});

test('decision localization preserves its editable reason and original proposal text', async (t) => {
  const proposal = {
    id: 'proposal',
    baseRevision: 'base',
    topic: 'Sujet conservé',
    question: 'Question originale',
    stage: 'implementation',
    options: [{ id: 'a', title: 'Choix original', consequences: [] }],
    selectedOptionId: 'a',
  };
  const f = fixture(t, 'decision', {
    draftScope: 'test',
    proposal,
    activeRevision: 'base',
    execution: 'host',
    actions: { select: async () => {}, approve: async () => {} },
  });
  await until(() => button(f.document, 'Approve and prepare implementation'));
  const reason = f.document.querySelector('textarea');
  input(f, reason, 'Ma justification exacte');
  f.locale('fr');
  await until(() => button(f.document, 'Approuver et préparer la réalisation'));
  assert.equal(reason.value, 'Ma justification exacte');
  assert.match(f.document.body.textContent, /Question originale/);
});

test('progress uses English labels and switches a local error without rewriting reported actions', async (t) => {
  const f = fixture(t, 'progress', {
    jobs: [{ id: 'a', request: 'Demande originale', status: 'running' }],
    revisions: [],
    onOpenFile() {},
    pollMs: 0,
    loadProgress: async () => {
      throw new Error('transport');
    },
  });
  await until(() => button(f.document, 'Retry'));
  assert.match(f.document.body.textContent, /Updates interrupted/);
  f.locale('fr');
  await until(() => button(f.document, 'Réessayer'));
  assert.match(f.document.body.textContent, /Actualisation interrompue/);
  assert.match(f.document.body.textContent, /Demande originale/);
});
