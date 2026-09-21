import { localizeMessage } from '../model/ui-messages';
import { useI18n } from '../../../i18n';
import { translate } from '../../../i18n';
import { useEffect, useRef, useState } from 'react';
import type { CoverageDraft, CoverageReview } from '../model/coverage';
import { canSubmitCoverage } from '../model/coverage';

async function readResponse(response: Response, locale: 'en' | 'fr' = 'en') {
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error ||
        translate(
          'Examen de couverture indisponible.',
          'Coverage review unavailable.',
          undefined,
          locale,
        ),
    );
  return result;
}
async function loadReview(
  revisionId: string,
  receiptId: string,
  signal: AbortSignal,
  locale: 'en' | 'fr' = 'en',
) {
  const next: CoverageReview = await readResponse(
    await fetch(
      `/api/coverage-review?${new URLSearchParams({ revision: revisionId, receipt: receiptId })}`,
      { signal: signal, credentials: 'same-origin', cache: 'no-store' },
    ),
    locale,
  );
  if (
    next.revision?.id !== revisionId ||
    next.receipt?.id !== receiptId ||
    !Array.isArray(next.criteria) ||
    !Array.isArray(next.scenarios) ||
    !Array.isArray(next.reviews)
  )
    throw new Error(
      translate(
        'L’examen reçu ne correspond pas à cette version et ce reçu.',
        'The received review does not match this version and receipt.',
        undefined,
        locale,
      ),
    );
  return next;
}
export function useCoverageReview(revisionId: string, receiptId: string, onSaved: () => void) {
  const { locale } = useI18n();
  const [opened, setOpened] = useState(false);
  const [review, setReview] = useState<CoverageReview | null>(null);
  const [draft, setDraft] = useState<CoverageDraft>({
    criterionId: '',
    scenarioIds: [],
    conclusion: '',
    scope: '',
    reason: '',
  });
  const [busy, setBusy] = useState<'read' | 'save' | null>(null);
  const [needsRead, setNeedsRead] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const pending = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      pending.current?.abort();
      pending.current = null;
    },
    [],
  );
  async function read() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setOpened(true);
    setBusy('read');
    setError('');
    setMessage('');
    // The prior key may no longer describe the current context, even if this read fails.
    setNeedsRead(true);
    try {
      const next = await loadReview(revisionId, receiptId, controller.signal, 'fr');
      if (controller.signal.aborted) return;
      setReview(next);
      setNeedsRead(false);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Lecture impossible.');
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null;
        setBusy(null);
      }
    }
  }
  async function save() {
    if (pending.current || needsRead || !canSubmitCoverage(review, draft) || !review) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy('save');
    setError('');
    setMessage('');
    let saved = false;
    try {
      await readResponse(
        await fetch('/api/coverage-review', {
          method: 'POST',
          credentials: 'same-origin',
          signal: controller.signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            version: review.version,
            revisionId,
            receiptId,
            reviewKey: review.reviewKey,
            ...draft,
            scope: draft.scope.trim(),
            reason: draft.reason.trim(),
          }),
        }),
        'fr',
      );
      if (controller.signal.aborted) return;
      setNeedsRead(true);
      saved = true;
      setMessage('Appréciation enregistrée. Aucun contrôle relancé ni version adoptée.');
      onSaved();
      const next = await loadReview(revisionId, receiptId, controller.signal, 'fr');
      if (!controller.signal.aborted) setReview(next);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setNeedsRead(true);
        setError(
          (saved ? 'Appréciation enregistrée, mais relecture indisponible. ' : '') +
            (cause instanceof Error ? cause.message : 'Enregistrement impossible.') +
            ' Vos saisies sont conservées. Actualisez l’examen avant de confirmer à nouveau.',
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null;
        setBusy(null);
      }
    }
  }
  return {
    opened,
    review,
    draft,
    setDraft,
    busy,
    needsRead,
    error: localizeMessage(error, locale),
    message: localizeMessage(message, locale),
    read,
    save,
  };
}
