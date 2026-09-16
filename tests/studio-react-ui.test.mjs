import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { initialData } from '../examples/studio-ateliers-react/src/features/workshops/model/domain.ts';

const root = path.resolve('examples/studio-ateliers-react');
const bundled = await build({
  stdin: {
    contents: `import { StrictMode } from 'react';
      import { createRoot } from 'react-dom/client';
      import { App } from './app/App';
      const root = createRoot(document.getElementById('root'));
      window.unmountTestApp = () => root.unmount();
      root.render(<StrictMode><App /></StrictMode>);`,
    resolveDir: path.join(root, 'src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  alias: { '@': path.join(root, 'src') },
  define: { 'process.env.NODE_ENV': '"test"' },
  plugins: [
    {
      name: 'ui-test-no-css',
      setup(api) {
        api.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      },
    },
  ],
});

async function until(predicate) {
  for (let i = 0; i < 40; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'React view did not reach the expected state');
}

async function fixture(
  t,
  { drafts = {}, data = initialData(), url = 'http://localhost:4999/' } = {},
) {
  const dom = new JSDOM('<main id="root"></main>', {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  t.after(() => {
    dom.window.unmountTestApp?.();
    dom.window.close();
  });
  dom.window.localStorage.setItem('les-ateliers:drafts:v1', JSON.stringify(drafts));
  const writes = [];
  let release;
  dom.window.fetch = async (_url, options = {}) => {
    if (options.method !== 'POST') return { ok: true, json: async () => ({ version: 1, data }) };
    writes.push(JSON.parse(options.body));
    return new Promise((resolve) => {
      release = () =>
        resolve({
          ok: true,
          json: async () => ({ version: 2, data: writes.at(-1).data }),
        });
    });
  };
  dom.window.eval(bundled.outputFiles[0].text);
  await until(() => dom.window.document.querySelectorAll('.workshop-card').length > 0);
  const document = dom.window.document;
  const card = document.querySelector('.workshop-card');
  const type = (input, value) => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(
      input,
      value,
    );
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  return { dom, document, card, writes, type, release: () => release() };
}

test('a successful booking cannot erase or hide text typed while that booking was saving', async (t) => {
  const f = await fixture(t);
  f.card.querySelector('button').click();
  await until(() => f.card.querySelector('input'));
  assert.equal(f.document.activeElement, f.card.querySelector('input'));
  f.type(f.card.querySelector('input'), 'Noa');
  await until(() => f.card.querySelector('input').value === 'Noa');
  f.card
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => f.writes.length === 1);
  f.type(f.card.querySelector('input'), 'Mina, inscription suivante');
  await setTimeout(0);
  f.release();
  await until(() =>
    f.document.querySelector('.status').textContent.includes('Inscription enregistrée'),
  );
  assert.equal(f.card.querySelector('input')?.value, 'Mina, inscription suivante');
  await until(
    () =>
      JSON.parse(f.dom.window.localStorage.getItem('les-ateliers:drafts:v1'))[
        initialData().workshops[0].id
      ] === 'Mina, inscription suivante',
  );
});

test('a whitespace-only name gets a focused inline error without a network save', async (t) => {
  const f = await fixture(t);
  f.card.querySelector('button').click();
  await until(() => f.card.querySelector('input'));
  f.type(f.card.querySelector('input'), '   ');
  await setTimeout(0);
  f.card
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => f.card.querySelector('[role="alert"]'));
  assert.equal(f.writes.length, 0);
  assert.equal(f.document.activeElement, f.card.querySelector('input'));
  assert.equal(f.card.querySelector('input').getAttribute('aria-invalid'), 'true');
});

test('restoring multiple booking drafts does not steal focus or trigger a mobile keyboard', async (t) => {
  const data = initialData();
  const f = await fixture(t, {
    drafts: { [data.workshops[0].id]: 'Noa', [data.workshops[1].id]: 'Mina' },
  });
  assert.equal(f.document.querySelectorAll('.name-input').length, 2);
  assert.equal(f.document.activeElement, f.document.body);
});

test('a join deep link opens only its target while preserving drafts and leaving focus and data untouched', async (t) => {
  const data = initialData();
  const [target, draftWorkshop, closedWorkshop] = data.workshops;
  const drafts = { [draftWorkshop.id]: 'Mina, saisie conservée' };
  const f = await fixture(t, {
    data,
    drafts,
    url: `http://localhost:4999/?workshop=${encodeURIComponent(target.id)}&form=join#workshop-${target.id}`,
  });
  assert.equal(f.document.getElementById(`workshop-${target.id}`).querySelector('input').value, '');
  assert.equal(
    f.document.getElementById(`workshop-${draftWorkshop.id}`).querySelector('input').value,
    drafts[draftWorkshop.id],
  );
  assert.equal(
    f.document.getElementById(`workshop-${closedWorkshop.id}`).querySelector('form'),
    null,
  );
  assert.equal(f.document.activeElement, f.document.body);
  assert.equal(f.writes.length, 0);
  assert.deepEqual(JSON.parse(f.dom.window.localStorage.getItem('les-ateliers:drafts:v1')), drafts);
});

test('an unknown workshop or non-join deep link does not open a booking form', async (t) => {
  for (const query of ['workshop=unknown&form=join', 'workshop=repair-bike&form=preview']) {
    const f = await fixture(t, { url: `http://localhost:4999/?${query}` });
    assert.equal(f.document.querySelector('.booking-form'), null);
    assert.equal(f.writes.length, 0);
  }
});

test('cancelling a registration requires a reversible confirmation before any save', async (t) => {
  const data = initialData();
  data.registrations.push({
    id: 'test-registration',
    workshopId: data.workshops[0].id,
    name: 'Noa',
  });
  const f = await fixture(t, { data });
  f.document.querySelector('.cancel-button').click();
  await until(() => f.document.querySelector('.registration-confirmation'));
  assert.equal(f.writes.length, 0);
  const buttons = [
    ...f.document.querySelector('.registration-confirmation').querySelectorAll('button'),
  ];
  buttons.find((button) => button.textContent === 'Garder mon inscription').click();
  await until(() => !f.document.querySelector('.registration-confirmation'));
  assert.equal(f.writes.length, 0);
  f.document.querySelector('.cancel-button').click();
  await until(() => f.document.querySelector('.registration-confirmation'));
  [...f.document.querySelector('.registration-confirmation').querySelectorAll('button')]
    .find((button) => button.textContent === 'Confirmer l’annulation')
    .click();
  await until(() => f.writes.length === 1);
  assert.equal(f.writes[0].data.registrations.length, 0);
  f.release();
});
