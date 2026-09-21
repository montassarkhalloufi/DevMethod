import { useI18n } from '../../i18n';
import { connectorText, connectorMessage } from '../connectors/model/i18n';
import { useConnectorGuides } from '../connectors/hooks/useConnectorGuides';
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
  const { locale } = useI18n();
  return (
    <>
      {item.accessObservation.status === 'verified' ? (
        <p>
          {connectorText('Connexion MCP observée ·', locale)}
          {item.accessObservation.tools.toLocaleString(locale)}{' '}
          {connectorText('outils découverts. Les prérequis ci-dessous restent à vérifier.', locale)}
        </p>
      ) : null}
      {item.prerequisites.length ? (
        <ul aria-label={connectorText('Prérequis à configurer', locale)}>
          {item.prerequisites.map((entry) => (
            <li key={entry.label}>
              {connectorText('À configurer :', locale)}
              {entry.label}
            </li>
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
  const { locale } = useI18n();
  const form = useInteractionAnswer(item, onSaved);
  const catalog = useConnectorGuides({ enabled: item.status === 'pending' });
  const displayedDefinition =
    item.status === 'pending'
      ? (catalog.guides.find((entry) => entry.optionId === item.optionId) ?? item.definition)
      : item.definition;
  const definition = item.requestedFlowId
    ? {
        ...displayedDefinition,
        flows: displayedDefinition.flows.filter((flow) => flow.id === item.requestedFlowId),
      }
    : displayedDefinition;
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
      error={connectorText(form.validation.error, locale)}
      onChange={form.change}
      onPrepare={form.validation.prepare}
      onApply={terminal ? undefined : (value) => void form.answer(value)}
      applyLabel={connectorText('Transmettre mes réponses à l’agent', locale)}
    />
  );
  return (
    <article
      aria-label={connectorMessage('Questionnaire {name}', 'Questionnaire {name}', locale, {
        name: item.definition.title,
      })}
      className="connector-interaction"
    >
      <p role="status">{connectorText(statusLabel[item.status], locale)}</p>
      {item.status === 'answered' ? (
        <details className="connector-interaction-summary" open>
          <summary>
            {connectorText('Revoir les réponses ·', locale)}
            {item.definition.title}
          </summary>
          {questionnaire}
        </details>
      ) : (
        questionnaire
      )}
      {form.saving ? (
        <p role="status">{connectorText('Enregistrement des réponses…', locale)}</p>
      ) : null}
      {form.error ? (
        <p role="alert">
          {connectorText(form.error, locale)}{' '}
          {!terminal ? (
            <button type="button" onClick={form.retry}>
              {connectorText('Réessayer l’enregistrement', locale)}
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
  const { locale } = useI18n();
  const state = useInteractions(jobId);
  return (
    <section aria-label={connectorText('Questions de la mission', locale)}>
      {state.error ? (
        <p role="alert">
          {connectorText(state.error, locale)}{' '}
          <button type="button" onClick={state.refresh}>
            {connectorText('Relire les questionnaires', locale)}
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
