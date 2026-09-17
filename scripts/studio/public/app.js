import { createStudioApi, readReference } from './api.js';
import { createViews } from './views.js';
import { presentation } from './version-presentation.js';
import { createSourceView, comparisonBase } from './source-view.js';
import { createProposalController } from './proposal-controller.js';
import { renderComparison, comparisonURL } from './comparison-view.js';
import { createTechnicalWorkspace } from './technical-workspace.js';
import { createProgressController } from './progress-controller.js';

export function mountStudio({ document, window, api = createStudioApi(), pollMs = 2000 }) {
  const el = (id) => document.getElementById(id);
  const views = createViews(document);
  let technicalWorkspace;
  const sourceView = createSourceView({
    document,
    root: el('source-view'),
    loadSource: (input) =>
      api.source ? api.source(input) : Promise.reject(new Error('Lecture du code indisponible.')),
    copyText: window.navigator.clipboard?.writeText.bind(window.navigator.clipboard),
    allowEdit: true,
    onSelect: (path) => technicalWorkspace?.selectPath(path),
    onApplied: async (result) => {
      followActive = result.activated;
      previewId = result.revision.id;
      proposalController.suspend();
      await refresh();
    },
    onCorrection: prepareCorrection,
  });
  const controller = new window.AbortController();
  technicalWorkspace = createTechnicalWorkspace({
    document,
    window,
    sourceView,
    openPanel,
    refresh,
    comparisonBase,
    showVersion,
    onPrepareRequest: ({ prompt }) => prepareCorrection(prompt),
  });
  const options = { signal: controller.signal };
  const progressController = createProgressController({
    document,
    api,
    onOpenFile(jobId, path) {
      const revision = state?.revisions.findLast((entry) => entry.jobId === jobId);
      if (!revision?.files.some((file) => file.path === path)) return;
      technicalWorkspace.openDeliveredFile(revision.id, path);
    },
  });
  let state;
  let runtime;
  let projectDirty = false;
  let delegationDirty = false;
  let editingProject = null;
  let draftDirty = false;
  let draftTimer;
  let previewId = null;
  let displayedRevisionId = null;
  let frameOrigin = null;
  let followActive = true;
  let chosenDesign = null;
  let selectedElement = null;
  let inspecting = false;
  let refreshing = false;
  let refreshError = null;
  let writes = Promise.resolve();
  const rendered = new Map();
  let activePanel = 'product';
  let comparedProposal = null;
  let availableComparisonProposal = null;
  let comparisonSide = 'proposal';
  let previewTarget = null;
  let journeyWidget, journeyLoading;
  let disposed = false;
  let initialPanel = true;
  const isJourneyHash = () =>
    /^#journey-(foundation|exploration|frame|design|architecture|delivery)(-|$)/.test(
      window.location.hash,
    );
  let lastJourneyHash = isJourneyHash() ? window.location.hash : '#journey-foundation';
  const proposalController = createProposalController({
    document,
    change,
    showComparison(proposal, side, availableProposal = proposal) {
      comparedProposal = proposal;
      availableComparisonProposal = availableProposal;
      comparisonSide = side;
      if (state) preview();
    },
  });

  function openPanel(id, navigation = 'replace') {
    if (!['journey', 'product', 'code', 'choices', 'checks', 'history'].includes(id)) return;
    if (isJourneyHash()) lastJourneyHash = window.location.hash;
    const hash = id === 'journey' ? lastJourneyHash : '#' + id;
    if (navigation !== 'none' && window.location.hash !== hash)
      window.history[navigation === 'push' ? 'pushState' : 'replaceState'](null, '', hash);
    activePanel = id;
    for (const button of document.querySelectorAll('[data-panel]')) {
      const selected = button.dataset.panel === id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      el(button.dataset.panel).hidden = !selected;
    }
    for (const control of ['wide-preview', 'mobile-preview', 'inspect-element', 'open-preview'])
      el(control).hidden = id !== 'product' || (control === 'open-preview' && !displayedRevisionId);
    el('preview-version').hidden =
      !['product', 'code'].includes(id) || (Boolean(comparedProposal) && id === 'product');
    el('proposal-comparison').hidden = id !== 'product' || !availableComparisonProposal;
    el('preview-scenario').hidden = id !== 'product' || !comparedProposal;
    if (id === 'code') updateSource();
    if (id === 'journey') updateJourney();
    technicalWorkspace.update(state, displayedRevisionId, activePanel);
  }
  function prepareStage(stage, request) {
    const existing = el('request').value;
    if (
      existing.trim() &&
      !window.confirm('Remplacer le brouillon par la demande pour ' + stage + ' ?')
    )
      return;
    el('request').value = request;
    markDraftDirty();
    el('request').focus();
  }
  function prepareCorrection(message) {
    const existing = el('request').value;
    if (existing.length + message.length + 2 > 20000) {
      notice(
        'La demande existante est trop longue pour ajouter le diagnostic. Votre texte est conservé.',
        true,
      );
      return;
    }
    technicalWorkspace?.revealConversation();
    el('request').value = existing ? existing + '\n\n' + message : message;
    markDraftDirty();
    el('request').focus();
    notice('Diagnostic ajouté à votre demande. Vous pouvez le compléter puis l’envoyer.');
  }
  function updateJourney() {
    if (!state || activePanel !== 'journey') return;
    const props = {
      state,
      onRequest: prepareStage,
      onOpenPrototype: (id) => {
        showVersion(id);
        openPanel('product', 'push');
      },
      onApproveMaster: async (masterId) => {
        const result = await change('design/master/approve', {
          masterId,
          reason: 'Validation explicite de cet écran maître depuis le parcours.',
        });
        if (!result) throw new Error('Validation non enregistrée. Consultez le message du Studio.');
      },
      onChooseDirection: async (id) => {
        const result = await change('design', {
          id,
          reason:
            'Direction choisie explicitement dans le parcours, écran maître à détailler ensuite.',
        });
        if (!result) throw new Error('Choix non enregistré. Consultez le message du Studio.');
        await refresh();
      },
    };
    if (journeyWidget) return journeyWidget.update(props);
    journeyLoading ??= import('/studio-ui/journey-widget.js')
      .then((module) => {
        if (disposed) return;
        journeyWidget = module.mountJourneyWidget(el('journey-view'), props);
        updateJourney();
      })
      .catch(() => {
        journeyLoading = null;
        el('journey-view').textContent =
          'Le parcours ne peut pas être chargé. Actualisez pour réessayer.';
      });
  }
  function updateSource() {
    if (!state || activePanel !== 'code') return;
    const revision = state.revisions.find((entry) => entry.id === displayedRevisionId) || null;
    void sourceView.showRevision(revision, {
      previousRevision: comparisonBase(state, revision),
      activeRevision: state.activeRevision,
    });
  }
  function effectiveDelegation() {
    return (
      runtime?.delegation ||
      state.project.delegation || {
        structure: state.project.mode === 'delegated' ? 'agent' : 'user',
        visual: 'agent',
        adoption: state.project.mode === 'guided' ? 'user' : 'agent',
      }
    );
  }

  function notice(message, error = false) {
    el('notice').textContent = message;
    el('notice').hidden = !message;
    el('notice').classList.toggle('error', error);
  }
  function region(id, key, content) {
    if (rendered.get(id) === key) return;
    rendered.set(id, key);
    const root = el(id);
    const focused = root.contains(document.activeElement) ? document.activeElement.id : null;
    const open = [...root.querySelectorAll('details')].map((item) => item.open);
    root.replaceChildren(...content());
    root.querySelectorAll('details').forEach((item, index) => {
      item.open = Boolean(open[index]);
    });
    if (focused) el(focused)?.focus();
  }
  function projectInput() {
    return {
      name: el('project-name').value.trim(),
      idea: el('idea').value,
      mode: el('studio-mode').value,
      constraints: el('constraints')
        .value.split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      ...(state?.project.delegation || delegationDirty
        ? {
            delegation: Object.fromEntries(
              ['structure', 'visual', 'adoption'].map((key) => [key, el('delegate-' + key).value]),
            ),
          }
        : {}),
    };
  }
  function syncInputs() {
    if (!projectDirty) {
      el('project-name').value = state.project.name;
      el('idea').value = state.project.idea;
      el('constraints').value = state.project.constraints.join('\n');
      el('studio-mode').value = state.project.mode;
      for (const [key, value] of Object.entries(effectiveDelegation()))
        el('delegate-' + key).value = value;
    }
    if (!draftDirty) el('request').value = state.draft;
    el('project-title').textContent =
      state.project.name ||
      (state.project.idea.trim() ? 'Votre projet' : 'Qu’aimeriez-vous créer ?');
    (el('project-menu-label') || el('project-menu')).textContent =
      state.project.name || 'Mon projet';
    projectPresentation();
  }
  function projectPresentation() {
    const saved = Boolean(state.project.idea.trim());
    editingProject ??= !saved;
    el('project').classList.toggle('compact', !editingProject);
    el('project-form').hidden = !editingProject;
    el('project-intro').hidden = !editingProject;
    el('project-summary').hidden = editingProject;
    el('project-idea-summary').textContent = state.project.idea;
    el('project-mode').textContent = { guided: 'Guidé', devauto: 'DevAuto', delegated: 'Autonome' }[
      state.project.mode
    ];
    el('project-unsaved').hidden = !projectDirty;
    el('project-eyebrow').textContent = saved ? 'VOTRE PROJET' : 'VOTRE ESPACE DE CRÉATION';
    el('edit-project').hidden = !saved;
    el('edit-project').textContent = editingProject ? 'Replier les réglages' : 'Ajuster le projet';
    el('edit-project').setAttribute('aria-expanded', String(editingProject));
  }
  function preview() {
    if (followActive || !state.revisions.some((rev) => rev.id === previewId))
      previewId = state.activeRevision || state.revisions.at(-1)?.id || null;
    const comparison = renderComparison({
      document,
      state,
      proposal: comparedProposal,
      side: comparisonSide,
      availableProposal: availableComparisonProposal,
    });
    const shownId = comparison ? comparison.revisionId || null : previewId;
    displayedRevisionId = shownId;
    updateEvidence();
    updatePreviewControls(comparison);
    const revision = state.revisions.find((rev) => rev.id === shownId);
    const key = JSON.stringify(state.revisions.map((rev) => [rev.id, rev.title]));
    region('preview-version', key, () =>
      state.revisions.map((rev) => {
        const option = document.createElement('option');
        option.value = rev.id;
        option.textContent = rev.title;
        return option;
      }),
    );
    el('preview-version').value = shownId || '';
    el('preview-version').disabled = !revision || Boolean(comparison);
    el('preview').hidden = !revision;
    el('preview-empty').hidden = Boolean(revision) || Boolean(comparison);
    el('open-preview').hidden = !revision || activePanel !== 'product';
    el('inspect-element').disabled = !revision;
    updateSource();
    if (comparison && comparison.kind !== 'revision') {
      previewTarget = null;
      return;
    }
    if (!revision || !runtime) return;
    frameOrigin = comparison ? runtime.comparisonPreviewOrigin : runtime.previewOrigin;
    if (!frameOrigin) {
      el('preview').hidden = true;
      el('preview-empty').hidden = false;
      el('preview-empty').textContent =
        'Le serveur de comparaison en lecture seule est indisponible. Redémarrez le Studio pour examiner cette proposition sans modifier les données.';
      el('open-preview').hidden = true;
      return;
    }
    const url = comparisonURL(frameOrigin, shownId, comparison?.route);
    previewTarget = comparison?.element || null;
    if (el('preview').getAttribute('src') !== url) {
      setInspection(false);
      clearElement();
      el('preview').src = url;
    }
    el('open-preview').href = comparisonURL(runtime.previewOrigin, shownId, comparison?.route);
    if (previewTarget) focusPreviewTarget();
  }
  function updateEvidence() {
    const shown = presentation(state, {
      displayedRevisionId,
      comparedProposal,
      comparisonSide,
      delegation: effectiveDelegation(),
    });
    el('preview-status').textContent = shown.displayed.label;
    const key = JSON.stringify([state.version, shown, runtime?.agent]);
    region('evidence-dock', key, () => views.evidenceDock(state, shown));
    region('checks-list', key, () => views.evidence(state, runtime, shown));
    technicalWorkspace.update(state, displayedRevisionId, activePanel);
  }
  function updatePreviewControls(comparison) {
    const dataNote = el('preview-data-note');
    dataNote.parentElement.hidden = Boolean(comparison);
    if (!comparison)
      el('comparison-status').textContent =
        'Application interactive · les saisies modifient les données du projet.';
    if (dataNote)
      dataNote.textContent = comparison
        ? 'Comparaison en lecture seule : les inscriptions et les autres données restent inchangées.'
        : 'Les données saisies dans l’app sont partagées entre ses versions. Revenir au code précédent ne restaure pas les anciennes données.';

    const option = comparedProposal?.options.find(
      (item) => item.id === comparedProposal.selectedOptionId,
    );
    region('preview-scenario', JSON.stringify(comparedProposal?.options), () =>
      (comparedProposal?.options || []).map((item) => {
        const choice = document.createElement('option');
        choice.value = item.id;
        choice.textContent = 'Scénario · ' + item.title;
        return choice;
      }),
    );
    el('preview-scenario').value = option?.id || '';
    el('preview-scenario').hidden = !comparison || activePanel !== 'product';
    el('preview-version').hidden =
      !['product', 'code'].includes(activePanel) ||
      (Boolean(comparison) && activePanel === 'product');
    el('proposal-comparison').hidden = activePanel !== 'product' || !availableComparisonProposal;
  }
  function focusPreviewTarget() {
    if (!runtime || !previewTarget) return;
    el('preview').contentWindow?.postMessage(
      { type: 'devmethod-focus', selector: previewTarget.selector },
      frameOrigin,
    );
  }
  function agentStatus() {
    if (!runtime) return;
    const agent = runtime.agent;
    const automatic = agent.automatic;
    let label = 'Agent hôte · manuel';
    let description =
      'Une demande reste en attente jusqu’à sa prise en charge par votre agent hôte. Cet espace ne lance pas un agent tout seul.';
    if (automatic) {
      label = agent.running ? 'Agent au travail' : 'Agent connecté · automatique';
      description =
        'Les demandes sont prises en charge par l’agent connecté. Son activité et ses résultats apparaissent ci-dessous.';
    } else if (agent.connected) {
      label = agent.running
        ? 'Agent au travail · suite suspendue'
        : 'Agent connecté · appels suspendus';
      description =
        'Les nouveaux appels automatiques sont suspendus. Les demandes et résultats restent conservés.';
    }
    el('agent-status').textContent = label;
    el('agent-description').textContent = description + (agent.message ? ' ' + agent.message : '');
    const approval = runtime.approval;
    const approvalNeeded = approval
      ? !approval.planApproved
      : state.project.mode !== 'delegated' && !runtime.planApproved;
    el('approval-form').hidden = !approvalNeeded || !state.brief.outcome;
    el('approve-plan').disabled =
      !state.brief.criteria.length || Boolean(approval?.missing.includes('visual'));
    el('approval-status').textContent =
      approval?.visualBlock?.message ||
      (approval?.missing.includes('visual')
        ? 'Choisissez et validez une direction visuelle dans le fil avant de valider le cadrage.'
        : runtime.planApproved
          ? 'Choix actuels validés. Vous pouvez demander la réalisation.'
          : 'Lisez le cadrage et les choix ci-dessus avant de lancer la réalisation.');
  }
  function render(next) {
    if (state && next.version < state.version) return;
    document.dispatchEvent(new window.Event('studio:before-render'));
    try {
      state = next;
      syncInputs();
      proposalController.update(state, runtime);
      progressController.update(state);
      if (initialPanel) {
        initialPanel = false;
        const requestedPanel = window.location.hash.slice(1);
        if (isJourneyHash()) openPanel('journey');
        else if (['product', 'code', 'choices', 'checks', 'history'].includes(requestedPanel))
          openPanel(requestedPanel);
        else if (!state.revisions.length) openPanel('journey');
      }
      updateJourney();
      agentStatus();
      const key = String(state.version);
      for (const id of ['context', 'references', 'jobs', 'events'])
        region(id, key, () => views[id](state));
      region('designs', key + chosenDesign, () =>
        views.designs(state, chosenDesign || state.selectedDesignId),
      );
      region('versions', key + previewId, () => views.versions(state, previewId));
      region('project-cap', key, () => views.cap(state));
      region(
        'policy',
        key + JSON.stringify(runtime?.approval) + JSON.stringify(runtime?.delegation),
        () => views.policy(state, runtime),
      );
      region('flow-decisions', key, () => views.flowDecisions(state));
      el('latest-result').hidden =
        !el('active-decision').hidden ||
        !state.jobs.length ||
        ['queued', 'running'].includes(state.jobs.at(-1)?.status);
      region('latest-result', key, () => views.latestResult(state));
      const constraints = el('preserve-constraints');
      if (constraints) {
        constraints.hidden = !state.project.constraints.length;
        el('preserve-summary').textContent = state.project.constraints.length + ' contraintes';
        region('preserve-constraints-content', key, () =>
          state.project.constraints.map((text) => {
            const item = document.createElement('p');
            item.textContent = text;
            return item;
          }),
        );
      }
      el('design-form').hidden = !chosenDesign;
    } finally {
      document.dispatchEvent(new window.Event('studio:after-render'));
    }
  }
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const [next, capabilities] = await Promise.all([api.state(), api.runtime()]);
      runtime = capabilities;
      render(next);
      if (refreshError && el('notice').textContent === refreshError) notice('');
      refreshError = null;
    } catch (error) {
      refreshError = error.message;
      notice(error.message, true);
    } finally {
      refreshing = false;
    }
  }
  async function recover(error) {
    if (error.status === 409) {
      await refresh();
      notice(
        'Le projet a changé. Votre saisie est conservée. Vérifiez les choix actuels puis réessayez.',
        true,
      );
    } else notice(error.message, true);
  }
  function change(route, input, success) {
    const operation = writes.then(async () => {
      if (!state)
        throw new Error('Le projet n’est pas encore chargé. Réessayez après la connexion.');
      const result = await api.change(route, state.version, input);
      if (success) success(result.state);
      render(result.state);
      notice('');
      return result;
    });
    writes = operation.catch(recover);
    return writes;
  }
  function saveProject(event) {
    event.preventDefault();
    const input = projectInput();
    return change('project', input, () => {
      projectDirty = JSON.stringify(projectInput()) !== JSON.stringify(input);
      if (!projectDirty) editingProject = false;
      if (!projectDirty) delegationDirty = false;
      el('project-save-status').textContent = projectDirty
        ? 'Modifications non enregistrées.'
        : 'Idée et mode enregistrés.';
    }).then(() => {
      if (!editingProject && event.type === 'submit') el('edit-project').focus();
    });
  }
  function markProjectDirty() {
    projectDirty = true;
    el('project-save-status').textContent = 'Modifications non enregistrées.';
  }
  function saveDraft() {
    window.clearTimeout(draftTimer);
    if (!draftDirty) return writes;
    const text = el('request').value;
    return change('draft', { text }, () => {
      draftDirty = el('request').value !== text;
      el('draft-status').textContent = draftDirty ? 'Brouillon modifié…' : 'Brouillon enregistré.';
    });
  }
  function markDraftDirty() {
    draftDirty = true;
    el('draft-status').textContent = 'Brouillon modifié…';
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraft, 900);
  }
  async function sendRequest(event) {
    event.preventDefault();
    window.clearTimeout(draftTimer);
    const request = el('request').value;
    if (!request.trim()) return;
    if (projectDirty) {
      notice('Gardez d’abord votre idée et votre mode pour les joindre à la demande.', true);
      editingProject = true;
      projectPresentation();
      el('save-project').focus();
      return;
    }
    el('send-request').disabled = true;
    await change('requests', { request, element: selectedElement }, () => {
      draftDirty = el('request').value !== request;
      if (!draftDirty) {
        el('request').value = '';
        clearElement();
      }
      el('draft-status').textContent = draftDirty ? 'Brouillon modifié…' : 'Demande enregistrée.';
    });
    el('send-request').disabled = false;
    if (draftDirty) markDraftDirty();
  }
  function clearElement() {
    selectedElement = null;
    el('element-selection').hidden = true;
  }
  function setInspection(value) {
    inspecting = value;
    el('inspect-element').setAttribute('aria-pressed', String(value));
    if (runtime)
      el('preview').contentWindow?.postMessage(
        { type: 'devmethod-select', enabled: value },
        frameOrigin,
      );
  }
  function selectedMessage(event) {
    if (
      runtime &&
      event.origin === frameOrigin &&
      event.source === el('preview').contentWindow &&
      event.data?.type === 'devmethod-focus-result'
    ) {
      if (!event.data.found && previewTarget?.selector === event.data.selector)
        el('comparison-status').textContent +=
          ' La cible est introuvable dans cette version ; aucun écran ciblé n’est confirmé.';
      return;
    }
    if (
      !runtime ||
      event.origin !== frameOrigin ||
      event.source !== el('preview').contentWindow ||
      !inspecting
    )
      return;
    const data = event.data;
    if (
      !data ||
      data.type !== 'devmethod-element' ||
      typeof data.selector !== 'string' ||
      typeof data.text !== 'string'
    )
      return;
    selectedElement = { selector: data.selector.slice(0, 2000), text: data.text.slice(0, 4000) };
    el('element-label').textContent =
      'Élément ciblé : ' + (selectedElement.text || selectedElement.selector);
    el('element-selection').hidden = false;
    setInspection(false);
    el('request').focus();
  }
  function showVersion(id) {
    followActive = false;
    previewId = id;
    proposalController.suspend();
    render(state);
  }
  function retryDraft(id) {
    const job = state.jobs.find((entry) => entry.id === id);
    if (!job) return;
    if (
      el('request').value.trim() &&
      !window.confirm('Remplacer le brouillon actuel par cette demande ?')
    )
      return;
    el('request').value = job.request;
    clearElement();
    markDraftDirty();
    el('request').focus();
  }
  const actions = {
    activity() {
      el('activity').open = true;
      el('activity').querySelector('summary').focus();
    },
    'exit-comparison'() {
      followActive = true;
      proposalController.suspend();
    },
    'resume-comparison'() {
      proposalController.resume();
    },
    checks() {
      openPanel('checks');
    },
    architecture() {
      technicalWorkspace.show('architecture');
    },
    impact() {
      technicalWorkspace.show('impact');
    },
    'inspect-impact'(id) {
      showVersion(id);
      technicalWorkspace.show('impact');
    },
    'review-decision'() {
      technicalWorkspace.reviewDecision();
    },
    'inspect-architecture'(id) {
      showVersion(id);
      technicalWorkspace.show('architecture');
    },
    preview(id) {
      showVersion(id);
      openPanel('product');
    },
    design(id) {
      chosenDesign = id;
      render(state);
      el('design-' + id)?.focus({ preventScroll: true });
    },
    cancel(id) {
      return change('jobs/cancel', { jobId: id });
    },
    activate(id) {
      followActive = true;
      return change('activate', { id, reason: 'Version choisie explicitement dans l’historique.' });
    },
    'retry-draft': retryDraft,
  };
  function clickAction(event) {
    const button = event.target.closest('[data-action]');
    if (button) actions[button.dataset.action]?.(button.dataset.id);
  }
  async function upload() {
    const file = el('reference-file').files[0];
    if (!file) return;
    try {
      const input = await readReference(file, window.FileReader);
      await change('references', input);
      el('reference-file').value = '';
    } catch (error) {
      notice(error.message, true);
    }
  }
  function on(id, event, listener) {
    el(id).addEventListener(event, listener, options);
  }
  on('project-form', 'submit', saveProject);
  on('edit-project', 'click', () => {
    editingProject = !editingProject;
    projectPresentation();
    if (editingProject) el('idea').focus();
  });
  function openProjectSettings() {
    editingProject = true;
    projectPresentation();
    el('idea').focus();
  }
  on('project-menu', 'click', openProjectSettings);
  on('adjust-policy', 'click', () => {
    openProjectSettings();
    document.querySelector('.delegation-settings').open = true;
    el('delegate-visual').focus();
  });
  for (const key of ['structure', 'visual', 'adoption'])
    on('delegate-' + key, 'change', () => {
      delegationDirty = true;
      markProjectDirty();
    });
  on('studio-mode', 'change', (event) => {
    if (!state || projectDirty || !state.project.idea.trim()) {
      markProjectDirty();
      return;
    }
    markProjectDirty();
    void saveProject(event).then(refresh);
  });
  for (const button of document.querySelectorAll('[data-panel]')) {
    button.addEventListener('click', () => openPanel(button.dataset.panel, 'push'), options);
    button.addEventListener(
      'keydown',
      (event) => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const buttons = [...document.querySelectorAll('[data-panel]')];
        const index = buttons.indexOf(button);
        const target =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[target].click();
        buttons[target].focus();
      },
      options,
    );
  }
  on('project-form', 'input', (event) => {
    if (event.target.id !== 'reference-file') markProjectDirty();
  });
  on('project-form', 'change', (event) => {
    if (event.target.id !== 'reference-file') markProjectDirty();
  });
  on('request', 'input', markDraftDirty);
  on('save-draft', 'click', saveDraft);
  on('request-form', 'submit', sendRequest);
  on('refresh', 'click', refresh);
  on('reference-file', 'change', upload);
  on('preview-scenario', 'change', (event) => proposalController.scenario(event.target.value));
  on('preview-version', 'change', (event) => showVersion(event.target.value));
  on('comparison-before', 'click', () => proposalController.compare('before'));
  on('comparison-proposal', 'click', () => proposalController.compare('proposal'));
  on('preview', 'load', focusPreviewTarget);
  on('inspect-element', 'click', () => setInspection(!inspecting));
  on('clear-element', 'click', clearElement);
  for (const mode of ['wide', 'mobile'])
    on(mode + '-preview', 'click', () => {
      el('preview-stage').classList.toggle('mobile', mode === 'mobile');
      el('wide-preview').setAttribute('aria-pressed', String(mode === 'wide'));
      el('mobile-preview').setAttribute('aria-pressed', String(mode === 'mobile'));
    });
  on('first-request', 'click', () => {
    if (!el('request').value) {
      el('request').value =
        'Fais avancer mon projet à partir de l’idée et des références conservées.';
      markDraftDirty();
    }
    el('request').focus();
  });
  on('design-form', 'submit', (event) => {
    event.preventDefault();
    void change('design', { id: chosenDesign, reason: el('design-reason').value }, () => {
      chosenDesign = null;
      el('design-reason').value = '';
    }).then(refresh);
  });
  on('approval-form', 'submit', async (event) => {
    event.preventDefault();
    await change('approve', { reason: el('approval-reason').value });
    await refresh();
  });
  document.addEventListener('click', clickAction, options);
  window.addEventListener(
    'hashchange',
    () => {
      if (isJourneyHash()) openPanel('journey', 'none');
      else if (
        ['product', 'code', 'choices', 'checks', 'history'].includes(window.location.hash.slice(1))
      )
        openPanel(window.location.hash.slice(1), 'none');
    },
    options,
  );
  window.addEventListener('message', selectedMessage, options);
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') setInspection(false);
    },
    options,
  );
  const ready = refresh();
  const interval = pollMs
    ? window.setInterval(() => {
        if (!document.hidden) void refresh();
      }, pollMs)
    : null;
  return {
    ready,
    refresh,
    settled: () => writes,
    destroy() {
      disposed = true;
      controller.abort();
      sourceView.destroy();
      proposalController.dispose();
      progressController.dispose();
      journeyWidget?.dispose();
      technicalWorkspace.destroy();
      window.clearInterval(interval);
      window.clearTimeout(draftTimer);
    },
  };
}

if (typeof document !== 'undefined' && document.body?.hasAttribute('data-studio'))
  mountStudio({ document, window });
