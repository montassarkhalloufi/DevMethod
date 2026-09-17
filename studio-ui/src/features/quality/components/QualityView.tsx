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

export function QualityView(options: QualityOptions) {
  const { report, error, runningId, batch, run, runAll, stopAfterCurrent, refresh } =
    useQuality(options);
  const detail = useRef<HTMLElement>(null);
  const [category, setCategory] = useState('all'),
    [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(''),
    [history, setHistory] = useState(false);
  if (!options.revisionId)
    return (
      <section className="quality-workspace quality-empty">
        <h2>Qualité du projet</h2>
        <p>Créez une version pour relier les contrôles à ses fichiers exacts.</p>
      </section>
    );
  if (!report)
    return (
      <section className="quality-workspace">
        <h2>Qualité du projet</h2>
        <p role="status">{error || 'Lecture des contrôles de cette version…'}</p>
        {error ? (
          <button type="button" onClick={refresh}>
            Réessayer
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
          <h2 id="quality-heading">Qualité du projet</h2>
          <p>
            Résultats liés à la version sélectionnée{' '}
            <strong>{shortRevision(report.revisionId)}</strong>.
          </p>
        </div>
        <div className="quality-heading-actions">
          {options.onOpenConnectors ? (
            <button type="button" onClick={() => options.onOpenConnectors?.()}>
              Outils et connecteurs
            </button>
          ) : null}
          <button
            type="button"
            data-quality-run-all=""
            onClick={() => void runAll()}
            disabled={runningId !== null || !runnableChecks(report.checks).length}
          >
            Exécuter les contrôles disponibles ({runnableChecks(report.checks).length})
          </button>
          <button type="button" onClick={refresh} disabled={runningId !== null}>
            Actualiser
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
          Sources locales modifiées ou indisponibles : preuves à réévaluer. Aucun nouveau succès ne
          peut être enregistré.
        </p>
      ) : null}
      <nav className="quality-categories" aria-label="Famille de contrôles">
        {[{ id: 'all', label: 'Tous' }, ...report.categories].map((item) => (
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
      <div className="quality-summary" aria-label="Résumé du périmètre filtré">
        <div className="quality-summary-passed">
          <span aria-hidden="true">✓</span>
          <strong>{counts.passed}</strong>
          <div>
            Réussis<small>Périmètre de ces contrôles uniquement</small>
          </div>
        </div>
        <div className="quality-summary-failed">
          <span aria-hidden="true">×</span>
          <strong>{counts.failed}</strong>
          <div>
            En échec<small>Résultats à examiner</small>
          </div>
        </div>
        <div className="quality-summary-waiting">
          <span aria-hidden="true">◷</span>
          <strong>{counts.notrun + counts.blocked + counts.configure}</strong>
          <div>
            Sans exécution aboutie
            <small>
              {counts.notrun} non exécuté(s) · {counts.configure} à connecter · {counts.blocked}{' '}
              bloqué(s)
            </small>
          </div>
        </div>
      </div>
      <div className="quality-filters">
        <label>
          Résultat
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tous les résultats</option>
            {Object.entries(statusLabels).map(([value, label]) => (
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
          Preuves des autres versions ({report.historical.length})
        </label>
        <span>
          {counts.total} contrôle(s) · {counts.notapplicable} non applicable(s) ·{' '}
          {counts.reevaluate} hors preuve actuelle · {counts.running} en cours
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
          />
          <QualityTrace check={selected} report={report} onOpenSource={options.onOpenSource} />
        </div>
      ) : null}
      <details className="quality-report-limits">
        <summary>Ce que ces résultats permettent de conclure</summary>
        <ul>
          {report.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
