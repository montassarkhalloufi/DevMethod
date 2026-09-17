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
  const [phase, setPhase] = useState<'loading' | 'displayed' | 'failed'>('loading');
  useEffect(() => {
    if (phase !== 'loading') return;
    const timeout = window.setTimeout(() => setPhase('failed'), 20000);
    return () => window.clearTimeout(timeout);
  }, [phase]);
  if (phase === 'failed')
    return (
      <PreviewPlaceholder
        title="Aperçu indisponible"
        detail="Le chargement n’a pas abouti. Ouvrez le projet pour le consulter."
      />
    );
  return (
    <>
      <div className="home-preview-frame" aria-hidden="true" inert>
        <iframe
          title={`Aperçu de ${name}`}
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
          <span className="home-spinner" aria-hidden="true" /> Chargement de l’aperçu…
        </div>
      ) : null}
    </>
  );
}

export function RecentProjectPreview({ project }: { project: HomeProject }) {
  const viewport = usePreviewViewport();
  const preview = project.preview;
  const url = previewAddress(project);
  let content;
  if (preview?.status === 'empty')
    content = (
      <PreviewPlaceholder
        title="Votre idée prend forme"
        detail="Aucune version générée pour le moment."
      />
    );
  else if (preview?.status === 'unavailable' && preview.reason === 'source-only')
    content = (
      <PreviewPlaceholder
        title="Sources sans aperçu"
        detail="Le projet reste consultable dans Studio."
      />
    );
  else if (!url)
    content = (
      <PreviewPlaceholder
        title="Aperçu indisponible"
        detail="Ouvrez le projet pour retrouver son contexte."
      />
    );
  else if (viewport.visible && viewport.width > 0)
    content = <PreviewFrame key={url} url={url} width={viewport.width} name={project.name} />;
  else
    content = (
      <PreviewPlaceholder
        title="Aperçu du projet"
        detail="Il se charge lorsque cette carte est visible."
      />
    );
  return (
    <div ref={viewport.container} className="home-project-preview">
      {content}
      {url && preview?.status === 'ready' ? (
        <span className="home-preview-version">
          {preview.selection === 'active' ? 'Version active' : 'Version proposée'}
        </span>
      ) : null}
    </div>
  );
}
