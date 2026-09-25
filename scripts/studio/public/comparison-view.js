export function describeComparison(state, proposal, side) {
  if (!proposal) return null;
  const option = proposal.options.find((item) => item.id === proposal.selectedOptionId);
  const preview = option?.preview;
  if (side === 'before')
    return {
      kind: 'revision',
      revisionId: proposal.baseRevision,
      route: preview?.route,
      element: preview?.element,
      label:
        'Avant · version de départ · Comparaison en lecture seule : saisies et boutons désactivés.',
    };
  if (!option) return { kind: 'empty', label: 'Sélectionnez une proposition à examiner.' };
  if (!preview)
    return {
      kind: 'empty',
      label: 'Aperçu non fourni pour cette option. Aucun rendu n’est inventé.',
    };
  if (preview.kind === 'image')
    return {
      kind: 'image',
      referenceId: preview.referenceId,
      label: `Proposition · ${option.title} · Simulation visuelle, fonctionnalité non réalisée. Aucun test de fonctionnement.`,
    };
  if (preview.status === 'simulation')
    return {
      kind: 'empty',
      label:
        'Simulation déclarée : fournir une image pour la comparer sans modifier les données de l’application. Cette version n’est pas affichée comme une fonctionnalité réalisée.',
    };
  const checks = state.checks.filter((check) => check.revisionId === preview.revisionId);
  const failed = checks.filter((check) => check.status === 'failed').length;
  return {
    ...preview,
    label: `${preview.revisionId === state.activeRevision ? 'Version appliquée' : 'Proposition non appliquée'} · ${option.title} · ${preview.revisionId.slice(0, 8)}. ${checks.length ? `${checks.length} contrôle(s) enregistré(s), ${failed} échec(s)` : 'Aucun contrôle pour cette version'}. Lecture seule : saisies et boutons désactivés.`,
  };
}

export function comparisonURL(origin, revisionId, route = '/') {
  // Domain validation rejects external URLs and traversal. Recheck at the UI boundary.
  if (!route.startsWith('/') || route.startsWith('//') || route.includes('\\'))
    throw new Error('Cible de comparaison invalide.');
  const routeURL = new URL(route, origin);
  const pathname = routeURL.pathname === '/' ? 'index.html' : routeURL.pathname.slice(1);
  return new URL(
    `/revisions/${encodeURIComponent(revisionId)}/${pathname}${routeURL.search}${routeURL.hash}`,
    origin,
  ).href;
}

export function renderComparison({
  document,
  state,
  proposal,
  side,
  availableProposal = proposal,
}) {
  const el = (id) => document.getElementById(id);
  const presentation = describeComparison(state, proposal, side);
  el('proposal-comparison').hidden = !availableProposal;
  el('proposal-image').hidden = true;
  el('proposal-empty').hidden = true;
  if (availableProposal) {
    let toggle = el('comparison-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'comparison-toggle';
      toggle.type = 'button';
      el('comparison-before').parentElement.append(toggle);
    }
    toggle.textContent = presentation ? 'Ouvrir la version appliquée' : 'Comparer';
    toggle.dataset.action = presentation ? 'exit-comparison' : 'resume-comparison';
    el('comparison-before').hidden = !presentation;
    el('comparison-proposal').hidden = !presentation;
    if (!presentation)
      el('comparison-status').textContent =
        'Comparaison suspendue. La proposition reste en attente, sans approbation ni modification.';
  }
  if (!presentation) return null;
  const selected = proposal.options.find((option) => option.id === proposal.selectedOptionId);
  el('comparison-proposal').textContent =
    selected?.preview?.revisionId === state.activeRevision ? 'Version appliquée' : 'Proposition';
  el('comparison-before').setAttribute('aria-pressed', String(side === 'before'));
  el('comparison-proposal').setAttribute('aria-pressed', String(side === 'proposal'));
  el('comparison-status').textContent = presentation.label;
  if (presentation.kind === 'revision') return presentation;
  el('preview').hidden = true;
  el('preview-empty').hidden = true;
  el('open-preview').hidden = true;
  el('inspect-element').disabled = true;
  if (presentation.kind === 'image') {
    const image = el('proposal-image');
    image.src = '/references/' + encodeURIComponent(presentation.referenceId);
    image.alt = presentation.label;
    image.hidden = false;
  } else {
    el('proposal-empty').textContent = presentation.label;
    el('proposal-empty').hidden = false;
  }
  return presentation;
}
