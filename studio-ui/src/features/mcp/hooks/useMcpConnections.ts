import { useI18n } from '../../../i18n';
import { connectorText } from '../../connectors/model/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mcpAuthorizationUrl, readMcpConnection, readMcpIndex } from '../model/mcp';
import { notifyMcpChange, onMcpChange } from '../model/change-events';
import type { McpConnection, McpConnectInput, McpIndex } from '../model/mcp';

async function request(route: string, signal: AbortSignal, input?: object) {
  const response = await fetch('/api/mcp' + route, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    ...(input
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      : {}),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error?.message || value.error || 'La connexion MCP n’a pas abouti.');
  return value;
}

function waitForPoll(signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = window.setTimeout(finish, 2000);
    signal.addEventListener('abort', finish, { once: true });
    if (signal.aborted) finish();
  });
}

function openAuthorization(locale: 'en' | 'fr') {
  const popup = window.open('about:blank', '_blank', 'popup,width=600,height=760');
  if (!popup) throw new Error('Autorisez les fenêtres de connexion pour ce site, puis réessayez.');
  popup.opener = null;
  popup.document.title = connectorText('Connexion du serveur MCP', locale);
  popup.document.body.textContent = connectorText(
    'Préparation de votre connexion sécurisée…',
    locale,
  );
  return popup;
}

function navigateAuthorization(popup: Window | null, value: unknown) {
  const url = mcpAuthorizationUrl(value);
  if (!popup || popup.closed)
    throw new Error('La fenêtre de connexion a été fermée. Reconnectez le serveur pour reprendre.');
  popup.location.assign(url);
}

export function useMcpConnections(
  onConnected: (id: string) => void,
  onDisconnected: (id: string) => void,
) {
  const { locale } = useI18n();
  const [index, setIndex] = useState<McpIndex>({ presets: [], connections: [], supported: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState<{ id: string | null; authorizing: boolean } | null>(null);
  const listing = useRef<AbortController | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const popup = useRef<Window | null>(null);
  const changeSource = useRef(Symbol());
  const refreshQueued = useRef(false);
  const connected = useRef(onConnected);
  const disconnected = useRef(onDisconnected);
  useEffect(() => {
    connected.current = onConnected;
    disconnected.current = onDisconnected;
  }, [onConnected, onDisconnected]);
  const refresh = useCallback(async (preserveError = false) => {
    if (mutation.current) {
      refreshQueued.current = true;
      return;
    }
    refreshQueued.current = false;
    listing.current?.abort();
    const controller = new AbortController();
    listing.current = controller;
    setLoading(true);
    try {
      const value = readMcpIndex(await request('', controller.signal));
      if (!controller.signal.aborted) {
        setIndex(value);
        if (!preserveError) setError('');
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'État MCP indisponible.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const unsubscribe = onMcpChange('connections', changeSource.current, () => void refresh(true));
    void refresh();
    return () => {
      unsubscribe();
      listing.current?.abort();
      mutation.current?.abort();
      popup.current?.close();
    };
  }, [refresh]);
  function finishMutation(controller: AbortController) {
    if (mutation.current !== controller) return;
    mutation.current = null;
    setActive(null);
    if (refreshQueued.current && !controller.signal.aborted) void refresh(true);
  }
  function remember(connection: McpConnection) {
    listing.current?.abort();
    setLoading(false);
    setIndex((current) => ({
      ...current,
      connections: [...current.connections.filter((item) => item.id !== connection.id), connection],
    }));
    notifyMcpChange('connections', changeSource.current);
  }
  async function poll(id: string, controller: AbortController) {
    const deadline = Date.now() + 10 * 60 * 1000;
    while (!controller.signal.aborted && Date.now() < deadline) {
      await waitForPoll(controller.signal);
      if (controller.signal.aborted) return;
      const next = readMcpIndex(await request('', controller.signal));
      if (controller.signal.aborted) return;
      setIndex(next);
      const connection = next.connections.find((item) => item.id === id);
      if (connection?.status === 'connected') {
        popup.current?.close();
        connected.current(id);
        notifyMcpChange('connections', changeSource.current);
        return;
      }
      if (!connection || ['error', 'disconnected'].includes(connection.status))
        throw new Error(connection?.error?.message || 'La connexion a été interrompue. Réessayez.');
    }
    if (!controller.signal.aborted)
      throw new Error('Le délai d’autorisation est écoulé. Relancez la connexion.');
  }
  async function connect(input: McpConnectInput) {
    if (mutation.current) return;
    const controller = new AbortController();
    mutation.current = controller;
    listing.current?.abort();
    setLoading(false);
    setError('');
    setActive({ id: input.id || null, authorizing: false });
    try {
      if ((input.auth || 'oauth') === 'oauth') popup.current = openAuthorization(locale);
      const value = await request('/connect', controller.signal, input);
      if (controller.signal.aborted) return;
      const connection = readMcpConnection(value.connection);
      remember(connection);
      if (connection.status === 'connected') {
        popup.current?.close();
        connected.current(connection.id);
        return;
      }
      if (value.authorizationUrl) {
        navigateAuthorization(popup.current, value.authorizationUrl);
        setActive({ id: connection.id, authorizing: true });
        await poll(connection.id, controller);
      } else if (connection.status === 'connecting') {
        setActive({ id: connection.id, authorizing: false });
        await poll(connection.id, controller);
      } else
        throw new Error(
          connection.error?.message || 'L’autorisation est nécessaire. Reconnectez le serveur.',
        );
    } catch (cause) {
      popup.current?.close();
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Connexion MCP interrompue.');
    } finally {
      finishMutation(controller);
    }
  }
  async function change(id: string, action: 'refresh' | 'disconnect') {
    if (mutation.current && !(active?.id === id && action === 'disconnect')) return;
    mutation.current?.abort();
    listing.current?.abort();
    setLoading(false);
    popup.current?.close();
    const controller = new AbortController();
    mutation.current = controller;
    setActive({ id, authorizing: false });
    setError('');
    try {
      const value = await request('/' + action, controller.signal, { id });
      if (controller.signal.aborted) return;
      const connection = readMcpConnection(value.connection);
      remember(connection);
      if (action === 'disconnect') disconnected.current(id);
      if (value.authorizationUrl)
        setError('Une nouvelle autorisation est nécessaire. Cliquez sur Reconnecter.');
      if (connection.status === 'error')
        setError(connection.error?.message || 'La connexion doit être rétablie.');
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Mise à jour MCP impossible.');
    } finally {
      finishMutation(controller);
    }
  }
  return {
    ...index,
    loading,
    error,
    active,
    refresh: () => {
      void refresh();
    },
    connect,
    change,
  };
}

export type McpConnectionsController = ReturnType<typeof useMcpConnections>;
