import { createStudioApi, readReference } from './api.js';
import { createViews } from './views.js';
import { presentation } from './version-presentation.js';
import { createSourceView, comparisonBase } from './source-view.js';
import { createProposalController } from './proposal-controller.js';
import { renderComparison, comparisonURL } from './comparison-view.js';
import { createTechnicalWorkspace } from './technical-workspace.js';
import { createProgressController } from './progress-controller.js';
import { createConnectorsController } from './connectors-controller.js';
import { createMcpSelectionController } from './mcp-selection.js';
import { createAgentController } from './agent-controller.js';
import { createRuntimeObserver } from './runtime-observer.js';
import { createInterventionReview } from './intervention-review.js';
import { createActivationReview } from './activation-review.js';
import { createCandidateRequest } from './candidate-request.js';
import {
  createTranslator,
  translateAgentMessage,
  getLocale,
  mountLocaleControls,
  subscribeLocale,
  createMessageBindings,
} from './i18n.js';
import { translateStudioError } from './error-messages.js';

function renderHomeLink(document, homeUrl) {
  const t = createTranslator(document);
  const link = document.getElementById('studio-home-link');
  if (!link) return;
  let origin;
  try {
    const url = new URL(homeUrl);
    if (
      url.protocol === 'http:' &&
      ['127.0.0.1', 'localhost'].includes(url.hostname) &&
      url.port &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    )
      origin = url.origin;
  } catch {
    /* A standalone Studio has no launcher. */
  }
  link.href = origin ?? '/';
  link.setAttribute(
    'aria-label',
    origin ? t('Accueil — Mes projets', 'Home — My projects') : 'DevMethod Studio',
  );
  link.querySelector('span').textContent = origin
    ? t('/ Mes projets', '/ My projects')
    : '/ Studio';
}

