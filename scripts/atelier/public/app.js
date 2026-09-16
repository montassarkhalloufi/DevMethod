import { el, button, paragraph, heading, field, select, laneView, contextView } from './views.js';
import { controlChoices, hasIndividualTrials } from './controls.js';

let state;
let busy = false;
const draft = {
  actorId: '',
  actionId: '',
  recordId: '',
  variantId: '',
  createVariant: '',
  createAction: '',
  reason: '',
  title: '',
};
const root = document.querySelector('#app');
const notice = document.querySelector('#notice');
const baseline = new URLSearchParams(location.search).get('mode') === 'simple';
const single = new URLSearchParams(location.search).get('variant');

function report(message, error = false) {
  const dialog = document.querySelector('dialog[open]');
  if (dialog) dialog.querySelector('.dialog-head').after(notice);
  else document.body.append(notice);
  notice.textContent = message;
  notice.classList.toggle('error', error);
  notice.setAttribute('role', error ? 'alert' : 'status');
  if (dialog) notice.scrollIntoView({ block: 'nearest' });
}

async function load() {
  try {
    const response = await fetch('/api/session');
    if (!response.ok) throw new Error('Impossible de lire cet atelier.');
    state = await response.json();
    render();
  } catch (error) {
    report(error.message, true);
  }
}

async function change(route, input) {
  if (busy) return null;
  busy = true;
  root.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/' + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: state.storageVersion, ...input }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'La modification n’a pas été enregistrée.');
    state = result;
    render();
    report('Modification enregistrée localement.');
    return result;
  } catch (error) {
    report(error.message, true);
    return null;
  } finally {
    busy = false;
    root.removeAttribute('aria-busy');
  }
}

const act = (action) => change('action', { action });

function confirmReset(message, action) {
  const dialog = document.querySelector('#reset-dialog');
  document.querySelector('#reset-message').textContent = message;
  document.querySelector('#confirm-reset').onclick = () => {
    dialog.close();
    action();
  };
  dialog.showModal();
}

function choices(project) {
  const { transitions, records } = controlChoices(project, state.session.lanes);
  draft.actorId ||= project.actors.find((actor) => actor.id === 'sam')?.id ?? project.actors[0].id;
  if (!transitions.some((action) => action.id === draft.actionId))
    draft.actionId = transitions[0]?.id ?? '';
  if (!records.some((record) => record.id === draft.recordId))
    draft.recordId = records[0]?.id ?? '';
  draft.createVariant ||= project.variants[0].id;
  return { transitions, records };
}

function newRecordForm(project) {
  const target = single ?? (baseline ? draft.createVariant : undefined);
  const { creations } = controlChoices(project, state.session.lanes, target);
  if (!creations.some((action) => action.id === draft.createAction))
    draft.createAction = creations[0]?.id ?? '';
  const add = el(
    'form',
    {
      className: 'new-record',
      onSubmit: async (event) => {
        event.preventDefault();
        const actionId = draft.createAction;
        if (!actionId) return report('Ce projet ne propose pas de création.', true);
        const variantId = single ?? (baseline ? draft.createVariant : undefined);
        const result = await act({
          ...(variantId ? { variantId } : {}),
          actionId,
          actorId: draft.actorId,
          recordId: 'item-' + crypto.randomUUID().slice(0, 8),
          title: draft.title,
        });
        if (result && result.outcomes?.some((item) => item.allowed)) {
          draft.title = '';
          render();
        }
      },
    },
    [
      field(
        'Ajouter un élément fictif',
        'new-title',
        el('input', {
          value: draft.title,
          maxlength: '140',
          required: true,
          placeholder: 'Un élément à essayer…',
          onInput: (event) => {
            draft.title = event.target.value;
          },
        }),
      ),
    ],
  );
  if (baseline && !single)
    add.append(
      field(
        'Dans quel prototype ?',
        'create-variant',
        select(project.variants, draft.createVariant, (value) => {
          draft.createVariant = value;
          render();
        }),
      ),
    );
  if (creations.length > 1)
    add.append(
      field(
        'Type de création',
        'create-action',
        select(creations, draft.createAction, (value) => {
          draft.createAction = value;
        }),
      ),
    );
  if (!creations.length)
    add.append(paragraph('Aucune création proposée dans ce fonctionnement.', 'muted'));
  add.append(
    el('button', {
      type: 'submit',
      text: baseline || single ? 'Ajouter à ce prototype' : 'Ajouter aux prototypes',
      disabled: !creations.length,
    }),
  );
  return add;
}

