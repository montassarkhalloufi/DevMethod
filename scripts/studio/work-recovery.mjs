import fs from 'node:fs';
import path from 'node:path';
import { queueRequest } from './domain.mjs';
import { contextKey } from './jobs.mjs';
import { safeFile, fileManifest, copyFiles } from './files.mjs';

const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

function recoverySource(store, input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !['jobId', 'version'].includes(key)) ||
    typeof input.jobId !== 'string' ||
    !Number.isSafeInteger(input.version)
  )
    reject('Demande de reprise invalide.', 400);
  const state = store.read();
  if (state.version !== input.version) reject('Le projet a changé ; actualisez avant la reprise.');
  const job = state.jobs.find((entry) => entry.id === input.jobId);
  if (!job || !['failed', 'interrupted', 'cancelled'].includes(job.status))
    reject('Seul un travail arrêté peut être repris localement.');
  if (state.jobs.some((entry) => ['queued', 'running'].includes(entry.status)))
    reject('Terminez ou annulez la demande en cours avant la reprise locale.');
  if (job.baseRevision !== state.activeRevision)
    reject('La version active a changé ; cette reprise locale est devenue obsolète.');
  const keyFile = safeFile(store.root, `.devmethod/job-keys/${job.id}.txt`);
  if (fs.readFileSync(keyFile, 'utf8') !== contextKey(state))
    reject('Le contexte a changé depuis ce travail ; aucune reprise automatique de ses décisions.');
  const source = safeFile(store.root, `work/${job.id}/app`);
  const files = fileManifest(source);
  if (!files.length) reject('Ce travail ne contient aucun fichier à vérifier.');
  return { state, job, source, files };
}

function recoveredMetadata(store, jobId) {
  const file = safeFile(store.root, `work/${jobId}/decisions.json`);
  if (!fs.existsSync(file)) return {};
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.size > 65536)
    reject('Métadonnées de reprise absentes ou supérieures à 64 Kio.', 400);
  const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata) ||
    Object.keys(metadata).some(
      (key) => !['brief', 'decisions', 'designs', 'proposals'].includes(key),
    )
  )
    reject('Métadonnées de reprise invalides.', 400);
  if (
    metadata.decisions !== undefined &&
    (!Array.isArray(metadata.decisions) ||
      metadata.decisions.some((decision) => !decision || decision.source !== 'agent'))
  )
    reject('La reprise locale ne peut pas attribuer un accord à la personne.', 400);
  return metadata;
}

/** Explicit local inspection only: no provider call, ledger write or source mutation.
 * The route owner must require same-origin user authority. Completion remains a
 * candidate even when adoption was otherwise delegated. jobs.finish rechecks the
 * live base/context after asynchronous verification and rejects terminal jobs.
 */
export function createWorkRecovery({ store, jobs }) {
  return {
    async recover(input) {
      const { state, job, source, files } = recoverySource(store, input);
      const metadata = recoveredMetadata(store, job.id);
      let recoveryJob;
      store.commit(state.version, (draft) => {
        const savedDraft = draft.draft;
        const guides = draft.draftConnectorGuides;
        recoveryJob = queueRequest(draft, {
          request: `Vérifier localement le travail conservé de la demande ${job.id}. Aucun appel fournisseur ; activation séparée.`,
        });
        recoveryJob.recovery = { sourceJobId: job.id, kind: 'local-inspection' };
        draft.draft = savedDraft;
        if (guides !== undefined) draft.draftConnectorGuides = guides;
      });
      try {
        const claim = jobs.claim('Studio — reprise locale');
        if (claim.job?.id !== recoveryJob.id)
          reject('La reprise locale n’a pas pu prendre en charge sa demande.');
        // Only the newly claimed copy is replaced; the interrupted source is untouched.
        fs.rmSync(claim.workDirectory, { recursive: true, force: true });
        copyFiles(source, claim.workDirectory, files);
        if (JSON.stringify(fileManifest(source)) !== JSON.stringify(files))
          reject('Le travail original a changé pendant sa copie ; reprise arrêtée.');
        fs.writeFileSync(
          path.join(path.dirname(claim.workDirectory), 'decisions.json'),
          JSON.stringify(metadata, null, 2),
          { flag: 'wx', mode: 0o600 },
        );
        return await jobs.finish(
          {
            ...metadata,
            jobId: recoveryJob.id,
            title: 'Reprise locale du travail interrompu',
            summary:
              'Sources conservées soumises aux contrôles locaux ; aucun nouvel appel fournisseur. Activation séparée.',
          },
          { deferActivation: true },
        );
      } catch (error) {
        if (store.read().jobs.find((entry) => entry.id === recoveryJob.id)?.status === 'running')
          jobs.fail({ jobId: recoveryJob.id, error: error.message });
        throw error;
      }
    },
  };
}
