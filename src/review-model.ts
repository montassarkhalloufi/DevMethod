/** Pure format-1 contract shared by the CLI and browser. No filesystem or evaluation. */
import type {
  CheckStatus,
  Confidence,
  Resolution,
  Review,
  ReviewFilters,
  ReviewFinding,
  ReviewSummary,
  Severity,
} from './review-types.js';
export type {
  CheckStatus,
  Confidence,
  Resolution,
  Review,
  ReviewCheck,
  ReviewEvidence,
  ReviewFilters,
  ReviewFinding,
  ReviewSource,
  ReviewSummary,
  Severity,
} from './review-types.js';

export const severityLabels: Record<Severity, string> = {
  critical: 'Critique',
  major: 'Majeur',
  moderate: 'Modéré',
  minor: 'Mineur',
};
export const confidenceLabels: Record<Confidence, string> = {
  confirmed: 'Confirmé',
  suspected: 'À vérifier',
};
export const resolutionLabels: Record<Resolution, string> = {
  open: 'Ouvert',
  'in-progress': 'En correction',
  resolved: 'Résolu et vérifié',
  'accepted-risk': 'Risque accepté',
};
export const checkLabels: Record<CheckStatus, string> = {
  passed: 'Réussi',
  failed: 'En échec',
  'not-run': 'Non exécuté',
  blocked: 'Bloqué',
  'out-of-scope': 'Hors périmètre',
};
const rec = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= 16384;
const identifier = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v);
const arr = (v: unknown, test: (v: unknown) => boolean, max = 256): boolean =>
  Array.isArray(v) && v.length <= max && v.every(test);
const nullable = (v: unknown, test: (v: unknown) => boolean): boolean => v === null || test(v);
const has = (v: unknown, choices: string[]): boolean =>
  typeof v === 'string' && choices.includes(v);
