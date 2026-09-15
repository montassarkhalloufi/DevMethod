import { validateMission, missionStatus, type Mission } from './mission.js';
import {
  inspectCheckpoint,
  type Checkpoint,
  type CheckpointReport,
  type CheckpointSource,
} from './checkpoint.js';
import { readRecord, readLocal, digest, secretPath, object } from './records.js';
import { verifyBehaviorReceipt, type BehaviorReceipt } from './behavior.js';

interface CoverageFinding {
  code: string;
  message: string;
}

interface CriterionCoverage {
  id: string;
  status: 'supported' | 'unmet';
  evidenceIds: string[];
  reasons: string[];
}

interface CoverageContext {
  state: Checkpoint;
  sourceByPath: Map<string, CheckpointSource>;
  pinnedMission: CheckpointSource | undefined;
  evidenceStates: Map<string, CheckpointReport['evidence'][number]['state']>;
}

const limitations =
  'Read-only coverage of declared criteria and recorded evidence. No commands executed, truth certification, external-state validation, status mutation or execution authorization. A supported report still requires assessment of criterion completeness and evidence relevance.';

function hasSecretPins(entries: unknown): boolean {
  return (
    Array.isArray(entries) &&
    entries.some(
      (entry) => object(entry) && typeof entry.path === 'string' && secretPath(entry.path),
    )
  );
}

function preflightPaths(mission: Mission, input: unknown): void {
  // Check secret paths before the checkpoint inspector reads any pinned files.
  if (object(input) && (hasSecretPins(input.sources) || hasSecretPins(input.evidence))) {
    throw new Error('Secret-like checkpoint pins cannot support closure.');
  }
  if (mission.acceptance.some((criterion) => criterion.changes.some(secretPath))) {
    throw new Error('Secret-like change paths cannot support closure.');
  }
}

function coverageContext(
  state: Checkpoint,
  checkpoint: CheckpointReport,
  missionPath: string,
): CoverageContext {
  const sourceByPath = new Map(state.sources.map((source) => [source.path, source]));
  return {
    state,
    sourceByPath,
    pinnedMission: sourceByPath.get(missionPath),
    evidenceStates: new Map(checkpoint.evidence.map((item) => [item.id, item.state])),
  };
}

function missionFindings(
  root: string,
  missionPath: string,
  mission: Mission,
  context: CoverageContext,
): CoverageFinding[] {
  const { state, sourceByPath, pinnedMission } = context;
  const findings: CoverageFinding[] = [];

  if (!pinnedMission || pinnedMission.sha256 !== digest(readLocal(root, missionPath))) {
    findings.push({
      code: 'mission-not-pinned',
      message: 'Pin this exact mission before relying on criterion coverage.',
    });
  }
  for (const source of mission.sources) {
    const pin = sourceByPath.get(source.path);
    if (!pin || pin.id !== source.id) {
      findings.push({
        code: 'context-not-pinned',
        message: `Mission source ${source.id} must use the same ID and path in checkpoint sources.`,
      });
    }
  }
  if (!state.git) {
    findings.push({
      code: 'revision-missing',
      message: 'Closure requires a Git-aware checkpoint; legacy resume remains supported.',
    });
  }

  const knownCriteria = new Set(mission.acceptance.map((criterion) => criterion.id));
  for (const item of state.evidence) {
    if (item.criterionIds?.some((id) => !knownCriteria.has(id))) {
      findings.push({
        code: 'unknown-criterion',
        message: `Evidence ${item.id} names a criterion outside this mission.`,
      });
    }
  }
  return findings;
}

