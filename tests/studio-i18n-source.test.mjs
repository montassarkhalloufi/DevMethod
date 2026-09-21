import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { setLocale } from '../scripts/studio/public/i18n.js';
import { createSourceView } from '../scripts/studio/public/source-view.js';

async function compareFixture(t, beforeText, afterText) {
  const dom = new JSDOM('<main></main>', { url: 'http://localhost' });
  const { document } = dom.window;
  setLocale('fr', document, dom.window);
  const root = document.querySelector('main');
  const calls = [];
  const manifest = (id, content) => ({
    id,
    title: 'Version ' + id,
    files: [{ path: 'main.js', bytes: Buffer.byteLength(content), sha256: 'a'.repeat(64) }],
  });
  const before = manifest('before', beforeText);
  const after = manifest('after', afterText);
  const view = createSourceView({
    document,
    root,
    loadSource: async ({ revisionId, path }) => {
      calls.push([revisionId, path]);
      const revision = revisionId === 'before' ? before : after;
      return {
        revisionId,
        ...revision.files[0],
        content: revisionId === 'before' ? beforeText : afterText,
        binary: false,
        truncated: false,
      };
    },
  });
  t.after(() => {
    view.destroy();
    dom.window.close();
  });
  await view.showRevision(after, { previousRevision: before });
  const compare = root.querySelector('[aria-label="Comparer à la version précédente"]');
  compare.click();
  await setImmediate();
  return { document, window: dom.window, root, calls };
}

test('source diff annotations switch language without rereading or replacing source text and focus', async (t) => {
  const before = 'const mot = "conservé";';
  const after = 'const mot = "nouveau";';
  const f = await compareFixture(t, before, after);
  const calls = structuredClone(f.calls);
  const line = f.root.querySelector('[data-change="added"]');
  const codeText = line.firstChild;
  const displayedCode = codeText.textContent;
  assert.match(line.textContent, /Pas de saut de ligne final/);
  const selectedFile = f.root.querySelector('[data-path="main.js"]');
  selectedFile.focus();
  const range = f.document.createRange();
  range.setStart(codeText, displayedCode.indexOf('const'));
  range.setEnd(codeText, displayedCode.length);
  f.window.getSelection().removeAllRanges();
  f.window.getSelection().addRange(range);
  assert.equal(f.window.getSelection().toString(), after);
  setLocale('en', f.document, f.window);
  assert.match(line.textContent, /No newline at end of file/);
  assert.doesNotMatch(line.textContent, /Pas de saut de ligne final/);
  assert.equal(line.firstChild, codeText);
  assert.equal(codeText.textContent, displayedCode);
  assert.equal(f.window.getSelection().toString(), after);
  assert.equal(f.document.activeElement, selectedFile);
  assert.match(f.root.querySelector('.source-status').textContent, /line\(s\) added/);
  assert.deepEqual(f.calls, calls);
  setLocale('fr', f.document, f.window);
  assert.match(line.textContent, /Pas de saut de ligne final/);
  assert.equal(f.window.getSelection().toString(), after);
  assert.deepEqual(f.calls, calls);
});

test('a limited diff explains the same limit in the new language without a source request', async (t) => {
  const f = await compareFixture(t, 'a'.repeat(270_000), 'b'.repeat(270_000));
  const status = f.root.querySelector('.source-status');
  assert.equal(status.textContent, 'Les fichiers dépassent la limite de taille de comparaison.');
  const calls = structuredClone(f.calls);
  setLocale('en', f.document, f.window);
  assert.equal(status.textContent, 'The files exceed the comparison size limit.');
  assert.deepEqual(f.calls, calls);
  setLocale('fr', f.document, f.window);
  assert.equal(status.textContent, 'Les fichiers dépassent la limite de taille de comparaison.');
  assert.deepEqual(f.calls, calls);
});
