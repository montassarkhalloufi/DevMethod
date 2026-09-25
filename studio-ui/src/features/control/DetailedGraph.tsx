import { useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import type { EvidenceEdge } from '../../../../src/control-plane/contracts';
import { detailedEdgePath, detailedLayout } from './graph-layout';
import { freshnessLabels, statusLabels, type EvidenceNode } from './model';
import { Icon } from './Icon';

export interface DetailedGraphHandle {
  reveal: (id: string) => void;
}

export function DetailedGraph({
  nodes,
  allNodes,
  edges,
  selected,
  select,
  zoom,
  ref,
}: {
  nodes: EvidenceNode[];
  allNodes: EvidenceNode[];
  edges: EvidenceEdge[];
  selected?: string;
  select: (id: string) => void;
  zoom: number;
  ref: Ref<DetailedGraphHandle>;
}) {
  const layout = useMemo(() => {
    const result = detailedLayout(nodes);
    const numbers = detailedLayout(allNodes).boxes;
    for (const box of result.boxes.values()) box.number = numbers.get(box.node.id)!.number;
    return result;
  }, [nodes, allNodes]);
  const viewport = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, SVGGElement>());
  const [query, setQuery] = useState('');
  const connections = edges.filter(
    (edge) =>
      (edge.from === selected || edge.to === selected) &&
      layout.boxes.has(edge.from) &&
      layout.boxes.has(edge.to),
  );
  const related = new Set(connections.flatMap((edge) => [edge.from, edge.to]));
  const matches = query.trim()
    ? [...layout.boxes.values()].filter(({ node }) =>
        `${node.label} ${node.id}`
          .toLocaleLowerCase('fr')
          .includes(query.trim().toLocaleLowerCase('fr')),
      )
    : [];
  function reveal(id: string) {
    const box = layout.boxes.get(id);
    if (!box || !viewport.current) return;
    viewport.current.scrollTo({
      top: Math.max(0, (box.y - 80) * zoom),
      left: Math.max(0, (box.x - 60) * zoom),
    });
    elements.current.get(id)?.focus({ preventScroll: true });
  }
  useImperativeHandle(ref, () => ({ reveal }));
  return (
    <>
      <div className="cp-detail-tools">
        <label>
          Aller à une famille
          <select
            defaultValue=""
            onChange={(event) => {
              const group = layout.groups.find((entry) => entry.id === event.target.value);
              if (group) viewport.current?.scrollTo({ top: group.y * zoom, left: 0 });
            }}
          >
            <option value="" disabled>
              Choisir une étape
            </option>
            {layout.groups.map((group, index) => (
              <option key={group.id} value={group.id}>
                {index + 1}. {group.title} · {group.count}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rechercher un nœud
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom ou identifiant…"
          />
        </label>
        <button
          disabled={!selected || !layout.boxes.has(selected)}
          onClick={() => selected && reveal(selected)}
        >
          Centrer la sélection
        </button>
      </div>
      {query.trim() && (
        <div className="cp-graph-search" aria-live="polite">
          <span>
            {matches.length} résultat{matches.length > 1 ? 's' : ''}
          </span>
          {matches.map(({ node, number }) => (
            <button
              key={node.id}
              onClick={() => {
                select(node.id);
                reveal(node.id);
              }}
            >
              #{number} · {node.label}
            </button>
          ))}
        </div>
      )}
      <p className="cp-reading-guide">
        {nodes.length} nœuds répartis par familles. Lecture de haut en bas ; les familles n’ajoutent
        aucun lien. Sélectionnez un nœud pour suivre ses relations dans l’inspecteur.
      </p>
      <div className="cp-detail-status" role="status">
        {connections.length} lien{connections.length > 1 ? 's' : ''} affiché
        {connections.length > 1 ? 's' : ''} pour la sélection · déplacement avec les barres de
        défilement ou les flèches
      </div>
      <div
        ref={viewport}
        className="cp-detail-viewport"
        tabIndex={0}
        role="region"
        aria-label="Schéma détaillé complet, défilement horizontal et vertical"
      >
        <svg
          className="cp-detailed-canvas"
          width={layout.width * zoom}
          height={layout.height * zoom}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label="Nœuds regroupés par étapes de lecture"
        >
          <defs>
            <marker
              id="cp-detail-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M1 1 7 4 1 7" fill="none" stroke="context-stroke" />
            </marker>
          </defs>
          {layout.groups.map((group, index) => (
            <g key={group.id} className="cp-graph-family">
              <rect x="10" y={group.y} width="748" height={group.height} rx="12" />
              <text x="28" y={group.y + 28}>
                {String(index + 1).padStart(2, '0')} · {group.title}
              </text>
              <text x="735" y={group.y + 28} textAnchor="end" className="cp-family-count">
                {group.count} nœud{group.count > 1 ? 's' : ''}
              </text>
            </g>
          ))}
          {connections.map((edge, index) => (
            <path
              key={edge.id}
              className={`cp-edge cp-edge-${edge.relation}`}
              d={detailedEdgePath(layout.boxes.get(edge.from)!, layout.boxes.get(edge.to)!, index)}
              markerEnd="url(#cp-detail-arrow)"
            >
              <title>{edge.explanation}</title>
            </path>
          ))}
          {[...layout.boxes.values()].map((box) => {
            const node = box.node;
            return (
              <g
                key={node.id}
                ref={(element) => {
                  if (element) elements.current.set(node.id, element);
                  else elements.current.delete(node.id);
                }}
                transform={`translate(${box.x} ${box.y})`}
                role="button"
                tabIndex={0}
                className={`cp-detail-node cp-${node.freshness === 'stale' ? 'stale' : node.status} ${related.has(node.id) ? 'cp-related-node' : ''}`}
                aria-label={`#${box.number} · ${node.label} · ${statusLabels[node.status]} · ${freshnessLabels[node.freshness]}`}
                aria-pressed={selected === node.id}
                onClick={() => select(node.id)}
                onKeyDown={(event) => {
                  if (['Enter', ' '].includes(event.key)) {
                    event.preventDefault();
                    select(node.id);
                  }
                }}
              >
                <rect className="cp-node-hit" width={box.width} height={box.height} rx="10" />
                <circle cx={box.width / 2} cy="42" r="32" />
                <foreignObject x={box.width / 2 - 16} y="26" width="32" height="32">
                  <Icon
                    name={
                      (
                        {
                          code: 'code',
                          risk: 'risk',
                          autonomy: 'search',
                          visual: 'visual',
                          human: 'person',
                          agent: 'person',
                          job: 'code',
                          runtime: 'settings',
                          mcp: 'settings',
                        } as Record<string, string>
                      )[node.kind] ?? 'document'
                    }
                  />
                </foreignObject>
                <text x={box.width / 2} y="97" textAnchor="middle" className="cp-detail-label">
                  {box.lines.map((line, index) => (
                    <tspan key={index} x={box.width / 2} dy={index ? 20 : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
                <text
                  x={box.width / 2}
                  y={box.height - 17}
                  textAnchor="middle"
                  className="cp-detail-evidence"
                >
                  #{String(box.number).padStart(2, '0')} ·{' '}
                  {node.freshness === 'stale' ? 'À renouveler' : statusLabels[node.status]}
                  {node.required ? ' · Requise' : ''}
                </text>
                <title>{node.explanation}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}
