import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD,
  createGraphLayout,
  filterGraph,
  graphBounds,
  graphChanges,
  redactTrace,
} from '../studio-ui/src/features/project/components/architecture-model.ts';

function element(id, { type = 'service', layer = 'backend', sources = [], ...rest } = {}) {
  return {
    id,
    label: id,
    type,
    layer,
    sources,
    provenance: [],
    description: '',
    runtime: 'not_observed',
    details: {},
    ...rest,
  };
}

function analysis(elements, overrides = {}) {
  return { elements, relations: [], files: [], ...overrides };
}

const filters = { search: '', elementType: 'all', relationKind: 'all', details: false, limit: 40 };

test('refreshes, removals and additions retain existing graph positions without overlap', () => {
  const a = element('a');
  const b = element('b');
  const first = createGraphLayout([b, a]);
  const second = createGraphLayout([element('new'), b], first);
  assert.deepEqual(second.positions.b, first.positions.b);
  assert.notDeepEqual(second.positions.new, first.positions.a);
  assert.equal(new Set(Object.values(second.positions).map(({ x, y }) => `${x}:${y}`)).size, 3);
  const restored = createGraphLayout([a, b, element('new')], second);
  assert.deepEqual(restored.positions.a, first.positions.a);
});

test('a reclassified element moves to its actual layer while its peers stay fixed', () => {
  const first = createGraphLayout([element('a'), element('b')]);
  const next = createGraphLayout([element('a', { layer: 'frontend' }), element('b')], first);
  assert.deepEqual(next.positions.b, first.positions.b);
  assert.notEqual(next.positions.a.x, first.positions.a.x);
  assert.equal(next.positions.a.x, next.lanes.frontend * CARD.column + 24);
});

test('primary components are visible before numerous detail modules in their layer', () => {
  const modules = Array.from({ length: 100 }, (_, n) =>
    element(`a-module-${n}`, { type: 'module' }),
  );
  const layout = createGraphLayout([...modules, element('z-primary')]);
  assert.ok(modules.every(({ id }) => layout.positions[id].y > layout.positions['z-primary'].y));
});

test('filters reveal selected detail sources and never emit dangling relations', () => {
  const input = analysis(
    [
      element('web', { type: 'frontend', layer: 'frontend' }),
      element('api'),
      element('logic', { type: 'module', sources: [{ path: 'src/Préparation.ts' }] }),
    ],
    {
      relations: [
        { id: 'r1', source: 'web', target: 'api', kind: 'http' },
        { id: 'r2', source: 'api', target: 'logic', kind: 'import' },
      ],
    },
  );
  assert.deepEqual(
    filterGraph(input, filters, null).relations.map(({ id }) => id),
    ['r1'],
  );
  assert.equal(filterGraph(input, filters, 'logic').elements.length, 3);
  const found = filterGraph(input, { ...filters, search: 'préparation' }, null);
  assert.deepEqual(
    found.elements.map(({ id }) => id),
    ['logic'],
  );
  assert.equal(found.relations.length, 0);
  const linked = filterGraph(input, { ...filters, details: true, relationKind: 'import' }, null);
  assert.deepEqual(
    linked.elements.map(({ id }) => id),
    ['api', 'logic'],
  );
});

test('large graphs report omitted elements and edges; a selected element stays inside the cap', () => {
  const elements = Array.from({ length: 120 }, (_, n) => element(`n${n}`));
  const relations = Array.from({ length: 240 }, (_, n) => ({
    id: `r${n}`,
    source: 'n0',
    target: 'n1',
    kind: 'http',
  }));
  const view = filterGraph(analysis(elements, { relations }), filters, 'n119');
  assert.equal(view.total, 120);
  assert.equal(view.elements.length, 40);
  assert.ok(view.elements.some(({ id }) => id === 'n119'));
  assert.equal(view.relations.length, 200);
  assert.equal(view.omittedRelations, 40);
});

test('version changes include source content changes even when node identity is unchanged', () => {
  const service = element('api', { sources: [{ path: 'api.ts' }] });
  const previous = analysis([service], { files: [{ path: 'api.ts', sha256: 'before' }] });
  const current = analysis([service, element('new')], {
    files: [{ path: 'api.ts', sha256: 'after' }],
  });
  assert.deepEqual(
    [...graphChanges(current, previous)],
    [
      ['api', 'modified'],
      ['new', 'added'],
    ],
  );
  assert.equal(graphChanges(previous, previous).size, 0);
  assert.equal(graphChanges(current, null).size, 0);
});

test('bounds handle an empty filtered graph and never depend on hidden reserved slots', () => {
  const elements = [element('a'), element('b')];
  const layout = createGraphLayout(elements);
  assert.deepEqual(graphBounds([], layout), { x: 0, y: 0, width: 880, height: 460 });
  const one = graphBounds([elements[0]], layout);
  assert.ok(one.height < graphBounds(elements, layout).height);
  assert.ok(one.width >= CARD.width);
});

test('displayed traces mask common credentials and addresses while preserving useful errors', () => {
  const raw =
    'HTTP 504 Bearer synthetic-token api_key=sample123&x=1 {"password":"two words", "token": "fake"} mail=user@example.test';
  const safe = redactTrace(raw);
  assert.match(safe, /HTTP 504/);
  assert.match(safe, /x=1/);
  for (const secret of ['synthetic-token', 'sample123', 'two words', 'fake', 'user@example.test'])
    assert.equal(safe.includes(secret), false);
});
