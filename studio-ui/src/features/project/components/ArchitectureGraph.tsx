import { translate } from '../../../i18n';
import { useI18n } from '../../../i18n';
import { useId } from 'react';
import type { RefObject } from 'react';
import type { ProjectElement, ProjectRelation } from '../model/contracts';
import type { useArchitectureCanvas } from '../hooks/useArchitectureCanvas';
import {
  CARD,
  ELEMENT_LABELS,
  GROUP_LABELS,
  RELATION_LABELS,
  elementGroup,
  graphBounds,
  relationPath,
  shorten,
} from './architecture-model';

interface GraphProps {
  elements: ProjectElement[];
  relations: ProjectRelation[];
  selectedId: string | null;
  onSelect(id: string): void;
  onOpenSource(path: string, line?: number): void;
  canvas: ReturnType<typeof useArchitectureCanvas>;
  svgRef: RefObject<SVGSVGElement | null>;
  changes: Map<string, 'added' | 'modified'>;
}

const SYMBOLS: Record<ProjectElement['type'], string> = {
  frontend: 'M3 4h18v16H3zM3 9h18M7 6.5h.1M10 6.5h.1',
  module: 'm12 3 9 5-9 5-9-5 9-5m-9 9 9 5 9-5m-18 5 9 5 9-5',
  service: 'M4 3h16v7H4zM4 14h16v7H4zM7 6.5h.1M7 17.5h.1M12 7h5M12 18h5',
  endpoint: 'M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4',
  database: 'M3 6c0-5 18-5 18 0S3 11 3 6v12c0 5 18 5 18 0V6M3 12c0 5 18 5 18 0',
  cache: 'M5 5h14v14H5zM9 9h6v6H9zM8 2v3m8-3v3M8 19v3m8-3v3M2 8h3m-3 8h3M19 8h3m-3 8h3',
  queue: 'M3 5h12M3 12h12M3 19h12m2-10 4 3-4 3',
  storage: 'M3 3h18v6H3zM5 9v12h14V9M9 13h6',
  external: 'M13 3h8v8m0-8L10 14M9 5H3v16h16v-6',
  contract: 'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8',
  test: 'm5 12 4 4L19 6',
};
const PROVENANCE = (locale: 'en' | 'fr' = 'en') => ({
  detected: translate('Détecté dans le code', 'Detected in code', undefined, locale),
  declared: translate('Déclaré', 'Declared', undefined, locale),
  observed: translate('Observé', 'Observed', undefined, locale),
  inferred: translate('Supposé', 'Assumed', undefined, locale),
});

