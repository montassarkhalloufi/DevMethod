import { describeComparison } from './comparison-view.js';

/** @typedef {'agent'|'user'} Actor */
/** @typedef {{id:string, title:string}} Revision */
/** @typedef {{kind:'revision'|'image', status:'implemented'|'simulation', revisionId?:string, referenceId?:string, route?:string, element?:{selector:string,text:string}}} Preview */
/** @typedef {{id:string, title:string, preview?:Preview}} Option */
/** @typedef {{source:Actor, optionId:string, preview:Preview|null, reason:string, createdAt:string}} Resolution */
/** @typedef {{id:string,stage:'visual'|'implementation',question:string,baseRevision:string|null,selectedOptionId:string|null,options:Option[],resolution:Resolution|null,supersedes?:string|null}} Proposal */
/** @typedef {{id:string,revisionId:string,status:'passed'|'failed',kind:'command'|'agent-observation',label?:string,command?:string,output?:string,createdAt?:string}} Check */
/** @typedef {{project:{delegation?:{visual:Actor}},revisions:Revision[],activeRevision:string|null,checks:Check[],proposals?:Proposal[]}} State */
/** @typedef {{displayedRevisionId?:string|null,comparedProposal?:Proposal|null,comparisonSide?:'before'|'proposal',delegation?:{visual:Actor}}} PresentationOptions */
/** @typedef {{kind:'revision'|'image'|'empty',status:'applied'|'proposal'|'local'|'simulation'|'unavailable',revisionId:string|null,referenceId:string|null,title:string,label:string}} Displayed */
/** @typedef {{proposalId:string,source:Actor,revisionId:string|null,referenceId:string|null,reason:string,createdAt:string,route:string|null,element:{selector:string,text:string}|null}} VisualApproval */
/** @typedef {{revisionId:string|null,items:Check[],total:number,passed:number,failed:number,observations:number,status:'not-applicable'|'unverified'|'passed'|'failed',label:string}} CheckPresentation */
/** @typedef {{responsibility:Actor,responsibilityLabel:string,status:'unverified'|'pending'|'review-required'|'accepted',label:string,approval:VisualApproval|null}} VisualPresentation */
/** @typedef {{displayed:Displayed,active:{revisionId:string,title:string,label:string}|null,proposal:{id:string,stage:'visual'|'implementation',question:string,resolved:boolean}|null,checks:CheckPresentation,visual:VisualPresentation}} VersionPresentation */

function displayedTarget(state, options) {
  const compared = options.comparedProposal;
  const comparison = describeComparison(state, compared, options.comparisonSide ?? 'proposal');
  if (comparison?.kind === 'image')
    return { kind: 'image', referenceId: comparison.referenceId, label: comparison.label };
  if (comparison?.kind === 'empty') {
    const preview = compared.options.find((item) => item.id === compared.selectedOptionId)?.preview;
    return { kind: 'empty', simulation: preview?.status === 'simulation', label: comparison.label };
  }
  const id =
    comparison?.kind === 'revision'
      ? comparison.revisionId
      : options.displayedRevisionId === undefined
        ? state.activeRevision
        : options.displayedRevisionId;
  const revision = state.revisions.find((item) => item.id === id);
  return revision
    ? { kind: 'revision', revision }
    : { kind: 'empty', simulation: false, label: 'Aucune version affichée' };
}

function matchesTarget(preview, target) {
  if (!preview) return false;
  if (target.kind === 'revision')
    return (
      preview.kind === 'revision' &&
      preview.status === 'implemented' &&
      preview.revisionId === target.revision.id
    );
  return (
    target.kind === 'image' &&
    preview.kind === 'image' &&
    preview.referenceId === target.referenceId
  );
}

function liveProposals(state) {
  const proposals = state.proposals ?? [];
  const replaced = new Set(proposals.map((entry) => entry.supersedes));
  return proposals.filter((entry) => !replaced.has(entry.id));
}

function relatedProposal(proposals, target) {
  return (
    proposals.findLast((entry) => {
      const selected = entry.options.find((option) => option.id === entry.selectedOptionId);
      return matchesTarget(selected?.preview, target);
    }) ?? null
  );
}

/** @returns {Displayed} */
function displayedVersion(state, target, proposal, before) {
  const empty = { revisionId: null, referenceId: null, title: '' };
  if (target.kind === 'image')
    return {
      ...empty,
      kind: 'image',
      status: 'simulation',
      referenceId: target.referenceId,
      label: 'Simulation visuelle · aucune version exécutée',
    };
  if (target.kind !== 'revision')
    return {
      ...empty,
      kind: 'empty',
      status: target.simulation ? 'simulation' : 'unavailable',
      label: target.label,
    };
  const { revision } = target;
  const status = revision.id === state.activeRevision ? 'applied' : proposal ? 'proposal' : 'local';
  const labels = {
    applied: 'Version appliquée',
    proposal: 'Proposition non appliquée',
    local: before ? 'Version de départ non appliquée' : 'Version locale non appliquée',
  };
  return {
    kind: 'revision',
    status,
    revisionId: revision.id,
    referenceId: null,
    title: revision.title,
    label: `${revision.origin?.kind === 'import' ? 'Référence importée' : labels[status]} · ${revision.title}`,
  };
}

