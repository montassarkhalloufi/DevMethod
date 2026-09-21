import { recordCheck } from './domain.mjs';
import { revisionFingerprint } from './control-policy.mjs';

const reject = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

/** An iframe can imitate an error event. Persist a reported negative signal only,
 * never an independent execution receipt, a passing check or a human acceptance. */
export function recordRuntimeObservation(store, input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !['revisionId', 'message', 'file', 'line'].includes(key)) ||
    typeof input.revisionId !== 'string' ||
    typeof input.message !== 'string' ||
    !input.message.trim() ||
    input.message.length > 2000 ||
    typeof input.file !== 'string' ||
    input.file.length > 500 ||
    !(input.line === null || (Number.isSafeInteger(input.line) && input.line > 0))
  )
    reject('Signal navigateur invalide.');
  const current = store.read();
  const revision = current.revisions.find((entry) => entry.id === input.revisionId);
  if (!revision) reject('Version observée inconnue.', 404);
  const fingerprint = revisionFingerprint(revision);
  const output = JSON.stringify({ message: input.message, file: input.file, line: input.line });
  const observations = current.checks.filter((check) => check.kind === 'runtime-observation');
  const duplicate = observations.find(
    (check) =>
      check.revisionId === revision.id &&
      check.fingerprint === fingerprint &&
      check.output === output,
  );
  if (duplicate) return { state: current, observation: duplicate };
  if (
    observations.length >= 500 ||
    observations.filter((check) => check.revisionId === revision.id).length >= 20
  )
    reject('Limite de signaux navigateur atteinte ; historique conservé.', 429);
  let observation;
  const state = store.commit(current.version, (draft) => {
    observation = recordCheck(
      draft,
      {
        revisionId: revision.id,
        label: 'Erreur rapportée par l’aperçu navigateur',
        kind: 'runtime-observation',
        status: 'failed',
        protocol: 'studio-preview-signal-v1',
        fingerprint,
        output,
      },
      { observed: true },
    );
  });
  return { state, observation };
}
