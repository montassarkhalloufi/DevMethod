import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detailedLayout,
  detailedEdgePath,
  nodeRelations,
  wrapLabel,
} from '../studio-ui/src/features/control/graph-layout.ts';

test('dense evidence graphs preserve every node and complete label with nonoverlapping rows and routing gutters', () => {
  const kinds = [
    'intention',
    'criterion',
    'decision',
    'code',
    'analysis',
    'check',
    'visual',
    'runtime',
    'mcp',
    'job',
    'agent',
    'risk',
    'human',
    'autonomy',
  ];
  const nodes = Array.from({ length: 90 }, (_, index) => ({
    id: `node:${index}`,
    kind: kinds[index % kinds.length],
    label: `${index} · Une preuve détaillée concernant la gestion des permissions et des accès utilisateurs`,
  }));
  const layout = detailedLayout(nodes);
  const boxes = [...layout.boxes.values()];
  assert.equal(boxes.length, nodes.length);
  assert.equal(
    layout.groups.reduce((count, group) => count + group.count, 0),
    nodes.length,
  );
  for (const box of boxes) {
    assert.equal(box.lines.join(' '), box.node.label);
    assert.ok(box.x + box.width < 774, 'right gutter stays clear of cards');
    assert.ok(box.rowTop < box.y && box.rowBottom > box.y + box.height);
    for (const other of boxes) {
      if (other === box) continue;
      assert.ok(
        box.x + box.width < other.x ||
          other.x + other.width < box.x ||
          box.y + box.height < other.y ||
          other.y + other.height < box.y,
        'node cards must never overlap',
      );
    }
  }
  const start = boxes[0],
    end = boxes.at(-1);
  assert.match(detailedEdgePath(start, end, 0), /H774/);
  assert.equal(
    wrapLabel('abcdefghijklmnopqrstuvwxyz0123456789').join(''),
    'abcdefghijklmnopqrstuvwxyz0123456789',
  );
});

test('relation navigation preserves edge direction, missing relations and cycles without inventing links', () => {
  const nodes = [{ id: 'code' }, { id: 'proof' }, { id: 'risk' }];
  const edges = [
    { id: 'v', from: 'proof', to: 'code', relation: 'validates' },
    { id: 'd', from: 'risk', to: 'proof', relation: 'depends-on' },
    { id: 'i', from: 'code', to: 'proof', relation: 'invalidates' },
    { id: 'unknown', from: 'proof', to: 'absent', relation: 'validates' },
  ];
  const relations = nodeRelations('proof', nodes, edges);
  assert.deepEqual(
    relations.map(({ node, label }) => [node.id, label]),
    [
      ['code', 'Examine dans son périmètre'],
      ['risk', 'Est une dépendance de'],
      ['code', 'Est invalidé par'],
    ],
  );
  assert.equal(nodeRelations('absent-other', nodes, edges).length, 0);
});