function commonControls(project) {
  const { transitions, records } = choices(project);
  const controls = el('section', { className: 'situation', 'aria-label': 'Situation commune' }, [
    el('div', { className: 'situation-title' }, [
      paragraph(baseline ? 'PROTOTYPES ORDINAIRES' : 'UNE SITUATION À EXPLORER', 'eyebrow'),
      heading(
        2,
        baseline || single
          ? 'Essayez chaque fonctionnement.'
          : 'Même situation. Plusieurs fonctionnements.',
      ),
      paragraph(
        'Changez d’acteur, essayez une action, observez ce qui se passe. Aucun envoi ni publication externe.',
        'muted',
      ),
    ]),
  ]);
  const row = el('div', { className: 'controls' }, [
    field(
      'Agir en tant que',
      'actor',
      select(project.actors, draft.actorId, (value) => {
        draft.actorId = value;
        render();
      }),
    ),
  ]);
  if (!baseline && !single) {
    row.append(
      field(
        'Sur quel élément ?',
        'record',
        select(records, draft.recordId, (value) => {
          draft.recordId = value;
        }),
      ),
    );
    row.append(
      field(
        'Action à essayer',
        'action',
        select(transitions, draft.actionId, (value) => {
          draft.actionId = value;
        }),
      ),
    );
    row.append(
      button(
        'Essayer dans chaque prototype',
        () => act({ actionId: draft.actionId, actorId: draft.actorId, recordId: draft.recordId }),
        { className: 'primary', disabled: !draft.recordId || !draft.actionId },
      ),
    );
  }
  controls.append(row);
  if (!transitions.length)
    controls.append(
      paragraph(
        'Ces prototypes ne proposent aucune transition. Le contexte et les décisions restent accessibles.',
        'muted',
      ),
    );
  controls.append(newRecordForm(project));
  return controls;
}

function situationHistory() {
  const steps = state.session.situation;
  const history = el('section', { className: 'history-bar' }, [
    paragraph(
      steps.length
        ? steps.length + ' action(s) dans la situation commune'
        : 'Aucune situation commune enregistrée.',
      'muted',
    ),
    button(
      'Rejouer depuis le début',
      () => {
        if (!hasIndividualTrials(state.session)) return change('replay', {});
        confirmReset(
          'Le rejeu repart des données initiales et remplace les essais effectués dans un seul prototype. Les observations liées aux choix conservés restent dans le dossier.',
          () => change('replay', {}),
        );
      },
      { disabled: !steps.length },
    ),
    button('Recommencer les essais', () => {
      confirmReset(
        'Revenir aux données fictives de départ ? Votre décision reste conservée, mais les essais et éléments ajoutés seront réinitialisés.',
        () => change('replay', { steps: [] }),
      );
    }),
  ]);
  if (steps.length)
    history.append(
      el('details', {}, [
        el('summary', { text: 'Voir la suite d’actions' }),
        el(
          'ol',
          {},
          steps.map((step) =>
            el('li', {
              text: step.actorId + ' → ' + step.actionId + ' · ' + (step.title ?? step.recordId),
            }),
          ),
        ),
      ]),
    );
  return history;
}

function decisionView(project) {
  if (!project.variants.some((variant) => variant.id === draft.variantId))
    draft.variantId = state.session.decision?.variantId ?? project.variants[0].id;
  const form = el(
    'form',
    {
      className: 'decision-form',
      onSubmit: (event) => {
        event.preventDefault();
        change('decision', { decision: { variantId: draft.variantId, reason: draft.reason } });
      },
    },
    [
      field(
        'Fonctionnement retenu',
        'choice',
        select(project.variants, draft.variantId, (value) => {
          draft.variantId = value;
        }),
      ),
      field(
        'Pourquoi ce choix, et quel compromis acceptez-vous ?',
        'reason',
        el('textarea', {
          value: draft.reason,
          required: true,
          rows: '2',
          maxlength: '4000',
          placeholder: 'Ce fonctionnement répond à… J’accepte de…',
          onInput: (event) => {
            draft.reason = event.target.value;
          },
        }),
      ),
      el('button', { type: 'submit', className: 'primary', text: 'Conserver ce choix' }),
    ],
  );
  const section = el('section', { className: 'decision-panel' }, [
    paragraph('DÉCIDER À PARTIR DE CE QUE VOUS AVEZ ESSAYÉ', 'eyebrow'),
    heading(2, 'Quel fonctionnement voulez-vous garder ?'),
    form,
  ]);
  const chosen = state.session.decision;
  if (chosen) {
    section.append(
      el('div', { className: 'saved-decision ' + (chosen.reviewNeeded ? 'needs-review' : '') }, [
        el('strong', {
          text: chosen.reviewNeeded
            ? 'Besoin modifié · choix à reconsidérer'
            : 'Votre choix est conservé',
        }),
        paragraph(chosen.variant.title + ' — ' + chosen.reason),
        paragraph(
          'Choix fait sur la révision ' +
            chosen.revision +
            '. Révision actuelle : ' +
            state.session.revision +
            '.',
          'muted',
        ),
        el('a', {
          href: '/?variant=' + encodeURIComponent(chosen.variantId),
          target: '_blank',
          rel: 'noopener',
          text: 'Utiliser ce prototype ↗',
        }),
        el('a', {
          href: '/api/export',
          text: 'Télécharger le dossier de décision',
          className: 'export-link',
        }),
      ]),
    );
  }
  if (state.session.history.length)
    section.append(
      paragraph(
        state.session.history.length +
          ' décision(s) antérieure(s) conservée(s) dans le dossier exporté.',
        'muted',
      ),
    );
  return section;
}

