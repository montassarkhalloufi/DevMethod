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
  const label = {
    complete: 'Terminés',
    stopped: 'Série interrompue',
    running: 'Contrôles en cours',
  }[batch.state];
  return (
    <div className="quality-batch" role="status" aria-live="polite">
      <span>
        {label} : {batch.completed} / {batch.total} réponses reçues · version{' '}
        {shortRevision(batch.revisionId)}.
      </span>
      <progress value={batch.completed} max={batch.total} aria-label="Contrôles terminés" />
      {batch.state === 'running' ? (
        <button type="button" onClick={onStop} disabled={batch.stopping}>
          {batch.stopping ? 'Arrêt après le contrôle en cours…' : 'Arrêter après ce contrôle'}
        </button>
      ) : null}
      <small>
        Seuls les contrôles raccordés sont exécutés. Les résultats détaillés restent propres à
        chaque contrôle.
      </small>
    </div>
  );
}
