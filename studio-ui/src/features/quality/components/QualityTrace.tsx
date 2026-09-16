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
  const [flowId, setFlowId] = useState('');
  const model = report.flowModel,
    flow = model?.flows.find((item) => item.id === flowId) ?? model?.flows[0];
  if (!flow || !model)
    return (
      <p className="quality-empty">
        Aucun parcours de code associé à cette version. Aucune trace applicative n’a été enregistrée
        par ces contrôles.
      </p>
    );
  return (
    <>
      <label className="quality-select-label">
        Parcours déduit du code
        <select value={flow.id} onChange={(event) => setFlowId(event.target.value)}>
          {model.flows.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <p className="quality-note">
        Lecture statique de la version {shortRevision(report.revisionId)}. Ce parcours n’est pas une
        trace d’exécution, ni nécessairement la cause du résultat sélectionné.
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
                  Voir la source ↗
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {flow.limits.length ? (
        <details>
          <summary>Limites de cette déduction</summary>
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
  const events = check.evidence?.events ?? [];
  const sameRevision = !check.evidence || check.evidence.revisionId === report.revisionId;
  return (
    <section className="quality-trace" aria-labelledby="quality-trace-heading">
      <h3 id="quality-trace-heading">
        {events.length ? 'Journal du contrôle' : 'Parcours du projet'}
      </h3>
      {events.length ? (
        <>
          <p className="quality-note">
            Événements réellement enregistrés par l’analyseur. Aucune exécution métier n’est
            déduite.
          </p>
          <ol className="quality-run-events">
            {events.map((event, index) => (
              <li key={`${event.at}:${index}`}>
                <time dateTime={event.at}>{dateLabel(event.at)}</time>
                <span>{event.label}</span>
              </li>
            ))}
          </ol>
          <details className="quality-code-flow">
            <summary>Consulter aussi les parcours déduits du code</summary>
            {sameRevision ? (
              <CodeFlow report={report} onOpenSource={onOpenSource} />
            ) : (
              <p>
                Cette preuve appartient à une autre version. Sélectionnez sa version dans
                l’historique pour consulter ses parcours.
              </p>
            )}
          </details>
        </>
      ) : sameRevision ? (
        <CodeFlow report={report} onOpenSource={onOpenSource} />
      ) : (
        <p>
          Cette preuve appartient à une autre version. Les parcours de la version affichée ne lui
          sont pas attribués.
        </p>
      )}
    </section>
  );
}
