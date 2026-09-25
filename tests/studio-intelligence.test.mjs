import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProjectIntelligence } from '../scripts/studio/intelligence.mjs';
import { fileManifest, digest } from '../scripts/studio/files.mjs';

function fixture(t, files) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dm-intelligence-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const state = { activeRevision: 'one', revisions: [], checks: [] };
  const store = { root, read: () => structuredClone(state) };
  const add = (id, entries) => {
    const app = path.join(root, 'revisions', id, 'app');
    fs.mkdirSync(app, { recursive: true });
    for (const [name, content] of Object.entries(entries)) {
      fs.mkdirSync(path.dirname(path.join(app, name)), { recursive: true });
      fs.writeFileSync(path.join(app, name), content);
    }
    state.revisions.push({ id, files: fileManifest(app) });
    return app;
  };
  const app = add('one', files);
  return { root, app, add, state, store, model: createProjectIntelligence({ store }) };
}

const monolith = {
  'package.json': JSON.stringify({
    dependencies: { react: '^19', express: '^5', pg: '^8', zod: '^4' },
    scripts: { test: 'must-not-run', dev: 'must-not-run' },
  }),
  'frontend/features/tasks/App.tsx': `import React from 'react'; import type {Task} from '../../../shared/task.js'; export function App() { return <button onClick={() => fetch('/tasks', { method: 'POST' })}>Add</button>; }`,
  'backend/server.ts': `import express from 'express'; import {Pool} from 'pg'; import {schema} from '../shared/task.js'; const app = express(); const db = new Pool(); app.get('/tasks', async (_req,res) => { try {res.json(await db.query('SELECT * FROM tasks'));} catch (error) {throw error;} }); app.post('/tasks', async (req,res) => res.json(await db.query('INSERT INTO tasks(title) VALUES ($1)', [req.body.title]))); app.patch('/tasks/:id', (_req,res) => res.end()); app.delete('/tasks/:id', (_req,res) => res.end());`,
  'shared/task.ts': `import {z} from 'zod'; export interface Task {id: string; title: string}; export const schema = z.object({title: z.string()});`,
  'tests/task.test.ts': `import {schema} from '../shared/task.js'; import assert from 'node:assert'; assert.ok(schema);`,
};

test('monolith extracts real file roles, CRUD routes, imports, contracts and code-only flows', (t) => {
  const f = fixture(t, monolith),
    { analysis } = f.model.read();
  assert.equal(analysis.files.length, 5);
  assert.equal(analysis.files.find((file) => file.path.endsWith('App.tsx')).layer, 'frontend');
  assert.equal(analysis.files.find((file) => file.path.endsWith('App.tsx')).feature, 'tasks');
  assert.equal(analysis.files.find((file) => file.path === 'backend/server.ts').layer, 'backend');
  assert.equal(analysis.backendDetected, true);
  assert.deepEqual(
    analysis.elements
      .filter((item) => item.type === 'endpoint')
      .map((item) => item.details.method)
      .sort(),
    ['DELETE', 'GET', 'PATCH', 'POST'],
  );
  assert.ok(analysis.elements.some((item) => item.type === 'contract' && item.label === 'Task'));
  assert.ok(
    analysis.elements.some(
      (item) => item.type === 'contract' && item.details.format === 'schéma Zod',
    ),
  );
  assert.ok(
    analysis.relations.some(
      (item) => item.kind === 'http' && item.target === 'endpoint:backend/server.ts:POST:/tasks',
    ),
  );
  assert.ok(analysis.relations.some((item) => item.kind === 'read' && item.target.includes('db')));
  assert.ok(analysis.relations.some((item) => item.kind === 'write' && item.target.includes('db')));
  assert.ok(
    analysis.relations.some(
      (item) => item.kind === 'tests' && item.target === 'file:shared/task.ts',
    ),
  );
  assert.ok(analysis.flows.some((item) => item.errors.length === 2));
  assert.ok(
    analysis.flows.every((item) => item.kind === 'code' && !item.trace && item.limits.length),
  );
  assert.ok(
    analysis.elements.every(
      (item) => item.runtime === 'not_observed' && item.provenance.length && item.sources.length,
    ),
  );
  assert.ok(analysis.relations.every((item) => item.provenance[0].sources[0].path));
  assert.ok(analysis.stack.includes('react'));
});

