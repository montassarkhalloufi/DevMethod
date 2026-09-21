import fs from 'node:fs';
import { atomicJSON, safeFile } from './files.mjs';
import { createAgentRunner } from './runner.mjs';
import { probeCodex } from './agent-availability.mjs';

const defaults = { access: null, enabled: false, maxJobs: 2, maxTokens: 100000, timeoutMs: 300000 };
const reject = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

function validate(input) {
  if (
    !input ||
    Object.keys(input).some((key) => !['version', ...Object.keys(defaults)].includes(key))
  )
    reject('Configuration agent invalide.');
  if (
    typeof input.enabled !== 'boolean' ||
    !Number.isSafeInteger(input.version) ||
    input.version < 0
  )
    reject('Configuration agent invalide.');
  if (
    ![null, 'chatgpt', 'api-key'].includes(input.access) ||
    (input.enabled && input.access === null)
  )
    reject('Confirmez le type d’accès Codex affiché avant activation.');
  for (const [key, min, max] of [
    ['maxJobs', 1, 10],
    ['maxTokens', 1, 1000000],
    ['timeoutMs', 1000, 600000],
  ])
    if (!Number.isSafeInteger(input[key]) || input[key] < min || input[key] > max)
      reject('Limites agent invalides.');
  return { ...input };
}

export function createAgentControl({
  store,
  jobs,
  probe = probeCodex,
  createRunner = createAgentRunner,
  getLiveActions,
  createNativeTools,
}) {
  const file = safeFile(store.root, '.devmethod/agent-settings.json');
  const saved = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const historicalBudget =
    saved?.historicalBudget === true ||
    (!saved && fs.existsSync(safeFile(store.root, '.devmethod/agent.json')));
  const savedSettings = saved ? { ...saved } : {};
  delete savedSettings.historicalBudget;
  let settings = saved ? validate(savedSettings) : { version: 0, ...defaults };
  let availability = {
    available: null,
    connected: false,
    access: 'unknown',
    version: null,
    checkedAt: null,
    message: 'Disponibilité de Codex à vérifier.',
  };
  let runner,
    busy = false,
    closed = false;
  const budgetExists = () => fs.existsSync(safeFile(store.root, '.devmethod/agent.json'));

  function status() {
    const execution = runner?.status() ?? { kind: 'host-bridge', automatic: false, running: false };
    return {
      ...execution,
      connected: availability.connected,
      availability,
      settings: { ...settings },
      configuring: busy,
      historicalBudget,
      message: runner
        ? execution.message
        : settings.enabled && availability.access !== settings.access
          ? 'Le type d’accès Codex a changé. Une nouvelle activation explicite est nécessaire.'
          : availability.message,
    };
  }

  async function inspect() {
    const observed = await probe();
    if (closed) reject('Studio fermé ; aucun appel autorisé.', 409);
    availability = observed;
    if (
      runner &&
      settings.enabled &&
      (!availability.connected || availability.access !== settings.access)
    ) {
      await runner.close();
      runner = undefined;
    }
    return status();
  }

  function preserveLimits(next) {
    if (!budgetExists()) return;
    if (historicalBudget && next.enabled)
      reject(
        'Ce projet possède un budget historique sans configuration conservée. Aucun redémarrage automatique autorisé.',
        409,
      );
    if (['maxJobs', 'maxTokens', 'timeoutMs'].some((key) => next[key] > settings[key]))
      reject('Les bornes d’une campagne commencée ne peuvent pas être augmentées.', 409);
  }

  async function configure(input, dispatch = true) {
    if (closed) reject('Studio fermé ; aucun appel autorisé.', 409);
    if (busy) reject('Configuration déjà en cours.', 409);
    const next = validate(input);
    if (next.version !== settings.version) reject('Configuration modifiée ; relisez-la.', 409);
    preserveLimits(next);
    if (next.enabled && runner?.status().running)
      reject('Attendez la fin du travail avant de modifier ses limites.', 409);
    busy = true;
    try {
      if (next.enabled) {
        await inspect();
        if (!availability.connected) reject(availability.message, 409);
        if (next.access !== availability.access)
          reject('Le type d’accès a changé ; vérifiez-le avant de confirmer.', 409);
      }
      await runner?.close();
      runner = undefined;
      if (closed) reject('Studio fermé ; aucun appel autorisé.', 409);
      const replacement = next.enabled
        ? createRunner({ store, jobs, options: next, getLiveActions, createNativeTools })
        : undefined;
      try {
        atomicJSON(file, { ...next, version: settings.version + 1, historicalBudget });
      } catch (error) {
        await replacement?.close();
        throw error;
      }
      settings = { ...next, version: settings.version + 1 };
      runner = replacement;
      if (dispatch) runner?.wake();
    } finally {
      busy = false;
    }
    return status();
  }

  async function start(initial) {
    if (initial) {
      await inspect();
      return configure(
        {
          ...defaults,
          ...initial,
          access: settings.access ?? availability.access,
          enabled: true,
          version: settings.version,
        },
        false,
      );
    } else if (settings.enabled) {
      await inspect();
      if (availability.connected && availability.access === settings.access)
        runner = createRunner({
          store,
          jobs,
          options: settings,
          getLiveActions,
          createNativeTools,
        });
    }
    return status();
  }

  return {
    status,
    inspect,
    configure,
    start,
    wake: () => {
      if (!closed) runner?.wake();
    },
    close: async () => {
      closed = true;
      await runner?.close();
      runner = undefined;
    },
  };
}
