import { useI18n } from '../../../i18n';
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
  const { t, locale } = useI18n();
  return (
    <div
      className="quality-table-scroll"
      tabIndex={0}
      aria-label={t(
        'Tableau des contrôles, défilement horizontal disponible',
        'Checks table, horizontal scrolling available',
      )}
    >
      <table className="quality-table">
        <caption className="quality-sr">
          {t(
            'Contrôles du périmètre filtré. Sélectionnez un nom pour consulter sa preuve.',
            'Checks in the filtered scope. Select a name to inspect its evidence.',
          )}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('Contrôle', 'Check')}</th>
            <th scope="col">{t('Catégorie', 'Category')}</th>
            <th scope="col">{t('Outil / méthode', 'Tool / method')}</th>
            <th scope="col">{t('Résultat', 'Result')}</th>
            <th scope="col">{t('Durée', 'Duration')}</th>
            <th scope="col">{t('Dernière exécution', 'Last execution')}</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => {
            const status = runningId === check.id ? 'running' : checkStatus(check);
            const reported = check.evidence?.provider ? check.evidence : null;
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
                <td className="quality-method">
                  {reported
                    ? t('{tool} · rapport de l’hôte', '{tool} · host report', {
                        tool: `${reported.tool}${reported.toolVersion ? ` ${reported.toolVersion}` : ''}`,
                      })
                    : check.tool}
                </td>
                <td>
                  <span
                    className={`quality-status quality-status-${check.freshness === 'current' ? status : 'blocked'}`}
                  >
                    {statusLabels(locale)[status]}
                  </span>
                  {check.freshness !== 'current' ? (
                    <small className="quality-freshness">
                      {freshnessLabels(locale)[check.freshness]}
                    </small>
                  ) : null}
                </td>
                <td className="quality-numeric">
                  {durationLabel(check.evidence?.durationMs, locale)}
                </td>
                <td className="quality-numeric">{dateLabel(check.evidence?.finishedAt, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!checks.length ? (
        <p className="quality-empty">
          {t('Aucun contrôle ne correspond à ces filtres.', 'No check matches these filters.')}
        </p>
      ) : null}
    </div>
  );
}
