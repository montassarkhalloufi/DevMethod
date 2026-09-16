import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createSourceView, comparisonBase } from '../scripts/studio/public/source-view.js';
import { compareLineSources } from '../scripts/studio/public/source-diff.js';

const file = (path, bytes = 20) => ({ path, bytes, sha256: 'a'.repeat(64) });
const revision = (id, files = [file('index.html'), file('src/main.js')]) => ({
  id,
  title: 'Version ' + id,
  files,
});
const response = (id, source, content = '<h1>Code réel</h1>', extra = {}) => ({
  revisionId: id,
  path: source.path,
  bytes: source.bytes,
  sha256: source.sha256,
  content,
  binary: false,
  truncated: false,
  ...extra,
});

function fixture(t, loadSource, copyText) {
  const dom = new JSDOM('<!doctype html><main></main>', { url: 'http://127.0.0.1:4330' });
  const document = dom.window.document;
  const root = document.querySelector('main');
  const view = createSourceView({ document, root, loadSource, copyText });
  t.after(() => {
    view.destroy();
    dom.window.close();
  });
  return { document, root, view };
}

test('real manifest drives nested file choices and source is displayed as text, never executed', async (t) => {
  const current = revision('one');
  const calls = [];
  const { root, view } = fixture(t, async ({ revisionId, path }) => {
    calls.push([revisionId, path]);
    return response(
      revisionId,
      current.files.find((entry) => entry.path === path),
      '<script>window.injected=true</script>',
    );
  });
  await view.showRevision(current);
  assert.equal(root.querySelectorAll('nav button').length, 2);
  assert.equal(root.querySelector('.source-files summary').textContent, 'src');
  assert.equal(root.querySelectorAll('script').length, 0);
  assert.match(root.querySelector('code').textContent, /<script>/);
  assert.equal(root.querySelectorAll('textarea,[contenteditable],input').length, 0);
  root.querySelector('[data-path="src/main.js"]').click();
  await setImmediate();
  assert.deepEqual(calls, [
    ['one', 'index.html'],
    ['one', 'src/main.js'],
  ]);
  assert.equal(
    root.querySelector('[data-path="src/main.js"]').getAttribute('aria-current'),
    'true',
  );
});

test('a late response from an old revision cannot overwrite the displayed revision', async (t) => {
  let resolveOld;
  const { root, view } = fixture(t, ({ revisionId }) =>
    revisionId === 'old'
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve(response('new', file('index.html'), 'NEW SOURCE')),
  );
  const old = view.showRevision(revision('old', [file('index.html')]));
  await view.showRevision(revision('new', [file('index.html')]));
  resolveOld(response('old', file('index.html'), 'STALE SOURCE'));
  await old;
  assert.equal(root.querySelector('code').textContent, 'NEW SOURCE');
  assert.match(root.querySelector('.source-revision').textContent, /new/);
});

test('secondary provenance and file integrity remain available in a disclosure while read failures stay outside it', async (t) => {
  let fail = false;
  const { root, view } = fixture(t, async ({ revisionId, path }) => {
    if (fail) throw new Error('Lecture interrompue');
    return response(revisionId, file(path));
  });
  await view.showRevision(revision('exact-version', [file('index.html')]));
  const details = root.querySelector('.source-details');
  assert.equal(details.open, false);
  assert.match(details.textContent, /exact-version/);
  assert.match(details.textContent, /SHA-256 a{64}/);
  assert.match(details.textContent, /Lecture seule/);
  details.open = true;
  assert.equal(details.querySelector('.source-metadata').hidden, false);
  fail = true;
  root.querySelector('[data-path="index.html"]').click();
  await setImmediate();
  const status = root.querySelector('.source-status');
  assert.equal(status.closest('details'), null);
  assert.match(status.textContent, /Lecture interrompue/);
});

test('failed integrity or read error clears source and retry makes a real request', async (t) => {
  let calls = 0;
  const { root, view } = fixture(t, async () => {
    calls++;
    return response(
      'one',
      file('index.html'),
      'source',
      calls === 1 ? { sha256: 'b'.repeat(64) } : {},
    );
  });
  await view.showRevision(revision('one', [file('index.html')]));
  assert.equal(root.querySelector('code').textContent, '');
  assert.match(root.querySelector('[role=status]').textContent, /ne correspond pas/);
  const retry = [...root.querySelectorAll('button')].find(
    (button) => button.textContent === 'Réessayer la lecture',
  );
  assert.equal(retry.hidden, false);
  retry.click();
  await setImmediate();
  assert.equal(calls, 2);
  assert.equal(root.querySelector('code').textContent, 'source');
  assert.equal(retry.hidden, true);
});

