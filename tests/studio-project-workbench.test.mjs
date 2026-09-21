import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client';
    import { useProjectModel } from './hooks/useProjectModel'; import { ProjectWorkbench } from './components/ProjectWorkbench';
    const root = createRoot(document.getElementById('root'));
    function HookView(props) { const result = useProjectModel(props.revisionId, props.baseRevisionId, props.draft); return <><output>{JSON.stringify({ revision: result.model?.analysis.revisionId, fingerprint: result.model?.analysis.fingerprint, loading: result.loading, error: result.error })}</output><button onClick={result.refresh}>Refresh hook</button></>; }
    window.renderHook = props => root.render(<StrictMode><HookView {...props} /></StrictMode>);
    window.renderWorkbench = props => root.render(<StrictMode><ProjectWorkbench {...props} /></StrictMode>);
    window.unmountFixture = () => root.unmount();`,
    resolveDir: path.resolve('studio-ui/src/features/project'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
  plugins: [
    {
      name: 'no-css',
      setup(api) {
        api.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      },
    },
  ],
});

function model(revisionId, extras = {}) {
  return {
    analysis: {
      schemaVersion: 1,
      revisionId,
      fingerprint: revisionId,
      analyzedAt: '2026-09-17T00:00:00Z',
      environment: 'test',
      status: 'complete',
      scope: 'test',
      localChanges: false,
      files: [],
      elements: [],
      relations: [],
      flows: [],
      issues: [],
      limits: [],
      stack: [],
      backendDetected: false,
      ...extras,
    },
    previous: null,
    impact: { baseRevisionId: null, revisionId, changes: [], staleCheckIds: [], limits: [] },
  };
}

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'React view did not reach the expected state');
}

function fixture(t) {
  const dom = new JSDOM('<html lang="fr"><main id="root"></main>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  t.after(() => {
    dom.window.unmountFixture?.();
    dom.window.close();
  });
  const requests = [];
  dom.window.fetch = (url, options) =>
    new Promise((resolve) => requests.push({ url, signal: options.signal, resolve }));
  dom.window.document.documentElement.lang = 'fr';
  dom.window.localStorage.setItem('devmethod:studio:language:v1', 'fr');
  dom.window.eval(bundle.outputFiles[0].text);
  const document = dom.window.document;
  return {
    dom,
    document,
    requests,
    state: () => JSON.parse(document.querySelector('output').textContent),
    resolve: (index, body, ok = true) => requests[index].resolve({ ok, json: async () => body }),
  };
}

function workbenchProps(f, overrides = {}) {
  return {
    revisionId: 'active',
    previousRevisionId: 'previous',
    activeRevisionId: 'active',
    sourceHost: f.document.createElement('div'),
    selectedPath: null,
    checks: [
      {
        id: 'check-active',
        revisionId: 'active',
        status: 'passed',
        label: 'Preuve de la version appliquée',
      },
    ],
    decisions: [],
    onOpenSource: () => {},
    onShowChecks: () => {},
    onFocus: () => {},
    onExpand: () => {},
    focused: false,
    ...overrides,
  };
}

test('an imported baseline is a reference in the code selector and context, even when active', async (t) => {
  const f = fixture(t);
  const props = workbenchProps(f, {
    revisionId: 'baseline',
    activeRevisionId: 'baseline',
    revisions: [
      { id: 'baseline', title: 'Sources importées', origin: { kind: 'import' } },
      { id: 'delivered', title: 'Évolution livrée' },
    ],
    onSelectVersion: () => {},
    checks: [],
  });
  f.dom.window.renderWorkbench(props);
  await until(() => f.document.querySelector('select[aria-label="Version du code"]'));
  const baselineLabel = () => f.document.querySelector('option[value="baseline"]').textContent;
  const context = () => f.document.querySelector('.project-context-muted').textContent;
  assert.match(baselineLabel(), /Référence importée/);
  assert.doesNotMatch(baselineLabel(), /Appliquée/);
  assert.equal(context(), 'Référence importée');

  f.document.querySelector('input[type="checkbox"]').click();
  await until(() => context().includes('Brouillon enregistré'));
  assert.match(context(), /non appliqué/);
  assert.match(baselineLabel(), /Référence importée/);

  f.dom.window.renderWorkbench({ ...props, activeRevisionId: 'delivered' });
  await until(() => context() === 'Référence importée');
  assert.doesNotMatch(baselineLabel(), /Appliquée/);
  assert.match(f.document.querySelector('option[value="delivered"]').textContent, /Appliquée/);

  f.dom.window.renderWorkbench({
    ...props,
    revisionId: 'delivered',
    activeRevisionId: 'delivered',
  });
  await until(
    () => f.document.querySelector('select[aria-label="Version du code"]').value === 'delivered',
  );
  // Draft selection remains the user's choice when the selected version becomes active.
  assert.match(context(), /Brouillon enregistré/);
  f.document.querySelector('input[type="checkbox"]').click();
  await until(() => context() === 'Appliquée');
});

test('the code footer links all quality results without treating historical checks as a complete total', async (t) => {
  const f = fixture(t);
  let opened = 0;
  const props = workbenchProps(f, { checks: [], onShowChecks: () => opened++ });
  f.dom.window.renderWorkbench(props);
  await until(() => f.requests.length === 1);
  f.resolve(0, model('active'));
  await until(() =>
    f.document.querySelector('.project-analysis-line').textContent.includes('analyse terminée'),
  );
  const footer = f.document.querySelector('.project-results');
  assert.match(
    footer.querySelector('summary').textContent,
    /Consulter les résultats et les preuves/,
  );
  assert.doesNotMatch(
    footer.textContent,
    /\d+ réussies|\d+ échouées|Aucun contrôle enregistré pour cette version/,
  );
  assert.match(footer.textContent, /Aucun contrôle historique transmis/);
  footer.querySelector('button').click();
  assert.equal(opened, 1);

  f.dom.window.renderWorkbench({ ...props, checks: workbenchProps(f).checks });
  await until(() => footer.textContent.includes('Preuve de la version appliquée'));
  assert.doesNotMatch(footer.querySelector('summary').textContent, /\d+ réussies|\d+ échouées/);
});

test('a delayed model response cannot replace a newer selected revision', async (t) => {
  const f = fixture(t);
  f.dom.window.renderHook({ revisionId: 'a', baseRevisionId: null, draft: false });
  await until(() => f.requests.length === 1);
  f.dom.window.renderHook({ revisionId: 'b', baseRevisionId: 'a', draft: false });
  await until(() => f.requests.length === 2);
  assert.equal(f.requests[0].signal.aborted, true);
  f.resolve(1, model('b'));
  await until(() => f.state().revision === 'b');
  f.resolve(0, model('a'));
  await setTimeout(10);
  assert.equal(f.state().revision, 'b');
  assert.equal(new URL(f.requests[1].url, 'http://localhost').searchParams.get('base'), 'a');
});

test('changing revision hides the previous model before the new request resolves', async (t) => {
  const f = fixture(t);
  f.dom.window.renderHook({ revisionId: 'a', baseRevisionId: null, draft: false });
  await until(() => f.requests.length === 1);
  f.resolve(0, model('a'));
  await until(() => f.state().revision === 'a');
  f.dom.window.renderHook({ revisionId: 'b', baseRevisionId: null, draft: false });
  await until(() => f.state().loading);
  assert.equal(f.state().revision, undefined);
});

test('saved editor event refreshes the model and discards earlier in-flight results', async (t) => {
  const f = fixture(t);
  f.dom.window.renderHook({ revisionId: 'active', baseRevisionId: null, draft: true });
  await until(() => f.requests.length === 1);
  f.document.dispatchEvent(new f.dom.window.Event('studio:editor-saved'));
  await until(() => f.requests.length === 2);
  assert.equal(f.requests[0].signal.aborted, true);
  assert.equal(new URL(f.requests[1].url, 'http://localhost').searchParams.get('draft'), '1');
  f.resolve(
    1,
    model('local-new', { baseRevisionId: 'active', localChanges: true, fingerprint: 'new' }),
  );
  await until(() => f.state().fingerprint === 'new');
  f.resolve(
    0,
    model('local-old', { baseRevisionId: 'active', localChanges: true, fingerprint: 'old' }),
  );
  await setTimeout(10);
  assert.equal(f.state().fingerprint, 'new');
});

test('a response for an unrelated revision is rejected while the editor remains independent', async (t) => {
  const f = fixture(t);
  f.dom.window.renderHook({ revisionId: 'active', baseRevisionId: null, draft: true });
  await until(() => f.requests.length === 1);
  f.resolve(0, model('wrong', { baseRevisionId: 'unrelated', localChanges: true }));
  await until(() => f.state().error);
  assert.match(f.state().error, /autre version/);
  assert.equal(f.state().revision, undefined);
  assert.equal(f.state().loading, false);
});

test('an enabled active draft is disabled for historical versions without requesting draft data', async (t) => {
  const f = fixture(t);
  const props = workbenchProps(f);
  f.dom.window.renderWorkbench(props);
  await until(() => f.requests.length === 1);
  f.resolve(0, model('active'));
  await until(() => f.document.querySelector('input[type="checkbox"]'));
  f.document.querySelector('input[type="checkbox"]').click();
  await until(() => f.requests.length === 2);
  assert.equal(new URL(f.requests[1].url, 'http://localhost').searchParams.get('draft'), '1');
  f.resolve(1, model('local-active', { baseRevisionId: 'active', localChanges: true }));
  await until(
    () =>
      !f.document
        .querySelector('.project-results')
        .textContent.includes('Preuve de la version appliquée'),
  );
  f.dom.window.renderWorkbench({ ...props, revisionId: 'historical', previousRevisionId: null });
  await until(() => f.requests.length === 3);
  const checkbox = f.document.querySelector('input[type="checkbox"]');
  assert.equal(checkbox.disabled, true);
  assert.equal(checkbox.checked, false);
  const query = new URL(f.requests[2].url, 'http://localhost').searchParams;
  assert.equal(query.get('revision'), 'historical');
  assert.equal(query.has('draft'), false);
  f.resolve(2, model('historical'));
  await until(() =>
    f.document.querySelector('.project-analysis-line').textContent.includes('analyse terminée'),
  );
  assert.doesNotMatch(
    f.document.querySelector('.project-results').textContent,
    /Preuve de la version appliquée/,
  );
});

test('the base revision proof is not displayed while an opted-in draft model is being analyzed', async (t) => {
  const f = fixture(t);
  f.dom.window.renderWorkbench(workbenchProps(f));
  await until(() => f.requests.length === 1);
  f.resolve(0, model('active'));
  await until(() =>
    f.document
      .querySelector('.project-results')
      .textContent.includes('Preuve de la version appliquée'),
  );
  f.document.querySelector('input[type="checkbox"]').click();
  await until(() => f.requests.length === 2);
  assert.doesNotMatch(
    f.document.querySelector('.project-results').textContent,
    /Preuve de la version appliquée/,
  );
});

test('switching to no revision aborts analysis and clears the displayed model', async (t) => {
  const f = fixture(t);
  f.dom.window.renderHook({ revisionId: 'a', baseRevisionId: null, draft: false });
  await until(() => f.requests.length === 1);
  f.dom.window.renderHook({ revisionId: null, baseRevisionId: null, draft: false });
  await until(() => !f.state().loading);
  await until(() => f.requests[0].signal.aborted);
  assert.equal(f.requests[0].signal.aborted, true);
  f.resolve(0, model('a'));
  await setTimeout(10);
  assert.equal(f.state().revision, undefined);
});

function sourceModel(revisionId) {
  const path = 'src/features/tasks/list.ts';
  return model(revisionId, {
    files: [
      {
        path,
        sha256: 'source',
        bytes: 12,
        layer: 'frontend',
        feature: 'tasks',
        language: 'TS',
        role: 'Interface',
        test: false,
      },
    ],
    elements: [
      {
        id: 'current-element',
        label: 'Current source',
        type: 'frontend',
        layer: 'frontend',
        sources: [{ path }],
        provenance: [],
        description: 'Current source',
        runtime: 'not_observed',
        details: {},
      },
    ],
  });
}

function chooseFeatureAndSearch(f) {
  const explorer = f.document.querySelector('.project-explorer');
  const group = explorer.querySelector('select');
  group.value = 'feature';
  group.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  const search = explorer.querySelector('input');
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLInputElement.prototype, 'value').set.call(
    search,
    'list',
  );
  search.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  search.focus();
  return { explorer, group, search };
}

test('editor-saved preserves explorer identity, feature grouping, search and focus while refreshed proofs stay hidden', async (t) => {
  const f = fixture(t);
  f.dom.window.renderWorkbench(workbenchProps(f));
  await until(() => f.requests.length === 1);
  f.resolve(0, sourceModel('active'));
  await until(() => f.document.querySelector('.project-explorer'));
  const { explorer, group, search } = chooseFeatureAndSearch(f);
  await until(() => group.value === 'feature' && search.value === 'list');
  f.document.dispatchEvent(new f.dom.window.Event('studio:editor-saved'));
  await until(() => f.requests.length === 2);
  assert.equal(f.document.querySelector('.project-explorer'), explorer);
  assert.equal(f.document.querySelector('.project-explorer select'), group);
  assert.equal(group.value, 'feature');
  assert.equal(search.value, 'list');
  assert.equal(f.document.activeElement, search);
  assert.match(
    f.document.querySelector('.project-analysis-line').textContent,
    /dernière analyse affichée, à actualiser/,
  );
  assert.doesNotMatch(
    f.document.querySelector('.project-results').textContent,
    /Preuve de la version appliquée|réussies/,
  );
  f.resolve(1, sourceModel('active'));
  await until(() =>
    f.document.querySelector('.project-analysis-line').textContent.includes('analyse terminée'),
  );
  assert.equal(f.document.querySelector('.project-explorer'), explorer);
  assert.equal(f.document.activeElement, search);
  assert.equal(group.value, 'feature');
  assert.equal(search.value, 'list');
  assert.match(
    f.document.querySelector('.project-results').textContent,
    /Preuve de la version appliquée/,
  );
});

test('an integrity error preserves same-scope controls but cannot redisplay a previous passing proof', async (t) => {
  const f = fixture(t);
  f.dom.window.renderWorkbench(workbenchProps(f));
  await until(() => f.requests.length === 1);
  f.resolve(0, sourceModel('active'));
  await until(() => f.document.querySelector('.project-explorer'));
  const { explorer, group, search } = chooseFeatureAndSearch(f);
  f.document.dispatchEvent(new f.dom.window.Event('studio:editor-saved'));
  await until(() => f.requests.length === 2);
  f.resolve(1, sourceModel('wrong-revision'));
  await until(() =>
    f.document.querySelector('.project-analysis-line').textContent.includes('autre version'),
  );
  assert.equal(f.document.querySelector('.project-explorer'), explorer);
  assert.equal(f.document.activeElement, search);
  assert.equal(group.value, 'feature');
  assert.match(f.document.querySelector('.project-analysis-line').textContent, /non actualisée/);
  assert.match(
    f.document.querySelector('.project-results').textContent,
    /Contrôles historiques masqués/,
  );
  assert.doesNotMatch(
    f.document.querySelector('.project-results').textContent,
    /Preuve de la version appliquée|réussies/,
  );
});

test('a retained snapshot is never reused after comparison-base or draft scope changes', async (t) => {
  for (const scope of [
    { baseRevisionId: 'different', draft: false },
    { baseRevisionId: 'previous', draft: true },
  ]) {
    await t.test(JSON.stringify(scope), async (child) => {
      const f = fixture(child);
      f.dom.window.renderHook({ revisionId: 'active', baseRevisionId: 'previous', draft: false });
      await until(() => f.requests.length === 1);
      f.resolve(0, model('active'));
      await until(() => f.state().revision === 'active');
      f.dom.window.renderHook({ revisionId: 'active', ...scope });
      await until(() => f.state().loading);
      assert.equal(f.state().revision, undefined);
    });
  }
});

test('selecting a removed impact element never substitutes the previously opened current file', async (t) => {
  const f = fixture(t);
  const response = sourceModel('active');
  response.previous = model('previous', {
    elements: [
      {
        id: 'removed-element',
        label: 'Removed module',
        type: 'module',
        layer: 'backend',
        sources: [{ path: 'server/removed.ts' }],
        provenance: [],
        description: 'Removed source',
        runtime: 'not_observed',
        details: {},
      },
    ],
  }).analysis;
  response.impact = {
    baseRevisionId: 'previous',
    revisionId: 'active',
    changes: [
      {
        path: 'server/removed.ts',
        kind: 'removed',
        elementIds: ['removed-element'],
        dependencyIds: [],
        consumerIds: [],
        contractIds: [],
        testIds: [],
      },
    ],
    staleCheckIds: [],
    limits: [],
  };
  f.dom.window.renderWorkbench(
    workbenchProps(f, { view: 'impact', selectedPath: 'src/features/tasks/list.ts' }),
  );
  await until(() => f.requests.length === 1);
  f.resolve(0, response);
  const selectedButton = () =>
    [...f.document.querySelectorAll('.impact-view button')].find(
      (button) => button.textContent === 'Removed module',
    );
  await until(selectedButton);
  const details = f.document.querySelector('.impact-changes details');
  details.open = true;
  details.dispatchEvent(new f.dom.window.Event('toggle'));
  selectedButton().click();
  await until(
    () =>
      f.document.querySelector('.project-inspector h3').textContent ===
      'Élément absent de cette version',
  );
  const inspector = f.document.querySelector('.project-inspector');
  assert.doesNotMatch(inspector.textContent, /Current source|list\.ts/);
  assert.equal(inspector.querySelector('.inspector-sources'), null);
  assert.match(inspector.textContent, /version précédente/);
});
