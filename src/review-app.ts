import { sanitizedReview, summarizeReview, severityLabels, confidenceLabels, resolutionLabels, checkLabels, conclusionLabels, filterFindings, reviewFreshness, reviewMarkdown, reviewUrl, redactReviewText, type Review, type ReviewFinding, type ReviewFilters, type ReviewSource } from './review-model.js';

interface ViewerState { view: 'findings' | 'coverage' | 'sources'; selected: string; section: 'evidence' | 'correction' | 'references'; filters: ReviewFilters; mobileDetail: boolean }
interface ViewerPayload { review: unknown; legacy: string | null; currentRevision: string | null; changedTargets: string[]; uiState?: ViewerState }
const app = document.getElementById('app')!;
const data = document.getElementById('review-data')!;
let review: Review | null = null;
let legacy: string | null = null;
let currentRevision: string | null = null;
let changedTargets: string[] = [];
let state: ViewerState = { view: 'findings', selected: '', section: 'evidence', filters: { query: '', domain: '', severity: '', confidence: '', resolution: '' }, mobileDetail: false };
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n;
};
function button(label: string, cls: string, action: () => void): HTMLButtonElement { const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', action); return b; }
function textBlock(title: string, value: string, parent: HTMLElement): void { const box = el('section', 'text-block'); box.append(el('h3', '', title), el('p', '', value)); parent.append(box); }
function badge(label: string, kind: string, icon: string): HTMLElement { return el('span', `badge ${kind}`, `${icon} ${label}`); }
function link(label: string, url: string | null, parent: HTMLElement, cls = 'link'): void {
  if (!reviewUrl(url)) { parent.append(el('p', 'muted unavailable', 'Destination indisponible : aucun lien HTTPS valide renseigné.')); return; }
  const a = el('a', cls, `${label} ↗`); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.append(a);
}
function download(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type })); const a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const safeJSON = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
function exportHtml(): void {
  const copy = document.documentElement.cloneNode(true) as HTMLElement;
  copy.querySelector('#review-data')!.textContent = safeJSON({ review, legacy, currentRevision, changedTargets, uiState: state });
  // Rebuild the presentation on reopening from the same validated result source.
  copy.querySelector('#app')!.replaceChildren();
  download(`${review?.id || 'review'}.html`, '<!doctype html>\n' + copy.outerHTML, 'text/html;charset=utf-8');
}
function exports(parent: HTMLElement): void {
  const box = el('details', 'export'); const summary = el('summary', 'button secondary', '↓  Exporter le rapport'); box.append(summary);
  const menu = el('div', 'export-menu');
  menu.append(button('HTML interactif · rouvrir hors ligne', '', () => { box.open = false; exportHtml(); }));
  if (review) { menu.append(button('Rapport Markdown', '', () => { box.open = false; download(`${review!.id}.md`, reviewMarkdown(review!), 'text/markdown;charset=utf-8'); }), button('Source JSON', '', () => { box.open = false; download(`${review!.id}.json`, JSON.stringify(review, null, 2) + '\n', 'application/json'); })); }
  else if (legacy !== null) menu.append(button('Rapport Markdown original', '', () => download('review-legacy.md', legacy!, 'text/markdown;charset=utf-8')));
  box.append(menu); parent.append(box);
}
function importer(parent: HTMLElement): void {
  const label = el('label', 'button import', '＋ Ouvrir une review'); const input = el('input'); input.type = 'file'; input.accept = '.json,.md'; input.setAttribute('aria-label', 'Ouvrir une review JSON ou Markdown'); label.append(input); parent.append(label);
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; if (!file) return;
    if (file.size > 4 * 1024 * 1024) { showError('Le fichier dépasse la limite de 4 Mio.'); return; }
    app.replaceChildren(el('p', 'loading', 'Chargement de la review…')); app.setAttribute('aria-busy', 'true');
    try {
      const content = await file.text();
      if (file.name.toLowerCase().endsWith('.md')) { legacy = redactReviewText(content); review = null; }
      else { review = sanitizedReview(JSON.parse(content)); legacy = null; }
      currentRevision = null; changedTargets = []; state = { view: 'findings', selected: '', section: 'evidence', filters: { query: '', domain: '', severity: '', confidence: '', resolution: '' }, mobileDetail: false }; location.hash = ''; render();
    } catch { review = null; legacy = null; showError('Résultats invalides ou version non supportée. Utilisez un document review format 1 ; aucune donnée du fichier n’a été exécutée.'); }
    finally { app.removeAttribute('aria-busy'); }
  });
}
function shell(): HTMLElement {
  app.replaceChildren(); const layout = el('div', 'layout');
  const aside = el('aside', 'sidebar'); aside.append(el('div', 'brand', '⬡  DevMethod'), el('p', 'eyebrow', 'PROJET'), el('strong', 'project', review?.project || 'Consultation locale'));
  const nav = el('nav', 'side-nav'); nav.setAttribute('aria-label', 'Navigation de review');
  nav.append(el('div', 'side-active', '▤  Review'));
  aside.append(nav); importer(aside);
  const note = el('div', 'side-note'); note.append(el('strong', '', 'Vos données restent locales'), el('p', '', 'Aucune commande exécutée. Aucune ressource distante chargée à l’ouverture.')); aside.append(note);
  const main = el('main', 'main'); const header = el('header', 'page-header'); const title = el('div');
  title.append(el('h1', '', review?.title || (legacy !== null ? 'Rapport historique' : 'Espace de review')));
  if (review) { title.append(el('p', 'subtitle', `${review.project}  /  ${review.mission}  ·  ${review.tickets.map(t => t.id).join(', ') || 'Sans ticket'}`), el('p', 'revision', `Révision ${review.revision.commit} · ${review.date}${review.revision.dirty.length ? ` · Modifications non commitées : ${review.revision.dirty.join(', ')}` : ''}`)); }
  header.append(title); if (review || legacy !== null) exports(header); main.append(header); layout.append(aside, main); app.append(layout); return main;
}
function showError(message: string): void { const main = shell(); const box = el('section', 'empty error'); box.setAttribute('role', 'alert'); box.append(el('h2', '', 'Review indisponible'), el('p', '', message)); main.append(box); }
function tabs(items: [string, string][], active: string, change: (id: string) => void, label: string, panelId: string): HTMLElement {
  const group = el('div', 'tabs'); group.setAttribute('role', 'tablist'); group.setAttribute('aria-label', label);
  for (const [id, title] of items) {
    const b = button(title, active === id ? 'tab active' : 'tab', () => { change(id); document.getElementById(`${panelId}-${id}`)?.focus(); }); b.id = `${panelId}-${id}`; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(active === id)); b.setAttribute('aria-controls', panelId); b.tabIndex = active === id ? 0 : -1;
    b.addEventListener('keydown', e => { const index = items.findIndex(i => i[0] === id); let next: number | null = null; if (e.key === 'ArrowRight') next = (index + 1) % items.length; if (e.key === 'ArrowLeft') next = (index + items.length - 1) % items.length; if (e.key === 'Home') next = 0; if (e.key === 'End') next = items.length - 1; if (next !== null) { e.preventDefault(); change(items[next]![0]); document.getElementById(`${panelId}-${items[next]![0]}`)?.focus(); } });
    group.append(b);
  } return group;
}
function render(): void {
  const main = shell();
  if (!review) {
    if (legacy !== null) { main.append(el('div', 'banner incomplete', 'ⓘ Rapport Markdown historique — champs structurés et couverture inconnus. Aucune conversion implicite.'), el('pre', 'legacy', legacy)); }
    else { const box = el('section', 'empty'); box.append(el('span', 'empty-icon', '▤'), el('h2', '', 'Aucune review disponible'), el('p', '', 'Ouvrez un fichier review.json validé ou un ancien rapport Markdown pour commencer.')); importer(box); main.append(box); }
    return;
  }
  const r = review, sum = summarizeReview(r), fresh = reviewFreshness(r, currentRevision, changedTargets);
  const banner = el('section', `banner ${sum.conclusion}`); banner.append(el('span', 'banner-icon', sum.conclusion === 'ready' ? '✓' : sum.conclusion === 'corrections' ? '⚠' : 'ⓘ'));
  const message = el('div'); message.append(el('h2', '', conclusionLabels[sum.conclusion]), el('p', '', r.summary), el('p', 'policy', r.policy.rationale)); banner.append(message); main.append(banner);
  if (fresh.state === 'different') main.append(el('p', 'notice', `↻ Révision différente ou cibles modifiées : réévaluer les éléments concernés. Contrôles ciblés : ${fresh.affectedChecks.join(', ') || 'à déterminer'}. Constats ciblés : ${fresh.affectedFindings.join(', ') || 'à déterminer'}. Les preuves historiques et résultats indépendants sont conservés.`));
  else if (fresh.state === 'unknown') main.append(el('p', 'revision-hint', 'Historique : la révision courante n’est pas fournie. Cette review atteste uniquement de sa révision inspectée.'));
  const stats = el('section', 'stats'); stats.setAttribute('aria-label', 'Compteurs de toute la review, indépendants des filtres');
  for (const severity of ['critical', 'major', 'moderate', 'minor'] as const) { const card = el('div', `stat ${severity}`); card.append(el('span', 'stat-icon', severity === 'critical' || severity === 'major' ? '!' : '△'), el('strong', '', String(sum.severities[severity])), el('span', '', severityLabels[severity])); stats.append(card); }
  const uncertain = el('div', 'stat suspected'); uncertain.append(el('span', 'stat-icon', '?'), el('strong', '', String(sum.suspected)), el('span', '', 'À vérifier')); stats.append(uncertain);
  const coverage = el('div', 'stat coverage-stat'); coverage.append(el('strong', '', `${sum.checks.passed} réussis · ${sum.checks.failed} en échec`), el('span', '', `${sum.checks['not-run']} non exécutés · ${sum.checks.blocked} bloqués · ${sum.checks['out-of-scope']} hors périmètre`));
  const bars = el('div', 'coverage-bars'); bars.setAttribute('aria-hidden', 'true'); const total = r.checks.length || 1;
  for (const [status, count] of Object.entries(sum.checks)) { const bar = el('span', status); bar.style.flexGrow = String(count / total); if (count) bars.append(bar); } coverage.append(bars); stats.append(coverage); main.append(stats, el('p', 'count-caption', 'Compteurs : toute la review, y compris les constats résolus. Les risques à vérifier sont indiqués séparément.'));
  if (r.limits.length || r.exclusions.length) { const limits = el('details', 'limits'); limits.append(el('summary', '', `Limites & périmètre · ${r.limits.length} limite(s) signalée(s)`)); const ul = el('ul'); for (const t of [...r.scope.map(t => `Inclus : ${t}`), ...r.exclusions.map(t => `Exclu : ${t}`), ...r.limits]) ul.append(el('li', '', t)); limits.append(ul); main.append(limits); if (r.limits.length) main.append(el('p', 'important-limit', r.limits[0])); }
  const workspace = el('section', `workspace ${state.mobileDetail ? 'show-detail' : ''}`); const left = el('div', 'list-panel');
  left.append(tabs([['findings', `Constats ${r.findings.length}`], ['coverage', 'Couverture'], ['sources', 'Sources']], state.view, id => { state.view = id as ViewerState['view']; state.mobileDetail = false; render(); }, 'Vues de review', 'view-panel'));
  const panel = el('div', 'view-panel'); panel.id = 'view-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `view-panel-${state.view}`);
  if (state.view === 'findings') renderFindingList(panel);
  if (state.view === 'coverage') renderCoverage(panel);
  if (state.view === 'sources') renderSources(panel);
  left.append(panel); const detail = el('article', 'detail-panel'); detail.id = 'finding-detail';
  renderDetail(detail); workspace.append(left, detail); main.append(workspace);
}
function renderFindingList(parent: HTMLElement): void {
  const filters = el('div', 'filters'); const searchLabel = el('label', 'search-label', 'Rechercher un constat'); const search = el('input', 'search'); search.type = 'search'; search.placeholder = 'Titre, identifiant, fichier…'; search.value = state.filters.query; search.id = 'finding-search'; searchLabel.append(search); filters.append(searchLabel);
  const select = (key: keyof ReviewFilters, label: string, values: [string, string][]) => { const l = el('label', '', label); const node = el('select'); node.setAttribute('aria-label', label); for (const [value, name] of [['', 'Tous'], ...values]) { const option = el('option', '', name); option.value = value!; node.append(option); } node.value = state.filters[key]; node.addEventListener('change', () => { state.filters[key] = node.value; renderListOnly(); }); l.append(node); filters.append(l); };
  select('domain', 'Domaine', [...new Set(review!.findings.map(f => f.domain))].sort().map(v => [v, v])); select('severity', 'Gravité', Object.entries(severityLabels)); select('confidence', 'Confiance', Object.entries(confidenceLabels)); select('resolution', 'Résolution', Object.entries(resolutionLabels));
  search.addEventListener('input', () => { state.filters.query = search.value; renderListOnly(); }); parent.append(filters);
  const results = el('div', 'finding-results'); results.id = 'finding-results'; parent.append(results); renderListOnly();
  // The parent is not yet attached during a complete render.
  fillFindingResults(results);
}
function renderListOnly(): void { const list = document.getElementById('finding-results'); if (list) fillFindingResults(list); const note = document.getElementById('detail-filter-note'); if (note && review) note.hidden = filterFindings(review, state.filters).some(f => f.id === state.selected); }
function fillFindingResults(parent: HTMLElement): void {
  parent.replaceChildren(); const findings = filterFindings(review!, state.filters); const count = el('p', 'result-count', `${findings.length} constat(s) affiché(s) sur ${review!.findings.length}`); count.setAttribute('role', 'status'); parent.append(count);
  if (!findings.length) { parent.append(el('div', 'empty small', review!.findings.length ? 'Aucun résultat ne correspond aux filtres.' : 'Aucun problème détecté. Consultez la couverture et les limites avant de conclure.')); return; }
  for (const f of findings) {
    const b = button('', `finding ${state.selected === f.id ? 'selected' : ''}`, () => { state.selected = f.id; state.mobileDetail = true; state.section = 'evidence'; history.pushState(null, '', `#finding=${encodeURIComponent(f.id)}`); render(); document.getElementById('detail-title')?.focus(); }); b.setAttribute('aria-label', `${f.id} ${f.title}, ${severityLabels[f.severity]}, ${confidenceLabels[f.confidence]}, ${resolutionLabels[f.resolution]}`); b.setAttribute('aria-current', String(state.selected === f.id));
    const top = el('div', 'finding-top'); top.append(el('strong', 'finding-id', f.id), badge(confidenceLabels[f.confidence], f.confidence, f.confidence === 'confirmed' ? '✓' : '?'));
    b.append(top, el('h3', '', f.title)); const meta = el('div', 'finding-meta'); meta.append(badge(severityLabels[f.severity], f.severity, '!'), el('span', '', f.domain), el('span', 'resolution', resolutionLabels[f.resolution])); b.append(meta); parent.append(b);
  }
}
function renderCoverage(parent: HTMLElement): void {
  parent.append(el('h2', 'panel-title', 'Couverture par domaine'), el('p', 'muted', 'Contrôles exécutés, non exécutés et hors périmètre. Aucun score de risque.'));
  if (!review!.checks.length) parent.append(el('p', 'empty small', 'Aucun contrôle enregistré : couverture inconnue.'));
  for (const domain of [...new Set(review!.checks.map(c => c.domain))]) { parent.append(el('h3', 'domain-title', domain)); for (const c of review!.checks.filter(c => c.domain === domain)) { const card = el('section', 'check-card'); card.append(badge(checkLabels[c.status], c.status, c.status === 'passed' ? '✓' : c.status === 'failed' ? '✕' : '—'), el('h4', '', `${c.id} · ${c.title}`), el('p', '', c.result), el('p', 'muted', `${c.kind === 'manual' ? 'Inspection manuelle' : 'Contrôle automatisé'} · Révision ${c.revision}`)); if (c.reason) card.append(el('p', '', `Raison : ${c.reason}`)); for (const id of c.evidenceIds) { const e = review!.evidence.find(e => e.id === id)!; const d = el('details'); d.append(el('summary', '', `Preuve ${id} · ${e.title}`), el('pre', '', e.content)); card.append(d); } if (!c.evidenceIds.length) card.append(el('p', 'muted', 'Aucune preuve jointe.')); parent.append(card); } }
}
function sourceCard(source: ReviewSource): HTMLElement {
  const card = el('section', 'source-card'); card.append(el('h3', '', source.title), el('p', 'source-meta', `${source.publisher} · ${source.technology} ${source.version}`), badge(source.access === 'consulted' ? 'Consultée' : source.access === 'unavailable' ? 'Inaccessible' : 'Non vérifiée', source.access === 'consulted' ? 'confirmed' : 'suspected', source.access === 'consulted' ? '✓' : '?'), el('p', 'muted', `Consultation : ${source.consultedAt || 'non enregistrée'} · ${source.kind}`)); textBlock('Usage', source.usage, card); textBlock('Compatibilité & limites', source.compatibility, card); textBlock('Provenance', source.provenance, card); link('Ouvrir la référence', source.url, card); return card;
}
function renderSources(parent: HTMLElement): void {
  parent.append(el('h2', 'panel-title', 'Sources & technologies'));
  for (const t of review!.technologies) parent.append(el('p', 'technology', `${t.name} ${t.version} — ${t.detectedFrom}`));
  if (!review!.sources.length) parent.append(el('p', 'empty small', 'Aucune source consultée enregistrée.'));
  for (const source of review!.sources) parent.append(sourceCard(source));
}
function renderDetail(parent: HTMLElement): void {
  const back = button('← Retour aux résultats', 'back-button', () => { state.mobileDetail = false; render(); (document.querySelector<HTMLButtonElement>('.finding.selected') || document.getElementById('view-panel-findings'))?.focus(); }); parent.append(back);
  const f = review!.findings.find(f => f.id === state.selected);
  if (!f) { parent.append(el('div', 'empty detail-empty', state.selected ? 'Ce constat est introuvable dans cette review. Revenez à la liste pour en sélectionner un autre.' : 'Sélectionnez un constat pour consulter ses preuves, sa correction et ses références.')); return; }
  const filterNote = el('p', 'notice', 'Ce constat est hors de la sélection filtrée. Son détail reste disponible.'); filterNote.id = 'detail-filter-note'; filterNote.hidden = filterFindings(review!, state.filters).some(item => item.id === f.id); parent.append(filterNote);
  const title = el('h2', 'detail-title', `${f.id} · ${f.title}`); title.id = 'detail-title'; title.tabIndex = -1; parent.append(title);
  const badges = el('div', 'detail-badges'); badges.append(badge(severityLabels[f.severity], f.severity, '!'), badge(confidenceLabels[f.confidence], f.confidence, f.confidence === 'confirmed' ? '✓' : '?'), badge(resolutionLabels[f.resolution], 'neutral', '◌')); parent.append(badges, el('p', 'impact', f.impact), el('p', 'location', `${f.location.path}${f.location.line ? `:${f.location.line}` : ''}${f.location.component ? ` · ${f.location.component}` : ''}`));
  parent.append(tabs([['evidence', 'Preuve'], ['correction', 'Correction'], ['references', 'Références']], state.section, id => { state.section = id as ViewerState['section']; render(); }, 'Détail du constat', 'detail-content'));
  const content = el('div', 'detail-content'); content.id = 'detail-content'; content.setAttribute('role', 'tabpanel'); content.setAttribute('aria-labelledby', `detail-content-${state.section}`);
  if (state.section === 'evidence') evidenceDetail(f, content);
  if (state.section === 'correction') { textBlock('Correction recommandée', f.correction, content); textBlock('Conséquences & compromis', f.tradeoffs, content); textBlock('Vérification après correction', f.verification, content); textBlock('État de résolution', `${resolutionLabels[f.resolution]} · Preuves de résolution : ${f.resolutionEvidenceIds.join(', ') || 'aucune'}`, content); ticketLinks(f, content); }
  if (state.section === 'references') { textBlock('Justification de la gravité', f.severityReason, content); if (!f.sourceIds.length) content.append(el('p', 'empty small', 'Aucune référence pertinente renseignée.')); for (const id of f.sourceIds) content.append(sourceCard(review!.sources.find(s => s.id === id)!)); }
  parent.append(content); const actions = el('footer', 'detail-actions');
  actions.append(button('↗ Lien vers ce constat', 'button secondary', () => { const url = new URL(location.href); url.hash = `finding=${encodeURIComponent(f.id)}`; location.hash = url.hash; const destination = el('input'); destination.readOnly = true; destination.value = url.href; destination.setAttribute('aria-label', 'Lien local vers le constat'); actions.querySelector('input')?.remove(); actions.append(destination); destination.focus(); destination.select(); }));
  if (f.evidenceIds.length) actions.append(button('▤ Voir la preuve', 'button primary', () => { state.section = 'evidence'; render(); document.getElementById('evidence-full')?.scrollIntoView({ block: 'nearest' }); document.getElementById('evidence-full')?.focus(); }));
  parent.append(actions);
}
function ticketLinks(f: ReviewFinding, parent: HTMLElement): void {
  if (!f.ticketIds.length) parent.append(el('p', 'muted', 'Aucun ticket associé.'));
  for (const id of f.ticketIds) { const t = review!.tickets.find(t => t.id === id)!; parent.append(el('p', '', `${t.id} · ${t.title}`)); link('Ouvrir le ticket', t.url, parent, 'button primary'); }
}
function evidenceDetail(f: ReviewFinding, parent: HTMLElement): void {
  textBlock('Scénario déclencheur', f.trigger, parent); const compare = el('div', 'compare'); textBlock('Attendu', f.expected, compare); textBlock('Observé', f.observed, compare); parent.append(compare);
  const steps = el('ol', 'reproduction'); for (const step of f.reproduction) steps.append(el('li', '', step)); parent.append(steps);
  if (!f.evidenceIds.length) parent.append(el('p', 'notice', 'Preuve non disponible : ce constat repose sur les étapes et limites décrites ci-dessus.'));
  for (const [index, id] of f.evidenceIds.entries()) {
    const e = review!.evidence.find(e => e.id === id)!; const card = el('section', 'evidence-card'); if (index === 0) { card.id = 'evidence-full'; card.tabIndex = -1; }
    card.append(el('h3', '', e.title));
    if (e.kind === 'diagram') card.append(el('span', 'eyebrow', 'SCHÉMA EXPLICATIF · PAS UNE CAPTURE D’EXÉCUTION'));
    if (e.image) { const img = el('img', 'evidence-image'); img.src = `data:${e.image.mime};base64,${e.image.base64}`; img.alt = e.image.alt; card.append(el('p', 'muted', e.image.origin === 'captured' ? 'Capture déclarée réelle par l’auteur · confidentialité relue' : 'Illustration explicative · pas une preuve d’exécution'), img); img.addEventListener('error', () => { img.replaceWith(el('p', 'notice', `Image indisponible. Alternative : ${e.image!.alt}`)); }); }
    card.append(el('pre', e.kind === 'diagram' ? 'diagram' : '', e.content)); if (e.url) link('Ouvrir la preuve complète', e.url, card); else card.append(el('p', 'muted', 'Preuve incluse dans ce rapport ; aucun lien externe renseigné.')); parent.append(card);
  }
  const correction = el('div', 'correction-preview'); correction.append(el('strong', '', '⌁ Correction proposée'), el('p', '', f.correction)); parent.append(correction);
}
function hashSelection(): void {
  const id = new URLSearchParams(location.hash.slice(1)).get('finding');
  if (id) { state.selected = id; state.view = 'findings'; state.mobileDetail = true; }
}
window.addEventListener('hashchange', () => { hashSelection(); render(); });
window.addEventListener('popstate', () => { hashSelection(); render(); });
try {
  const payload = JSON.parse(data.textContent || '{}') as ViewerPayload;
  if (payload.review != null) review = sanitizedReview(payload.review);
  if (typeof payload.legacy === 'string') legacy = redactReviewText(payload.legacy);
  currentRevision = typeof payload.currentRevision === 'string' ? payload.currentRevision : null;
  changedTargets = Array.isArray(payload.changedTargets) && payload.changedTargets.every(v => typeof v === 'string') ? payload.changedTargets : [];
  // Saved UI state is only a convenience; validate before using it in selectors/rendering.
  const saved = payload.uiState;
  if (saved && ['findings', 'coverage', 'sources'].includes(saved.view) && ['evidence', 'correction', 'references'].includes(saved.section) && typeof saved.selected === 'string' && saved.filters && ['query', 'domain', 'severity', 'confidence', 'resolution'].every(k => typeof saved.filters[k as keyof ReviewFilters] === 'string')) state = saved;
  if (!state.selected && review?.findings[0]) state.selected = review.findings[0].id;
  hashSelection(); render();
} catch { review = null; legacy = null; showError('Résultats invalides ou version non supportée. Ouvrez une review format 1 ou un rapport Markdown historique.'); }
