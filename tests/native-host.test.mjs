import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { supervise, reserveRun, recordRun } from '../scripts/native-host.mjs';
import { codexArguments, codexUsage } from '../scripts/hosts/codex.mjs';
test('host supervisor distinguishes success, failure, missing executable and cancellation', async () => {
  const run = (code) =>
    supervise({
      command: process.execPath,
      args: ['-e', code],
      cwd: process.cwd(),
      prompt: '',
      timeoutMs: 2000,
    });
  assert.equal((await run('console.log("ok")')).status, 'exited');
  assert.equal((await run('process.exit(2)')).status, 'failed');
  assert.equal(
    (
      await supervise({
        command: 'nonexistent-devmethod-host',
        args: [],
        cwd: process.cwd(),
        prompt: '',
        timeoutMs: 1000,
      })
    ).status,
    'unavailable',
  );
  const c = new AbortController();
  c.abort();
  assert.equal(
    (
      await supervise({
        command: process.execPath,
        args: [],
        cwd: process.cwd(),
        timeoutMs: 1000,
        signal: c.signal,
      })
    ).status,
    'cancelled',
  );
});
test('host supervisor stops timeouts and excessive output', async () => {
  assert.equal(
    (
      await supervise({
        command: process.execPath,
        args: ['-e', 'setInterval(()=>{},1000)'],
        cwd: process.cwd(),
        prompt: '',
        timeoutMs: 100,
      })
    ).status,
    'timeout',
  );
  assert.equal(
    (
      await supervise({
        command: process.execPath,
        args: ['-e', 'console.log("x".repeat(10000))'],
        cwd: process.cwd(),
        prompt: '',
        timeoutMs: 2000,
        maxBytes: 100,
      })
    ).status,
    'output-limit',
  );
});
test('ledger refuses concurrency, duplicate IDs, unknown usage and spent run budget', (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-ledger-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const slot = reserveRun(root, 'one');
  assert.throws(() => reserveRun(root, 'two'), /reconciliation/);
  recordRun(slot, { status: 'exited', usage: { inputTokens: 10, outputTokens: 2 } });
  assert.throws(() => reserveRun(root, 'one'));
  assert.throws(() => reserveRun(root, 'two', { maxRuns: 1 }), /Run limit/);
  assert.throws(() => reserveRun(root, 'two', { observedTokenStop: 10 }), /token stop/);
  const second = reserveRun(root, 'two');
  recordRun(second, { status: 'failed', usage: null });
  assert.throws(() => reserveRun(root, 'three'), /reconciliation/);
});
test('ledger rejects malformed or unsafe recorded usage without admitting or rewriting slots', (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-ledger-invalid-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const invalid = [
    undefined,
    {},
    [],
    { inputTokens: 1 },
    { inputTokens: 1, outputTokens: null },
    { inputTokens: -1, outputTokens: 0 },
    { inputTokens: 0.5, outputTokens: 0 },
    { inputTokens: '1', outputTokens: 0 },
    { inputTokens: Number.MAX_SAFE_INTEGER + 1, outputTokens: 0 },
    { inputTokens: Number.MAX_SAFE_INTEGER, outputTokens: 1 },
  ];
  for (const [index, usage] of invalid.entries()) {
    const ledger = path.join(root, String(index));
    const slot = reserveRun(ledger, 'one');
    const running = fs.readFileSync(slot, 'utf8');
    assert.throws(
      () => recordRun(slot, { status: 'exited', usage }),
      /reconciliation|safe integer/,
    );
    assert.equal(fs.readFileSync(slot, 'utf8'), running);
    assert.equal(fs.existsSync(slot + '.tmp'), false);
    // Existing corrupt records must also fail closed, including records from older writers.
    fs.writeFileSync(slot, JSON.stringify({ id: 'one', status: 'exited', usage }));
    const malformed = fs.readFileSync(slot, 'utf8');
    assert.throws(() => reserveRun(ledger, 'two'), /reconciliation|safe integer/);
    assert.equal(fs.readFileSync(slot, 'utf8'), malformed);
    assert.equal(fs.existsSync(path.join(ledger, 'two.json')), false);
    assert.equal(fs.existsSync(path.join(ledger, '.lock')), false);
  }
  const ledger = path.join(root, 'aggregate');
  fs.mkdirSync(ledger);
  for (const id of ['one', 'two'])
    fs.writeFileSync(
      path.join(ledger, id + '.json'),
      JSON.stringify({
        id,
        status: 'exited',
        usage: { inputTokens: Number.MAX_SAFE_INTEGER, outputTokens: 0 },
      }),
    );
  assert.throws(() => reserveRun(ledger, 'three'), /safe integer/);
  assert.equal(fs.existsSync(path.join(ledger, 'three.json')), false);
});
test('ledger preserves genuine zero usage and explicit unmetered terminal outcomes', (t) => {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'devmethod-ledger-terminal-'),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const slot = reserveRun(root, 'one');
  const running = fs.readFileSync(slot, 'utf8');
  assert.throws(
    () => recordRun(slot, { status: 'running', usage: { inputTokens: 0, outputTokens: 0 } }),
    /terminal/,
  );
  assert.equal(fs.readFileSync(slot, 'utf8'), running);
  recordRun(slot, {
    status: 'exited',
    usage: { inputTokens: 0, outputTokens: 0, cachedInputTokens: null, costUSD: null },
  });
  const second = reserveRun(root, 'two');
  recordRun(second, { status: 'cancelled', usage: null });
  assert.equal(JSON.parse(fs.readFileSync(second)).usage, null);
  assert.throws(() => reserveRun(root, 'three'), /reconciliation/);
  for (const status of ['interrupted', 'incomplete']) {
    const ledger = path.join(root, status);
    const file = reserveRun(ledger, 'one');
    recordRun(file, { status, usage: { inputTokens: 20, outputTokens: 2, costUSD: null } });
    assert.equal(JSON.parse(fs.readFileSync(file)).status, status);
    assert.throws(() => reserveRun(ledger, 'two'), /reconciliation/);
  }
});
test('Codex adapter pins sandbox/model and never fabricates unavailable cost or tokens', () => {
  const args = codexArguments({ directory: '/fixture', model: 'gpt-5.6-sol' });
  assert.ok(args.includes('workspace-write'));
  assert.ok(!args.some((a) => a.includes('bypass')));
  assert.equal(codexUsage([]), null);
  assert.equal(
    codexUsage([{ type: 'turn.completed', usage: { input_tokens: 1, output_tokens: -1 } }]),
    null,
  );
  assert.deepEqual(
    codexUsage([
      {
        type: 'turn.completed',
        usage: { input_tokens: 12, output_tokens: 4, cached_input_tokens: 6 },
      },
    ]),
    { inputTokens: 12, outputTokens: 4, cachedInputTokens: 6, costUSD: null },
  );
});