/** @returns {CheckPresentation} */
function checksForDisplay(state, displayed) {
  const items = displayed.revisionId
    ? state.checks
        .filter((entry) => entry.revisionId === displayed.revisionId)
        .map((entry) => ({ ...entry }))
    : [];
  const passed = items.filter((entry) => entry.status === 'passed').length;
  const failed = items.filter((entry) => entry.status === 'failed').length;
  const observations = items.filter((entry) => entry.kind === 'agent-observation').length;
  /** @type {CheckPresentation['status']} */
  let status = 'not-applicable';
  let label = 'Aucun contrôle de livraison attribuable à cet aperçu';
  if (displayed.revisionId) {
    status = failed ? 'failed' : items.length ? 'passed' : 'unverified';
    label = items.length
      ? `${passed} contrôle(s) de livraison passé(s), ${failed} échec(s) sur ${displayed.revisionId.slice(0, 8)} · couverture à établir`
      : `Aucun contrôle de livraison enregistré sur ${displayed.revisionId.slice(0, 8)}`;
  }
  return {
    revisionId: displayed.revisionId,
    items,
    total: items.length,
    passed,
    failed,
    observations,
    status,
    label,
  };
}

/** @returns {VisualApproval|null} */
function recordedApproval(proposals, target) {
  const proposal = proposals.findLast(
    (entry) => entry.stage === 'visual' && matchesTarget(entry.resolution?.preview, target),
  );
  if (!proposal) return null;
  const { resolution } = proposal;
  return {
    proposalId: proposal.id,
    source: resolution.source,
    revisionId: resolution.preview.revisionId ?? null,
    referenceId: resolution.preview.referenceId ?? null,
    reason: resolution.reason,
    createdAt: resolution.createdAt,
    route: resolution.preview.route ?? null,
    element: resolution.preview.element ? { ...resolution.preview.element } : null,
  };
}

function acceptedVisualLabel(approval) {
  const subject = approval.referenceId
    ? 'Maquette acceptée'
    : approval.route || approval.element
      ? 'Rendu ciblé accepté'
      : 'Rendu accepté pour cette version';
  return `${subject}${approval.source === 'agent' ? ' · accord de l’agent par délégation' : ' · accord de votre part'}`;
}

/** @returns {VisualPresentation} */
function visualForDisplay(proposals, target, responsibility) {
  const approval = recordedApproval(proposals, target);
  const pending = proposals.some(
    (entry) =>
      entry.stage === 'visual' &&
      !entry.resolution &&
      entry.options.some((option) => matchesTarget(option.preview, target)),
  );
  /** @type {VisualPresentation['status']} */
  let status = 'unverified';
  let label = 'Aucun accord visuel enregistré sur cet aperçu';
  if (approval) {
    status =
      approval.source === 'agent' && responsibility === 'user' ? 'review-required' : 'accepted';
    label =
      status === 'accepted'
        ? acceptedVisualLabel(approval)
        : 'Accord antérieur de l’agent · validation visuelle à confirmer par vous';
  }
  if (pending) {
    status = 'pending';
    label = 'Proposition visuelle à examiner · accord encore attendu';
  }
  return {
    responsibility,
    responsibilityLabel: responsibility === 'user' ? 'Vous' : 'Agent',
    status,
    label,
    approval,
  };
}

/**
 * Read-only projection of the exact surface shown in Studio. A compared proposal
 * is the one currently displayed, not merely an available pending comparison.
 * The comparison target takes precedence over displayedRevisionId; images,
 * empty previews and declared simulations never inherit a revision's checks.
 * An inactive "before" revision is a local starting point, never a proposal.
 * Outside comparison, only a selected option identifies a proposed revision;
 * merely listing an older version as an alternative does not relabel it.
 *
 * Pass runtime.delegation when available. The fallback matches the server's
 * legacy visual default (agent), independently of the selected working mode.
 * Responsibility never grants visual acceptance. Only an unsuperseded visual
 * resolution on the exact revision/image supplies an agreement; master/direction
 * approval and passing checks do not. A targeted agreement retains route/element
 * scope. This projection neither adopts a version nor establishes full coverage.
 *
 * @param {State} state Validated Studio state.
 * @param {PresentationOptions} [options]
 * @returns {VersionPresentation}
 */
export function presentation(state, options = {}) {
  const target = displayedTarget(state, options);
  const proposals = liveProposals(state);
  const before = Boolean(options.comparedProposal && options.comparisonSide === 'before');
  const related = before ? null : relatedProposal(proposals, target);
  const displayed = displayedVersion(state, target, related, before);
  const active = state.revisions.find((entry) => entry.id === state.activeRevision);
  const responsibility = options.delegation?.visual ?? state.project.delegation?.visual ?? 'agent';
  return {
    displayed,
    active: active
      ? {
          revisionId: active.id,
          title: active.title,
          label: `${active.origin?.kind === 'import' ? 'Référence importée' : 'Version appliquée'} · ${active.title}`,
        }
      : null,
    proposal: related
      ? {
          id: related.id,
          stage: related.stage,
          question: related.question,
          resolved: Boolean(related.resolution),
        }
      : null,
    checks: checksForDisplay(state, displayed),
    visual: visualForDisplay(proposals, target, responsibility),
  };
}
