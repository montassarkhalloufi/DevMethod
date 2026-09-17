import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeOperation, HomeOptions, HomeProject, ProjectInput } from '../model/contracts';
import { openingUrl, readProject, recentProjects } from '../model/home';

async function request(route: string, signal: AbortSignal, input?: unknown) {
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
    throw new Error(value.error || 'Le service local ne répond pas. Réessayez dans un instant.');
  return value;
}

const errorText = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'Action non confirmée. Vous pouvez réessayer.';

export function useHome({ navigate }: HomeOptions) {
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
      const result = await request('', controller.signal);
      if (controller.signal.aborted) return;
      if (!Array.isArray(result.projects)) throw new Error('La liste des projets est illisible.');
      setProjects(recentProjects(result.projects.map(readProject)));
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
    const result = await request('/open', controller.signal, { id: project.id });
    if (controller.signal.aborted) return;
    const opened = readProject(result.project);
    if (opened.id !== project.id)
      throw new Error('La session renvoyée appartient à un autre projet.');
    const url = openingUrl(result.url, initial ? project.kind : undefined);
    remember(opened);
    if (navigate) navigate(url);
    else window.location.assign(url);
  }
  async function prepareProject(input: ProjectInput, controller: AbortController) {
    const key = JSON.stringify(input);
    let attempt = attempts.current.get(key);
    if (!attempt) {
      attempt = { requestId: crypto.randomUUID() };
      attempts.current.set(key, attempt);
    }
    if (attempt.project) return attempt.project;
    const result = await request('/projects', controller.signal, {
      requestId: attempt.requestId,
      ...input,
    });
    if (controller.signal.aborted) return null;
    const project = readProject(result.project);
    attempt.project = project;
    remember(project);
    return project;
  }
  async function run(input: ProjectInput | HomeProject) {
    if (mutation.current) return;
    const controller = new AbortController();
    mutation.current = controller;
    let project: HomeProject | null = 'id' in input ? input : null;
    setOperation({ phase: project ? 'opening' : 'creating', project, error: '' });
    try {
      if (!('id' in input)) project = await prepareProject(input, controller);
      if (project) await openProject(project, controller, !('id' in input));
    } catch (cause) {
      if (!controller.signal.aborted)
        setOperation({ phase: 'idle', project, error: errorText(cause) });
    } finally {
      if (!controller.signal.aborted) {
        mutation.current = null;
        setOperation((current) => ({ ...current, phase: 'idle' }));
      }
    }
  }
  function clearOperation() {
    if (!mutation.current) setOperation({ phase: 'idle', project: null, error: '' });
  }
  return { projects, loading, loadError, operation, refresh, run, clearOperation };
}
