import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { atomicJSON, safeFile } from './files.mjs';

const require = createRequire(import.meta.url);
const reject = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

function validateConfiguration(value, persisted = false) {
  const keys = [
    'version',
    'enabled',
    'channel',
    'automatic',
    ...(persisted ? ['schemaVersion', 'configurationId'] : []),
  ];
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key)) ||
    !Number.isSafeInteger(value.version) ||
    value.version < (persisted ? 1 : 0) ||
    typeof value.enabled !== 'boolean' ||
    (value.automatic !== undefined && typeof value.automatic !== 'boolean') ||
    (value.automatic === true && !value.enabled) ||
    !['chrome', 'msedge'].includes(value.channel) ||
    (persisted && value.schemaVersion !== 1) ||
    (persisted &&
      value.configurationId !== undefined &&
      (typeof value.configurationId !== 'string' ||
        !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value.configurationId)))
  )
    reject('Configuration du navigateur invalide.');
  return value;
}

function driverVersion() {
  try {
    return require('playwright-core/package.json').version;
  } catch {
    return null;
  }
}

export function readBrowserConfiguration(store) {
  const file = safeFile(store.root, '.devmethod/browser.json');
  let saved = { version: 0, enabled: false, channel: 'chrome' };
  if (fs.existsSync(file)) {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size > 4096) reject('Configuration du navigateur illisible.', 409);
    saved = validateConfiguration(JSON.parse(fs.readFileSync(file, 'utf8')), true);
  }
  const installed = driverVersion();
  return {
    version: saved.version,
    configurationId: saved.configurationId ?? null,
    enabled: saved.enabled,
    automatic: saved.automatic ?? false,
    channel: saved.channel,
    driverAvailable: Boolean(installed),
    driverVersion: installed,
    reason: !installed
      ? 'Le pilote optionnel playwright-core est absent de cette installation.'
      : configurationReason(saved),
  };
}

function configurationReason(saved) {
  if (!saved.enabled)
    return 'Le pilote est installé. Activer ce contrôle pour utiliser une copie isolée du candidat.';
  if (!saved.configurationId)
    return 'Réenregistrer ce réglage pour confirmer la configuration locale avant de lancer le contrôle.';
  return 'Le navigateur sélectionné doit être installé ; sa disponibilité sera vérifiée au lancement.';
}

// Counters can coincide across restored projects. Only this local configuration
// and executor may support a receipt; exported receipts never grant local permission.
export function browserConfigurationMatches(run, configuration) {
  return Boolean(
    configuration?.enabled &&
    configuration.driverAvailable &&
    configuration.configurationId &&
    run.browserConfigurationId === configuration.configurationId &&
    run.browserConfigurationVersion === configuration.version &&
    run.browserChannel === configuration.channel &&
    run.browserDriverVersion === configuration.driverVersion,
  );
}

export function configureBrowserVerification(store, input) {
  validateConfiguration(input);
  const current = readBrowserConfiguration(store);
  if (input.version !== current.version)
    reject('La configuration a changé. Rechargez avant de confirmer.', 409);
  const file = safeFile(store.root, '.devmethod/browser.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  atomicJSON(file, {
    schemaVersion: 1,
    version: current.version + 1,
    configurationId: randomUUID(),
    enabled: input.enabled,
    automatic: input.automatic ?? false,
    channel: input.channel,
  });
  return readBrowserConfiguration(store);
}
