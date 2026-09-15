import { renderFindingDetail } from './review-detail.js';
import { sanitizedReview, severityLabels, confidenceLabels, resolutionLabels, filterFindings, reviewMarkdown, redactReviewText, } from './review-model.js';
import { el, button, badge, download, tabs } from './review-dom.js';
import { renderCoverage, renderSources } from './review-panels.js';
import { renderSummary } from './review-summary.js';
const app = document.getElementById('app');
const data = document.getElementById('review-data');
let review = null;
let legacy = null;
let currentRevision = null;
let changedTargets = [];
let state = {
    view: 'findings',
    selected: '',
    section: 'evidence',
    filters: { query: '', domain: '', severity: '', confidence: '', resolution: '' },
    mobileDetail: false,
};
const safeJSON = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
function exportHtml() {
    const copy = document.documentElement.cloneNode(true);
    copy.querySelector('#review-data').textContent = safeJSON({
        review,
        legacy,
        currentRevision,
        changedTargets,
        uiState: state,
    });
    // Rebuild the presentation on reopening from the same validated result source.
    copy.querySelector('#app').replaceChildren();
    download(`${review?.id || 'review'}.html`, '<!doctype html>\n' + copy.outerHTML, 'text/html;charset=utf-8');
}
function exports(parent) {
    const box = el('details', 'export');
    const summary = el('summary', 'button secondary', '↓  Exporter le rapport');
    box.append(summary);
    const menu = el('div', 'export-menu');
    menu.append(button('HTML interactif · rouvrir hors ligne', '', () => {
        box.open = false;
        exportHtml();
    }));
    if (review) {
        menu.append(button('Rapport Markdown', '', () => {
            box.open = false;
            download(`${review.id}.md`, reviewMarkdown(review), 'text/markdown;charset=utf-8');
        }), button('Source JSON', '', () => {
            box.open = false;
            download(`${review.id}.json`, JSON.stringify(review, null, 2) + '\n', 'application/json');
        }));
    }
    else if (legacy !== null)
        menu.append(button('Rapport Markdown original', '', () => download('review-legacy.md', legacy, 'text/markdown;charset=utf-8')));
    box.append(menu);
    parent.append(box);
}
function importer(parent) {
    const label = el('label', 'button import', '＋ Ouvrir une review');
    const input = el('input');
    input.type = 'file';
    input.accept = '.json,.md';
    input.setAttribute('aria-label', 'Ouvrir une review JSON ou Markdown');
    label.append(input);
    parent.append(label);
    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file)
            return;
        if (file.size > 4 * 1024 * 1024) {
            showError('Le fichier dépasse la limite de 4 Mio.');
            return;
        }
        app.replaceChildren(el('p', 'loading', 'Chargement de la review…'));
        app.setAttribute('aria-busy', 'true');
        try {
            const content = await file.text();
            if (file.name.toLowerCase().endsWith('.md')) {
                legacy = redactReviewText(content);
                review = null;
            }
            else {
                review = sanitizedReview(JSON.parse(content));
                legacy = null;
            }
            currentRevision = null;
            changedTargets = [];
            state = {
                view: 'findings',
                selected: '',
                section: 'evidence',
                filters: { query: '', domain: '', severity: '', confidence: '', resolution: '' },
                mobileDetail: false,
            };
            location.hash = '';
            render();
        }
        catch {
            review = null;
            legacy = null;
            showError('Résultats invalides ou version non supportée. Utilisez un document review format 1 ; aucune donnée du fichier n’a été exécutée.');
        }
        finally {
            app.removeAttribute('aria-busy');
        }
    });
}
function shell() {
    app.replaceChildren();
    const layout = el('div', 'layout');
    const aside = el('aside', 'sidebar');
    aside.append(el('div', 'brand', '⬡  DevMethod'), el('p', 'eyebrow', 'PROJET'), el('strong', 'project', review?.project || 'Consultation locale'));
    const nav = el('nav', 'side-nav');
    nav.setAttribute('aria-label', 'Navigation de review');
    nav.append(el('div', 'side-active', '▤  Review'));
    aside.append(nav);
    importer(aside);
    const note = el('div', 'side-note');
    note.append(el('strong', '', 'Vos données restent locales'), el('p', '', 'Aucune commande exécutée. Aucune ressource distante chargée à l’ouverture.'));
    aside.append(note);
    const main = el('main', 'main');
    const header = el('header', 'page-header');
    const title = el('div');
    title.append(el('h1', '', review?.title || (legacy !== null ? 'Rapport historique' : 'Espace de review')));
    if (review) {
        title.append(el('p', 'subtitle', `${review.project}  /  ${review.mission}  ·  ${review.tickets.map((t) => t.id).join(', ') || 'Sans ticket'}`), el('p', 'revision', `Révision ${review.revision.commit} · ${review.date}${review.revision.dirty.length ? ` · Modifications non commitées : ${review.revision.dirty.join(', ')}` : ''}`));
    }
    header.append(title);
    if (review || legacy !== null)
        exports(header);
    main.append(header);
    layout.append(aside, main);
    app.append(layout);
    return main;
}
function showError(message) {
    const main = shell();
    const box = el('section', 'empty error');
    box.setAttribute('role', 'alert');
    box.append(el('h2', '', 'Review indisponible'), el('p', '', message));
    main.append(box);
}
function render() {
    const main = shell();
    if (!review) {
        if (legacy !== null) {
            main.append(el('div', 'banner incomplete', 'ⓘ Rapport Markdown historique — champs structurés et couverture inconnus. Aucune conversion implicite.'), el('pre', 'legacy', legacy));
        }
        else {
            const box = el('section', 'empty');
            box.append(el('span', 'empty-icon', '▤'), el('h2', '', 'Aucune review disponible'), el('p', '', 'Ouvrez un fichier review.json validé ou un ancien rapport Markdown pour commencer.'));
            importer(box);
            main.append(box);
        }
        return;
    }
    const r = review;
    renderSummary(r, main, currentRevision, changedTargets);
    const workspace = el('section', `workspace ${state.mobileDetail ? 'show-detail' : ''}`);
    const left = el('div', 'list-panel');
    left.append(tabs([
        ['findings', `Constats ${r.findings.length}`],
        ['coverage', 'Couverture'],
        ['sources', 'Sources'],
    ], state.view, (id) => {
        state.view = id;
        state.mobileDetail = false;
        render();
    }, 'Vues de review', 'view-panel'));
    const panel = el('div', 'view-panel');
    panel.id = 'view-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `view-panel-${state.view}`);
    if (state.view === 'findings')
        renderFindingList(panel);
    if (state.view === 'coverage')
        renderCoverage(r, panel);
    if (state.view === 'sources')
        renderSources(r, panel);
    left.append(panel);
    const detail = el('article', 'detail-panel');
    detail.id = 'finding-detail';
    renderFindingDetail(r, detail, state, {
        back: () => {
            state.mobileDetail = false;
            render();
        },
        selectSection: (section) => {
            state.section = section;
            render();
        },
    });
    workspace.append(left, detail);
    main.append(workspace);
}
function renderFindingList(parent) {
    const filters = el('div', 'filters');
    const searchLabel = el('label', 'search-label', 'Rechercher un constat');
    const search = el('input', 'search');
    search.type = 'search';
    search.placeholder = 'Titre, identifiant, fichier…';
    search.value = state.filters.query;
    search.id = 'finding-search';
    searchLabel.append(search);
    filters.append(searchLabel);
    const select = (key, label, values) => {
        const l = el('label', '', label);
        const node = el('select');
        node.setAttribute('aria-label', label);
        for (const [value, name] of [['', 'Tous'], ...values]) {
            const option = el('option', '', name);
            option.value = value;
            node.append(option);
        }
        node.value = state.filters[key];
        node.addEventListener('change', () => {
            state.filters[key] = node.value;
            renderListOnly();
        });
        l.append(node);
        filters.append(l);
    };
    select('domain', 'Domaine', [...new Set(review.findings.map((f) => f.domain))].sort().map((v) => [v, v]));
    select('severity', 'Gravité', Object.entries(severityLabels));
    select('confidence', 'Confiance', Object.entries(confidenceLabels));
    select('resolution', 'Résolution', Object.entries(resolutionLabels));
    search.addEventListener('input', () => {
        state.filters.query = search.value;
        renderListOnly();
    });
    parent.append(filters);
    const results = el('div', 'finding-results');
    results.id = 'finding-results';
    parent.append(results);
    renderListOnly();
    // The parent is not yet attached during a complete render.
    fillFindingResults(results);
}
function renderListOnly() {
    const list = document.getElementById('finding-results');
    if (list)
        fillFindingResults(list);
    const note = document.getElementById('detail-filter-note');
    if (note && review)
        note.hidden = filterFindings(review, state.filters).some((f) => f.id === state.selected);
}
function fillFindingResults(parent) {
    parent.replaceChildren();
    const findings = filterFindings(review, state.filters);
    const count = el('p', 'result-count', `${findings.length} constat(s) affiché(s) sur ${review.findings.length}`);
    count.setAttribute('role', 'status');
    parent.append(count);
    if (!findings.length) {
        parent.append(el('div', 'empty small', review.findings.length
            ? 'Aucun résultat ne correspond aux filtres.'
            : 'Aucun problème détecté. Consultez la couverture et les limites avant de conclure.'));
        return;
    }
    for (const f of findings) {
        const b = button('', `finding ${state.selected === f.id ? 'selected' : ''}`, () => {
            state.selected = f.id;
            state.mobileDetail = true;
            state.section = 'evidence';
            history.pushState(null, '', `#finding=${encodeURIComponent(f.id)}`);
            render();
            document.getElementById('detail-title')?.focus();
        });
        b.setAttribute('aria-label', `${f.id} ${f.title}, ${severityLabels[f.severity]}, ${confidenceLabels[f.confidence]}, ${resolutionLabels[f.resolution]}`);
        b.setAttribute('aria-current', String(state.selected === f.id));
        const top = el('div', 'finding-top');
        top.append(el('strong', 'finding-id', f.id), badge(confidenceLabels[f.confidence], f.confidence, f.confidence === 'confirmed' ? '✓' : '?'));
        b.append(top, el('h3', '', f.title));
        const meta = el('div', 'finding-meta');
        meta.append(badge(severityLabels[f.severity], f.severity, '!'), el('span', '', f.domain), el('span', 'resolution', resolutionLabels[f.resolution]));
        b.append(meta);
        parent.append(b);
    }
}
function hashSelection() {
    const id = new URLSearchParams(location.hash.slice(1)).get('finding');
    if (id) {
        state.selected = id;
        state.view = 'findings';
        state.mobileDetail = true;
    }
}
window.addEventListener('hashchange', () => {
    hashSelection();
    render();
});
window.addEventListener('popstate', () => {
    hashSelection();
    render();
});
try {
    const payload = JSON.parse(data.textContent || '{}');
    if (payload.review != null)
        review = sanitizedReview(payload.review);
    if (typeof payload.legacy === 'string')
        legacy = redactReviewText(payload.legacy);
    currentRevision = typeof payload.currentRevision === 'string' ? payload.currentRevision : null;
    changedTargets =
        Array.isArray(payload.changedTargets) &&
            payload.changedTargets.every((v) => typeof v === 'string')
            ? payload.changedTargets
            : [];
    // Saved UI state is only a convenience; validate before using it in selectors/rendering.
    const saved = payload.uiState;
    if (saved &&
        ['findings', 'coverage', 'sources'].includes(saved.view) &&
        ['evidence', 'correction', 'references'].includes(saved.section) &&
        typeof saved.selected === 'string' &&
        saved.filters &&
        ['query', 'domain', 'severity', 'confidence', 'resolution'].every((k) => typeof saved.filters[k] === 'string'))
        state = saved;
    if (!state.selected && review?.findings[0])
        state.selected = review.findings[0].id;
    hashSelection();
    render();
}
catch {
    review = null;
    legacy = null;
    showError('Résultats invalides ou version non supportée. Ouvrez une review format 1 ou un rapport Markdown historique.');
}
