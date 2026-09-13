import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function ui(failure) {
  const nodes = new Map();
  const element = () => ({ textContent: '', value: '', hidden: false, disabled: false, dataset: {}, setAttribute() {}, addEventListener() {}, replaceChildren() {}, append() {}, focus() { this.focused = true; } });
  for (const selector of ['#status', '#error', '#retry', '#tasks', '#empty', '#count', '#add-form', '#new-title']) nodes.set(selector, element());
  nodes.get('#new-title').value = '   ';
  let calls = 0;
  const context = vm.createContext({
    document: { querySelector: selector => nodes.get(selector) ?? null, querySelectorAll: selector => selector === 'button,input' ? [nodes.get('#new-title'), nodes.get('#retry')] : [], createElement: element },
    fetch: async () => {
      calls += 1;
      if (calls === 1) return { status: 200, ok: true, json: async () => ({ tasks: [] }) };
      if (failure === 'network') throw new Error('Network unavailable.');
      return { status: failure, ok: false, json: async () => ({ error: 'Title must contain 1–120 characters.' }) };
    },
  });
  vm.runInContext(await readFile(new URL('../public/app.js', import.meta.url), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  return { nodes, context, calls: () => calls };
}

test('definitive validation rejection preserves input and permits immediate correction without reload', async () => {
  const { nodes, context, calls } = await ui(400);
  await vm.runInContext("mutate('', 'POST', { title: '   ' }, 'Task added.')", context);
  assert.equal(nodes.get('#new-title').value, '   ');
  assert.equal(nodes.get('#new-title').disabled, false);
  assert.equal(nodes.get('#new-title').focused, true);
  assert.equal(nodes.get('#retry').hidden, true);
  assert.match(nodes.get('#error').textContent, /Title must contain/);
  assert.doesNotMatch(nodes.get('#error').textContent, /Reload/);
  assert.equal(nodes.get('#status').textContent, 'Change rejected. Correct the input and try again.');
  nodes.get('#new-title').value = 'Corrected input';
  await vm.runInContext("mutate('', 'POST', { title: 'Corrected input' }, 'Task added.')", context);
  assert.equal(calls(), 3);
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
