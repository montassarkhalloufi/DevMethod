import { createTranslator, createMessageBindings } from './i18n.js';
// The existing editor owns durable drafts and adoption. React owns the technical views.
export function createTechnicalWorkspace({
  document,
  window,
  sourceView,
  openPanel,
  refresh,
  comparisonBase,
  showVersion,
  onPrepareRequest,
  onOpenConnectors,
  loadQualityWidget = () => import('/studio-ui/quality-widget.js'),
}) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  let state,
    revisionId,
    panel,
    verification,
    selectedPath = null;
  let projectWidget, qualityWidget, projectLoading, qualityLoading;
  let requestedView = 'files';
  let focused = false;
  let disposed = false;
  const sourceHost = document.getElementById('source-view');
  const projectHost = document.getElementById('project-workbench');
  const qualityHost = document.getElementById('quality-workbench');
  function showChecks() {
    openPanel('checks', 'push');
  }
  function requestView(view) {
    requestedView = view;
    updateProject();
  }
  function openDeliveredFile(deliveredRevisionId, path) {
    const delivered = state?.revisions.find((entry) => entry.id === deliveredRevisionId);
    if (!delivered?.files.some((file) => file.path === path)) return;
    requestedView = 'files';
    selectedPath = path;
    showVersion(deliveredRevisionId);
    openPanel('code', 'push');
    void sourceView.selectFile(path, undefined, { draft: false });
    updateProject();
  }
  function openSource(path, line, sourceOptions) {
    const sourceRevisionId = typeof sourceOptions === 'string' ? sourceOptions : undefined;
    if (sourceRevisionId && sourceRevisionId !== revisionId) showVersion(sourceRevisionId);
    requestedView = 'files';
    selectedPath = path;
    openPanel('code', 'push');
    void sourceView.selectFile(
      path,
      line,
      typeof sourceOptions === 'object' ? sourceOptions : undefined,
    );
    updateProject();
  }
  function toggleFocus() {
    focused = !focused;
    document.body.classList.toggle('technical-focus', focused);
    updateProject();
  }
  function reviewDecision() {
    focused = false;
    document.body.classList.remove('technical-focus');
    openPanel('product', 'push');
    document.getElementById('active-decision')?.focus();
  }
  function updateProject() {
    if (!state || !projectHost || panel !== 'code') return;
    const revision = state.revisions.find((entry) => entry.id === revisionId);
    const options = {
      revisionId,
      previousRevisionId: comparisonBase(state, revision)?.id || null,
      activeRevisionId: state.activeRevision,
      sourceHost,
      selectedPath,
      revisions: state.revisions,
      onSelectVersion: showVersion,
      checks: state.checks,
      decisions: state.decisions,
      focused,
      pendingDecision: document.getElementById('technical-decision')?.hidden
        ? undefined
        : document.getElementById('technical-decision-title')?.textContent,
      onReviewDecision: reviewDecision,
      view: requestedView,
      onViewChange: requestView,
      onOpenSource: openSource,
      onShowChecks: showChecks,
      onFocus: toggleFocus,
      onExpand: () => document.getElementById('expand-workspace').click(),
    };
    if (projectWidget) return projectWidget.update(options);
    projectLoading ??= import('/studio-ui/project-widget.js')
      .then((module) => {
        if (disposed) return;
        projectWidget = module.mountProjectWidget(projectHost, options);
        updateProject();
      })
      .catch(() => {
        if (disposed) return;
        projectLoading = null;
        messages.text(projectHost, () =>
          t(
            'L’espace technique ne peut pas être chargé. L’éditeur reste accessible.',
            'The technical workspace could not be loaded. The editor remains available.',
          ),
        );
      });
  }
  function preserveExecutionControl() {
    const checks = document.getElementById('checks-list');
    if (!checks) return;
    // React replaces only its own host. Keep policy/evidence outside that ownership.
    for (const child of checks.children)
      child.hidden = Boolean(qualityWidget) && !child.classList.contains('execution-control');
    checks.hidden = Boolean(qualityWidget) && !checks.querySelector('.execution-control');
  }
  function updateQuality() {
    preserveExecutionControl();
    if (!state || !qualityHost || panel !== 'checks') return;
    const options = {
      revisionId,
      verification,
      onOpenSource: openSource,
      onStateChanged: refresh,
      onOpenConnectors,
      onPrepareRequest: (request) => {
        focused = false;
        document.body.classList.remove('technical-focus');
        onPrepareRequest?.(request);
        updateProject();
      },
    };
    if (qualityWidget) return qualityWidget.update(options);
    qualityLoading ??= loadQualityWidget()
      .then((module) => {
        if (disposed) return;
        qualityWidget = module.mountQualityWidget(qualityHost, options);
        preserveExecutionControl();
        qualityHost.parentElement.classList.add('quality-mounted');
        updateQuality();
      })
      .catch(() => {
        if (disposed) return;
        qualityLoading = null;
        messages.text(qualityHost, () =>
          t(
            'Le tableau de qualité ne peut pas être chargé. Les preuves enregistrées restent ci-dessus.',
            'The quality table could not be loaded. Recorded evidence remains above.',
          ),
        );
      });
  }
  return {
    update(next, shownId, activePanel, nextVerification = null) {
      verification = nextVerification;
      const panelChanged = panel !== activePanel;
      state = next;
      revisionId = shownId;
      panel = activePanel;
      document.body.dataset.activePanel = panel;
      const objective = document.getElementById('technical-objective');
      if (objective)
        messages.text(
          objective,
          () =>
            state?.brief.outcome ||
            state?.project.idea ||
            t('Objectif à cadrer', 'Objective to define'),
        );
      const replaced = new Set(state?.proposals?.map((entry) => entry.supersedes));
      const pending = state?.proposals?.find(
        (entry) => !entry.resolution && !replaced.has(entry.id),
      );
      const decision = document.getElementById('technical-decision');
      if (decision) {
        decision.hidden = !pending;
        messages.text(
          document.getElementById('technical-decision-title'),
          () =>
            pending?.question || pending?.title || t('Proposition en attente', 'Pending proposal'),
        );
        messages.text(document.getElementById('technical-decision-state'), () =>
          pending?.baseRevision && pending.baseRevision !== state.activeRevision
            ? t(
                'La version a changé : cette proposition doit être réexaminée.',
                'The version has changed: this proposal must be reviewed again.',
              )
            : t(
                'Une délégation ne constitue pas une validation.',
                'Delegation does not constitute approval.',
              ),
        );
      }
      if (panelChanged) window.dispatchEvent(new window.Event('resize'));
      updateProject();
      updateQuality();
    },
    selectPath(path) {
      selectedPath = path;
      updateProject();
    },
    openDeliveredFile,
    show(view) {
      requestedView = view;
      openPanel('code', 'push');
      updateProject();
    },
    reviewDecision,
    revealConversation() {
      focused = false;
      document.body.classList.remove('technical-focus');
      updateProject();
    },
    destroy() {
      disposed = true;
      messages.dispose();
      projectWidget?.dispose();
      qualityWidget?.dispose();
      document.body.classList.remove('technical-focus');
    },
  };
}
