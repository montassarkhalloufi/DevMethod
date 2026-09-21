import { localizeMessage } from '../model/ui-messages';
import { useI18n } from '../../../i18n';
import { translate } from '../../../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { BrowserConfiguration } from '../model/contracts';

async function request(
  signal: AbortSignal,
  input?: Pick<BrowserConfiguration, 'version' | 'enabled' | 'channel' | 'automatic'>,
  locale: 'en' | 'fr' = 'en',
): Promise<BrowserConfiguration> {
  const response = await fetch('/api/project/browser' + (input ? '/configure' : ''), {
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    ...(input
      ? {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }
      : {}),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      value.error ||
        translate(
          'Réglage navigateur indisponible.',
          'Browser settings unavailable.',
          undefined,
          locale,
        ),
    );
  if (
    !Number.isInteger(value.version) ||
    typeof value.enabled !== 'boolean' ||
    (value.automatic !== undefined && typeof value.automatic !== 'boolean') ||
    !['chrome', 'msedge'].includes(value.channel)
  )
    throw new Error(
      translate(
        'Configuration navigateur invalide.',
        'Invalid browser configuration.',
        undefined,
        locale,
      ),
    );
  return { ...value, automatic: value.automatic === true && value.enabled };
}

export function useBrowserConfiguration() {
  const { locale } = useI18n();
  const [configuration, setConfiguration] = useState<BrowserConfiguration | null>(null);
  const [draft, setDraft] = useState({
    enabled: false,
    automatic: false,
    channel: 'chrome' as BrowserConfiguration['channel'],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [needsRead, setNeedsRead] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const initialized = useRef(false);
  const read = useCallback(async () => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    try {
      const next = await request(controller.signal, undefined, 'fr');
      if (controller.signal.aborted) return;
      setConfiguration(next);
      if (!initialized.current)
        setDraft({ enabled: next.enabled, channel: next.channel, automatic: next.automatic });
      else
        setMessage(
          'Configuration relue. Vos choix sont conservés ; examinez-les avant d’enregistrer.',
        );
      initialized.current = true;
      setNeedsRead(false);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Lecture impossible.');
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null;
        setBusy(false);
      }
    }
  }, []);
  useEffect(() => {
    void read();
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [read]);
  async function save(onSaved: () => void) {
    if (pending.current || !configuration || needsRead) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = await request(
        controller.signal,
        { version: configuration.version, ...draft },
        'fr',
      );
      if (controller.signal.aborted) return;
      setConfiguration(next);
      setDraft({ enabled: next.enabled, channel: next.channel, automatic: next.automatic });
      setMessage(
        next.automatic
          ? 'Réglage enregistré. Aucun navigateur lancé maintenant. Les prochains candidats de l’agent pourront être vérifiés automatiquement.'
          : 'Réglage enregistré. Aucun navigateur lancé. Utilisez Exécuter dans le contrôle navigateur.',
      );
      onSaved();
    } catch (cause) {
      if (!controller.signal.aborted) {
        setNeedsRead(true);
        setError(
          (cause instanceof Error ? cause.message : 'Enregistrement impossible.') +
            ' Vos choix sont conservés. Relisez la configuration avant de réessayer.',
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return {
    configuration,
    draft,
    setDraft,
    busy,
    error: localizeMessage(error, locale),
    message: localizeMessage(message, locale),
    needsRead,
    read,
    save,
  };
}
