import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../../connectors/model/i18n';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import { useMcpConnections } from '../hooks/useMcpConnections';
import { useMcpSelection } from '../hooks/useMcpSelection';
import { McpConnectionsPanel } from './McpConnectionsPanel';
import { McpPromptSelection } from './McpPromptSelection';
import { ProjectConnectorGuide } from './ProjectConnectorGuide';
import { useProjectGuides } from '../hooks/useProjectGuides';
import type { GuideInput } from '../../connectors';

export interface McpProjectHandle {
  prepareRequest(): Promise<boolean>;
  addGuides(values: GuideInput[]): boolean;
  restoreGuides(values: GuideInput[]): void;
  requestGuides(): GuideInput[];
  clearGuides(sent: GuideInput[]): void;
}
export function ProjectMcpTools({
  apiRef,
  onGuidesChange,
}: {
  apiRef: Ref<McpProjectHandle>;
  onGuidesChange?(values: GuideInput[]): void;
}) {
  const { locale } = useI18n();
  const selection = useMcpSelection();
  const guides = useProjectGuides(onGuidesChange);
  const controller = useMcpConnections(
    (id) => {
      void selection.select(id, true);
    },
    (id) => {
      void selection.select(id, false);
    },
  );
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useImperativeHandle(apiRef, () => ({
    prepareRequest: async () => (await selection.prepareRequest()) && guides.ready(),
    addGuides: guides.add,
    requestGuides: guides.requestGuides,
    clearGuides: guides.clear,
    restoreGuides: guides.restore,
  }));
  useEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) {
      node.showModal();
      heading.current?.focus();
    } else if (!open && node?.open) node.close();
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  const toggle = (id: string) => {
    void selection.select(id, !selection.connectionIds.includes(id));
  };
  return (
    <div className="project-mcp-tools">
      {guides.selected.some((item) => item.flowId === 'linear-read') &&
      controller.connections.some(
        (item) =>
          item.provider === 'linear' &&
          item.url !== 'https://mcp.linear.app/mcp/readonly' &&
          selection.connectionIds.includes(item.id),
      ) ? (
        <p role="alert">
          {connectorText(
            'Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule.',
            locale,
          )}
        </p>
      ) : null}
      {guides.selected.length ? (
        <div
          className="connector-guide-chips"
          aria-label={connectorText('Services préparés pour la demande', locale)}
        >
          {guides.selected.map((item) => (
            <span key={item.optionId}>
              <button
                type="button"
                onClick={(event) => {
                  trigger.current = event.currentTarget;
                  guides.open(item.optionId);
                  setOpen(true);
                }}
              >
                {guides.catalog.guides.find((definition) => definition.optionId === item.optionId)
                  ?.title ?? item.optionId}{' '}
                {connectorText('· Préparé', locale)}
              </button>
              <button
                type="button"
                aria-label={connectorMessage(
                  'Retirer la préparation {name}',
                  'Remove preparation {name}',
                  locale,
                  { name: item.optionId },
                )}
                onClick={() => guides.remove(item.optionId)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {guides.pending ? (
        <p role="alert">
          {connectorText(
            'Des réponses ont changé. Vérifiez la préparation puis ajoutez-la à la demande, ou retirez sa pastille.',
            locale,
          )}
        </p>
      ) : null}
      {guides.error ? <p role="alert">{connectorText(guides.error, locale)}</p> : null}
      <McpPromptSelection
        connections={controller.connections}
        selectedIds={selection.connectionIds}
        onToggle={toggle}
        disabled={selection.loading || selection.saving}
        onManage={(button) => {
          trigger.current = button;
          setOpen(true);
        }}
      />
      {selection.saving ? (
        <p className="mcp-note" role="status">
          {connectorText('Enregistrement des outils du projet…', locale)}
        </p>
      ) : null}
      {selection.error ? (
        <div>
          <p className="mcp-connection-error" role="alert">
            {connectorText(selection.error, locale)}
          </p>
          <button
            type="button"
            disabled={selection.loading || selection.saving}
            onClick={selection.refresh}
          >
            {connectorText('Réessayer la sélection', locale)}
          </button>
        </div>
      ) : null}
      <dialog
        ref={dialog}
        className="mcp-settings-dialog"
        aria-labelledby="project-mcp-title"
        onClose={close}
      >
        <header>
          <h2 id="project-mcp-title" ref={heading} tabIndex={-1}>
            {connectorText('Outils du projet', locale)}
          </h2>
          <button
            type="button"
            aria-label={connectorText('Fermer les outils MCP', locale)}
            onClick={close}
          >
            ×
          </button>
        </header>
        {!selection.supported && !selection.loading ? (
          <p className="mcp-note">
            {connectorText(
              'Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace.',
              locale,
            )}
          </p>
        ) : null}
        {guides.activeId ? (
          <ProjectConnectorGuide guide={guides} controller={controller} />
        ) : (
          <McpConnectionsPanel
            controller={controller}
            onConfigureGuide={guides.open}
            selectedIds={selection.connectionIds}
            onToggle={toggle}
            disabled={!selection.supported || selection.loading || selection.saving}
          />
        )}
        <p className="mcp-note">
          {connectorText(
            'La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur retire aussi son accès à une mission en cours.',
            locale,
          )}
        </p>
        <footer>
          <button type="button" className="primary" onClick={close}>
            {connectorText('Terminé', locale)}
          </button>
        </footer>
      </dialog>
    </div>
  );
}
