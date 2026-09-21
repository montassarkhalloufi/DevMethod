// Minimum local admission checks. They establish syntax/build validity, not behavior.
export const syntaxProtocol = 'studio-javascript-syntax-v1';
export const documentProtocol = 'studio-document-syntax-v1';

export function revisionAdmission(state, revision) {
  if (revision.profile === 'react-ts' && !revision.compilation)
    return { allowed: false, reason: 'La compilation React de ce candidat a échoué ou manque.' };
  const protocol = revision.compilation
    ? revision.compilation.protocol
    : revision.files.some((file) => /\.(?:m?js|cjs)$/.test(file.path))
      ? syntaxProtocol
      : null;
  const required = [
    protocol,
    ...(revision.files.some((file) => /\.(?:html?|json)$/i.test(file.path))
      ? [documentProtocol]
      : []),
  ].filter(Boolean);
  if (!required.length || revision.profile === 'source-only')
    return { allowed: true, reason: 'Aucun contrôle syntaxique JavaScript applicable.' };
  const checks = state.checks.filter(
    (check) =>
      check.revisionId === revision.id && check.kind === 'command' && check.executor === 'studio',
  );
  if (checks.some((check) => check.status === 'failed'))
    return { allowed: false, reason: 'Une vérification de cette version a échoué.' };
  if (
    required.some(
      (requiredProtocol) =>
        !checks.some((check) => check.protocol === requiredProtocol && check.status === 'passed'),
    )
  )
    return { allowed: false, reason: 'La vérification requise de cette version manque.' };
  return { allowed: true, reason: 'Contrôle technique réussi ; comportement non évalué.' };
}
