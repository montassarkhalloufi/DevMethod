import { localizeMessage } from '../model/ui-messages';
import { useI18n } from '../../../i18n';
import { translate } from '../../../i18n';
import { useEffect, useRef, useState } from 'react';
import type { AgentSettings, AgentStatus, AgentWidgetProps } from '../model/contracts';

async function agentRequest(
  path: string,
  input: object,
  signal: AbortSignal,
  locale: 'en' | 'fr' = 'en',
) {
  const response = await fetch('/api/agent/' + path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  const result = (await response.json()) as AgentStatus & { error?: string };
  if (!response.ok || !result.settings || !result.availability)
    throw new Error(
      result.error ||
        translate(
          'Connexion impossible. Vérifiez l’état et réessayez.',
          'Connection failed. Check status and retry.',
          undefined,
          locale,
        ),
    );
  return result;
}

export function useAgentConfiguration({ agent, onStatus }: AgentWidgetProps) {
  const { locale } = useI18n();
  const [draft, setDraft] = useState<AgentSettings | null>(null);
  const [pending, setPending] = useState<'probe' | 'configure' | null>(null);
  const [error, setError] = useState('');
  const inFlight = useRef<AbortController | null>(null);
  const settings = draft ?? agent.settings;
  const dirty = draft !== null;
  const stale = draft !== null && draft.version !== agent.settings.version;
  useEffect(() => () => inFlight.current?.abort(), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function run(action: 'probe' | 'configure', input: object) {
    if (inFlight.current) return;
    const origin = document.activeElement;
    const controller = new AbortController();
    inFlight.current = controller;
    setPending(action);
    setError('');
    try {
      const status = await agentRequest(action, input, controller.signal, 'fr');
      if (controller.signal.aborted) return;
      // Only a successful configuration replaces the submitted draft. Polling never does.
      if (action === 'configure') setDraft(null);
      onStatus(status);
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'Action impossible. Réessayez.');
    } finally {
      if (!controller.signal.aborted) {
        setPending(null);
        requestAnimationFrame(() => {
          if (
            document.activeElement === document.body &&
            origin instanceof HTMLElement &&
            origin.isConnected
          )
            origin.focus();
        });
      }
      if (inFlight.current === controller) inFlight.current = null;
    }
  }
  return {
    settings,
    stale,
    pending,
    error: localizeMessage(error, locale),
    edit(field: 'maxJobs' | 'maxTokens' | 'timeoutMs', value: number) {
      setDraft({ ...settings, [field]: value });
    },
    reload() {
      setDraft(null);
      setError('');
    },
    probe: () => run('probe', {}),
    configure: () =>
      run('configure', { ...settings, enabled: true, access: agent.availability.access }),
    stop: () => run('configure', { ...agent.settings, enabled: false }),
  };
}
