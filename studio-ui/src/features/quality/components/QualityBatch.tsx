import { useI18n } from '../../../i18n';
import { shortRevision } from '../model/selectors';

export function QualityBatch({
  batch,
  onStop,
}: {
  batch: {
    revisionId: string;
    total: number;
    completed: number;
    state: 'running' | 'complete' | 'stopped';
    stopping?: boolean;
  };
  onStop(): void;
}) {
  const { t } = useI18n();
  const label = {
    complete: t('Terminés', 'Completed'),
    stopped: t('Série interrompue', 'Batch interrupted'),
    running: t('Contrôles en cours', 'Checks running'),
  }[batch.state];
  return (
    <div className="quality-batch" role="status" aria-live="polite">
      <span>
        {label} : {batch.completed} / {batch.total}{' '}
        {t('réponses reçues · version', 'responses received · version')}{' '}
        {shortRevision(batch.revisionId)}.
      </span>
      <progress
        value={batch.completed}
        max={batch.total}
        aria-label={t('Contrôles terminés', 'Checks completed')}
      />
      {batch.state === 'running' ? (
        <button type="button" onClick={onStop} disabled={batch.stopping}>
          {batch.stopping
            ? t('Arrêt après le contrôle en cours…', 'Stopping after the current check…')
            : t('Arrêter après ce contrôle', 'Stop after this check')}
        </button>
      ) : null}
      <small>
        {t(
          'Seuls les contrôles raccordés sont exécutés. Les résultats détaillés restent propres à chaque contrôle.',
          'Only connected checks are executed. Detailed results remain specific to each check.',
        )}
      </small>
    </div>
  );
}
