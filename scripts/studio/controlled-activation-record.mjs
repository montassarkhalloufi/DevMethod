import { validateInterventionObservations } from './intervention-observations.mjs';

const requireValue = (condition) => {
  if (!condition)
    throw Object.assign(new Error('Application sous contrôle invalide.'), { status: 400 });
};
const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const fingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export function validateControlledActivation(record) {
  requireValue(record && typeof record === 'object' && !Array.isArray(record));
  const fields = [
    'schemaVersion',
    'protocol',
    'trigger',
    'jobId',
    'revisionId',
    'baseRevisionId',
    'contextFingerprint',
    'controlKey',
    'fingerprint',
    'criteriaFingerprint',
    'planKey',
    'consequenceDecisionId',
    'coverageDecisionIds',
    'createdAt',
    'observations',
  ];
  requireValue(Object.keys(record).every((key) => fields.includes(key)));
  requireValue(record.schemaVersion === 1 && record.protocol === 'studio-controlled-activation-v1');
  requireValue(['runner', 'local'].includes(record.trigger));
  for (const key of ['jobId', 'revisionId', 'consequenceDecisionId'])
    requireValue(identifier(record[key]));
  requireValue(record.baseRevisionId === null || identifier(record.baseRevisionId));
  for (const key of [
    'contextFingerprint',
    'controlKey',
    'fingerprint',
    'criteriaFingerprint',
    'planKey',
  ])
    requireValue(fingerprint(record[key]));
  requireValue(
    Array.isArray(record.coverageDecisionIds) && record.coverageDecisionIds.length <= 500,
  );
  record.coverageDecisionIds.forEach((id) => requireValue(identifier(id)));
  requireValue(
    typeof record.createdAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(record.createdAt) &&
      Number.isFinite(Date.parse(record.createdAt)),
  );
  validateInterventionObservations(record.observations);
}
