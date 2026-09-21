export function rejectConnector(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

export function connectorObject(value, keys, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    rejectConnector(`${label} invalide ou champ inconnu.`);
}

export function connectorPayload(value) {
  if (Buffer.byteLength(JSON.stringify(value)) > 65536)
    rejectConnector('Corps du connecteur supérieur à 64 Kio.');
}

const sensitive =
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|sk[-_](?:live[-_]|test[-_])?[A-Za-z0-9_-]{16,})|\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|(?:authorization|api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*\S+)/i;

export function connectorText(value, maximum, label) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > maximum ||
    /[\p{Cc}]/u.test(value)
  )
    rejectConnector(`${label} invalide.`);
  if (sensitive.test(value) || /\b[a-z][a-z0-9+.-]*:\/\/[^\s/]*@/i.test(value))
    rejectConnector(
      'Valeur sensible refusée ; fournir une référence de secret et des résultats expurgés.',
    );
  return value.trim();
}

export function connectorId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value))
    rejectConnector('Identifiant de connecteur invalide.');
  return connectorText(value, 128, 'Identifiant');
}

export function connectorDate(value) {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    rejectConnector('Date de connecteur invalide.');
  return value;
}

export function connectorMember(value, values, label) {
  if (!values.includes(value)) rejectConnector(`${label} invalide.`);
  return value;
}

export function connectorList(value, maximum, label, map) {
  if (!Array.isArray(value) || value.length > maximum)
    rejectConnector(`${label} invalide ou trop long.`);
  return value.map(map);
}

export function connectorTool(value) {
  connectorObject(value, ['name', 'version'], 'Outil');
  return {
    name: connectorText(value.name, 120, 'Nom d’outil'),
    version: connectorText(value.version, 80, 'Version d’outil'),
  };
}

export function connectorDigest(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))
    rejectConnector('Empreinte de connecteur invalide.');
  return value;
}

export function connectorReference(value) {
  if (
    typeof value !== 'string' ||
    !/^(?:env:[A-Z][A-Z0-9_]{1,79}|host:[a-zA-Z0-9][a-zA-Z0-9._-]{0,79})$/.test(value)
  )
    rejectConnector('Référence attendue : env:NOM ou host:profil ; jamais une clé.');
  return connectorText(value, 85, 'Référence de secret');
}
