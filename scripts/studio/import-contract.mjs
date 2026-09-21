import { createHash } from 'node:crypto';
import { validRelativePath } from './import-paths.mjs';

export const importLimits = Object.freeze({
  files: 256,
  bytes: 32 * 1024 * 1024,
  entries: 2500,
  depth: 40,
  contextBytes: 512 * 1024,
});
export const sourceOnlyProtocol = 'source-snapshot-v1';
export const manifestFingerprint = (files) =>
  createHash('sha256').update(JSON.stringify(files)).digest('hex');

function requireValue(value, message) {
  if (!value) throw new Error('Import invalide : ' + message);
}

function shape(value, keys) {
  requireValue(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => keys.includes(key)),
    'champs inconnus ou objet absent.',
  );
}

function text(value, maximum = 2000) {
  requireValue(typeof value === 'string' && value.length <= maximum, 'texte invalide.');
}

function list(value, maximum) {
  requireValue(Array.isArray(value) && value.length <= maximum, 'liste invalide.');
}

function validateContext(context, files) {
  shape(context, ['facts', 'unknowns', 'analysis']);
  list(context.facts, 500);
  for (const fact of context.facts) {
    shape(fact, ['kind', 'label', 'value', 'provenance']);
    requireValue(
      ['manifest', 'stack', 'command', 'test', 'service', 'instruction', 'readme'].includes(
        fact.kind,
      ),
      'type de fait inconnu.',
    );
    text(fact.label, 200);
    text(fact.value);
    shape(fact.provenance, ['kind', 'path', 'sha256']);
    requireValue(
      ['declared', 'detected', 'inferred'].includes(fact.provenance.kind),
      'provenance non observée attendue.',
    );
    requireValue(
      files.some(
        (file) => file.path === fact.provenance.path && file.sha256 === fact.provenance.sha256,
      ),
      'provenance absente de la baseline.',
    );
  }
  list(context.unknowns, 100);
  context.unknowns.forEach((value) => text(value));
  shape(context.analysis, ['status', 'protocol', 'stack', 'issues']);
  requireValue(
    ['complete', 'partial', 'failed'].includes(context.analysis.status),
    'statut d’analyse invalide.',
  );
  text(context.analysis.protocol, 200);
  list(context.analysis.stack, 200);
  context.analysis.stack.forEach((value) => text(value, 200));
  list(context.analysis.issues, 1000);
  for (const issue of context.analysis.issues) {
    shape(issue, ['extractor', 'message', 'path']);
    text(issue.extractor, 200);
    text(issue.message);
    if (issue.path !== undefined)
      requireValue(validRelativePath(issue.path), 'chemin de diagnostic invalide.');
  }
}

export function validateImportRecord(record, revisions) {
  shape(record, ['format', 'baselineRevision', 'source', 'inventory', 'context']);
  requireValue(record.format === 1, 'format inconnu.');
  const baseline = revisions.find((revision) => revision.id === record.baselineRevision);
  requireValue(
    baseline?.origin?.kind === 'import' && baseline.jobId === undefined,
    'baseline importée absente.',
  );
  shape(record.source, ['name', 'importedAt', 'fingerprint']);
  text(record.source.name, 200);
  requireValue(
    record.source.name.length > 0 &&
      !record.source.name.includes('/') &&
      !record.source.name.includes('\\'),
    'nom local attendu, pas de chemin absolu.',
  );
  requireValue(record.source.importedAt === baseline.createdAt, 'date de baseline incohérente.');
  requireValue(
    record.source.fingerprint === manifestFingerprint(baseline.files),
    'empreinte de baseline incohérente.',
  );
  shape(record.inventory, ['included', 'bytes', 'excluded']);
  requireValue(
    record.inventory.included === baseline.files.length &&
      record.inventory.bytes === baseline.files.reduce((sum, file) => sum + file.bytes, 0),
    'inventaire incohérent.',
  );
  list(record.inventory.excluded, importLimits.entries);
  for (const entry of record.inventory.excluded) {
    shape(entry, ['path', 'reason']);
    requireValue(validRelativePath(entry.path.replace(/\/$/, '')), 'chemin exclu invalide.');
    text(entry.reason, 200);
  }
  validateContext(record.context, baseline.files);
  requireValue(
    Buffer.byteLength(JSON.stringify(record)) <= importLimits.contextBytes,
    'contexte supérieur à 512 Kio.',
  );
}
