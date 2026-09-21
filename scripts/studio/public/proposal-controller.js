import { createTranslator, createMessageBindings } from './i18n.js';
// This controller joins durable server decisions to the existing preview.
// Rendering is a typed React feature; the controller never adopts code on selection.
export function createProposalController({
  document,
  change,
  showComparison,
  loadWidget = () => import('/studio-ui/decision-widget.js'),
}) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const host = document.getElementById('active-decision');
  let widget,
    loading,
    latest,
    disposed = false;
  let currentId = null;
  let selectedOptionId = null;
  let scenarioId = null;
  let comparisonEnabled = true;
  let side = 'proposal';
  function present() {
    const proposal = latest?.proposal || null;
    const scenario =
      proposal && scenarioId ? { ...proposal, selectedOptionId: scenarioId } : proposal;
    showComparison(comparisonEnabled ? scenario : null, side, proposal);
  }
  const actions = {
    async select(proposalId, optionId) {
      const result = await change('proposals/select', { proposalId, optionId });
      if (!result)
        throw new Error(
          t(
            'La sélection n’a pas été enregistrée. Vérifiez le message du Studio.',
            'The selection was not saved. Check the Studio message.',
          ),
        );
      comparisonEnabled = true;
      side = 'proposal';
      present();
    },
    async approve(proposalId, optionId, reason) {
      const result = await change('proposals/approve', {
        proposalId,
        optionId,
        reason:
          reason.trim() ||
          t(
            'Option approuvée explicitement ; aucune justification ajoutée.',
            'Option explicitly approved; no reason added.',
          ),
      });
      if (!result)
        throw new Error(
          t(
            'La décision n’a pas été enregistrée. Votre raison est conservée.',
            'The decision was not saved. Your reason is preserved.',
          ),
        );
    },
  };
  function renderWidget() {
    if (!latest || disposed) return;
    widget?.update({ ...latest, actions });
  }
  function start() {
    loading ??= loadWidget()
      .then((module) => {
        if (disposed) return;
        widget = module.mountDecisionWidget(host);
        renderWidget();
      })
      .catch(() => {
        loading = null;
        if (!disposed)
          messages.text(host, () =>
            t(
              'La décision ne peut pas être affichée. Actualisez pour réessayer ; aucune approbation n’a été enregistrée.',
              'The decision could not be displayed. Refresh to try again; no approval was saved.',
            ),
          );
      });
  }
  function update(state, runtime) {
    const replaced = new Set(state.proposals?.map((entry) => entry.supersedes));
    const proposal = state.proposals?.find((entry) => !entry.resolution && !replaced.has(entry.id));
    host.hidden = !proposal;
    const context = document.getElementById('decision-request');
    if (context) {
      const revisionIds = new Set(proposal?.options.map((option) => option.preview?.revisionId));
      const jobs = new Set(
        state.revisions
          .filter((revision) => revisionIds.has(revision.id))
          .map((revision) => revision.jobId),
      );
      const request = state.jobs.findLast((job) => jobs.has(job.id))?.request;
      context.hidden = !request;
      if (request) {
        const text = document.getElementById('decision-request-text');
        text.textContent = request;
        text.title = request;
      }
    }
    document
      .getElementById('discussion')
      .classList.toggle('has-active-decision', Boolean(proposal));
    if (!proposal) {
      latest = null;
      currentId = null;
      selectedOptionId = null;
      scenarioId = null;
      present();
      return;
    }
    if (proposal.id !== currentId) {
      currentId = proposal.id;
      scenarioId = null;
      comparisonEnabled = true;
      side = 'proposal';
      document.getElementById('activity').open = false;
    }
    if (proposal.selectedOptionId !== selectedOptionId) {
      scenarioId = null;
      comparisonEnabled = true;
      side = 'proposal';
    }
    selectedOptionId = proposal.selectedOptionId;
    latest = {
      draftScope: runtime?.workspace,
      proposal,
      activeRevision: state.activeRevision,
      execution: runtime?.agent?.automatic ? 'automatic' : 'host',
    };
    start();
    renderWidget();
    present();
  }
  return {
    update,
    scenario(id) {
      if (!latest?.proposal.options.some((option) => option.id === id)) return;
      scenarioId = id;
      comparisonEnabled = true;
      side = 'proposal';
      present();
    },
    compare(value) {
      side = value;
      comparisonEnabled = true;
      present();
    },
    suspend() {
      comparisonEnabled = false;
      present();
    },
    resume() {
      comparisonEnabled = true;
      present();
    },
    dispose() {
      disposed = true;
      messages.dispose();
      widget?.dispose();
    },
  };
}
