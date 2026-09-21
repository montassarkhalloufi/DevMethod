import { setLocale } from '../scripts/studio/public/i18n.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createCodeSurface } from '../scripts/studio/public/code-widget.js';

function fixture(t, loadWidget) {
  const dom = new JSDOM('<main><div></div><textarea></textarea></main>');
  setLocale('fr', dom.window.document, dom.window);
  t.after(() => dom.window.close());
  dom.window.Worker = class {};
  const document = dom.window.document;
  const host = document.querySelector('div');
  const fallback = document.querySelector('textarea');
  const changes = [];
  const surface = createCodeSurface({
    document,
    host,
    fallback,
    loadWidget,
    onChange: (value) => changes.push(value),
  });
  t.after(() => surface.dispose());
  return { surface, host, fallback, document, changes };
}

test('a source location requested during loading is revealed in Monaco, never in a later file', async (t) => {
  for (const superseded of [false, true]) {
    let resolve;
    const positions = [];
    const f = fixture(
      t,
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    f.surface.setDocument({ path: 'route.ts', value: '\n'.repeat(20), readOnly: true });
    f.surface.focus({ line: 5 });
    await setImmediate();
    if (superseded) {
      f.surface.clear();
      f.surface.setDocument({ path: 'other.ts', value: '', readOnly: true });
    }
    resolve({
      mountCodeWidget: async () => ({
        setDocument() {},
        setDiagnostics() {},
        dispose() {},
        focus(position) {
          assert.equal(
            f.host.hidden,
            false,
            'Monaco must be visible before receiving keyboard focus',
          );
          positions.push(position);
        },
      }),
    });
    await setImmediate();
    assert.deepEqual(positions, superseded ? [] : [{ line: 5 }]);
  }
});

test('late widget loading receives the latest document, preserves fallback text, and wires changes once', async (t) => {
  let resolve, callbacks;
  const documents = [];
  let disposed = 0;
  const loading = new Promise((done) => {
    resolve = done;
  });
  const f = fixture(t, () => loading);
  f.fallback.value = 'saved fallback';
  f.surface.setDocument({ path: 'old.ts', value: 'old', readOnly: false });
  f.surface.setDocument({ path: 'new.tsx', value: '<Latest />', readOnly: false });
  resolve({
    mountCodeWidget: async (_host, options) => {
      callbacks = options;
      return {
        setDocument: (value) => documents.push(value),
        setDiagnostics() {},
        dispose() {
          disposed++;
        },
      };
    },
  });
  await setImmediate();
  assert.equal(documents.length, 1);
  assert.equal(documents[0].path, 'new.tsx');
  assert.equal(f.fallback.value, 'saved fallback');
  assert.equal(f.fallback.hidden, true);
  assert.equal(f.host.hidden, false);
  callbacks.onChange('one keystroke');
  assert.deepEqual(f.changes, ['one keystroke']);
  f.surface.dispose();
  assert.equal(disposed, 1);
});

test('clearing while the widget loads cannot expose a superseded or binary source', async (t) => {
  let resolve;
  const loading = new Promise((done) => {
    resolve = done;
  });
  const f = fixture(t, () => loading);
  f.surface.setDocument({ path: 'secret-old.js', value: 'old source', readOnly: true });
  f.surface.clear();
  resolve({
    mountCodeWidget: async () => ({ setDocument() {}, setDiagnostics() {}, dispose() {} }),
  });
  await setImmediate();
  assert.equal(f.host.hidden, true);
  assert.equal(f.fallback.hidden, true);
  assert.equal(f.document.querySelector('.code-language-status').hidden, true);
});

test('bundle failure leaves a working explicit text fallback and disposal invalidates a pending mount', async (t) => {
  const f = fixture(t, async () => {
    throw new Error('Unavailable');
  });
  f.fallback.value = 'unsaved draft';
  f.surface.setDocument({ path: 'app.js', value: 'unsaved draft', readOnly: false });
  await setImmediate();
  assert.equal(f.fallback.value, 'unsaved draft');
  assert.equal(f.fallback.hidden, false);
  assert.match(f.document.querySelector('.code-language-status').textContent, /indisponible/);
  let finish;
  let disposed = 0;
  const g = fixture(
    t,
    () =>
      new Promise((done) => {
        finish = done;
      }),
  );
  g.surface.setDocument({ path: 'index.html', value: '', readOnly: true });
  await setImmediate();
  g.surface.dispose();
  finish({
    mountCodeWidget: async () => ({
      dispose() {
        disposed++;
      },
    }),
  });
  await setImmediate();
  assert.equal(disposed, 1);
  assert.equal(g.document.querySelector('.code-language-status'), null);
});

test('a failure while installing the first widget document permanently restores the text fallback', async (t) => {
  let disposed = 0;
  const f = fixture(t, async () => ({
    mountCodeWidget: async () => ({
      setDiagnostics() {},
      setDocument() {
        throw new Error('The renderer failed during its first document.');
      },
      dispose() {
        disposed++;
      },
    }),
  }));
  f.fallback.value = 'original draft';
  f.surface.setDocument({ path: 'app.tsx', value: f.fallback.value, readOnly: false });
  await setImmediate();
  assert.equal(f.fallback.hidden, false);
  assert.equal(f.host.hidden, true);
  assert.equal(disposed, 1);
  f.fallback.value = 'continued in plain text';
  assert.doesNotThrow(() => {
    f.surface.setDocument({ path: 'app.tsx', value: f.fallback.value, readOnly: false });
    f.surface.setDiagnostics([{ severity: 'warning', message: 'A real later check' }]);
    f.surface.focus();
  });
  assert.equal(f.fallback.value, 'continued in plain text');
  assert.equal(f.fallback.hidden, false);
  assert.equal(f.document.activeElement, f.fallback);
  f.surface.dispose();
  assert.equal(disposed, 1);
});

test('later widget failures in document, diagnostics or focus cannot disable the durable text editor', async (t) => {
  for (const failingMethod of ['setDocument', 'setDiagnostics', 'focus']) {
    await t.test(failingMethod, async (t) => {
      let failed = false;
      let disposed = 0;
      const handle = Object.fromEntries(
        ['setDocument', 'setDiagnostics', 'focus'].map((name) => [
          name,
          () => {
            if (failed && name === failingMethod) throw new Error(`Later ${name} failure`);
          },
        ]),
      );
      handle.dispose = () => disposed++;
      const f = fixture(t, async () => ({ mountCodeWidget: async () => handle }));
      f.surface.setDocument({ path: 'before.ts', value: 'before', readOnly: false });
      await setImmediate();
      assert.equal(f.host.hidden, false);
      failed = true;
      f.fallback.value = 'the latest local keystrokes';
      assert.doesNotThrow(() => {
        if (failingMethod === 'setDocument')
          f.surface.setDocument({ path: 'after.ts', value: f.fallback.value, readOnly: false });
        else if (failingMethod === 'setDiagnostics')
          f.surface.setDiagnostics([{ severity: 'error', message: 'A real check' }]);
        else f.surface.focus({ line: 1 });
      });
      assert.equal(f.fallback.hidden, false);
      assert.equal(f.host.hidden, true);
      assert.equal(f.fallback.value, 'the latest local keystrokes');
      assert.equal(disposed, 1);
      assert.doesNotThrow(() =>
        f.surface.setDocument({ path: 'after.ts', value: 'can continue', readOnly: false }),
      );
      f.surface.dispose();
      assert.equal(disposed, 1);
    });
  }
});
