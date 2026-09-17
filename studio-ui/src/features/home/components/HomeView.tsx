import { useRef, useState } from 'react';
import type { HomeOptions, ProjectKind } from '../model/contracts';
import { useHome } from '../hooks/useHome';
import { HomeIcon } from './HomeIcon';
import { ProjectDialog } from './ProjectDialog';
import { RecentProjects } from './RecentProjects';

const actions: { kind: ProjectKind; title: string; description: string }[] = [
  {
    kind: 'new',
    title: 'Créer un projet',
    description: 'Donnez forme à une idée, du premier choix à la réalisation.',
  },
  {
    kind: 'imported',
    title: 'Importer un projet',
    description: 'Partez de vos sources et construisez la suite avec leur contexte.',
  },
  {
    kind: 'existing',
    title: 'Reprendre un projet',
    description: 'Retrouvez votre espace de travail et poursuivez là où vous en étiez.',
  },
];

export function HomeView(options: HomeOptions) {
  const home = useHome(options);
  const [dialog, setDialog] = useState<{ open: boolean; kind: ProjectKind }>({
    open: false,
    kind: 'new',
  });
  const trigger = useRef<HTMLButtonElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const busy = home.operation.phase !== 'idle';
  function show(kind: ProjectKind, origin: HTMLButtonElement) {
    if (busy) return;
    trigger.current = origin;
    home.clearOperation();
    setDialog({ open: true, kind });
  }
  function dismiss() {
    if (busy) return;
    setDialog((current) => ({ ...current, open: false }));
    trigger.current?.focus();
  }
  return (
    <div className="home-shell">
      <a className="home-skip" href="#home-main">
        Aller aux projets
      </a>
      <header className="home-header">
        <a className="home-brand" href="/" aria-label="DevMethod, accueil">
          <span className="home-mark" aria-hidden="true">
            D<span>·</span>
          </span>
          <span>
            DevMethod <small>Studio</small>
          </span>
        </a>
        <span className="home-local">
          <span aria-hidden="true" />
          Votre espace local
        </span>
      </header>
      <main id="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <span className="home-eyebrow">Une idée, un projet, une prochaine étape</span>
          <h1 id="home-title">
            Quel projet allons-nous
            <br className="home-title-break" /> faire avancer ?
          </h1>
          <p>
            Commencez avec une idée ou avec ce qui existe déjà.
            <br className="home-title-break" /> Gardez le fil, les choix et les preuves au même
            endroit.
          </p>
          <div className="home-entry-grid">
            {actions.map((action) => (
              <button
                type="button"
                className={`home-entry home-entry-${action.kind}`}
                key={action.kind}
                disabled={busy}
                onClick={(event) => {
                  if (action.kind === 'existing' && home.projects.length && search.current) {
                    search.current.scrollIntoView?.({ block: 'center' });
                    search.current.focus();
                  } else show(action.kind, event.currentTarget);
                }}
              >
                <span className="home-entry-icon">
                  <HomeIcon kind={action.kind} />
                </span>
                <strong>{action.title}</strong>
                <span className="home-entry-description">{action.description}</span>
                <span className="home-entry-link">
                  {action.kind === 'new'
                    ? 'Partir de mon idée'
                    : action.kind === 'imported'
                      ? 'Choisir mes sources'
                      : 'Retrouver mon projet'}{' '}
                  <span aria-hidden="true">→</span>
                </span>
              </button>
            ))}
          </div>
        </section>
        {!dialog.open && home.operation.error ? (
          <p role="alert" className="home-error">
            {home.operation.error} Réessayez l’ouverture depuis la liste.
          </p>
        ) : null}
        {!dialog.open && busy ? (
          <p role="status" className="home-opening">
            Ouverture de « {home.operation.project?.name} »…
          </p>
        ) : null}
        <RecentProjects
          projects={home.projects}
          loading={home.loading}
          error={home.loadError}
          busy={busy}
          searchRef={search}
          onRefresh={() => void home.refresh()}
          onOpen={(project) => void home.run(project)}
          onOther={(origin) => show('existing', origin)}
        />
      </main>
      <footer className="home-footer">
        Vos projets restent sur cet ordinateur. Vous choisissez quand lancer un agent.
      </footer>
      <ProjectDialog
        {...dialog}
        operation={home.operation}
        onDismiss={dismiss}
        onSubmit={(input) => void home.run(input)}
        onEdit={home.clearOperation}
      />
    </div>
  );
}
