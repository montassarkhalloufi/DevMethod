import { createHash } from 'node:crypto';

export const coverageDigest = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const coverageTopic = (revisionId, criterionId) =>
  `Couverture métier ${coverageDigest({ revisionId, criterionId })}`;

function requireValue(condition) {
  if (!condition)
    throw Object.assign(new Error('Appréciation de couverture invalide.'), { status: 400 });
}

const text = (value, max = 2000) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const fingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function shape(value, fields) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value));
  requireValue(Object.keys(value).every((key) => fields.includes(key)));
}

export function validateCoverageRecord(record) {
  shape(record, [
    'schemaVersion',
    'revisionId',
    'fingerprint',
    'receiptId',
    'receiptFingerprint',
    'manifestFingerprint',
    'criteriaFingerprint',
    'criterion',
    'scenarioIds',
    'conclusion',
    'scope',
    'protocol',
    'driverVersion',
    'browserVersion',
    'reviewKey',
    'createdAt',
  ]);
  requireValue(record.schemaVersion === 1);
  requireValue(identifier(record.revisionId) && identifier(record.receiptId));
  for (const key of [
    'fingerprint',
    'receiptFingerprint',
    'manifestFingerprint',
    'criteriaFingerprint',
    'reviewKey',
  ])
    requireValue(fingerprint(record[key]));
  shape(record.criterion, ['id', 'text']);
  requireValue(identifier(record.criterion.id) && text(record.criterion.text));
  requireValue(
    Array.isArray(record.scenarioIds) &&
      record.scenarioIds.length > 0 &&
      record.scenarioIds.length <= 6,
  );
  requireValue(
    record.scenarioIds.every(identifier) &&
      new Set(record.scenarioIds).size === record.scenarioIds.length,
  );
  requireValue(['sufficient', 'partial', 'irrelevant'].includes(record.conclusion));
  requireValue(text(record.scope));
  for (const key of ['protocol', 'driverVersion', 'browserVersion'])
    requireValue(text(record[key], 200));
  requireValue(
    typeof record.createdAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(record.createdAt) &&
      Number.isFinite(Date.parse(record.createdAt)),
  );
  return record;
}

// Freshness and replacement are read-time projections, never part of the immutable receipt.
export function coverageReceiptFingerprint(run) {
  const record = { ...run };
  delete record.freshness;
  delete record.supersededBy;
  return coverageDigest(record);
}