test('static frontend does not invent a backend from a fetch or confuse Studio with project', (t) => {
  const secret = 'never-show-this';
  const f = fixture(t, {
    'index.html': '<h1>Static</h1>',
    'app.js': `fetch('https://user:password@example.test/tasks?token=${secret}'); localStorage.setItem('draft', 'x'); const values = new Map(); values.get('/not-a-route');`,
    'style.css': 'body{}',
  });
  const { analysis } = f.model.read();
  assert.equal(analysis.backendDetected, false);
  assert.equal(analysis.elements.filter((item) => item.type === 'endpoint').length, 0);
  assert.ok(analysis.elements.some((item) => item.type === 'storage'));
  const serialized = JSON.stringify(analysis);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes('password'), false);
  assert.equal(
    analysis.files.some((item) => item.path.includes('preview.mjs')),
    false,
  );
  assert.equal(analysis.status, 'complete');
});

test('declared services remain unobserved; Python and partial coverage are explicit', (t) => {
  const f = fixture(t, {
    'devmethod.project.json': JSON.stringify({
      topology: 'services',
      services: [
        { id: 'web', name: 'Web', root: 'web', runtime: 'React Vite' },
        { id: 'api', name: 'API', root: 'api', runtime: 'Python FastAPI' },
      ],
    }),
    'web/App.tsx': 'export const App=()=> <h1>Hello</h1>',
    'api/main.py': 'from fastapi import FastAPI\napp = FastAPI()',
  });
  const { analysis } = f.model.read();
  const services = analysis.elements.filter((item) => item.type === 'service');
  assert.equal(services.length, 2);
  assert.ok(
    services.every(
      (item) => item.runtime === 'not_observed' && item.provenance[0].kind === 'declared',
    ),
  );
  assert.ok(
    analysis.relations.some(
      (item) => item.source === 'service:api' && item.target === 'file:api/main.py',
    ),
  );
  assert.equal(analysis.status, 'partial');
  assert.ok(analysis.issues.some((item) => item.path === 'api/main.py'));
});

test('colocated files and Nest/Next handlers are identified without fabricating processes', (t) => {
  const f = fixture(t, {
    'feature.tsx': `import express from 'express'; const app=express(); app.get('/ping', (_req,res)=>res.end()); export const View=()=> <button>Ping</button>;`,
    'app/api/tasks/route.ts': `export async function GET(){ return Response.json([]) }`,
    'tasks.controller.ts': `import {Controller,Get,Post} from '@nestjs/common'; @Controller('tasks') export class TasksController { @Get(':id') get() {} @Post() create() {} }`,
  });
  const { analysis } = f.model.read();
  assert.equal(analysis.files.find((file) => file.path === 'feature.tsx').layer, 'shared');
  assert.match(analysis.files.find((file) => file.path === 'feature.tsx').role, /colocalisés/);
  assert.ok(analysis.elements.some((item) => item.label === 'GET /api/tasks'));
  assert.ok(analysis.elements.some((item) => item.label === 'GET /tasks/:id'));
  assert.ok(analysis.elements.some((item) => item.label === 'POST /tasks'));
});

test('config and schema declarations do not imply an implemented database', (t) => {
  const f = fixture(t, {
    'schema.prisma': 'model Task {\n id String @id\n}',
    'migration.sql': 'CREATE TABLE tasks (id TEXT PRIMARY KEY);',
    'openapi.json': JSON.stringify({
      openapi: '3.1.0',
      paths: { '/tasks': { get: {} } },
      components: { schemas: { Task: { type: 'object' } } },
    }),
  });
  const { analysis } = f.model.read();
  assert.equal(analysis.elements.filter((item) => item.type === 'contract').length, 3);
  assert.equal(analysis.elements.filter((item) => item.type === 'database').length, 0);
  assert.ok(
    analysis.elements
      .find((item) => item.type === 'endpoint')
      .provenance.every((item) => item.kind === 'declared'),
  );
});

