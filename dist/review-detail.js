import { severityLabels, confidenceLabels, resolutionLabels, filterFindings, } from './review-model.js';
import { el, button, badge, textBlock, tabs } from './review-dom.js';
import { sourceCard, ticketLinks, evidenceDetail } from './review-panels.js';
export function renderFindingDetail(review, parent, state, actions) {
    const back = button('← Retour aux résultats', 'back-button', () => {
        actions.back();
        (document.querySelector('.finding.selected') ||
            document.getElementById('view-panel-findings'))?.focus();
    });
    parent.append(back);
    const f = review.findings.find((f) => f.id === state.selected);
    if (!f) {
        parent.append(el('div', 'empty detail-empty', state.selected
            ? 'Ce constat est introuvable dans cette review. Revenez à la liste pour en sélectionner un autre.'
            : 'Sélectionnez un constat pour consulter ses preuves, sa correction et ses références.'));
        return;
    }
    renderDetailHeader(review, f, parent, state.filters);
    parent.append(tabs([
        ['evidence', 'Preuve'],
        ['correction', 'Correction'],
        ['references', 'Références'],
    ], state.section, (id) => {
        actions.selectSection(id);
    }, 'Détail du constat', 'detail-content'));
    const content = el('div', 'detail-content');
    content.id = 'detail-content';
    content.setAttribute('role', 'tabpanel');
    content.setAttribute('aria-labelledby', `detail-content-${state.section}`);
    renderDetailSection(review, f, content, state.section);
    parent.append(content);
    renderDetailActions(f, parent, actions);
}
function renderDetailHeader(review, f, parent, filters) {
    const filterNote = el('p', 'notice', 'Ce constat est hors de la sélection filtrée. Son détail reste disponible.');
    filterNote.id = 'detail-filter-note';
    filterNote.hidden = filterFindings(review, filters).some((item) => item.id === f.id);
    parent.append(filterNote);
    const title = el('h2', 'detail-title', `${f.id} · ${f.title}`);
    title.id = 'detail-title';
    title.tabIndex = -1;
    parent.append(title);
    const badges = el('div', 'detail-badges');
    badges.append(badge(severityLabels[f.severity], f.severity, '!'), badge(confidenceLabels[f.confidence], f.confidence, f.confidence === 'confirmed' ? '✓' : '?'), badge(resolutionLabels[f.resolution], 'neutral', '◌'));
    parent.append(badges, el('p', 'impact', f.impact), el('p', 'location', `${f.location.path}${f.location.line ? `:${f.location.line}` : ''}${f.location.component ? ` · ${f.location.component}` : ''}`));
}
function renderDetailSection(review, f, content, section) {
    if (section === 'evidence')
        evidenceDetail(review, f, content);
    if (section === 'correction') {
        textBlock('Correction recommandée', f.correction, content);
        textBlock('Conséquences & compromis', f.tradeoffs, content);
        textBlock('Vérification après correction', f.verification, content);
        textBlock('État de résolution', `${resolutionLabels[f.resolution]} · Preuves de résolution : ${f.resolutionEvidenceIds.join(', ') || 'aucune'}`, content);
        ticketLinks(review, f, content);
    }
    if (section === 'references') {
        textBlock('Justification de la gravité', f.severityReason, content);
        if (!f.sourceIds.length)
            content.append(el('p', 'empty small', 'Aucune référence pertinente renseignée.'));
        for (const id of f.sourceIds)
            content.append(sourceCard(review.sources.find((s) => s.id === id)));
    }
}
function renderDetailActions(f, parent, actions) {
    const footer = el('footer', 'detail-actions');
    footer.append(button('↗ Lien vers ce constat', 'button secondary', () => {
        const url = new URL(location.href);
        url.hash = `finding=${encodeURIComponent(f.id)}`;
        location.hash = url.hash;
        const destination = el('input');
        destination.readOnly = true;
        destination.value = url.href;
        destination.setAttribute('aria-label', 'Lien local vers le constat');
        footer.querySelector('input')?.remove();
        footer.append(destination);
        destination.focus();
        destination.select();
    }));
    if (f.evidenceIds.length)
        footer.append(button('▤ Voir la preuve', 'button primary', () => {
            actions.selectSection('evidence');
            document.getElementById('evidence-full')?.scrollIntoView({ block: 'nearest' });
            document.getElementById('evidence-full')?.focus();
        }));
    parent.append(footer);
}
