import { useI18n } from '../../../i18n';
import { useEffect, useState } from 'react';
import type { HomeProject } from '../model/contracts';
import { usePreviewViewport } from '../hooks/usePreviewViewport';
import { HomeIcon } from './HomeIcon';

function previewAddress(project: HomeProject) {
  if (project.preview?.status !== 'ready') return null;
  try {
    const url = new URL(project.preview.url);
    const expected = `/projects/${encodeURIComponent(project.id)}/revisions/${encodeURIComponent(project.preview.revisionId)}/index.html`;
    if (
      url.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !url.port ||
      url.origin === window.location.origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== expected
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function PreviewPlaceholder({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="home-preview-placeholder">
      <span className="home-preview-symbol" aria-hidden="true">
        <HomeIcon kind="folder" />
      </span>
      <span className="home-preview-title">{title}</span>
      <span className="home-preview-detail">{detail}</span>
    </div>
  );
}

function PreviewFrame({ url, width, name }: { url: string; width: number; name: string }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'loading' | 'displayed' | 'failed'>('loading');
  useEffect(() => {
    if (phase !== 'loading') return;
    const timeout = window.setTimeout(() => setPhase('failed'), 20000);
    return () => window.clearTimeout(timeout);
  }, [phase]);
  if (phase === 'failed')
    return (
      <PreviewPlaceholder
        title={t('Aperçu indisponible', 'Preview unavailable')}
        detail={t(
          'Le chargement n’a pas abouti. Ouvrez le projet pour le consulter.',
          'The preview could not load. Open the project to view it.',
        )}
      />
    );
  return (
    <>
      <div className="home-preview-frame" aria-hidden="true" inert>
        <iframe
          title={t('Aperçu de {name}', 'Preview of {name}', { name })}
          src={url}
          sandbox="allow-scripts"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          referrerPolicy="no-referrer"
          width={1280}
          height={800}
          style={{ transform: `scale(${width / 1280})` }}
          onLoad={() => setPhase((current) => (current === 'failed' ? current : 'displayed'))}
          onErrorCapture={() => setPhase('failed')}
        />
      </div>
      {phase === 'loading' ? (
        <div className="home-preview-loading">
          <span className="home-spinner" aria-hidden="true" />{' '}
          {t('Chargement de l’aperçu…', 'Loading preview…')}{' '}
        </div>
      ) : null}
    </>
  );
}

export function RecentProjectPreview({ project }: { project: HomeProject }) {
  const { t } = useI18n();
  const viewport = usePreviewViewport();
  const preview = project.preview;
  const url = previewAddress(project);
  let content;
  if (preview?.status === 'empty')
    content = (
      <PreviewPlaceholder
        title={t('Votre idée prend forme', 'Your idea is taking shape')}
        detail={t('Aucune version générée pour le moment.', 'No version has been generated yet.')}
      />
    );
  else if (preview?.status === 'unavailable' && preview.reason === 'source-only')
    content = (
      <PreviewPlaceholder
        title={t('Sources sans aperçu', 'Sources without a preview')}
        detail={t(
          'Le projet reste consultable dans Studio.',
          'You can still inspect the project in Studio.',
        )}
      />
    );
  else if (!url)
    content = (
      <PreviewPlaceholder
        title={t('Aperçu indisponible', 'Preview unavailable')}
        detail={t(
          'Ouvrez le projet pour retrouver son contexte.',
          'Open the project to return to its context.',
        )}
      />
    );
  else if (viewport.visible && viewport.width > 0)
    content = <PreviewFrame key={url} url={url} width={viewport.width} name={project.name} />;
  else
    content = (
      <PreviewPlaceholder
        title={t('Aperçu du projet', 'Project preview')}
        detail={t(
          'Il se charge lorsque cette carte est visible.',
          'It loads when this card is visible.',
        )}
      />
    );
  return (
    <div ref={viewport.container} className="home-project-preview">
      {content}
      {url && preview?.status === 'ready' ? (
        <span className="home-preview-version">
          {preview.selection === 'active'
            ? t('Version active', 'Active version')
            : t('Version proposée', 'Proposed version')}
        </span>
      ) : null}
    </div>
  );
}
