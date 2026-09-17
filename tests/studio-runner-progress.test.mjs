import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, updateProject } from '../scripts/studio/domain.mjs';
import { createAgentRunner, runProcess } from '../scripts/studio/runner.mjs';
import { createRunnerProgress, jsonLines } from '../scripts/studio/runner-progress.mjs';

function progressFixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-events-'));
  fs.mkdirSync(path.join(directory, 'app'));
  const controller = new AbortController();
  const events = [];
  const progress = createRunnerProgress({
    directory,
    jobId: 'job',
    jobs: { reportProgress: (input) => events.push(input.event) },
    signal: controller.signal,
    timeoutMs: 1000,
    pollMs: 10,
    ...options,
  });
  t.after(() => {
    progress.stop(false);
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory,
    controller,
    events,
    progress,
    append(value) {
      fs.appendFileSync(path.join(directory, 'progress.jsonl'), JSON.stringify(value) + '\n');
    },
  };
}

const plan = (status = 'running') => ({
  type: 'plan',
  title: 'Créer la page',
  steps: [{ id: 'page', title: 'Écrire la page', status }],
});
const cli = (type, id, extra = {}, phase = 'item.completed') => ({
  type: phase,
  item: { type, id, ...extra },
});

test('JSONL handles split UTF-8, malformed and oversized lines without leaking fragments', () => {
  const values = [],
    decode = jsonLines((value) => values.push(value), 40);
  const bytes = Buffer.from('{"title":"Créer"}\n');
  for (const byte of bytes) decode(Buffer.from([byte]));
  decode('diagnostic\n' + 'x'.repeat(100));
  decode('{"hidden":true}\n{"accepted":true}\n{"partial":');
  assert.deepEqual(values, [{ title: 'Créer' }, { accepted: true }]);
  decode('true}');
  decode.end();
  assert.deepEqual(values.at(-1), { partial: true });
});

test('CLI actions expose lifecycle and application paths, never command text, outputs or inferred reads', (t) => {
  const f = progressFixture(t);
  f.progress.onEvent(
    cli(
      'command_execution',
      'a',
      { command: 'cat .env; echo PRIVATE', aggregated_output: 'PRIVATE' },
      'item.started',
    ),
  );
  f.progress.onEvent(cli('command_execution', 'a', { exit_code: 7 }));
  f.progress.onEvent(cli('command_execution', 'a', { exit_code: 0 }));
  f.progress.onEvent(
    cli('file_change', 'b', {
      changes: [
        { path: 'app/src/main.tsx' },
        { path: path.join(f.directory, 'app/style.css') },
        { path: '../outside.txt' },
        { path: 'context.json' },
        { path: 'app/.env' },
      ],
    }),
  );
  f.progress.onEvent(cli('mcp_tool_call', 'private', { result: 'PRIVATE', tool: 'read' }));
  f.progress.onEvent(cli('agent_message', 'c', { text: 'PRIVATE' }));
  assert.deepEqual(
    f.events.map((event) => [event.kind, event.status, event.path]),
    [
      ['command', 'running', undefined],
      ['command', 'failed', undefined],
      ['write', 'completed', 'src/main.tsx'],
      ['write', 'completed', 'style.css'],
      ['message', 'completed', undefined],
    ],
  );
  assert.doesNotMatch(
    JSON.stringify(f.events),
    /PRIVATE|\.env|outside|context\.json|cat |aggregated_output/,
  );
});

test('different CLI item and file pairs retain distinct action identities', (t) => {
  const f = progressFixture(t);
  f.progress.onEvent(cli('file_change', 'item_1', { changes: [{ path: 'app/1main.ts' }] }));
  f.progress.onEvent(cli('file_change', 'item_11', { changes: [{ path: 'app/main.ts' }] }));
  assert.deepEqual(
    f.events.map((event) => [event.kind, event.path, event.status]),
    [
      ['write', '1main.ts', 'completed'],
      ['write', 'main.ts', 'completed'],
    ],
  );
  assert.notEqual(f.events[0].id, f.events[1].id);
});

