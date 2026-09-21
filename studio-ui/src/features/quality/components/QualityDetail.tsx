import { translate } from '../../../i18n';
import { useI18n } from '../../../i18n';
import type { Ref } from 'react';
import type {
  BrowserReceipt,
  QualityCheck,
  QualityOptions,
  QualityReport,
} from '../model/contracts';
import {
  dateLabel,
  checkStatus,
  durationLabel,
  freshnessLabels,
  shortRevision,
  statusLabels,
} from '../model/selectors';
import { prepareQualityRequest } from '../model/requests';
import { CoverageReview } from './CoverageReview';

function EvidenceMetadata({ check, revisionId }: { check: QualityCheck; revisionId: string }) {
  const { t, locale } = useI18n();
  const evidence = check.evidence;
  return (
    <dl className="quality-metadata">
      <div>
        <dt>
          {evidence
            ? t('Version contrôlée', 'Checked version')
            : t('Version à contrôler', 'Version to check')}
        </dt>
        <dd>
          {shortRevision(evidence?.revisionId ?? revisionId)} ·{' '}
          {freshnessLabels(locale)[check.freshness]}
        </dd>
      </div>
      <div>
        <dt>{t('Dernière exécution', 'Last execution')}</dt>
        <dd>
          {dateLabel(evidence?.finishedAt, locale)} · {durationLabel(evidence?.durationMs, locale)}
        </dd>
      </div>
      <div>
        <dt>{t('Environnement', 'Environment')}</dt>
        <dd>{evidence?.environment ?? t('Aucune exécution', 'No execution')}</dd>
      </div>
      {evidence?.provider ? (
        <div>
          <dt>{t('Provenance du rapport', 'Report provenance')}</dt>
          <dd>
            {evidence.tool} {evidence.toolVersion} · {evidence.source?.kind}{' '}
            {t('· connexion', '· connection')} {evidence.provider.connectionId}
            {t('. Rapport reçu de l’agent hôte.', '. Report received from the host agent.')}
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
          <dt>{t('Empreinte du périmètre', 'Scope fingerprint')}</dt>
          <dd title={evidence.fingerprint}>{evidence.fingerprint.slice(0, 16)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

const browserStatusLabels = (locale: 'en' | 'fr' = 'en') => ({
  'not-run': translate('Non exécuté', 'Not run', undefined, locale),
  running: translate('En cours', 'Running', undefined, locale),
  passed: translate('Satisfait', 'Satisfied', undefined, locale),
  failed: translate('En échec', 'Failed', undefined, locale),
  blocked: translate('Bloqué', 'Blocked', undefined, locale),
});
const assertionLabels = (locale: 'en' | 'fr' = 'en') => ({
  expectText: translate('Texte attendu', 'Expected text', undefined, locale),
  expectValue: translate('Valeur attendue', 'Expected value', undefined, locale),
  expectVisible: translate('Visibilité attendue', 'Expected visibility', undefined, locale),
  expectData: translate('Données attendues', 'Expected data', undefined, locale),
});
function BrowserEvidence({ receipt }: { receipt: BrowserReceipt }) {
  const { t, locale } = useI18n();
  return (
    <details className="quality-limits quality-browser-receipt" open>
      <summary>
        {t('Scénarios exécutés dans le navigateur', 'Scenarios executed in the browser')}
      </summary>
      <p>
        {receipt.channel === 'chrome' ? 'Chrome' : 'Edge'} {t('· navigateur', '· browser')}{' '}
        {receipt.browserVersion ?? t('version non recueillie', 'version not captured')}{' '}
        {t('· pilote', '· driver')}{' '}
        {receipt.driverVersion ?? t('version non recueillie', 'version not captured')}{' '}
        {t('· protocole', '· protocol')} {receipt.protocol}
      </p>
      <p>
        {t(
          'Le résultat porte uniquement sur les assertions des scénarios déclarés. Les critères associés ne sont pas validés automatiquement ; cette liste ne démontre pas une couverture complète du besoin.',
          'The result covers only assertions in declared scenarios. Associated criteria are not automatically validated; this list does not demonstrate complete coverage of the need.',
        )}
      </p>
      {receipt.scenarios.length ? (
        receipt.scenarios.map((scenario) => (
          <article key={scenario.id}>
            <h4>
              {scenario.title} · {browserStatusLabels(locale)[scenario.status]}
            </h4>
            <p>
              {t('Scénario', 'Scenario')} {scenario.id} · {scenario.executedSteps}{' '}
              {t('étape(s) exécutée(s).', 'step(s) executed.')}
            </p>
            <p>
              {t('Critères déclarés, non validés :', 'Declared criteria, not validated:')}{' '}
              {scenario.criterionIds.length ? scenario.criterionIds.join(', ') : t('aucun', 'none')}
              .
            </p>
            {scenario.assertions.length ? (
              <ul>
                {scenario.assertions.map((assertion) => (
                  <li key={assertion.step}>
                    {t('Étape', 'Step')} {assertion.step} ·{' '}
                    {assertionLabels(locale)[assertion.action]} ·{' '}
                    {browserStatusLabels(locale)[assertion.status]}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {t(
                  'Aucune assertion exécutée dans ce scénario.',
                  'No assertion executed in this scenario.',
                )}
              </p>
            )}
          </article>
        ))
      ) : (
        <p>{t('Aucun scénario exécuté.', 'No scenario executed.')}</p>
      )}
      <p>
        {t(
          'Les valeurs privées attendues et observées ne sont pas conservées dans ce reçu. Les constats disponibles figurent dans le résultat et les diagnostics du contrôle.',
          'Private expected and observed values are not retained in this receipt. Available findings appear in the check result and diagnostics.',
        )}
      </p>
      {receipt.manifestFingerprint || receipt.sourceFingerprint ? (
        <details>
          <summary>{t('Empreintes du reçu navigateur', 'Browser receipt fingerprints')}</summary>
          <dl className="quality-metadata">
            {receipt.manifestFingerprint ? (
              <div>
                <dt>{t('Scénarios déclarés', 'Declared scenarios')}</dt>
                <dd>{receipt.manifestFingerprint}</dd>
              </div>
            ) : null}
            {receipt.sourceFingerprint ? (
              <div>
                <dt>{t('Sources contrôlées', 'Checked sources')}</dt>
                <dd>{receipt.sourceFingerprint}</dd>
              </div>
            ) : null}
          </dl>
        </details>
      ) : null}
    </details>
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
  const { t } = useI18n();
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
            ? t('Contrôle en cours…', 'Check running…')
            : evidence
              ? t('Relancer ce contrôle', 'Run this check again')
              : t('Exécuter ce contrôle', 'Run this check')}{' '}
          <span aria-hidden="true">→</span>
        </button>
      ) : evidence ? (
        <p className="quality-unavailable">
          {check.reason ??
            t(
              'Cette preuve historique est consultable ; elle ne lance pas de commande.',
              'This historical evidence can be viewed; it does not launch a command.',
            )}
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
  onCoverageReviewed,
}: {
  check: QualityCheck;
  detailRef: Ref<HTMLElement>;
  report: QualityReport;
  runningId: string | null;
  onRun(id: string): void;
  onOpenSource: QualityOptions['onOpenSource'];
  onPrepareRequest: QualityOptions['onPrepareRequest'];
  onOpenConnectors?: QualityOptions['onOpenConnectors'];
  onCoverageReviewed?: () => void;
}) {
  const { t, locale } = useI18n();
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
          {statusLabels(locale)[checkStatus(check)]}
        </span>
        <h3 id="quality-detail-heading">{check.title}</h3>
      </header>
      <div className="quality-expectation">
        <strong>{t('Attendu', 'Expected')}</strong>
        <p>{evidence?.expected ?? check.objective}</p>
      </div>
      <div className="quality-observation">
        <strong>
          {evidence ? t('Observé', 'Observed') : t('État du contrôle', 'Check status')}
        </strong>
        <p>
          {evidence?.observed ||
            check.reason ||
            t('Ce contrôle n’a pas encore été exécuté.', 'This check has not run yet.')}
        </p>
      </div>
      <EvidenceMetadata check={check} revisionId={report.revisionId} />
      {evidence?.browser ? <BrowserEvidence receipt={evidence.browser} /> : null}
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
                <span>
                  {finding.target ||
                    t('Constat sans fichier associé', 'Finding without an associated file')}
                </span>
              )}
              <p>{finding.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {check.id === 'business-browser' && evidence ? (
        <CoverageReview
          key={`${evidence.revisionId}:${evidence.id}`}
          revisionId={evidence.revisionId}
          receiptId={evidence.id}
          onSaved={() => onCoverageReviewed?.()}
        />
      ) : null}
      <ExecutionAction check={check} runningId={runningId} onRun={onRun} />
      {check.execution === 'external' && onOpenConnectors ? (
        <button type="button" onClick={() => onOpenConnectors(check.id)}>
          {t('Choisir un outil ou un connecteur →', 'Choose a tool or connector →')}
        </button>
      ) : null}
      {onPrepareRequest && (check.status === 'failed' || check.status === 'blocked') ? (
        <div className="quality-next-step">
          <button
            type="button"
            data-quality-prepare=""
            disabled={runningId !== null}
            onClick={() => onPrepareRequest(prepareQualityRequest(check, report, locale))}
          >
            {checkStatus(check) === 'configure'
              ? t('Préparer le raccordement de ce contrôle', 'Prepare this check’s integration')
              : t('Préparer une correction', 'Prepare a correction')}
          </button>
          <p>
            {t(
              'Prépare une demande DevMethod avec la version et les constats. Vous pourrez la compléter avant de l’envoyer.',
              'Prepares a DevMethod request with the version and findings. You can edit it before sending.',
            )}
          </p>
        </div>
      ) : null}
      {check.nextAction ? (
        <div className="quality-procedure">
          <strong>{t('Pour l’exécuter', 'To run it')}</strong>
          <p>{check.nextAction}</p>
          <p>
            {t('Version à joindre à la preuve :', 'Version to attach to the evidence:')}{' '}
            {shortRevision(report.revisionId)}
            {t(
              '. Le Studio ne déduit aucun résultat de cette procédure.',
              '. Studio does not infer any result from this procedure.',
            )}
          </p>
        </div>
      ) : null}
      {evidence?.limits.length ? (
        <details className="quality-limits">
          <summary>{t('Portée et limites du contrôle', 'Check scope and limitations')}</summary>
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
