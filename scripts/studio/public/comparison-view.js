import { createTranslator, getLocale, translate } from './i18n.js';
export function describeComparison(state, proposal, side, locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  if (!proposal) return null;
  const option = proposal.options.find((item) => item.id === proposal.selectedOptionId);
  const preview = option?.preview;
  if (side === 'before')
    return {
      kind: 'revision',
      revisionId: proposal.baseRevision,
      route: preview?.route,
      element: preview?.element,
      label: t(
        'Avant · version de départ · Comparaison en lecture seule : saisies et boutons désactivés.',
        'Before · starting version · Read-only comparison: inputs and buttons disabled.',
      ),
    };
  if (!option)
    return {
      kind: 'empty',
      label: t('Sélectionnez une proposition à examiner.', 'Select a proposal to review.'),
    };
  if (!preview)
    return {
      kind: 'empty',
      label: t(
        'Aperçu non fourni pour cette option. Aucun rendu n’est inventé.',
        'No preview was provided for this option. No visuals are invented.',
      ),
    };
  if (preview.kind === 'image')
    return {
      kind: 'image',
      referenceId: preview.referenceId,
      label: t(
        'Proposition · {value0} · Simulation visuelle, fonctionnalité non réalisée. Aucun test de fonctionnement.',
        'Proposal · {value0} · Visual simulation, feature not implemented. No functional testing.',
        { value0: option.title },
      ),
    };
  if (preview.status === 'simulation')
    return {
      kind: 'empty',
      label: t(
        'Simulation déclarée : fournir une image pour la comparer sans modifier les données de l’application. Cette version n’est pas affichée comme une fonctionnalité réalisée.',
        'Declared simulation: provide an image to compare it without changing application data. This version is not presented as an implemented feature.',
      ),
    };
  const checks = state.checks.filter((check) => check.revisionId === preview.revisionId);
  const failed = checks.filter((check) => check.status === 'failed').length;
  return {
    ...preview,
    label: t(
      '{value0} · {value1} · {value2}. {value3}. Lecture seule : saisies et boutons désactivés.',
      '{value0} · {value1} · {value2}. {value3}. Read only: inputs and buttons disabled.',
      {
        value0:
          preview.revisionId === state.activeRevision
            ? t('Version appliquée', 'Applied version')
            : t('Proposition non appliquée', 'Unapplied proposal'),
        value1: option.title,
        value2: preview.revisionId.slice(0, 8),
        value3: checks.length
          ? t(
              '{value0} contrôle(s) enregistré(s), {value1} échec(s)',
              '{value0} recorded check(s), {value1} failure(s)',
              {
                value0: checks.length.toLocaleString(locale),
                value1: failed.toLocaleString(locale),
              },
            )
          : t('Aucun contrôle pour cette version', 'No checks for this version'),
      },
    ),
  };
}

export function comparisonURL(origin, revisionId, route = '/', locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  // Domain validation rejects external URLs and traversal. Recheck at the UI boundary.
  if (!route.startsWith('/') || route.startsWith('//') || route.includes('\\'))
    throw new Error(t('Cible de comparaison invalide.', 'Invalid comparison target.'));
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
  const t = createTranslator(document);
  const locale = getLocale(document);
  const el = (id) => document.getElementById(id);
  const presentation = describeComparison(state, proposal, side, locale);
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
    toggle.textContent = presentation
      ? t('Ouvrir la version appliquée', 'Open applied version')
      : t('Comparer', 'Compare');
    toggle.dataset.action = presentation ? 'exit-comparison' : 'resume-comparison';
    el('comparison-before').hidden = !presentation;
    el('comparison-proposal').hidden = !presentation;
    if (!presentation)
      el('comparison-status').textContent = t(
        'Comparaison suspendue. La proposition reste en attente, sans approbation ni modification.',
        'Comparison paused. The proposal remains pending, without approval or changes.',
      );
  }
  if (!presentation) return null;
  const selected = proposal.options.find((option) => option.id === proposal.selectedOptionId);
  el('comparison-proposal').textContent =
    selected?.preview?.revisionId === state.activeRevision
      ? t('Version appliquée', 'Applied version')
      : t('Proposition', 'Proposal');
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