test('file plan takes priority over CLI todos and keeps incomplete steps on successful exit', (t) => {
  const f = progressFixture(t);
  f.progress.onEvent(
    cli(
      'todo_list',
      'todo',
      { items: [{ text: 'Ancien plan', completed: false }] },
      'item.updated',
    ),
  );
  f.append(plan());
  f.progress.onEvent(
    cli('todo_list', 'todo', { items: [{ text: 'Ancien plan', completed: true }] }),
  );
  f.append(plan('blocked'));
  f.progress.finish();
  assert.equal(f.events.length, 3);
  assert.equal(f.events[0].steps[0].status, 'pending');
  assert.deepEqual(f.events.slice(1), [plan(), plan('blocked')]);
});

test('polling consumes partial file records only after newline and declares only admissible reads', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = progressFixture(t);
  const file = path.join(f.directory, 'progress.jsonl');
  fs.writeFileSync(file, JSON.stringify(plan()).slice(0, 30));
  t.mock.timers.tick(10);
  assert.equal(f.events.length, 0);
  fs.appendFileSync(file, JSON.stringify(plan()).slice(30) + '\n');
  f.append({
    type: 'action',
    id: 'read1',
    kind: 'read',
    label: 'PRIVATE',
    status: 'completed',
    path: 'src/main.tsx',
  });
  for (const invalid of ['/etc/passwd', '../outside', '.env'])
    f.append({ type: 'action', id: 'read2', kind: 'read', status: 'completed', path: invalid });
  f.append({
    type: 'action',
    id: 'duplicate',
    kind: 'command',
    label: 'PRIVATE',
    status: 'completed',
  });
  t.mock.timers.tick(10);
  assert.equal(f.events.length, 2);
  assert.equal(f.events[1].path, 'src/main.tsx');
  assert.match(f.events[1].label, /déclarée/);
  assert.doesNotMatch(JSON.stringify(f.events), /PRIVATE|passwd|outside|\.env/);
});

test('file watcher stops on finish, cancellation or timeout and ignores all late callbacks', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  for (const reason of ['finish', 'abort', 'timeout']) {
    const f = progressFixture(t);
    f.append(plan());
    t.mock.timers.tick(10);
    if (reason === 'finish') f.progress.finish();
    if (reason === 'abort') f.controller.abort();
    if (reason === 'timeout') t.mock.timers.tick(1000);
    f.append(plan('completed'));
    f.progress.onEvent(cli('command_execution', 'late', { exit_code: 0 }));
    t.mock.timers.tick(1000);
    f.progress.finish();
    assert.deepEqual(f.events, [plan()], reason);
  }
});

test('an interrupted executor leaves unconfirmed command and read outcomes unfinished', (t) => {
  const f = progressFixture(t);
  f.progress.onEvent(cli('command_execution', 'run', {}, 'item.started'));
  f.append({ type: 'action', id: 'read', kind: 'read', status: 'running', path: 'index.html' });
  f.progress.finish();
  assert.deepEqual(
    f.events.map((event) => [event.kind, event.status]),
    [
      ['command', 'running'],
      ['read', 'running'],
    ],
  );
});

test('oversized or symlinked files are ignored and progress admission remains bounded', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const oversized = progressFixture(t);
  fs.writeFileSync(path.join(oversized.directory, 'progress.jsonl'), ' '.repeat(256 * 1024 + 1));
  t.mock.timers.tick(10);
  oversized.append(plan());
  t.mock.timers.tick(10);
  assert.deepEqual(oversized.events, []);
  const linked = progressFixture(t);
  fs.writeFileSync(path.join(linked.directory, 'private.jsonl'), JSON.stringify(plan()) + '\n');
  fs.symlinkSync('private.jsonl', path.join(linked.directory, 'progress.jsonl'));
  linked.progress.finish();
  assert.deepEqual(linked.events, []);
  for (let index = 0; index < 600; index++)
    oversized.progress.onEvent(cli('command_execution', `item-${index}`, { exit_code: 0 }));
  assert.equal(oversized.events.length, 500);
});

