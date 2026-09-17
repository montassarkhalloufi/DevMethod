import { ConnectorGuide } from '../../connectors';
import type { ProjectGuides } from '../hooks/useProjectGuides';
import type { McpConnectionsController } from '../hooks/useMcpConnections';
import { guidedMcpInput } from '../model/guided-mcp';

export function ProjectConnectorGuide({
  guide,
  controller,
}: {
  guide: ProjectGuides;
  controller: McpConnectionsController;
}) {
  if (!guide.definition)
    return (
      <section>
        <button type="button" onClick={guide.back}>
          Retour aux outils
        </button>
        <p role={guide.catalog.error ? 'alert' : 'status'}>
          {guide.catalog.error ||
            (guide.catalog.loading ? 'Chargement du guide…' : 'Ce guide est indisponible.')}
        </p>
        <button type="button" disabled={guide.catalog.loading} onClick={guide.catalog.refresh}>
          Réessayer le guide
        </button>
      </section>
    );
  return (
    <>
      <ConnectorGuide
        key={guide.definition.optionId}
        definition={guide.definition}
        draft={guide.input}
        preparation={guide.preparation}
        preparing={guide.preparing}
        error={guide.preparationError}
        onChange={guide.change}
        onPrepare={(input) => void guide.prepare(input)}
        onApply={guide.apply}
        applyLabel="Ajouter à ma demande"
        onBack={guide.back}
      />
      {guide.preparation?.nativeConnection ? (
        <div className="connector-guide-connect">
          <p>
            La préparation décrit votre besoin. La connexion autorise séparément l’accès de
            l’assistant.
          </p>
          <button
            type="button"
            className="primary"
            disabled={Boolean(controller.active)}
            onClick={() => void controller.connect(guidedMcpInput(guide.preparation!))}
          >
            Connecter {guide.definition.title}
          </button>
          {controller.active ? (
            <p role="status">
              Connexion en cours. Terminez l’autorisation dans la fenêtre ouverte.
            </p>
          ) : null}
          {controller.error ? <p role="alert">{controller.error}</p> : null}
          {controller.connections
            .filter(
              (item) =>
                item.url === guide.preparation?.nativeConnection?.url &&
                item.status === 'connected',
            )
            .map((item) => (
              <p role="status" key={item.id}>
                {item.name} connecté · {item.tools.length} outils disponibles
              </p>
            ))}
        </div>
      ) : null}
    </>
  );
}
