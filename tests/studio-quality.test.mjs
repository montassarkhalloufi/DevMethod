import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { digest } from '../scripts/studio/files.mjs';
import { readProjectQuality, runProjectQuality } from '../scripts/studio/quality.mjs';

function fixture(t, files = { 'main.ts': 'export const answer: number = 42;' }) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'studio-quality-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const id = randomUUID(),
    manifest = [];
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, 'revisions', id, 'app', name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    manifest.push({ path: name, bytes: Buffer.byteLength(content), sha256: digest(content) });
  }
  const state = {
    version: 1,
    activeRevision: id,
    revisions: [{ id, files: manifest }],
    checks: [],
    events: [],
  };
  const store = {
    root,
    read: () => structuredClone(state),
    commit: (_, mutate) => {
      mutate(state);
      state.version++;
      return structuredClone(state);
    },
  };
  return { store, id, state, file: (name) => path.join(root, 'revisions', id, 'app', name) };
}

test('catalogue does not invent success; absent tool and irrelevant stack are distinct', async (t) => {
  const { store, id } = fixture(t);
  const report = readProjectQuality(store, id);
  assert.equal(report.checks.find((c) => c.id === 'source-syntax').status, 'notrun');
  assert.equal(report.checks.find((c) => c.id === 'unit-tests').status, 'blocked');
  assert.equal(report.checks.find((c) => c.id === 'react-renders').status, 'notapplicable');
  assert.equal(report.checks.filter((c) => c.status === 'passed').length, 0);
  await assert.rejects(runProjectQuality(store, id, 'invented'), /inconnu/);
});

test('business objectives use the actual structured criteria from the project', (t) => {
  const { store, id, state } = fixture(t);
  state.brief = {
    criteria: [{ id: 'preserve-input', text: 'Conserver la saisie après une erreur réseau.' }],
  };
  const check = readProjectQuality(store, id).checks.find((item) => item.id === 'business-journey');
  assert.match(check.objective, /Conserver la saisie/);
  assert.equal(check.objective.includes('[object Object]'), false);
  assert.equal(check.status, 'blocked');
});

test('safe syntax failure carries file and version but never executes project code', async (t) => {
  const marker = path.join(os.tmpdir(), `must-not-exist-${randomUUID()}`);
  const { store, id } = fixture(t, {
    'broken.ts': 'const x: = ;',
    'main.js': `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'executed');`,
  });
  const report = await runProjectQuality(store, id, 'source-syntax');
  const check = report.checks.find((c) => c.id === 'source-syntax');
  assert.equal(check.status, 'failed');
  assert.equal(check.evidence.revisionId, id);
  assert.equal(check.evidence.findings[0].source.path, 'broken.ts');
  assert.equal(fs.existsSync(marker), false);
  assert.equal(store.read().checks.length, 1);
  assert.equal(
    report.checks.filter((item) => item.status === 'failed').length,
    1,
    'A journal result and its store check are one proof, not two successes/failures',
  );
  assert.match(check.evidence.limits.join(' '), /typage/);
});

test('an interrupted persisted run is blocked after restart and an absent tool never creates a result', async (t) => {
  const { store, id } = fixture(t);
  await runProjectQuality(store, id, 'source-syntax');
  const directory = path.join(store.root, '.devmethod', 'quality');
  const file = path.join(directory, fs.readdirSync(directory)[0]);
  const run = JSON.parse(fs.readFileSync(file, 'utf8'));
  run.status = 'running';
  run.finishedAt = null;
  fs.writeFileSync(file, JSON.stringify(run));
  const report = readProjectQuality({ ...store }, id);
  assert.equal(report.checks.find((item) => item.id === 'source-syntax').status, 'blocked');
  assert.match(
    report.checks.find((item) => item.id === 'source-syntax').evidence.observed,
    /interrompue/,
  );
  const count = fs.readdirSync(directory).length;
  const unavailable = await runProjectQuality(store, id, 'unit-tests');
  assert.equal(unavailable.checks.find((item) => item.id === 'unit-tests').status, 'blocked');
  assert.equal(fs.readdirSync(directory).length, count);
});

test('compiled inventory measures the exact artifacts and rejects changed bytes', async (t) => {
  const { store, id, state } = fixture(t);
  const directory = path.join(store.root, 'revisions', id, 'compiled');
  fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, 'app.js'), 'export{};');
  state.revisions[0].compilation = {
    files: [{ path: 'app.js', bytes: 9, sha256: digest('export{};') }],
  };
  const report = await runProjectQuality(store, id, 'bundle-size');
  const result = report.checks.find((item) => item.id === 'bundle-size');
  assert.equal(result.status, 'passed');
  assert.match(result.evidence.observed, /9 octets/);
  assert.match(result.evidence.limits.join(' '), /aucun temps de chargement/);
  fs.writeFileSync(path.join(directory, 'app.js'), 'changed');
  await assert.rejects(runProjectQuality(store, id, 'bundle-size'), /diffèrent/);
});