test('progress rejection is contained without retries or overriding executor outcome', (t) => {
  let calls = 0;
  const f = progressFixture(t, {
    jobs: {
      reportProgress() {
        calls++;
        throw new Error('closed');
      },
    },
  });
  assert.doesNotThrow(() => f.progress.onEvent(cli('command_execution', 'item', { exit_code: 0 })));
  f.progress.finish();
  f.progress.onEvent(cli('command_execution', 'late', { exit_code: 0 }));
  assert.equal(calls, 1);
});

test(
  'real local process fixture rejects late stream failure despite exit zero and a result file',
  { skip: process.platform === 'win32' && 'Executable shebang fixture requires POSIX' },
  async (t) => {
    const f = progressFixture(t);
    const executable = path.join(f.directory, 'fake-cli.mjs');
    fs.writeFileSync(
      executable,
      `#!${process.execPath}\nimport fs from 'node:fs';\nconst output = process.argv[process.argv.indexOf('--output-last-message') + 1];\nfs.writeFileSync(output, JSON.stringify({title:'Fixture',summary:'Output'}));\nprocess.stdout.write('{"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":2}}\\n');\nprocess.stdout.write('{"type":"turn.failed","error":{"message":"PRIVATE"}}');\n`,
      { mode: 0o700 },
    );
    const events = [];
    const result = await runProcess({
      directory: f.directory,
      prompt: 'Local fixture',
      timeoutMs: 1000,
      signal: f.controller.signal,
      executable,
      onEvent: (event) => events.push(event.type),
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /Échec signalé/);
    assert.deepEqual(events, ['turn.completed', 'turn.failed']);
    assert.doesNotMatch(result.error, /PRIVATE/);
  },
);

test('runner reports safe observed actions and consumes the explicit plan before finishing', async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-progress-'));
  const store = createStudioStore(root);
  const receipts = [];
  let receivedPrompt;
  const jobs = createJobs(store);
  const reportProgress = jobs.reportProgress.bind(jobs);
  jobs.reportProgress = (input, source) => {
    receipts.push({ ...input, source });
    return reportProgress(input, source);
  };
  store.commit(store.read().version, (state) => {
    updateProject(state, { name: 'Fixture', idea: 'Local', mode: 'delegated', constraints: [] });
    queueRequest(state, { request: 'Write the page' });
  });
  const runner = createAgentRunner({
    store,
    jobs,
    options: { maxJobs: 1 },
    execute: async ({ directory, prompt, onEvent }) => {
      receivedPrompt = prompt;
      fs.writeFileSync(
        path.join(directory, 'progress.jsonl'),
        JSON.stringify({
          type: 'plan',
          title: 'Créer la page',
          steps: [{ id: 'page', title: 'Écrire la page', status: 'running' }],
        }) + '\n',
      );
      onEvent({
        type: 'item.started',
        item: {
          id: 'cmd1',
          type: 'command_execution',
          command: 'echo SECRET',
          aggregated_output: 'SECRET',
        },
      });
      onEvent({
        type: 'item.completed',
        item: { id: 'cmd1', type: 'command_execution', exit_code: 0, aggregated_output: 'SECRET' },
      });
      fs.writeFileSync(path.join(directory, 'app/index.html'), '<h1>Fixture</h1>');
      return {
        ok: true,
        result: { title: 'Fixture', summary: 'Written' },
        usage: { inputTokens: 1, outputTokens: 1 },
      };
    },
  });
  t.after(async () => {
    await runner.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  runner.wake();
  const deadline = Date.now() + 3000;
  while (runner.status().running) {
    assert.ok(Date.now() < deadline);
    await setImmediate();
  }
  assert.equal(store.read().jobs[0].status, 'ready');
  assert.match(receivedPrompt, /progress\.jsonl/);
  assert.deepEqual(
    receipts
      .filter((receipt) => receipt.event.kind === 'command')
      .map((receipt) => receipt.event.status),
    ['running', 'completed'],
  );
  assert.equal(receipts.filter((receipt) => receipt.event.type === 'plan').length, 1);
  assert.doesNotMatch(JSON.stringify(receipts), /SECRET|aggregated_output/);
  assert.equal(jobs.progress(store.read().jobs[0].id).plan.title, 'Créer la page');
  assert.deepEqual(store.read().checks, []);
});
