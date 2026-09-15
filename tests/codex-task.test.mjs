import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCodexTask } from '../scripts/hosts/codex-task.mjs';
test('wait for child completion after interrupt acknowledgement before finalizing usage', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-task-'));
  let childFinished = false,
    closed = false;
  try {
    const result = await runCodexTask({
      cwd,
      prompt: 'fixture',
      logFile: path.join(cwd, 'events.jsonl'),
      rpcFactory({ onEvent }) {
        const emit = (method, params) => onEvent({ method, params });
        const usage = (threadId) =>
          emit('thread/tokenUsage/updated', {
            threadId,
            tokenUsage: { total: { inputTokens: 10, outputTokens: 1 } },
          });
        return {
          notify() {},
          close() {
            closed = true;
            assert.equal(childFinished, true);
          },
          async call(method) {
            if (method === 'thread/start') return { thread: { id: 'root' } };
            if (method === 'turn/start') {
              emit('turn/started', { threadId: 'root', turn: { id: 'r' } });
              emit('item/started', {
                threadId: 'root',
                item: { type: 'subAgentActivity', agentThreadId: 'child' },
              });
              emit('turn/started', { threadId: 'child', turn: { id: 'c' } });
              usage('root');
              emit('turn/completed', { threadId: 'root', turn: { status: 'completed' } });
            }
            if (method === 'turn/interrupt')
              setTimeout(() => {
                childFinished = true;
                usage('child');
                emit('turn/completed', { threadId: 'child', turn: { status: 'interrupted' } });
              }, 20);
            return {};
          },
        };
      },
    });
    assert.equal(closed, true);
    assert.equal(result.status, 'incomplete');
    assert.deepEqual(result.usage, { inputTokens: 20, outputTokens: 2, costUSD: null });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('cancellation during initialization does not dispatch a model turn', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-cancel-'));
  const calls = [];
  try {
    const result = await runCodexTask({
      cwd,
      prompt: 'fixture',
      logFile: path.join(cwd, 'events.jsonl'),
      rpcFactory() {
        return {
          notify() {},
          close() {},
          async call(method) {
            calls.push(method);
            if (method === 'initialize') process.emit('SIGTERM');
            return {};
          },
        };
      },
    });
    assert.deepEqual(calls, ['initialize']);
    assert.equal(result.status, 'cancelled');
    assert.equal(result.usage, null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
