import { lazy, Suspense, useState, useCallback } from 'react';
import { useProjectModel } from '../hooks/useProjectModel';
import type { ProjectAnalysis } from '../model/contracts';
import type { ProjectView, ProjectWidgetOptions } from '../model/widget';
import { FileExplorer } from './FileExplorer';
import { ProjectInspector } from './ProjectInspector';
import { ProjectIcon } from './ProjectIcon';
import { ProjectVersionSelector } from './ProjectVersionSelector';
const ArchitectureView = lazy(() =>
  import('./ArchitectureView').then((module) => ({ default: module.ArchitectureView })),
);
const FlowView = lazy(() => import('./FlowView').then((module) => ({ default: module.FlowView })));
const ImpactView = lazy(() =>
  import('./ImpactView').then((module) => ({ default: module.ImpactView })),
);
function versionStatus(draft: boolean, revision: string | null, active: string | null) {
  if (draft) return 'Brouillon enregistré · non appliqué';
  return revision === active ? 'Appliquée' : 'Consultation';
}
function analysisStatus(
  loading: boolean,
  error: string | undefined,
  analysis: ProjectAnalysis | undefined,
  stale: boolean,
) {
  if (loading)
    return stale
      ? 'Nouvelle analyse en cours · dernière analyse affichée, à actualiser.'
      : 'Analyse des sources…';
  if (error) return error + (stale ? ' Dernière analyse conservée, non actualisée.' : '');
  if (!analysis) return 'Aucune version à analyser.';
  return `${analysis.files.length} fichiers · ${analysis.elements.length} éléments · ${analysis.status === 'complete' ? 'analyse terminée' : 'analyse partielle'}`;
}
function SourceSlot({ host }: { host: HTMLElement }) {
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) node.append(host);
    },
    [host],
  );
  return <div className="project-source-slot" ref={attach} />;
}
export function ProjectWorkbench(props: ProjectWidgetOptions) {
  const [localView, setLocalView] = useState<ProjectView>(props.view || 'files');
  const view = props.onViewChange ? props.view || 'files' : localView;
  const setView = (next: ProjectView) => {
    if (props.onViewChange) props.onViewChange(next);
    else setLocalView(next);
  };
  const [draft, setDraft] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspector, setInspector] = useState(true);
  const effectiveDraft = draft && props.revisionId === props.activeRevisionId;
  const { model, loading, error, stale, refresh } = useProjectModel(
    props.revisionId,
    props.previousRevisionId,
    effectiveDraft,
  );
  const analysis = model?.analysis;
  const checksUnavailable = loading || Boolean(error) || !analysis;
  const checks = checksUnavailable
    ? []
    : props.checks.filter((check) => check.revisionId === analysis.revisionId);
  const select = (id: string | null) => {
    setSelectedId(id);
    setInspector(Boolean(id));
  };
  const openSource = (path: string, line?: number) => {
    setView('files');
    setSelectedId(null);
    props.onOpenSource(path, line, { draft: effectiveDraft });
  };
  const viewProps = model
    ? {
        model,
        selectedId,
        onSelect: select,
        onOpenSource: openSource,
        onShowChecks: props.onShowChecks,
      }
    : null;
  return (
    <div className="project-workspace">
      <header className="project-context-bar">
        <span>
          <ProjectIcon name="graph" />
          <ProjectVersionSelector
            revisionId={props.revisionId}
            activeRevisionId={props.activeRevisionId}
            revisions={props.revisions}
            onSelectVersion={props.onSelectVersion}
          />
          <span className="project-context-muted">
            {versionStatus(effectiveDraft, props.revisionId, props.activeRevisionId)}
          </span>
        </span>
        <div>
          <details className="project-analysis-menu">
            <summary>
              {loading
                ? 'Analyse en cours…'
                : error
                  ? 'Analyse indisponible'
                  : stale
                    ? 'À actualiser'
                    : `${analysis?.files.length || 0} fichiers`}
            </summary>
            <div className="project-analysis-line">
              <span role="status">{analysisStatus(loading, error, analysis, stale)}</span>
              <label>
                <input
                  type="checkbox"
                  checked={effectiveDraft}
                  onChange={(event) => setDraft(event.target.checked)}
                  disabled={!props.revisionId || props.revisionId !== props.activeRevisionId}
                />
                Inclure le brouillon enregistré
              </label>
              {analysis && (
                <details className="project-analysis-details">
                  <summary>Périmètre, limites et décisions de conception</summary>
                  <p>
                    {analysis.scope} · {analysis.environment} ·{' '}
                    {new Date(analysis.analyzedAt).toLocaleString('fr-FR')}
                  </p>
                  {analysis.limits.map((limit, index) => (
                    <p key={index}>{limit}</p>
                  ))}
                  {analysis.issues.map((issue, index) => (
                    <p key={index}>
                      {issue.extractor} · {issue.path} · {issue.message}
                    </p>
                  ))}
                  {props.decisions
                    .filter((item) => item.status !== 'superseded')
                    .map((item) => (
                      <p key={item.id}>
                        <strong>{item.topic}</strong> : {item.choice}
                        <br />
                        {item.reason}
                      </p>
                    ))}
                  <p>
                    Les choix de conception sont déclaratifs ; leur conformité au code demande une
                    vérification.
                  </p>
                </details>
              )}
            </div>
          </details>
          {props.focused && props.pendingDecision && (
            <button
              className="project-caution"
              onClick={props.onReviewDecision}
              title={props.pendingDecision}
            >
              Décision à examiner
            </button>
          )}
          <button aria-pressed={props.focused} onClick={props.onFocus}>
            <ProjectIcon name="eye" />
            Focus technique
          </button>
          <button
            onClick={props.onExpand}
            aria-label="Agrandir l’espace technique"
            title="Agrandir l’espace technique"
          >
            <ProjectIcon name="focus" />
          </button>
        </div>
      </header>
      <nav className="project-subnav" aria-label="Vues du code">
        {(
          [
            ['files', 'Fichiers'],
            ['architecture', 'Architecture'],
            ['flows', 'Flux'],
            ['impact', 'Impact'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
        <span className="subnav-spacer" />
        <button
          onClick={() => setInspector((value) => !value)}
          aria-pressed={inspector}
          title="Afficher ou masquer l’inspection"
        >
          Inspecteur
        </button>
        <button
          onClick={refresh}
          aria-label="Reconstruire l’analyse"
          title="Reconstruire l’analyse"
        >
          <ProjectIcon name="refresh" />
        </button>
      </nav>
      {error && (
        <p className="project-caution">
          L’analyse n’est pas disponible. L’éditeur reste accessible.{' '}
          <button onClick={refresh}>Réessayer</button>
        </p>
      )}
      <div className={'project-main-grid' + (inspector && analysis ? ' with-inspector' : '')}>
        <div className="project-center">
          <div className="project-files-layout" hidden={view !== 'files'}>
            {analysis && (
              <FileExplorer
                analysis={analysis}
                selected={props.selectedPath}
                onSelect={(path) => {
                  setSelectedId(null);
                  props.onOpenSource(path, undefined, { draft: effectiveDraft });
                }}
              />
            )}
            <SourceSlot host={props.sourceHost} />
          </div>
          <Suspense fallback={<p role="status">Chargement de cette vue…</p>}>
            {viewProps && view === 'architecture' && <ArchitectureView {...viewProps} />}
            {viewProps && view === 'flows' && <FlowView {...viewProps} />}
            {viewProps && view === 'impact' && <ImpactView {...viewProps} />}
          </Suspense>
        </div>
        {inspector && analysis && (
          <ProjectInspector
            analysis={analysis}
            selectedId={selectedId}
            selectedPath={props.selectedPath}
            onSelect={select}
            onClose={() => setInspector(false)}
            onView={setView}
            onOpenSource={openSource}
            onShowChecks={props.onShowChecks}
          />
        )}
      </div>
      <details className="project-results">
        <summary>
          <ProjectIcon name="check" />
          {checksUnavailable
            ? 'Vérifications masquées · analyse en attente ou indisponible'
            : `Vérifications de cette version · ${checks.filter((check) => check.status === 'passed').length} réussies · ${checks.filter((check) => check.status === 'failed').length} échouées`}{' '}
          <span>Ouvrir les résultats</span>
        </summary>
        <p>Ces résultats couvrent uniquement les contrôles exécutés, pas toute l’application.</p>
        {checks.map((check) => (
          <p key={check.id} className={check.status === 'failed' ? 'project-caution' : ''}>
            {check.status === 'passed' ? '✓' : '×'} {check.label}
          </p>
        ))}
        {checksUnavailable ? (
          <p>Les résultats seront rapprochés de la version quand son analyse sera disponible.</p>
        ) : (
          !checks.length && <p>Aucun contrôle enregistré pour cette version.</p>
        )}
        <button onClick={() => props.onShowChecks()}>Consulter les preuves et les outils →</button>
      </details>
    </div>
  );
}
