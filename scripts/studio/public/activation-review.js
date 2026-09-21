import { createTranslator, subscribeLocale } from './i18n.js';
import { createControlView } from './control-view.js';

let nextDialogId = 0;

/** Local adoption review only. Opening, refreshing or closing never submits an agreement. */
export function createActivationReview({ document, loadReview, activate, onApplied, onError }) {
  const t = createTranslator(document);
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
  const prefix = 'activation-review-' + ++nextDialogId;
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
  const title = node('h2', () => t('Utiliser cette version', 'Use this version'));
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
        'Cette adoption locale ne relance pas l’agent et ne valide pas les critères du projet.',
        'This local adoption does not restart the agent or validate project criteria.',
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
    t('Pourquoi souhaitez-vous utiliser cette version ?', 'Why do you want to use this version?'),
  );
  const reason = node('textarea');
  reason.id = prefix + '-reason';
  reason.name = 'reason';
  reason.required = true;
  reason.maxLength = 4000;
  reason.rows = 3;
  reason.autocomplete = 'off';
  label.htmlFor = reason.id;
  const refresh = button(
    () => t('Actualiser l’examen', 'Refresh review'),
    () => void read(),
  );
  const submit = node('button', () => t('Utiliser cette version', 'Use this version'), 'primary');
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
    submit.disabled = loading || saving || needsRefresh || !review?.canActivate;
    setText(submit, () =>
      saving
        ? t('Adoption en cours…', 'Adopting…')
        : t('Utiliser cette version', 'Use this version'),
    );
  }
  function failure(error, message) {
    setText(status, () => message() + (error?.message ? ' ' + error.message : ''));
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
        next.canActivate
          ? next.admission.reason
          : t('Adoption indisponible : ', 'Adoption unavailable: ') + next.admission.reason,
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
    if (disposed || saving || loading || needsRefresh || !review?.canActivate) return;
    const text = reason.value.trim();
    if (!text) {
      setText(status, () =>
        t(
          'Indiquez une raison avant d’utiliser cette version.',
          'Provide a reason before using this version.',
        ),
      );
      reason.focus();
      return;
    }
    const input = {
      version: review.version,
      id: selectedId,
      reviewKey: review.reviewKey,
      reason: text,
    };
    saving = true;
    setText(status, () => t('Enregistrement de votre choix…', 'Saving your choice…'));
    controls();
    try {
      const result = await activate(input);
      if (disposed) return;
      saving = false;
      onApplied(result);
      dialog.close();
    } catch (error) {
      if (!disposed) {
        needsRefresh = true;
        failure(error, () =>
          t(
            'Votre raison est conservée. Actualisez l’examen avant une nouvelle confirmation.',
            'Your reason is preserved. Refresh the review before confirming again.',
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
