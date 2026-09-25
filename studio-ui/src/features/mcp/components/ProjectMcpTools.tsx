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
          Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter
          les outils du projet à la lecture seule.
        </p>
      ) : null}
      {guides.selected.length ? (
        <div className="connector-guide-chips" aria-label="Services préparés pour la demande">
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
                · Préparé
              </button>
              <button
                type="button"
                aria-label={'Retirer la préparation ' + item.optionId}
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
          Des réponses ont changé. Vérifiez la préparation puis ajoutez-la à la demande, ou retirez
          sa pastille.
        </p>
      ) : null}
      {guides.error ? <p role="alert">{guides.error}</p> : null}
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
          Enregistrement des outils du projet…
        </p>
      ) : null}
      {selection.error ? (
        <div>
          <p className="mcp-connection-error" role="alert">
            {selection.error}
          </p>
          <button
            type="button"
            disabled={selection.loading || selection.saving}
            onClick={selection.refresh}
          >
            Réessayer la sélection
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
            Outils du projet
          </h2>
          <button type="button" aria-label="Fermer les outils MCP" onClick={close}>
            ×
          </button>
        </header>
        {!selection.supported && !selection.loading ? (
          <p className="mcp-note">
            Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace.
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
          La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur
          retire aussi son accès à une mission en cours.
        </p>
        <footer>
          <button type="button" className="primary" onClick={close}>
            Terminé
          </button>
        </footer>
      </dialog>
    </div>
  );
}
