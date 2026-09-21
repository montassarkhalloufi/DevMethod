// A bounded receipt of the user's examination, never authority to resume execution.
function requireValue(condition) {
  if (!condition) throw Object.assign(new Error('Examen d’adoption invalide.'), { status: 400 });
}

const text = (value) => typeof value === 'string' && value.length > 0 && value.length <= 500;
const fingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function shape(value, fields) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value));
  requireValue(Object.keys(value).every((key) => fields.includes(key)));
}

function collection(value, inspect) {
  requireValue(Array.isArray(value) && value.length <= 500);
  value.forEach(inspect);
}

function evidence(item) {
  shape(item, [
    'id',
    'status',
    'freshness',
    'trusted',
    'provenance',
    'fingerprint',
    'coverageDecisionIds',
  ]);
  for (const key of ['id', 'status', 'freshness', 'provenance']) requireValue(text(item[key]));
  requireValue(typeof item.trusted === 'boolean');
  requireValue(item.fingerprint === null || fingerprint(item.fingerprint));
  if (item.coverageDecisionIds !== undefined)
    collection(item.coverageDecisionIds, (id) => requireValue(text(id)));
}

export function validateActivationReviewRecord(review) {
  shape(review, [
    'revisionId',
    'fingerprint',
    'criteriaFingerprint',
    'reviewKey',
    'reasons',
    'unknowns',
    'evidence',
    'interventions',
    'action',
    'riskSeverity',
    'riskFactors',
  ]);
  requireValue(text(review.revisionId));
  for (const key of ['fingerprint', 'criteriaFingerprint', 'reviewKey'])
    requireValue(fingerprint(review[key]));
  for (const key of ['reasons', 'unknowns', 'interventions'])
    collection(review[key], (item) => requireValue(text(item)));
  requireValue(
    ['continue', 'stop', 'arbitrate', 'strengthen-verification'].includes(review.action),
  );
  requireValue(['low', 'moderate', 'high', 'critical', 'unknown'].includes(review.riskSeverity));
  collection(review.evidence, evidence);
  collection(review.riskFactors, (item) => {
    shape(item, ['id', 'severity']);
    requireValue(
      text(item.id) && ['low', 'moderate', 'high', 'critical', 'unknown'].includes(item.severity),
    );
  });
  return review;
}
