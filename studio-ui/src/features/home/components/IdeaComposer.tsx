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
  const label = composerActionLabel(props.operation, composer.reading);
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
          Décrivez votre idée
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
        <ComposerPreferences composer={composer} />
        <div className="composer-toolbar">
          <div className="composer-option-actions">
            <button
              type="button"
              className="composer-add"
              disabled={composer.busy}
              aria-label="Ajouter des références"
              title="Ajouter des références"
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
              </span>
              Outils
            </button>
          </div>
          <div className="composer-submit-actions">
            <label className="composer-mode">
              <span className="home-sr">Première étape</span>
              <select
                name="launch-action"
                value={composer.draft.action}
                disabled={composer.busy}
                onChange={(event) =>
                  composer.setField('action', event.target.value as 'plan' | 'build')
                }
              >
                <option value="build">Construire</option>
                <option value="plan">Planifier</option>
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
      <div className="composer-type-pills" role="group" aria-label="Type de projet">
        {projectTypes.map((type) => (
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
        La demande sera transmise à l’agent du projet. Elle attendra sa prise en charge.
      </p>
      {props.operation.project ? (
        <p className="composer-saved" role="status">
          « {props.operation.project.name} » est enregistré.{' '}
          {props.operation.error
            ? 'Réessayez son ouverture ; votre projet est conservé.'
            : 'Ouverture du Studio…'}
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