const shape = (v: unknown, keys: string[]): v is Record<string, unknown> =>
  rec(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
const date = (v: unknown): boolean =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(v) &&
  Number.isFinite(Date.parse(v));
export function reviewUrl(value: unknown): value is string {
  // Reject embedded control characters before URL parsing can normalize them.
  // eslint-disable-next-line no-control-regex
  if (typeof value !== 'string' || value.length > 2048 || /[\s\x00-\x1f\x7f\\<>`"[\]]/.test(value))
    return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && Boolean(u.hostname) && !u.username && !u.password;
  } catch {
    return false;
  }
}

function assertReview(ok: boolean, message: string): asserts ok {
  if (!ok) throw new Error(message);
}

function validReviewTicket(value: unknown): boolean {
  return (
    shape(value, ['id', 'title', 'url']) &&
    identifier(value.id) &&
    str(value.title) &&
    nullable(value.url, reviewUrl)
  );
}

function validReviewTechnology(value: unknown): boolean {
  return shape(value, ['name', 'version', 'detectedFrom']) && Object.values(value).every(str);
}

function validReviewSource(value: unknown): boolean {
  return (
    shape(value, [
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
    ['title', 'publisher', 'technology', 'version', 'usage', 'compatibility', 'provenance'].every(
      (key) => str(value[key]),
    ) &&
    has(value.kind, ['documentation', 'skill', 'project']) &&
    nullable(value.url, reviewUrl) &&
    nullable(value.consultedAt, date) &&
    has(value.access, ['consulted', 'unavailable', 'unverified']) &&
    (value.access !== 'consulted' || value.consultedAt !== null)
  );
}

function validReviewImage(value: unknown): boolean {
  return (
    shape(value, ['mime', 'base64', 'alt', 'origin', 'privacyReviewed']) &&
    has(value.mime, ['image/png', 'image/jpeg']) &&
    typeof value.base64 === 'string' &&
    value.base64.length <= 1400000 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(value.base64) &&
    (value.mime === 'image/png'
      ? value.base64.startsWith('iVBORw0KGgo')
      : value.base64.startsWith('/9j/')) &&
    str(value.alt) &&
    has(value.origin, ['captured', 'explanatory']) &&
    value.privacyReviewed === true
  );
}

function validReviewEvidence(value: unknown): boolean {
  return (
    shape(value, ['id', 'title', 'kind', 'content', 'url', 'image']) &&
    identifier(value.id) &&
    str(value.title) &&
    has(value.kind, ['text', 'log', 'screenshot', 'diagram']) &&
    str(value.content) &&
    nullable(value.url, reviewUrl) &&
    nullable(value.image, validReviewImage)
  );
}

function validReviewCheck(value: unknown): boolean {
  return (
    shape(value, [
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
    (!['not-run', 'blocked', 'out-of-scope'].includes(value.status as string) ||
      str(value.reason)) &&
    arr(value.evidenceIds, identifier) &&
    arr(value.targets, str)
  );
}

function validReviewLocation(value: unknown): boolean {
  return (
    shape(value, ['path', 'line', 'component']) &&
    str(value.path) &&
    nullable(value.line, (line) => Number.isSafeInteger(line) && (line as number) > 0) &&
    nullable(value.component, str)
  );
}

function validReviewFinding(value: unknown): boolean {
  return (
    shape(value, [
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
    ['evidenceIds', 'sourceIds', 'ticketIds', 'resolutionEvidenceIds'].every((key) =>
      arr(value[key], identifier),
    ) &&
    ((value.reproduction as unknown[]).length > 0 || (value.evidenceIds as unknown[]).length > 0) &&
    (value.resolution !== 'resolved' || (value.resolutionEvidenceIds as unknown[]).length > 0)
  );
}

function validReviewPolicy(value: unknown): boolean {
  return (
    shape(value, ['blockingSeverities', 'requireAllChecks', 'rationale']) &&
    arr(value.blockingSeverities, (severity) => has(severity, Object.keys(severityLabels)), 4) &&
    typeof value.requireAllChecks === 'boolean' &&
    str(value.rationale)
  );
}

function validateReviewHeader(input: unknown): asserts input is Record<string, unknown> {
  assertReview(rec(input) && input.format === 1, 'Unsupported review format; expected format 1.');
  assertReview(
    shape(input, [
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
    ]),
    'Invalid review fields.',
  );
  assertReview(
    identifier(input.id) &&
      ['title', 'project', 'mission', 'summary'].every((key) => str(input[key])) &&
      date(input.date),
    'Invalid review identity or date.',
  );
  assertReview(
    arr(input.scope, str) &&
      (input.scope as unknown[]).length > 0 &&
      arr(input.exclusions, str) &&
      arr(input.limits, str),
    'Invalid review scope or limits.',
  );
  assertReview(
    shape(input.revision, ['commit', 'dirty']) &&
      str(input.revision.commit) &&
      arr(input.revision.dirty, str),
    'Invalid inspected revision.',
  );
}

function validateReviewSections(input: Record<string, unknown>): void {
  assertReview(arr(input.tickets, validReviewTicket), 'Invalid review ticket.');
  assertReview(arr(input.technologies, validReviewTechnology), 'Invalid detected technologies.');
  assertReview(
    arr(input.sources, validReviewSource),
    'Invalid review source or consultation provenance.',
  );
  assertReview(
    arr(input.evidence, validReviewEvidence),
    'Invalid evidence; images require bounded PNG/JPEG data, text alternative and privacy review.',
  );
  assertReview(
    arr(input.checks, validReviewCheck),
    'Invalid review check; unexecuted checks need a reason.',
  );
  assertReview(
    arr(input.findings, validReviewFinding),
    'Invalid finding; reproduction/evidence and verified resolution references are required.',
  );
  assertReview(validReviewPolicy(input.policy), 'Invalid review conclusion policy.');
}

function reviewIdentifiers(items: { id: string }[]): Set<string> {
  return new Set(items.map((item) => item.id));
}

function validateReviewReferences(review: Review): void {
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
  assertReview(
    review.checks.every((check) => check.evidenceIds.every((id) => evidence.has(id))) &&
      review.findings.every(
        (finding) =>
          [...finding.evidenceIds, ...finding.resolutionEvidenceIds].every((id) =>
            evidence.has(id),
          ) &&
          finding.sourceIds.every((id) => sources.has(id)) &&
          finding.ticketIds.every((id) => tickets.has(id)),
      ),
    'Unresolved review references.',
  );
}

/** Errors identify schema sections, never echo untrusted input. */
export function validateReview(input: unknown): Review {
  validateReviewHeader(input);
  validateReviewSections(input);
  const review = input as unknown as Review;
  validateReviewReferences(review);
  assertReview(JSON.stringify(input).length <= 4 * 1024 * 1024, 'Review exceeds 4 MiB.');
  return JSON.parse(JSON.stringify(review)) as Review;
}

/** Conservative convenience redaction, not a privacy classifier or authorization. */
export function redactReviewText(s: string): string {
  return s
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
      '[REDACTED PRIVATE KEY]',
    )
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,})\b/g, '[REDACTED TOKEN]')
    .replace(
      /\b(?:[a-z][a-z0-9_-]*[_-])?(?:token|api[_-]?key|password|secret|authorization)\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|(?:Bearer|Basic)\s+[^\s,;]+|[^\s,;]+)/gi,
      '[REDACTED CREDENTIAL]',
    )
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]');
}

export function sanitizedReview(input: unknown): Review {
  const r = validateReview(input);
  const walk = (v: unknown, key = ''): unknown =>
    typeof v === 'string'
      ? key === 'base64'
        ? v
        : redactReviewText(v)
      : Array.isArray(v)
        ? v.map((x) => walk(x))
        : rec(v)
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]))
          : v;
  // Redaction of a link can make it invalid. Remove it rather than navigating a changed URL.
  const clean = walk(r) as Review;
  for (const item of [...clean.sources, ...clean.tickets, ...clean.evidence])
    if (item.url !== null && !reviewUrl(item.url)) item.url = null;
  return validateReview(clean);
}

export function summarizeReview(r: Review): ReviewSummary {
  const severities = { critical: 0, major: 0, moderate: 0, minor: 0 },
    checks = { passed: 0, failed: 0, 'not-run': 0, blocked: 0, 'out-of-scope': 0 };
  for (const f of r.findings) severities[f.severity]++;
  for (const c of r.checks) checks[c.status]++;
  const suspected = r.findings.filter(
    (f) => f.confidence === 'suspected' && f.resolution !== 'resolved',
  ).length;
  const blocking = r.findings.some(
    (f) =>
      f.confidence === 'confirmed' &&
      ['open', 'in-progress'].includes(f.resolution) &&
      r.policy.blockingSeverities.includes(f.severity),
  );
  const conclusion =
    blocking || checks.failed > 0
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

export const conclusionLabels = {
  corrections: 'Corrections nécessaires',
  ready: 'Prêt sur le périmètre vérifié',
  incomplete: 'Review incomplète',
  blocked: 'Vérification bloquée',
};
export function filterFindings(r: Review, f: ReviewFilters): ReviewFinding[] {
  const q = f.query.trim().toLocaleLowerCase();
  return r.findings.filter(
    (i) =>
      (!q ||
        [i.id, i.title, i.impact, i.location.path].join(' ').toLocaleLowerCase().includes(q)) &&
      (f.domain === '' || i.domain === f.domain) &&
      (f.severity === '' || i.severity === f.severity) &&
      (f.confidence === '' || i.confidence === f.confidence) &&
      (f.resolution === '' || i.resolution === f.resolution),
  );
}

export function reviewFreshness(
  r: Review,
  currentRevision: string | null,
  changedTargets: string[],
): {
  state: 'unknown' | 'same' | 'different';
  affectedChecks: string[];
  affectedFindings: string[];
} {
  const different = currentRevision !== null && currentRevision !== r.revision.commit;
  const affected = (targets: string[]) => targets.some((t) => changedTargets.includes(t));
  return {
    state:
      different || changedTargets.length
        ? 'different'
        : currentRevision === null
          ? 'unknown'
          : 'same',
    affectedChecks: r.checks.filter((c) => affected(c.targets)).map((c) => c.id),
    affectedFindings: r.findings.filter((f) => affected(f.targets)).map((f) => f.id),
  };
}

const md = (s: string): string =>
  s.replace(/[\\`*_{}[\]<>|#]/g, (c) => `\\${c}`).replace(/\n/g, '\\' + '\n');
export function reviewMarkdown(r: Review): string {
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
    ...Object.entries(s.severities).map(
      ([severity, count]) => `- ${severityLabels[severity as Severity]}: ${count}`,
    ),
    `- À vérifier: ${s.suspected}`,
    ...Object.entries(s.checks).map(
      ([status, count]) => `- ${checkLabels[status as CheckStatus]}: ${count}`,
    ),
    '',
    '## Coverage',
    ...r.checks.map(
      (c) =>
        `- **${md(c.id)} — ${md(c.title)}** (${md(c.domain)}, ${c.kind}): ${checkLabels[c.status]}. ${md(c.result)}${c.reason ? ` Reason: ${md(c.reason)}` : ''} Revision: ${md(c.revision)}. Evidence: ${c.evidenceIds.map(md).join(', ') || 'none'}`,
    ),
    '',
    '## Findings',
  ];
  for (const f of r.findings)
    lines.push(
      '',
      `### ${md(f.id)} — ${md(f.title)}`,
      `${severityLabels[f.severity]} / ${confidenceLabels[f.confidence]} / ${resolutionLabels[f.resolution]}`,
      `Severity rationale: ${md(f.severityReason)}`,
      `Location: ${md(f.location.path)}${f.location.line ? `:${f.location.line}` : ''}`,
      `Impact: ${md(f.impact)}`,
      `Trigger: ${md(f.trigger)}`,
      `Expected: ${md(f.expected)}`,
      `Observed: ${md(f.observed)}`,
      'Reproduction:',
      ...f.reproduction.map((v) => `- ${md(v)}`),
      `Evidence: ${f.evidenceIds.map(md).join(', ') || 'none'}`,
      `Correction: ${md(f.correction)}`,
      `Trade-offs: ${md(f.tradeoffs)}`,
      `Resolution verification: ${md(f.verification)}`,
      `Resolution evidence: ${f.resolutionEvidenceIds.map(md).join(', ') || 'none'}`,
      `Sources: ${f.sourceIds.map(md).join(', ') || 'none'}`,
      `Tickets: ${f.ticketIds.map(md).join(', ') || 'none'}`,
    );
  lines.push('', '## Evidence');
  for (const e of r.evidence)
    lines.push(
      '',
      `### ${md(e.id)} — ${md(e.title)}`,
      `${e.kind}${e.image ? ` (${e.image.origin}; image is embedded in HTML/JSON, text alternative: ${md(e.image.alt)})` : ''}`,
      md(e.content),
      e.url ? `Full evidence: ${e.url}` : 'No external evidence destination.',
    );
  lines.push('', '## Sources');
  for (const source of r.sources)
    lines.push(
      `- ${md(source.id)}: ${md(source.title)} — ${md(source.publisher)}; ${md(source.technology)} ${md(source.version)}; ${source.access}; ${source.consultedAt || 'not consulted'}; ${source.url || 'no destination'}. ${md(source.usage)} Compatibility: ${md(source.compatibility)} Provenance: ${md(source.provenance)}`,
    );
  lines.push(
    '',
    '## Technologies',
    ...r.technologies.map((t) => `- ${md(t.name)} ${md(t.version)} (${md(t.detectedFrom)})`),
    '',
    '## Tickets',
    ...r.tickets.map(
      (t) => `- ${md(t.id)} — ${md(t.title)}: ${t.url || 'no published destination'}`,
    ),
    '',
    'Generated from review format 1. Counts describe the whole review. Historical evidence does not certify a later revision.',
    '',
  );
  return lines.join('\n');
}
