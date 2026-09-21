import { useI18n } from '../../../i18n';
import { useState } from 'react';
import type { QualityCheck, QualityOptions, QualityReport } from '../model/contracts';
import { dateLabel, shortRevision } from '../model/selectors';

function CodeFlow({
  report,
  onOpenSource,
}: {
  report: QualityReport;
  onOpenSource: QualityOptions['onOpenSource'];
}) {
  const { t } = useI18n();
  const [flowId, setFlowId] = useState('');
  const model = report.flowModel,
    flow = model?.flows.find((item) => item.id === flowId) ?? model?.flows[0];
  if (!flow || !model)
    return (
      <p className="quality-empty">
        {t(
          'Aucun parcours de code associé à cette version. Aucune trace applicative n’a été enregistrée par ces contrôles.',
          'No code flow associated with this version. No application trace was recorded by these checks.',
        )}
      </p>
    );
  return (
    <>
      <label className="quality-select-label">
        {t('Parcours déduit du code', 'Flow inferred from code')}
        <select value={flow.id} onChange={(event) => setFlowId(event.target.value)}>
          {model.flows.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <p className="quality-note">
        {t('Lecture statique de la version', 'Static reading of version')}{' '}
        {shortRevision(report.revisionId)}
        {t(
          '. Ce parcours n’est pas une trace d’exécution, ni nécessairement la cause du résultat sélectionné.',
          '. This flow is not an execution trace or necessarily the cause of the selected result.',
        )}
      </p>
      <ol className="quality-flow">
        {flow.elementIds.map((id) => {
          const element = model.elements.find((item) => item.id === id);
          const source = element?.sources[0];
          return (
            <li key={id}>
              <span className="quality-flow-node">{element?.label ?? id}</span>
              {source ? (
                <button
                  type="button"
                  onClick={() => onOpenSource(source.path, source.line, report.revisionId)}
                >
                  {t('Voir la source ↗', 'View source ↗')}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {flow.limits.length ? (
        <details>
          <summary>{t('Limites de cette déduction', 'Limitations of this inference')}</summary>
          <ul>
            {flow.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

export function QualityTrace({
  check,
  report,
  onOpenSource,
}: {
  check: QualityCheck;
  report: QualityReport;
  onOpenSource: QualityOptions['onOpenSource'];
}) {
  const { t, locale } = useI18n();
  const events = check.evidence?.events ?? [];
  const sameRevision = !check.evidence || check.evidence.revisionId === report.revisionId;
  return (
    <section className="quality-trace" aria-labelledby="quality-trace-heading">
      <h3 id="quality-trace-heading">
        {events.length
          ? t('Journal du contrôle', 'Check log')
          : t('Parcours du projet', 'Project flow')}
      </h3>
      {events.length ? (
        <>
          <p className="quality-note">
            {check.evidence?.provider
              ? t(
                  'Événements du rapport transmis par l’agent hôte. La réception du rapport ne constitue pas une vérification indépendante de son contenu.',
                  'Report events supplied by the host agent. Receiving the report is not independent verification of its contents.',
                )
              : t(
                  'Événements réellement enregistrés par l’analyseur. Aucune exécution métier n’est déduite.',
                  'Events actually recorded by the analyzer. No business execution is inferred.',
                )}
          </p>
          <ol className="quality-run-events">
            {events.map((event, index) => (
              <li key={`${event.at}:${index}`}>
                <time dateTime={event.at}>{dateLabel(event.at, locale)}</time>
                <span>{event.label}</span>
              </li>
            ))}
          </ol>
          <details className="quality-code-flow">
            <summary>
              {t(
                'Consulter aussi les parcours déduits du code',
                'Also inspect flows inferred from code',
              )}
            </summary>
            {sameRevision ? (
              <CodeFlow report={report} onOpenSource={onOpenSource} />
            ) : (
              <p>
                {t(
                  'Cette preuve appartient à une autre version. Sélectionnez sa version dans l’historique pour consulter ses parcours.',
                  'This evidence belongs to another version. Select its version in history to inspect its flows.',
                )}
              </p>
            )}
          </details>
        </>
      ) : sameRevision ? (
        <CodeFlow report={report} onOpenSource={onOpenSource} />
      ) : (
        <p>
          {t(
            'Cette preuve appartient à une autre version. Les parcours de la version affichée ne lui sont pas attribués.',
            'This evidence belongs to another version. Flows from the displayed version are not attributed to it.',
          )}
        </p>
      )}
    </section>
  );
}
