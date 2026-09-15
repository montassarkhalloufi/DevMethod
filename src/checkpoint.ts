import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseJson, checkPath } from './filesystem.js';
import { gitState, validGit, type GitState } from './records.js';

export interface CheckpointSource {
  id: string;
  path: string;
  sha256: string;
}

export interface CheckpointEvidence extends CheckpointSource {
  sourceIds: string[];
  dependsOn: string[];
  outcome: 'passed' | 'failed' | 'blocked' | 'not-run';
  criterionIds?: string[];
  kind?: 'automated' | 'manual' | 'design-review' | 'recommendation';
  revision?: string;
}

export interface Checkpoint {
  format: 1;
  git?: GitState;
  blockers?: string[];
  scope: string;
  status: 'active' | 'blocked' | 'complete';
  nextAction: string | null;
  sources: CheckpointSource[];
  evidence: CheckpointEvidence[];
}

export interface CheckpointFinding {
  code: string;
  message: string;
  id?: string;
  path?: string;
}

export interface CheckpointReport {
  format: 1;
  destination: string;
  status: 'ready' | 'reverify' | 'blocked' | 'complete' | 'invalid';
  scope?: string;
  nextAction?: string | null;
  findings: CheckpointFinding[];
  sources: { id: string; state: 'unchanged' | 'changed' | 'unavailable' }[];
  evidence: { id: string; state: 'valid' | 'invalidated' | 'failed' | 'blocked' | 'not-run' }[];
}

type SourceState = CheckpointReport['sources'][number]['state'];
type EvidenceState = CheckpointReport['evidence'][number]['state'];

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value);

const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function oneOf(value: unknown, values: readonly string[]): boolean {
  return typeof value === 'string' && values.includes(value);
}

function safePathComponent(part: string): boolean {
  return (
    part.length > 0 &&
    part !== '.' &&
    part !== '..' &&
    !/[. ]$/.test(part) &&
    !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)
  );
}

// Portable repository-relative paths only: no Windows aliases, drives or streams.
function safePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  // Control characters are deliberately rejected at this file-read boundary.
  // eslint-disable-next-line no-control-regex
  if (/[\\:\x00-\x1f\x7f]/.test(value)) return false;
  return value.split('/').every(safePathComponent);
}

function pinned(value: unknown): value is CheckpointSource {
  return (
    object(value) &&
    identifier(value.id) &&
    safePath(value.path) &&
    typeof value.sha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(value.sha256)
  );
}

function ids(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(identifier) && new Set(value).size === value.length;
}

function pinnedEvidence(value: unknown): value is CheckpointEvidence {
  return (
    pinned(value) &&
    object(value) &&
    ids(value.sourceIds) &&
    value.sourceIds.length > 0 &&
    ids(value.dependsOn) &&
    oneOf(value.outcome, ['passed', 'failed', 'blocked', 'not-run'])
  );
}

function validateScope(input: Record<string, unknown>): void {
  if (!nonempty(input.scope) || !oneOf(input.status, ['active', 'blocked', 'complete'])) {
    throw new Error('Checkpoint needs a nonempty scope and status active, blocked or complete.');
  }
  if (input.nextAction !== null && !nonempty(input.nextAction)) {
    throw new Error('nextAction must be a nonempty string or null.');
  }
  if (input.status === 'complete' && input.nextAction !== null) {
    throw new Error(
      'Completed scope must have nextAction null; completion authorizes no new work.',
    );
  }
  if (input.status !== 'complete' && !nonempty(input.nextAction)) {
    throw new Error('Active or blocked scope needs an explicit nextAction.');
  }
}

function validatePins(input: Record<string, unknown>): void {
  if (!Array.isArray(input.sources) || !input.sources.every(pinned) || input.sources.length === 0) {
    throw new Error(
      'sources must contain pinned IDs, safe relative paths and lowercase SHA-256 hashes.',
    );
  }
  if (!Array.isArray(input.evidence) || !input.evidence.every(pinnedEvidence)) {
    throw new Error(
      'evidence needs pinned artifacts, sourceIds, dependsOn and outcome passed, failed or not-run.',
    );
  }
  if (input.sources.length > 256 || input.evidence.length > 256) {
    throw new Error('Checkpoint supports at most 256 sources and evidence items.');
  }
}

