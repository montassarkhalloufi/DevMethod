import {
  checkLabels,
  type Review,
  type ReviewCheck,
  type ReviewEvidence,
  type ReviewFinding,
  type ReviewSource,
} from './review-model.js';
import { el, badge, textBlock, link } from './review-dom.js';

export function renderCoverage(review: Review, parent: HTMLElement): void {
  parent.append(
    el('h2', 'panel-title', 'Couverture par domaine'),
    el('p', 'muted', 'Contrôles exécutés, non exécutés et hors périmètre. Aucun score de risque.'),
  );
  if (!review.checks.length)
    parent.append(el('p', 'empty small', 'Aucun contrôle enregistré : couverture inconnue.'));
  const domains = [...new Set(review.checks.map((check) => check.domain))];
  for (const domain of domains) {
    parent.append(el('h3', 'domain-title', domain));
    for (const check of review.checks.filter((check) => check.domain === domain)) {
      parent.append(checkCard(review, check));
    }
  }
}
export function sourceCard(source: ReviewSource): HTMLElement {
  const card = el('section', 'source-card');
  card.append(
    el('h3', '', source.title),
    el('p', 'source-meta', `${source.publisher} · ${source.technology} ${source.version}`),
    badge(
      source.access === 'consulted'
        ? 'Consultée'
        : source.access === 'unavailable'
          ? 'Inaccessible'
          : 'Non vérifiée',
      source.access === 'consulted' ? 'confirmed' : 'suspected',
      source.access === 'consulted' ? '✓' : '?',
    ),
    el('p', 'muted', `Consultation : ${source.consultedAt || 'non enregistrée'} · ${source.kind}`),
  );
  textBlock('Usage', source.usage, card);
  textBlock('Compatibilité & limites', source.compatibility, card);
  textBlock('Provenance', source.provenance, card);
  link('Ouvrir la référence', source.url, card);
  return card;
}
export function renderSources(review: Review, parent: HTMLElement): void {
  parent.append(el('h2', 'panel-title', 'Sources & technologies'));
  for (const t of review.technologies)
    parent.append(el('p', 'technology', `${t.name} ${t.version} — ${t.detectedFrom}`));
  if (!review.sources.length)
    parent.append(el('p', 'empty small', 'Aucune source consultée enregistrée.'));
  for (const source of review.sources) parent.append(sourceCard(source));
}
export function ticketLinks(review: Review, f: ReviewFinding, parent: HTMLElement): void {
  if (!f.ticketIds.length) parent.append(el('p', 'muted', 'Aucun ticket associé.'));
  for (const id of f.ticketIds) {
    const t = review.tickets.find((t) => t.id === id)!;
    parent.append(el('p', '', `${t.id} · ${t.title}`));
    link('Ouvrir le ticket', t.url, parent, 'button primary');
  }
}
export function evidenceDetail(review: Review, f: ReviewFinding, parent: HTMLElement): void {
  textBlock('Scénario déclencheur', f.trigger, parent);
  const compare = el('div', 'compare');
  textBlock('Attendu', f.expected, compare);
  textBlock('Observé', f.observed, compare);
  parent.append(compare);
  const steps = el('ol', 'reproduction');
  for (const step of f.reproduction) steps.append(el('li', '', step));
  parent.append(steps);
  if (!f.evidenceIds.length)
    parent.append(
      el(
        'p',
        'notice',
        'Preuve non disponible : ce constat repose sur les étapes et limites décrites ci-dessus.',
      ),
    );
  for (const [index, id] of f.evidenceIds.entries()) {
    const evidence = review.evidence.find((item) => item.id === id)!;
    parent.append(evidenceCard(evidence, index === 0));
  }
  const correction = el('div', 'correction-preview');
  correction.append(el('strong', '', '⌁ Correction proposée'), el('p', '', f.correction));
  parent.append(correction);
}

function checkCard(review: Review, check: ReviewCheck): HTMLElement {
  const card = el('section', 'check-card');
  const icons = { passed: '✓', failed: '✕', 'not-run': '—', blocked: '—', 'out-of-scope': '—' };
  card.append(
    badge(checkLabels[check.status], check.status, icons[check.status]),
    el('h4', '', `${check.id} · ${check.title}`),
    el('p', '', check.result),
    el(
      'p',
      'muted',
      `${check.kind === 'manual' ? 'Inspection manuelle' : 'Contrôle automatisé'} · Révision ${check.revision}`,
    ),
  );
  if (check.reason) card.append(el('p', '', `Raison : ${check.reason}`));
  for (const id of check.evidenceIds) {
    const evidence = review.evidence.find((item) => item.id === id)!;
    const details = el('details');
    details.append(
      el('summary', '', `Preuve ${id} · ${evidence.title}`),
      el('pre', '', evidence.content),
    );
    card.append(details);
  }
  if (!check.evidenceIds.length) card.append(el('p', 'muted', 'Aucune preuve jointe.'));
  return card;
}

function evidenceCard(e: ReviewEvidence, first: boolean): HTMLElement {
  const card = el('section', 'evidence-card');
  if (first) {
    card.id = 'evidence-full';
    card.tabIndex = -1;
  }
  card.append(el('h3', '', e.title));
  if (e.kind === 'diagram')
    card.append(el('span', 'eyebrow', 'SCHÉMA EXPLICATIF · PAS UNE CAPTURE D’EXÉCUTION'));
  if (e.image) {
    const img = el('img', 'evidence-image');
    img.src = `data:${e.image.mime};base64,${e.image.base64}`;
    img.alt = e.image.alt;
    card.append(
      el(
        'p',
        'muted',
        e.image.origin === 'captured'
          ? 'Capture déclarée réelle par l’auteur · confidentialité relue'
          : 'Illustration explicative · pas une preuve d’exécution',
      ),
      img,
    );
    img.addEventListener('error', () => {
      img.replaceWith(el('p', 'notice', `Image indisponible. Alternative : ${e.image!.alt}`));
    });
  }
  card.append(el('pre', e.kind === 'diagram' ? 'diagram' : '', e.content));
  if (e.url) link('Ouvrir la preuve complète', e.url, card);
  else
    card.append(el('p', 'muted', 'Preuve incluse dans ce rapport ; aucun lien externe renseigné.'));
  return card;
}
