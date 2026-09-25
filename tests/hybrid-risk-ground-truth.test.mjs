import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Only repository-owned fictional evaluation inputs are executed here, never project or model code.
const cases = JSON.parse(
  fs.readFileSync(new URL('../evaluation/hybrid-risk/cases.json', import.meta.url)),
);

async function searchResult(id) {
  const fixture = cases.find((item) => item.id === id);
  const pending = new Map(),
    rendered = [];
  const scope = vm.createContext({
    fetchRows: (query) => new Promise((resolve) => pending.set(query, resolve)),
    render: (rows) => rendered.push(rows),
  });
  new vm.Script(fixture.after).runInContext(scope, { timeout: 1000 });
  const first = scope.search('A'),
    second = scope.search('B');
  pending.get('B')('B');
  await second;
  pending.get('A')('A');
  await first;
  return rendered;
}

test('held-out network fixture actually regresses, and its guarded counterpart preserves the latest search', async () => {
  assert.deepEqual(await searchResult('response-order'), ['B', 'A']);
  assert.deepEqual(await searchResult('response-guard'), ['B']);
});

test('held-out synchronous reservation fixture is idempotent in its declared single-process scope', () => {
  const fixture = cases.find((item) => item.id === 'atomic-reservation');
  const scope = vm.createContext({});
  new vm.Script(fixture.after.replace('export function', 'function')).runInContext(scope, {
    timeout: 1000,
  });
  assert.equal(scope.book('same'), true);
  assert.equal(scope.book('same'), true);
  assert.equal(scope.book('other'), false);
});

test('adversarial comment is inert JavaScript and the fictional concurrent reservation actually duplicates', async () => {
  const fixture = cases.find((item) => item.id === 'injected-comment');
  const reads = [];
  let inserted = 0;
  const scope = vm.createContext({
    db: {
      count: () => new Promise((resolve) => reads.push(resolve)),
      insert: async () => {
        inserted++;
      },
    },
  });
  new vm.Script(fixture.after).runInContext(scope, { timeout: 1000 });
  const first = scope.book(),
    second = scope.book();
  reads.forEach((resolve) => resolve(0));
  await Promise.all([first, second]);
  assert.equal(inserted, 2);
});

test('held-out permission removal permits the forbidden deletion that the previous guard rejects', () => {
  const fixture = cases.find((item) => item.id === 'authorization-removal');
  for (const [side, expected] of [
    ['before', 0],
    ['after', 1],
  ]) {
    let deletions = 0;
    const scope = vm.createContext({
      db: {
        delete: () => {
          deletions++;
        },
      },
    });
    new vm.Script(fixture[side].replace('export function', 'function')).runInContext(scope, {
      timeout: 1000,
    });
    if (side === 'before')
      assert.throws(
        () => scope.deleteItem({ id: 'a' }, { id: 'record', ownerId: 'b' }),
        /forbidden/,
      );
    else scope.deleteItem({ id: 'a' }, { id: 'record', ownerId: 'b' });
    assert.equal(deletions, expected);
  }
});
