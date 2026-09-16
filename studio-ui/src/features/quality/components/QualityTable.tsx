import type { QualityCheck } from '../model/contracts';
import {
  checkStatus,
  dateLabel,
  durationLabel,
  freshnessLabels,
  statusLabels,
} from '../model/selectors';

export function QualityTable({
  checks,
  selectedId,
  runningId,
  categories,
  onSelect,
}: {
  checks: QualityCheck[];
  selectedId?: string;
  runningId: string | null;
  categories: { id: string; label: string }[];
  onSelect(id: string): void;
}) {
  return (
    <div
      className="quality-table-scroll"
      tabIndex={0}
      aria-label="Tableau des contrôles, défilement horizontal disponible"
    >
      <table className="quality-table">
        <caption className="quality-sr">
          Contrôles du périmètre filtré. Sélectionnez un nom pour consulter sa preuve.
        </caption>
        <thead>
          <tr>
            <th scope="col">Contrôle</th>
            <th scope="col">Catégorie</th>
            <th scope="col">Outil / méthode</th>
            <th scope="col">Résultat</th>
            <th scope="col">Durée</th>
            <th scope="col">Dernière exécution</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => {
            const status = runningId === check.id ? 'running' : checkStatus(check);
            return (
              <tr
                key={check.id}
                className={
                  selectedId === check.id ? `is-selected quality-row-${status}` : undefined
                }
              >
                <th scope="row">
                  <button
                    type="button"
                    className="quality-row-button"
                    aria-pressed={selectedId === check.id}
                    onClick={() => onSelect(check.id)}
                  >
                    {check.title}
                    <span aria-hidden="true">›</span>
                  </button>
                </th>
                <td>
                  {categories.find((category) => category.id === check.category)?.label ??
                    check.category}
                </td>
                <td className="quality-method">{check.tool}</td>
                <td>
                  <span
                    className={`quality-status quality-status-${check.freshness === 'current' ? status : 'blocked'}`}
                  >
                    {statusLabels[status]}
                  </span>
                  {check.freshness !== 'current' ? (
                    <small className="quality-freshness">{freshnessLabels[check.freshness]}</small>
                  ) : null}
                </td>
                <td className="quality-numeric">{durationLabel(check.evidence?.durationMs)}</td>
                <td className="quality-numeric">{dateLabel(check.evidence?.finishedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!checks.length ? (
        <p className="quality-empty">Aucun contrôle ne correspond à ces filtres.</p>
      ) : null}
    </div>
  );
}
