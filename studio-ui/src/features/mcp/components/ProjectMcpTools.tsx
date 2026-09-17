import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import { useMcpConnections } from '../hooks/useMcpConnections';
import { useMcpSelection } from '../hooks/useMcpSelection';
import { McpConnectionsPanel } from './McpConnectionsPanel';
import { McpPromptSelection } from './McpPromptSelection';

export interface McpProjectHandle {
  prepareRequest(): Promise<boolean>;
}
export function ProjectMcpTools({ apiRef }: { apiRef: Ref<McpProjectHandle> }) {
  const selection = useMcpSelection();
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
  useImperativeHandle(apiRef, () => ({ prepareRequest: selection.prepareRequest }), [
    selection.prepareRequest,
  ]);
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
        <McpConnectionsPanel
          controller={controller}
          selectedIds={selection.connectionIds}
          onToggle={toggle}
          disabled={!selection.supported || selection.loading || selection.saving}
        />
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