function render() {
  const focusId = document.activeElement?.id;
  const project = state.session.project;
  const shown = single
    ? project.variants.filter((variant) => variant.id === single)
    : project.variants;
  root.replaceChildren(
    el('div', { className: 'project-head' }, [
      el('div', {}, [
        paragraph('PROJET / RÉVISION ' + state.session.revision, 'eyebrow'),
        heading(1, project.title),
        paragraph(project.brief.split('\n')[0], 'subtitle'),
      ]),
      el('div', { className: 'head-actions' }, [
        button('Contexte du projet', openContext),
        button('Préparer une exploration', openAgent, { className: 'primary' }),
      ]),
    ]),
    commonControls(project),
  );
  if (single)
    root.append(el('a', { href: '/', text: '← Revenir à la comparaison', className: 'back-link' }));
  const lanes = el('div', { className: 'lanes' + (single ? ' single' : '') });
  shown.forEach((variant, index) =>
    lanes.append(
      laneView(variant, state.session.lanes[variant.id], index, draft.actorId, act, project.actors),
    ),
  );
  root.append(lanes);
  if (!single && !baseline) root.append(situationHistory());
  root.append(decisionView(project));
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}

function openContext() {
  document.querySelector('#context-content').replaceChildren(
    contextView(state.session.project, async (intent) => {
      if (await change('intent', { intent })) document.querySelector('#context-dialog').close();
    }),
  );
  document.querySelector('#context-dialog').showModal();
}

function openAgent() {
  document.querySelector('#request-history').replaceChildren(
    heading(3, 'Demandes préparées'),
    ...state.session.requests
      .filter((request) => request.id)
      .map((request) =>
        el('p', {}, [
          el('a', {
            href: '/api/request/' + request.id,
            text: request.question,
            target: '_blank',
            rel: 'noopener',
          }),
        ]),
      ),
  );
  document.querySelector('#agent-dialog').showModal();
}

function requestResult(result) {
  const request = result.request;
  const text =
    'Explore la demande DevMethod Atelier dans ' +
    request.file +
    '. Lis son contexte et son contrat. Livre une proposition JSON compatible, sans réécrire la session ni exécuter d’action externe. Si la question nécessite d’abord une décision humaine, explique-la au lieu d’inventer la réponse.';
  const link = el('a', {
    href: '/api/request/' + request.id,
    text: 'Télécharger la demande complète',
  });
  const copy = button('Copier pour mon agent', async () => {
    try {
      await navigator.clipboard.writeText(text);
      report('Demande copiée. Aucune génération n’a été lancée.');
    } catch {
      report('Copie indisponible. Sélectionnez le texte de la demande ci-dessous.', true);
    }
  });
  document.querySelector('#request-result').replaceChildren(
    heading(3, 'Demande prête, à confier à votre agent'),
    paragraph(
      'Le fichier est enregistré localement. Son statut ne signifie pas qu’un agent travaille.',
    ),
    el('textarea', {
      readonly: '',
      rows: '4',
      value: text,
      'aria-label': 'Demande à transmettre à l’agent',
    }),
    copy,
    link,
  );
}

document.querySelector('#request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await change('request', { question: document.querySelector('#question').value });
  if (result) requestResult(result);
});
document.querySelector('#proposal-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file?.size > 512 * 1024) return report('Ce fichier dépasse 512 Ko.', true);
  if (file) document.querySelector('#proposal').value = await file.text();
});
document.querySelector('#proposal-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const proposal = JSON.parse(document.querySelector('#proposal').value);
    if (await change('proposal', { proposal })) {
      document.querySelector('#agent-dialog').close();
      report(
        'Proposition importée. Les données sont conservées ; essayez les nouveaux comportements.',
      );
    }
  } catch {
    report(
      'Le JSON de la proposition est invalide. Son contenu est conservé pour correction.',
      true,
    );
  }
});
for (const close of document.querySelectorAll('[data-close]'))
  close.addEventListener('click', () => document.getElementById(close.dataset.close).close());
document.querySelector('#reload').addEventListener('click', load);
load();
