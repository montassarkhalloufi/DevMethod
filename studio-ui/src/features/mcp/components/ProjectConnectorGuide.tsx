import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../../connectors/model/i18n';
import { ConnectorGuide } from '../../connectors';
import type { ProjectGuides } from '../hooks/useProjectGuides';
import type { McpConnectionsController } from '../hooks/useMcpConnections';
import { guidedMcpInput } from '../model/guided-mcp';
import { McpCredentialForm } from './McpCredentialForm';

export function ProjectConnectorGuide({
  guide,
  controller,
}: {
  guide: ProjectGuides;
  controller: McpConnectionsController;
}) {
  const { locale } = useI18n();
  if (!guide.definition)
    return (
      <section>
        <button type="button" onClick={guide.back}>
          {connectorText('Retour aux outils', locale)}
        </button>
        <p role={guide.catalog.error ? 'alert' : 'status'}>
          {(guide.catalog.error && connectorText(guide.catalog.error, locale)) ||
            (guide.catalog.loading
              ? connectorText('Chargement du guide…', locale)
              : connectorText('Ce guide est indisponible.', locale))}
        </p>
        <button type="button" disabled={guide.catalog.loading} onClick={guide.catalog.refresh}>
          {connectorText('Réessayer le guide', locale)}
        </button>
      </section>
    );
  return (
    <>
      <ConnectorGuide
        key={guide.definition.optionId}
        definition={guide.definition}
        draft={guide.input}
        step={guide.step}
        onStepChange={guide.setStep}
        preparation={guide.preparation}
        preparing={guide.preparing}
        error={guide.preparationError}
        onChange={guide.change}
        onPrepare={(input) => void guide.prepare(input)}
        onApply={guide.apply}
        applyLabel={connectorText('Ajouter à ma demande', locale)}
        onBack={guide.back}
      />
      {guide.persistence.saving ? (
        <p role="status">{connectorText('Enregistrement des réponses…', locale)}</p>
      ) : null}
      {guide.persistence.error ? (
        <p role="alert">
          {connectorText(guide.persistence.error, locale)}{' '}
          <button type="button" onClick={guide.persistence.retry}>
            {connectorText('Réessayer l’enregistrement', locale)}
          </button>
        </p>
      ) : null}
      {guide.preparation?.nativeConnection ? (
        <div className="connector-guide-connect">
          <p>
            {connectorText(
              'La préparation décrit votre besoin. La connexion autorise séparément l’accès de l’assistant.',
              locale,
            )}
          </p>
          {guide.preparation.nativeConnection.providerId === 'github' ? (
            <McpCredentialForm input={guidedMcpInput(guide.preparation)} controller={controller} />
          ) : (
            <button
              type="button"
              className="primary"
              disabled={Boolean(controller.active)}
              onClick={() => void controller.connect(guidedMcpInput(guide.preparation!))}
            >
              {connectorText('Connecter', locale)}
              {guide.definition.title}
            </button>
          )}
          {controller.active ? (
            <p role="status">
              {connectorText(
                'Connexion en cours. Terminez l’autorisation dans la fenêtre ouverte.',
                locale,
              )}
            </p>
          ) : null}
          {controller.error ? <p role="alert">{connectorText(controller.error, locale)}</p> : null}
          {controller.connections
            .filter(
              (item) =>
                item.url === guide.preparation?.nativeConnection?.url &&
                item.status === 'connected',
            )
            .map((item) => (
              <p role="status" key={item.id}>
                {item.name} {connectorText('connecté ·', locale)}
                {connectorMessage('{count} outils disponibles', '{count} tools available', locale, {
                  count: item.tools.length.toLocaleString(locale),
                })}
              </p>
            ))}
        </div>
      ) : null}
    </>
  );
}
