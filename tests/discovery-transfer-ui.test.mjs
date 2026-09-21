import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('numeric experience preserves a manual trial until confirmation and keeps keyboard access at the time limit', async (t) => {
  const publicRoot = new URL('../scripts/atelier/public/', import.meta.url);
  const dom = new JSDOM(await fs.readFile(new URL('transfer.html', publicRoot), 'utf8'));
  const { document } = dom.window;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = document;
  t.after(() => {
    dom.window.close();
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  // Resolve the real browser module's URL imports for Node; no controller logic is replaced.
  let source = await fs.readFile(new URL('transfer-app.js', publicRoot), 'utf8');
  const imports = {
    '/discovery/search.mjs': '../scripts/discovery/search.mjs',
    '/transfer/machine.mjs': '../scripts/discovery/transfer/machine.mjs',
    '/transfer/domain.mjs': '../scripts/discovery/transfer/domain.mjs',
    './views.js': '../scripts/atelier/public/views.js',
  };
  for (const [browserPath, localPath] of Object.entries(imports))
    source = source.replace(
      `'${browserPath}'`,
      JSON.stringify(new URL(localPath, import.meta.url).href),
    );
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const click = (id) => {
    const node = document.getElementById(id);
    node.focus();
    node.click();
  };
  const invoices = () =>
    [...document.querySelectorAll('.rental-price')].map((node) =>
      node.textContent.replace(/\s/g, ''),
    );
  click('rental-rent-60');
  assert.deepEqual(invoices(), ['6,00€', '6,00€']);
  click('find-rental');
  assert.equal(document.querySelector('#rental-history').children.length, 1);
  assert.deepEqual(invoices(), ['6,00€', '6,00€']);
  click('play-rental');
  click('cancel-rental-reset');
  assert.deepEqual(invoices(), ['6,00€', '6,00€']);
  click('play-rental');
  click('confirm-rental-reset');
  assert.deepEqual(invoices(), ['9,00€', '6,00€']);
  assert.equal(document.querySelector('#rental-history').children.length, 2);
  click('rental-pause-20');
  assert.match(document.querySelector('#rental-progress').textContent, /^80 \/ 120/);
  assert.deepEqual(invoices(), ['9,00€', '6,00€']);
  click('rental-rent-40');
  assert.equal(document.querySelector('#rental-actions').children.length, 0);
  assert.equal(document.activeElement.id, 'clear-rental');
});