function inspectCriterion(
  criterion: Mission['acceptance'][number],
  context: CoverageContext,
): CriterionCoverage {
  const { state, sourceByPath, pinnedMission, evidenceStates } = context;
  const changes = criterion.changes.map((file) => sourceByPath.get(file));
  const candidates = state.evidence.filter((item) => item.criterionIds?.includes(criterion.id));
  const supporting = candidates.filter(
    (item) =>
      evidenceStates.get(item.id) === 'valid' &&
      item.kind === criterion.kind &&
      !!state.git &&
      item.revision === state.git.commit &&
      !!pinnedMission &&
      item.sourceIds.includes(pinnedMission.id) &&
      changes.every((pin) => pin && item.sourceIds.includes(pin.id)),
  );

  const reasons: string[] = [];
  if (changes.some((pin) => !pin)) reasons.push('changed-path-not-pinned');
  if (!candidates.length) reasons.push('evidence-missing');
  else if (!supporting.length) reasons.push('no-current-matching-evidence');

  return {
    id: criterion.id,
    status: supporting.length ? 'supported' : 'unmet',
    evidenceIds: supporting.map((item) => item.id),
    reasons,
  };
}

function closureStatus(
  mission: Mission,
  checkpoint: CheckpointReport,
  findings: CoverageFinding[],
  criteria: CriterionCoverage[],
): 'blocked' | 'reverify' | 'unmet' | 'supported' {
  if (missionStatus(mission) === 'blocked' || checkpoint.status === 'blocked') return 'blocked';
  if (checkpoint.status === 'reverify') return 'reverify';
  if (findings.length || criteria.some((criterion) => criterion.status !== 'supported')) {
    return 'unmet';
  }
  return 'supported';
}

/** Coverage of operator-recorded evidence, not an execution receipt or a semantic verdict. */
export function inspectClosure(root: string, missionPath: string, checkpointPath: string) {
  const mission = validateMission(readRecord(root, missionPath));
  const input = readRecord(root, checkpointPath);
  preflightPaths(mission, input);

  const checkpoint = inspectCheckpoint(root, input);
  if (checkpoint.status === 'invalid') {
    return {
      format: 1,
      missionId: mission.id,
      status: 'invalid',
      findings: checkpoint.findings,
      criteria: [],
      limitations,
    };
  }

  const context = coverageContext(input as Checkpoint, checkpoint, missionPath);
  const findings = missionFindings(root, missionPath, mission, context);
  const criteria = mission.acceptance.map((criterion) => inspectCriterion(criterion, context));
  return {
    format: 1,
    missionId: mission.id,
    status: closureStatus(mission, checkpoint, findings, criteria),
    checkpointStatus: checkpoint.status,
    findings: [...checkpoint.findings, ...findings],
    criteria,
    limitations,
  };
}

function behavioralCoverage(
  root: string,
  checkpointPath: string,
  receipt: BehaviorReceipt,
  criteria: CriterionCoverage[],
): boolean {
  const checkpoint = readRecord(root, checkpointPath) as Checkpoint;
  const matchingIds = new Set(
    checkpoint.evidence
      .filter((item) => item.path === receipt.reportPath && item.sha256 === receipt.reportSha256)
      .map((item) => item.id),
  );
  return (
    criteria.length > 0 &&
    criteria.every(
      (criterion) =>
        criterion.status === 'supported' && criterion.evidenceIds.some((id) => matchingIds.has(id)),
    )
  );
}

/** Local acceptance requires both current criterion coverage and revalidated behavioral evidence. */
export function inspectAcceptance(
  root: string,
  missionPath: string,
  checkpointPath: string,
  receipt: unknown,
) {
  if (!verifyBehaviorReceipt(root, missionPath, receipt))
    return {
      allowed: false,
      reason: 'behavioral-evidence-unverified',
      behavioralEvidenceSignature: null,
    };
  const closure = inspectClosure(root, missionPath, checkpointPath);
  if (closure.status !== 'supported')
    return {
      allowed: false,
      reason: `closure-${closure.status}`,
      behavioralEvidenceSignature: null,
    };
  if (!behavioralCoverage(root, checkpointPath, receipt, closure.criteria))
    return {
      allowed: false,
      reason: 'behavioral-coverage-missing',
      behavioralEvidenceSignature: null,
    };
  return { allowed: true, reason: null, behavioralEvidenceSignature: receipt.signature };
}
