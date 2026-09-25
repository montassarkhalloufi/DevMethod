import { useEffect, useRef, useState } from 'react';
import {
  freshnessLabels,
  kindLabels,
  missingNodes,
  statusLabels,
  type ControlReport,
  type EvidenceNode,
  type SourceLink,
} from './model';
import { Icon } from './Icon';
import { DetailedGraph, type DetailedGraphHandle } from './DetailedGraph';
import { detailedLayout, nodeRelations } from './graph-layout';
import type { EvidenceEdge } from '../../../../src/control-plane/contracts';

function graphSelection(nodes: EvidenceNode[], expanded: boolean) {
  if (expanded) return nodes;
  const selected = [
    'intention',
    'criterion',
    'decision',
    'code',
    'visual',
    'risk',
    'autonomy',
  ].flatMap((kind) => {
    const node = nodes.find((entry) => entry.kind === kind);
    return node ? [node] : [];
  });
  const check = nodes.find((entry) => entry.kind === 'check' && entry.required);
  if (check) selected.splice(Math.max(1, selected.length - 2), 0, check);
  return selected;
}

const kindIcon = (node: EvidenceNode) =>
  ({
    code: 'code',
    risk: 'risk',
    autonomy: 'search',
    visual: 'visual',
    human: 'person',
    agent: 'person',
  })[node.kind as 'code'] ?? 'document';