function validateProvenance(input: Record<string, unknown>): void {
  if (input.git !== undefined && !validGit(input.git)) {
    throw new Error('Invalid Git checkpoint provenance.');
  }
  if (
    input.blockers !== undefined &&
    (!Array.isArray(input.blockers) || !input.blockers.every(nonempty))
  ) {
    throw new Error('blockers must be nonempty strings.');
  }
}

function validateEvidenceMetadata(item: CheckpointEvidence): void {
  if (item.criterionIds !== undefined && (!ids(item.criterionIds) || !item.criterionIds.length)) {
    throw new Error('criterionIds must be nonempty unique IDs.');
  }
  if (
    item.kind !== undefined &&
    !oneOf(item.kind, ['automated', 'manual', 'design-review', 'recommendation'])
  ) {
    throw new Error('Invalid verification kind.');
  }
  if (item.revision !== undefined && !nonempty(item.revision)) {
    throw new Error('Invalid evidence revision.');
  }
}

function validateReferences(state: Checkpoint): void {
  const sources = new Set(state.sources.map((source) => source.id));
  const evidence = new Set(state.evidence.map((item) => item.id));
  if (sources.size !== state.sources.length || evidence.size !== state.evidence.length) {
    throw new Error('Source IDs and evidence IDs must each be unique.');
  }
  if (
    new Set(state.sources.map((source) => source.path)).size !== state.sources.length ||
    new Set(state.evidence.map((item) => item.path)).size !== state.evidence.length
  ) {
    throw new Error('Source paths and evidence paths must each be unique.');
  }
  for (const item of state.evidence) {
    if (
      item.sourceIds.some((id) => !sources.has(id)) ||
      item.dependsOn.some((id) => !evidence.has(id))
    ) {
      throw new Error(`Evidence ${item.id} references an unknown source or evidence ID.`);
    }
  }
}

function orderEvidence(evidence: CheckpointEvidence[]): CheckpointEvidence[] {
  const done = new Set<string>();
  const ordered: CheckpointEvidence[] = [];

  // Iterative traversal avoids stack exhaustion on an untrusted dependency graph.
  while (done.size < evidence.length) {
    const previousSize = done.size;
    for (const item of evidence) {
      if (done.has(item.id) || !item.dependsOn.every((id) => done.has(id))) continue;
      done.add(item.id);
      ordered.push(item);
    }
    if (done.size === previousSize) throw new Error('Evidence dependencies contain a cycle.');
  }
  return ordered;
}

function validate(input: unknown): { state: Checkpoint; orderedEvidence: CheckpointEvidence[] } {
  if (!object(input) || input.format !== 1) {
    throw new Error('Expected checkpoint format 1. Markdown checkpoints remain a manual workflow.');
  }
  validateScope(input);
  validatePins(input);
  validateProvenance(input);

  const state = input as unknown as Checkpoint;
  for (const item of state.evidence) validateEvidenceMetadata(item);
  validateReferences(state);
  return { state, orderedEvidence: orderEvidence(state.evidence) };
}

function readPinned(destination: string, relative: string): Buffer {
  if (!safePath(relative)) throw new Error('Expected a safe repository-relative path.');
  const file = path.join(destination, relative);
  checkPath(file);
  if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).size > 1024 * 1024) {
    throw new Error('Expected a regular file.');
  }
  return fs.readFileSync(file);
}

function emptyReport(destination: string): CheckpointReport {
  return {
    format: 1,
    destination: path.resolve(destination),
    status: 'invalid',
    findings: [],
    sources: [],
    evidence: [],
  };
}

function comparePin(
  report: CheckpointReport,
  item: CheckpointSource,
  kind: 'source' | 'evidence',
): SourceState {
  try {
    const digest = createHash('sha256')
      .update(readPinned(report.destination, item.path))
      .digest('hex');
    if (digest === item.sha256) return 'unchanged';
    report.findings.push({
      code: `${kind}-changed`,
      id: item.id,
      path: item.path,
      message: `Pinned ${kind} content changed; inspect the difference and repeat affected verification.`,
    });
    return 'changed';
  } catch (error) {
    report.findings.push({
      code: `${kind}-unavailable`,
      id: item.id,
      path: item.path,
      message: `Cannot inspect pinned ${kind}: ${(error as Error).message}`,
    });
    return 'unavailable';
  }
}

