import {
  summarizeReview,
  reviewFreshness,
  conclusionLabels,
  severityLabels,
  type Review,
  type ReviewSummary,
} from './review-model.js';
import { el } from './review-dom.js';

export function renderSummary(
  r: Review,
  main: HTMLElement,
  currentRevision: string | null,
  changedTargets: string[],
): void {
  const sum = summarizeReview(r),
    fresh = reviewFreshness(r, currentRevision, changedTargets);
  const banner = el('section', `banner ${sum.conclusion}`);
  banner.append(
    el(
      'span',
      'banner-icon',
      sum.conclusion === 'ready' ? '✓' : sum.conclusion === 'corrections' ? '⚠' : 'ⓘ',
    ),
  );
  const message = el('div');
  message.append(
    el('h2', '', conclusionLabels[sum.conclusion]),
    el('p', '', r.summary),
    el('p', 'policy', r.policy.rationale),
  );
  banner.append(message);
  main.append(banner);
  if (fresh.state === 'different')
    main.append(
      el(
        'p',
        'notice',
        `↻ Révision différente ou cibles modifiées : réévaluer les éléments concernés. Contrôles ciblés : ${fresh.affectedChecks.join(', ') || 'à déterminer'}. Constats ciblés : ${fresh.affectedFindings.join(', ') || 'à déterminer'}. Les preuves historiques et résultats indépendants sont conservés.`,
      ),
    );
  else if (fresh.state === 'unknown')
    main.append(
      el(
        'p',
        'revision-hint',
        'Historique : la révision courante n’est pas fournie. Cette review atteste uniquement de sa révision inspectée.',
      ),
    );
  renderStatistics(r, sum, main);
  renderLimits(r, main);
}

function renderStatistics(r: Review, sum: ReviewSummary, main: HTMLElement): void {
  const stats = el('section', 'stats');
  stats.setAttribute('aria-label', 'Compteurs de toute la review, indépendants des filtres');
  for (const severity of ['critical', 'major', 'moderate', 'minor'] as const) {
    const card = el('div', `stat ${severity}`);
    card.append(
      el('span', 'stat-icon', severity === 'critical' || severity === 'major' ? '!' : '△'),
      el('strong', '', String(sum.severities[severity])),
      el('span', '', severityLabels[severity]),
    );
    stats.append(card);
  }
  const uncertain = el('div', 'stat suspected');
  uncertain.append(
    el('span', 'stat-icon', '?'),
    el('strong', '', String(sum.suspected)),
    el('span', '', 'À vérifier'),
  );
  stats.append(uncertain);
  const coverage = el('div', 'stat coverage-stat');
  coverage.append(
    el('strong', '', `${sum.checks.passed} réussis · ${sum.checks.failed} en échec`),
    el(
      'span',
      '',
      `${sum.checks['not-run']} non exécutés · ${sum.checks.blocked} bloqués · ${sum.checks['out-of-scope']} hors périmètre`,
    ),
  );
  const bars = el('div', 'coverage-bars');
  bars.setAttribute('aria-hidden', 'true');
  const total = r.checks.length || 1;
  for (const [status, count] of Object.entries(sum.checks)) {
    const bar = el('span', status);
    bar.style.flexGrow = String(count / total);
    if (count) bars.append(bar);
  }
  coverage.append(bars);
  stats.append(coverage);
  main.append(
    stats,
    el(
      'p',
      'count-caption',
      'Compteurs : toute la review, y compris les constats résolus. Les risques à vérifier sont indiqués séparément.',
    ),
  );
}

function renderLimits(r: Review, main: HTMLElement): void {
  if (r.limits.length || r.exclusions.length) {
    const limits = el('details', 'limits');
    limits.append(
      el('summary', '', `Limites & périmètre · ${r.limits.length} limite(s) signalée(s)`),
    );
    const ul = el('ul');
    for (const t of [
      ...r.scope.map((t) => `Inclus : ${t}`),
      ...r.exclusions.map((t) => `Exclu : ${t}`),
      ...r.limits,
    ])
      ul.append(el('li', '', t));
    limits.append(ul);
    main.append(limits);
    if (r.limits.length) main.append(el('p', 'important-limit', r.limits[0]));
  }
}
