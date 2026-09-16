import type { ProjectAnalysis, ProjectElement, ProjectRelation } from '../model/contracts';

export interface Point {
  x: number;
  y: number;
}
export interface GraphLayout {
  signature: string;
  positions: Record<string, Point>;
  lanes: Record<string, number>;
}
export const CARD = { width: 218, height: 108, column: 280, row: 150 };
export const ELEMENT_LABELS: Record<ProjectElement['type'], string> = {
  frontend: 'Application frontend',
  module: 'Module',
  service: 'Service',
  endpoint: 'Endpoint',
  database: 'Base de données',
  cache: 'Cache',
  queue: 'File / événements',
  storage: 'Stockage',
  external: 'Service externe',
  contract: 'Contrat',
  test: 'Test',
};
export const RELATION_LABELS: Record<ProjectRelation['kind'], string> = {
  import: 'Import',
  http: 'HTTP',
  read: 'Lecture',
  write: 'Écriture',
  publish: 'Publication',
  consume: 'Consommation',
  declares: 'Déclaration',
  tests: 'Test associé',
};
export const GROUP_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  data: 'Données et services',
  shared: 'Partagé',
  infrastructure: 'Infrastructure',
  unclassified: 'Non classé',
};
const GROUPS = ['frontend', 'backend', 'data', 'shared', 'infrastructure', 'unclassified'];
const DATA_TYPES = new Set(['database', 'cache', 'queue', 'storage', 'external']);

export function elementGroup(element: ProjectElement): string {
  return DATA_TYPES.has(element.type) ? 'data' : element.layer;
}

export function layoutSignature(elements: ProjectElement[]): string {
  return elements
    .map((element) => `${element.id}:${elementGroup(element)}`)
    .sort()
    .join('|');
}

/** Keep occupied slots, including removed elements, during this mounted analysis session. */
export function createGraphLayout(elements: ProjectElement[], previous?: GraphLayout): GraphLayout {
  const lanes = { ...previous?.lanes };
  const positions = { ...previous?.positions };
  const present = new Set(elements.map(elementGroup));
  for (const group of GROUPS) {
    if (present.has(group) && lanes[group] === undefined) lanes[group] = Object.keys(lanes).length;
  }
  const detailOrder = (element: ProjectElement) =>
    ['module', 'contract', 'test'].includes(element.type) ? 1 : 0;
  for (const element of [...elements].sort(
    (a, b) => detailOrder(a) - detailOrder(b) || a.id.localeCompare(b.id),
  )) {
    const x = (lanes[elementGroup(element)] ?? 0) * CARD.column + 24;
    if (positions[element.id]?.x === x) continue;
    delete positions[element.id];
    const occupied = new Set(
      Object.values(positions)
        .filter((point) => point.x === x)
        .map((point) => point.y),
    );
    let y = 62;
    while (occupied.has(y)) y += CARD.row;
    positions[element.id] = { x, y };
  }
  return { signature: layoutSignature(elements), positions, lanes };
}

export interface GraphFilter {
  search: string;
  elementType: string;
  relationKind: string;
  details: boolean;
  limit: number;
}
export function filterGraph(
  analysis: ProjectAnalysis,
  filter: GraphFilter,
  selectedId: string | null,
) {
  const search = filter.search.trim().toLocaleLowerCase('fr');
  const matches = analysis.elements.filter((element) => {
    if (filter.elementType !== 'all' && element.type !== filter.elementType) return false;
    if (
      !filter.details &&
      filter.elementType === 'all' &&
      !search &&
      ['module', 'test', 'contract'].includes(element.type) &&
      element.id !== selectedId
    )
      return false;
    return (
      !search ||
      `${element.label} ${element.sources.map((source) => source.path).join(' ')}`
        .toLocaleLowerCase('fr')
        .includes(search)
    );
  });
  const matchingRelations = analysis.relations.filter(
    (relation) => filter.relationKind === 'all' || relation.kind === filter.relationKind,
  );
  const connected = new Set(
    matchingRelations.flatMap((relation) => [relation.source, relation.target]),
  );
  const candidates =
    filter.relationKind === 'all'
      ? matches
      : matches.filter((element) => connected.has(element.id));
  const selected = candidates.find((element) => element.id === selectedId);
  const ordered = selected
    ? [selected, ...candidates.filter((element) => element.id !== selectedId)]
    : candidates;
  const elements = ordered.slice(0, filter.limit);
  const visible = new Set(elements.map((element) => element.id));
  const relations = matchingRelations.filter(
    (relation) => visible.has(relation.source) && visible.has(relation.target),
  );
  return {
    elements,
    relations: relations.slice(0, 200),
    total: candidates.length,
    omittedRelations: Math.max(0, relations.length - 200),
  };
}

export function graphBounds(elements: ProjectElement[], layout: GraphLayout) {
  const points = elements
    .map((element) => layout.positions[element.id])
    .filter((point): point is Point => Boolean(point));
  if (!points.length) return { x: 0, y: 0, width: 880, height: 460 };
  const x = Math.min(...points.map((point) => point.x)) - 24;
  const y = Math.min(...points.map((point) => point.y)) - 54;
  return {
    x,
    y,
    width: Math.max(...points.map((point) => point.x)) - x + CARD.width + 24,
    height: Math.max(...points.map((point) => point.y)) - y + CARD.height + 34,
  };
}

export function graphChanges(
  current: ProjectAnalysis,
  previous: ProjectAnalysis | null,
): Map<string, 'added' | 'modified'> {
  const result = new Map<string, 'added' | 'modified'>();
  if (!previous) return result;
  const oldElements = new Map(previous.elements.map((element) => [element.id, element]));
  const oldFiles = new Map(previous.files.map((file) => [file.path, file.sha256]));
  const files = new Map(current.files.map((file) => [file.path, file.sha256]));
  for (const element of current.elements) {
    const old = oldElements.get(element.id);
    if (!old) result.set(element.id, 'added');
    else if (
      JSON.stringify(old) !== JSON.stringify(element) ||
      element.sources.some((source) => files.get(source.path) !== oldFiles.get(source.path))
    )
      result.set(element.id, 'modified');
  }
  return result;
}

export function relationPath(source: Point, target: Point): string {
  const startX = source.x + CARD.width;
  const startY = source.y + CARD.height / 2;
  const endY = target.y + CARD.height / 2;
  if (source.x === target.x)
    return `M ${startX - 40} ${source.y + CARD.height} C ${startX + 40} ${source.y + CARD.height + 20}, ${startX + 40} ${target.y - 20}, ${startX - 40} ${target.y}`;
  const midX = (startX + target.x) / 2;
  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${target.x} ${endY}`;
}

export function shorten(value: string, max = 25): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function redactTrace(value: string): string {
  return value
    .replace(/Bearer\s+\S+/gi, 'Bearer [masqué]')
    .replace(
      /(["']?(?:password|secret|token|api[_-]?key|authorization)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi,
      '$1[masqué]',
    )
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[adresse masquée]');
}
