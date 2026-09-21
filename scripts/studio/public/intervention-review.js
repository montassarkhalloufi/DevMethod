import { createTranslator, getLocale, subscribeLocale } from './i18n.js';
import { createControlView, describeInterventionReview } from './control-view.js';

let nextId = 0;

/** Explicit local assessment; reads never authorize a supplier call or adoption. */
export function createInterventionReview({ document, loadReview, saveReview, onApplied, onError }) {
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
  const choices = [
    ['affected', () => t('Concerné', 'Affected')],
    ['not-affected', () => t('Non concerné dans ce périmètre', 'Not affected within this scope')],
    ['unknown', () => t('Inconnu', 'Unknown')],
  ];
  const prefix = 'intervention-review-' + ++nextId;
  const listeners = [];
  const node = (tag, text = '', className = '') => {
    const result = document.createElement(tag);
    if (typeof text === 'function') setText(result, text);
    else result.textContent = text;
    result.className = className;
    return result;
  };
  function listen(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  }
  function button(text, handler) {
    const result = node('button', text);
    result.type = 'button';
    listen(result, 'click', handler);
    return result;
  }
  function list(values) {
    const result = node('ul');
    result.append(...values.map((value) => node('li', value)));
    return result;
  }
  function disclosure(title, ...content) {
    const result = node('details');
    result.style.overflowWrap = 'anywhere';
    result.append(node('summary', title), ...content);
    return result;
  }
  const dialog = node('dialog', '', 'activation-review-dialog intervention-review-dialog');
  dialog.setAttribute('aria-labelledby', prefix + '-title');
  const header = node('header', '', 'activation-review-header');
  const title = node('h2', () => t('Examiner les conséquences', 'Review consequences'));
  title.id = prefix + '-title';
  let generation = 0,
    controller,
    review = null,
    selectedId,
    previousFocus;
  let loading = false,
    saving = false,
    disposed = false,
    needsRefresh = false;
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
        'Cette écriture ne relance aucun fournisseur, ne change ni permissions ni budget et n’adopte pas de version. Les risques restent visibles même si leurs conséquences locales sont acceptées.',
        'Saving does not restart a provider, change permissions or budgets, or adopt a version. Risks remain visible even when their local consequences are accepted.',
      ),
    'muted',
  );
  const availability = node('p');
  const facts = node('section');
  facts.setAttribute(
    'aria-label',
    t('Faits et indices de conséquences', 'Facts and indications of consequences'),
  );
  const control = node('div', '', 'activation-review-control');
  const form = node('form');
  function field(labelText, name, values) {
    const label = node('label', labelText);
    const input = node(values ? 'select' : 'textarea');
    input.name = name;
    input.id = prefix + '-' + name;
    input.required = true;
    label.htmlFor = input.id;
    if (values)
      for (const [value, text] of [
        ['', () => t('Choisir explicitement', 'Choose explicitly')],
        ...values,
      ]) {
        const option = node('option', text);
        option.value = value;
        input.append(option);
      }
    else {
      input.rows = 3;
      input.maxLength = name === 'scope' ? 2000 : 4000;
    }
    const group = node('div', '', 'delegation-field');
    group.style.marginBlock = '12px';
    group.append(label, input);
    form.append(group);
    listen(input, 'change', controls);
    listen(input, 'input', controls);
    return input;
  }
  form.append(
    node('h3', () =>
      t(
        'Appréciation locale, distincte des faits et indices',
        'Local assessment, separate from facts and indications',
      ),
    ),
  );
  const persistentData = field(
    () => t('Données persistantes', 'Persistent data'),
    'persistentData',
    choices,
  );
  const contractChanged = field(
    () => t('Contrats consommés', 'Consumed contracts'),
    'contractChanged',
    choices,
  );
  const resolution = field(
    () => t('Suite donnée à cette intervention', 'Resolution of this intervention'),
    'resolution',
    [
      [
        'accept-local',
        () =>
          t(
            'Accepter les conséquences dans ce périmètre local',
            'Accept consequences within this local scope',
          ),
      ],
      ['keep-stopped', () => t('Maintenir l’arrêt', 'Keep stopped')],
    ],
  );
  const scope = field(
    () => t('Périmètre de cette appréciation', 'Scope of this assessment'),
    'scope',
  );
  const reason = field(() => t('Justification', 'Reason'), 'reason');
  const constraint = node('p');
  const refresh = button(
    () => t('Actualiser l’examen', 'Refresh review'),
    () => void read(),
  );
  const submit = node(
    'button',
    () => t('Enregistrer l’appréciation', 'Save assessment'),
    'primary',
  );
  submit.type = 'submit';
  const actions = node('div', '', 'activation-review-actions');
  actions.append(refresh, submit);
  const status = node('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.append(constraint, actions, status);
  dialog.append(header, identity, explanation, availability, facts, control, form);
  document.body.append(dialog);

  function assessmentProblem() {
    if (resolution.value !== 'accept-local') return '';
    if ([persistentData.value, contractChanged.value].includes('unknown'))
      return t(
        'Accepter exige une appréciation sans inconnue.',
        'Acceptance requires an assessment without unknowns.',
      );
    const signals = review?.consequences?.signals ?? [];
    if (
      (persistentData.value === 'not-affected' &&
        (review?.consequences?.data?.nonEmpty === true ||
          signals.some((entry) => entry.kind === 'persistent-data'))) ||
      (contractChanged.value === 'not-affected' &&
        signals.some((entry) => entry.kind === 'contract-changed'))
    )
      return t(
        'Un indice positif contredit une appréciation « non concerné ». Maintenez l’arrêt ou réexaminez votre appréciation.',
        'A positive indication contradicts a “not affected” assessment. Keep stopped or reconsider your assessment.',
      );
    return '';
  }
  function controls() {
    close.disabled = saving;
    refresh.disabled = saving || loading;
    for (const field of [persistentData, contractChanged, resolution, scope, reason])
      field.disabled = saving;
    setText(constraint, () => assessmentProblem());
    submit.disabled =
      saving ||
      loading ||
      needsRefresh ||
      !review?.canReview ||
      Boolean(constraint.textContent) ||
      scope.value.trim().length > 2000 ||
      reason.value.trim().length > 4000 ||
      ![
        persistentData.value,
        contractChanged.value,
        resolution.value,
        scope.value.trim(),
        reason.value.trim(),
      ].every(Boolean);
  }
  function renderReview(next) {
    review = next;
    setText(identity, () =>
      t('{value0} · {value1} · Base : {value2}', '{value0} · {value1} · Base: {value2}', {
        value0: next.revision.title,
        value1: next.revision.id,
        value2: next.base ? next.base.title + ' · ' + next.base.id : t('aucune base', 'no base'),
      }),
    );
    setText(availability, () =>
      next.canReview
        ? t(
            'Contexte disponible pour une appréciation explicite.',
            'Context available for an explicit assessment.',
          )
        : t('Examen indisponible : ', 'Review unavailable: ') +
          (next.reason || t('contexte non admissible', 'context not admissible')),
    );
    const consequences = next.consequences;
    const data = consequences.data;
    facts.replaceChildren(
      node('h3', () => t('Faits observés', 'Observed facts')),
      node('p', () =>
        t(
          'Données locales : {value0} · version {value1} · {value2} · {value3} octets. Aucune valeur privée affichée.',
          'Local data: {value0} · version {value1} · {value2} · {value3} bytes. No private values displayed.',
          {
            value0: {
              available: t('disponibles', 'available'),
              missing: t('absentes', 'missing'),
              unavailable: t('indisponibles', 'unavailable'),
            }[data.status],
            value1: data.version ?? t('inconnue', 'unknown'),
            value2:
              data.nonEmpty === null
                ? t('contenu inconnu', 'unknown contents')
                : data.nonEmpty
                  ? t('non vides', 'not empty')
                  : t('vides', 'empty'),
            value3: data.bytes.toLocaleString(getLocale(document)),
          },
        ),
      ),
      list(
        consequences.changes.map(
          (change) =>
            `${{ added: t('Ajouté', 'Added'), modified: t('Modifié', 'Modified'), removed: t('Supprimé', 'Removed') }[change.kind]} : ${change.path}`,
        ),
      ),
      node('h3', () =>
        t(
          'Indices à examiner — ne prouvent pas à eux seuls un impact',
          'Indications to review — do not establish impact on their own',
        ),
      ),
      list(
        consequences.signals.map(
          (signal) =>
            `${signal.kind === 'persistent-data' ? t('Données persistantes', 'Persistent data') : t('Contrat consommé', 'Consumed contract')} : ${signal.path}${signal.line ? ':' + signal.line : ''}`,
        ),
      ),
      node(
        'p',
        () =>
          consequences.issue ||
          t('Aucun problème de lecture signalé.', 'No reading problems reported.'),
      ),
      disclosure(
        () => t('Identités de l’examen', 'Review identities'),
        node('p', () =>
          t(
            'Protocole {value0} · empreinte {value1} · base {value2} · contexte {value3}',
            'Protocol {value0} · fingerprint {value1} · base {value2} · context {value3}',
            {
              value0: consequences.protocol,
              value1: consequences.fingerprint,
              value2: consequences.baseFingerprint ?? t('absente', 'missing'),
              value3: consequences.contextFingerprint,
            },
          ),
        ),
      ),
      disclosure(
        () =>
          t('Appréciations conservées ({value0})', 'Preserved assessments ({value0})', {
            value0: consequences.reviews.length.toLocaleString(getLocale(document)),
          }),
        ...consequences.reviews.map((entry) =>
          list(describeInterventionReview(entry, getLocale(document))),
        ),
      ),
      node('h3', () => t('Limites', 'Limitations')),
      list(consequences.limits),
    );
    control.replaceChildren(...createControlView(document, next.control, selectedId, prefix + '-'));
  }
  function showLoadedMessage({ preserveMessage, refreshing }) {
    if (preserveMessage) return;
    setText(status, () =>
      refreshing
        ? t(
            'Examen actualisé. Vos saisies sont conservées ; confirmez de nouveau après lecture.',
            'Review refreshed. Your entries are preserved; confirm again after reading.',
          )
        : t(
            'Examen chargé. Aucune appréciation n’est présélectionnée à l’ouverture.',
            'Review loaded. No assessment is preselected on opening.',
          ),
    );
  }
  async function read(preserveMessage = false) {
    if (disposed || saving || !dialog.open) return;
    controller?.abort();
    controller = new AbortController();
    const refreshing = review !== null;
    const signal = controller.signal,
      request = ++generation;
    loading = true;
    needsRefresh = true;
    if (!preserveMessage) setText(status, () => t('Lecture de l’examen…', 'Loading review…'));
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
      renderReview(next);
      needsRefresh = false;
      showLoadedMessage({ preserveMessage, refreshing });
    } catch (error) {
      if (!disposed && !signal.aborted && request === generation) {
        setText(
          status,
          () =>
            (preserveMessage
              ? t(
                  'Appréciation enregistrée ; relecture indisponible. ',
                  'Assessment saved; reloading unavailable. ',
                )
              : t('Examen indisponible. ', 'Review unavailable. ')) + error.message,
        );
        onError?.(error);
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
    controls();
    if (disposed || submit.disabled) return;
    const input = {
      version: review.version,
      revisionId: selectedId,
      reviewKey: review.reviewKey,
      resolution: resolution.value,
      assessment: { persistentData: persistentData.value, contractChanged: contractChanged.value },
      scope: scope.value.trim(),
      reason: reason.value.trim(),
    };
    const request = generation;
    saving = true;
    setText(status, () => t('Enregistrement de l’appréciation…', 'Saving assessment…'));
    controls();
    try {
      const result = await saveReview(input);
      if (disposed || request !== generation) return;
      setText(status, () =>
        t(
          'Appréciation enregistrée. Aucun fournisseur relancé, aucune version adoptée.',
          'Assessment saved. No provider restarted, no version adopted.',
        ),
      );
      needsRefresh = true;
      saving = false;
      onApplied?.(result);
      await read(true);
    } catch (error) {
      if (!disposed && request === generation) {
        needsRefresh = true;
        setText(
          status,
          () =>
            error.message +
            t(
              ' Vos saisies sont conservées. Actualisez l’examen avant une nouvelle confirmation.',
              ' Your entries are preserved. Refresh the review before confirming again.',
            ),
        );
        onError?.(error);
      }
    } finally {
      if (!disposed) {
        saving = false;
        controls();
      }
    }
  }
  listen(form, 'submit', confirm);
  listen(dialog, 'cancel', (event) => {
    if (saving) event.preventDefault();
  });
  listen(dialog, 'close', () => {
    if (dialog.open) return;
    generation++;
    controller?.abort();
    review = null;
    loading = false;
    if (previousFocus?.isConnected) previousFocus.focus();
  });
  const unsubscribeLocale = subscribeLocale(() => {
    if (disposed) return;
    updateTexts();
    facts.setAttribute(
      'aria-label',
      t('Faits et indices de conséquences', 'Facts and indications of consequences'),
    );
    if (review) {
      const expanded = [...dialog.querySelectorAll('details')].map((node) => node.open);
      renderReview(review);
      [...dialog.querySelectorAll('details')].forEach((node, index) => {
        node.open = expanded[index] ?? false;
      });
    }
    controls();
  }, document.defaultView);
  return {
    open(revisionId) {
      if (disposed || saving) return;
      selectedId = revisionId;
      review = null;
      needsRefresh = false;
      for (const field of [persistentData, contractChanged, resolution, scope, reason])
        field.value = '';
      setText(identity, () => t('Version : ', 'Version: ') + revisionId);
      setText(availability, () => '');
      facts.replaceChildren();
      control.replaceChildren();
      if (!dialog.open) {
        previousFocus = document.activeElement;
        dialog.showModal();
      }
      return read();
    },
    dispose() {
      disposed = true;
      unsubscribeLocale();
      textBindings.clear();
      generation++;
      controller?.abort();
      for (const remove of listeners) remove();
      if (dialog.open) dialog.close();
      dialog.remove();
    },
  };
}
