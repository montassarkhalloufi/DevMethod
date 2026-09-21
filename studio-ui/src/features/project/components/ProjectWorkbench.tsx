import { useI18n } from '../../../i18n';
import { translate } from '../../../i18n';
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
function versionStatus(
  draft: boolean,
  revision: string | null,
  active: string | null,
  origin?: 'import',
  locale: 'en' | 'fr' = 'en',
) {
  if (draft)
    return translate(
      'Brouillon enregistré · non appliqué',
      'Saved draft · not applied',
      undefined,
      locale,
    );
  if (origin === 'import')
    return translate('Référence importée', 'Imported reference', undefined, locale);
  return revision === active
    ? translate('Appliquée', 'Applied', undefined, locale)
    : translate('Consultation', 'Read-only', undefined, locale);
}
function analysisStatus(
  loading: boolean,
  error: string | undefined,
  analysis: ProjectAnalysis | undefined,
  stale: boolean,
  locale: 'en' | 'fr' = 'en',
) {
  if (loading)
    return stale
      ? translate(
          'Nouvelle analyse en cours · dernière analyse affichée, à actualiser.',
          'New analysis running · last analysis displayed, refresh required.',
          undefined,
          locale,
        )
      : translate('Analyse des sources…', 'Analyzing sources…', undefined, locale);
  if (error)
    return (
      error +
      (stale
        ? translate(
            ' Dernière analyse conservée, non actualisée.',
            ' Last analysis retained, not refreshed.',
            undefined,
            locale,
          )
        : '')
    );
  if (!analysis)
    return translate('Aucune version à analyser.', 'No version to analyze.', undefined, locale);
  return translate(
    '{files} fichiers · {elements} éléments · {status}',
    '{files} files · {elements} elements · {status}',
    {
      files: analysis.files.length,
      elements: analysis.elements.length,
      status:
        analysis.status === 'complete'
          ? translate('analyse terminée', 'analysis completed', undefined, locale)
          : translate('analyse partielle', 'partial analysis', undefined, locale),
    },
    locale,
  );
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
  const { t, locale } = useI18n();
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
            {versionStatus(
              effectiveDraft,
              props.revisionId,
              props.activeRevisionId,
              props.revisions?.find((revision) => revision.id === props.revisionId)?.origin?.kind,
              locale,
            )}
          </span>
        </span>
        <div>
          <details className="project-analysis-menu">
            <summary>
              {loading
                ? t('Analyse en cours…', 'Analysis running…')
                : error
                  ? t('Analyse indisponible', 'Analysis unavailable')
                  : stale
                    ? t('À actualiser', 'Refresh required')
                    : t('{count} fichiers', '{count} files', {
                        count: analysis?.files.length || 0,
                      })}
            </summary>
            <div className="project-analysis-line">
              <span role="status">{analysisStatus(loading, error, analysis, stale, locale)}</span>
              <label>
                <input
                  type="checkbox"
                  checked={effectiveDraft}
                  onChange={(event) => setDraft(event.target.checked)}
                  disabled={!props.revisionId || props.revisionId !== props.activeRevisionId}
                />
                {t('Inclure le brouillon enregistré', 'Include saved draft')}
              </label>
              {analysis && (
                <details className="project-analysis-details">
                  <summary>
                    {t(
                      'Périmètre, limites et décisions de conception',
                      'Scope, limitations and design decisions',
                    )}
                  </summary>
                  <p>
                    {analysis.scope} · {analysis.environment} ·{' '}
                    {new Date(analysis.analyzedAt).toLocaleString(locale)}
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
                    {t(
                      'Les choix de conception sont déclaratifs ; leur conformité au code demande une vérification.',
                      'Design choices are declarations; their conformity with the code requires verification.',
                    )}
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
              {t('Décision à examiner', 'Decision to review')}
            </button>
          )}
          <button aria-pressed={props.focused} onClick={props.onFocus}>
            <ProjectIcon name="eye" />
            {t('Focus technique', 'Technical focus')}
          </button>
          <button
            onClick={props.onExpand}
            aria-label={t('Agrandir l’espace technique', 'Expand technical workspace')}
            title={t('Agrandir l’espace technique', 'Expand technical workspace')}
          >
            <ProjectIcon name="focus" />
          </button>
        </div>
      </header>
      <nav className="project-subnav" aria-label={t('Vues du code', 'Code views')}>
        {(
          [
            ['files', t('Fichiers', 'Files')],
            ['architecture', 'Architecture'],
            ['flows', t('Flux', 'Flows')],
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
          title={t('Afficher ou masquer l’inspection', 'Show or hide inspection')}
        >
          {t('Inspecteur', 'Inspector')}
        </button>
        <button
          onClick={refresh}
          aria-label={t('Reconstruire l’analyse', 'Rebuild analysis')}
          title={t('Reconstruire l’analyse', 'Rebuild analysis')}
        >
          <ProjectIcon name="refresh" />
        </button>
      </nav>
      {error && (
        <p className="project-caution">
          {t(
            'L’analyse n’est pas disponible. L’éditeur reste accessible.',
            'Analysis is unavailable. The editor remains accessible.',
          )}{' '}
          <button onClick={refresh}>{t('Réessayer', 'Retry')}</button>
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
          <Suspense
            fallback={<p role="status">{t('Chargement de cette vue…', 'Loading this view…')}</p>}
          >
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
          {t('Vérifications de cette version ·', 'Checks for this version ·')}{' '}
          <span>{t('Consulter les résultats et les preuves', 'Inspect results and evidence')}</span>
        </summary>
        <p>
          {t(
            'Contrôles historiques transmis à cet espace. Le panneau Qualité rassemble les résultats et les rapports reçus de l’hôte ; ils ne valident pas toute l’application.',
            'Historical checks supplied to this workspace. The Quality panel gathers results and host reports; they do not validate the entire application.',
          )}
        </p>
        {checks.map((check) => (
          <p key={check.id} className={check.status === 'failed' ? 'project-caution' : ''}>
            {check.status === 'passed' ? '✓' : '×'} {check.label}
          </p>
        ))}
        {checksUnavailable ? (
          <p>
            {t(
              'Contrôles historiques masqués · analyse en attente ou indisponible. Ils seront rapprochés de la version quand son analyse sera disponible.',
              'Historical checks hidden · analysis pending or unavailable. They will be matched to the version when its analysis is available.',
            )}
          </p>
        ) : (
          !checks.length && (
            <p>
              {t(
                'Aucun contrôle historique transmis à cet espace.',
                'No historical checks supplied to this workspace.',
              )}
            </p>
          )
        )}
        <button onClick={() => props.onShowChecks()}>
          {t('Consulter les preuves et les outils →', 'Inspect evidence and tools →')}
        </button>
      </details>
    </div>
  );
}
