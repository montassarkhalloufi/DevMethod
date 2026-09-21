import { useI18n } from '../../../i18n';
import { useRef, useState } from 'react';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';
import { composerLimits } from '../model/composer';

export function ComposerReferences({ composer }: { composer: IdeaComposerController }) {
  const { t } = useI18n();
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
        {' '}
        {t(
          'Montrez ce qui vous inspire : un écran, un document ou un site à étudier.',
          'Share what inspires you: a screen, document, or website to study.',
        )}{' '}
      </p>
      <input
        ref={files}
        className="composer-file-input"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,text/plain,text/markdown,.txt,.md"
        aria-label={t('Joindre des références', 'Attach references')}
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
        <strong>
          {composer.reading
            ? t('Lecture des fichiers…', 'Reading files…')
            : t('Ajouter des fichiers', 'Add files')}
        </strong>
        <span>{t('PNG, JPEG, WebP, TXT ou Markdown', 'PNG, JPEG, WebP, TXT, or Markdown')}</span>
        <small>
          {t('4 fichiers maximum · 2 Mio par fichier', 'Up to 4 files · 2 MiB per file')}
        </small>
      </button>
      {composer.draft.attachments.length ? (
        <ul className="composer-reference-list" aria-label={t('Fichiers joints', 'Attached files')}>
          {composer.draft.attachments.map((file, index) => (
            <li key={`${index}:${file.name}`}>
              <span>
                <strong>{file.name}</strong>
                <small>
                  {file.mime.startsWith('image/')
                    ? t('Image de référence', 'Reference image')
                    : t('Document de référence', 'Reference document')}
                </small>
              </span>
              <button
                type="button"
                className="composer-remove"
                disabled={composer.busy}
                aria-label={t('Retirer le fichier {name}', 'Remove file {name}', {
                  name: file.name,
                })}
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
        {' '}
        {t('Un lien de référence', 'A reference link')}{' '}
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
          {' '}
          {t('Ajouter', 'Add')}{' '}
        </button>
      </div>
      {composer.draft.links.length ? (
        <ul
          className="composer-reference-list"
          aria-label={t('Liens de référence', 'Reference links')}
        >
          {composer.draft.links.map((url, index) => (
            <li key={url}>
              <span className="composer-reference-url" title={url}>
                {url}
              </span>
              <button
                type="button"
                className="composer-remove"
                disabled={composer.busy}
                aria-label={t('Retirer le lien {url}', 'Remove link {url}', { url })}
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
        {' '}
        {t(
          '5 liens maximum. Ils seront transmis comme références ; aucun site n’est consulté automatiquement.',
          'Up to 5 links. They will be passed on as references; no website is opened automatically.',
        )}{' '}
      </p>
    </>
  );
}
