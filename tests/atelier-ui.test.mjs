import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createSession } from '../scripts/atelier/domain.mjs';

test('changing creation target preserves an empty open form and its keyboard focus', async (t) => {
  const publicRoot = new URL('../scripts/atelier/public/', import.meta.url);
  const html = await fs.readFile(new URL('index.html', publicRoot), 'utf8');
  const project = JSON.parse(
    await fs.readFile(new URL('../scripts/atelier/gazette.json', import.meta.url), 'utf8'),
  );
  const dom = new JSDOM(html, { url: 'http://localhost/?mode=simple' });
  const { document, Event } = dom.window;
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ storageVersion: 1, session: createSession(project) }),
  }));
  const previous = ['document', 'location'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]);
  t.after(() => {
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.document = document;
  globalThis.location = dom.window.location;
  await import(new URL('app.js', publicRoot));
  await setImmediate();

  document.querySelector('.create-disclosure').open = true;
  const target = document.querySelector('#create-variant');
  target.focus();
  target.value = project.variants[1].id;
  target.dispatchEvent(new Event('change', { bubbles: true }));

  assert.equal(document.querySelector('.create-disclosure').open, true);
  assert.equal(document.querySelector('#new-title').value, '');
  assert.equal(document.querySelector('#create-variant').value, project.variants[1].id);
  assert.equal(document.activeElement.id, 'create-variant');

  const title = document.querySelector('#new-title');
  title.value = 'Un brouillon conservé';
  title.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('.create-disclosure').open = false;
  const actor = document.querySelector('#actor');
  actor.value = project.actors[0].id;
  actor.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(document.querySelector('.create-disclosure').open, false);
  assert.equal(document.querySelector('#new-title').value, 'Un brouillon conservé');
});