test('source divergence makes proof reevaluable and prevents a new green check', async (t) => {
  const { store, id, file } = fixture(t);
  await runProjectQuality(store, id, 'source-syntax');
  fs.writeFileSync(file('main.ts'), 'const broken: = ;');
  const report = readProjectQuality(store, id);
  assert.equal(report.checks.find((c) => c.id === 'source-syntax').freshness, 'reevaluate');
  await assert.rejects(runProjectQuality(store, id, 'source-syntax'), /sources|Sources|fichiers/);
  assert.equal(store.read().checks.length, 1);
});

test('missing relative imports fail and sensitive markers never reveal values', async (t) => {
  const secret = 'ghp_' + 'a'.repeat(36);
  const { store, id } = fixture(t, {
    'main.ts': `import './missing.js';\nconst secret = '${secret}';`,
  });
  const imports = await runProjectQuality(store, id, 'relative-imports');
  assert.equal(imports.checks.find((c) => c.id === 'relative-imports').status, 'failed');
  const report = await runProjectQuality(store, id, 'secret-markers');
  assert.equal(report.checks.find((c) => c.id === 'secret-markers').status, 'failed');
  assert.equal(JSON.stringify(report).includes(secret), false);
});

test('prior version evidence remains consultable and is never reused on another revision', async (t) => {
  const { store, id, state } = fixture(t);
  await runProjectQuality(store, id, 'source-syntax');
  const nextId = randomUUID();
  fs.cpSync(path.join(store.root, 'revisions', id), path.join(store.root, 'revisions', nextId), {
    recursive: true,
  });
  state.revisions.push({ ...state.revisions[0], id: nextId });
  state.activeRevision = nextId;
  const report = readProjectQuality(store, nextId);
  assert.equal(report.checks.find((c) => c.id === 'source-syntax').status, 'notrun');
  assert.equal(report.historical[0].freshness, 'obsolete');
  assert.equal(report.historical[0].evidence.revisionId, id);
});

test('the real controlled React compiler can check a profiled revision without package scripts or changing its artifacts', async (t) => {
  const marker = path.join(os.tmpdir(), `quality-script-must-not-run-${randomUUID()}`);
  const { store, id, file } = fixture(t, {
    'package.json': JSON.stringify({
      devmethod: { profile: 'react-ts' },
      scripts: { build: `node -e "require('fs').writeFileSync('${marker}','bad')"` },
    }),
    'index.html':
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'src/main.tsx':
      'import {createRoot} from "react-dom/client";const root=document.getElementById("root");if(root)createRoot(root).render(<h1>Contrôle réel</h1>);',
  });
  const before = fs.readFileSync(file('src/main.tsx'), 'utf8');
  const report = await runProjectQuality(store, id, 'react-strict-build');
  const check = report.checks.find((c) => c.id === 'react-strict-build');
  assert.equal(check.status, 'passed', JSON.stringify(check));
  assert.match(check.evidence.observed, /TypeScript strict et compilation React réussis/);
  assert.equal(fs.existsSync(marker), false);
  assert.equal(fs.readFileSync(file('src/main.tsx'), 'utf8'), before);
  assert.equal(fs.existsSync(path.join(store.root, 'revisions', id, 'compiled')), false);
});

test('controlled React build reports a real type mismatch and excludes nonprofiled projects', async (t) => {
  const { store, id } = fixture(t, {
    'package.json': '{"devmethod":{"profile":"react-ts"}}',
    'index.html': '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'src/main.tsx': 'const count: number = "wrong"; export { count };',
  });
  const report = await runProjectQuality(store, id, 'react-strict-build');
  const check = report.checks.find((c) => c.id === 'react-strict-build');
  assert.equal(check.status, 'failed');
  assert.equal(check.evidence.findings[0].source.path, 'src/main.tsx');
  assert.equal(check.evidence.findings[0].source.line, 1);
  const plain = fixture(t);
  assert.equal(
    readProjectQuality(plain.store, plain.id).checks.find((c) => c.id === 'react-strict-build')
      .status,
    'notapplicable',
  );
});

test('the controlled React checker treats its real timeout as blocked rather than failed or passed', async (t) => {
  const { runControlledReactCheck } = await import('../scripts/studio/quality-react.mjs');
  const { qualitySnapshot } = await import('../scripts/studio/quality-storage.mjs');
  const { store, state } = fixture(t, {
    'package.json': '{"devmethod":{"profile":"react-ts"}}',
    'src/main.tsx': 'export const answer:number=42;',
  });
  const result = await runControlledReactCheck(qualitySnapshot(store, state.revisions[0]), {
    timeoutMs: 1,
  });
  assert.equal(result.status, 'blocked');
  assert.match(result.observed, /interrompue/);
  assert.equal(store.read().checks.length, 0);
});
