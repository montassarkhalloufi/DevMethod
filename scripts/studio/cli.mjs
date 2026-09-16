import fs from 'node:fs';
import path from 'node:path';
import { startStudio } from './server.mjs';
import { restoreArchive } from './archive.mjs';
import { initializeExample } from './example.mjs';

function argumentsFor(args) {
  const options = {},
    positional = [];
  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    if (value === '--help') {
      options.help = true;
      continue;
    }
    if (
      ![
        '--workspace',
        '--port',
        '--preview-port',
        '--agent',
        '--max-jobs',
        '--timeout-ms',
        '--file',
        '--worker',
      ].includes(value) ||
      !args[index + 1] ||
      args[index + 1].startsWith('--')
    )
      throw new Error('Option invalide : ' + value);
    options[value.slice(2)] = args[++index];
  }
  return { options, command: positional[0] ?? 'serve' };
}

export async function runStudioCli(args) {
  try {
    const { options, command } = argumentsFor(args);
    if (options.help) {
      console.log(
        'devmethod studio [serve|example|status|claim|finish|fail|check|restore] --workspace /dossier\nServe : --port 4330 --preview-port 4331 [--agent codex --max-jobs 2 --timeout-ms 300000]\nAgent absent : attente explicite ; aucun fournisseur lancé. Codex utilise votre accès existant, coûts inconnus, arrêt sans relance après consommation inconnue.\nfinish/fail/check : --file payload.json ; restore : --file export.tar dans dossier vide.',
      );
      return;
    }
    if (!options.workspace || !path.isAbsolute(options.workspace))
      throw new Error('--workspace doit désigner un dossier absolu dédié.');
    if (command === 'example') {
      console.log(
        'Exemple Les Ateliers restauré : ' + initializeExample(options.workspace) + ' fichiers.',
      );
      return;
    }
    if (command === 'restore') {
      console.log(
        'Fichiers restaurés : ' + restoreArchive(fs.readFileSync(options.file), options.workspace),
      );
      return;
    }
    if (command !== 'serve') {
      await workerCommand(command, options);
      return;
    }
    if (options.agent && options.agent !== 'codex')
      throw new Error('Seul l’adaptateur local codex est disponible.');
    const studio = await startStudio({
      workspace: options.workspace,
      port: Number(options.port ?? 4330),
      previewPort: Number(options['preview-port'] ?? 4331),
      agent: options.agent
        ? {
            maxJobs: Number(options['max-jobs'] ?? 2),
            timeoutMs: Number(options['timeout-ms'] ?? 300000),
          }
        : null,
    });
    console.log(JSON.stringify({ ...studio.runtime(), token: undefined }, null, 2));
    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      await studio.close();
    };
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

async function workerCommand(command, options) {
  const runtime = JSON.parse(
    fs.readFileSync(path.join(options.workspace, '.devmethod/runtime.json'), 'utf8'),
  );
  const routes = {
    status: '/api/state',
    claim: '/api/jobs/claim',
    finish: '/api/jobs/finish',
    fail: '/api/jobs/fail',
    check: '/api/checks',
  };
  if (!routes[command]) throw new Error('Commande Studio inconnue.');
  const input =
    command === 'claim'
      ? { worker: options.worker ?? 'Agent hôte' }
      : options.file
        ? JSON.parse(fs.readFileSync(options.file, 'utf8'))
        : {};
  const response = await fetch(
    runtime.url + routes[command],
    command === 'status'
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + runtime.token },
          body: JSON.stringify(input),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  console.log(JSON.stringify(result, null, 2));
}
