export function captureRiskRequirement(state, revisionId, checkId) {
  const snapshot = state.controlPlane?.snapshot;
  if (snapshot?.input.revisionId !== revisionId) return undefined;
  return snapshot.input.riskRequirements?.[checkId];
}

export function validateRiskRequirement(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    Object.keys(value).some((key) => !['fingerprint', 'scenarios'].includes(key)) ||
    !/^[a-f0-9]{64}$/.test(value.fingerprint) ||
    !Array.isArray(value.scenarios) ||
    value.scenarios.length > 110 ||
    value.scenarios.some((scenario) => typeof scenario !== 'string' || scenario.length > 5000)
  )
    throw new Error('Périmètre de risque du contrôle invalide.');
}
