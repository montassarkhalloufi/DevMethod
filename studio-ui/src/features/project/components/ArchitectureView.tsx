import { useDeferredValue, useRef, useState } from 'react';
import type { ModelViewProps, ProjectAnalysis } from '../model/contracts';
import { useArchitectureCanvas } from '../hooks/useArchitectureCanvas';
import { ArchitectureGraph } from './ArchitectureGraph';
import {
  ELEMENT_LABELS,
  RELATION_LABELS,
  filterGraph,
  graphBounds,
  graphChanges,
} from './architecture-model';
import './architecture.css';

function exportSvg(svg: SVGSVGElement, revision: string) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  // XMLSerializer supplies the SVG namespace; React's plain xmlns attribute can duplicate it.
  copy.removeAttribute('xmlns');
  const size = svg.getBoundingClientRect();
  copy.setAttribute('width', String(Math.round(size.width)));
  copy.setAttribute('height', String(Math.round(size.height)));
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(copy)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `architecture-${revision.replace(/[^a-z0-9_-]/gi, '').slice(0, 24)}.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function VersionComparison({
  current,
  previous,
}: {
  current: ProjectAnalysis;
  previous: ProjectAnalysis;
}) {
  const ids = new Set(current.elements.map((item) => item.id));
  const removed = previous.elements.filter((item) => !ids.has(item.id));
  const currentRelations = new Set(current.relations.map((item) => item.id));
  const previousRelations = new Set(previous.relations.map((item) => item.id));
  return (
    <details className="arch-comparison" open>
      <summary>
        Comparaison {previous.revisionId.slice(0, 8)} → {current.revisionId.slice(0, 8)}
      </summary>
      <p>
        {current.relations.filter((item) => !previousRelations.has(item.id)).length} connexion(s)
        ajoutée(s) · {previous.relations.filter((item) => !currentRelations.has(item.id)).length}{' '}
        supprimée(s). Les marqueurs de modification portent sur les éléments de la version actuelle.
      </p>
      {removed.length ? (
        <details>
          <summary>{removed.length} élément(s) retiré(s)</summary>
          <ul>
            {removed.slice(0, 100).map((item) => (
              <li key={item.id}>
                {item.label} <small>— {item.sources.map((source) => source.path).join(', ')}</small>
              </li>
            ))}
          </ul>
          {removed.length > 100 ? <p>Liste limitée à 100 éléments retirés.</p> : null}
        </details>
      ) : (
        <p>Aucun élément retiré détecté.</p>
      )}
    </details>
  );
}

function GraphList({
  elements,
  relations,
  selectedId,
  onSelect,
  onOpenSource,
}: Pick<ModelViewProps, 'selectedId' | 'onSelect' | 'onOpenSource'> & {
  elements: ProjectAnalysis['elements'];
  relations: ProjectAnalysis['relations'];
}) {
  return (
    <details className="arch-list">
      <summary>
        Liste accessible · {elements.length} éléments · {relations.length} connexions
      </summary>
      <ul>
        {elements.map((element) => (
          <li key={element.id}>
            <button
              type="button"
              aria-pressed={selectedId === element.id}
              onClick={() => onSelect(element.id)}
            >
              {element.label} <small>{ELEMENT_LABELS[element.type]}</small>
            </button>
            {element.sources[0] ? (
              <button
                type="button"
                onClick={() => onOpenSource(element.sources[0]!.path, element.sources[0]!.line)}
              >
                Ouvrir le code <span className="sr-only">de {element.label}</span>
              </button>
            ) : (
              <small>Aucune source liée</small>
            )}
          </li>
        ))}
      </ul>
      <details>
        <summary>Connexions et provenance</summary>
        <ul>
          {relations.map((relation) => (
            <li key={relation.id}>
              <button
                type="button"
                aria-pressed={selectedId === relation.id}
                onClick={() => onSelect(relation.id)}
              >
                {RELATION_LABELS[relation.kind]} · {relation.label}
              </button>
              <small>
                {relation.provenance.map((item) => item.method).join(' · ') ||
                  'Provenance non renseignée'}
              </small>
            </li>
          ))}
        </ul>
      </details>
    </details>
  );
}

export function ArchitectureView(props: ModelViewProps) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [elementType, setElementType] = useState('all');
  const [relationKind, setRelationKind] = useState('all');
  const [details, setDetails] = useState(false);
  const [compare, setCompare] = useState(false);
  const [limit, setLimit] = useState(40);
  const [exportError, setExportError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const analysis = props.model.analysis;
  const visible = filterGraph(
    analysis,
    { search: deferredSearch, elementType, relationKind, details, limit },
    props.selectedId,
  );
  const canvas = useArchitectureCanvas(
    analysis.elements,
    visible.elements,
    JSON.stringify([deferredSearch, elementType, relationKind, details, limit]),
  );
  const changes = compare
    ? graphChanges(analysis, props.model.previous)
    : new Map<string, 'added' | 'modified'>();
  const selected = analysis.elements.find((item) => item.id === props.selectedId);
  function download() {
    if (!svgRef.current) return;
    try {
      exportSvg(svgRef.current, analysis.revisionId);
      setExportError('');
    } catch {
      setExportError(
        'Export indisponible dans ce navigateur. Vous pouvez conserver la liste des éléments.',
      );
    }
  }
  return (
    <section className="architecture-view" aria-label="Architecture du projet">
      <div className="arch-toolbar">
        <label className="arch-search">
          <span className="sr-only">Rechercher un composant ou fichier</span>
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un composant…"
            name="architecture-search"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="arch-zoom" role="group" aria-label="Zoom de la carte">
          <button type="button" onClick={() => canvas.zoom(1 / 1.2)} aria-label="Réduire le zoom">
            −
          </button>
          <button
            type="button"
            onClick={canvas.reset}
            aria-label="Rétablir le zoom lisible à 100 %"
          >
            {Math.round(canvas.camera.zoom * 100)} %
          </button>
          <button type="button" onClick={() => canvas.zoom(1.2)} aria-label="Augmenter le zoom">
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => canvas.fit(graphBounds(visible.elements, canvas.layout))}
        >
          Ajuster
        </button>
        <button
          type="button"
          aria-pressed={compare}
          disabled={!props.model.previous}
          onClick={() => setCompare((value) => !value)}
        >
          Comparer
        </button>
        <button type="button" onClick={download} disabled={!visible.elements.length}>
          ↓ Export SVG
        </button>
      </div>
      <div className="arch-filters">
        <label>
          Éléments{' '}
          <select value={elementType} onChange={(event) => setElementType(event.target.value)}>
            <option value="all">Tous les types</option>
            {Object.entries(ELEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Connexions{' '}
          <select value={relationKind} onChange={(event) => setRelationKind(event.target.value)}>
            <option value="all">Tous les liens</option>
            {Object.entries(RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="arch-checkbox">
          <input
            type="checkbox"
            checked={details}
            onChange={(event) => setDetails(event.target.checked)}
          />{' '}
          Modules, tests et contrats
        </label>
        <span className="arch-count" aria-live="polite">
          {visible.elements.length} / {visible.total} éléments filtrés
        </span>
      </div>
      {!analysis.backendDetected ? (
        <p className="arch-note">
          Aucun backend métier détecté dans ces sources. Le serveur du Studio n’est pas ajouté à
          cette carte.
        </p>
      ) : null}
      {!props.model.previous ? (
        <p className="arch-note">
          Comparaison indisponible : aucune analyse précédente pour ce projet.
        </p>
      ) : null}
      {compare && props.model.previous ? (
        <VersionComparison current={analysis} previous={props.model.previous} />
      ) : null}
      <div className="arch-canvas">
        {visible.elements.length ? (
          <ArchitectureGraph
            elements={visible.elements}
            relations={visible.relations}
            selectedId={props.selectedId}
            onSelect={props.onSelect}
            onOpenSource={props.onOpenSource}
            canvas={canvas}
            svgRef={svgRef}
            changes={changes}
          />
        ) : (
          <div className="arch-empty">
            <h3>Aucun élément dans ce périmètre</h3>
            <p>
              Activez les détails ou élargissez les filtres. L’analyse ne crée pas de services
              absents du projet.
            </p>
          </div>
        )}
        <div className="arch-legend">
          <span>━ Détecté dans le code</span>
          <span>┄ Déclaré / supposé</span>
          <span>┈ Observé à l’exécution</span>
        </div>
      </div>
      <div className="arch-status">
        <span>
          Carte déplaçable : glisser le fond ou utiliser les flèches. Ajuster affiche l’ensemble ;
          100 % rétablit la lecture.
        </span>
        <span>
          Analyse{' '}
          {analysis.status === 'complete'
            ? 'terminée'
            : analysis.status === 'partial'
              ? 'partielle'
              : 'en échec'}{' '}
          · {new Date(analysis.analyzedAt).toLocaleString('fr-FR')}
        </span>
      </div>
      {selected ? (
        <div className="arch-selected">
          <strong>{selected.label}</strong>
          <span>{selected.description}</span>
          <button type="button" onClick={() => props.onShowChecks(selected.sources[0]?.path)}>
            Vérifications associées
          </button>
        </div>
      ) : null}
      {visible.total > visible.elements.length ? (
        <p className="arch-note">
          Carte bornée à {limit} éléments pour rester lisible.{' '}
          {limit < 100 ? (
            <button type="button" onClick={() => setLimit(100)}>
              Afficher jusqu’à 100 éléments
            </button>
          ) : (
            'Affinez la recherche pour explorer les autres éléments.'
          )}
        </p>
      ) : null}
      {visible.omittedRelations > 0 ? (
        <p className="arch-note">
          {visible.omittedRelations} liens non dessinés au-delà de la limite de 200. Affinez les
          filtres.
        </p>
      ) : null}
      {exportError ? (
        <p role="alert" className="arch-note">
          {exportError}
        </p>
      ) : null}
      <GraphList
        elements={visible.elements}
        relations={visible.relations}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        onOpenSource={props.onOpenSource}
      />
    </section>
  );
}
