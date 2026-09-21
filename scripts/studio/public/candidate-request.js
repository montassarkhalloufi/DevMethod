import { createTranslator, subscribeLocale } from './i18n.js';
import { createControlView } from './control-view.js';

const serverMessages = [
  ['Candidat introuvable.', 'Candidate not found.'],
  [
    'Le candidat ne provient pas d’une demande terminée.',
    'The candidate does not come from a completed request.',
  ],
  ['Cette version est déjà active.', 'This version is already active.'],
  ['La base du candidat a changé.', 'The candidate’s base has changed.'],
  ['Ce candidat a été écarté.', 'This candidate was discarded.'],
  ['Un autre candidat attend une décision.', 'Another candidate awaits a decision.'],
  [
    'Une demande liée à ce candidat est déjà en attente ou en cours.',
    'A request linked to this candidate is already queued or running.',
  ],
  [
    'Les fichiers de ce candidat seront utilisés ; la version active est conservée.',
    'This candidate’s files will be used; the active version is preserved.',
  ],
  [
    'Le candidat ou son contexte a changé ; actualisez avant d’envoyer.',
    'The candidate or its context has changed; refresh before submitting.',
  ],
  ['Demande liée au candidat invalide.', 'Invalid candidate-linked request.'],
  [
    'Les fichiers locaux diffèrent de la version enregistrée.',
    'Local files differ from the recorded version.',
  ],
  [
    'Sources indisponibles, périmètre dépassé ou chemin non sûr ; aucun résultat positif déduit.',
    'Sources unavailable, scope exceeded or unsafe path; no positive result inferred.',
  ],
];

let nextDialogId = 0;

