import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startStudio } from './server.mjs';
import { restoreArchive } from './archive.mjs';
import { initializeReactExample } from './react-example.mjs';
import { initializeExample } from './example.mjs';
import { progressLimits } from './progress.mjs';
import { mcpWorkerRequest, readWorkerJSON } from './mcp-cli.mjs';

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
    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (value === '--delegate-technical') {
      options.delegateTechnical = true;
      continue;
    }
    if (
      ![
        '--workspace',
        '--source',
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
  return { options, command: studioCommand(positional, options) };
}

function studioCommand(positional, options) {
  if (positional[0] === 'mcp' && !options.help) {
    if (positional.length !== 2 || !['tools', 'call', 'actions'].includes(positional[1]))
      throw new Error(
        'Commande MCP : devmethod studio mcp tools|call|actions --workspace /projet --file payload.json.',
      );
    return 'mcp-' + positional[1];
  }
  return positional[0] ?? (options.workspace ? 'serve' : 'home');
}

function keepStudioOpen(studio) {
  console.log(JSON.stringify({ ...studio.runtime(), token: undefined }, null, 2));
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await studio.close();
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
}

async function openHome(options) {
  for (const option of Object.keys(options)) {
    if (!['workspace', 'port'].includes(option))
      throw new Error(`L’accueil Studio n’accepte pas l’option --${option}.`);
  }
  if (options.workspace && !path.isAbsolute(options.workspace))
    throw new Error('--workspace doit désigner un dossier absolu dédié.');
  const { startStudioHome } = await import('./home-server.mjs');
  keepStudioOpen(
    await startStudioHome({
      directory: options.workspace ?? path.join(os.homedir(), '.devmethod', 'studio-home'),
      port: Number(options.port ?? 4330),
    }),
  );
}

export async function runStudioCli(args) {
  try {
    const { options, command } = argumentsFor(args);
    if (options.help) {
      console.log(
        'devmethod studio [home|serve|import|example|status|claim|progress|finish|fail|check|connectors|connector-probe|connector-result|guide-request|guide-responses|restore|example-react] [--workspace /dossier]\nAccueil : devmethod studio ; créer, importer ou reprendre un projet.\nhome : [--workspace /bibliothèque] [--port 4330] ; bibliothèque par défaut ~/.devmethod/studio-home.\nImport : --source /projet/existant --workspace /dossier/vide/distinct [--dry-run] ; copie locale sans exécuter de scripts ni installer de dépendances.\nServe : --port 4330 --preview-port 4331 [--agent codex --max-jobs 2 --timeout-ms 300000]\nAgent absent : attente explicite ; aucun fournisseur lancé. Codex utilise votre accès existant, coûts inconnus, arrêt sans relance après consommation inconnue.\nprogress/finish/fail/check : --file payload.json ; restore : --file export.tar dans dossier vide.\nconnectors : lecture des connexions ; connector-probe/connector-result : --file payload.json (64 Kio maximum).\nprogress : {jobId,eventId,event} ; événement plan ou action pendant la mission, déclaration distincte des preuves.\nexample-react : --delegate-technical requis ; délégation technique dans une nouvelle copie uniquement, mode et réservations visuelles/adoption conservés.',
      );
      console.log(
        'mcp tools|call|actions : --workspace /projet --file payload.json (64 Kio maximum), pont hôte manuel uniquement. tools : {jobId,connectionId,toolName?} ; call : {requestId,jobId,connectionId,toolName,arguments} ; actions : {jobId?,requestId?}. Conservez requestId pour relire le résultat sans répéter l’action. Connexion sélectionnée et mission active requises.',
      );
      return;
    }
    if (command === 'home') {
      await openHome(options);
      return;
    }
    if (!options.workspace || !path.isAbsolute(options.workspace))
      throw new Error('--workspace doit désigner un dossier absolu dédié.');
    if (command !== 'import' && (options.source || options.dryRun))
      throw new Error('--source et --dry-run sont réservés à import.');
    if (options.delegateTechnical && command !== 'example-react')
      throw new Error('--delegate-technical est réservé à example-react, dans une nouvelle copie.');
    if (command === 'import') {
      const { importProject } = await import('./import.mjs');
      console.log(
        JSON.stringify(
          await importProject({
            source: options.source,
            workspace: options.workspace,
            dryRun: options.dryRun,
          }),
          null,
          2,
        ),
      );
      return;
    }
    if (command === 'example') {
      console.log(
        'Exemple Les Ateliers restauré : ' + initializeExample(options.workspace) + ' fichiers.',
      );
      return;
    }
    if (command === 'example-react') {
      console.log(
        'Exemple React typé restauré : ' +
          (await initializeReactExample(options.workspace, {
            delegateTechnical: options.delegateTechnical,
          })) +
          ' fichiers. Aucun appel modèle.',
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
    await openWorkspace(options);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

async function openWorkspace(options) {
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
  keepStudioOpen(studio);
}

async function workerCommand(command, options) {
  const maximum = {
    progress: progressLimits.inputBytes,
    'connector-probe': 65536,
    'connector-result': 65536,
    'mcp-tools': 65536,
    'mcp-call': 65536,
    'mcp-actions': 4096,
    'guide-request': 65536,
    'guide-responses': 4096,
  }[command];
  if (maximum && !options.file) throw new Error(`${command} nécessite --file payload.json.`);
  if (maximum && fs.statSync(options.file).size > maximum)
    throw new Error(`Le fichier ${command} dépasse ${maximum} octets.`);
  const runtime = readWorkerJSON(path.join(options.workspace, '.devmethod/runtime.json'), command);
  const routes = {
    status: '/api/state',
    claim: '/api/jobs/claim',
    progress: '/api/jobs/progress',
    connectors: '/api/connectors',
    'connector-probe': '/api/connectors/probe',
    'connector-result': '/api/connectors/results',
    'mcp-tools': '/api/mcp/tools',
    'mcp-call': '/api/mcp/call',
    'mcp-actions': '/api/mcp/actions',
    'guide-request': '/api/connectors/interactions/request',
    'guide-responses': '/api/connectors/interactions',
    finish: '/api/jobs/finish',
    fail: '/api/jobs/fail',
    check: '/api/checks',
  };
  if (!routes[command]) throw new Error('Commande Studio inconnue.');
  const input =
    command === 'claim'
      ? { worker: options.worker ?? 'Agent hôte' }
      : options.file
        ? readWorkerJSON(options.file, command)
        : {};
  const mcp = ['mcp-tools', 'mcp-call', 'mcp-actions', 'guide-request', 'guide-responses'].includes(
    command,
  )
    ? mcpWorkerRequest(command, input, runtime)
    : null;
  const response = await fetch(
    mcp?.url ?? runtime.url + routes[command],
    mcp?.init ??
      (['status', 'connectors'].includes(command)
        ? {}
        : {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + runtime.token,
            },
            body: JSON.stringify(input),
          }),
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  console.log(JSON.stringify(result, null, 2));
}
