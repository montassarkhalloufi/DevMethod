import { useI18n } from '../../../i18n';
import { useRef, useState } from 'react';
import type { QualityOptions } from '../model/contracts';
import { useQuality } from '../hooks/useQuality';
import {
  filterChecks,
  runnableChecks,
  shortRevision,
  statusLabels,
  summarizeChecks,
} from '../model/selectors';
import { QualityTable } from './QualityTable';
import { QualityDetail } from './QualityDetail';
import { QualityTrace } from './QualityTrace';
import { QualityBatch } from './QualityBatch';
import { BrowserConfiguration } from './BrowserConfiguration';

export function QualityView(options: QualityOptions) {
  const { t } = useI18n();
  const quality = useQuality(options);
  return (
    <>
      <BrowserConfiguration onSaved={quality.refresh} />
      {options.verification ? (
        <p role="status" className="quality-batch">
          {t('Vérification navigateur du candidat', 'Candidate browser verification')}{' '}
          {options.verification.revisionId} ·{' '}
          {options.verification.status === 'running'
            ? t('en cours', 'running')
            : options.verification.status === 'passed'
              ? t(
                  'Assertions satisfaites sur le périmètre déclaré',
                  'Assertions passed within the declared scope',
                )
              : options.verification.status === 'failed'
                ? t('En échec : consulter les constats', 'Failed: inspect findings')
                : t(
                    'Bloquée ou interrompue : aucun succès confirmé',
                    'Blocked or interrupted: no confirmed success',
                  )}
          .
          {options.verification.revisionId !== options.revisionId
            ? t(
                ' Ce résultat ne concerne pas la version affichée.',
                ' This result does not concern the displayed version.',
              )
            : ''}
        </p>
      ) : null}
      <QualityReportView options={options} quality={quality} />
    </>
  );
}

