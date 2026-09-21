import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundled = await build({
  stdin: {
    contents: `import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client';
    import { ArchitectureView } from './ArchitectureView'; import { FlowView } from './FlowView'; import { ImpactView } from './ImpactView';
    const root = createRoot(document.getElementById('root')); const views = { ArchitectureView, FlowView, ImpactView };
    window.mountView = (name, model) => { const View = views[name]; root.render(<StrictMode><View model={model} selectedId={null} onSelect={id => window.actions.push(['select', id])} onOpenSource={(path,line) => window.actions.push(['source',path,line])} onShowChecks={path => window.actions.push(['checks',path])} /></StrictMode>); };
    window.unmountView = () => root.unmount();`,
    resolveDir: path.resolve('studio-ui/src/features/project/components'),
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

function modelFixture() {
  const elements = [
    ['web', 'Interface', 'frontend', 'frontend', 'src/app.tsx'],
    ['api', 'Inscription API', 'endpoint', 'backend', 'server/routes.ts'],
    ['db', 'Stockage', 'database', 'backend', 'server/repo.ts'],
  ].map(([id, label, type, layer, file]) => ({
    id,
    label,
    type,
    layer,
    sources: [{ path: file, line: 3 }],
    provenance: [{ kind: 'detected', method: 'AST fixture', sources: [{ path: file, line: 3 }] }],
    description: `Source de ${label}`,
    runtime: 'not_observed',
    details: {},
  }));
  const flow = {
    id: 'booking',
    title: 'POST /inscriptions',
    entryId: 'api',
    elementIds: ['web', 'api', 'db', 'unresolved'],
    relationIds: ['r1', 'r2', 'missing'],
    errors: [{ label: 'HTTP 504', source: { path: 'server/routes.ts', line: 12 } }],
    limits: ['Résolution statique seulement'],
    kind: 'code',
  };
  const analysis = {
    schemaVersion: 1,
    revisionId: 'current',
    fingerprint: 'abc',
    analyzedAt: '2026-09-17T00:00:00Z',
    environment: 'fixture de test',
    status: 'partial',
    scope: 'fixture',
    localChanges: false,
    files: [{ path: 'server/routes.ts', sha256: 'new' }],
    elements,
    relations: [
      {
        id: 'r1',
        source: 'web',
        target: 'api',
        kind: 'http',
        label: 'POST /inscriptions',
        provenance: [{ kind: 'detected', method: 'AST fixture', sources: [] }],
      },
      {
        id: 'r2',
        source: 'api',
        target: 'db',
        kind: 'write',
        label: 'Inscrire',
        provenance: [{ kind: 'declared', method: 'Manifeste fixture', sources: [] }],
      },
    ],
    flows: [flow],
    issues: [],
    limits: [],
    stack: ['React'],
    backendDetected: true,
  };
  return {
    analysis,
    previous: {
      ...analysis,
      revisionId: 'previous',
      files: [{ path: 'server/routes.ts', sha256: 'old' }],
    },
    impact: {
      baseRevisionId: 'previous',
      revisionId: 'current',
      changes: [
        {
          path: 'server/routes.ts',
          kind: 'modified',
          elementIds: ['api'],
          dependencyIds: ['db'],
          consumerIds: ['web'],
          contractIds: [],
          testIds: [],
        },
      ],
      staleCheckIds: ['proof-old'],
      limits: ['Impacts dynamiques inconnus'],
    },
  };
}

async function until(predicate) {
  for (let i = 0; i < 50; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'React view did not reach the expected state');
}

async function fixture(t, view, model = modelFixture()) {
  const dom = new JSDOM('<html lang="fr"><main id="root"></main>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  t.after(() => {
    dom.window.unmountView?.();
    dom.window.close();
  });
  dom.window.actions = [];
  dom.window.document.documentElement.lang = 'fr';
  dom.window.localStorage.setItem('devmethod:studio:language:v1', 'fr');
  dom.window.eval(bundled.outputFiles[0].text);
  dom.window.mountView(view, model);
  await until(() => dom.window.document.querySelector('section'));
  return { dom, document: dom.window.document, actions: dom.window.actions };
}

function button(document, text) {
  return [...document.querySelectorAll('button')].find((item) => item.textContent.includes(text));
}

test('the architecture SVG selects an element by keyboard and navigates to its actual source', async (t) => {
  const f = await fixture(t, 'ArchitectureView');
  const node = f.document.querySelector('[data-graph-select="node"][aria-label^="Interface"]');
  node.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.deepEqual(Array.from(f.actions[0]), ['select', 'web']);
  f.document
    .querySelector('[aria-label="Ouvrir le code de Interface"]')
    .dispatchEvent(new f.dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(Array.from(f.actions[1]), ['source', 'src/app.tsx', 3]);
  f.document.querySelector('[aria-label="Augmenter le zoom"]').click();
  await until(() => f.document.querySelector('.arch-zoom').textContent.includes('120 %'));
  button(f.document, 'Comparer').click();
  await until(() => f.document.querySelector('.arch-comparison'));
  assert.match(f.document.querySelector('.arch-graph').textContent, /Δ Modifié/);
  assert.match(f.document.querySelector('.arch-graph').textContent, /Exécution non observée/);
});

test('static flows expose unresolved elements and error sources without inventing runtime measures', async (t) => {
  const f = await fixture(t, 'FlowView');
  assert.match(f.document.body.textContent, /Flux déduit du code/);
  assert.match(f.document.body.textContent, /non résolu/i);
  assert.match(f.document.body.textContent, /1 connexion\(s\).*ne sont plus résolues/);
  assert.doesNotMatch(f.document.body.textContent, /Durée mesurée/);
  button(f.document, 'server/routes.ts:12').click();
  assert.deepEqual(Array.from(f.actions.at(-1)), ['source', 'server/routes.ts', 12]);
  button(f.document, 'Voir les vérifications').click();
  assert.deepEqual(Array.from(f.actions.at(-1)), ['checks', 'server/routes.ts']);
});

test('observed traces retain their own revision and mask recognizable credentials', async (t) => {
  const model = modelFixture();
  model.analysis.flows[0].kind = 'observed';
  model.analysis.flows[0].trace = {
    revisionId: 'older',
    environment: 'test local',
    durationMs: 512,
    events: [
      {
        label: 'POST token=fictional-token',
        error: 'timeout for test@example.test',
        durationMs: 500,
      },
    ],
  };
  const f = await fixture(t, 'FlowView', model);
  assert.match(f.document.body.textContent, /Trace d’une autre version/);
  assert.match(f.document.body.textContent, /Durée mesurée : 512 ms/);
  assert.doesNotMatch(f.document.body.textContent, /fictional-token|test@example.test/);
  assert.match(f.document.body.textContent, /timeout/);
});

test('impact distinguishes direct dependencies, possible consumers and stale evidence', async (t) => {
  const f = await fixture(t, 'ImpactView');
  assert.match(f.document.body.textContent, /Dépendances directes/);
  assert.match(f.document.body.textContent, /Consommateurs potentiels/);
  assert.match(f.document.body.textContent, /proof-old/);
  assert.match(f.document.body.textContent, /Impacts dynamiques inconnus/);
  button(f.document, 'Examiner les vérifications').click();
  assert.deepEqual(Array.from(f.actions.at(-1)), ['checks', 'server/routes.ts']);
  button(f.document, 'Ouvrir le fichier actuel').click();
  assert.deepEqual(Array.from(f.actions.at(-1)), ['source', 'server/routes.ts', undefined]);
});

test('impact from another revision is never joined to the selected source model', async (t) => {
  const model = modelFixture();
  model.impact.revisionId = 'stale';
  const f = await fixture(t, 'ImpactView', model);
  assert.match(f.document.body.textContent, /Comparaison obsolète/);
  assert.equal(f.document.querySelector('.impact-changes'), null);
  assert.equal(button(f.document, 'Ouvrir le fichier actuel'), undefined);
});

test('SVG export preserves the displayed camera and inline rendering independently of Studio CSS', async (t) => {
  const f = await fixture(t, 'ArchitectureView');
  let exported;
  let download;
  f.dom.window.URL.createObjectURL = (blob) => {
    exported = blob;
    return 'blob:test-export';
  };
  f.dom.window.URL.revokeObjectURL = () => {};
  f.dom.window.HTMLAnchorElement.prototype.click = function () {
    download = { name: this.download, href: this.href };
  };
  f.document.querySelector('[aria-label="Augmenter le zoom"]').click();
  await until(() => f.document.querySelector('.arch-zoom').textContent.includes('120 %'));
  button(f.document, 'Export SVG').click();
  assert.equal(download.name, 'architecture-current.svg');
  assert.equal(download.href, 'blob:test-export');
  const reader = new f.dom.window.FileReader();
  const read = new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
  reader.readAsText(exported);
  const xml = new f.dom.window.DOMParser().parseFromString(await read, 'image/svg+xml');
  assert.equal(
    xml.querySelector('parsererror'),
    null,
    xml.querySelector('parsererror')?.textContent,
  );
  assert.equal(xml.documentElement.getAttribute('viewBox'), '0 0 880 460');
  assert.equal(
    xml.querySelector('svg > g').getAttribute('transform'),
    f.document.querySelector('.arch-graph > g').getAttribute('transform'),
  );
  assert.ok(xml.querySelector('path[stroke][fill="none"]'));
  assert.ok(xml.querySelector('text[font-size][fill]'));
});