function evidenceState(
  item: CheckpointEvidence,
  sourceStates: Map<string, SourceState>,
  artifactStates: Map<string, SourceState>,
  evidenceStates: Map<string, EvidenceState>,
): EvidenceState {
  const invalidated =
    artifactStates.get(item.id) !== 'unchanged' ||
    item.sourceIds.some((id) => sourceStates.get(id) !== 'unchanged') ||
    item.dependsOn.some((id) => evidenceStates.get(id) !== 'valid');
  if (invalidated) return 'invalidated';
  return item.outcome === 'passed' ? 'valid' : item.outcome;
}

function inspectPins(
  report: CheckpointReport,
  state: Checkpoint,
  orderedEvidence: CheckpointEvidence[],
): void {
  report.sources = state.sources.map((source) => ({
    id: source.id,
    state: comparePin(report, source, 'source'),
  }));
  const sourceStates = new Map(report.sources.map((source) => [source.id, source.state]));
  const artifactStates = new Map(
    state.evidence.map((item) => [item.id, comparePin(report, item, 'evidence')]),
  );
  const evidenceStates = new Map<string, EvidenceState>();

  for (const item of orderedEvidence) {
    const result = evidenceState(item, sourceStates, artifactStates, evidenceStates);
    evidenceStates.set(item.id, result);
    if (result !== 'valid') {
      report.findings.push({
        code: `evidence-${result}`,
        id: item.id,
        path: item.path,
        message: `Evidence ${item.id} is ${result}; it cannot support resumption until affected verification is recorded again.`,
      });
    }
  }
  report.evidence = state.evidence.map((item) => ({
    id: item.id,
    state: evidenceStates.get(item.id)!,
  }));
}

function inspectGit(report: CheckpointReport, recorded: GitState | undefined): boolean {
  if (!recorded) return false;
  try {
    const current = gitState(report.destination);
    const changed = Object.entries(recorded).some(
      ([key, value]) => current[key as keyof GitState] !== value,
    );
    if (changed) {
      report.findings.push({
        code: 'git-changed',
        message:
          'Branch, commit or worktree changed; reassess scope and omitted dependencies. Independent pins are retained.',
      });
    }
    return changed;
  } catch {
    report.findings.push({
      code: 'git-unavailable',
      message: 'Cannot compare recorded Git provenance.',
    });
    return true;
  }
}

function reportStatus(
  state: Checkpoint,
  report: CheckpointReport,
  gitChanged: boolean,
): CheckpointReport['status'] {
  if (
    state.status === 'blocked' ||
    (state.blockers?.length ?? 0) > 0 ||
    state.evidence.some((item) => item.outcome === 'blocked')
  ) {
    return 'blocked';
  }
  const needsVerification =
    gitChanged ||
    report.sources.some((source) => source.state !== 'unchanged') ||
    report.evidence.some((item) => item.state !== 'valid') ||
    report.evidence.length === 0;
  if (needsVerification) return 'reverify';
  return state.status === 'complete' ? 'complete' : 'ready';
}

/** Read-only inspection; report readiness never grants execution or integration permission. */
export function inspectCheckpoint(destination: string, input: unknown): CheckpointReport {
  const report = emptyReport(destination);
  let validated: ReturnType<typeof validate>;
  try {
    validated = validate(input);
    checkPath(report.destination);
    if (!fs.statSync(report.destination).isDirectory()) {
      throw new Error('Destination must be a directory.');
    }
  } catch (error) {
    report.findings.push({ code: 'invalid-checkpoint', message: (error as Error).message });
    return report;
  }

  const { state, orderedEvidence } = validated;
  report.scope = state.scope;
  report.nextAction = state.nextAction;
  inspectPins(report, state, orderedEvidence);
  const gitChanged = inspectGit(report, state.git);
  for (const blocker of state.blockers ?? []) {
    report.findings.push({ code: 'dependency-blocked', message: blocker });
  }
  if (!report.evidence.length) {
    report.findings.push({
      code: 'evidence-empty',
      message: 'No evidence was pinned; establish verification before relying on this checkpoint.',
    });
  }
  report.status = reportStatus(state, report, gitChanged);
  return report;
}

/** Load a JSON checkpoint within the project; never follows symbolic paths or changes files. */
export function readCheckpoint(destination: string, checkpointPath: string): CheckpointReport {
  try {
    return inspectCheckpoint(
      destination,
      parseJson(readPinned(path.resolve(destination), checkpointPath).toString('utf8')),
    );
  } catch (error) {
    const report = emptyReport(destination);
    report.findings.push({
      code: 'invalid-checkpoint',
      path: checkpointPath,
      message: (error as Error).message,
    });
    return report;
  }
}
