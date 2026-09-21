import { useI18n } from '../../../i18n';
import { useRef, useState } from 'react';
import type { HomeOperation } from '../model/contracts';
import type { ComposerSection } from '../model/composer';
import { composerActionLabel, composerLimits, projectTypes } from '../model/composer';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';
import { ComposerOptions } from './ComposerOptions';
import { ComposerPreferences } from './ComposerPreferences';
import { McpPromptSelection } from '../../mcp';
import { useComposerPlaceholder } from '../hooks/useComposerPlaceholder';

export interface IdeaComposerProps {
  operation: HomeOperation;
  composer: IdeaComposerController;
}

export function IdeaComposer(props: IdeaComposerProps) {
  const { locale, t } = useI18n();
  const { composer } = props;
  const [writing, setWriting] = useState(false);
  const placeholder = useComposerPlaceholder(!writing && !composer.draft.idea && !composer.busy);
  const [options, setOptions] = useState<{ open: boolean; section: ComposerSection }>({
    open: false,
    section: 'references',
  });
  const trigger = useRef<HTMLButtonElement | null>(null);
  function section(value: ComposerSection) {
    setOptions({ open: true, section: value });
    if (value === 'tools') composer.guides.load();
    if (value === 'tools' && !composer.catalog && !composer.catalogLoading)
      void composer.loadCatalog();
  }
  function show(value: ComposerSection, button: HTMLButtonElement) {
    trigger.current = button;
    section(value);
  }
  function dismiss() {
    setOptions((current) => ({ ...current, open: false }));
    trigger.current?.focus();
  }
  const label = composerActionLabel(props.operation, composer.reading, locale);
  return (
    <div className="idea-composer-wrap">
      <form
        className="idea-composer"
        onSubmit={(event) => {
          event.preventDefault();
          composer.submit();
        }}
      >
        <label className="home-sr" htmlFor="composer-idea">
          {' '}
          {t('Décrivez votre idée', 'Describe your idea')}{' '}
        </label>
        <textarea
          ref={composer.textarea}
          id="composer-idea"
          name="idea"
          rows={4}
          maxLength={composerLimits.idea}
          value={composer.draft.idea}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={() => setWriting(true)}
          onBlur={() => setWriting(false)}
          onChange={(event) => composer.setField('idea', event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              composer.submit();
            }
          }}
          disabled={composer.busy}
          aria-invalid={Boolean(composer.error) || undefined}
          aria-describedby="composer-help"
        />
        <ComposerPreferences
          composer={composer}
          onConfigureGuide={(optionId, button) => {
            composer.guides.open(optionId);
            show('tools', button);
          }}
        />
        <div className="composer-toolbar">
          <div className="composer-option-actions">
            <button
              type="button"
              className="composer-add"
              disabled={composer.busy}
              aria-label={t('Ajouter des références', 'Add references')}
              title={t('Ajouter des références', 'Add references')}
              onClick={(event) => show('references', event.currentTarget)}
            >
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              disabled={composer.busy}
              onClick={(event) => show('design', event.currentTarget)}
            >
              <span className="composer-style-symbol" aria-hidden="true">
                ◒
              </span>
              Design
            </button>
            <button
              type="button"
              disabled={composer.busy}
              onClick={(event) => show('tools', event.currentTarget)}
            >
              <span className="composer-tools-symbol" aria-hidden="true">
                ⌘
              </span>{' '}
              {t('Outils', 'Tools')}{' '}
            </button>
          </div>
          <div className="composer-submit-actions">
            <label className="composer-mode">
              <span className="home-sr">{t('Première étape', 'First step')}</span>
              <select
                name="launch-action"
                value={composer.draft.action}
                disabled={composer.busy}
                onChange={(event) =>
                  composer.setField('action', event.target.value as 'plan' | 'build')
                }
              >
                <option value="build">{t('Construire', 'Build')}</option>
                <option value="plan">{t('Planifier', 'Plan')}</option>
              </select>
            </label>
            <button type="submit" className="primary composer-start" disabled={composer.busy}>
              {composer.busy ? <span className="home-spinner" aria-hidden="true" /> : null}
              {label}
              <span aria-hidden="true">↑</span>
            </button>
          </div>
        </div>
      </form>
      <McpPromptSelection
        connections={composer.mcp.connections}
        selectedIds={composer.draft.mcpConnectionIds}
        onToggle={composer.toggleMcp}
        onManage={(button) => show('tools', button)}
        disabled={composer.busy}
      />
      {composer.linearAccessWarning ? (
        <p role="alert" className="composer-error">
          {' '}
          {t(
            'Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule.',
            'A Linear connection with standard access is also selected. Remove it to limit this project’s tools to read-only access.',
          )}{' '}
        </p>
      ) : null}
      <div
        className="composer-type-pills"
        role="group"
        aria-label={t('Type de projet', 'Project type')}
      >
        {projectTypes(locale).map((type) => (
          <button
            key={type.id}
            type="button"
            aria-pressed={composer.draft.projectType === type.id}
            disabled={composer.busy}
            onClick={() => composer.selectType(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
      <p className="composer-help" id="composer-help">
        {' '}
        {t(
          'La demande sera transmise à l’agent du projet. Elle attendra sa prise en charge.',
          'The request will be sent to the project’s agent and wait to be picked up.',
        )}{' '}
      </p>
      {props.operation.project ? (
        <p className="composer-saved" role="status">
          {t('« {name} » est enregistré.', '“{name}” is saved.', {
            name: props.operation.project.name,
          })}{' '}
          {props.operation.error
            ? t(
                'Réessayez son ouverture ; votre projet est conservé.',
                'Try opening it again; your project is saved.',
              )
            : t('Ouverture du Studio…', 'Opening Studio…')}
        </p>
      ) : null}
      {composer.error || props.operation.error ? (
        <p role="alert" className="composer-error">
          {composer.error || props.operation.error}
        </p>
      ) : null}
      <p role="status" className="home-sr">
        {composer.busy ? label : ''}
      </p>
      <ComposerOptions {...options} composer={composer} onSection={section} onDismiss={dismiss} />
    </div>
  );
}
