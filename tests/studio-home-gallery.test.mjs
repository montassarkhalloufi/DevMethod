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
      import { StarterGallery } from './studio-ui/src/features/home/components/StarterGallery';
      export function mount(element, onChoose) {
        const root = createRoot(element);
        root.render(<StarterGallery onChoose={onChoose} />);
        return () => root.unmount();
      }`,
    resolveDir: path.resolve('.'),
    sourcefile: 'gallery-test-harness.tsx',
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'GalleryTest',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let index = 0; index < 100; index++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected gallery state not reached');
}

async function fixture(t) {
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  let requests = 0;
  dom.window.fetch = () => {
    requests++;
    throw new Error('Gallery must not contact a backend.');
  };
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new dom.window.Event('close'));
  };
  dom.window.eval(bundle.outputFiles[0].text + '\nwindow.GalleryTest = GalleryTest;');
  const seeds = [];
  const dispose = dom.window.GalleryTest.mount(dom.window.document.getElementById('root'), (seed) =>
    seeds.push(JSON.parse(JSON.stringify(seed))),
  );
  t.after(() => {
    dispose();
    dom.window.close();
    assert.equal(requests, 0, 'No gallery interaction should make network requests');
  });
  await until(() => dom.window.document.querySelector('.sg-grid'));
  return { dom, document: dom.window.document, seeds };
}

function button(scope, label) {
  const found = [...scope.querySelectorAll('button')].find((node) =>
    (node.getAttribute('aria-label') || node.textContent).includes(label),
  );
  assert.ok(found, `Missing button: ${label}`);
  return found;
}

function search(f, value) {
  const input = f.document.querySelector('[name="starter-search"]');
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLInputElement.prototype, 'value').set.call(
    input,
    value,
  );
  input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
}

async function open(f, title) {
  const trigger = button(f.document, `Explorer ${title}`);
  trigger.focus();
  trigger.click();
  await until(() => f.document.querySelector('dialog')?.open);
  return {
    trigger,
    dialog: f.document.querySelector('dialog'),
    preview: f.document.querySelector('.sg-live-preview'),
  };
}

test('gallery combines real category and accent-insensitive search filters and recovers from empty results', async (t) => {
  const f = await fixture(t);
  assert.equal(f.document.querySelectorAll('.sg-card').length, 6);
  assert.equal(f.document.querySelectorAll('dialog').length, 1);
  assert.equal(f.document.querySelector('dialog').open, false);
  assert.equal(f.document.querySelectorAll('.sg-thumbnail[inert][aria-hidden="true"]').length, 6);
  button(f.document.querySelector('.sg-filters'), 'Applications').click();
  await until(() => f.document.querySelectorAll('.sg-card').length === 2);
  search(f, 'SAAS');
  await until(() => f.document.querySelectorAll('.sg-card').length === 1);
  assert.match(f.document.querySelector('.sg-card-open').textContent, /Pulse/);
  search(f, 'aucune correspondance');
  await until(() => f.document.querySelector('.sg-empty'));
  assert.equal(f.document.querySelectorAll('.sg-card').length, 0);
  button(f.document, 'Voir toutes les inspirations').click();
  await until(() => f.document.querySelectorAll('.sg-card').length === 6);
  search(f, 'CRENEAU');
  await until(() => f.document.querySelectorAll('.sg-card').length === 1);
  assert.match(f.document.querySelector('.sg-card-open').textContent, /Pause/);
});

test('native preview handles cancel, initial focus, focus return and restores scroll state', async (t) => {
  const f = await fixture(t);
  f.document.documentElement.style.overflow = 'scroll';
  const view = await open(f, 'Atelier');
  assert.equal(f.document.activeElement, button(view.dialog, 'Fermer l’aperçu'));
  assert.equal(f.document.documentElement.style.overflow, 'hidden');
  assert.match(view.dialog.textContent, /Démo interactive/);
  assert.ok(f.document.getElementById(view.dialog.getAttribute('aria-labelledby')));
  assert.ok(f.document.getElementById(view.dialog.getAttribute('aria-describedby')));
  view.dialog.dispatchEvent(new f.dom.window.Event('cancel', { cancelable: true }));
  await until(() => !view.dialog.open && f.document.documentElement.style.overflow === 'scroll');
  assert.equal(f.document.activeElement, view.trigger);
  assert.equal(f.seeds.length, 0);
});

test('portfolio filters projects while dashboard switches the displayed demo dataset', async (t) => {
  const f = await fixture(t);
  let view = await open(f, 'Atelier');
  assert.equal(view.preview.querySelectorAll('li').length, 3);
  button(view.preview, 'Édition').click();
  await until(() => view.preview.querySelectorAll('li').length === 1);
  assert.match(view.preview.textContent, /Objets sensibles/);
  assert.doesNotMatch(view.preview.textContent, /Formes libres/);
  button(view.dialog, 'Fermer l’aperçu').click();
  await until(() => !view.dialog.open);
  view = await open(f, 'Pulse');
  assert.match(view.preview.textContent, /1 284/);
  button(view.preview, '30 jours').click();
  await until(() => view.preview.textContent.includes('5 460'));
  assert.match(view.preview.querySelector('[role="img"]').getAttribute('aria-label'), /30 jours/);
});

test('commerce selection updates locally, stays bounded and never claims an order', async (t) => {
  const f = await fixture(t);
  const view = await open(f, 'Rivage');
  const add = button(view.preview, 'Ajouter à la sélection');
  for (let index = 0; index < 12; index++) add.click();
  await until(() => view.preview.querySelector('[role="status"]').textContent.includes('9 objets'));
  assert.equal(add.disabled, true);
  assert.match(view.preview.querySelector('[role="status"]').textContent, /aucune commande/);
  button(view.preview, 'Retirer un objet').click();
  await until(() => view.preview.querySelector('[role="status"]').textContent.includes('8 objets'));
  assert.equal(add.disabled, false);
  assert.equal(f.seeds.length, 0);
});

test('booking clears its previous slot when the day changes and reports only a demo selection', async (t) => {
  const f = await fixture(t);
  const view = await open(f, 'Pause');
  button(view.preview, '10:00').click();
  await until(() =>
    view.preview.querySelector('[role="status"]').textContent.includes('Mardi à 10:00'),
  );
  button(view.preview, 'Mercredi').click();
  await until(() =>
    view.preview.querySelector('[role="status"]').textContent.includes('Choisissez'),
  );
  assert.equal(view.preview.querySelector('.sg-slots [aria-pressed="true"]'), null);
  button(view.preview, '14:00').click();
  await until(() =>
    view.preview.querySelector('[role="status"]').textContent.includes('Mercredi à 14:00'),
  );
  assert.match(view.preview.textContent, /Aucune réservation envoyée/);
});

test('kanban moves a task between actual columns and slides support boundaries and reset on reopen', async (t) => {
  const f = await fixture(t);
  let view = await open(f, 'Collectif');
  button(view.preview, 'Commencer').click();
  await until(() => view.preview.querySelector('section[aria-label="En cours"] .sg-task'));
  assert.equal(view.preview.querySelector('section[aria-label="À faire"] .sg-task'), null);
  button(view.preview, 'Terminer').click();
  await until(() => view.preview.querySelector('section[aria-label="Terminé"] .sg-task'));
  assert.match(view.preview.querySelector('[role="status"]').textContent, /Terminé/);
  button(view.dialog, 'Fermer l’aperçu').click();
  await until(() => !view.dialog.open);
  view = await open(f, 'Perspective');
  assert.equal(button(view.preview, 'Diapositive précédente').disabled, true);
  button(view.preview, 'Diapositive suivante').click();
  await until(() => view.preview.textContent.includes('Faire ensemble'));
  button(view.preview, 'Diapositive suivante').click();
  await until(() => view.preview.textContent.includes('À vous la suite'));
  assert.equal(button(view.preview, 'Diapositive suivante').disabled, true);
  button(view.dialog, 'Fermer l’aperçu').click();
  await until(() => !view.dialog.open);
  view = await open(f, 'Perspective');
  assert.match(view.preview.textContent, /Moins de bruit/);
  assert.equal(button(view.preview, 'Diapositive précédente').disabled, true);
});

test('each inspiration chooses one rich editable seed with the right project type and no source import', async (t) => {
  const f = await fixture(t);
  const expected = [
    ['Atelier', 'website', /portfolio/i],
    ['Pulse', 'app', /tableau de bord/i],
    ['Rivage', 'website', /boutique/i],
    ['Pause', 'prototype', /rendez-vous/i],
    ['Collectif', 'app', /kanban/i],
    ['Perspective', 'slides', /présentation/i],
  ];
  for (const [title, projectType, content] of expected) {
    const view = await open(f, title);
    const count = f.seeds.length;
    const choose = button(view.dialog, 'Utiliser cette idée');
    choose.click();
    await until(() => f.seeds.length === count + 1 && !view.dialog.open);
    const seed = f.seeds.at(-1);
    assert.deepEqual(Object.keys(seed).sort(), ['design', 'idea', 'projectType']);
    assert.equal(seed.projectType, projectType);
    assert.match(seed.idea, content);
    assert.match(seed.design, /Direction/);
    assert.equal(f.document.activeElement, view.trigger);
  }
  assert.equal(f.seeds.length, 6);
});
