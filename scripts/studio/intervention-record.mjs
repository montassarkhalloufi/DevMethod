import { createHash } from 'node:crypto';
import { validateInterventionObservations } from './intervention-observations.mjs';

export const interventionDigest = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const interventionTopic = (revisionId) =>
  `Conséquences locales ${interventionDigest(revisionId)}`;

const fail = () => {
  throw Object.assign(new Error('Examen des conséquences invalide.'), { status: 400 });
};
const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const fingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function shape(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  if (Object.keys(value).some((key) => !fields.includes(key))) fail();
}

export function validateConsequenceAssessment(assessment) {
  shape(assessment, ['persistentData', 'contractChanged']);
  for (const key of ['persistentData', 'contractChanged'])
    if (!['affected', 'not-affected', 'unknown'].includes(assessment[key])) fail();
}

export function validateInterventionRecord(record) {
  shape(record, [
    'schemaVersion',
    'revisionId',
    'baseRevisionId',
    'fingerprint',
    'baseFingerprint',
    'contextFingerprint',
    'reviewKey',
    'protocol',
    'resolution',
    'assessment',
    'scope',
    'createdAt',
    'observations',
  ]);
  if (record.schemaVersion !== 1 || record.protocol !== 'studio-consequences-v1') fail();
  if (!identifier(record.revisionId)) fail();
  if (record.baseRevisionId !== null && !identifier(record.baseRevisionId)) fail();
  if ((record.baseRevisionId === null) !== (record.baseFingerprint === null)) fail();
  if (record.baseFingerprint !== null && !fingerprint(record.baseFingerprint)) fail();
  for (const key of ['fingerprint', 'contextFingerprint', 'reviewKey'])
    if (!fingerprint(record[key])) fail();
  if (!['accept-local', 'keep-stopped'].includes(record.resolution)) fail();
  validateConsequenceAssessment(record.assessment);
  validateInterventionObservations(record.observations);
  if (record.resolution === 'accept-local' && Object.values(record.assessment).includes('unknown'))
    fail();
  if (typeof record.scope !== 'string' || !record.scope.trim() || record.scope.length > 2000)
    fail();
  if (
    typeof record.createdAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(record.createdAt) ||
    !Number.isFinite(Date.parse(record.createdAt))
  )
    fail();
}

export function projectInterventionReviews(state, context) {
  return state.decisions
    .filter(
      (decision) =>
        decision.intervention?.revisionId === context.revisionId && decision.source === 'user',
    )
    .map((decision) => {
      const record = decision.intervention;
      const active =
        decision.status === 'active' && decision.topic === interventionTopic(record.revisionId);
      const current =
        !context.issue &&
        [
          'protocol',
          'revisionId',
          'baseRevisionId',
          'fingerprint',
          'baseFingerprint',
          'contextFingerprint',
        ].every((key) => record[key] === context[key]);
      return {
        decisionId: decision.id,
        resolution: record.resolution,
        assessment: record.assessment,
        scope: record.scope,
        reason: decision.reason,
        observations: record.observations,
        freshness: !active ? 'obsolete' : current ? 'current' : 'reevaluate',
        contributes: active && current && record.resolution === 'accept-local',
        holds: active && record.resolution === 'keep-stopped',
      };
    });
}
