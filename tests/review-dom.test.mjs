import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { renderReviewHTML } from '../dist/review.js';

function viewer(t) {
  const review = JSON.parse(
    fs.readFileSync(new URL('../examples/review/review.json', import.meta.url)),
  );
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', (error) => errors.push(error.message));
  // Execute only this repository's generated program with its declared sample.
  // External resource loading stays disabled. JSDOM does not validate layout/CSP.
  const dom = new JSDOM(renderReviewHTML({ review }), {
    url: 'https://review.test/',
    runScripts: 'dangerously',
    virtualConsole: console,
  });
  t.after(() => {
    dom.window.close();
    assert.deepEqual(errors, []);
  });
  return { review, window: dom.window, document: dom.window.document };
}

test('generated viewer filters findings while retaining global counts and selected detail', (t) => {
  const { review, document, window } = viewer(t);
  const counts = document.querySelector('.stats').textContent;
  const title = document.querySelector('#detail-title').textContent;
  const search = document.querySelector('#finding-search');
  search.value = 'no-such-synthetic-finding';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(document.querySelectorAll('.finding').length, 0);
  assert.match(document.querySelector('.result-count').textContent, /^0 constat/);
  assert.equal(document.querySelector('.stats').textContent, counts);
  assert.equal(document.querySelector('#detail-title').textContent, title);
  assert.equal(document.querySelector('#detail-filter-note').hidden, false);
  search.value = '';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(document.querySelectorAll('.finding').length, review.findings.length);
  assert.equal(document.querySelector('#detail-filter-note').hidden, true);
});

test('generated viewer binds coverage, keyboard tabs and finding sections to their records', (t) => {
  const { review, document, window } = viewer(t);
  document.querySelector('#view-panel-coverage').click();
  assert.equal(document.querySelectorAll('.check-card').length, review.checks.length);
  document
    .querySelector('#view-panel-coverage')
    .dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(document.querySelector('#view-panel-sources').getAttribute('aria-selected'), 'true');
  assert.equal(document.activeElement.id, 'view-panel-sources');
  assert.equal(document.querySelectorAll('#view-panel .source-card').length, review.sources.length);
  document.querySelector('#view-panel-findings').click();
  const selected = review.findings.at(-1);
  [...document.querySelectorAll('.finding')]
    .find((node) => node.textContent.includes(selected.id))
    .click();
  assert.equal(window.location.hash, `#finding=${encodeURIComponent(selected.id)}`);
  assert.equal(document.activeElement.id, 'detail-title');
  document.querySelector('#detail-content-correction').click();
  assert.ok(document.querySelector('#detail-content').textContent.includes(selected.correction));
  document.querySelector('#detail-content-references').click();
  assert.equal(
    document.querySelectorAll('#detail-content .source-card').length,
    selected.sourceIds.length,
  );
});
