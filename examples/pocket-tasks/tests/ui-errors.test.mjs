import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function ui(failure) {
  const nodes = new Map();
  const element = () => ({
    textContent: '',
    value: '',
    hidden: false,
    disabled: false,
    dataset: {},
    listeners: new Map(),
    setAttribute() {},
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    },
    replaceChildren() {},
    append() {},
    focus() {
      this.focused = true;
    },
  });
  for (const selector of [
    '#status',
    '#error',
    '#retry',
    '#tasks',
    '#empty',
    '#count',
    '#add-form',
    '#new-title',
  ])
    nodes.set(selector, element());
  nodes.get('#new-title').value = '   ';
  const requests = [];
  let reads = 0;
  const context = vm.createContext({
    document: {
      querySelector: (selector) => nodes.get(selector) ?? null,
      querySelectorAll: (selector) =>
        selector === 'button,input' ? [nodes.get('#new-title'), nodes.get('#retry')] : [],
      createElement: element,
    },
    fetch: async (url, options = {}) => {
      requests.push({ url, ...options });
      if (!options.method) {
        reads += 1;
        const tasks =
          failure === 404 && reads === 1
            ? [{ id: 'gone', title: 'Removed elsewhere', done: false }]
            : [];
        return { status: 200, ok: true, json: async () => ({ tasks }) };
      }
      if (failure === 'network') throw new Error('Network unavailable.');
      if (failure === 'success')
        return {
          status: 201,
          ok: true,
          json: async () => ({
            task: { id: 'created', title: JSON.parse(options.body).title.trim(), done: false },
          }),
        };
      return {
        status: failure,
        ok: false,
        json: async () => ({
          error: failure === 404 ? 'Task not found.' : 'Title must contain 1–120 characters.',
        }),
      };
    },
  });
  vm.runInContext(await readFile(new URL('../public/app.js', import.meta.url), 'utf8'), context);
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  await settle();
  async function submit(title) {
    nodes.get('#new-title').value = title;
    const listener = nodes.get('#add-form').listeners.get('submit');
    assert.equal(typeof listener, 'function', 'The add form must register its submit listener.');
    let prevented = false;
    listener({
      preventDefault() {
        prevented = true;
      },
    });
    await settle();
    assert.equal(prevented, true, 'Submission must not navigate away from the app.');
  }
  return { nodes, context, requests, calls: () => requests.length, settle, submit };
}

test('definitive validation rejection preserves input and permits immediate correction without reload', async () => {
  const { nodes, calls, submit } = await ui(400);
  await submit('   ');
  assert.equal(nodes.get('#new-title').value, '   ');
  assert.equal(nodes.get('#new-title').disabled, false);
  assert.equal(nodes.get('#new-title').focused, true);
  assert.equal(nodes.get('#retry').hidden, true);
  assert.match(nodes.get('#error').textContent, /Title must contain/);
  assert.doesNotMatch(nodes.get('#error').textContent, /Reload/);
  assert.equal(
    nodes.get('#status').textContent,
    'Change rejected. Correct the input and try again.',
  );
  await submit('Corrected input');
  assert.equal(calls(), 3);
});

test('the registered add form creates a task and updates displayed state', async () => {
  const { nodes, requests, submit } = await ui('success');
  await submit('  Entered through the form  ');
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, '/api/tasks');
  assert.equal(requests[1].method, 'POST');
  assert.deepEqual(JSON.parse(requests[1].body), { title: '  Entered through the form  ' });
  assert.equal(nodes.get('#new-title').value, '');
  assert.equal(nodes.get('#count').textContent, '1 task · 1 active');
  assert.equal(nodes.get('#status').textContent, 'Task added.');
  assert.equal(nodes.get('#error').hidden, true);
});

test('a missing task offers reload and reconciles stale client state', async () => {
  const { nodes, context, settle } = await ui(404);
  assert.equal(nodes.get('#count').textContent, '1 task · 1 active');
  await vm.runInContext("mutate('/gone', 'PATCH', { title: 'Updated' }, 'Task updated.')", context);
  assert.equal(nodes.get('#retry').hidden, false);
  assert.match(nodes.get('#error').textContent, /Task not found.*Reload/);
  assert.doesNotMatch(nodes.get('#status').textContent, /Correct the input/);
  const reload = nodes.get('#retry').listeners.get('click');
  assert.equal(typeof reload, 'function');
  reload();
  await settle();
  assert.equal(nodes.get('#count').textContent, '0 tasks · 0 active');
  assert.equal(nodes.get('#error').hidden, true);
  assert.equal(nodes.get('#retry').hidden, true);
});

test('network and server failures retain reconciliation instruction', async () => {
  for (const failure of ['network', 500]) {
    const { nodes, context } = await ui(failure);
    await vm.runInContext("mutate('', 'POST', { title: 'Task' }, 'Task added.')", context);
    assert.equal(nodes.get('#retry').hidden, false);
    assert.match(nodes.get('#error').textContent, /Reload to check saved state/);
    assert.equal(nodes.get('#status').textContent, 'Change could not be confirmed.');
  }
});
