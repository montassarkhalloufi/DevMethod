import { ConnectorIcon } from '../../connectors';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';

export function ComposerPreferences({ composer }: { composer: IdeaComposerController }) {
  const { draft } = composer;
  function remove(action: () => void) {
    action();
    composer.textarea.current?.focus();
  }
  if (!draft.design && !draft.connectors.length && !draft.links.length && !draft.attachments.length)
    return null;
  return (
    <div className="composer-preferences" aria-label="Préférences ajoutées">
      {draft.design ? (
        <span className="composer-chip">
          <span className="composer-chip-label" title={draft.design}>
            Style : {draft.design.split(/[.\n]/)[0]}
          </span>
          <button
            type="button"
            disabled={composer.busy}
            aria-label="Retirer la direction visuelle"
            onClick={() => remove(() => composer.setField('design', ''))}
          >
            ×
          </button>
        </span>
      ) : null}
      {draft.connectors.map((id) => {
        const title = composer.catalog?.options.find((tool) => tool.id === id)?.title || id;
        return (
          <span className="composer-chip" key={id}>
            <ConnectorIcon optionId={id} size={18} />
            <span className="composer-chip-label">{title}</span>
            <button
              type="button"
              disabled={composer.busy}
              aria-label={`Retirer ${title}`}
              onClick={() => remove(() => composer.toggleConnector(id))}
            >
              ×
            </button>
          </span>
        );
      })}
      {draft.attachments.map((file, index) => (
        <span className="composer-chip" key={`${index}:${file.name}`}>
          <span className="composer-chip-mark" aria-hidden="true">
            ↗
          </span>
          <span className="composer-chip-label" title={file.name}>
            {file.name}
          </span>
          <button
            type="button"
            disabled={composer.busy}
            aria-label={`Retirer le fichier ${file.name}`}
            onClick={() => remove(() => composer.removeAttachment(index))}
          >
            ×
          </button>
        </span>
      ))}
      {draft.links.map((url, index) => (
        <span className="composer-chip" key={url}>
          <span className="composer-chip-mark" aria-hidden="true">
            ↗
          </span>
          <span className="composer-chip-label" title={url}>
            {new URL(url).hostname}
          </span>
          <button
            type="button"
            disabled={composer.busy}
            aria-label={`Retirer le lien ${url}`}
            onClick={() => remove(() => composer.removeLink(index))}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
