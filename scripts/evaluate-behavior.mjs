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
const fail = (message) => {
  throw new Error(message);
};
const object = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const string = (x) => typeof x === 'string' && x.trim().length > 0;

function shape(value, keys, label) {
  if (!object(value) || Object.keys(value).some((k) => !keys.includes(k)))
    fail(`Malformed ${label}`);
}

function unique(values, label) {
  if (new Set(values).size !== values.length) fail(`Duplicate ${label}`);
}

function array(value, label) {
  if (!Array.isArray(value)) fail(`Expected array: ${label}`);
  return value;
}

function identifier(value) {
  if (!string(value) || !/^[A-Za-z0-9._-]+$/.test(value)) fail('Invalid identifier');
}

function timestamp(value) {
  // Require an explicit timezone and reject calendar rollover accepted by Date.parse.
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      value,
    )
  )
    fail('Invalid timestamps');
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const parsed = Date.parse(value);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value.slice(0, 10) ||
    !Number.isFinite(parsed)
  )
    fail('Invalid timestamps');
  return parsed;
}

function validateSuite(spec, expectations) {
  if (
    spec?.format !== 1 ||
    expectations?.format !== 1 ||
    !Number.isInteger(spec.repetitions) ||
    spec.repetitions < 1
  )
    fail('Invalid suite');
  array(spec.cases, 'cases');
  array(expectations.cases, 'oracle');
  if (!spec.cases.length) fail('Empty suite');
  unique(
    spec.cases.map((c) => c.id),
    'case',
  );
  unique(
    expectations.cases.map((c) => c.caseId),
    'oracle case',
  );
  if (spec.cases.length !== expectations.cases.length) fail('Oracle coverage mismatch');
  for (const c of spec.cases) {
    identifier(c.id);
    if (
      !string(c.prompt) ||
      !string(c.setup) ||
      !Number.isInteger(c.minimumSessions) ||
      c.minimumSessions < 1
    )
      fail('Malformed case');
    const expected = expectations.cases.find((e) => e.caseId === c.id);
    if (!expected || !Array.isArray(expected.criteria) || !expected.criteria.length)
      fail('Missing oracle criteria');
    unique(
      expected.criteria.map((e) => e.id),
      'criterion',
    );
    expected.criteria.forEach((e) => {
      identifier(e.id);
      if (!string(e.description)) fail('Malformed criterion');
    });
  }
}

function artifactCheck(artifact, artifactRoot, budget) {
  shape(artifact, ['id', 'path', 'sha256', 'kind'], 'artifact');
  identifier(artifact.id);
  if (
    !['transcript', 'snapshot', 'check', 'adjudication'].includes(artifact.kind) ||
    !/^[a-f0-9]{64}$/.test(artifact.sha256)
  )
    fail('Invalid artifact digest/kind');
  if (
    !string(artifact.path) ||
    path.isAbsolute(artifact.path) ||
    artifact.path.includes('\\') ||
    artifact.path.split('/').some((p) => !p || p === '..' || p === '.')
  )
    fail('Unsafe artifact path');
  if (!artifactRoot) fail('Evidence requires an artifact root');
  const root = fs.realpathSync(artifactRoot);
  let current = root;
  for (const part of artifact.path.split('/')) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) fail('Symbolic artifact path');
  }
  const stat = fs.statSync(current);
  if (!stat.isFile()) fail('Artifact is not a regular file');
  if (stat.size > MAX_ARTIFACT_BYTES || budget.bytes + stat.size > MAX_CAMPAIGN_ARTIFACT_BYTES)
    fail('Artifact size limit exceeded');
  budget.bytes += stat.size;
  const bytes = fs.readFileSync(current);
  if (!bytes.length || createHash('sha256').update(bytes).digest('hex') !== artifact.sha256)
    fail('Artifact hash mismatch or empty artifact');
}

const metricFields = ['humanInterventions', 'tokens', 'elapsedMs', 'costUsd'];
const countMetrics = ['humanInterventions', 'tokens'];
const provenanceFields = [
  'host',
  'hostVersion',
  'model',
  'methodRevision',
  'fixtureRevision',
  'permissions',
  'adjudicator',
];
const configurationFields = ['host', 'hostVersion', 'model', 'methodRevision', 'permissions'];
const outcomes = ['passed', 'failed', 'unresolved', 'not-run', 'blocked', 'interrupted'];

function validateRunIdentity(run, spec, campaign) {
  shape(
    run,
    [
      'id',
      'caseId',
      'repetition',
      'status',
      'kind',
      'reason',
      'provenance',
      'artifacts',
      'judgments',
      'metrics',
    ],
    'run',
  );
  identifier(run.id);
  if (campaign.ids.has(run.id)) fail('Duplicate run id');
  campaign.ids.add(run.id);
  const caseSpec = spec.cases.find((c) => c.id === run.caseId);
  if (
    !caseSpec ||
    !Number.isInteger(run.repetition) ||
    run.repetition < 1 ||
    run.repetition > spec.repetitions
  )
    fail('Unknown case or repetition');
  const key = `${run.caseId}:${run.repetition}`;
  if (campaign.slots.has(key)) fail('Duplicate run slot');
  if (
    !['completed', 'blocked', 'interrupted', 'not-run'].includes(run.status) ||
    !['native', 'synthetic'].includes(run.kind)
  )
    fail('Invalid run status/kind');
  if (run.status !== 'completed' && !string(run.reason)) fail('Unfinished run requires reason');
  return { caseSpec, key };
}