export function mountStudio({
  document,
  window,
  api = createStudioApi(),
  pollMs = 2000,
  loadMcpWidget,
  navigate = (url) => window.location.assign(url),
}) {
  const stopLanguageControls = mountLocaleControls(document, window);
  const t = createTranslator(document);
  const el = (id) => document.getElementById(id);
  const messages = createMessageBindings(document);
  const views = createViews(document);
  const mcpSelection = createMcpSelectionController({
    document,
    loadWidget: loadMcpWidget,
    onGuidesChange: markDraftDirty,
  });
  const agentController = createAgentController({
    document,
    onStatus(agent) {
      if (!runtime) return;
      runtime = { ...runtime, agent };
      agentStatus();
    },
  });
  let technicalWorkspace;
  const sourceView = createSourceView({
    document,
    root: el('source-view'),
    loadSource: (input) =>
      api.source
        ? api.source(input)
        : Promise.reject(
            new Error(t('Lecture du code indisponible.', 'Code reading is unavailable.')),
          ),
    copyText: window.navigator.clipboard?.writeText.bind(window.navigator.clipboard),
    allowEdit: true,
    onSelect: (path) => technicalWorkspace?.selectPath(path),
    onApplied: async (result) => {
      render(result.state);
      await activationReview.open(result.revision.id);
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
    onOpenConnectors: (checkId) => connectorsController.open(checkId),
  });
  const options = { signal: controller.signal };
  const activationReview = createActivationReview({
    document,
    loadReview: (revisionId, signal) => api.activationReview(revisionId, signal),
    activate(input) {
      const { version, ...payload } = input;
      const operation = writes.then(() => api.change('activate', version, payload));
      writes = operation.catch(() => {});
      return operation;
    },
    onApplied(result) {
      if (disposed) return;
      followActive = true;
      render(result.state);
      void sourceView.reconcileActivation(result.state.activeRevision);
      notice(() =>
        t(
          'Version utilisée. Les limites et résultats des contrôles sont conservés.',
          'Version applied. Check results and limitations are preserved.',
        ),
      );
      void refresh();
    },
    onError: (error) => notice(error.message, true),
  });
  const candidateRequest = createCandidateRequest({
    document,
    loadReview: (revisionId, signal) => api.loadCandidateRequest(revisionId, signal),
    requestChanges(input) {
      const operation = writes.then(() => api.requestCandidateChanges(input));
      writes = operation.catch(() => {});
      return operation;
    },
    onQueued(result) {
      if (disposed) return;
      render(result.state);
      notice(() =>
        t(
          'Correction mise en attente. Les limites de l’agent restent applicables.',
          'Changes queued. Agent limits still apply.',
        ),
      );
      void refresh();
    },
    onError: (error) => notice(error.message, true),
  });
  const interventionReview = createInterventionReview({
    document,
    loadReview: (revisionId, signal) => api.interventionReview(revisionId, signal),
    saveReview(input) {
      const operation = writes.then(() => api.interventionDecision(input));
      writes = operation.catch(() => {});
      return operation;
    },
    onApplied(result) {
      if (disposed) return;
      render(result.state);
      void refresh();
    },
    onError: (error) => notice(error.message, true),
  });
  const connectorsController = createConnectorsController({
    document,
    onPrepareRequest: ({ prompt, connectorGuides }) => prepareCorrection(prompt, connectorGuides),
  });
  el('open-connectors')?.addEventListener('click', () => connectorsController.open(), options);
  el('close-connectors')?.addEventListener('click', () => connectorsController.close(), options);
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
  let returningHome = false;
  let submittingRequest = false;
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
  let applyingControl = false;
  const rendered = new Map();
  let activePanel = 'product';
  let comparedProposal = null;
  let availableComparisonProposal = null;
  let comparisonSide = 'proposal';
  let previewTarget = null;
  let journeyWidget, journeyLoading;
  let disposed = false;
  let initialPanel = true;
  const runtimeObserver = createRuntimeObserver({
    window,
    getScope() {
      if (
        !api.runtimeObservation ||
        activePanel !== 'product' ||
        comparedProposal ||
        !displayedRevisionId ||
        !frameOrigin ||
        frameOrigin !== runtime?.previewOrigin
      )
        return null;
      return { frame: el('preview'), origin: frameOrigin, revisionId: displayedRevisionId };
    },
    async submit(input) {
      const result = await api.runtimeObservation(input);
      if (!disposed) render(result.state);
    },
    onError(error) {
      notice(
        () =>
          t(
            'Le signal d’erreur de l’aperçu n’a pas pu être enregistré. ',
            'The preview error signal could not be recorded. ',
          ) + error.message,
        true,
      );
    },
  });
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
    technicalWorkspace.update(
      state,
      displayedRevisionId,
      activePanel,
      runtime?.agent?.verification ?? null,
    );
  }
  function prepareStage(stage, request) {
    const existing = el('request').value;
    if (
      existing.trim() &&
      !window.confirm(
        t(
          'Remplacer le brouillon par la demande pour ',
          'Replace the draft with the request for ',
        ) +
          stage +
          ' ?',
      )
    )
      return;
    el('request').value = request;
    markDraftDirty();
    el('request').focus();
  }
  function prepareCorrection(message, connectorGuides) {
    const existing = el('request').value;
    if (existing.length + message.length + 2 > 20000) {
      notice(
        () =>
          t(
            'La demande existante est trop longue pour ajouter le diagnostic. Votre texte est conservé.',
            'The existing request is too long to add the diagnosis. Your text is preserved.',
          ),
        true,
      );
      return false;
    }
    if (connectorGuides?.length && !mcpSelection.addGuides(connectorGuides)) {
      notice(
        () =>
          t(
            'La préparation ne peut pas être ajoutée. Réessayez lorsque les outils du prompt sont chargés.',
            'The preparation cannot be added. Try again once the prompt tools have loaded.',
          ),
        true,
      );
      return false;
    }
    technicalWorkspace?.revealConversation();
    el('request').value = existing ? existing + '\n\n' + message : message;
    markDraftDirty();
    el('request').focus();
    notice(() =>
      t(
        'Diagnostic ajouté à votre demande. Vous pouvez le compléter puis l’envoyer.',
        'Diagnosis added to your request. You can complete it, then send it.',
      ),
    );
    return true;
  }
  function updateJourney() {
    if (!state || activePanel !== 'journey') return;
    const props = {
      state,
      onRequest: prepareStage,
      onOpenSource: (path, revisionId) => technicalWorkspace.openDeliveredFile(revisionId, path),
      onOpenPrototype: (id) => {
        showVersion(id);
        openPanel('product', 'push');
      },
      onApproveMaster: async (masterId) => {
        const result = await change('design/master/approve', {
          masterId,
          reason: t(
            'Validation explicite de cet écran maître depuis le parcours.',
            'Explicit approval of this master screen from the design journey.',
          ),
        });
        if (!result)
          throw new Error(
            t(
              'Validation non enregistrée. Consultez le message du Studio.',
              'Approval was not saved. Check the Studio message.',
            ),
          );
      },
      onChooseDirection: async (id) => {
        const result = await change('design', {
          id,
          reason: t(
            'Direction choisie explicitement dans le parcours, écran maître à détailler ensuite.',
            'Direction explicitly chosen in the design journey; the master screen is the next step.',
          ),
        });
        if (!result)
          throw new Error(
            t(
              'Choix non enregistré. Consultez le message du Studio.',
              'The choice was not saved. Check the Studio message.',
            ),
          );
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
        el('journey-view').textContent = t(
          'Le parcours ne peut pas être chargé. Actualisez pour réessayer.',
          'The journey could not be loaded. Refresh to try again.',
        );
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
    const read =
      typeof message === 'function'
        ? message
        : () => translateStudioError(message, getLocale(document));
    messages.text(el('notice'), read);
    el('notice').hidden = !read();
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
      ...(el('project-expected-profile').value
        ? { expectedProfile: el('project-expected-profile').value }
        : {}),
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
      el('project-expected-profile').value = state.project.expectedProfile ?? '';
      for (const [key, value] of Object.entries(effectiveDelegation()))
        el('delegate-' + key).value = value;
    }
    if (!draftDirty) {
      el('request').value = state.draft;
      void mcpSelection.restoreGuides(state.draftConnectorGuides ?? []);
    }
    el('project-title').textContent =
      state.project.name ||
      (state.project.idea.trim()
        ? t('Votre projet', 'Your project')
        : t('Qu’aimeriez-vous créer ?', 'What would you like to create?'));
    (el('project-menu-label') || el('project-menu')).textContent =
      state.project.name || t('Mon projet', 'My project');
    projectPresentation();
  }
  function projectPresentation() {
    const saved = Boolean(state.project.idea.trim() || state.import);
    editingProject ??= !saved;
    el('project').classList.toggle('compact', !editingProject);
    el('project-form').hidden = !editingProject;
    el('project-intro').hidden = !editingProject;
    el('project-summary').hidden = editingProject;
    el('project-idea-summary').textContent =
      state.project.idea ||
      t(
        'Projet importé · précisez l’objectif de la prochaine évolution.',
        'Imported project · define the objective of the next change.',
      );
    if (state.import) {
      el('project-intro').textContent = t(
        'Conservez les acquis du projet et précisez la prochaine évolution.',
        'Preserve the project’s progress and describe the next change.',
      );
      el('save-project').textContent = t('Enregistrer le contexte', 'Save the context');
    }
    el('project-mode').textContent = {
      guided: t('Guidé', 'Guided'),
      devauto: 'DevAuto',
      delegated: t('Autonome', 'Autonomous'),
    }[state.project.mode];
    el('project-unsaved').hidden = !projectDirty;
    el('project-eyebrow').textContent = saved
      ? t('VOTRE PROJET', 'YOUR PROJECT')
      : t('VOTRE ESPACE DE CRÉATION', 'YOUR CREATIVE WORKSPACE');
    el('edit-project').hidden = !saved;
    el('edit-project').textContent = editingProject
      ? t('Replier les réglages', 'Collapse settings')
      : t('Ajuster le projet', 'Adjust the project');
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
    connectorsController.update(shownId);
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
    if (revision?.profile === 'source-only') {
      el('preview').hidden = true;
      el('preview').removeAttribute('src');
      el('preview-empty').hidden = true;
      el('source-only-preview').hidden = false;
      el('open-preview').hidden = true;
      el('inspect-element').disabled = true;
      el('comparison-status').textContent = t(
        'Sources consultables · environnement d’exécution à raccorder',
        'Sources available · execution environment not connected',
      );
      el('preview-data-note').parentElement.hidden = true;
      previewTarget = null;
      return;
    }
    el('source-only-preview').hidden = true;
    if (comparison && comparison.kind !== 'revision') {
      previewTarget = null;
      return;
    }
    if (!revision || !runtime) return;
    frameOrigin = comparison ? runtime.comparisonPreviewOrigin : runtime.previewOrigin;
    if (!frameOrigin) {
      el('preview').hidden = true;
      el('preview-empty').hidden = false;
      el('preview-empty').textContent = t(
        'Le serveur de comparaison en lecture seule est indisponible. Redémarrez le Studio pour examiner cette proposition sans modifier les données.',
        'The read-only comparison server is unavailable. Restart Studio to inspect this proposal without changing data.',
      );
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
    const shown = presentation(
      state,
      {
        displayedRevisionId,
        comparedProposal,
        comparisonSide,
        delegation: effectiveDelegation(),
      },
      getLocale(document),
    );
    el('preview-status').textContent = shown.displayed.label;
    const key = JSON.stringify([state.version, shown, runtime?.agent, runtime?.control]);
    region('evidence-dock', key, () => views.evidenceDock(state, shown, runtime?.control));
    region('checks-list', key, () => views.evidence(state, runtime, shown));
    technicalWorkspace.update(
      state,
      displayedRevisionId,
      activePanel,
      runtime?.agent?.verification ?? null,
    );
  }
  function updatePreviewControls(comparison) {
    const dataNote = el('preview-data-note');
    dataNote.parentElement.hidden = Boolean(comparison);
    if (!comparison)
      el('comparison-status').textContent = t(
        'Application interactive · les saisies modifient les données du projet.',
        'Interactive application · input changes the project’s data.',
      );
    if (dataNote)
      dataNote.textContent = comparison
        ? t(
            'Comparaison en lecture seule : les inscriptions et les autres données restent inchangées.',
            'Read-only comparison: registrations and other data remain unchanged.',
          )
        : t(
            'Les données saisies dans l’app sont partagées entre ses versions. Revenir au code précédent ne restaure pas les anciennes données.',
            'Data entered in the app is shared across its versions. Returning to earlier code does not restore earlier data.',
          );

    const option = comparedProposal?.options.find(
      (item) => item.id === comparedProposal.selectedOptionId,
    );
    region(
      'preview-scenario',
      JSON.stringify([comparedProposal?.options, getLocale(document)]),
      () =>
        (comparedProposal?.options || []).map((item) => {
          const choice = document.createElement('option');
          choice.value = item.id;
          choice.textContent = t('Scénario · ', 'Scenario · ') + item.title;
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
    agentController.update(agent);
    const automatic = agent.automatic;
    let label = t('Agent hôte · manuel', 'Host agent · manual');
    let description = t(
      'Une demande reste en attente jusqu’à sa prise en charge par votre agent hôte. Cet espace ne lance pas un agent tout seul.',
      'A request waits until your host agent picks it up. This workspace does not start an agent on its own.',
    );
    if (automatic) {
      label = agent.running
        ? t('Agent au travail', 'Agent working')
        : t('Agent connecté · automatique', 'Agent connected · automatic');
      description = t(
        'Les demandes sont prises en charge par l’agent connecté. Son activité et ses résultats apparaissent ci-dessous.',
        'The connected agent handles requests. Its activity and results appear below.',
      );
    } else if (agent.connected) {
      label = agent.running
        ? t('Agent au travail · suite suspendue', 'Agent working · further calls suspended')
        : t('Agent connecté · appels suspendus', 'Agent connected · calls suspended');
      description = t(
        'Les nouveaux appels automatiques sont suspendus. Les demandes et résultats restent conservés.',
        'New automatic calls are suspended. Requests and results are preserved.',
      );
    }
    el('agent-status').textContent = label;
    el('agent-description').textContent =
      description +
      (agent.message ? ' ' + translateAgentMessage(agent.message, getLocale(document)) : '');
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
        ? t(
            'Choisissez et validez une direction visuelle dans le fil avant de valider le cadrage.',
            'Choose and approve a visual direction in the thread before approving the brief.',
          )
        : runtime.planApproved
          ? t(
              'Choix actuels validés. Vous pouvez demander la réalisation.',
              'Current choices approved. You can request implementation.',
            )
          : t(
              'Lisez le cadrage et les choix ci-dessus avant de lancer la réalisation.',
              'Read the brief and choices above before starting implementation.',
            ));
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
      const key = String(state.version) + ':' + getLocale(document);
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
        el('preserve-summary').textContent =
          state.project.constraints.length + t(' contraintes', ' constraints');
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
      renderHomeLink(document, runtime.homeUrl);
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
        () =>
          t(
            'Le projet a changé. Votre saisie est conservée. Vérifiez les choix actuels puis réessayez.',
            'The project has changed. Your input is preserved. Review the current choices, then try again.',
          ),
        true,
      );
    } else notice(error.message, true);
  }
  function change(route, input, success) {
    const operation = writes.then(async () => {
      if (!state)
        throw new Error(
          t(
            'Le projet n’est pas encore chargé. Réessayez après la connexion.',
            'The project has not loaded yet. Try again after connecting.',
          ),
        );
      const result = await api.change(route, state.version, input);
      if (success) success(result.state);
      render(result.state);
      notice('');
      return result;
    });
    writes = operation.catch(recover);
    return writes;
  }
  function applyControl(revisionId) {
    if (disposed || applyingControl || !state) return;
    applyingControl = true;
    const version = state.version;
    document.querySelectorAll('[data-action="control-apply"]').forEach((button) => {
      button.disabled = true;
    });
    const operation = writes.then(async () => {
      const result = await api.change('control/apply', version, { revisionId });
      if (disposed) return;
      followActive = true;
      render(result.state);
      void sourceView.reconcileActivation(result.state.activeRevision);
      await refresh();
      notice(() =>
        t(
          'Version appliquée selon les contrôles. Aucun nouvel appel fournisseur.',
          'Version applied under the current controls. No new provider call.',
        ),
      );
    });
    writes = operation
      .catch((error) => {
        if (!disposed) return recover(error);
      })
      .finally(() => {
        applyingControl = false;
        if (!disposed)
          document.querySelectorAll('[data-action="control-apply"]').forEach((button) => {
            button.disabled = false;
          });
      });
    return writes;
  }
  function saveProject(event) {
    event.preventDefault();
    const input = projectInput();
    return change('project', input, () => {
      projectDirty = JSON.stringify(projectInput()) !== JSON.stringify(input);
      if (!projectDirty) editingProject = false;
      if (!projectDirty) delegationDirty = false;
      messages.text(el('project-save-status'), () =>
        projectDirty
          ? t('Modifications non enregistrées.', 'Unsaved changes.')
          : t('Idée et mode enregistrés.', 'Idea and working mode saved.'),
      );
    }).then(() => {
      if (!editingProject && event.type === 'submit') el('edit-project').focus();
    });
  }
  function markProjectDirty() {
    projectDirty = true;
    messages.text(el('project-save-status'), () =>
      t('Modifications non enregistrées.', 'Unsaved changes.'),
    );
  }
  function saveDraft() {
    window.clearTimeout(draftTimer);
    if (!draftDirty) return writes;
    const text = el('request').value;
    const connectorGuides = mcpSelection.requestGuides();
    return change('draft', { text, connectorGuides }, () => {
      draftDirty =
        el('request').value !== text ||
        JSON.stringify(mcpSelection.requestGuides()) !== JSON.stringify(connectorGuides);
      messages.text(el('draft-status'), () =>
        draftDirty
          ? t('Brouillon modifié…', 'Draft changed…')
          : t('Brouillon enregistré.', 'Draft saved.'),
      );
    });
  }
  function markDraftDirty() {
    draftDirty = true;
    messages.text(el('draft-status'), () => t('Brouillon modifié…', 'Draft changed…'));
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraft, 900);
  }
  function requireSavedProject() {
    if (!projectDirty) return false;
    notice(
      () =>
        t(
          'Enregistrez les réglages du projet avant de revenir à l’accueil.',
          'Save the project settings before returning home.',
        ),
      true,
    );
    openProjectSettings();
    el('save-project').focus();
    return true;
  }
  async function returnHome(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (returningHome) return;
    returningHome = true;
    const link = event.currentTarget;
    const destination = link.href;
    link.setAttribute('aria-busy', 'true');
    try {
      await writes;
      if (disposed || requireSavedProject()) return;
      await saveDraft();
      await writes;
      if (disposed || requireSavedProject()) return;
      if (draftDirty) {
        if (!el('notice').classList.contains('error'))
          notice(
            () =>
              t(
                'Votre demande a changé pendant l’enregistrement. Elle est conservée ; réessayez le retour à l’accueil.',
                'Your request changed while it was being saved. It is preserved; try returning home again.',
              ),
            true,
          );
        return;
      }
      navigate(destination);
    } finally {
      returningHome = false;
      link.removeAttribute('aria-busy');
    }
  }
  async function sendRequest(event) {
    event.preventDefault();
    if (submittingRequest) return;
    window.clearTimeout(draftTimer);
    const request = el('request').value;
    const element = selectedElement;
    if (!request.trim()) return;
    if (projectDirty) {
      notice(
        () =>
          t(
            'Gardez d’abord votre idée et votre mode pour les joindre à la demande.',
            'Save your idea and working mode first to include them in the request.',
          ),
        true,
      );
      editingProject = true;
      projectPresentation();
      el('save-project').focus();
      return;
    }
    el('send-request').disabled = true;
    submittingRequest = true;
    try {
      const ready = await mcpSelection.prepareRequest();
      if (disposed) return;
      if (!ready) {
        notice(
          () =>
            t(
              'Vérifiez les préparations modifiées et l’enregistrement des outils MCP dans le prompt.',
              'Review the changed preparations and the MCP tools saved in the prompt.',
            ),
          true,
        );
        return;
      }
      if (projectDirty) {
        notice(
          () =>
            t(
              'Enregistrez les réglages du projet avant d’envoyer la demande.',
              'Save the project settings before sending the request.',
            ),
          true,
        );
        openProjectSettings();
        return;
      }
      const connectorGuides = mcpSelection.requestGuides();
      await change(
        'requests',
        { request, element, ...(connectorGuides.length ? { connectorGuides } : {}) },
        () => {
          mcpSelection.clearGuides(connectorGuides);
          const textChanged = el('request').value !== request;
          draftDirty = textChanged || mcpSelection.requestGuides().length > 0;
          if (!textChanged) {
            el('request').value = '';
            clearElement();
          }
          messages.text(el('draft-status'), () =>
            draftDirty
              ? t('Brouillon modifié…', 'Draft changed…')
              : t('Demande enregistrée.', 'Request saved.'),
          );
        },
      );
    } finally {
      submittingRequest = false;
      el('send-request').disabled = false;
    }
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
        el('comparison-status').textContent += t(
          ' La cible est introuvable dans cette version ; aucun écran ciblé n’est confirmé.',
          ' The target was not found in this version; no targeted screen is confirmed.',
        );
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
    messages.text(
      el('element-label'),
      () =>
        t('Élément ciblé : ', 'Selected element: ') +
        (selectedElement?.text || selectedElement?.selector || ''),
    );
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
      !window.confirm(
        t(
          'Remplacer le brouillon actuel par cette demande ?',
          'Replace the current draft with this request?',
        ),
      )
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
    'recover-work'(id) {
      return change('jobs/recover-work', { jobId: id });
    },
    'discard-candidate'(id) {
      return change('control/discard', {
        jobId: id,
        reason: t(
          'Candidat écarté explicitement depuis Studio pour libérer les demandes en attente ; limites conservées.',
          'Candidate explicitly discarded from Studio to release pending requests; limits preserved.',
        ),
      });
    },
    'control-apply': applyControl,
    'candidate-request': (id) => candidateRequest.open(id),
    'intervention-review': (id) => interventionReview.open(id),
    activate(id) {
      return activationReview.open(id);
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
  on('studio-home-link', 'click', returnHome);
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
      el('request').value = t(
        'Fais avancer mon projet à partir de l’idée et des références conservées.',
        'Move my project forward using the saved idea and references.',
      );
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
  window.addEventListener(
    'beforeunload',
    (event) => {
      if (!draftDirty && !projectDirty) return;
      event.preventDefault();
      event.returnValue = '';
    },
    options,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') setInspection(false);
    },
    options,
  );
  const stopLanguageRender = subscribeLocale(() => {
    if (state) render(state);
    renderHomeLink(document, runtime?.homeUrl);
  }, window);
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
      stopLanguageRender();
      stopLanguageControls();
      messages.dispose();
      controller.abort();
      sourceView.destroy();
      proposalController.dispose();
      progressController.dispose();
      agentController.dispose();
      runtimeObserver.dispose();
      activationReview.dispose();
      candidateRequest.dispose();
      interventionReview.dispose();
      connectorsController.dispose();
      mcpSelection.dispose();
      journeyWidget?.dispose();
      technicalWorkspace.destroy();
      window.clearInterval(interval);
      window.clearTimeout(draftTimer);
    },
  };
}

if (typeof document !== 'undefined' && document.body?.hasAttribute('data-studio'))
  mountStudio({ document, window });