function activate(event: React.KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

function GraphNode({
  element,
  point,
  selected,
  change,
  visible,
  onSelect,
  onOpenSource,
}: {
  element: ProjectElement;
  point: { x: number; y: number };
  selected: boolean;
  change?: 'added' | 'modified';
  visible: boolean;
  onSelect(id: string): void;
  onOpenSource(path: string, line?: number): void;
}) {
  const { t, locale } = useI18n();
  const source = element.sources[0];
  const tabIndex = visible ? 0 : -1;
  const provenance =
    [...new Set(element.provenance.map((item) => PROVENANCE(locale)[item.kind]))].join(' · ') ||
    t('Provenance non renseignée', 'Provenance not provided');
  return (
    <g transform={`translate(${point.x},${point.y})`}>
      <g
        role="button"
        tabIndex={tabIndex}
        aria-pressed={selected}
        aria-label={`${element.label} · ${ELEMENT_LABELS(locale)[element.type]} · ${provenance}`}
        data-graph-select="node"
        onClick={() => onSelect(element.id)}
        onKeyDown={(event) => activate(event, () => onSelect(element.id))}
        className="arch-svg-action"
      >
        <title>
          {element.label}
          {'\n'}
          {element.description}
          {'\n'}
          {provenance}
          {'\n'}
          {t('Runtime :', 'Runtime:')}{' '}
          {element.runtime === 'observed'
            ? t('observé', 'observed')
            : t('non observé', 'not observed')}
        </title>
        <rect
          width={CARD.width}
          height={CARD.height}
          rx={9}
          fill={selected ? '#182344' : '#0e1c31'}
          stroke={selected ? '#9b82ff' : '#2b4568'}
          strokeWidth={selected ? 2 : 1}
        />
        <rect x={12} y={18} width={34} height={34} rx={8} fill="#1a2c48" />
        <path
          transform="translate(18, 24) scale(.92)"
          d={SYMBOLS[element.type]}
          fill="none"
          stroke={element.layer === 'frontend' ? '#50c9e8' : '#b8c5ee'}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        />
        <text x={58} y={31} fill="#f5f7fc" fontSize={13} fontWeight={600}>
          {shorten(element.label, 20)}
        </text>
        <text x={58} y={51} fill="#becbe0" fontSize={11}>
          {ELEMENT_LABELS(locale)[element.type]}
        </text>
        <text x={14} y={76} fill="#9fb7d9" fontSize={10}>
          {shorten(provenance, 34)}
        </text>
        <text
          x={14}
          y={95}
          fill={element.runtime === 'observed' ? '#69dcab' : '#cad3e2'}
          fontSize={10}
        >
          {element.runtime === 'observed'
            ? t('◉ Exécution observée', '◉ Execution observed')
            : t('○ Exécution non observée', '○ Execution not observed')}
        </text>
        {change ? (
          <text
            x={CARD.width - 9}
            y={95}
            textAnchor="end"
            fill={change === 'added' ? '#69dcab' : '#f2ba58'}
            fontSize={10}
          >
            {change === 'added' ? t('+ Ajout', '+ Added') : t('Δ Modifié', 'Δ Modified')}
          </text>
        ) : null}
      </g>
      {source ? (
        <g
          role="button"
          tabIndex={tabIndex}
          data-graph-select="source"
          className="arch-svg-action"
          aria-label={t('Ouvrir le code de {name}', 'Open source for {name}', {
            name: element.label,
          })}
          onClick={() => onOpenSource(source.path, source.line)}
          onKeyDown={(event) => activate(event, () => onOpenSource(source.path, source.line))}
        >
          <rect x={CARD.width - 28} y={3} width={24} height={24} fill="#0e1c31" rx={4} />
          <text
            x={CARD.width - 16}
            y={20}
            fill="#bcaaff"
            textAnchor="middle"
            fontSize={16}
            aria-hidden="true"
          >
            ↗
          </text>
        </g>
      ) : null}
    </g>
  );
}

function GraphEdge({
  relation,
  path,
  markerId,
  selected,
  onSelect,
  label,
}: {
  relation: ProjectRelation;
  path: string;
  markerId: string;
  selected: boolean;
  onSelect(id: string): void;
  label?: { x: number; y: number };
}) {
  const { locale } = useI18n();
  const kinds = new Set(relation.provenance.map((item) => item.kind));
  const dash = kinds.has('observed') ? '2 4' : kinds.has('detected') ? undefined : '7 5';
  return (
    <g
      role="button"
      tabIndex={-1}
      data-graph-select="edge"
      className="arch-svg-action"
      aria-label={`${RELATION_LABELS(locale)[relation.kind]} : ${relation.label}`}
      onClick={() => onSelect(relation.id)}
      onKeyDown={(event) => activate(event, () => onSelect(relation.id))}
    >
      <title>
        {relation.label}
        {'\n'}
        {relation.provenance
          .map((item) => `${PROVENANCE(locale)[item.kind]} · ${item.method}`)
          .join('\n')}
      </title>
      <path d={path} stroke="transparent" strokeWidth={16} fill="none" />
      <path
        d={path}
        stroke={selected ? '#9b82ff' : '#92abd7'}
        strokeWidth={selected ? 3 : 1.6}
        strokeDasharray={dash}
        fill="none"
        markerEnd={`url(#${markerId})`}
      />
      {label ? (
        <text
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fill="#c4d3f0"
          fontSize={10}
          stroke="#0b1729"
          strokeWidth={5}
          paintOrder="stroke"
        >
          {RELATION_LABELS(locale)[relation.kind]}
        </text>
      ) : null}
    </g>
  );
}

export function ArchitectureGraph(props: GraphProps) {
  const { t, locale } = useI18n();
  const markerId = `arrow-${useId().replaceAll(':', '')}`;
  const dotsId = `dots-${markerId}`;
  const { elements, relations, canvas } = props;
  const bounds = graphBounds(elements, canvas.layout);
  const groups = [...new Set(elements.map(elementGroup))];
  return (
    <svg
      ref={props.svgRef}
      className="arch-graph"
      role="group"
      aria-label={t(
        'Carte d’architecture. Flèches pour déplacer la carte, tabulation pour sélectionner un élément.',
        'Architecture map. Use arrow keys to move the map and Tab to select an element.',
      )}
      tabIndex={0}
      viewBox="0 0 880 460"
      preserveAspectRatio="xMidYMin meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      {...canvas.handlers}
    >
      <title>
        {t('Architecture du projet sélectionné', 'Architecture of the selected project')}
      </title>
      <desc>
        {t(
          'Carte issue de l’analyse du projet. Les connexions de code ne prouvent pas le fonctionnement à l’exécution. Une liste navigable est disponible sous la carte.',
          'Map derived from project analysis. Code connections do not prove runtime behavior. A navigable list is available below the map.',
        )}
      </desc>
      <defs>
        <pattern id={dotsId} width={22} height={22} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={0.8} fill="#203652" />
        </pattern>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX={9}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#92abd7" />
        </marker>
      </defs>
      <rect width={880} height={460} fill="#0b1729" />
      <rect width={880} height={460} fill={`url(#${dotsId})`} />
      <g
        transform={`translate(${canvas.camera.x},${canvas.camera.y}) scale(${canvas.camera.zoom})`}
      >
        {groups.map((group) => (
          <g key={group} aria-hidden="true">
            <rect
              x={(canvas.layout.lanes[group] ?? 0) * CARD.column + 8}
              y={10}
              width={250}
              height={bounds.y + bounds.height - 16}
              rx={8}
              fill="#0f2036"
              fillOpacity={0.55}
              stroke="#294363"
            />
            <text
              x={(canvas.layout.lanes[group] ?? 0) * CARD.column + 22}
              y={33}
              fill="#b6adff"
              fontSize={13}
              fontWeight={600}
            >
              {GROUP_LABELS(locale)[group]}
            </text>
          </g>
        ))}
        {relations.map((relation) => {
          const source = canvas.layout.positions[relation.source];
          const target = canvas.layout.positions[relation.target];
          if (!source || !target) return null;
          const label =
            relations.length <= 24 || relation.id === props.selectedId
              ? {
                  x: (source.x + target.x + CARD.width) / 2,
                  y: (source.y + target.y + CARD.height) / 2 - 8,
                }
              : undefined;
          return (
            <GraphEdge
              key={relation.id}
              relation={relation}
              path={relationPath(source, target)}
              markerId={markerId}
              selected={relation.id === props.selectedId}
              onSelect={props.onSelect}
              label={label}
            />
          );
        })}
        {elements.map((element) => {
          const point = canvas.layout.positions[element.id];
          return point ? (
            <GraphNode
              key={element.id}
              element={element}
              point={point}
              visible={
                point.x * canvas.camera.zoom + canvas.camera.x >= 0 &&
                point.y * canvas.camera.zoom + canvas.camera.y >= 0 &&
                (point.x + CARD.width) * canvas.camera.zoom + canvas.camera.x <= 880 &&
                (point.y + CARD.height) * canvas.camera.zoom + canvas.camera.y <= 460
              }
              selected={element.id === props.selectedId}
              change={props.changes.get(element.id)}
              onSelect={props.onSelect}
              onOpenSource={props.onOpenSource}
            />
          ) : null;
        })}
      </g>
    </svg>
  );
}