function validateArtifacts(artifacts, artifactRoot, budget) {
  array(artifacts, 'artifacts');
  unique(
    artifacts.map((a) => a.id),
    'artifact',
  );
  artifacts.forEach((a) => artifactCheck(a, artifactRoot, budget));
  return new Map(artifacts.map((a) => [a.id, a]));
}

function isNativeAttempt(run) {
  return run.kind === 'native' && !['not-run', 'blocked'].includes(run.status);
}

function recordNativeConfiguration(provenance, caseId, campaign) {
  const configuration = JSON.stringify(configurationFields.map((key) => provenance[key]));
  if (campaign.nativeConfiguration && campaign.nativeConfiguration !== configuration)
    fail('Mixed native configurations require separate reports');
  campaign.nativeConfiguration = configuration;
  if (
    campaign.fixtureRevisions.has(caseId) &&
    campaign.fixtureRevisions.get(caseId) !== provenance.fixtureRevision
  )
    fail('Mixed fixture revisions for the same case');
  campaign.fixtureRevisions.set(caseId, provenance.fixtureRevision);
}

function validateSessions(sessions, status, minimumSessions, artifacts) {
  array(sessions, 'sessions');
  unique(
    sessions.map((s) => s.id),
    'session',
  );
  unique(
    sessions.map((s) => s.transcriptId),
    'session transcript',
  );
  if (!sessions.length || (status === 'completed' && sessions.length < minimumSessions))
    fail('Insufficient actual sessions');
  for (const session of sessions) {
    shape(session, ['id', 'transcriptId'], 'session');
    identifier(session.id);
    if (artifacts.get(session.transcriptId)?.kind !== 'transcript')
      fail('Missing session transcript');
  }
  unique(
    sessions.map((s) => artifacts.get(s.transcriptId).path),
    'session transcript path',
  );
  unique(
    sessions.map((s) => artifacts.get(s.transcriptId).sha256),
    'session transcript bytes',
  );
}

function recordNativeTranscripts(sessions, artifacts, campaign) {
  for (const session of sessions) {
    const transcript = artifacts.get(session.transcriptId);
    if (
      campaign.transcriptPaths.has(transcript.path) ||
      campaign.transcriptHashes.has(transcript.sha256)
    )
      fail('Reused native session transcript across runs');
    campaign.transcriptPaths.add(transcript.path);
    campaign.transcriptHashes.add(transcript.sha256);
  }
}

function validateNativeProvenance(run, caseSpec, artifacts, campaign) {
  if (!isNativeAttempt(run)) return;
  const provenance = run.provenance;
  shape(provenance, [...provenanceFields, 'startedAt', 'endedAt', 'sessions'], 'provenance');
  for (const field of provenanceFields) {
    if (!string(provenance[field])) fail(`Missing provenance ${field}`);
  }
  recordNativeConfiguration(provenance, run.caseId, campaign);
  if (timestamp(provenance.endedAt) < timestamp(provenance.startedAt)) fail('Invalid timestamps');
  validateSessions(provenance.sessions, run.status, caseSpec.minimumSessions, artifacts);
  recordNativeTranscripts(provenance.sessions, artifacts, campaign);
}

function validateJudgments(judgments, criteria, artifacts) {
  array(judgments, 'judgments');
  unique(
    judgments.map((j) => j.criterionId),
    'judgment',
  );
  for (const judgment of judgments) {
    shape(judgment, ['criterionId', 'verdict', 'justification', 'evidenceIds'], 'judgment');
    if (
      !criteria.some((e) => e.id === judgment.criterionId) ||
      !['pass', 'fail', 'unresolved'].includes(judgment.verdict) ||
      !string(judgment.justification)
    )
      fail('Invalid judgment');
    array(judgment.evidenceIds, 'evidence references');
    unique(judgment.evidenceIds, 'evidence reference');
    if (
      judgment.evidenceIds.some((id) => !artifacts.has(id)) ||
      (judgment.verdict !== 'unresolved' && !judgment.evidenceIds.length)
    )
      fail('Missing or unknown judgment evidence');
  }
}

function validateMetrics(metrics) {
  shape(metrics, metricFields, 'metrics');
  for (const field of metricFields) {
    const value = metrics[field];
    if (
      value !== null &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        (countMetrics.includes(field) && !Number.isSafeInteger(value)))
    )
      fail(`Invalid metric ${field}; counts must be safe integers and unknown must be null`);
  }
}

