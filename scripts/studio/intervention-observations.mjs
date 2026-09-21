const fail = () => {
  throw Object.assign(new Error('Observations d’intervention invalides.'), { status: 400 });
};
const text = (value, maximum = 2000) =>
  typeof value === 'string' && value.length > 0 && value.length <= maximum;

function shape(value, keys) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    fail();
}

function entries(value, maximum, validate) {
  if (!Array.isArray(value) || value.length > maximum) fail();
  for (const entry of value) validate(entry);
}

function validateData(data) {
  shape(data, ['status', 'version', 'nonEmpty', 'bytes']);
  if (
    !['available', 'missing', 'unavailable'].includes(data.status) ||
    !Number.isSafeInteger(data.bytes) ||
    data.bytes < 0
  )
    fail();
  if (data.version !== null && (!Number.isSafeInteger(data.version) || data.version < 1)) fail();
  if (data.nonEmpty !== null && typeof data.nonEmpty !== 'boolean') fail();
}

function validateEvidence(entry) {
  shape(entry, ['id', 'status', 'freshness', 'trusted', 'provenance', 'fingerprint']);
  for (const key of ['id', 'status', 'freshness', 'provenance']) if (!text(entry[key], 500)) fail();
  if (
    typeof entry.trusted !== 'boolean' ||
    (entry.fingerprint !== null && !text(entry.fingerprint, 500))
  )
    fail();
}

export function validateInterventionObservations(value) {
  shape(value, ['data', 'changes', 'signals', 'limits', 'evidence', 'unknowns', 'riskFactors']);
  validateData(value.data);
  entries(value.changes, 512, (entry) => {
    shape(entry, ['path', 'kind']);
    if (!text(entry.path) || !['added', 'modified', 'removed'].includes(entry.kind)) fail();
  });
  entries(value.signals, 200, (entry) => {
    shape(entry, ['path', 'line', 'kind']);
    if (
      !text(entry.path) ||
      !Number.isSafeInteger(entry.line) ||
      entry.line < 1 ||
      !['persistent-data', 'contract-changed'].includes(entry.kind)
    )
      fail();
  });
  entries(value.limits, 32, (entry) => {
    if (!text(entry)) fail();
  });
  entries(value.evidence, 500, validateEvidence);
  entries(value.unknowns, 4, (entry) => {
    if (!['localOnly', 'reversible', 'persistentData', 'contractChanged'].includes(entry)) fail();
  });
  entries(value.riskFactors, 32, (entry) => {
    shape(entry, ['id', 'severity', 'reason']);
    if (
      !text(entry.id, 200) ||
      !['critical', 'high', 'moderate', 'low', 'unknown'].includes(entry.severity) ||
      !text(entry.reason)
    )
      fail();
  });
}

export function captureInterventionObservations(control) {
  const context = control.consequences;
  const result = structuredClone({
    data: context.data,
    changes: context.changes,
    signals: context.signals,
    limits: context.limits,
    unknowns: control.risk.unknowns,
    riskFactors: control.risk.factors,
    evidence: control.graph.nodes
      .filter((node) => node.type === 'evidence' && node.revisionId === context.revisionId)
      .map(({ id, status, freshness, trusted, provenance, fingerprint }) => ({
        id,
        status,
        freshness,
        trusted,
        provenance,
        fingerprint,
      })),
  });
  validateInterventionObservations(result);
  return result;
}
