(function () {
'use strict';
 const severityLabels = {
    critical: 'Critique',
    major: 'Majeur',
    moderate: 'Modéré',
    minor: 'Mineur',
};
 const confidenceLabels = {
    confirmed: 'Confirmé',
    suspected: 'À vérifier',
};
 const resolutionLabels = {
    open: 'Ouvert',
    'in-progress': 'En correction',
    resolved: 'Résolu et vérifié',
    'accepted-risk': 'Risque accepté',
};
 const checkLabels = {
    passed: 'Réussi',
    failed: 'En échec',
    'not-run': 'Non exécuté',
    blocked: 'Bloqué',
    'out-of-scope': 'Hors périmètre',
};
const rec = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 16384;
const identifier = (v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v);
const arr = (v, test, max = 256) => Array.isArray(v) && v.length <= max && v.every(test);
const nullable = (v, test) => v === null || test(v);
const has = (v, choices) => typeof v === 'string' && choices.includes(v);
const shape = (v, keys) => rec(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
const date = (v) => typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(v) &&
    Number.isFinite(Date.parse(v));
 function reviewUrl(value) {
    // Reject embedded control characters before URL parsing can normalize them.
    // eslint-disable-next-line no-control-regex
    if (typeof value !== 'string' || value.length > 2048 || /[\s\x00-\x1f\x7f\\<>`"[\]]/.test(value))
        return false;
    try {
        const u = new URL(value);
        return u.protocol === 'https:' && Boolean(u.hostname) && !u.username && !u.password;
    }
    catch {
        return false;
    }
}
function assertReview(ok, message) {
    if (!ok)
        throw new Error(message);
}
function validReviewTicket(value) {
    return (shape(value, ['id', 'title', 'url']) &&
        identifier(value.id) &&
        str(value.title) &&
        nullable(value.url, reviewUrl));
}
function validReviewTechnology(value) {
    return shape(value, ['name', 'version', 'detectedFrom']) && Object.values(value).every(str);
}
function validReviewSource(value) {
    return (shape(value, [
        'id',
        'title',
        'kind',
        'publisher',
        'technology',
        'version',
        'url',
        'consultedAt',
        'access',
        'usage',
        'compatibility',
        'provenance',
    ]) &&
        identifier(value.id) &&
        ['title', 'publisher', 'technology', 'version', 'usage', 'compatibility', 'provenance'].every((key) => str(value[key])) &&
        has(value.kind, ['documentation', 'skill', 'project']) &&
        nullable(value.url, reviewUrl) &&
        nullable(value.consultedAt, date) &&
        has(value.access, ['consulted', 'unavailable', 'unverified']) &&
        (value.access !== 'consulted' || value.consultedAt !== null));
}
function validReviewImage(value) {
    return (shape(value, ['mime', 'base64', 'alt', 'origin', 'privacyReviewed']) &&
        has(value.mime, ['image/png', 'image/jpeg']) &&
        typeof value.base64 === 'string' &&
        value.base64.length <= 1400000 &&
        /^[A-Za-z0-9+/]+={0,2}$/.test(value.base64) &&
        (value.mime === 'image/png'
            ? value.base64.startsWith('iVBORw0KGgo')
            : value.base64.startsWith('/9j/')) &&
        str(value.alt) &&
        has(value.origin, ['captured', 'explanatory']) &&
        value.privacyReviewed === true);
}
function validReviewEvidence(value) {
    return (shape(value, ['id', 'title', 'kind', 'content', 'url', 'image']) &&
        identifier(value.id) &&
        str(value.title) &&
        has(value.kind, ['text', 'log', 'screenshot', 'diagram']) &&
        str(value.content) &&
        nullable(value.url, reviewUrl) &&
        nullable(value.image, validReviewImage));
}
function validReviewCheck(value) {
    return (shape(value, [
        'id',
        'title',
        'domain',
        'kind',
        'status',
        'result',
        'reason',
        'evidenceIds',
        'revision',
        'targets',
    ]) &&
        identifier(value.id) &&
        ['title', 'domain', 'result', 'revision'].every((key) => str(value[key])) &&
        has(value.kind, ['automated', 'manual']) &&
        has(value.status, Object.keys(checkLabels)) &&
        nullable(value.reason, str) &&
        (!['not-run', 'blocked', 'out-of-scope'].includes(value.status) ||
            str(value.reason)) &&
        arr(value.evidenceIds, identifier) &&
        arr(value.targets, str));
}
function validReviewLocation(value) {
    return (shape(value, ['path', 'line', 'component']) &&
        str(value.path) &&
        nullable(value.line, (line) => Number.isSafeInteger(line) && line > 0) &&
        nullable(value.component, str));
}
function validReviewFinding(value) {
    return (shape(value, [
        'id',
        'title',
        'domain',
        'severity',
        'severityReason',
        'confidence',
        'resolution',
        'location',
        'trigger',
        'expected',
        'observed',
        'impact',
        'reproduction',
        'evidenceIds',
        'correction',
        'tradeoffs',
        'sourceIds',
        'ticketIds',
        'verification',
        'resolutionEvidenceIds',
        'targets',
    ]) &&
        identifier(value.id) &&
        [
            'title',
            'domain',
            'severityReason',
            'trigger',
            'expected',
            'observed',
            'impact',
            'correction',
            'tradeoffs',
            'verification',
        ].every((key) => str(value[key])) &&
        has(value.severity, Object.keys(severityLabels)) &&
        has(value.confidence, Object.keys(confidenceLabels)) &&
        has(value.resolution, Object.keys(resolutionLabels)) &&
        validReviewLocation(value.location) &&
        ['reproduction', 'targets'].every((key) => arr(value[key], str)) &&
        ['evidenceIds', 'sourceIds', 'ticketIds', 'resolutionEvidenceIds'].every((key) => arr(value[key], identifier)) &&
        (value.reproduction.length > 0 || value.evidenceIds.length > 0) &&
        (value.resolution !== 'resolved' || value.resolutionEvidenceIds.length > 0));
}
function validReviewPolicy(value) {
    return (shape(value, ['blockingSeverities', 'requireAllChecks', 'rationale']) &&
        arr(value.blockingSeverities, (severity) => has(severity, Object.keys(severityLabels)), 4) &&
        typeof value.requireAllChecks === 'boolean' &&
        str(value.rationale));
}
function validateReviewHeader(input) {
    assertReview(rec(input) && input.format === 1, 'Unsupported review format; expected format 1.');
    assertReview(shape(input, [
        'format',
        'id',
        'title',
        'project',
        'mission',
        'tickets',
        'date',
        'scope',
        'exclusions',
        'revision',
        'technologies',
        'sources',
        'checks',
        'findings',
        'evidence',
        'limits',
        'policy',
        'summary',
    ]), 'Invalid review fields.');
    assertReview(identifier(input.id) &&
        ['title', 'project', 'mission', 'summary'].every((key) => str(input[key])) &&
        date(input.date), 'Invalid review identity or date.');
    assertReview(arr(input.scope, str) &&
        input.scope.length > 0 &&
        arr(input.exclusions, str) &&
        arr(input.limits, str), 'Invalid review scope or limits.');
    assertReview(shape(input.revision, ['commit', 'dirty']) &&
        str(input.revision.commit) &&
        arr(input.revision.dirty, str), 'Invalid inspected revision.');
}
function validateReviewSections(input) {
    assertReview(arr(input.tickets, validReviewTicket), 'Invalid review ticket.');
    assertReview(arr(input.technologies, validReviewTechnology), 'Invalid detected technologies.');
    assertReview(arr(input.sources, validReviewSource), 'Invalid review source or consultation provenance.');
    assertReview(arr(input.evidence, validReviewEvidence), 'Invalid evidence; images require bounded PNG/JPEG data, text alternative and privacy review.');
    assertReview(arr(input.checks, validReviewCheck), 'Invalid review check; unexecuted checks need a reason.');
    assertReview(arr(input.findings, validReviewFinding), 'Invalid finding; reproduction/evidence and verified resolution references are required.');
    assertReview(validReviewPolicy(input.policy), 'Invalid review conclusion policy.');
}
function reviewIdentifiers(items) {
    return new Set(items.map((item) => item.id));
}
function validateReviewReferences(review) {
    for (const items of [
        review.tickets,
        review.sources,
        review.evidence,
        review.checks,
        review.findings,
    ]) {
        assertReview(reviewIdentifiers(items).size === items.length, 'Duplicate review identifiers.');
    }
    const evidence = reviewIdentifiers(review.evidence);
    const sources = reviewIdentifiers(review.sources);
    const tickets = reviewIdentifiers(review.tickets);
    assertReview(review.checks.every((check) => check.evidenceIds.every((id) => evidence.has(id))) &&
        review.findings.every((finding) => [...finding.evidenceIds, ...finding.resolutionEvidenceIds].every((id) => evidence.has(id)) &&
            finding.sourceIds.every((id) => sources.has(id)) &&
            finding.ticketIds.every((id) => tickets.has(id))), 'Unresolved review references.');
}
/** Errors identify schema sections, never echo untrusted input. */
 function validateReview(input) {
    validateReviewHeader(input);
    validateReviewSections(input);
    const review = input;
    validateReviewReferences(review);
    assertReview(JSON.stringify(input).length <= 4 * 1024 * 1024, 'Review exceeds 4 MiB.');
    return JSON.parse(JSON.stringify(review));
}
/** Conservative convenience redaction, not a privacy classifier or authorization. */
 function redactReviewText(s) {
    return s
        .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
        .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,})\b/g, '[REDACTED TOKEN]')
        .replace(/\b(?:[a-z][a-z0-9_-]*[_-])?(?:token|api[_-]?key|password|secret|authorization)\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|(?:Bearer|Basic)\s+[^\s,;]+|[^\s,;]+)/gi, '[REDACTED CREDENTIAL]')
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]');
}
 function sanitizedReview(input) {
    const r = validateReview(input);
    const walk = (v, key = '') => typeof v === 'string'
        ? key === 'base64'
            ? v
            : redactReviewText(v)
        : Array.isArray(v)
            ? v.map((x) => walk(x))
            : rec(v)
                ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]))
                : v;
    // Redaction of a link can make it invalid. Remove it rather than navigating a changed URL.
    const clean = walk(r);
    for (const item of [...clean.sources, ...clean.tickets, ...clean.evidence])
        if (item.url !== null && !reviewUrl(item.url))
            item.url = null;
    return validateReview(clean);
}
 function summarizeReview(r) {
    const severities = { critical: 0, major: 0, moderate: 0, minor: 0 }, checks = { passed: 0, failed: 0, 'not-run': 0, blocked: 0, 'out-of-scope': 0 };
    for (const f of r.findings)
        severities[f.severity]++;
    for (const c of r.checks)
        checks[c.status]++;
    const suspected = r.findings.filter((f) => f.confidence === 'suspected' && f.resolution !== 'resolved').length;
    const blocking = r.findings.some((f) => f.confidence === 'confirmed' &&
        ['open', 'in-progress'].includes(f.resolution) &&
        r.policy.blockingSeverities.includes(f.severity));
    const conclusion = blocking || checks.failed > 0
        ? 'corrections'
        : checks.blocked > 0
            ? 'blocked'
            : checks.passed === 0 ||
                suspected > 0 ||
                (r.policy.requireAllChecks && checks['not-run'] > 0)
                ? 'incomplete'
                : 'ready';
    return { severities, suspected, checks, conclusion };
}
 const conclusionLabels = {
    corrections: 'Corrections nécessaires',
    ready: 'Prêt sur le périmètre vérifié',
    incomplete: 'Review incomplète',
    blocked: 'Vérification bloquée',
};
 function filterFindings(r, f) {
    const q = f.query.trim().toLocaleLowerCase();
    return r.findings.filter((i) => (!q ||
        [i.id, i.title, i.impact, i.location.path].join(' ').toLocaleLowerCase().includes(q)) &&
        (f.domain === '' || i.domain === f.domain) &&
        (f.severity === '' || i.severity === f.severity) &&
        (f.confidence === '' || i.confidence === f.confidence) &&
        (f.resolution === '' || i.resolution === f.resolution));
}
 function reviewFreshness(r, currentRevision, changedTargets) {
    const different = currentRevision !== null && currentRevision !== r.revision.commit;
    const affected = (targets) => targets.some((t) => changedTargets.includes(t));
    return {
        state: different || changedTargets.length
            ? 'different'
            : currentRevision === null
                ? 'unknown'
                : 'same',
        affectedChecks: r.checks.filter((c) => affected(c.targets)).map((c) => c.id),
        affectedFindings: r.findings.filter((f) => affected(f.targets)).map((f) => f.id),
    };
}
const md = (s) => s.replace(/[\\`*_{}[\]<>|#]/g, (c) => `\\${c}`).replace(/\n/g, '\\' + '\n');
 function reviewMarkdown(r) {
    const s = summarizeReview(r);
    const lines = [
        `# ${md(r.title)}`,
        '',
        `${md(r.project)} · ${md(r.mission)} · ${md(r.date)}`,
        `Revision: ${md(r.revision.commit)}; uncommitted changes: ${r.revision.dirty.map(md).join(', ') || 'none recorded'}`,
        '',
        `Conclusion: **${conclusionLabels[s.conclusion]}**`,
        md(r.summary),
        `Policy: ${md(r.policy.rationale)}`,
        '',
        '## Scope',
        ...r.scope.map((v) => `- ${md(v)}`),
        '',
        '## Exclusions and limits',
        ...[...r.exclusions, ...r.limits].map((v) => `- ${md(v)}`),
        '',
        '## Counts (whole review)',
        ...Object.entries(s.severities).map(([severity, count]) => `- ${severityLabels[severity]}: ${count}`),
        `- À vérifier: ${s.suspected}`,
        ...Object.entries(s.checks).map(([status, count]) => `- ${checkLabels[status]}: ${count}`),
        '',
        '## Coverage',
        ...r.checks.map((c) => `- **${md(c.id)} — ${md(c.title)}** (${md(c.domain)}, ${c.kind}): ${checkLabels[c.status]}. ${md(c.result)}${c.reason ? ` Reason: ${md(c.reason)}` : ''} Revision: ${md(c.revision)}. Evidence: ${c.evidenceIds.map(md).join(', ') || 'none'}`),
        '',
        '## Findings',
    ];
    for (const f of r.findings)
        lines.push('', `### ${md(f.id)} — ${md(f.title)}`, `${severityLabels[f.severity]} / ${confidenceLabels[f.confidence]} / ${resolutionLabels[f.resolution]}`, `Severity rationale: ${md(f.severityReason)}`, `Location: ${md(f.location.path)}${f.location.line ? `:${f.location.line}` : ''}`, `Impact: ${md(f.impact)}`, `Trigger: ${md(f.trigger)}`, `Expected: ${md(f.expected)}`, `Observed: ${md(f.observed)}`, 'Reproduction:', ...f.reproduction.map((v) => `- ${md(v)}`), `Evidence: ${f.evidenceIds.map(md).join(', ') || 'none'}`, `Correction: ${md(f.correction)}`, `Trade-offs: ${md(f.tradeoffs)}`, `Resolution verification: ${md(f.verification)}`, `Resolution evidence: ${f.resolutionEvidenceIds.map(md).join(', ') || 'none'}`, `Sources: ${f.sourceIds.map(md).join(', ') || 'none'}`, `Tickets: ${f.ticketIds.map(md).join(', ') || 'none'}`);
    lines.push('', '## Evidence');
    for (const e of r.evidence)
        lines.push('', `### ${md(e.id)} — ${md(e.title)}`, `${e.kind}${e.image ? ` (${e.image.origin}; image is embedded in HTML/JSON, text alternative: ${md(e.image.alt)})` : ''}`, md(e.content), e.url ? `Full evidence: ${e.url}` : 'No external evidence destination.');
    lines.push('', '## Sources');
    for (const source of r.sources)
        lines.push(`- ${md(source.id)}: ${md(source.title)} — ${md(source.publisher)}; ${md(source.technology)} ${md(source.version)}; ${source.access}; ${source.consultedAt || 'not consulted'}; ${source.url || 'no destination'}. ${md(source.usage)} Compatibility: ${md(source.compatibility)} Provenance: ${md(source.provenance)}`);
    lines.push('', '## Technologies', ...r.technologies.map((t) => `- ${md(t.name)} ${md(t.version)} (${md(t.detectedFrom)})`), '', '## Tickets', ...r.tickets.map((t) => `- ${md(t.id)} — ${md(t.title)}: ${t.url || 'no published destination'}`), '', 'Generated from review format 1. Counts describe the whole review. Historical evidence does not certify a later revision.', '');
    return lines.join('\n');
}


 const el = (tag, cls = '', text) => {
    const n = document.createElement(tag);
    if (cls)
        n.className = cls;
    if (text !== undefined)
        n.textContent = text;
    return n;
};
 function button(label, cls, action) {
    const b = el('button', cls, label);
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
}
 function textBlock(title, value, parent) {
    const box = el('section', 'text-block');
    box.append(el('h3', '', title), el('p', '', value));
    parent.append(box);
}
 function badge(label, kind, icon) {
    return el('span', `badge ${kind}`, `${icon} ${label}`);
}
 function link(label, url, parent, cls = 'link') {
    if (!reviewUrl(url)) {
        parent.append(el('p', 'muted unavailable', 'Destination indisponible : aucun lien HTTPS valide renseigné.'));
        return;
    }
    const a = el('a', cls, `${label} ↗`);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    parent.append(a);
}
 function download(name, body, type) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = el('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
 function tabs(items, active, change, label, panelId) {
    const group = el('div', 'tabs');
    group.setAttribute('role', 'tablist');
    group.setAttribute('aria-label', label);
    for (const [id, title] of items) {
        const b = button(title, active === id ? 'tab active' : 'tab', () => {
            change(id);
            document.getElementById(`${panelId}-${id}`)?.focus();
        });
        b.id = `${panelId}-${id}`;
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(active === id));
        b.setAttribute('aria-controls', panelId);
        b.tabIndex = active === id ? 0 : -1;
        b.addEventListener('keydown', (e) => {
            const index = items.findIndex((i) => i[0] === id);
            let next = null;
            if (e.key === 'ArrowRight')
                next = (index + 1) % items.length;
            if (e.key === 'ArrowLeft')
                next = (index + items.length - 1) % items.length;
            if (e.key === 'Home')
                next = 0;
            if (e.key === 'End')
                next = items.length - 1;
            if (next !== null) {
                e.preventDefault();
                change(items[next][0]);
                document.getElementById(`${panelId}-${items[next][0]}`)?.focus();
            }
        });
        group.append(b);
    }
    return group;
}



 function renderCoverage(review, parent) {
    parent.append(el('h2', 'panel-title', 'Couverture par domaine'), el('p', 'muted', 'Contrôles exécutés, non exécutés et hors périmètre. Aucun score de risque.'));
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
 function sourceCard(source) {
    const card = el('section', 'source-card');
    card.append(el('h3', '', source.title), el('p', 'source-meta', `${source.publisher} · ${source.technology} ${source.version}`), badge(source.access === 'consulted'
        ? 'Consultée'
        : source.access === 'unavailable'
            ? 'Inaccessible'
            : 'Non vérifiée', source.access === 'consulted' ? 'confirmed' : 'suspected', source.access === 'consulted' ? '✓' : '?'), el('p', 'muted', `Consultation : ${source.consultedAt || 'non enregistrée'} · ${source.kind}`));
    textBlock('Usage', source.usage, card);
    textBlock('Compatibilité & limites', source.compatibility, card);
    textBlock('Provenance', source.provenance, card);
    link('Ouvrir la référence', source.url, card);
    return card;
}
 function renderSources(review, parent) {
    parent.append(el('h2', 'panel-title', 'Sources & technologies'));
    for (const t of review.technologies)
        parent.append(el('p', 'technology', `${t.name} ${t.version} — ${t.detectedFrom}`));
    if (!review.sources.length)
        parent.append(el('p', 'empty small', 'Aucune source consultée enregistrée.'));
    for (const source of review.sources)
        parent.append(sourceCard(source));
}
 function ticketLinks(review, f, parent) {
    if (!f.ticketIds.length)
        parent.append(el('p', 'muted', 'Aucun ticket associé.'));
    for (const id of f.ticketIds) {
        const t = review.tickets.find((t) => t.id === id);
        parent.append(el('p', '', `${t.id} · ${t.title}`));
        link('Ouvrir le ticket', t.url, parent, 'button primary');
    }
}
 function evidenceDetail(review, f, parent) {
    textBlock('Scénario déclencheur', f.trigger, parent);
    const compare = el('div', 'compare');
    textBlock('Attendu', f.expected, compare);
    textBlock('Observé', f.observed, compare);
    parent.append(compare);
    const steps = el('ol', 'reproduction');
    for (const step of f.reproduction)
        steps.append(el('li', '', step));
    parent.append(steps);
    if (!f.evidenceIds.length)
        parent.append(el('p', 'notice', 'Preuve non disponible : ce constat repose sur les étapes et limites décrites ci-dessus.'));
    for (const [index, id] of f.evidenceIds.entries()) {
        const evidence = review.evidence.find((item) => item.id === id);
        parent.append(evidenceCard(evidence, index === 0));
    }
    const correction = el('div', 'correction-preview');
    correction.append(el('strong', '', '⌁ Correction proposée'), el('p', '', f.correction));
    parent.append(correction);
}
function checkCard(review, check) {
    const card = el('section', 'check-card');
    const icons = { passed: '✓', failed: '✕', 'not-run': '—', blocked: '—', 'out-of-scope': '—' };
    card.append(badge(checkLabels[check.status], check.status, icons[check.status]), el('h4', '', `${check.id} · ${check.title}`), el('p', '', check.result), el('p', 'muted', `${check.kind === 'manual' ? 'Inspection manuelle' : 'Contrôle automatisé'} · Révision ${check.revision}`));
    if (check.reason)
        card.append(el('p', '', `Raison : ${check.reason}`));
    for (const id of check.evidenceIds) {
        const evidence = review.evidence.find((item) => item.id === id);
        const details = el('details');
        details.append(el('summary', '', `Preuve ${id} · ${evidence.title}`), el('pre', '', evidence.content));
        card.append(details);
    }
    if (!check.evidenceIds.length)
        card.append(el('p', 'muted', 'Aucune preuve jointe.'));
    return card;
}
function evidenceCard(e, first) {
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
        card.append(el('p', 'muted', e.image.origin === 'captured'
            ? 'Capture déclarée réelle par l’auteur · confidentialité relue'
            : 'Illustration explicative · pas une preuve d’exécution'), img);
        img.addEventListener('error', () => {
            img.replaceWith(el('p', 'notice', `Image indisponible. Alternative : ${e.image.alt}`));
        });
    }
    card.append(el('pre', e.kind === 'diagram' ? 'diagram' : '', e.content));
    if (e.url)
        link('Ouvrir la preuve complète', e.url, card);
    else
        card.append(el('p', 'muted', 'Preuve incluse dans ce rapport ; aucun lien externe renseigné.'));
    return card;
}



 function renderSummary(r, main, currentRevision, changedTargets) {
    const sum = summarizeReview(r), fresh = reviewFreshness(r, currentRevision, changedTargets);
    const banner = el('section', `banner ${sum.conclusion}`);
    banner.append(el('span', 'banner-icon', sum.conclusion === 'ready' ? '✓' : sum.conclusion === 'corrections' ? '⚠' : 'ⓘ'));
    const message = el('div');
    message.append(el('h2', '', conclusionLabels[sum.conclusion]), el('p', '', r.summary), el('p', 'policy', r.policy.rationale));
    banner.append(message);
    main.append(banner);
    if (fresh.state === 'different')
        main.append(el('p', 'notice', `↻ Révision différente ou cibles modifiées : réévaluer les éléments concernés. Contrôles ciblés : ${fresh.affectedChecks.join(', ') || 'à déterminer'}. Constats ciblés : ${fresh.affectedFindings.join(', ') || 'à déterminer'}. Les preuves historiques et résultats indépendants sont conservés.`));
    else if (fresh.state === 'unknown')
        main.append(el('p', 'revision-hint', 'Historique : la révision courante n’est pas fournie. Cette review atteste uniquement de sa révision inspectée.'));
    renderStatistics(r, sum, main);
    renderLimits(r, main);
}
function renderStatistics(r, sum, main) {
    const stats = el('section', 'stats');
    stats.setAttribute('aria-label', 'Compteurs de toute la review, indépendants des filtres');
    for (const severity of ['critical', 'major', 'moderate', 'minor']) {
        const card = el('div', `stat ${severity}`);
        card.append(el('span', 'stat-icon', severity === 'critical' || severity === 'major' ? '!' : '△'), el('strong', '', String(sum.severities[severity])), el('span', '', severityLabels[severity]));
        stats.append(card);
    }
    const uncertain = el('div', 'stat suspected');
    uncertain.append(el('span', 'stat-icon', '?'), el('strong', '', String(sum.suspected)), el('span', '', 'À vérifier'));
    stats.append(uncertain);
    const coverage = el('div', 'stat coverage-stat');
    coverage.append(el('strong', '', `${sum.checks.passed} réussis · ${sum.checks.failed} en échec`), el('span', '', `${sum.checks['not-run']} non exécutés · ${sum.checks.blocked} bloqués · ${sum.checks['out-of-scope']} hors périmètre`));
    const bars = el('div', 'coverage-bars');
    bars.setAttribute('aria-hidden', 'true');
    const total = r.checks.length || 1;
    for (const [status, count] of Object.entries(sum.checks)) {
        const bar = el('span', status);
        bar.style.flexGrow = String(count / total);
        if (count)
            bars.append(bar);
    }
    coverage.append(bars);
    stats.append(coverage);
    main.append(stats, el('p', 'count-caption', 'Compteurs : toute la review, y compris les constats résolus. Les risques à vérifier sont indiqués séparément.'));
}
function renderLimits(r, main) {
    if (r.limits.length || r.exclusions.length) {
        const limits = el('details', 'limits');
        limits.append(el('summary', '', `Limites & périmètre · ${r.limits.length} limite(s) signalée(s)`));
        const ul = el('ul');
        for (const t of [
            ...r.scope.map((t) => `Inclus : ${t}`),
            ...r.exclusions.map((t) => `Exclu : ${t}`),
            ...r.limits,
        ])
            ul.append(el('li', '', t));
        limits.append(ul);
        main.append(limits);
        if (r.limits.length)
            main.append(el('p', 'important-limit', r.limits[0]));
    }
}




 function renderFindingDetail(review, parent, state, actions) {
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

})();