test('binary and truncated files remain explicitly distinguishable from a complete textual read', async (t) => {
  const { root, view } = fixture(t, async ({ revisionId, path }) =>
    response(
      revisionId,
      file(path),
      path === 'logo.png' ? null : 'PARTIAL',
      path === 'logo.png' ? { binary: true } : { truncated: true },
    ),
  );
  await view.showRevision(revision('one', [file('logo.png')]));
  assert.equal(root.querySelector('pre').hidden, true);
  assert.match(root.querySelector('[role=status]').textContent, /binaire/);
  await view.showRevision(revision('two', [file('large.js')]));
  assert.equal(root.querySelector('code').textContent, 'PARTIAL');
  assert.match(root.querySelector('[role=status]').textContent, /partie du fichier/);
});

test('empty selection and destruction invalidate pending reads without fake success', async (t) => {
  let resolve;
  const { root, view } = fixture(
    t,
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = view.showRevision(revision('one', [file('index.html')]));
  await view.showRevision(null);
  resolve(response('one', file('index.html'), 'old'));
  await pending;
  assert.equal(root.querySelectorAll('nav button').length, 0);
  assert.equal(root.querySelector('code').textContent, '');
  assert.match(root.querySelector('[role=status]').textContent, /lorsqu’une application/);
  view.destroy();
  assert.equal(root.childElementCount, 0);
});

test('polling the same immutable manifest preserves selected file and folder state', async (t) => {
  const current = revision('one');
  let calls = 0;
  const { root, view } = fixture(t, async ({ revisionId, path }) => {
    calls++;
    return response(
      revisionId,
      current.files.find((entry) => entry.path === path),
    );
  });
  await view.showRevision(current);
  root.querySelector('[data-path="src/main.js"]').click();
  await setImmediate();
  root.querySelector('.source-files details').open = false;
  await view.showRevision(structuredClone(current));
  assert.equal(calls, 2);
  assert.equal(root.querySelector('.source-files details').open, false);
  assert.equal(root.querySelector('h3').textContent, 'src/main.js');
});

test('line differences reconstruct both actual sources, including line endings and repeated lines', () => {
  const cases = [
    ['', ''],
    ['', 'new\n'],
    ['old\n', ''],
    ['a\nb\na\n', 'a\na\nb\n'],
    ['unchanged\nold\nlast', 'unchanged\nnew\nlast'],
    ['line\n', 'line'],
    ['line\r\n', 'line\n'],
    ['\n\n', '\n'],
  ];
  for (const [before, after] of cases) {
    const difference = compareLineSources(before, after);
    assert.equal(difference.kind, 'available');
    assert.equal(
      difference.entries
        .filter((entry) => entry.type !== 'added')
        .map((entry) => entry.text)
        .join(''),
      before,
    );
    assert.equal(
      difference.entries
        .filter((entry) => entry.type !== 'removed')
        .map((entry) => entry.text)
        .join(''),
      after,
    );
    let oldLine = 1;
    let newLine = 1;
    for (const entry of difference.entries) {
      assert.equal(entry.beforeLine, entry.type === 'added' ? null : oldLine++);
      assert.equal(entry.afterLine, entry.type === 'removed' ? null : newLine++);
    }
  }
  const changed = compareLineSources('first\nold\nlast\n', 'first\nnew\nlast\n');
  assert.deepEqual(
    changed.entries.map((entry) => entry.type),
    ['equal', 'removed', 'added', 'equal'],
  );
  assert.equal(changed.added, 1);
  assert.equal(changed.removed, 1);
});

test('line comparison stops before exceeding its work budget rather than showing an invented result', () => {
  assert.equal(
    compareLineSources('old\n'.repeat(100), 'new\n'.repeat(100), { maxCells: 20 }).kind,
    'limited',
  );
  assert.equal(compareLineSources('long', 'text', { maxCharacters: 2 }).kind, 'limited');
  assert.equal(compareLineSources('\n\n', '\n\n', { maxLines: 2 }).kind, 'limited');
  assert.equal(
    compareLineSources('same\n'.repeat(100), 'same\n'.repeat(100), { maxCells: 1 }).kind,
    'available',
  );
  assert.throws(() => compareLineSources(null, ''), /textuels complets/);
});

test('comparison fetches both versions, includes deleted and added files, and never executes code', async (t) => {
  const before = revision('before', [file('index.html'), file('deleted.js')]);
  const after = revision('after', [file('index.html'), file('added.js')]);
  const calls = [];
  const { root, view } = fixture(t, async ({ revisionId, path }) => {
    calls.push([revisionId, path]);
    return response(
      revisionId,
      file(path),
      revisionId === 'before' ? 'common\nold\n' : 'common\n<script>unsafe()</script>\n',
    );
  });
  await view.showRevision(after, { previousRevision: before });
  const compare = [...root.querySelectorAll('button')].find(
    (button) => button.textContent === 'Comparer à la version précédente',
  );
  assert.equal(compare.disabled, false);
  compare.click();
  await setImmediate();
  assert.deepEqual(calls.slice(-2).sort(), [
    ['after', 'index.html'],
    ['before', 'index.html'],
  ]);
  assert.match(
    root.querySelector('[role=status]').textContent,
    /1 ligne\(s\) ajoutée\(s\), 1 ligne\(s\) supprimée\(s\)/,
  );
  assert.match(root.querySelector('[data-change=added]').textContent, /<script>/);
  assert.equal(root.querySelectorAll('script').length, 0);
  root.querySelector('[data-path="deleted.js"]').click();
  await setImmediate();
  assert.equal(root.querySelectorAll('[data-change=removed]').length, 2);
  assert.equal(root.querySelectorAll('[data-change=added]').length, 0);
  assert.deepEqual(calls.at(-1), ['before', 'deleted.js']);
  root.querySelector('[data-path="added.js"]').click();
  await setImmediate();
  assert.equal(root.querySelectorAll('[data-change=added]').length, 2);
  assert.equal(root.querySelectorAll('[data-change=removed]').length, 0);
  assert.deepEqual(calls.at(-1), ['after', 'added.js']);
});

test('comparison refuses a truncated old source and prevents a stale comparison from replacing a source view', async (t) => {
  let releaseOld;
  let deferred = false;
  const { root, view } = fixture(t, async ({ revisionId, path }) => {
    if (revisionId === 'before' && deferred) {
      return new Promise((resolve) => {
        releaseOld = () => resolve(response(revisionId, file(path), 'STALE'));
      });
    }
    return response(
      revisionId,
      file(path),
      'current',
      revisionId === 'before' ? { truncated: true } : {},
    );
  });
  await view.showRevision(revision('after'), { previousRevision: revision('before') });
  const compare = [...root.querySelectorAll('button')].find(
    (button) => button.textContent === 'Comparer à la version précédente',
  );
  const source = [...root.querySelectorAll('button')].find(
    (button) => button.textContent === 'Afficher le fichier',
  );
  compare.click();
  await setImmediate();
  assert.match(root.querySelector('[role=status]').textContent, /tronqué/);
  assert.equal(root.querySelector('code').textContent, '');
  source.click();
  await setImmediate();
  deferred = true;
  compare.click();
  await setImmediate();
  source.click();
  await setImmediate();
  releaseOld();
  await setImmediate();
  assert.equal(root.querySelector('code').textContent, 'current');
  assert.equal(root.querySelectorAll('[data-change]').length, 0);
});

test('comparison uses the actual job base after rollback, never the neighboring revision', () => {
  const state = {
    revisions: [{ id: 'one' }, { id: 'two' }, { id: 'branch', jobId: 'job-branch' }],
    jobs: [{ id: 'job-branch', baseRevision: 'one' }],
  };
  assert.equal(comparisonBase(state, state.revisions[2]).id, 'one');
  assert.equal(comparisonBase(state, state.revisions[1]), null);
});

test('copy reports success only after copying the displayed content and exposes denied clipboard access', async (t) => {
  const copied = [];
  let refused = false;
  const { root, view } = fixture(
    t,
    async ({ revisionId, path }) => response(revisionId, file(path), 'exact source\n'),
    async (text) => {
      if (refused) throw new Error('Denied');
      copied.push(text);
    },
  );
  await view.showRevision(revision('one'));
  const copy = [...root.querySelectorAll('button')].find(
    (button) => button.textContent === 'Copier le contenu',
  );
  assert.equal(copy.disabled, false);
  copy.click();
  await setImmediate();
  assert.deepEqual(copied, ['exact source\n']);
  assert.match(root.querySelector('[role=status]').textContent, /copié/);
  refused = true;
  copy.click();
  await setImmediate();
  assert.match(root.querySelector('[role=status]').textContent, /refusée/);
});
