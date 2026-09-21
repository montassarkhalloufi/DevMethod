import { useI18n } from '../../../i18n';
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
  const { t } = useI18n();
  const ids = new Set(current.elements.map((item) => item.id));
  const removed = previous.elements.filter((item) => !ids.has(item.id));
  const currentRelations = new Set(current.relations.map((item) => item.id));
  const previousRelations = new Set(previous.relations.map((item) => item.id));
  return (
    <details className="arch-comparison" open>
      <summary>
        {t('Comparaison', 'Comparison')} {previous.revisionId.slice(0, 8)} →{' '}
        {current.revisionId.slice(0, 8)}
      </summary>
      <p>
        {current.relations.filter((item) => !previousRelations.has(item.id)).length}{' '}
        {t('connexion(s) ajoutée(s) ·', 'connection(s) added ·')}{' '}
        {previous.relations.filter((item) => !currentRelations.has(item.id)).length}{' '}
        {t(
          'supprimée(s). Les marqueurs de modification portent sur les éléments de la version actuelle.',
          'removed. Change markers refer to elements of the current version.',
        )}
      </p>
      {removed.length ? (
        <details>
          <summary>
            {removed.length} {t('élément(s) retiré(s)', 'element(s) removed')}
          </summary>
          <ul>
            {removed.slice(0, 100).map((item) => (
              <li key={item.id}>
                {item.label} <small>— {item.sources.map((source) => source.path).join(', ')}</small>
              </li>
            ))}
          </ul>
          {removed.length > 100 ? (
            <p>
              {t('Liste limitée à 100 éléments retirés.', 'List limited to 100 removed elements.')}
            </p>
          ) : null}
        </details>
      ) : (
        <p>{t('Aucun élément retiré détecté.', 'No removed elements detected.')}</p>
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
  const { t, locale } = useI18n();
  return (
    <details className="arch-list">
      <summary>
        {t('Liste accessible ·', 'Accessible list ·')} {elements.length}{' '}
        {t('éléments ·', 'elements ·')} {relations.length} {t('connexions', 'connections')}
      </summary>
      <ul>
        {elements.map((element) => (
          <li key={element.id}>
            <button
              type="button"
              aria-pressed={selectedId === element.id}
              onClick={() => onSelect(element.id)}
            >
              {element.label} <small>{ELEMENT_LABELS(locale)[element.type]}</small>
            </button>
            {element.sources[0] ? (
              <button
                type="button"
                onClick={() => onOpenSource(element.sources[0]!.path, element.sources[0]!.line)}
              >
                {t('Ouvrir le code', 'Open code')}{' '}
                <span className="sr-only">
                  {t('de', 'of')} {element.label}
                </span>
              </button>
            ) : (
              <small>{t('Aucune source liée', 'No linked source')}</small>
            )}
          </li>
        ))}
      </ul>
      <details>
        <summary>{t('Connexions et provenance', 'Connections and provenance')}</summary>
        <ul>
          {relations.map((relation) => (
            <li key={relation.id}>
              <button
                type="button"
                aria-pressed={selectedId === relation.id}
                onClick={() => onSelect(relation.id)}
              >
                {RELATION_LABELS(locale)[relation.kind]} · {relation.label}
              </button>
              <small>
                {relation.provenance.map((item) => item.method).join(' · ') ||
                  t('Provenance non renseignée', 'Provenance not provided')}
              </small>
            </li>
          ))}
        </ul>
      </details>
    </details>
  );
}

export function ArchitectureView(props: ModelViewProps) {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [elementType, setElementType] = useState('all');
  const [relationKind, setRelationKind] = useState('all');
  const [details, setDetails] = useState(false);
  const [compare, setCompare] = useState(false);
  const [limit, setLimit] = useState(40);
  const [exportError, setExportError] = useState(false);
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
      setExportError(false);
    } catch {
      setExportError(true);
    }
  }
  return (
    <section
      className="architecture-view"
      aria-label={t('Architecture du projet', 'Project architecture')}
    >
      <div className="arch-toolbar">
        <label className="arch-search">
          <span className="sr-only">
            {t('Rechercher un composant ou fichier', 'Search for a component or file')}
          </span>
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Rechercher un composant…', 'Search for a component…')}
            name="architecture-search"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="arch-zoom" role="group" aria-label={t('Zoom de la carte', 'Map zoom')}>
          <button
            type="button"
            onClick={() => canvas.zoom(1 / 1.2)}
            aria-label={t('Réduire le zoom', 'Zoom out')}
          >
            −
          </button>
          <button
            type="button"
            onClick={canvas.reset}
            aria-label={t('Rétablir le zoom lisible à 100 %', 'Reset readable zoom to 100%')}
          >
            {Math.round(canvas.camera.zoom * 100)} %
          </button>
          <button
            type="button"
            onClick={() => canvas.zoom(1.2)}
            aria-label={t('Augmenter le zoom', 'Zoom in')}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => canvas.fit(graphBounds(visible.elements, canvas.layout))}
        >
          {t('Ajuster', 'Fit')}
        </button>
        <button
          type="button"
          aria-pressed={compare}
          disabled={!props.model.previous}
          onClick={() => setCompare((value) => !value)}
        >
          {t('Comparer', 'Compare')}
        </button>
        <button type="button" onClick={download} disabled={!visible.elements.length}>
          ↓ Export SVG
        </button>
      </div>
      <div className="arch-filters">
        <label>
          {t('Éléments', 'Elements')}{' '}
          <select value={elementType} onChange={(event) => setElementType(event.target.value)}>
            <option value="all">{t('Tous les types', 'All types')}</option>
            {Object.entries(ELEMENT_LABELS(locale)).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Connexions', 'Connections')}{' '}
          <select value={relationKind} onChange={(event) => setRelationKind(event.target.value)}>
            <option value="all">{t('Tous les liens', 'All links')}</option>
            {Object.entries(RELATION_LABELS(locale)).map(([value, label]) => (
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
          {t('Modules, tests et contrats', 'Modules, tests and contracts')}
        </label>
        <span className="arch-count" aria-live="polite">
          {visible.elements.length} / {visible.total} {t('éléments filtrés', 'filtered elements')}
        </span>
      </div>
      {!analysis.backendDetected ? (
        <p className="arch-note">
          {t(
            'Aucun backend métier détecté dans ces sources. Le serveur du Studio n’est pas ajouté à cette carte.',
            'No business backend detected in these sources. The Studio server is not added to this map.',
          )}
        </p>
      ) : null}
      {!props.model.previous ? (
        <p className="arch-note">
          {t(
            'Comparaison indisponible : aucune analyse précédente pour ce projet.',
            'Comparison unavailable: no previous analysis for this project.',
          )}
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
            <h3>{t('Aucun élément dans ce périmètre', 'No elements in this scope')}</h3>
            <p>
              {t(
                'Activez les détails ou élargissez les filtres. L’analyse ne crée pas de services absents du projet.',
                'Enable details or broaden the filters. Analysis does not invent services absent from the project.',
              )}
            </p>
          </div>
        )}
        <div className="arch-legend">
          <span>{t('━ Détecté dans le code', '━ Detected in code')}</span>
          <span>{t('┄ Déclaré / supposé', '┄ Declared / assumed')}</span>
          <span>{t('┈ Observé à l’exécution', '┈ Observed at runtime')}</span>
        </div>
      </div>
      <div className="arch-status">
        <span>
          {t(
            'Carte déplaçable : glisser le fond ou utiliser les flèches. Ajuster affiche l’ensemble ; 100 % rétablit la lecture.',
            'Move the map by dragging its background or using arrow keys. Fit shows everything; 100% restores readable zoom.',
          )}
        </span>
        <span>
          {t('Analyse', 'Analysis')}{' '}
          {analysis.status === 'complete'
            ? t('terminée', 'completed')
            : analysis.status === 'partial'
              ? t('partielle', 'partial')
              : t('en échec', 'failed')}{' '}
          · {new Date(analysis.analyzedAt).toLocaleString(locale)}
        </span>
      </div>
      {selected ? (
        <div className="arch-selected">
          <strong>{selected.label}</strong>
          <span>{selected.description}</span>
          <button type="button" onClick={() => props.onShowChecks(selected.sources[0]?.path)}>
            {t('Vérifications associées', 'Related checks')}
          </button>
        </div>
      ) : null}
      {visible.total > visible.elements.length ? (
        <p className="arch-note">
          {t('Carte bornée à', 'Map limited to')} {limit}{' '}
          {t('éléments pour rester lisible.', 'elements to remain readable.')}{' '}
          {limit < 100 ? (
            <button type="button" onClick={() => setLimit(100)}>
              {t('Afficher jusqu’à 100 éléments', 'Show up to 100 elements')}
            </button>
          ) : (
            t(
              'Affinez la recherche pour explorer les autres éléments.',
              'Refine the search to explore other elements.',
            )
          )}
        </p>
      ) : null}
      {visible.omittedRelations > 0 ? (
        <p className="arch-note">
          {visible.omittedRelations}{' '}
          {t(
            'liens non dessinés au-delà de la limite de 200. Affinez les filtres.',
            'links not drawn beyond the limit of 200. Refine the filters.',
          )}
        </p>
      ) : null}
      {exportError ? (
        <p role="alert" className="arch-note">
          {t(
            'Export indisponible dans ce navigateur. Vous pouvez conserver la liste des éléments.',
            'Export is unavailable in this browser. You can keep the element list.',
          )}
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
