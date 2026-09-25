import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ConnectorWidgetOptions } from '../model/contracts';
import { preferredConnector } from '../model/catalog';
import { useConnectors } from '../hooks/useConnectors';
import { ConnectionDetail } from './ConnectionDetail';
import { ConnectorCatalog } from './ConnectorCatalog';
import { useConnectorDrafts } from '../hooks/useConnectorDrafts';
import { useProjectGuide } from '../hooks/useProjectGuide';
import { ProjectConnectorGuide } from './ProjectConnectorGuide';

export function ConnectorsView(options: ConnectorWidgetOptions) {
  const { report, error, busy, action, refresh } = useConnectors(options.revisionId);
  const drafts = useConnectorDrafts(options.checkId);
  const [navigation, setNavigation] = useState<{
    detail: string | null | undefined;
    lastSelected: string | null;
  }>({ detail: options.checkId ? undefined : null, lastSelected: null });
  const catalog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const restoringFocus = useRef(false);
  const focusDetail = useCallback((node: HTMLButtonElement | null) => node?.focus(), []);
  const active =
    report &&
    (navigation.detail === undefined
      ? preferredConnector(report.catalog.options, report.connections, options.checkId)
      : report.catalog.options.find((item) => item.id === navigation.detail));
  const connection = report?.connections.find((item) => item.optionId === active?.id);
  const activeId = active?.id;
  const draft = active ? drafts.get(active, connection) : null;
  const guide = useProjectGuide(activeId, draft?.guide);
  useLayoutEffect(() => {
    if (!activeId && restoringFocus.current) {
      restoringFocus.current = false;
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : catalog.current?.querySelector<HTMLInputElement>('input[type="search"]');
      target?.focus();
    }
  }, [activeId]);
  function backToCatalog() {
    guide.request.reset();
    restoringFocus.current = true;
    setNavigation({ detail: null, lastSelected: active?.id || navigation.lastSelected });
  }
  return (
    <div className="connectors-view">
      <div className="connector-toolbar">
        <p className="connector-intro">
          Trouvez les services de votre application et les outils pour la vérifier. Configuration et
          disponibilité restent distinctes.
        </p>
        <button type="button" className="connector-refresh" onClick={refresh} disabled={busy}>
          Actualiser les états
        </button>
      </div>
      {error ? (
        <p role="alert" className="connector-error">
          {error}
        </p>
      ) : null}
      {!report ? (
        <p role="status">{error ? 'Aucun état de connexion confirmé.' : 'Lecture du catalogue…'}</p>
      ) : null}
      <div ref={catalog} hidden={Boolean(active)}>
        <ConnectorCatalog
          report={report}
          contextual={Boolean(options.checkId)}
          selectedId={active?.id || navigation.lastSelected}
          onOpen={(id, trigger) => {
            returnFocus.current = trigger;
            setNavigation({ detail: id, lastSelected: id });
          }}
        />
      </div>
      {active && draft ? (
        <div className="connector-detail-page">
          <button
            type="button"
            className="connector-back"
            ref={focusDetail}
            onClick={backToCatalog}
          >
            ← Retour au catalogue
          </button>
          <ConnectionDetail
            key={active.id}
            {...options}
            option={active}
            connection={connection}
            busy={busy}
            action={action}
            refresh={refresh}
            draft={draft}
            onDraft={(patch) => drafts.update(active.id, draft, patch)}
            onSaved={(submitted, version) => drafts.saved(active.id, submitted, version)}
            guideReady={guide.ready}
            guidePanel={
              <ProjectConnectorGuide
                controller={guide}
                persistence={drafts.persistence}
                input={draft.guide}
                busy={busy}
                onChange={(input) => drafts.update(active.id, draft, { guide: input })}
              />
            }
          />
        </div>
      ) : null}
      {report ? (
        <details className="connector-report-limits">
          <summary>Ce que DevMethod prend en charge</summary>
          <ul>
            {report.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
