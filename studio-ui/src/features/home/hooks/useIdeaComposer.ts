import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { HomeOperation, HomeProjectType, ProjectInput } from '../model/contracts';
import { useMcpConnections } from '../../mcp';
import {
  applyComposerSeed,
  attachmentMime,
  composerInput,
  composerLimits,
  emptyComposer,
  hasComposerContent,
  normalizeReference,
  parseComposerCatalog,
  projectTypes,
} from '../model/composer';
import type {
  ComposerAttachment,
  ComposerCatalog,
  ComposerDraft,
  ComposerSeed,
} from '../model/composer';

function readAttachment(file: File, signal: AbortSignal): Promise<ComposerAttachment> {
  const mime = attachmentMime(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal.removeEventListener('abort', abort);
    reader.onload = () => {
      cleanup();
      const encoded = String(reader.result || '').split(',')[1];
      if (!encoded) reject(new Error(`Impossible de lire « ${file.name} ». Réessayez.`));
      else resolve({ name: file.name, mime, base64: encoded });
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error(`Impossible de lire « ${file.name} ». Réessayez.`));
    };
    reader.onabort = () => {
      cleanup();
      reject(new Error('Lecture des fichiers interrompue.'));
    };
    signal.addEventListener('abort', abort, { once: true });
    reader.readAsDataURL(file);
    if (signal.aborted) reader.abort();
  });
}

