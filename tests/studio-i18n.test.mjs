import assert from 'node:assert/strict';
import test from 'node:test';
import { CookieJar, JSDOM } from 'jsdom';
import {
  initializeLocale,
  getLocale,
  setLocale,
  subscribeLocale,
  translate,
  translateStaticLabels,
  languageKey,
  createMessageBindings,
  createTranslator,
} from '../scripts/studio/public/i18n.js';

test('Studio defaults to English and shares an explicit choice across local project ports', () => {
  const cookieJar = new CookieJar();
  const home = new JSDOM('<html lang="fr"></html>', { url: 'http://127.0.0.1:4400/', cookieJar });
  const project = new JSDOM('<html lang="en"></html>', {
    url: 'http://127.0.0.1:4402/',
    cookieJar,
  });
  assert.equal(initializeLocale(home.window.document, home.window), 'en');
  setLocale('fr', home.window.document, home.window);
  assert.equal(initializeLocale(project.window.document, project.window), 'fr');
  assert.equal(home.window.localStorage.getItem(languageKey), 'fr');
  let changed = 0;
  const stop = subscribeLocale(() => changed++, project.window);
  setLocale('en', home.window.document, home.window);
  project.window.dispatchEvent(new project.window.Event('focus'));
  assert.equal(getLocale(project.window.document), 'en');
  assert.equal(changed, 1);
  stop();
  home.window.close();
  project.window.close();
});

test('language changes notify subscribers and remain usable with denied storage', () => {
  const dom = new JSDOM('<html lang="en"></html>');
  const { window } = dom;
  let notifications = 0;
  const stop = subscribeLocale(() => notifications++, window);
  setLocale('fr', window.document, window);
  assert.equal(getLocale(window.document), 'fr');
  assert.equal(notifications, 1);
  window.dispatchEvent(new window.Event('focus'));
  assert.equal(getLocale(window.document), 'fr');
  assert.equal(notifications, 1);
  assert.throws(() => setLocale('de', window.document, window), /Unsupported/);
  stop();
  setLocale('en', window.document, window);
  assert.equal(notifications, 1);
  window.close();
});

test('translation interpolates once and leaves project data and user input intact', () => {
  assert.equal(
    translate('Ouvrir {name}', 'Open {name}', { name: '{secret} <draft>' }, 'en'),
    'Open {secret} <draft>',
  );
  const dom = new JSDOM(
    '<html lang="en"><button data-i18n-fr="Ouvrir" data-i18n-en="Open">Ouvrir</button><p id="history">Ouvrir</p><textarea>Ouvrir</textarea></html>',
  );
  translateStaticLabels(dom.window.document);
  assert.equal(dom.window.document.querySelector('button').textContent, 'Open');
  assert.equal(dom.window.document.querySelector('#history').textContent, 'Ouvrir');
  assert.equal(dom.window.document.querySelector('textarea').value, 'Ouvrir');
  dom.window.close();
});

test('explicit bindings preserve detached reusable controls and respect outside edits', async () => {
  const dom = new JSDOM('<html lang="en"><body></body></html>');
  const { document } = dom.window;
  const messages = createMessageBindings(document);
  const t = createTranslator(document);
  const button = document.createElement('button');
  messages.attribute(button, 'aria-label', () => t('Retour', 'Back'));
  messages.text(button, () => t('Retour', 'Back'));
  await Promise.resolve();
  setLocale('fr', document, dom.window);
  document.body.append(button);
  assert.equal(button.getAttribute('aria-label'), 'Retour');
  assert.equal(button.textContent, 'Retour');
  button.textContent = 'User content';
  setLocale('en', document, dom.window);
  assert.equal(button.getAttribute('aria-label'), 'Back');
  assert.equal(button.textContent, 'User content');
  messages.dispose();
  setLocale('fr', document, dom.window);
  assert.equal(button.getAttribute('aria-label'), 'Back');
  dom.window.close();
});