test('version diff keeps IDs stable and isolates checks, additions and removals', (t) => {
  const f = fixture(t, monolith);
  f.state.checks = [
    { id: 'check-one', revisionId: 'one', status: 'passed' },
    { id: 'other', revisionId: 'elsewhere' },
  ];
  const next = {
    ...monolith,
    'shared/task.ts': monolith['shared/task.ts'] + '\nexport type TaskId=string;',
    'new.ts': 'export const newItem = 1',
  };
  delete next['tests/task.test.ts'];
  f.add('two', next);
  const { analysis, previous, impact } = f.model.read({ revisionId: 'two', baseRevisionId: 'one' });
  assert.equal(analysis.revisionId, 'two');
  assert.equal(previous.revisionId, 'one');
  assert.deepEqual(impact.staleCheckIds, ['check-one']);
  assert.deepEqual(
    impact.changes.map((entry) => [entry.path, entry.kind]),
    [
      ['new.ts', 'added'],
      ['shared/task.ts', 'modified'],
      ['tests/task.test.ts', 'removed'],
    ],
  );
  const changed = impact.changes.find((entry) => entry.path === 'shared/task.ts');
  assert.ok(changed.consumerIds.includes('file:backend/server.ts'));
  assert.ok(changed.testIds.includes('file:tests/task.test.ts'));
  assert.ok(changed.contractIds.includes('contract:shared/task.ts:Task'));
  assert.ok(previous.elements.some((item) => item.id === 'contract:shared/task.ts:Task'));
  assert.equal(analysis.checks, undefined);
});

test('cached analysis rechecks complete manifests and hashes and never exposes cache mutation', (t) => {
  const f = fixture(t, { 'a.js': 'export const value=1;' }),
    first = f.model.read();
  first.analysis.files.length = 0;
  assert.equal(f.model.read().analysis.files.length, 1);
  fs.writeFileSync(path.join(f.app, 'a.js'), 'export const value=2;');
  assert.throws(() => f.model.read(), { status: 409 });
  fs.writeFileSync(path.join(f.app, 'a.js'), 'export const value=1;');
  fs.writeFileSync(path.join(f.app, 'hidden.js'), 'unknown');
  assert.throws(() => f.model.read(), { status: 409 });
  assert.throws(() => f.model.read({ revisionId: 'missing' }), { status: 404 });
});

test('persisted drafts have separate identity and fingerprint and never inherit base proof', (t) => {
  const f = fixture(t, { 'a.ts': 'export const value=1;' });
  f.state.checks = [{ id: 'base-check', revisionId: 'one' }];
  const content = 'export const value=2;',
    calls = [];
  const editor = {
    read: (base) => {
      calls.push(base);
      return {
        baseRevision: 'one',
        version: 3,
        changedPaths: ['a.ts'],
        files: [
          {
            path: 'a.ts',
            content,
            sha256: digest(content),
            bytes: Buffer.byteLength(content),
            binary: false,
            truncated: false,
          },
        ],
      };
    },
  };
  const model = createProjectIntelligence({ store: f.store, editor });
  const result = model.read({ revisionId: 'one', draft: true });
  assert.deepEqual(calls, [null]);
  assert.match(result.analysis.revisionId, /^draft:one:3:/);
  assert.equal(result.analysis.baseRevisionId, 'one');
  assert.equal(result.analysis.localChanges, true);
  assert.notEqual(result.analysis.fingerprint, result.previous.fingerprint);
  assert.deepEqual(result.impact.staleCheckIds, ['base-check']);
  assert.equal(result.analysis.checks, undefined);
  f.add('two', { 'a.ts': content });
  assert.throws(() => model.read({ revisionId: 'two', draft: true }), { status: 409 });
  assert.equal(f.state.activeRevision, 'one');
});

test('unsupported and dynamic analysis is partial instead of inventing a destination', (t) => {
  const f = fixture(t, {
    'main.ts': 'const url = runtimeValue(); fetch(url); import(url);',
    'broken.ts': 'const x: = ;',
  });
  const { analysis } = f.model.read();
  assert.equal(analysis.status, 'partial');
  assert.equal(
    analysis.elements.some((entry) => entry.type === 'endpoint'),
    false,
  );
  assert.ok(analysis.issues.some((entry) => entry.message.includes('URL calculée')));
  assert.ok(analysis.issues.some((entry) => entry.path === 'broken.ts'));
});

