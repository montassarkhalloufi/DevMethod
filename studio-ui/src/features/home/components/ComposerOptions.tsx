import { useEffect, useRef } from 'react';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';
import type { ComposerSection } from '../model/composer';
import { composerLimits, stylePresets } from '../model/composer';
import { ComposerReferences } from './ComposerReferences';
import { ComposerTools } from './ComposerTools';

const sections: { id: ComposerSection; label: string }[] = [
  { id: 'references', label: 'Références' },
  { id: 'design', label: 'Design' },
  { id: 'tools', label: 'Outils et services' },
  { id: 'project', label: 'Projet' },
];

export function ComposerOptions({
  open,
  section,
  composer,
  onSection,
  onDismiss,
}: {
  open: boolean;
  section: ComposerSection;
  composer: IdeaComposerController;
  onSection(section: ComposerSection): void;
  onDismiss(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) {
      node.showModal();
      title.current?.focus();
    } else if (!open && node?.open) node.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="composer-options-dialog"
      aria-labelledby="composer-options-title"
      onClose={onDismiss}
    >
      <header className="composer-options-header">
        <div>
          <span className="home-eyebrow">Donnez une direction à votre idée</span>
          <h2 ref={title} tabIndex={-1} id="composer-options-title">
            Préparer mon projet
          </h2>
        </div>
        <button
          type="button"
          className="composer-close"
          aria-label="Fermer les options"
          onClick={onDismiss}
        >
          ×
        </button>
      </header>
      <nav className="composer-options-nav" aria-label="Options du projet">
        {sections.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={section === item.id}
            onClick={() => onSection(item.id)}
            disabled={composer.busy}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="composer-options-body">
        <section
          className="composer-options-pane"
          hidden={section !== 'references'}
          aria-label="Références du projet"
        >
          <ComposerReferences composer={composer} />
        </section>
        <section
          className="composer-options-pane"
          hidden={section !== 'design'}
          aria-label="Direction visuelle"
        >
          <p className="composer-option-intro">
            Indiquez une ambiance, des couleurs ou une manière de présenter le contenu.
          </p>
          <div className="composer-style-grid">
            {stylePresets.map((style, index) => {
              const value = `${style.title}. ${style.description}`;
              return (
                <button
                  className={`composer-style composer-style-${index}`}
                  type="button"
                  key={style.title}
                  aria-pressed={composer.draft.design === value}
                  onClick={() => composer.setField('design', value)}
                  disabled={composer.busy}
                >
                  <span className="composer-style-swatch" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>{style.title}</strong>
                  <small>{style.description}</small>
                </button>
              );
            })}
          </div>
          <label className="composer-field" htmlFor="composer-design">
            Votre direction visuelle
          </label>
          <textarea
            id="composer-design"
            name="design"
            autoComplete="off"
            rows={3}
            maxLength={composerLimits.design}
            value={composer.draft.design}
            onChange={(event) => composer.setField('design', event.target.value)}
            placeholder="Par exemple, une interface lumineuse et éditoriale, avec des accents verts…"
            disabled={composer.busy}
          />
          <p className="composer-option-note">
            Ces pistes donnent une intention de style. Aucun kit de design n’est installé.
          </p>
        </section>
        <section
          className="composer-options-pane"
          hidden={section !== 'tools'}
          aria-label="Outils proposés"
        >
          <ComposerTools composer={composer} />
        </section>
        <section
          className="composer-options-pane"
          hidden={section !== 'project'}
          aria-label="Nom du projet"
        >
          <p className="composer-option-intro">
            Vous pourrez faire évoluer ces informations dans le projet.
          </p>
          <label className="composer-field" htmlFor="composer-project-name">
            Nom du projet <span>· facultatif</span>
          </label>
          <input
            id="composer-project-name"
            name="project-name"
            autoComplete="off"
            maxLength={200}
            value={composer.draft.name}
            onChange={(event) => composer.setField('name', event.target.value)}
            placeholder="Donnez un nom à votre idée…"
            disabled={composer.busy}
          />
          <p className="composer-option-note">
            Vous pouvez laisser ce champ vide pour commencer avec un nom par défaut.
          </p>
        </section>
        {composer.error ? (
          <p role="alert" className="composer-error">
            {composer.error}
          </p>
        ) : null}
      </div>
      <footer className="composer-options-footer">
        <span>{composer.reading ? 'Lecture des fichiers…' : 'Vos choix restent modifiables.'}</span>
        <button type="button" className="primary" onClick={onDismiss}>
          Terminé
        </button>
      </footer>
    </dialog>
  );
}
