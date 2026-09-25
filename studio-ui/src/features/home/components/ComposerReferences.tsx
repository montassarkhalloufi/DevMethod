import { useRef, useState } from 'react';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';
import { composerLimits } from '../model/composer';

export function ComposerReferences({ composer }: { composer: IdeaComposerController }) {
  const [link, setLink] = useState('');
  const linkInput = useRef<HTMLInputElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLButtonElement>(null);
  function addLink() {
    if (composer.addLink(link)) setLink('');
    linkInput.current?.focus();
  }
  return (
    <>
      <p className="composer-option-intro">
        Montrez ce qui vous inspire : un écran, un document ou un site à étudier.
      </p>
      <input
        ref={files}
        className="composer-file-input"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,text/plain,text/markdown,.txt,.md"
        aria-label="Joindre des références"
        disabled={composer.busy}
        onChange={(event) => {
          const selected = Array.from(event.currentTarget.files || []);
          event.currentTarget.value = '';
          void composer.addFiles(selected);
        }}
      />
      <button
        ref={upload}
        type="button"
        className="composer-file-drop"
        disabled={composer.busy || composer.draft.attachments.length >= composerLimits.attachments}
        onClick={() => files.current?.click()}
      >
        <span className="composer-upload-mark" aria-hidden="true">
          ↑
        </span>
        <strong>{composer.reading ? 'Lecture des fichiers…' : 'Ajouter des fichiers'}</strong>
        <span>PNG, JPEG, WebP, TXT ou Markdown</span>
        <small>4 fichiers maximum · 2 Mio par fichier</small>
      </button>
      {composer.draft.attachments.length ? (
        <ul className="composer-reference-list" aria-label="Fichiers joints">
          {composer.draft.attachments.map((file, index) => (
            <li key={`${index}:${file.name}`}>
              <span>
                <strong>{file.name}</strong>
                <small>
                  {file.mime.startsWith('image/') ? 'Image de référence' : 'Document de référence'}
                </small>
              </span>
              <button
                type="button"
                className="composer-remove"
                disabled={composer.busy}
                aria-label={`Retirer le fichier ${file.name}`}
                onClick={() => {
                  composer.removeAttachment(index);
                  requestAnimationFrame(() => upload.current?.focus());
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="composer-field" htmlFor="composer-reference-link">
        Un lien de référence
      </label>
      <div className="composer-link-entry">
        <input
          ref={linkInput}
          id="composer-reference-link"
          type="url"
          name="reference-link"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={link}
          disabled={composer.busy}
          onChange={(event) => setLink(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addLink();
            }
          }}
          placeholder="https://un-site-qui-vous-inspire.fr…"
        />
        <button type="button" disabled={composer.busy} onClick={addLink}>
          Ajouter
        </button>
      </div>
      {composer.draft.links.length ? (
        <ul className="composer-reference-list" aria-label="Liens de référence">
          {composer.draft.links.map((url, index) => (
            <li key={url}>
              <span className="composer-reference-url" title={url}>
                {url}
              </span>
              <button
                type="button"
                className="composer-remove"
                disabled={composer.busy}
                aria-label={`Retirer le lien ${url}`}
                onClick={() => {
                  composer.removeLink(index);
                  linkInput.current?.focus();
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="composer-option-note">
        5 liens maximum. Ils seront transmis comme références ; aucun site n’est consulté
        automatiquement.
      </p>
    </>
  );
}
