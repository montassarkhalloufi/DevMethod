import type { EvidenceEdge, EvidenceNode } from '../../../../src/control-plane/contracts';

const families: { title: string; kinds: EvidenceNode['kind'][] }[] = [
  { title: 'Intentions et critères', kinds: ['intention', 'criterion'] },
  { title: 'Décisions et compromis', kinds: ['decision'] },
  { title: 'Code, missions et agents', kinds: ['code', 'job', 'agent'] },
  { title: 'Analyses du projet', kinds: ['analysis'] },
  { title: 'Vérifications et preuves visuelles', kinds: ['check', 'visual'] },
  { title: 'Services et actions MCP', kinds: ['runtime', 'mcp'] },
  { title: 'Évaluation des risques', kinds: ['risk'] },
  { title: 'Interventions humaines', kinds: ['human'] },
  { title: 'Décision d’autonomie', kinds: ['autonomy'] },
];

export function wrapLabel(label: string, length = 26): string[] {
  const words = label
    .trim()
    .split(/\s+/)
    .flatMap((word) => {
      const letters = Array.from(word);
      const parts: string[] = [];
      for (let i = 0; i < letters.length; i += length)
        parts.push(letters.slice(i, i + length).join(''));
      return parts;
    });
  return words.reduce<string[]>((lines, word) => {
    const last = lines.length - 1;
    if (last >= 0 && Array.from(`${lines[last]} ${word}`).length <= length)
      lines[last] += ` ${word}`;
    else lines.push(word);
    return lines;
  }, []);
}

export interface NodeBox {
  node: EvidenceNode;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
  rowTop: number;
  rowBottom: number;
}

// Family order is a reading aid, not a newly asserted causal relationship.
// Real edges are routed in the empty space above/below rows and in the right gutter.
export function detailedLayout(nodes: EvidenceNode[]) {
  const boxes = new Map<string, NodeBox>();
  let y = 26;
  const groups = families.flatMap((family, index) => {
    const members = family.kinds.flatMap((kind) => nodes.filter((node) => node.kind === kind));
    if (!members.length) return [];
    const top = y;
    y += 70;
    for (let start = 0; start < members.length; start += 3) {
      const row = members
        .slice(start, start + 3)
        .map((node) => ({ node, lines: wrapLabel(node.label) }));
      const height = Math.max(...row.map(({ lines }) => 120 + lines.length * 20));
      row.forEach(({ node, lines }, column) => {
        boxes.set(node.id, {
          node,
          lines,
          number: boxes.size + 1,
          x: 28 + column * 248,
          y,
          width: 220,
          height,
          rowTop: y - 20,
          rowBottom: y + height + 20,
        });
      });
      y += height + 60;
    }
    const group = {
      id: String(index),
      title: family.title,
      count: members.length,
      y: top,
      height: y - top - 18,
    };
    y += 24;
    return [group];
  });
  return { boxes, groups, width: 840, height: Math.max(200, y) };
}

export function detailedEdgePath(start: NodeBox, end: NodeBox, track: number) {
  const sx = start.x + start.width / 2 + 34,
    ex = end.x + end.width / 2 - 34;
  const exitX = start.x + start.width + 12,
    entryX = end.x - 12;
  const sy = start.y + 42,
    ey = end.y + 42;
  const gutter = 774 + (track % 8) * 6;
  if (start.y === end.y) {
    const lane = start.rowTop - (track % 3) * 5;
    return `M${sx} ${sy} H${exitX} V${lane} H${entryX} V${ey} H${ex}`;
  }
  const down = end.y > start.y;
  const exit = down ? start.rowBottom : start.rowTop;
  const entry = down ? end.rowTop : end.rowBottom;
  return `M${sx} ${sy} H${exitX} V${exit} H${gutter} V${entry} H${entryX} V${ey} H${ex}`;
}

export const relationLabels: Record<EvidenceEdge['relation'], [string, string]> = {
  'depends-on': ['Dépend de', 'Est une dépendance de'],
  validates: ['Examine dans son périmètre', 'Est examiné par'],
  contradicts: ['Contredit', 'Est contredit par'],
  invalidates: ['Invalide', 'Est invalidé par'],
};

export function nodeRelations(nodeId: string, nodes: EvidenceNode[], edges: EvidenceEdge[]) {
  const index = new Map(nodes.map((node) => [node.id, node]));
  return edges.flatMap((edge) => {
    if (edge.from !== nodeId && edge.to !== nodeId) return [];
    const outgoing = edge.from === nodeId;
    const node = index.get(outgoing ? edge.to : edge.from);
    return node ? [{ edge, node, label: relationLabels[edge.relation][outgoing ? 0 : 1] }] : [];
  });
}