/** Candidate-scoped request. Reads and refreshes never queue work or adopt a version. */
export function createCandidateRequest({
  document,
  loadReview,
  requestChanges,
  onQueued,
  onError,
}) {
  const t = createTranslator(document);
  function message(value) {
    const pair = serverMessages.find(([fr, en]) => value === fr || value === en);
    return pair ? t(...pair) : value;
  }
  // Only explicitly authored UI messages are rebound; form values and stored data stay intact.
  const textBindings = new Map();
  function setText(element, render) {
    textBindings.set(element, render);
    element.textContent = render();
  }
  function updateTexts() {
    for (const [element, render] of textBindings) {
      if (element.isConnected) element.textContent = render();
      else textBindings.delete(element);
    }
  }
  const prefix = 'candidate-request-' + ++nextDialogId;
  const dialog = document.createElement('dialog');
  dialog.className = 'activation-review-dialog';
  const removeButtonListeners = [];
  dialog.setAttribute('aria-labelledby', prefix + '-title');
  function node(tag, text = '', className = '') {
    const result = document.createElement(tag);
    if (typeof text === 'function') setText(result, text);
    else result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  function button(text, action) {
    const result = node('button', text);
    result.type = 'button';
    result.addEventListener('click', action);
    removeButtonListeners.push(() => result.removeEventListener('click', action));
    return result;
  }
  let generation = 0,
    controller,
    selectedId,
    review;
  let saving = false,
    loading = false,
    disposed = false,
    needsRefresh = false;
  let previousFocus;
  const header = node('header', '', 'activation-review-header');
  const title = node('h2', () => t('Corriger cette version', 'Request changes'));
  title.id = prefix + '-title';
  const close = button(
    () => t('Fermer', 'Close'),
    () => {
      if (!saving) dialog.close();
    },
  );
  header.append(title, close);
  const identity = node('p');
  const explanation = node(
    'p',
    () =>
      t(
        'La confirmation met une correction de cette version en attente. Elle ne l’active pas. Les limites, autorisations et arrêts de l’agent restent applicables ; un agent désactivé ne démarre pas automatiquement.',
        'Confirmation queues changes to this version; it does not activate it. Agent limits, permissions and stops still apply; a disabled agent does not start automatically.',
      ),
    'muted',
  );
  const status = node('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const admission = node('p');
  const control = node('div', '', 'activation-review-control');
  const form = node('form');
  const label = node('label', () =>
    t('Que faut-il corriger dans cette version ?', 'What should change in this version?'),
  );
  const reason = node('textarea');
  reason.id = prefix + '-reason';
  reason.name = 'request';
  reason.required = true;
  reason.maxLength = 20000;
  reason.rows = 3;
  reason.autocomplete = 'off';
  label.htmlFor = reason.id;
  const refresh = button(
    () => t('Actualiser l’examen', 'Refresh review'),
    () => void read(),
  );
  const submit = node('button', () => t('Corriger cette version', 'Request changes'), 'primary');
  submit.type = 'submit';
  const actions = node('div', '', 'activation-review-actions');
  actions.append(refresh, submit);
  form.append(label, reason, actions);
  dialog.append(header, identity, explanation, status, admission, control, form);
  document.body.append(dialog);

  function controls() {
    close.disabled = saving;
    refresh.disabled = loading || saving;
    reason.disabled = saving;
    submit.disabled = loading || saving || needsRefresh || !review?.canRequest;
    setText(submit, () =>
      saving ? t('Mise en attente…', 'Queuing…') : t('Corriger cette version', 'Request changes'),
    );
  }
  function failure(error, guidance) {
    setText(status, () => guidance() + (error?.message ? ' ' + message(error.message) : ''));
    onError?.(error);
  }
  async function read() {
    if (disposed || saving || !dialog.open) return;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const request = ++generation;
    loading = true;
    review = null;
    setText(status, () => t('Lecture de l’examen…', 'Loading review…'));
    controls();
    try {
      const next = await loadReview(selectedId, signal);
      if (disposed || signal.aborted || request !== generation || !dialog.open) return;
      if (next.revision?.id !== selectedId)
        throw new Error(
          t(
            'La version reçue ne correspond pas à la version demandée.',
            'The received version does not match the requested version.',
          ),
        );
      review = next;
      needsRefresh = false;
      setText(identity, () => `${next.revision.title} · ${next.revision.id}`);
      setText(admission, () =>
        next.canRequest
          ? message(next.reason)
          : t('Demande indisponible : ', 'Request unavailable: ') + message(next.reason),
      );
      control.replaceChildren(
        ...createControlView(document, next.control, selectedId, prefix + '-'),
      );
      setText(status, () =>
        t(
          'Examen chargé. Lisez les preuves et les limites, puis confirmez votre choix si vous le souhaitez.',
          'Review loaded. Read the evidence and limitations, then confirm your choice if you wish.',
        ),
      );
    } catch (error) {
      if (!disposed && !signal.aborted && request === generation) {
        review = null;
        failure(error, () =>
          t(
            'Examen indisponible. Actualisez pour réessayer.',
            'Review unavailable. Refresh to try again.',
          ),
        );
      }
    } finally {
      if (!disposed && request === generation) {
        loading = false;
        controls();
      }
    }
  }
  async function confirm(event) {
    event.preventDefault();
    if (disposed || saving || loading || needsRefresh || !review?.canRequest) return;
    const text = reason.value.trim();
    if (!text) {
      setText(status, () =>
        t(
          'Décrivez la correction avant de confirmer.',
          'Describe the requested change before confirming.',
        ),
      );
      reason.focus();
      return;
    }
    const input = {
      version: review.version,
      revisionId: selectedId,
      reviewKey: review.reviewKey,
      request: text,
    };
    const submission = generation;
    saving = true;
    setText(status, () => t('Mise en attente de la correction…', 'Queuing requested changes…'));
    controls();
    try {
      const result = await requestChanges(input);
      if (disposed || submission !== generation || !dialog.open) return;
      saving = false;
      onQueued(result);
      dialog.close();
    } catch (error) {
      if (!disposed && submission === generation && dialog.open) {
        needsRefresh = true;
        failure(error, () =>
          t(
            'Votre demande est conservée. Actualisez l’examen avant une nouvelle confirmation.',
            'Your request is preserved. Refresh the review before confirming again.',
          ),
        );
      }
    } finally {
      if (!disposed) {
        saving = false;
        controls();
      }
    }
  }
  function cancelled(event) {
    if (saving) event.preventDefault();
  }
  function closed() {
    // Native close events may arrive after another open in the same turn.
    if (dialog.open) return;
    generation++;
    controller?.abort();
    review = null;
    loading = false;
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  form.addEventListener('submit', confirm);
  dialog.addEventListener('cancel', cancelled);
  dialog.addEventListener('close', closed);
  const unsubscribeLocale = subscribeLocale(() => {
    if (disposed) return;
    updateTexts();
    if (review) {
      const expanded = [...control.querySelectorAll('details')].map((node) => node.open);
      control.replaceChildren(
        ...createControlView(document, review.control, selectedId, prefix + '-'),
      );
      [...control.querySelectorAll('details')].forEach((node, index) => {
        node.open = expanded[index] ?? false;
      });
    }
    controls();
  }, document.defaultView);
  return {
    open(revisionId) {
      if (disposed || saving) return;
      controller?.abort();
      selectedId = revisionId;
      review = null;
      needsRefresh = false;
      reason.value = '';
      setText(identity, () => t('Version : ', 'Version: ') + revisionId);
      setText(admission, () => '');
      control.replaceChildren();
      if (!dialog.open) {
        previousFocus = document.activeElement;
        dialog.showModal();
      }
      return read();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribeLocale();
      textBindings.clear();
      generation++;
      controller?.abort();
      for (const remove of removeButtonListeners) remove();
      form.removeEventListener('submit', confirm);
      dialog.removeEventListener('cancel', cancelled);
      dialog.removeEventListener('close', closed);
      if (dialog.open) dialog.close();
      dialog.remove();
    },
  };
}
