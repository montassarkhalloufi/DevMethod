import type { Ref } from 'react';
import type { QualityCheck, QualityOptions, QualityReport } from '../model/contracts';
import {
  dateLabel,
  checkStatus,
  durationLabel,
  freshnessLabels,
  shortRevision,
  statusLabels,
} from '../model/selectors';
import { prepareQualityRequest } from '../model/requests';

function EvidenceMetadata({ check, revisionId }: { check: QualityCheck; revisionId: string }) {
  const evidence = check.evidence;
  return (
    <dl className="quality-metadata">
      <div>
        <dt>{evidence ? 'Version contrôlée' : 'Version à contrôler'}</dt>
        <dd>
          {shortRevision(evidence?.revisionId ?? revisionId)} · {freshnessLabels[check.freshness]}
        </dd>
      </div>
      <div>
        <dt>Dernière exécution</dt>
        <dd>
          {dateLabel(evidence?.finishedAt)} · {durationLabel(evidence?.durationMs)}
        </dd>
      </div>
      <div>
        <dt>Environnement</dt>
        <dd>{evidence?.environment ?? 'Aucune exécution'}</dd>
      </div>
      {evidence?.provider ? (
        <div>
          <dt>Provenance du rapport</dt>
          <dd>
            {evidence.tool} {evidence.toolVersion} · {evidence.source?.kind} · connexion{' '}
            {evidence.provider.connectionId}. Rapport reçu de l’agent hôte.
          </dd>
        </div>
      ) : null}
      {evidence?.metrics
        ? Object.entries(evidence.metrics).map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))
        : null}
      {evidence?.fingerprint ? (
        <div>
          <dt>Empreinte du périmètre</dt>
          <dd title={evidence.fingerprint}>{evidence.fingerprint.slice(0, 16)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function ExecutionAction({
  check,
  runningId,
  onRun,
}: {
  check: QualityCheck;
  runningId: string | null;
  onRun(id: string): void;
}) {
  const evidence = check.evidence;
  const running = runningId === check.id;
  return (
    <div className="quality-detail-actions">
      {check.canRun ? (
        <button
          type="button"
          className="quality-primary"
          disabled={runningId !== null}
          onClick={() => onRun(check.id)}
        >
          {running
            ? 'Contrôle en cours…'
            : evidence
              ? 'Relancer ce contrôle'
              : 'Exécuter ce contrôle'}{' '}
          <span aria-hidden="true">→</span>
        </button>
      ) : evidence ? (
        <p className="quality-unavailable">
          {check.reason ??
            'Cette preuve historique est consultable ; elle ne lance pas de commande.'}
        </p>
      ) : null}
    </div>
  );
}

export function QualityDetail({
  check,
  detailRef,
  report,
  runningId,
  onRun,
  onOpenSource,
  onPrepareRequest,
  onOpenConnectors,
}: {
  check: QualityCheck;
  detailRef: Ref<HTMLElement>;
  report: QualityReport;
  runningId: string | null;
  onRun(id: string): void;
  onOpenSource: QualityOptions['onOpenSource'];
  onPrepareRequest: QualityOptions['onPrepareRequest'];
  onOpenConnectors?: QualityOptions['onOpenConnectors'];
}) {
  const evidence = check.evidence;
  return (
    <section
      ref={detailRef}
      tabIndex={-1}
      className={`quality-detail quality-detail-${check.status}`}
      aria-labelledby="quality-detail-heading"
    >
      <header>
        <span
          className={`quality-status quality-status-${check.freshness === 'current' ? check.status : 'blocked'}`}
        >
          {statusLabels[checkStatus(check)]}
        </span>
        <h3 id="quality-detail-heading">{check.title}</h3>
      </header>
      <div className="quality-expectation">
        <strong>Attendu</strong>
        <p>{evidence?.expected ?? check.objective}</p>
      </div>
      <div className="quality-observation">
        <strong>{evidence ? 'Observé' : 'État du contrôle'}</strong>
        <p>{evidence?.observed || check.reason || 'Ce contrôle n’a pas encore été exécuté.'}</p>
      </div>
      <EvidenceMetadata check={check} revisionId={report.revisionId} />
      {evidence?.findings.length ? (
        <ul className="quality-findings">
          {evidence.findings.map((finding, index) => (
            <li key={`${finding.source?.path || finding.target || 'diagnostic'}:${index}`}>
              {finding.source ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenSource(finding.source!.path, finding.source!.line, evidence.revisionId)
                  }
                >
                  {finding.source.path}
                  {finding.source.line ? `:${finding.source.line}` : ''} ↗
                </button>
              ) : (
                <span>{finding.target || 'Constat sans fichier associé'}</span>
              )}
              <p>{finding.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <ExecutionAction check={check} runningId={runningId} onRun={onRun} />
      {check.execution === 'external' && onOpenConnectors ? (
        <button type="button" onClick={() => onOpenConnectors(check.id)}>
          Choisir un outil ou un connecteur →
        </button>
      ) : null}
      {onPrepareRequest && (check.status === 'failed' || check.status === 'blocked') ? (
        <div className="quality-next-step">
          <button
            type="button"
            data-quality-prepare=""
            disabled={runningId !== null}
            onClick={() => onPrepareRequest(prepareQualityRequest(check, report))}
          >
            {checkStatus(check) === 'configure'
              ? 'Préparer le raccordement de ce contrôle'
              : 'Préparer une correction'}
          </button>
          <p>
            Prépare une demande DevMethod avec la version et les constats. Vous pourrez la compléter
            avant de l’envoyer.
          </p>
        </div>
      ) : null}
      {check.nextAction ? (
        <div className="quality-procedure">
          <strong>Pour l’exécuter</strong>
          <p>{check.nextAction}</p>
          <p>
            Version à joindre à la preuve : {shortRevision(report.revisionId)}. Le Studio ne déduit
            aucun résultat de cette procédure.
          </p>
        </div>
      ) : null}
      {evidence?.limits.length ? (
        <details className="quality-limits">
          <summary>Portée et limites du contrôle</summary>
          <ul>
            {evidence.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