function QualityReportView({
  options,
  quality,
}: {
  options: QualityOptions;
  quality: ReturnType<typeof useQuality>;
}) {
  const { t, locale } = useI18n();
  const {
    report,
    error,
    runningId,
    batch,
    run,
    runAll,
    stopAfterCurrent,
    refresh,
    refreshCoverage,
  } = quality;
  const detail = useRef<HTMLElement>(null);
  const [category, setCategory] = useState('all'),
    [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(''),
    [history, setHistory] = useState(false);
  if (!options.revisionId)
    return (
      <section className="quality-workspace quality-empty">
        <h2>{t('Qualité du projet', 'Project quality')}</h2>
        <p>
          {t(
            'Créez une version pour relier les contrôles à ses fichiers exacts.',
            'Create a version to link checks to its exact files.',
          )}
        </p>
      </section>
    );
  if (!report)
    return (
      <section className="quality-workspace">
        <h2>{t('Qualité du projet', 'Project quality')}</h2>
        <p role="status">
          {error ||
            t('Lecture des contrôles de cette version…', 'Loading checks for this version…')}
        </p>
        {error ? (
          <button type="button" onClick={refresh}>
            {t('Réessayer', 'Retry')}
          </button>
        ) : null}
      </section>
    );
  const pool = (history ? report.historical : report.checks).map((check) =>
    check.id === runningId ? { ...check, status: 'running' as const } : check,
  );
  const rows = filterChecks(pool, category, status),
    counts = summarizeChecks(rows);
  const selected =
    rows.find((check) => check.id === selectedId) ??
    rows.find((check) => check.status === 'failed') ??
    rows[0];
  return (
    <section className="quality-workspace" aria-labelledby="quality-heading">
      <header className="quality-heading">
        <div>
          <h2 id="quality-heading">{t('Qualité du projet', 'Project quality')}</h2>
          <p>
            {t(
              'Résultats liés à la version sélectionnée',
              'Results linked to the selected version',
            )}{' '}
            <strong>{shortRevision(report.revisionId)}</strong>.
          </p>
        </div>
        <div className="quality-heading-actions">
          {options.onOpenConnectors ? (
            <button type="button" onClick={() => options.onOpenConnectors?.()}>
              {t('Outils et connecteurs', 'Tools and connectors')}
            </button>
          ) : null}
          <button
            type="button"
            data-quality-run-all=""
            onClick={() => void runAll()}
            disabled={runningId !== null || !runnableChecks(report.checks).length}
          >
            {t('Exécuter les contrôles disponibles (', 'Run available checks (')}
            {runnableChecks(report.checks).length})
          </button>
          <button type="button" onClick={refresh} disabled={runningId !== null}>
            {t('Actualiser', 'Refresh')}
          </button>
        </div>
      </header>
      {batch ? <QualityBatch batch={batch} onStop={stopAfterCurrent} /> : null}
      {error ? (
        <p role="alert" className="quality-error">
          {error}
        </p>
      ) : null}
      {report.localChanges ? (
        <p className="quality-warning" role="status">
          {t(
            'Sources locales modifiées ou indisponibles : preuves à réévaluer. Aucun nouveau succès ne peut être enregistré.',
            'Local sources changed or unavailable: evidence needs review. No new success can be recorded.',
          )}
        </p>
      ) : null}
      <nav className="quality-categories" aria-label={t('Famille de contrôles', 'Check category')}>
        {[{ id: 'all', label: t('Tous', 'All') }, ...report.categories].map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div
        className="quality-summary"
        aria-label={t('Résumé du périmètre filtré', 'Filtered scope summary')}
      >
        <div className="quality-summary-passed">
          <span aria-hidden="true">✓</span>
          <strong>{counts.passed}</strong>
          <div>
            {t('Réussis', 'Passed')}
            <small>
              {t('Périmètre de ces contrôles uniquement', 'Scope of these checks only')}
            </small>
          </div>
        </div>
        <div className="quality-summary-failed">
          <span aria-hidden="true">×</span>
          <strong>{counts.failed}</strong>
          <div>
            {t('En échec', 'Failed')}
            <small>{t('Résultats à examiner', 'Results to inspect')}</small>
          </div>
        </div>
        <div className="quality-summary-waiting">
          <span aria-hidden="true">◷</span>
          <strong>{counts.notrun + counts.blocked + counts.configure}</strong>
          <div>
            {t('Sans exécution aboutie', 'No completed execution')}
            <small>
              {counts.notrun} {t('non exécuté(s) ·', 'not run ·')} {counts.configure}{' '}
              {t('à connecter ·', 'to connect ·')} {counts.blocked} {t('bloqué(s)', 'blocked')}
            </small>
          </div>
        </div>
      </div>
      <div className="quality-filters">
        <label>
          {t('Résultat', 'Result')}
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">{t('Tous les résultats', 'All results')}</option>
            {Object.entries(statusLabels(locale)).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="quality-history-toggle">
          <input
            type="checkbox"
            checked={history}
            onChange={(event) => setHistory(event.target.checked)}
          />
          {t('Preuves des autres versions (', 'Evidence from other versions (')}
          {report.historical.length})
        </label>
        <span>
          {counts.total} {t('contrôle(s) ·', 'check(s) ·')} {counts.notapplicable}{' '}
          {t('non applicable(s) ·', 'not applicable ·')} {counts.reevaluate}{' '}
          {t('hors preuve actuelle ·', 'outside current evidence ·')} {counts.running}{' '}
          {t('en cours', 'running')}
        </span>
      </div>
      <QualityTable
        checks={rows}
        selectedId={selected?.id}
        runningId={runningId}
        categories={report.categories}
        onSelect={(id) => {
          setSelectedId(id);
          requestAnimationFrame(() => detail.current?.focus());
        }}
      />
      {selected ? (
        <div className="quality-details-grid">
          <QualityDetail
            detailRef={detail}
            check={selected}
            report={report}
            runningId={runningId}
            onRun={(id) => void run(id)}
            onOpenSource={options.onOpenSource}
            onPrepareRequest={options.onPrepareRequest}
            onOpenConnectors={options.onOpenConnectors}
            onCoverageReviewed={() => {
              void refreshCoverage();
              options.onStateChanged?.();
            }}
          />
          <QualityTrace check={selected} report={report} onOpenSource={options.onOpenSource} />
        </div>
      ) : null}
      <details className="quality-report-limits">
        <summary>
          {t('Ce que ces résultats permettent de conclure', 'What these results establish')}
        </summary>
        <ul>
          {report.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
