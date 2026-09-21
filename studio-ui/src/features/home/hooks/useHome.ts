import { translateStudioError } from '../../../../../scripts/studio/public/error-messages.js';
import { useI18n, translate, getLocale, type StudioLocale } from '../../../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeOperation, HomeOptions, HomeProject, ProjectInput } from '../model/contracts';
import { openingUrl, readProject, recentProjects } from '../model/home';

async function request(
  route: string,
  signal: AbortSignal,
  input?: unknown,
  locale: StudioLocale = 'en',
) {
  const response = await fetch('/api/home' + route, {
    ...(input === undefined
      ? { cache: 'no-store' as const }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }),
    credentials: 'same-origin',
    signal: AbortSignal.any([signal, AbortSignal.timeout(60000)]),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      value.error ||
        translate(
          'Le service local ne répond pas. Réessayez dans un instant.',
          'The local service is not responding. Try again shortly.',
          undefined,
          locale,
        ),
    );
  return value;
}

const errorText = (cause: unknown) =>
  cause instanceof Error
    ? cause.message
    : translate(
        'Action non confirmée. Vous pouvez réessayer.',
        'Action not confirmed. You can try again.',
        undefined,
        getLocale(),
      );

export function useHome({ navigate }: HomeOptions) {
  const { locale, t } = useI18n();
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [operation, setOperation] = useState<HomeOperation>({
    phase: 'idle',
    project: null,
    error: '',
  });
  const listRequest = useRef<AbortController | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const attempts = useRef(new Map<string, { requestId: string; project?: HomeProject }>());
  const refresh = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    setLoadError('');
    try {
      const result = await request('', controller.signal, undefined, getLocale());
      if (controller.signal.aborted) return;
      if (!Array.isArray(result.projects))
        throw new Error(
          translate(
            'La liste des projets est illisible.',
            'The project list could not be read.',
            undefined,
            getLocale(),
          ),
        );
      setProjects(
        recentProjects(
          result.projects.map((project: unknown) => readProject(project, getLocale())),
        ),
      );
    } catch (cause) {
      if (!controller.signal.aborted) setLoadError(errorText(cause));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => {
      listRequest.current?.abort();
      mutation.current?.abort();
    };
  }, [refresh]);

  function remember(project: HomeProject) {
    listRequest.current?.abort();
    setLoading(false);
    setProjects((current) =>
      recentProjects([project, ...current.filter((p) => p.id !== project.id)]),
    );
  }
  async function openProject(project: HomeProject, controller: AbortController, initial: boolean) {
    setOperation({ phase: 'opening', project, error: '' });
    const result = await request('/open', controller.signal, { id: project.id }, locale);
    if (controller.signal.aborted) return;
    const opened = readProject(result.project, locale);
    if (opened.id !== project.id)
      throw new Error(
        t(
          'La session renvoyée appartient à un autre projet.',
          'The returned session belongs to another project.',
        ),
      );
    const url = openingUrl(result.url, initial ? project.kind : undefined, locale);
    remember(opened);
    if (navigate) navigate(url);
    else window.location.assign(url);
    return true;
  }
  async function prepareProject(input: ProjectInput, controller: AbortController) {
    const key = JSON.stringify(input);
    let attempt = attempts.current.get(key);
    if (!attempt) {
      attempt = { requestId: crypto.randomUUID() };
      attempts.current.set(key, attempt);
    }
    if (attempt.project) return attempt.project;
    const result = await request(
      '/projects',
      controller.signal,
      {
        requestId: attempt.requestId,
        ...input,
      },
      locale,
    );
    if (controller.signal.aborted) return null;
    const project = readProject(result.project, locale);
    attempt.project = project;
    remember(project);
    return project;
  }
  async function run(input: ProjectInput | HomeProject, onPrepared?: () => void) {
    if (mutation.current) return false;
    const controller = new AbortController();
    mutation.current = controller;
    let project: HomeProject | null = 'id' in input ? input : null;
    let navigating = false;
    setOperation({ phase: project ? 'opening' : 'creating', project, error: '' });
    try {
      if (!('id' in input)) {
        project = await prepareProject(input, controller);
        if (project) onPrepared?.();
      }
      if (project) navigating = Boolean(await openProject(project, controller, !('id' in input)));
    } catch (cause) {
      if (!controller.signal.aborted)
        setOperation({ phase: 'idle', project, error: errorText(cause) });
    } finally {
      if (!controller.signal.aborted) {
        mutation.current = null;
        if (!navigating) setOperation((current) => ({ ...current, phase: 'idle' }));
      }
    }
    return navigating;
  }
  function clearOperation() {
    if (!mutation.current) setOperation({ phase: 'idle', project: null, error: '' });
  }
  return {
    projects,
    loading,
    loadError: translateStudioError(loadError, locale),
    operation: { ...operation, error: translateStudioError(operation.error, locale) },
    refresh,
    run,
    clearOperation,
  };
}
