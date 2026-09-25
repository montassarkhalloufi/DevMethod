import type { ReactNode } from 'react';
import { ConnectorGuide } from '../connectors';
import { useInteractions } from './useInteractions';
import { useInteractionAnswer } from './useInteractionAnswer';
import type { ConnectorInteraction } from './model';
import type { GuidePreparation } from '../connectors';

type RenderConnection = (preparation: GuidePreparation) => ReactNode;
function InteractionEvidence({
  item,
  renderConnection,
}: {
  item: ConnectorInteraction;
  renderConnection?: RenderConnection;
}) {
  return (
    <>
      {item.accessObservation.status === 'verified' ? (
        <p>
          Connexion MCP observée · {item.accessObservation.tools} outils découverts. Les prérequis
          ci-dessous restent à vérifier.
        </p>
      ) : null}
      {item.prerequisites.length ? (
        <ul aria-label="Prérequis à configurer">
          {item.prerequisites.map((entry) => (
            <li key={entry.label}>À configurer : {entry.label}</li>
          ))}
        </ul>
      ) : null}
      {item.preparation?.nativeConnection && renderConnection
        ? renderConnection(item.preparation)
        : null}
    </>
  );
}
const statusLabel = {
  answered: 'Réponses transmises à l’agent',
  cancelled: 'Questionnaire annulé : la mission ou son contexte a changé.',
  pending: 'L’agent attend vos choix pour ce service.',
};
function InteractionCard({
  item,
  onSaved,
  renderConnection,
}: {
  item: ConnectorInteraction;
  onSaved(item: ConnectorInteraction): void;
  renderConnection?: RenderConnection;
}) {
  const form = useInteractionAnswer(item, onSaved);
  const definition = item.requestedFlowId
    ? {
        ...item.definition,
        flows: item.definition.flows.filter((flow) => flow.id === item.requestedFlowId),
      }
    : item.definition;
  const terminal = item.status !== 'pending';
  const questionnaire = (
    <ConnectorGuide
      definition={definition}
      draft={form.local.input}
      preparation={item.preparation ?? form.validation.preparation}
      step={terminal ? item.step : form.local.step}
      onStepChange={form.setStep}
      preparing={form.validation.loading}
      disabled={terminal || form.saving}
      error={form.validation.error}
      onChange={form.change}
      onPrepare={form.validation.prepare}
      onApply={terminal ? undefined : (value) => void form.answer(value)}
      applyLabel="Transmettre mes réponses à l’agent"
    />
  );
  return (
    <article
      aria-label={'Questionnaire ' + item.definition.title}
      className="connector-interaction"
    >
      <p role="status">{statusLabel[item.status]}</p>
      {item.status === 'answered' ? (
        <details className="connector-interaction-summary" open>
          <summary>Revoir les réponses · {item.definition.title}</summary>
          {questionnaire}
        </details>
      ) : (
        questionnaire
      )}
      {form.saving ? <p role="status">Enregistrement des réponses…</p> : null}
      {form.error ? (
        <p role="alert">
          {form.error}{' '}
          {!terminal ? (
            <button type="button" onClick={form.retry}>
              Réessayer l’enregistrement
            </button>
          ) : null}
        </p>
      ) : null}
      <InteractionEvidence item={item} renderConnection={renderConnection} />
    </article>
  );
}
function MissionInteractions({
  jobId,
  renderConnection,
}: {
  jobId: string;
  renderConnection?: RenderConnection;
}) {
  const state = useInteractions(jobId);
  return (
    <section aria-label="Questions de la mission">
      {state.error ? (
        <p role="alert">
          {state.error}{' '}
          <button type="button" onClick={state.refresh}>
            Relire les questionnaires
          </button>
        </p>
      ) : null}
      {state.items.map((item) => (
        <InteractionCard
          key={item.id}
          item={item}
          onSaved={state.replace}
          renderConnection={renderConnection}
        />
      ))}
    </section>
  );
}
export function ConnectorInteractions({
  jobId,
  renderConnection,
}: {
  jobId: string | null;
  renderConnection?: RenderConnection;
}) {
  return jobId ? (
    <MissionInteractions key={jobId} jobId={jobId} renderConnection={renderConnection} />
  ) : null;
}
