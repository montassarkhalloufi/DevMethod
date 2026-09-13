export const severityLabels = { critical: 'Critique', major: 'Majeur', moderate: 'Modéré', minor: 'Mineur' };
export const confidenceLabels = { confirmed: 'Confirmé', suspected: 'À vérifier' };
export const resolutionLabels = { open: 'Ouvert', 'in-progress': 'En correction', resolved: 'Résolu et vérifié', 'accepted-risk': 'Risque accepté' };
export const checkLabels = { passed: 'Réussi', failed: 'En échec', 'not-run': 'Non exécuté', blocked: 'Bloqué', 'out-of-scope': 'Hors périmètre' };
const rec = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 16384;
const identifier = (v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v);
const arr = (v, test, max = 256) => Array.isArray(v) && v.length <= max && v.every(test);
const nullable = (v, test) => v === null || test(v);
const has = (v, choices) => typeof v === 'string' && choices.includes(v);
const shape = (v, keys) => rec(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const date = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(v) && Number.isFinite(Date.parse(v));
export function reviewUrl(value) {
    if (typeof value !== 'string' || value.length > 2048 || /[\s\x00-\x1f\x7f\\<>`"\[\]]/.test(value))
        return false;
    try {
        const u = new URL(value);
        return u.protocol === 'https:' && Boolean(u.hostname) && !u.username && !u.password;
    }
    catch {
        return false;
    }
}
function assertReview(ok, message) { if (!ok)
    throw new Error(message); }
/** Errors identify schema sections, never echo untrusted input. */
export function validateReview(input) {
    assertReview(rec(input) && input.format === 1, 'Unsupported review format; expected format 1.');
    assertReview(shape(input, ['format', 'id', 'title', 'project', 'mission', 'tickets', 'date', 'scope', 'exclusions', 'revision', 'technologies', 'sources', 'checks', 'findings', 'evidence', 'limits', 'policy', 'summary']), 'Invalid review fields.');
    assertReview(identifier(input.id) && ['title', 'project', 'mission', 'summary'].every(k => str(input[k])) && date(input.date), 'Invalid review identity or date.');
    assertReview(arr(input.scope, str) && input.scope.length > 0 && arr(input.exclusions, str) && arr(input.limits, str), 'Invalid review scope or limits.');
    assertReview(shape(input.revision, ['commit', 'dirty']) && str(input.revision.commit) && arr(input.revision.dirty, str), 'Invalid inspected revision.');
    assertReview(arr(input.tickets, v => shape(v, ['id', 'title', 'url']) && identifier(v.id) && str(v.title) && nullable(v.url, reviewUrl)), 'Invalid review ticket.');
    assertReview(arr(input.technologies, v => shape(v, ['name', 'version', 'detectedFrom']) && Object.values(v).every(str)), 'Invalid detected technologies.');
    assertReview(arr(input.sources, v => shape(v, ['id', 'title', 'kind', 'publisher', 'technology', 'version', 'url', 'consultedAt', 'access', 'usage', 'compatibility', 'provenance']) && identifier(v.id) && ['title', 'publisher', 'technology', 'version', 'usage', 'compatibility', 'provenance'].every(k => str(v[k])) && has(v.kind, ['documentation', 'skill', 'project']) && nullable(v.url, reviewUrl) && nullable(v.consultedAt, date) && has(v.access, ['consulted', 'unavailable', 'unverified']) && (v.access !== 'consulted' || v.consultedAt !== null)), 'Invalid review source or consultation provenance.');
    assertReview(arr(input.evidence, v => shape(v, ['id', 'title', 'kind', 'content', 'url', 'image']) && identifier(v.id) && str(v.title) && has(v.kind, ['text', 'log', 'screenshot', 'diagram']) && str(v.content) && nullable(v.url, reviewUrl) && nullable(v.image, i => shape(i, ['mime', 'base64', 'alt', 'origin', 'privacyReviewed']) && has(i.mime, ['image/png', 'image/jpeg']) && typeof i.base64 === 'string' && i.base64.length <= 1400000 && /^[A-Za-z0-9+/]+={0,2}$/.test(i.base64) && (i.mime === 'image/png' ? i.base64.startsWith('iVBORw0KGgo') : i.base64.startsWith('/9j/')) && str(i.alt) && has(i.origin, ['captured', 'explanatory']) && i.privacyReviewed === true)), 'Invalid evidence; images require bounded PNG/JPEG data, text alternative and privacy review.');
    assertReview(arr(input.checks, v => shape(v, ['id', 'title', 'domain', 'kind', 'status', 'result', 'reason', 'evidenceIds', 'revision', 'targets']) && identifier(v.id) && ['title', 'domain', 'result', 'revision'].every(k => str(v[k])) && has(v.kind, ['automated', 'manual']) && has(v.status, Object.keys(checkLabels)) && nullable(v.reason, str) && (!['not-run', 'blocked', 'out-of-scope'].includes(v.status) || str(v.reason)) && arr(v.evidenceIds, identifier) && arr(v.targets, str)), 'Invalid review check; unexecuted checks need a reason.');
    assertReview(arr(input.findings, v => shape(v, ['id', 'title', 'domain', 'severity', 'severityReason', 'confidence', 'resolution', 'location', 'trigger', 'expected', 'observed', 'impact', 'reproduction', 'evidenceIds', 'correction', 'tradeoffs', 'sourceIds', 'ticketIds', 'verification', 'resolutionEvidenceIds', 'targets']) && identifier(v.id) && ['title', 'domain', 'severityReason', 'trigger', 'expected', 'observed', 'impact', 'correction', 'tradeoffs', 'verification'].every(k => str(v[k])) && has(v.severity, Object.keys(severityLabels)) && has(v.confidence, Object.keys(confidenceLabels)) && has(v.resolution, Object.keys(resolutionLabels)) && shape(v.location, ['path', 'line', 'component']) && str(v.location.path) && nullable(v.location.line, n => Number.isSafeInteger(n) && n > 0) && nullable(v.location.component, str) && ['reproduction', 'targets'].every(k => arr(v[k], str)) && ['evidenceIds', 'sourceIds', 'ticketIds', 'resolutionEvidenceIds'].every(k => arr(v[k], identifier)) && (v.reproduction.length > 0 || v.evidenceIds.length > 0) && (v.resolution !== 'resolved' || v.resolutionEvidenceIds.length > 0)), 'Invalid finding; reproduction/evidence and verified resolution references are required.');
    assertReview(shape(input.policy, ['blockingSeverities', 'requireAllChecks', 'rationale']) && arr(input.policy.blockingSeverities, v => has(v, Object.keys(severityLabels)), 4) && typeof input.policy.requireAllChecks === 'boolean' && str(input.policy.rationale), 'Invalid review conclusion policy.');
    const r = input;
    for (const items of [r.tickets, r.sources, r.evidence, r.checks, r.findings])
        assertReview(new Set(items.map(i => i.id)).size === items.length, 'Duplicate review identifiers.');
    const ids = (items) => new Set(items.map(i => i.id));
    const evidence = ids(r.evidence), sources = ids(r.sources), tickets = ids(r.tickets);
    assertReview(r.checks.every(c => c.evidenceIds.every(id => evidence.has(id))) && r.findings.every(f => [...f.evidenceIds, ...f.resolutionEvidenceIds].every(id => evidence.has(id)) && f.sourceIds.every(id => sources.has(id)) && f.ticketIds.every(id => tickets.has(id))), 'Unresolved review references.');
    assertReview(JSON.stringify(input).length <= 4 * 1024 * 1024, 'Review exceeds 4 MiB.');
    return JSON.parse(JSON.stringify(r));
}
/** Conservative convenience redaction, not a privacy classifier or authorization. */
export function redactReviewText(s) {
    return s.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
        .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,})\b/g, '[REDACTED TOKEN]')
        .replace(/\b(?:[a-z][a-z0-9_-]*[_-])?(?:token|api[_-]?key|password|secret|authorization)\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|(?:Bearer|Basic)\s+[^\s,;]+|[^\s,;]+)/gi, '[REDACTED CREDENTIAL]')
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]');
}
export function sanitizedReview(input) {
    const r = validateReview(input);
    const walk = (v, key = '') => typeof v === 'string' ? key === 'base64' ? v : redactReviewText(v) : Array.isArray(v) ? v.map(x => walk(x)) : rec(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)])) : v;
    // Redaction of a link can make it invalid. Remove it rather than navigating a changed URL.
    const clean = walk(r);
    for (const item of [...clean.sources, ...clean.tickets, ...clean.evidence])
        if (item.url !== null && !reviewUrl(item.url))
            item.url = null;
    return validateReview(clean);
}
export function summarizeReview(r) {
    const severities = { critical: 0, major: 0, moderate: 0, minor: 0 }, checks = { passed: 0, failed: 0, 'not-run': 0, blocked: 0, 'out-of-scope': 0 };
    for (const f of r.findings)
        severities[f.severity]++;
    for (const c of r.checks)
        checks[c.status]++;
    const suspected = r.findings.filter(f => f.confidence === 'suspected' && f.resolution !== 'resolved').length;
    const blocking = r.findings.some(f => f.confidence === 'confirmed' && ['open', 'in-progress'].includes(f.resolution) && r.policy.blockingSeverities.includes(f.severity));
    const conclusion = blocking || checks.failed > 0 ? 'corrections' : checks.blocked > 0 ? 'blocked' : checks.passed === 0 || suspected > 0 || (r.policy.requireAllChecks && checks['not-run'] > 0) ? 'incomplete' : 'ready';
    return { severities, suspected, checks, conclusion };
}
export const conclusionLabels = { corrections: 'Corrections nécessaires', ready: 'Prêt sur le périmètre vérifié', incomplete: 'Review incomplète', blocked: 'Vérification bloquée' };
export function filterFindings(r, f) {
    const q = f.query.trim().toLocaleLowerCase();
    return r.findings.filter(i => (!q || [i.id, i.title, i.impact, i.location.path].join(' ').toLocaleLowerCase().includes(q)) && (f.domain === '' || i.domain === f.domain) && (f.severity === '' || i.severity === f.severity) && (f.confidence === '' || i.confidence === f.confidence) && (f.resolution === '' || i.resolution === f.resolution));
}
export function reviewFreshness(r, currentRevision, changedTargets) {
    const different = currentRevision !== null && currentRevision !== r.revision.commit;
    const affected = (targets) => targets.some(t => changedTargets.includes(t));
    return { state: different || changedTargets.length ? 'different' : currentRevision === null ? 'unknown' : 'same', affectedChecks: r.checks.filter(c => affected(c.targets)).map(c => c.id), affectedFindings: r.findings.filter(f => affected(f.targets)).map(f => f.id) };
}
const md = (s) => s.replace(/[\\`*_{}\[\]<>|#]/g, c => `\\${c}`).replace(/\n/g, '\\' + '\n');
export function reviewMarkdown(r) {
    const s = summarizeReview(r);
    const lines = [`# ${md(r.title)}`, '', `${md(r.project)} · ${md(r.mission)} · ${md(r.date)}`, `Revision: ${md(r.revision.commit)}; uncommitted changes: ${r.revision.dirty.map(md).join(', ') || 'none recorded'}`, '', `Conclusion: **${conclusionLabels[s.conclusion]}**`, md(r.summary), `Policy: ${md(r.policy.rationale)}`, '', '## Scope', ...r.scope.map(v => `- ${md(v)}`), '', '## Exclusions and limits', ...[...r.exclusions, ...r.limits].map(v => `- ${md(v)}`), '', '## Counts (whole review)', ...Object.entries(s.severities).map(([severity, count]) => `- ${severityLabels[severity]}: ${count}`), `- À vérifier: ${s.suspected}`, ...Object.entries(s.checks).map(([status, count]) => `- ${checkLabels[status]}: ${count}`), '', '## Coverage', ...r.checks.map(c => `- **${md(c.id)} — ${md(c.title)}** (${md(c.domain)}, ${c.kind}): ${checkLabels[c.status]}. ${md(c.result)}${c.reason ? ` Reason: ${md(c.reason)}` : ''} Revision: ${md(c.revision)}. Evidence: ${c.evidenceIds.map(md).join(', ') || 'none'}`), '', '## Findings'];
    for (const f of r.findings)
        lines.push('', `### ${md(f.id)} — ${md(f.title)}`, `${severityLabels[f.severity]} / ${confidenceLabels[f.confidence]} / ${resolutionLabels[f.resolution]}`, `Severity rationale: ${md(f.severityReason)}`, `Location: ${md(f.location.path)}${f.location.line ? `:${f.location.line}` : ''}`, `Impact: ${md(f.impact)}`, `Trigger: ${md(f.trigger)}`, `Expected: ${md(f.expected)}`, `Observed: ${md(f.observed)}`, 'Reproduction:', ...f.reproduction.map(v => `- ${md(v)}`), `Evidence: ${f.evidenceIds.map(md).join(', ') || 'none'}`, `Correction: ${md(f.correction)}`, `Trade-offs: ${md(f.tradeoffs)}`, `Resolution verification: ${md(f.verification)}`, `Resolution evidence: ${f.resolutionEvidenceIds.map(md).join(', ') || 'none'}`, `Sources: ${f.sourceIds.map(md).join(', ') || 'none'}`, `Tickets: ${f.ticketIds.map(md).join(', ') || 'none'}`);
    lines.push('', '## Evidence');
    for (const e of r.evidence)
        lines.push('', `### ${md(e.id)} — ${md(e.title)}`, `${e.kind}${e.image ? ` (${e.image.origin}; image is embedded in HTML/JSON, text alternative: ${md(e.image.alt)})` : ''}`, md(e.content), e.url ? `Full evidence: ${e.url}` : 'No external evidence destination.');
    lines.push('', '## Sources');
    for (const source of r.sources)
        lines.push(`- ${md(source.id)}: ${md(source.title)} — ${md(source.publisher)}; ${md(source.technology)} ${md(source.version)}; ${source.access}; ${source.consultedAt || 'not consulted'}; ${source.url || 'no destination'}. ${md(source.usage)} Compatibility: ${md(source.compatibility)} Provenance: ${md(source.provenance)}`);
    lines.push('', '## Technologies', ...r.technologies.map(t => `- ${md(t.name)} ${md(t.version)} (${md(t.detectedFrom)})`), '', '## Tickets', ...r.tickets.map(t => `- ${md(t.id)} — ${md(t.title)}: ${t.url || 'no published destination'}`), '', 'Generated from review format 1. Counts describe the whole review. Historical evidence does not certify a later revision.', '');
    return lines.join('\n');
}
