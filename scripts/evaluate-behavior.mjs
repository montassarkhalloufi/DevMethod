import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const MAX_REPORT_BYTES = 2 * 1024 * 1024;
export const MAX_ARTIFACT_BYTES = 8 * 1024 * 1024;
const MAX_CAMPAIGN_ARTIFACT_BYTES = 64 * 1024 * 1024;
const directory = fileURLToPath(new URL('../evaluation/behavioral/', import.meta.url));
export const suite = JSON.parse(fs.readFileSync(path.join(directory, 'cases.json')));
export const oracle = JSON.parse(fs.readFileSync(path.join(directory, 'oracle.json')));
const fail = message => { throw new Error(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const string = x => typeof x === 'string' && x.trim().length > 0;
function shape(value, keys, label) {
  if (!object(value) || Object.keys(value).some(k => !keys.includes(k))) fail(`Malformed ${label}`);
}
function unique(values, label) { if (new Set(values).size !== values.length) fail(`Duplicate ${label}`); }
function array(value, label) { if (!Array.isArray(value)) fail(`Expected array: ${label}`); return value; }
function identifier(value) { if (!string(value) || !/^[A-Za-z0-9._-]+$/.test(value)) fail('Invalid identifier'); }
function validateSuite(spec, expectations) {
  if (spec?.format !== 1 || expectations?.format !== 1 || !Number.isInteger(spec.repetitions) || spec.repetitions < 1) fail('Invalid suite');
  array(spec.cases, 'cases'); array(expectations.cases, 'oracle');
  if (!spec.cases.length) fail('Empty suite');
  unique(spec.cases.map(c => c.id), 'case'); unique(expectations.cases.map(c => c.caseId), 'oracle case');
  if (spec.cases.length !== expectations.cases.length) fail('Oracle coverage mismatch');
  for (const c of spec.cases) {
    identifier(c.id);
    if (!string(c.prompt) || !string(c.setup) || !Number.isInteger(c.minimumSessions) || c.minimumSessions < 1) fail('Malformed case');
    const expected = expectations.cases.find(e => e.caseId === c.id);
    if (!expected || !Array.isArray(expected.criteria) || !expected.criteria.length) fail('Missing oracle criteria');
    unique(expected.criteria.map(e => e.id), 'criterion');
    expected.criteria.forEach(e => { identifier(e.id); if (!string(e.description)) fail('Malformed criterion'); });
  }
}
function artifactCheck(artifact, artifactRoot, budget) {
  shape(artifact, ['id', 'path', 'sha256', 'kind'], 'artifact'); identifier(artifact.id);
  if (!['transcript', 'snapshot', 'check', 'adjudication'].includes(artifact.kind) || !/^[a-f0-9]{64}$/.test(artifact.sha256)) fail('Invalid artifact digest/kind');
  if (!string(artifact.path) || path.isAbsolute(artifact.path) || artifact.path.includes('\\') || artifact.path.split('/').some(p => !p || p === '..' || p === '.')) fail('Unsafe artifact path');
  if (!artifactRoot) fail('Evidence requires an artifact root');
  const root = fs.realpathSync(artifactRoot);
  let current = root;
  for (const part of artifact.path.split('/')) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) fail('Symbolic artifact path');
  }
  const stat = fs.statSync(current);
  if (!stat.isFile()) fail('Artifact is not a regular file');
  if (stat.size > MAX_ARTIFACT_BYTES || budget.bytes + stat.size > MAX_CAMPAIGN_ARTIFACT_BYTES) fail('Artifact size limit exceeded');
  budget.bytes += stat.size;
  const bytes = fs.readFileSync(current);
  if (!bytes.length || createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) fail('Artifact hash mismatch or empty artifact');
}
/** Scores explicit, separately adjudicated observations. Never executes report text or dispatches agents. */
export function scoreBehavior(report, { spec = suite, expectations = oracle, artifactRoot } = {}) {
  validateSuite(spec, expectations);
  shape(report, ['format', 'runs'], 'report');
  if (report.format !== 1) fail('Unsupported report format');
  array(report.runs, 'runs');
  const slots = new Map(); const ids = new Set();
  let nativeConfiguration;
  const fixtureRevisions = new Map();
  const artifactBudget = { bytes: 0 };
  for (const run of report.runs) {
    shape(run, ['id', 'caseId', 'repetition', 'status', 'kind', 'reason', 'provenance', 'artifacts', 'judgments', 'metrics'], 'run');
    identifier(run.id);
    if (ids.has(run.id)) fail('Duplicate run id'); ids.add(run.id);
    const c = spec.cases.find(c => c.id === run.caseId);
    if (!c || !Number.isInteger(run.repetition) || run.repetition < 1 || run.repetition > spec.repetitions) fail('Unknown case or repetition');
    const key = `${run.caseId}:${run.repetition}`;
    if (slots.has(key)) fail('Duplicate run slot');
    if (!['completed', 'blocked', 'interrupted', 'not-run'].includes(run.status) || !['native', 'synthetic'].includes(run.kind)) fail('Invalid run status/kind');
    if (run.status !== 'completed' && !string(run.reason)) fail('Unfinished run requires reason');
    array(run.artifacts, 'artifacts'); unique(run.artifacts.map(a => a.id), 'artifact');
    run.artifacts.forEach(a => artifactCheck(a, artifactRoot, artifactBudget));
    const artifacts = new Map(run.artifacts.map(a => [a.id, a]));
    if (run.kind === 'native' && !['not-run', 'blocked'].includes(run.status)) {
      shape(run.provenance, ['host', 'hostVersion', 'model', 'methodRevision', 'fixtureRevision', 'permissions', 'startedAt', 'endedAt', 'sessions', 'adjudicator'], 'provenance');
      for (const field of ['host', 'hostVersion', 'model', 'methodRevision', 'fixtureRevision', 'permissions', 'adjudicator']) if (!string(run.provenance[field])) fail(`Missing provenance ${field}`);
      const p = run.provenance;
      const configuration = JSON.stringify(['host', 'hostVersion', 'model', 'methodRevision', 'permissions'].map(k => p[k]));
      if (nativeConfiguration && nativeConfiguration !== configuration) fail('Mixed native configurations require separate reports');
      nativeConfiguration = configuration;
      if (fixtureRevisions.has(run.caseId) && fixtureRevisions.get(run.caseId) !== p.fixtureRevision) fail('Mixed fixture revisions for the same case');
      fixtureRevisions.set(run.caseId, p.fixtureRevision);
      if (!Number.isFinite(Date.parse(p.startedAt)) || !Number.isFinite(Date.parse(p.endedAt)) || Date.parse(p.endedAt) < Date.parse(p.startedAt)) fail('Invalid timestamps');
      array(p.sessions, 'sessions'); unique(p.sessions.map(s => s.id), 'session'); unique(p.sessions.map(s => s.transcriptId), 'session transcript');
      if (!p.sessions.length || (run.status === 'completed' && p.sessions.length < c.minimumSessions)) fail('Insufficient actual sessions');
      for (const s of p.sessions) { shape(s, ['id', 'transcriptId'], 'session'); identifier(s.id); if (artifacts.get(s.transcriptId)?.kind !== 'transcript') fail('Missing session transcript'); }
      unique(p.sessions.map(s => artifacts.get(s.transcriptId).path), 'session transcript path');
      unique(p.sessions.map(s => artifacts.get(s.transcriptId).sha256), 'session transcript bytes');
    }
    const expected = expectations.cases.find(e => e.caseId === c.id).criteria;
    array(run.judgments, 'judgments'); unique(run.judgments.map(j => j.criterionId), 'judgment');
    for (const j of run.judgments) {
      shape(j, ['criterionId', 'verdict', 'justification', 'evidenceIds'], 'judgment');
      if (!expected.some(e => e.id === j.criterionId) || !['pass', 'fail', 'unresolved'].includes(j.verdict) || !string(j.justification)) fail('Invalid judgment');
      array(j.evidenceIds, 'evidence references'); unique(j.evidenceIds, 'evidence reference');
      if (j.evidenceIds.some(id => !artifacts.has(id)) || (j.verdict !== 'unresolved' && !j.evidenceIds.length)) fail('Missing or unknown judgment evidence');
    }
    shape(run.metrics, ['humanInterventions', 'tokens', 'elapsedMs', 'costUsd'], 'metrics');
    for (const field of ['humanInterventions', 'tokens', 'elapsedMs', 'costUsd']) {
      const value = run.metrics[field];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (['humanInterventions', 'tokens'].includes(field) && !Number.isInteger(value)))) fail(`Invalid metric ${field}; unknown must be null`);
    }
    slots.set(key, run);
  }
  const rows = [];
  for (const c of spec.cases) for (let repetition = 1; repetition <= spec.repetitions; repetition++) {
    const run = slots.get(`${c.id}:${repetition}`);
    const criteria = expectations.cases.find(e => e.caseId === c.id).criteria;
    const missing = criteria.filter(e => !run?.judgments.some(j => j.criterionId === e.id)).map(e => e.id);
    let outcome = run?.status ?? 'not-run';
    if (run?.status === 'completed') outcome = run.judgments.some(j => j.verdict === 'fail') ? 'failed' : missing.length || run.judgments.some(j => j.verdict === 'unresolved') ? 'unresolved' : 'passed';
    rows.push({ caseId: c.id, repetition, kind: run?.kind ?? null, outcome, missingCriteria: missing });
  }
  const native = rows.filter(r => r.kind === 'native');
  const completed = native.filter(r => ['passed', 'failed', 'unresolved'].includes(r.outcome));
  const passed = native.filter(r => r.outcome === 'passed').length;
  const metrics = {};
  for (const field of ['humanInterventions', 'tokens', 'elapsedMs', 'costUsd']) {
    const attempted = [...slots.values()].filter(r => r.kind === 'native' && !['not-run', 'blocked'].includes(r.status));
    const known = attempted.map(r => r.metrics[field]).filter(v => v !== null);
    metrics[field] = { knownRuns: known.length, unknownRuns: attempted.length - known.length, observedTotal: known.length ? known.reduce((a,b) => a+b, 0) : null };
  }
  return { format: 1, plannedRuns: rows.length, submittedRuns: report.runs.length, nativeCompletedRuns: completed.length,
    nativePassedRuns: passed, nativePassFractionOfPlan: passed / rows.length,
    nativePassRateAmongCompleted: completed.length ? passed / completed.length : null,
    outcomes: Object.fromEntries(['passed', 'failed', 'unresolved', 'not-run', 'blocked', 'interrupted'].map(k => [k, rows.filter(r => r.outcome === k).length])),
    syntheticRuns: rows.filter(r => r.kind === 'synthetic').length, metrics, rows,
    limitation: 'Hashes establish artifact integrity, not authenticity or judge correctness. Synthetic calibration is not model performance. Independent adjudication and repeated native runs are required.' };
}
if (process.argv[1] && path.relative(fileURLToPath(import.meta.url), path.resolve(process.argv[1])) === '') {
  try {
    const [file, artifactRoot, ...extra] = process.argv.slice(2);
    if (!file || extra.length) fail('Usage: node scripts/evaluate-behavior.mjs REPORT.json [ARTIFACT_ROOT]');
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_REPORT_BYTES) fail('Report must be a regular file within the report size limit');
    console.log(JSON.stringify(scoreBehavior(JSON.parse(fs.readFileSync(file, 'utf8')), { artifactRoot }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
