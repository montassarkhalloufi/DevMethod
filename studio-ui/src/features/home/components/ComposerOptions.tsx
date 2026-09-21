import { useI18n, translate, type StudioLocale } from '../../../i18n';
import { useEffect, useRef } from 'react';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';
import type { ComposerSection } from '../model/composer';
import { composerLimits, stylePresets } from '../model/composer';
import { ComposerReferences } from './ComposerReferences';
import { ComposerTools } from './ComposerTools';

function sections(locale: StudioLocale = 'en'): { id: ComposerSection; label: string }[] {
  return [
    { id: 'references', label: translate('Références', 'References', undefined, locale) },
    { id: 'design', label: 'Design' },
    {
      id: 'tools',
      label: translate('Outils et services', 'Tools and services', undefined, locale),
    },
    { id: 'project', label: translate('Projet', 'Project', undefined, locale) },
  ];
}

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
  const { locale, t } = useI18n();
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
          <span className="home-eyebrow">
            {t('Donnez une direction à votre idée', 'Give your idea a direction')}
          </span>
          <h2 ref={title} tabIndex={-1} id="composer-options-title">
            {' '}
            {t('Préparer mon projet', 'Prepare my project')}{' '}
          </h2>
        </div>
        <button
          type="button"
          className="composer-close"
          aria-label={t('Fermer les options', 'Close options')}
          onClick={onDismiss}
        >
          ×
        </button>
      </header>
      <nav className="composer-options-nav" aria-label={t('Options du projet', 'Project options')}>
        {sections(locale).map((item) => (
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
          aria-label={t('Références du projet', 'Project references')}
        >
          <ComposerReferences composer={composer} />
        </section>
        <section
          className="composer-options-pane"
          hidden={section !== 'design'}
          aria-label={t('Direction visuelle', 'Visual direction')}
        >
          <p className="composer-option-intro">
            {' '}
            {t(
              'Indiquez une ambiance, des couleurs ou une manière de présenter le contenu.',
              'Describe a mood, colors, or a way to present the content.',
            )}{' '}
          </p>
          <div className="composer-style-grid">
            {stylePresets(locale).map((style, index) => {
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
            {' '}
            {t('Votre direction visuelle', 'Your visual direction')}{' '}
          </label>
          <textarea
            id="composer-design"
            name="design"
            autoComplete="off"
            rows={3}
            maxLength={composerLimits.design}
            value={composer.draft.design}
            onChange={(event) => composer.setField('design', event.target.value)}
            placeholder={t(
              'Par exemple, une interface lumineuse et éditoriale, avec des accents verts…',
              'For example, a bright editorial interface with green accents…',
            )}
            disabled={composer.busy}
          />
          <p className="composer-option-note">
            {' '}
            {t(
              'Ces pistes donnent une intention de style. Aucun kit de design n’est installé.',
              'These ideas describe a style. No design kit is installed.',
            )}{' '}
          </p>
        </section>
        <section
          className="composer-options-pane"
          hidden={section !== 'tools'}
          aria-label={t('Outils proposés', 'Suggested tools')}
        >
          <ComposerTools composer={composer} />
        </section>
        <section
          className="composer-options-pane"
          hidden={section !== 'project'}
          aria-label={t('Nom du projet', 'Project name')}
        >
          <p className="composer-option-intro">
            {' '}
            {t(
              'Vous pourrez faire évoluer ces informations dans le projet.',
              'You can update this information as the project develops.',
            )}{' '}
          </p>
          <label className="composer-field" htmlFor="composer-project-name">
            {' '}
            {t('Nom du projet', 'Project name')} <span>{t('· facultatif', '· optional')}</span>
          </label>
          <input
            id="composer-project-name"
            name="project-name"
            autoComplete="off"
            maxLength={200}
            value={composer.draft.name}
            onChange={(event) => composer.setField('name', event.target.value)}
            placeholder={t('Donnez un nom à votre idée…', 'Give your idea a name…')}
            disabled={composer.busy}
          />
          <p className="composer-option-note">
            {' '}
            {t(
              'Vous pouvez laisser ce champ vide pour commencer avec un nom par défaut.',
              'Leave this blank to start with a default name.',
            )}{' '}
          </p>
        </section>
        {composer.error ? (
          <p role="alert" className="composer-error">
            {composer.error}
          </p>
        ) : null}
      </div>
      <footer className="composer-options-footer">
        <span>
          {composer.reading
            ? t('Lecture des fichiers…', 'Reading files…')
            : t('Vos choix restent modifiables.', 'You can still change your choices.')}
        </span>
        <button type="button" className="primary" onClick={onDismiss}>
          {' '}
          {t('Terminé', 'Done')}{' '}
        </button>
      </footer>
    </dialog>
  );
}
