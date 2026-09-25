import { useEffect, useRef, useState } from 'react';
import { guideResponse } from '../connectors/hooks/useConnectorGuides';
import { readInteractions } from './model';
import type { ConnectorInteraction } from './model';

export function useInteractions(jobId: string) {
  const [items, setItems] = useState<ConnectorInteraction[]>([]);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    async function read() {
      if (busy.current) return;
      busy.current = true;
      try {
        const response = await fetch(
          '/api/connectors/interactions?jobId=' + encodeURIComponent(jobId),
          {
            cache: 'no-store',
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
          },
        );
        const values = readInteractions(await guideResponse(response), jobId);
        if (!controller.signal.aborted) {
          setItems((previous) =>
            values.map((value) => {
              const newer = previous.find(
                (entry) => entry.id === value.id && entry.version > value.version,
              );
              return newer ?? value;
            }),
          );
          setError('');
        }
      } catch {
        if (!controller.signal.aborted)
          setError(
            'Impossible de relire les questionnaires. Les réponses affichées sont conservées.',
          );
      } finally {
        busy.current = false;
      }
    }
    void read();
    const timer = window.setInterval(() => void read(), 2000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [jobId, version]);
  return {
    items,
    error,
    refresh: () => setVersion((value) => value + 1),
    replace: (item: ConnectorInteraction) =>
      setItems((values) =>
        values.map((entry) =>
          entry.id === item.id && entry.version <= item.version ? item : entry,
        ),
      ),
  };
}
