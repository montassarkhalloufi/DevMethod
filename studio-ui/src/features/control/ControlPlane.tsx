import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { locationView, modeLabels, views, type ControlOptions, type ControlView } from './model';
import { useControl } from './useControl';
import { Overview } from './Overview';
import { EvidenceGraph } from './EvidenceGraph';
import { Attention } from './Attention';
import { Risks, Autonomy, History } from './Details';
import { Icon } from './Icon';

export function ControlPlane({ options }: { options: ControlOptions }) {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(locationView);
  const [missing, setMissing] = useState(false);
  const [revision, setRevision] = useState<string | null>(null);
  const control = useControl({ ...options, revisionId: revision ?? options.revisionId });
  const { report, error, loading, busy } = control;
  const navigate = (next: ControlView, onlyMissing = false) => {
    setView(next);
    setMissing(onlyMissing);
    root.current?.closest('#workspace')?.scrollTo({ top: 0 });
    if (window.innerWidth <= 700) window.scrollTo({ top: 0 });
    const url = new URL(window.location.href);
    url.searchParams.set('control', next);
    url.hash = 'control';
    window.history.pushState(null, '', url);
  };
  useEffect(() => {
    const pop = () => setView(locationView());
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  return (
    <div className="cp-root" ref={root}>
      <nav className="cp-mobile-nav" aria-label="Vues du Control Plane sur petit écran">
        {views.map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => navigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {createPortal(
        <nav className="cp-sidebar" aria-label="Vues du Control Plane">
          <div className="cp-sidebar-brand">
            <Icon name="graph" />
            <div>
              <h2>Control Plane</h2>
              <p>Unifie méthode, preuves, risque et autonomie.</p>
            </div>
          </div>
          {views.map((item) => (
            <button
              key={item.id}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>
                {item.label}
                {item.id === 'overview' && view === 'overview' && (
                  <small>Surveillez l’état global et prenez la bonne décision.</small>
                )}
              </span>
            </button>
          ))}
        </nav>,
        options.sidebar,
      )}
      {createPortal(
        <div className="cp-mode-tabs" role="group" aria-label="Autonomie demandée">
          {(Object.keys(modeLabels) as (keyof typeof modeLabels)[]).map((mode) => (
            <button
              key={mode}
              aria-pressed={options.mode === mode}
              disabled={Boolean(busy)}
              onClick={() => options.onMode(mode)}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>,
        options.modes,
      )}
      {view !== 'overview' && (
        <div className="cp-section-brand">
          <Icon name="graph" />
          <div>
            <h2>Control Plane</h2>
            <p>Méthode, preuves, risque et autonomie.</p>
          </div>
        </div>
      )}
      {loading && (
        <p className="cp-loading" role="status">
          Chargement des preuves et de la politique…
        </p>
      )}
      {error && (
        <div role="alert" className="cp-error">
          <h2>Le Control Plane n’a pas pu actualiser ses preuves</h2>
          <p>{error}</p>
          {report && (
            <p>
              Les données ci-dessous sont la dernière observation reçue ; leur actualité n’est pas
              confirmée.
            </p>
          )}
          <button onClick={control.refresh}>Réessayer</button>
        </div>
      )}
      {control.progress && (
        <p className="cp-job-status" role="status">
          {control.progress}
        </p>
      )}
      {report && (
        <div aria-busy={Boolean(busy)} className={error ? 'cp-report-outdated' : ''}>
          {view === 'overview' && (
            <Overview
              report={report}
              navigate={navigate}
              run={() => void control.runChecks()}
              busy={Boolean(busy || error)}
            />
          )}
          {view === 'graph' && (
            <EvidenceGraph
              report={report}
              missing={missing}
              onMissing={setMissing}
              onRevision={setRevision}
              open={options.onOpen}
              run={(ids) => void control.runChecks(ids)}
              busy={Boolean(busy || error)}
            />
          )}
          {view === 'attention' && (
            <Attention
              report={report}
              busy={Boolean(busy || error)}
              mutate={control.mutate}
              run={(ids) => void control.runChecks(ids)}
              open={options.onOpen}
            />
          )}
          {view === 'risks' && <Risks report={report} />}
          {view === 'autonomy' && (
            <Autonomy
              report={report}
              busy={Boolean(busy || error)}
              probe={() => void control.mutate('runtime', {})}
              proceed={() =>
                void control.mutate('continue', {
                  version: report.version,
                  snapshotKey: report.snapshot.key,
                })
              }
            />
          )}
          {view === 'history' && <History report={report} />}
        </div>
      )}
    </div>
  );
}
