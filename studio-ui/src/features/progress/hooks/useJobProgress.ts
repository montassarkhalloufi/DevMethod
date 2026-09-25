import { useEffect, useState } from 'react';
import type { ProgressJob, ProgressSnapshot, ProgressWidgetProps } from '../model/contracts';

// One bounded subscription per visible job. A delayed response cannot replace another job.
export function useJobProgress(
  job: ProgressJob,
  load: ProgressWidgetProps['loadProgress'],
  pollMs = 2000,
) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let inFlight = false;
    const refresh = async () => {
      if (disposed || inFlight) return;
      inFlight = true;
      controller = new AbortController();
      const deadline = setTimeout(() => controller?.abort(), 10000);
      try {
        const next = await load(job.id, controller.signal);
        if (disposed) return;
        if (next.jobId !== job.id) throw new Error('La réponse concerne une autre demande.');
        setSnapshot((previous) =>
          previous?.jobId === next.jobId && previous.sequence > next.sequence ? previous : next,
        );
        setError('');
      } catch {
        if (!disposed) setError('Actualisation interrompue. Le dernier état reçu est conservé.');
      } finally {
        clearTimeout(deadline);
        inFlight = false;
        if (!disposed && pollMs > 0 && ['queued', 'running'].includes(job.status))
          timer = setTimeout(() => {
            if (!document.hidden) void refresh();
          }, pollMs);
      }
    };
    const resume = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      void refresh();
    };
    document.addEventListener('visibilitychange', resume);
    void refresh();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', resume);
    };
  }, [job.id, job.status, load, pollMs, attempt]);
  return { snapshot, error, retry: () => setAttempt((value) => value + 1) };
}
