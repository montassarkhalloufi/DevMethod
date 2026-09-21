import fs from 'node:fs';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeExample } from './example.mjs';
import { createStudioStore } from './store.mjs';
import { createJobs } from './jobs.mjs';
import { assertRealDirectory, copyFiles, fileManifest } from './files.mjs';
import { effectiveDelegation, queueRequest, updateProject } from './domain.mjs';
import { exportProject } from './bundle.mjs';
import { restoreArchive } from './archive.mjs';

// Reconstruct a recorded app, then migrate through the real job and compiler path.
// This consumes no model call and preserves historical evidence/budget as history.
export async function initializeReactExample(workspace, options = {}) {
  if (options?.delegateTechnical !== true)
    throw new Error(
      'Ce portage change l’architecture de la copie. Autorisez explicitement sa délégation technique avec example-react --delegate-technical ; aucune copie créée.',
    );
  assertRealDirectory(workspace);
  if (fs.existsSync(workspace) && fs.readdirSync(workspace).length)
    throw new Error('Choisissez un dossier vide pour la copie React.');
  const staging = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-react-example-'));
  let store;
  try {
    initializeExample(staging);
    store = createStudioStore(staging);
    const jobs = createJobs(store);
    store.commit(store.read().version, (state) => {
      updateProject(state, {
        ...state.project,
        delegation: { ...effectiveDelegation(state), structure: 'agent' },
        constraints: state.project.constraints.map((constraint) =>
          constraint === 'HTML/CSS/JS et données JSON persistantes'
            ? 'React 19 / TypeScript strict et données JSON persistantes'
            : constraint,
        ),
      });
      const draft = state.draft;
      queueRequest(state, {
        request:
          'Portage enregistré vers React 19 et TypeScript strict, avec délégation technique explicite pour cette nouvelle copie (--delegate-technical). Préserver direction visuelle, politique d’adoption, inscriptions et file d’attente.',
      });
      state.draft = draft;
    });
    const claim = jobs.claim('recorded-react-example');
    fs.rmSync(claim.workDirectory, { recursive: true });
    const source = fileURLToPath(new URL('../../examples/studio-ateliers-react/', import.meta.url));
    const files = fileManifest(source).filter((file) => !file.path.startsWith('dist/'));
    copyFiles(source, claim.workDirectory, files);
    await jobs.finish({
      jobId: claim.job.id,
      title: 'Les Ateliers · React 19 / TypeScript',
      decisions: [
        {
          id: randomUUID(),
          topic: 'architecture',
          choice:
            'React 19, TypeScript strict, vues/hooks/modèle/services séparés ; compilation contrôlée et export Vite.',
          reason:
            'Le profil typé remplace les sources HTML/JS tout en conservant API JSON locale, CAS et données persistantes ; aucun nouveau backend requis.',
          status: 'active',
          source: 'agent',
        },
      ],
      summary:
        'Exemple enregistré compilé localement. TypeScript strict et bundling contrôlés ; ceci ne constitue pas un nouvel essai de génération par modèle ni une validation humaine.',
    });
    return restoreArchive(exportProject(staging, store.read()), workspace);
  } finally {
    store?.close();
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
