import { useRef, useState } from 'react';
import type { HomeOptions, HomeProject, ProjectInput, ProjectKind } from '../model/contracts';
import { useHome } from '../hooks/useHome';
import { useIdeaComposer } from '../hooks/useIdeaComposer';
import { HomeIcon } from './HomeIcon';
import { ProjectDialog } from './ProjectDialog';
import { RecentProjects } from './RecentProjects';
import { IdeaComposer } from './IdeaComposer';
import { StarterGallery } from './StarterGallery';
import type { StarterSeed } from '../model/starters';

export function HomeView(options: HomeOptions) {
  const home = useHome(options);
  const [dialog, setDialog] = useState<{ open: boolean; kind: ProjectKind }>({
    open: false,
    kind: 'new',
  });
  const trigger = useRef<HTMLButtonElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const [seed, setSeed] = useState<(StarterSeed & { id: number }) | undefined>();
  const [operationSource, setOperationSource] = useState<'composer' | 'project'>('composer');
  const [departure, setDeparture] = useState<ProjectInput | HomeProject | null>(null);
  const externalRun = useRef(false);
  const composerOperation =
    operationSource === 'composer'
      ? home.operation
      : { phase: home.operation.phase, project: null, error: '' };
  const composer = useIdeaComposer({
    operation: composerOperation,
    onSubmit: (input, onSaved) => {
      setOperationSource('composer');
      void home.run(input, onSaved);
    },
    onEdit: home.clearOperation,
    seed,
  });
  const busy = composer.busy;
  async function openExternal(input: ProjectInput | HomeProject) {
    if (busy || externalRun.current) return;
    externalRun.current = true;
    setDeparture(null);
    composer.approveDeparture();
    setOperationSource('project');
    const navigating = await home.run(input);
    externalRun.current = false;
    if (!navigating) composer.cancelDeparture();
  }
  function requestExternal(input: ProjectInput | HomeProject) {
    if (busy || externalRun.current) return;
    if (composer.hasUnsavedContent) {
      if (!dialog.open) trigger.current = document.activeElement as HTMLButtonElement | null;
      setDeparture(input);
    } else void openExternal(input);
  }
  function cancelDeparture() {
    setDeparture(null);
    if (!dialog.open) trigger.current?.focus();
  }
  function show(kind: ProjectKind, origin: HTMLButtonElement) {
    if (busy) return;
    trigger.current = origin;
    setOperationSource('project');
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
        <nav className="home-nav" aria-label="Accueil">
          <a href="#home-recents-title">Mes projets</a>
          <a href="#home-inspirations">Galerie</a>
          <span className="home-local">
            <span aria-hidden="true" /> Espace local
          </span>
        </nav>
      </header>
      <main id="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <span className="home-eyebrow">L’espace où vos idées prennent forme</span>
          <h1 id="home-title">
            Que voulez-vous <span>créer ?</span>
          </h1>
          <p>
            Un site, une application, une nouvelle façon de travailler.
            <br className="home-title-break" /> Décrivez votre idée et construisons la suite.
          </p>
          <IdeaComposer operation={composerOperation} composer={composer} />
          <div className="home-start-alternatives">
            <span>Ou partez de l’existant</span>
            <button
              type="button"
              disabled={busy}
              onClick={(event) => show('imported', event.currentTarget)}
            >
              <HomeIcon kind="imported" /> Importer un projet
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={(event) => {
                if (home.projects.length && search.current) {
                  search.current.scrollIntoView?.({ block: 'center' });
                  search.current.focus();
                } else show('existing', event.currentTarget);
              }}
            >
              <HomeIcon kind="existing" /> Reprendre un projet
            </button>
          </div>
        </section>
        {!dialog.open && operationSource === 'project' && home.operation.error ? (
          <p role="alert" className="home-error">
            {home.operation.error}
          </p>
        ) : null}
        {!dialog.open && operationSource === 'project' && busy ? (
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
          onOpen={requestExternal}
          onOther={(origin) => show('existing', origin)}
        />
        <div id="home-inspirations">
          <StarterGallery
            onChoose={(chosen) => {
              home.clearOperation();
              setSeed((current) => ({ ...chosen, id: (current?.id ?? 0) + 1 }));
            }}
          />
        </div>
      </main>
      <footer className="home-footer">
        Votre espace de création. Vos projets et leurs références restent sur cet ordinateur.
      </footer>
      <ProjectDialog
        {...dialog}
        open={dialog.open || Boolean(departure)}
        departure={
          departure
            ? { onCancel: cancelDeparture, onConfirm: () => void openExternal(departure) }
            : undefined
        }
        operation={home.operation}
        onDismiss={dismiss}
        onSubmit={requestExternal}
        onEdit={home.clearOperation}
      />
    </div>
  );
}
