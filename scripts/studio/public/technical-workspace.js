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
}) {
  let state,
    revisionId,
    panel,
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
        projectLoading = null;
        projectHost.textContent =
          'L’espace technique ne peut pas être chargé. L’éditeur reste accessible.';
      });
  }
  function updateQuality() {
    if (!state || !qualityHost || panel !== 'checks') return;
    const options = {
      revisionId,
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
    qualityLoading ??= import('/studio-ui/quality-widget.js')
      .then((module) => {
        if (disposed) return;
        qualityWidget = module.mountQualityWidget(qualityHost, options);
        document.getElementById('checks-list').hidden = true;
        qualityHost.parentElement.classList.add('quality-mounted');
        updateQuality();
      })
      .catch(() => {
        qualityLoading = null;
        qualityHost.textContent =
          'Le tableau de qualité ne peut pas être chargé. Les preuves enregistrées restent ci-dessus.';
      });
  }
  return {
    update(next, shownId, activePanel) {
      const panelChanged = panel !== activePanel;
      state = next;
      revisionId = shownId;
      panel = activePanel;
      document.body.dataset.activePanel = panel;
      const objective = document.getElementById('technical-objective');
      if (objective)
        objective.textContent = state?.brief.outcome || state?.project.idea || 'Objectif à cadrer';
      const replaced = new Set(state?.proposals?.map((entry) => entry.supersedes));
      const pending = state?.proposals?.find(
        (entry) => !entry.resolution && !replaced.has(entry.id),
      );
      const decision = document.getElementById('technical-decision');
      if (decision) {
        decision.hidden = !pending;
        document.getElementById('technical-decision-title').textContent =
          pending?.question || pending?.title || 'Proposition en attente';
        document.getElementById('technical-decision-state').textContent =
          pending?.baseRevision && pending.baseRevision !== state.activeRevision
            ? 'La version a changé : cette proposition doit être réexaminée.'
            : 'Une délégation ne constitue pas une validation.';
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
      projectWidget?.dispose();
      qualityWidget?.dispose();
      document.body.classList.remove('technical-focus');
    },
  };
}
