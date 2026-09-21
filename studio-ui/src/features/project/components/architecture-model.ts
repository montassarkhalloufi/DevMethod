import { translate } from '../../../i18n';
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
export const ELEMENT_LABELS = (
  locale: 'en' | 'fr' = 'en',
): Record<ProjectElement['type'], string> => ({
  frontend: translate('Application frontend', 'Frontend application', undefined, locale),
  module: translate('Module', 'Module', undefined, locale),
  service: translate('Service', 'Service', undefined, locale),
  endpoint: translate('Endpoint', 'Endpoint', undefined, locale),
  database: translate('Base de données', 'Database', undefined, locale),
  cache: translate('Cache', 'Cache', undefined, locale),
  queue: translate('File / événements', 'Queue / events', undefined, locale),
  storage: translate('Stockage', 'Storage', undefined, locale),
  external: translate('Service externe', 'External service', undefined, locale),
  contract: translate('Contrat', 'Contract', undefined, locale),
  test: translate('Test', 'Test', undefined, locale),
});
export const RELATION_LABELS = (
  locale: 'en' | 'fr' = 'en',
): Record<ProjectRelation['kind'], string> => ({
  import: translate('Import', 'Import', undefined, locale),
  http: translate('HTTP', 'HTTP', undefined, locale),
  read: translate('Lecture', 'Read', undefined, locale),
  write: translate('Écriture', 'Write', undefined, locale),
  publish: translate('Publication', 'Publish', undefined, locale),
  consume: translate('Consommation', 'Consume', undefined, locale),
  declares: translate('Déclaration', 'Declaration', undefined, locale),
  tests: translate('Test associé', 'Related test', undefined, locale),
});
export const GROUP_LABELS = (locale: 'en' | 'fr' = 'en'): Record<string, string> => ({
  frontend: translate('Frontend', 'Frontend', undefined, locale),
  backend: translate('Backend', 'Backend', undefined, locale),
  data: translate('Données et services', 'Data and services', undefined, locale),
  shared: translate('Partagé', 'Shared', undefined, locale),
  infrastructure: translate('Infrastructure', 'Infrastructure', undefined, locale),
  unclassified: translate('Non classé', 'Unclassified', undefined, locale),
});
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

export function redactTrace(value: string, locale: 'en' | 'fr' = 'en'): string {
  return value
    .replace(/Bearer\s+\S+/gi, translate('Bearer [masqué]', 'Bearer [redacted]', undefined, locale))
    .replace(
      /(["']?(?:password|secret|token|api[_-]?key|authorization)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi,
      translate('$1[masqué]', '$1[redacted]', undefined, locale),
    )
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      translate('[adresse masquée]', '[address redacted]', undefined, locale),
    );
}