function collectValidatedRuns(runs, spec, expectations, artifactRoot) {
  const campaign = {
    slots: new Map(),
    ids: new Set(),
    nativeConfiguration: undefined,
    fixtureRevisions: new Map(),
    transcriptPaths: new Set(),
    transcriptHashes: new Set(),
    artifactBudget: { bytes: 0 },
  };
  for (const run of runs) {
    const { caseSpec, key } = validateRunIdentity(run, spec, campaign);
    const artifacts = validateArtifacts(run.artifacts, artifactRoot, campaign.artifactBudget);
    validateNativeProvenance(run, caseSpec, artifacts, campaign);
    const criteria = expectations.cases.find((e) => e.caseId === caseSpec.id).criteria;
    validateJudgments(run.judgments, criteria, artifacts);
    validateMetrics(run.metrics);
    campaign.slots.set(key, run);
  }
  return campaign.slots;
}

function runOutcome(run, missingCriteria) {
  if (run?.status !== 'completed') return run?.status ?? 'not-run';
  if (run.judgments.some((j) => j.verdict === 'fail')) return 'failed';
  if (missingCriteria.length || run.judgments.some((j) => j.verdict === 'unresolved'))
    return 'unresolved';
  return 'passed';
}

function scoreSlot(caseSpec, repetition, run, criteria) {
  const missingCriteria = criteria
    .filter((e) => !run?.judgments.some((j) => j.criterionId === e.id))
    .map((e) => e.id);
  return {
    caseId: caseSpec.id,
    repetition,
    kind: run?.kind ?? null,
    outcome: runOutcome(run, missingCriteria),
    missingCriteria,
  };
}

function scorePlannedSlots(spec, expectations, slots) {
  const rows = [];
  for (const caseSpec of spec.cases) {
    const criteria = expectations.cases.find((e) => e.caseId === caseSpec.id).criteria;
    for (let repetition = 1; repetition <= spec.repetitions; repetition++) {
      const run = slots.get(`${caseSpec.id}:${repetition}`);
      rows.push(scoreSlot(caseSpec, repetition, run, criteria));
    }
  }
  return rows;
}

function sumObservedMetric(values, field) {
  if (!values.length) return null;
  return values.reduce((total, value) => {
    const next = total + value;
    if (!Number.isFinite(next) || (countMetrics.includes(field) && !Number.isSafeInteger(next)))
      fail(`Metric total exceeds numeric range: ${field}`);
    return next;
  }, 0);
}

function summarizeMetrics(slots) {
  const attempted = [...slots.values()].filter(isNativeAttempt);
  return Object.fromEntries(
    metricFields.map((field) => {
      const known = attempted.map((run) => run.metrics[field]).filter((value) => value !== null);
      return [
        field,
        {
          knownRuns: known.length,
          unknownRuns: attempted.length - known.length,
          observedTotal: sumObservedMetric(known, field),
        },
      ];
    }),
  );
}

/** Scores explicit, separately adjudicated observations. Never executes report text or dispatches agents. */
export function scoreBehavior(report, { spec = suite, expectations = oracle, artifactRoot } = {}) {
  validateSuite(spec, expectations);
  shape(report, ['format', 'runs'], 'report');
  if (report.format !== 1) fail('Unsupported report format');
  array(report.runs, 'runs');
  const slots = collectValidatedRuns(report.runs, spec, expectations, artifactRoot);
  const rows = scorePlannedSlots(spec, expectations, slots);
  const native = rows.filter((row) => row.kind === 'native');
  const completed = native.filter((row) =>
    ['passed', 'failed', 'unresolved'].includes(row.outcome),
  );
  const passed = native.filter((row) => row.outcome === 'passed').length;
  const metrics = summarizeMetrics(slots);
  return {
    format: 1,
    plannedRuns: rows.length,
    submittedRuns: report.runs.length,
    nativeCompletedRuns: completed.length,
    nativePassedRuns: passed,
    nativePassFractionOfPlan: passed / rows.length,
    nativePassRateAmongCompleted: completed.length ? passed / completed.length : null,
    outcomes: Object.fromEntries(
      outcomes.map((outcome) => [outcome, rows.filter((row) => row.outcome === outcome).length]),
    ),
    syntheticRuns: rows.filter((row) => row.kind === 'synthetic').length,
    metrics,
    rows,
    limitation:
      'Hashes establish artifact integrity, not authenticity or judge correctness. Synthetic calibration is not model performance. Independent adjudication and repeated native runs are required.',
  };
}
if (
  process.argv[1] &&
  path.relative(fileURLToPath(import.meta.url), path.resolve(process.argv[1])) === ''
) {
  try {
    const [file, artifactRoot, ...extra] = process.argv.slice(2);
    if (!file || extra.length)
      fail('Usage: node scripts/evaluate-behavior.mjs REPORT.json [ARTIFACT_ROOT]');
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_REPORT_BYTES)
      fail('Report must be a regular file within the report size limit');
    console.log(
      JSON.stringify(
        scoreBehavior(JSON.parse(fs.readFileSync(file, 'utf8')), { artifactRoot }),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