test('active cancellation stops a running process', async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100);
  const r = await supervise({
    command: process.execPath,
    args: ['-e', 'setInterval(()=>{},1000)'],
    cwd: process.cwd(),
    prompt: '',
    timeoutMs: 2000,
    signal: controller.signal,
  });
  clearTimeout(timer);
  assert.equal(r.status, 'cancelled');
  assert.ok(r.elapsedSeconds < 2);
});
test('Codex parent environment excludes alternate API credentials and provider routing', async () => {
  const { codexEnvironment } = await import('../scripts/hosts/codex.mjs');
  assert.deepEqual(
    codexEnvironment({
      PATH: '/bin',
      HOME: '/home/test',
      OPENAI_API_KEY: 'private',
      OPENAI_BASE_URL: 'https://other',
      ANTHROPIC_API_KEY: 'private',
    }),
    { PATH: '/bin', HOME: '/home/test' },
  );
  assert.ok(
    codexArguments({ directory: '/fixture', model: 'gpt-5.6-sol' }).includes(
      'sandbox_workspace_write.exclude_slash_tmp=true',
    ),
  );
});

test(
  'POSIX timeout terminates descendants in the supervised process group',
  { skip: process.platform === 'win32' },
  async () => {
    const code = `const {spawn}=require('node:child_process'); const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'}); console.log(c.pid); setInterval(()=>{},1000);`;
    const result = await supervise({
      command: process.execPath,
      args: ['-e', code],
      cwd: process.cwd(),
      prompt: '',
      timeoutMs: 300,
    });
    assert.equal(result.status, 'timeout');
    const pid = Number(result.stdout.trim());
    assert.ok(Number.isInteger(pid) && pid > 0);
    let alive = true;
    for (let i = 0; i < 20; i++) {
      try {
        process.kill(pid, 0);
      } catch {
        alive = false;
        break;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.equal(alive, false, 'descendant must not survive the timed-out parent');
  },
);