function Inspector({
  node,
  open,
  close,
  run,
  busy,
  nodes,
  edges,
  select,
  back,
}: {
  node: EvidenceNode;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  select: (id: string) => void;
  back?: () => void;
  open: (link: SourceLink) => void;
  close: () => void;
  run: (ids: string[]) => void;
  busy: boolean;
}) {
  const relations = nodeRelations(node.id, nodes, edges);
  const numbers = detailedLayout(nodes).boxes;
  return (
    <aside className="cp-inspector" aria-label="Détail de la preuve">
      <header>
        <Icon name={kindIcon(node)} />
        <h2>{node.label}</h2>
        <button aria-label="Fermer l’inspecteur" onClick={close}>
          ×
        </button>
      </header>
      {back && <button onClick={back}>← Nœud précédent</button>}
      <dl>
        <dt>Statut</dt>
        <dd>
          <span className={`cp-badge cp-${node.status}`}>{statusLabels[node.status]}</span>
        </dd>
        <dt>Version observée</dt>
        <dd title={node.revisionId ?? ''}>{node.revisionId?.slice(0, 8) ?? 'Sans version'}</dd>
        <dt>Fraîcheur</dt>
        <dd>{node.status === 'missing' ? 'Non établie' : freshnessLabels[node.freshness]}</dd>
        <dt>Source</dt>
        <dd>{node.source}</dd>
        <dt>Résultat</dt>
        <dd>
          {
            {
              passed: 'Réussi dans ce périmètre',
              failed: 'Échec observé',
              unknown: 'Non établi',
              running: 'En cours',
            }[node.outcome]
          }
        </dd>
      </dl>
      <p>{node.explanation}</p>
      {node.runId && (
        <p>
          Exécution : <code>{node.runId}</code>
        </p>
      )}
      <section className="cp-node-relations" aria-label="Relations du nœud">
        <h3>Suivre les relations · {relations.length}</h3>
        {!relations.length && <p>Aucune relation enregistrée pour ce nœud.</p>}
        <ul>
          {relations.map(({ edge, node: neighbor, label }) => (
            <li key={edge.id}>
              <span>{label}</span>
              <button onClick={() => select(neighbor.id)}>
                #{numbers.get(neighbor.id)?.number} · {neighbor.label} →
              </button>
              <small>{edge.explanation}</small>
            </li>
          ))}
        </ul>
      </section>
      <details>
        <summary>Portée, dépendances et limites</summary>
        <ul>
          {node.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
        <p>
          {node.dependencyScope === 'complete'
            ? 'Dépendances explicites'
            : 'Preuve attachée à sa révision'}
        </p>
        <ul>
          {Object.keys(node.dependencies).map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        <time dateTime={node.at}>{new Date(node.at).toLocaleString('fr-FR')}</time>
      </details>
      {node.link && (
        <button className="cp-primary" onClick={() => open(node.link!)}>
          {node.link.panel === 'product' ? 'Ouvrir dans l’aperçu ↗' : 'Ouvrir la source ↗'}
        </button>
      )}
      {node.canRun && (
        <button disabled={busy} onClick={() => run([node.checkId!])}>
          Relancer cette vérification
        </button>
      )}
    </aside>
  );
}

export function EvidenceGraph({
  report,
  missing,
  onMissing,
  onRevision,
  open,
  run,
  busy,
}: {
  report: ControlReport;
  missing: boolean;
  onMissing: (value: boolean) => void;
  onRevision: (id: string) => void;
  open: (link: SourceLink) => void;
  run: (ids: string[]) => void;
  busy: boolean;
}) {
  const [kind, setKind] = useState('all'),
    [invalidations, setInvalidations] = useState(false),
    [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const detailRef = useRef<DetailedGraphHandle>(null);
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (pendingFocus.current && detailRef.current) {
      detailRef.current.reveal(pendingFocus.current);
      pendingFocus.current = null;
    }
  });
  const detailed = expanded || missing || kind !== 'all';
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const nodes = (missing ? missingNodes(report.snapshot.nodes) : report.snapshot.nodes).filter(
    (node) => kind === 'all' || node.kind === kind,
  );
  const visible = graphSelection(nodes, expanded || missing || kind !== 'all');
  const branch =
    !expanded && !missing && kind === 'all'
      ? visible.find((node) => node.kind === 'check')
      : undefined;
  const chain = visible.filter((node) => node !== branch);
  const positions = new Map(
    chain.map((node, index) => [
      node.id,
      { x: 60 + (index % 7) * 130, y: 235 + Math.floor(index / 7) * 170 },
    ]),
  );
  if (branch) positions.set(branch.id, { x: 535, y: 90 });
  const chosen =
    selected === 'closed'
      ? undefined
      : (report.snapshot.nodes.find((node) => node.id === selected) ??
        visible.find((node) => node.kind === 'visual') ??
        visible[0]);
  const edges = report.snapshot.edges.filter(
    (edge) =>
      positions.has(edge.from) &&
      positions.has(edge.to) &&
      (invalidations || edge.relation !== 'invalidates'),
  );
  function selectNode(id: string) {
    if (chosen && chosen.id !== id) setTrail((value) => [...value, chosen.id]);
    setSelected(id);
  }
  function followNode(id: string) {
    selectNode(id);
    if (!visible.some((node) => node.id === id)) {
      setKind('all');
      onMissing(false);
      setExpanded(true);
      setViewport({ x: 0, y: 0, zoom: 1 });
    }
    pendingFocus.current = id;
  }
  function back() {
    const id = trail.at(-1);
    if (!id) return;
    setTrail((value) => value.slice(0, -1));
    setSelected(id);
    detailRef.current?.reveal(id);
  }
  const types = [...new Set(report.snapshot.nodes.map((node) => node.kind))];
  return (
    <>
      <header className="cp-heading">
        <h1>Graphe des preuves</h1>
        <p>Traçabilité des décisions, du code aux preuves</p>
      </header>
      <div className="cp-filters">
        <label>
          <span className="sr-only">Version des preuves</span>
          <select
            value={report.snapshot.input.revisionId ?? ''}
            onChange={(event) => onRevision(event.target.value)}
          >
            {!report.revisions.length && <option value="">Aucune version</option>}
            {report.revisions.map((revision) => (
              <option key={revision.id} value={revision.id}>
                {revision.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Type de preuve</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">Tous les types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {kindLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={invalidations}
            onChange={(event) => setInvalidations(event.target.checked)}
          />
          Afficher les invalidations
        </label>
        <label>
          <input
            type="checkbox"
            checked={missing}
            onChange={(event) => onMissing(event.target.checked)}
          />
          Preuves manquantes
        </label>
      </div>
      <div className={`cp-graph-layout ${detailed ? 'cp-graph-detailed' : ''}`}>
        <div className="cp-graph-area">
          <div className="cp-canvas-tools">
            <button
              aria-label="Réduire le graphe"
              onClick={() =>
                setViewport((value) => ({
                  ...value,
                  zoom: Math.max(detailed ? 0.8 : 0.4, value.zoom - 0.2),
                }))
              }
            >
              −
            </button>
            <span>{Math.round(viewport.zoom * 100)} %</span>
            <button
              aria-label="Agrandir le graphe"
              onClick={() =>
                setViewport((value) => ({ ...value, zoom: Math.min(2.4, value.zoom + 0.2) }))
              }
            >
              +
            </button>
            <button
              onClick={() => {
                setViewport({ x: 0, y: 0, zoom: 1 });
                if (detailed && chosen) detailRef.current?.reveal(chosen.id);
              }}
            >
              Recentrer
            </button>
            <button
              aria-pressed={expanded}
              onClick={() => {
                setExpanded(!expanded);
                setViewport({ x: 0, y: 0, zoom: 1 });
              }}
            >
              {expanded ? 'Vue synthétique' : 'Tous les nœuds'}
            </button>
          </div>
          {visible.length && detailed ? (
            <DetailedGraph
              ref={detailRef}
              nodes={visible}
              allNodes={report.snapshot.nodes}
              edges={report.snapshot.edges.filter(
                (edge) => invalidations || edge.relation !== 'invalidates',
              )}
              selected={chosen?.id}
              select={selectNode}
              zoom={Math.max(0.8, viewport.zoom)}
            />
          ) : visible.length ? (
            <svg
              className="cp-canvas"
              viewBox={`0 0 910 ${Math.max(410, Math.ceil(visible.length / 7) * 160 + 160)}`}
              tabIndex={0}
              role="group"
              aria-label="Graphe des preuves. Flèches pour déplacer, plus et moins pour zoomer. Une liste complète suit le graphe."
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                drag.current = {
                  x: event.clientX,
                  y: event.clientY,
                  startX: viewport.x,
                  startY: viewport.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (drag.current)
                  setViewport((value) => ({
                    ...value,
                    x: drag.current!.startX + event.clientX - drag.current!.x,
                    y: drag.current!.startY + event.clientY - drag.current!.y,
                  }));
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onKeyDown={(event) => {
                const moves: Record<string, [number, number]> = {
                  ArrowLeft: [-30, 0],
                  ArrowRight: [30, 0],
                  ArrowUp: [0, -30],
                  ArrowDown: [0, 30],
                };
                const move = moves[event.key];
                if (move) {
                  event.preventDefault();
                  setViewport((value) => ({
                    ...value,
                    x: value.x + move[0],
                    y: value.y + move[1],
                  }));
                }
                if (['+', '-'].includes(event.key)) {
                  event.preventDefault();
                  setViewport((value) => ({
                    ...value,
                    zoom: Math.max(
                      0.4,
                      Math.min(2.4, value.zoom + (event.key === '+' ? 0.2 : -0.2)),
                    ),
                  }));
                }
              }}
            >
              <defs>
                <marker
                  id="cp-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M1 1 7 4 1 7" fill="none" stroke="currentColor" />
                </marker>
              </defs>
              <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}>
                {edges.map((edge) => {
                  const start = positions.get(edge.from)!,
                    end = positions.get(edge.to)!;
                  return (
                    <path
                      key={edge.id}
                      className={`cp-edge cp-edge-${edge.relation}`}
                      d={`M${start.x} ${start.y - 40} Q${(start.x + end.x) / 2} ${Math.min(start.y, end.y) - 110} ${end.x} ${end.y - 40}`}
                      markerEnd="url(#cp-arrow)"
                    >
                      <title>{edge.explanation}</title>
                    </path>
                  );
                })}
                {visible.map((node) => {
                  const position = positions.get(node.id)!;
                  const label =
                    node.kind === 'criterion'
                      ? `Critère ${node.id.replace('criterion:', '')}`
                      : node.label;
                  return (
                    <g
                      key={node.id}
                      className={`cp-node cp-${node.status} ${node.freshness === 'stale' ? 'cp-stale' : ''}`}
                      transform={`translate(${position.x} ${position.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.label} · ${statusLabels[node.status]} · ${freshnessLabels[node.freshness]}`}
                      aria-pressed={chosen?.id === node.id}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => selectNode(node.id)}
                      onKeyDown={(event) => {
                        if (['Enter', ' '].includes(event.key)) {
                          event.preventDefault();
                          event.stopPropagation();
                          selectNode(node.id);
                        }
                      }}
                    >
                      <circle r="37" />
                      <foreignObject x="-17" y="-18" width="34" height="36">
                        <Icon name={kindIcon(node)} />
                      </foreignObject>
                      <text textAnchor="middle" y="62">
                        {label.length > 14 ? (
                          <>
                            <tspan x="0">
                              {label.slice(
                                0,
                                label.lastIndexOf(' ', 14) > 0 ? label.lastIndexOf(' ', 14) : 14,
                              )}
                            </tspan>
                            <tspan x="0" dy="19">
                              {label.slice(
                                label.lastIndexOf(' ', 14) > 0
                                  ? label.lastIndexOf(' ', 14) + 1
                                  : 14,
                                29,
                              )}
                            </tspan>
                          </>
                        ) : (
                          label
                        )}
                      </text>
                      <text className="cp-node-detail" textAnchor="middle" y="104">
                        {node.freshness === 'stale' ? 'À renouveler' : statusLabels[node.status]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          ) : (
            <div className="cp-empty">Aucune preuve ne correspond à ces filtres.</div>
          )}
          <div className="cp-legend">
            {Object.entries(statusLabels).map(([key, label]) => (
              <span key={key} className={`cp-${key}`}>
                <i />
                {label}
              </span>
            ))}
          </div>
          <details className="cp-evidence-list">
            <summary>
              Liste accessible · {nodes.length} éléments ({visible.length} affichés dans le graphe)
            </summary>
            <ul>
              {nodes.map((node) => (
                <li key={node.id}>
                  <button onClick={() => selectNode(node.id)}>
                    {node.label} · {statusLabels[node.status]} · {freshnessLabels[node.freshness]}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </div>
        {chosen && (
          <Inspector
            key={chosen.id}
            node={chosen}
            open={open}
            close={() => setSelected('closed')}
            run={run}
            busy={busy}
            nodes={report.snapshot.nodes}
            edges={report.snapshot.edges}
            select={followNode}
            back={trail.length ? back : undefined}
          />
        )}
      </div>
    </>
  );
}
