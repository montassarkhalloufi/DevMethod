import { digest } from './files.mjs';
import {
  connectorObject,
  connectorText,
  connectorDigest,
  rejectConnector,
} from './connectors-validation.mjs';

function criteriaFrom(state) {
  return (state.brief?.criteria ?? []).map(({ id, text }) => ({ id, text }));
}

export function businessCriteriaFingerprint(state) {
  return digest(JSON.stringify(criteriaFrom(state)));
}

export function validateBusinessCriteria(snapshot) {
  connectorObject(snapshot, ['criteria', 'fingerprint'], 'Critères métier');
  if (
    !Array.isArray(snapshot.criteria) ||
    !snapshot.criteria.length ||
    snapshot.criteria.length > 1000
  )
    rejectConnector('Des critères métier explicites sont requis pour ce contrôle.');
  for (const criterion of snapshot.criteria) {
    connectorObject(criterion, ['id', 'text'], 'Critère métier');
    if (
      typeof criterion.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(criterion.id) ||
      typeof criterion.text !== 'string' ||
      !criterion.text.trim() ||
      criterion.text.length > 2000
    )
      rejectConnector('Critères métier invalides.');
  }
  const encoded = JSON.stringify(snapshot.criteria);
  connectorText(encoded, 8192, 'Critères métier');
  if (Buffer.byteLength(encoded) > 8192)
    rejectConnector('Critères métier supérieurs à 8 Kio ; préciser un périmètre borné.');
  connectorDigest(snapshot.fingerprint);
  if (
    new Set(snapshot.criteria.map((criterion) => criterion.id)).size !== snapshot.criteria.length ||
    digest(encoded) !== snapshot.fingerprint
  )
    rejectConnector('Critères métier incohérents avec leur empreinte.');
  return snapshot;
}

export function captureBusinessCriteria(state) {
  const criteria = criteriaFrom(state);
  return validateBusinessCriteria({ criteria, fingerprint: digest(JSON.stringify(criteria)) });
}

export function businessCriteriaObjective(snapshot) {
  return `Critères métier contrôlés : ${snapshot.criteria.map(({ id, text }) => `${id}: ${text}`).join(' ; ')}`;
}