test('unchanged draft keeps the content fingerprint despite editor file ordering', (t) => {
  const entries = { 'a.ts': 'export const a=1;', 'B.ts': 'export const b=2;' };
  const f = fixture(t, entries);
  const editor = {
    read: () => ({
      baseRevision: 'one',
      version: 1,
      changedPaths: [],
      files: Object.entries(entries).map(([path, content]) => ({
        path,
        content,
        sha256: digest(content),
        bytes: Buffer.byteLength(content),
        binary: false,
        truncated: false,
      })),
    }),
  };
  const result = createProjectIntelligence({ store: f.store, editor }).read({ draft: true });
  assert.equal(result.analysis.fingerprint, result.previous.fingerprint);
  assert.equal(result.analysis.localChanges, false);
  assert.match(result.analysis.scope, /Brouillon/);
  assert.deepEqual(result.impact.changes, []);
});

test('JSONC tsconfig aliases resolve to real local files and libraries are never services', (t) => {
  const f = fixture(t, {
    'tsconfig.json':
      '{\n // shared project options\n "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"], "@exact": ["src/shared/task.ts"] } },\n}',
    'src/App.tsx':
      "import React from 'react'; import fs from 'node:fs'; import {Task} from '@/shared/task'; import '@exact'; export const App=()=> <h1/>;",
    'src/shared/task.ts': 'export interface Task {id: string}',
  });
  const { analysis } = f.model.read();
  const aliases = analysis.relations.filter(
    (relation) =>
      relation.kind === 'import' && ['@/shared/task', '@exact'].includes(relation.label),
  );
  assert.equal(aliases.length, 2);
  assert.ok(aliases.every((relation) => relation.target === 'file:src/shared/task.ts'));
  assert.ok(
    aliases.every((relation) =>
      relation.provenance[0].sources.some((source) => source.path === 'tsconfig.json'),
    ),
  );
  assert.equal(
    analysis.elements.some((element) => element.type === 'external'),
    false,
  );
  assert.ok(
    analysis.elements
      .find((element) => element.label.startsWith('react'))
      .description.includes('Bibliothèque'),
  );
  assert.ok(
    analysis.elements
      .find((element) => element.label.startsWith('node:fs'))
      .description.includes('Bibliothèque'),
  );
  assert.equal(analysis.issues.length, 0);
});

test('nearest tsconfig and inherited baseUrl resolve monorepo aliases without crossing snapshots', (t) => {
  const f = fixture(t, {
    'tsconfig.base.json': JSON.stringify({
      compilerOptions: { baseUrl: '.', paths: { '@/*': ['shared/*'] } },
    }),
    'tsconfig.json': JSON.stringify({ extends: './tsconfig.base.json' }),
    'shared/task.ts': 'export const task=1;',
    'main.ts': "import {task} from '@/task';",
    'web/tsconfig.json': JSON.stringify({ compilerOptions: { paths: { '@/*': ['src/*'] } } }),
    'web/App.tsx': "import '@/task'; import '@unknown/library'; export const App=()=> <h1/>;",
    'web/src/task.ts': 'export const task=2;',
  });
  const { analysis } = f.model.read();
  assert.ok(
    analysis.relations.some(
      (relation) => relation.source === 'file:main.ts' && relation.target === 'file:shared/task.ts',
    ),
  );
  assert.ok(
    analysis.relations.some(
      (relation) =>
        relation.source === 'file:web/App.tsx' && relation.target === 'file:web/src/task.ts',
    ),
  );
  assert.equal(
    analysis.elements.some((element) => element.type === 'external'),
    false,
  );
});

test('an HTTP module has a code dependency flow without an invented UI event or backend', (t) => {
  const f = fixture(t, {
    'services/client.ts': "export async function load(){return fetch('/api/tasks')}",
  });
  const { analysis } = f.model.read();
  assert.equal(analysis.flows.length, 1);
  assert.equal(analysis.flows[0].entryId, 'file:services/client.ts');
  assert.equal(analysis.flows[0].kind, 'code');
  assert.equal(analysis.backendDetected, false);
  assert.equal(
    analysis.elements.some((element) => element.type === 'external'),
    false,
  );
  assert.equal(analysis.flows[0].trace, undefined);
});