export function useIdeaComposer({
  operation,
  onSubmit,
  onEdit,
  seed,
}: {
  operation: HomeOperation;
  onSubmit(input: ProjectInput, onSaved: () => void): void;
  onEdit(): void;
  seed?: ComposerSeed;
}) {
  const [content, setContent] = useState({
    draft: emptyComposer(),
    seedId: null as number | null,
    seedError: '',
  });
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [catalog, setCatalog] = useState<ComposerCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [savedDraft, setSavedDraft] = useState<ComposerDraft | null>(null);
  const saved = useRef<ComposerDraft | null>(null);
  const departureApproved = useRef(false);
  const readingRequest = useRef<AbortController | null>(null);
  const catalogRequest = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const mcp = useMcpConnections(
    (id) => selectMcp(id, true),
    (id) => selectMcp(id, false),
  );
  const busy = reading || operation.phase !== 'idle';
  const notifySeedEdit = useEffectEvent(onEdit);
  const hasUnsavedContent =
    reading || (hasComposerContent(content.draft) && content.draft !== savedDraft);
  const warnBeforeLeaving = useEffectEvent((event: BeforeUnloadEvent) => {
    if (departureApproved.current) return;
    if (
      !readingRequest.current &&
      (!hasComposerContent(content.draft) || content.draft === saved.current)
    )
      return;
    event.preventDefault();
    event.returnValue = '';
  });
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => warnBeforeLeaving(event);
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);
  if (seed && seed.id !== content.seedId && !busy) {
    const applied = applyComposerSeed(content.draft, seed);
    setContent({ draft: applied.draft, seedId: seed.id, seedError: applied.error });
    setError('');
  }
  useEffect(() => {
    if (content.seedId === null) return;
    notifySeedEdit();
    textarea.current?.focus();
    textarea.current?.scrollIntoView?.({ block: 'center' });
  }, [content.seedId]);
  useEffect(
    () => () => {
      const reading = readingRequest.current;
      readingRequest.current = null;
      reading?.abort();
      catalogRequest.current?.abort();
    },
    [],
  );
  function update(change: (draft: ComposerDraft) => ComposerDraft) {
    if (readingRequest.current || operation.phase !== 'idle') return;
    departureApproved.current = false;
    setContent((current) => ({ ...current, draft: change(current.draft), seedError: '' }));
    setError('');
    onEdit();
  }
  function setField<K extends 'idea' | 'name' | 'design' | 'action'>(
    field: K,
    value: ComposerDraft[K],
  ) {
    update((draft) => ({ ...draft, [field]: value }));
  }
  function selectType(projectType: HomeProjectType) {
    update((draft) => ({
      ...draft,
      projectType,
      idea: draft.idea.trim()
        ? draft.idea
        : projectTypes.find((type) => type.id === projectType)?.idea || '',
    }));
    textarea.current?.focus();
  }
  function addLink(value: string) {
    if (busy || readingRequest.current) return false;
    try {
      const url = normalizeReference(value);
      if (content.draft.links.includes(url)) throw new Error('Cette référence est déjà ajoutée.');
      if (content.draft.links.length >= composerLimits.links)
        throw new Error('Vous pouvez ajouter au maximum 5 liens.');
      update((draft) => ({ ...draft, links: [...draft.links, url] }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Lien invalide.');
      return false;
    }
  }
  async function addFiles(files: File[]) {
    if (!files.length || readingRequest.current || operation.phase !== 'idle') return;
    const controller = new AbortController();
    try {
      if (content.draft.attachments.length + files.length > composerLimits.attachments)
        throw new Error('Vous pouvez joindre au maximum 4 fichiers.');
      files.forEach(attachmentMime);
      readingRequest.current = controller;
      setReading(true);
      setError('');
      const attachments = await Promise.all(
        files.map((file) => readAttachment(file, controller.signal)),
      );
      if (controller.signal.aborted) return;
      setContent((current) => ({
        ...current,
        draft: { ...current.draft, attachments: [...current.draft.attachments, ...attachments] },
        seedError: '',
      }));
      onEdit();
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Lecture des fichiers impossible.');
      controller.abort();
    } finally {
      if (readingRequest.current === controller) {
        readingRequest.current = null;
        setReading(false);
      }
    }
  }
  async function loadCatalog() {
    catalogRequest.current?.abort();
    const controller = new AbortController();
    catalogRequest.current = controller;
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const response = await fetch('/api/home/catalog', {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      const value: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok)
        throw new Error('Le catalogue est indisponible. Réessayez dans un instant.');
      setCatalog(parseComposerCatalog(value));
    } catch (cause) {
      if (!controller.signal.aborted)
        setCatalogError(cause instanceof Error ? cause.message : 'Chargement impossible.');
    } finally {
      if (!controller.signal.aborted) setCatalogLoading(false);
    }
  }
  function submit() {
    if (busy || readingRequest.current || submitting.current) return;
    try {
      if (
        content.draft.mcpConnectionIds.some(
          (id) =>
            !mcp.connections.some(
              (connection) => connection.id === id && connection.status === 'connected',
            ),
        )
      )
        throw new Error('Reconnectez les serveurs MCP sélectionnés ou retirez-les de ce projet.');
      const input = composerInput(content.draft);
      submitting.current = true;
      setError('');
      const submittedDraft = content.draft;
      onSubmit(input, () => {
        saved.current = submittedDraft;
        setSavedDraft(submittedDraft);
      });
      queueMicrotask(() => {
        submitting.current = false;
      });
    } catch (cause) {
      submitting.current = false;
      setError(cause instanceof Error ? cause.message : 'Complétez votre demande.');
      textarea.current?.focus();
    }
  }
  function toggleConnector(id: string) {
    if (busy || readingRequest.current) return;
    const selected = content.draft.connectors.includes(id);
    if (!selected && content.draft.connectors.length >= composerLimits.connectors) {
      setError('Vous pouvez proposer au maximum 12 outils ou services.');
      return;
    }
    update((draft) => ({
      ...draft,
      connectors: selected
        ? draft.connectors.filter((item) => item !== id)
        : [...draft.connectors, id],
    }));
  }
  function selectMcp(id: string, enabled: boolean) {
    if (enabled && content.draft.mcpConnectionIds.includes(id)) return;
    if (enabled && content.draft.mcpConnectionIds.length >= 12) {
      setError('Vous pouvez utiliser au maximum 12 serveurs MCP pour ce projet.');
      return;
    }
    update((draft) => ({
      ...draft,
      mcpConnectionIds: enabled
        ? [...draft.mcpConnectionIds, id]
        : draft.mcpConnectionIds.filter((item) => item !== id),
    }));
  }
  return {
    mcp,
    toggleMcp: (id: string) => selectMcp(id, !content.draft.mcpConnectionIds.includes(id)),
    hasUnsavedContent,
    approveDeparture: () => {
      departureApproved.current = true;
    },
    cancelDeparture: () => {
      departureApproved.current = false;
    },
    draft: content.draft,
    error: error || content.seedError,
    busy,
    reading,
    textarea,
    catalog,
    catalogLoading,
    catalogError,
    loadCatalog,
    submit,
    setField,
    selectType,
    addLink,
    addFiles,
    removeLink: (index: number) =>
      update((draft) => ({ ...draft, links: draft.links.filter((_, i) => i !== index) })),
    removeAttachment: (index: number) =>
      update((draft) => ({
        ...draft,
        attachments: draft.attachments.filter((_, i) => i !== index),
      })),
    toggleConnector,
  };
}

export type IdeaComposerController = ReturnType<typeof useIdeaComposer>;
