import type { EvidenceEdge } from '../../../../src/control-plane/contracts';
import type { NodeBox } from './graph-layout';

export const edgeLabels = {
  'depends-on': 'Dépendance',
  validates: 'Validation à examiner',
  invalidates: 'Invalidation',
  contradicts: 'Contradiction',
};

// Shared segments are drawn once per relation type and direction. Dots mark
// actual joins; crossing differently coloured rails does not create a relation.
export function routeBundles(edges: EvidenceEdge[], selected: string, boxes: Map<string, NodeBox>) {
  const grouped = new Map<
    string,
    { relation: EvidenceEdge['relation']; outgoing: boolean; edges: EvidenceEdge[] }
  >();
  for (const edge of edges) {
    const outgoing = edge.from === selected;
    const key = `${edge.relation}:${outgoing}`;
    const group = grouped.get(key) ?? { relation: edge.relation, outgoing, edges: [] };
    group.edges.push(edge);
    grouped.set(key, group);
  }
  const source = boxes.get(selected);
  if (!source) return [];
  return [...grouped.values()].map((group, index) => {
    const rail = 778 + index * 18;
    const offset = index * 5 - (grouped.size - 1) * 2.5;
    const portY = source.y + 42 + offset;
    const portX = source.x + source.width / 2 + Math.sqrt(34 ** 2 - offset ** 2);
    const exitX = source.x + source.width + 8 + index * 2;
    const exitY = source.rowBottom + index * 2;
    const stem = group.outgoing
      ? `M${portX} ${portY} H${exitX} V${exitY} H${rail}`
      : `M${rail} ${exitY} H${exitX} V${portY} H${portX}`;
    const rows = new Map<number, NodeBox[]>();
    for (const edge of group.edges) {
      const box = boxes.get(group.outgoing ? edge.to : edge.from)!;
      rows.set(box.rowTop, [...(rows.get(box.rowTop) ?? []), box]);
    }
    const paths: { d: string; arrow: boolean }[] = [{ d: stem, arrow: !group.outgoing }];
    const joins: { x: number; y: number }[] = [];
    const levels = [exitY];
    for (const [rowTop, row] of rows) {
      const entryY = rowTop + index * 2;
      const left = Math.min(...row.map((box) => box.x - 12 + index * 2));
      paths.push({ d: `M${rail} ${entryY} H${left}`, arrow: false });
      joins.push({ x: rail, y: entryY });
      levels.push(entryY);
      for (const box of row) {
        const entryX = box.x - 12 + index * 2;
        const endX = box.x + box.width / 2 - Math.sqrt(34 ** 2 - offset ** 2);
        const endY = box.y + 42 + offset;
        paths.push({
          d: group.outgoing
            ? `M${entryX} ${entryY} V${endY} H${endX}`
            : `M${endX} ${endY} H${entryX} V${entryY}`,
          arrow: group.outgoing,
        });
        joins.push({ x: entryX, y: entryY });
      }
    }
    paths.push({ d: `M${rail} ${Math.min(...levels)} V${Math.max(...levels)}`, arrow: false });
    return { ...group, key: `${group.relation}:${group.outgoing}`, paths, joins, rail };
  });
}
