// Opt-in, six-slot A/B/C smoke. Never imported by the distributed CLI.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { supervise, reserveRun, recordRun } from './native-host.mjs';
import { codexArguments, codexEnvironment, codexUsage, codexVersion } from './hosts/codex.mjs';

const source = fileURLToPath(new URL('../', import.meta.url));
export const pins = Object.freeze({
  stable: '6f31552ac3f68c70ee1caa7b4bffb1181341a336',
  experimental: '440db4322167102546cd974004462fb4dab743a5',
  host: codexVersion,
  model: 'gpt-5.6-sol',
  effort: 'low',
  maxRuns: 6,
  timeoutMs: 120000,
  maxBytes: 2097152,
  observedTokenStop: 100000,
});
const schedule = [
  ['A', 'initial'],
  ['B', 'initial'],
  ['C', 'initial'],
  ['C', 'maintenance'],
  ['B', 'maintenance'],
  ['A', 'maintenance'],
].map(([arm, phase]) => ({ id: `${arm}-${phase}`, arm, phase }));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) =>
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const execute = (command, args, cwd = source) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

export function tree(directory, prefix = '') {
  return Object.fromEntries(
    fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((entry) => {
        if (entry.name === '.git') return [];
        const relative = prefix + entry.name;
        const full = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Symbolic fixture input refused');
        return entry.isDirectory()
          ? Object.entries(tree(full, relative + '/'))
          : [[relative, digest(fs.readFileSync(full))]];
      }),
  );
}

export function assertFrozen(directory, expected) {
  if (JSON.stringify(tree(directory)) !== JSON.stringify(expected))
    throw new Error('Frozen inputs changed; no dispatch');
}

function driverPins() {
  return Object.fromEntries(
    [
      'scripts/native-journey-smoke.mjs',
      'scripts/native-host.mjs',
      'scripts/hosts/codex.mjs',
      'dist/filesystem.js',
    ].map((file) => [file, digest(fs.readFileSync(path.join(source, file)))]),
  );
}

export function journeyRuntime() {
  return {
    version: process.version,
    executable: process.execPath,
    platform: process.platform,
    arch: process.arch,
    pathNodeVersion: execute('node', ['--version']),
  };
}

export function assertRuntime(expected, actual = journeyRuntime()) {
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw new Error('Pinned Node/runtime changed; no dispatch');
}

function disabledGlobalSkills() {
  const roots = [
    path.join(process.env.HOME, '.agents/skills'),
    path.join(process.env.CODEX_HOME ?? path.join(process.env.HOME, '.codex'), 'skills'),
  ].filter((root) => fs.existsSync(root));
  return execute('rg', ['--files', '--hidden', ...roots, '-g', 'SKILL.md'])
    .split('\n')
    .filter(Boolean)
    .flatMap((file) => [file, path.dirname(file)]);
}

function nativeShellEnvironment(directory) {
  const temporary = path.join(directory, '.runtime/tmp');
  return { TMPDIR: temporary, TMPPREFIX: path.join(temporary, 'zsh') };
}

export function nativeArguments(directory, disabledSkills) {
  const args = codexArguments({ directory, model: pins.model });
  for (const feature of [
    'hooks',
    'browser_use',
    'computer_use',
    'image_generation',
    'in_app_browser',
    'skill_mcp_dependency_install',
  ])
    args.splice(args.length - 1, 0, '--disable', feature);
  args.splice(
    args.length - 1,
    0,
    '-c',
    `skills.config=[${disabledSkills.map((file) => `{path=${JSON.stringify(file)},enabled=false}`).join(',')}]`,
  );
  args.splice(
    args.length - 1,
    0,
    '-c',
    `shell_environment_policy.set={${Object.entries(nativeShellEnvironment(directory))
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(',')}}`,
  );
  return args;
}

/** Local shell diagnostic only: no Codex process, authentication or model call. */
export function nativeShellPreflight(directory) {
  if (process.platform !== 'darwin') throw new Error('Native shell preflight requires macOS');
  const environment = nativeShellEnvironment(fs.realpathSync(directory));
  fs.mkdirSync(environment.TMPDIR, { recursive: true });
  const profile = `(version 1) (allow default) (deny network*) (deny file-write*) (allow file-write* (subpath ${JSON.stringify(environment.TMPDIR)}) (literal "/dev/null"))`;
  const probe = (settings) => {
    const result = spawnSync(
      '/usr/bin/sandbox-exec',
      ['-p', profile, '/bin/zsh', '-f', '-c', "cat <<'PROBE'\nheredoc-ok\nPROBE"],
      {
        cwd: directory,
        env: { PATH: '/usr/bin:/bin', ...settings },
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 65536,
      },
    );
    if (result.error) throw result.error;
    return {
      exit: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  };
  return {
    mode: 'local-shell-no-model',
    legacy: probe({ TMPDIR: environment.TMPDIR }),
    configured: probe(environment),
  };
}

function installArchive(root, revision) {
  const archive = path.join(root, revision + '.tar');
  execFileSync('git', ['archive', '--format=tar', '--output', archive, revision], {
    cwd: source,
    timeout: 10000,
  });
  const destination = path.join(root, revision);
  fs.mkdirSync(destination);
  execute('tar', ['-xf', archive, '-C', destination]);
  fs.unlinkSync(archive);
  return destination;
}

async function prepareArm(root, arm, methodSources) {
  const directory = path.join(root, 'workers', arm);
  fs.mkdirSync(directory, { recursive: true });
  fs.cpSync(path.join(root, 'fixture/initial'), directory, { recursive: true });
  fs.mkdirSync(path.join(directory, '.runtime/tmp'), { recursive: true });
  if (arm !== 'A') {
    const distribution = methodSources[arm];
    const { initialize } = await import(pathToFileURL(path.join(distribution, 'dist/init.js')));
    initialize({ destination: directory, tool: 'codex' });
    fs.cpSync(path.join(distribution, 'dist'), path.join(directory, '.method/dist'), {
      recursive: true,
    });
    fs.writeFileSync(path.join(directory, '.method/package.json'), '{"type":"module"}\n');
    fs.cpSync(path.join(distribution, 'docs'), path.join(directory, '.method/docs'), {
      recursive: true,
    });
  }
  execute('git', ['init', '-q'], directory);
  execute('git', ['add', '.'], directory);
  execute(
    'git',
    [
      '-c',
      'user.name=Evaluator',
      '-c',
      'user.email=evaluator@example.invalid',
      'commit',
      '-qm',
      'Frozen fictional task and method',
    ],
    directory,
  );
  return {
    files: tree(directory),
    methodRevision: arm === 'A' ? 'none' : arm === 'B' ? pins.stable : pins.experimental,
  };
}

function commonPrompt(manifest, entry) {
  const method =
    entry.arm === 'A'
      ? 'Use your ordinary tools and good engineering judgment. '
      : 'Use the installed project-foundation skill and relevant DevMethod instructions proportionately. ';
  const experiment =
    entry.arm === 'C'
      ? 'The optional experimental application evidence lab is available through node .method/dist/cli.js evidence; its guide is .method/docs/EVIDENCE-LAB.md. Decide whether it adds value for this task, and report whether you used it and why. '
      : '';
  return (
    method +
    experiment +
    manifest[entry.phase + 'Prompt'] +
    '\nImplement the working product, run the supplied ordinary acceptance checks, and report actual failures or uncertainties. Use Node built-ins; no dependency installation. Stay inside this workspace. Do not alter supplied checks, method files, or requirements. No network, external actions, purchases, nested agents, commits, or publication. Technical and product decisions within the stated scope are delegated. Write a concise HANDOFF.md containing decisions, actual verification and remaining limitations. Respond in English.'
  );
}

export async function prepare(fixture, root) {
  const started = Date.now();
  if (!path.isAbsolute(root) || fs.existsSync(root))
    throw new Error('A new absolute campaign directory is required');
  fs.mkdirSync(root);
  fs.cpSync(fixture, path.join(root, 'fixture'), { recursive: true });
  const manifest = read(path.join(root, 'fixture/manifest.json'));
  if (!manifest.initialPrompt || !manifest.maintenancePrompt)
    throw new Error('Both frozen task prompts are required');
  fs.mkdirSync(path.join(root, 'methods'));
  const methods = {
    B: installArchive(path.join(root, 'methods'), pins.stable),
    C: installArchive(path.join(root, 'methods'), pins.experimental),
  };
  const arms = {};
  for (const arm of ['A', 'B', 'C']) arms[arm] = await prepareArm(root, arm, methods);
  const slots = schedule.map((entry) => ({ ...entry, prompt: commonPrompt(manifest, entry) }));
  const frozen = {
    format: 1,
    frozenAt: new Date().toISOString(),
    pins,
    slots,
    arms,
    fixture: tree(path.join(root, 'fixture')),
    drivers: driverPins(),
    runtime: journeyRuntime(),
    disabledSkills: disabledGlobalSkills(),
    setupSeconds: (Date.now() - started) / 1000,
    ambientSkills:
      'Global user/system skills are disabled with per-invocation path overrides; plugins and hooks disabled. Shared global instruction policy may remain. No credentials copied or user configuration modified.',
  };
  write(path.join(root, 'frozen.json'), frozen);
  write(path.join(root, 'frozen.sha256.json'), {
    sha256: digest(fs.readFileSync(path.join(root, 'frozen.json'))),
  });
  console.log(
    JSON.stringify({ prepared: true, setupSeconds: frozen.setupSeconds, slots: slots.length }),
  );
}

function preflight(root) {
  const frozen = read(path.join(root, 'frozen.json'));
  assertRuntime(frozen.runtime);
  if (
    digest(fs.readFileSync(path.join(root, 'frozen.json'))) !==
    read(path.join(root, 'frozen.sha256.json')).sha256
  )
    throw new Error('Frozen plan changed');
  assertFrozen(path.join(root, 'fixture'), frozen.fixture);
  if (
    JSON.stringify(frozen.drivers) !== JSON.stringify(driverPins()) ||
    JSON.stringify(frozen.pins) !== JSON.stringify(pins)
  )
    throw new Error('Driver or budget changed');
  if (process.platform !== 'darwin') throw new Error('Only the inspected macOS host is admitted');
  const env = codexEnvironment();
  const version = execFileSync('codex', ['--version'], { encoding: 'utf8', env }).trim();
  const auth = spawnSync('codex', ['login', 'status'], { encoding: 'utf8', env, timeout: 10000 });
  if (
    version !== pins.host ||
    auth.status !== 0 ||
    !`${auth.stdout}${auth.stderr}`.includes('Logged in using ChatGPT')
  )
    throw new Error('Pinned authenticated host unavailable');
  return frozen;
}

function check(root, entry, directory, filename = 'evaluate.mjs', writable = []) {
  const started = Date.now();
  const temporary = path.join(root, 'private', entry.id + '-' + filename + '-checks');
  fs.mkdirSync(temporary);
  const readable = [
    directory,
    path.join(root, 'fixture'),
    temporary,
    path.dirname(process.execPath),
    '/System',
    '/usr',
    '/bin',
    '/Library',
    '/opt/homebrew',
    '/dev',
  ];
  const profile = `(version 1) (allow default) (deny network*) (deny file-write*) (deny file-read* (subpath "/Users") (subpath "/private/tmp") (subpath "/private/var/folders")) (allow file-read-metadata) (allow file-read* ${readable.map((item) => `(subpath ${JSON.stringify(item)})`).join(' ')}) (allow file-write* (subpath ${JSON.stringify(temporary)}) (literal "/dev/null") ${writable.map((item) => `(literal ${JSON.stringify(path.join(directory, item))})`).join(' ')})`;
  const result = spawnSync(
    '/usr/bin/sandbox-exec',
    ['-p', profile, process.execPath, path.join(root, 'fixture', filename), directory, entry.phase],
    {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1048576,
      env: { PATH: process.env.PATH, LANG: 'en_US.UTF-8', TMPDIR: temporary },
    },
  );
  return {
    exit: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    elapsedSeconds: (Date.now() - started) / 1000,
    error: result.error?.message ?? null,
  };
}

export function protectedChanges(directory, expected) {
  const actual = tree(directory);
  return Object.entries(expected)
    .filter(([file, hash]) => actual[file] !== hash)
    .map(([file]) => file);
}

export function journeyProtectedInputs(directory, supplied, maintenance) {
  if (!maintenance) return { ...supplied };
  return {
    ...supplied,
    'operator-setup.json': digest(fs.readFileSync(path.join(directory, 'operator-setup.json'))),
  };
}

export function journeyAcceptance({ phase, verification, continuity, changed }) {
  if (verification.exit !== 0 || changed.length !== 0) return false;
  if (phase === 'initial') return true;
  if (phase !== 'maintenance' || continuity?.exit !== 0) return false;
  try {
    return JSON.parse(continuity.stdout).outcome === 'passed';
  } catch {
    return false;
  }
}

export function journeyUsage(records) {
  const observedTokensLowerBound = records.reduce(
    (sum, record) =>
      sum + (record.usage ? record.usage.inputTokens + record.usage.outputTokens : 0),
    0,
  );
  return {
    observedTokensLowerBound,
    totalTokens: records.some((record) => !record.usage) ? null : observedTokensLowerBound,
  };
}

export function journeySlots(root, slots, records) {
  const admitted = new Set(
    slots
      .filter(({ id }) => fs.existsSync(path.join(root, 'ledger', id + '.json')))
      .map(({ id }) => id),
  );
  const finalized = new Set(records.map(({ id }) => id));
  const unresolved = slots
    .filter(({ id }) => admitted.has(id) && !finalized.has(id))
    .map(({ id }) => ({
      id,
      status: 'unresolved',
      dispatchAttempted: fs.existsSync(path.join(root, 'private', id + '-dispatch.json')),
      usage: null,
    }));
  return { unresolved, notRun: slots.filter(({ id }) => !admitted.has(id)).map(({ id }) => id) };
}

async function runSlot(root, frozen, entry, signal) {
  const slot = reserveRun(path.join(root, 'ledger'), entry.id, pins);
  const directory = path.join(root, 'workers', entry.arm);
  let maintenanceSetup = null;
  if (entry.phase === 'maintenance') {
    maintenanceSetup = check(root, entry, directory, 'prepare-maintenance.mjs', [
      'saved-jobs.json',
      'operator-setup.json',
    ]);
    if (maintenanceSetup.exit !== 0)
      throw new Error('Maintenance setup failed; admitted slot requires reconciliation');
    fs.cpSync(path.join(root, 'fixture/maintenance'), directory, { recursive: true });
  }
  const expected = journeyProtectedInputs(
    directory,
    {
      ...frozen.arms[entry.arm].files,
      ...(entry.phase === 'maintenance' ? tree(path.join(root, 'fixture/maintenance')) : {}),
    },
    entry.phase === 'maintenance',
  );
  const args = nativeArguments(directory, frozen.disabledSkills);
  write(path.join(root, 'private', entry.id + '-dispatch.json'), { at: new Date().toISOString() });
  const result = await supervise({
    command: 'codex',
    args,
    cwd: directory,
    prompt: entry.prompt,
    env: codexEnvironment(),
    timeoutMs: pins.timeoutMs,
    maxBytes: pins.maxBytes,
    signal,
  });
  fs.writeFileSync(path.join(root, 'private', entry.id + '.jsonl'), result.stdout, { flag: 'wx' });
  fs.writeFileSync(path.join(root, 'private', entry.id + '.stderr'), result.stderr, { flag: 'wx' });
  let events = [];
  try {
    events = result.stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    /* Malformed native output has unknown accounting. */
  }
  const usage = codexUsage(events);
  const verification = check(root, entry, directory);
  const continuity =
    entry.phase === 'maintenance' ? check(root, entry, directory, 'check-continuity.mjs') : null;
  const changed = protectedChanges(directory, expected);
  const record = {
    ...entry,
    prompt: undefined,
    status: result.status,
    exit: result.exit,
    error: result.error ?? null,
    usage,
    elapsedSeconds: result.elapsedSeconds,
    verification,
    maintenanceSetup,
    continuity,
    protectedChanges: changed,
    acceptance: journeyAcceptance({ phase: entry.phase, verification, continuity, changed }),
    transcriptSha256: digest(result.stdout),
    methodRevision: frozen.arms[entry.arm].methodRevision,
  };
  recordRun(slot, record);
  const snapshot = path.join(root, 'private', entry.id + '-artifacts');
  fs.cpSync(directory, snapshot, {
    recursive: true,
    filter: (file) => path.basename(file) !== '.git',
  });
  return record;
}

export async function run(root) {
  const frozen = preflight(root);
  // A campaign is single use. A later invocation cannot reset or silently resume it.
  fs.mkdirSync(path.join(root, 'private'));
  write(path.join(root, 'started.json'), { at: new Date().toISOString() });
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  const records = [];
  let reason = 'all-six-slots-completed',
    observedTokens = 0;
  try {
    for (const entry of frozen.slots) {
      if (controller.signal.aborted || observedTokens >= pins.observedTokenStop) {
        reason = controller.signal.aborted ? 'cancelled' : 'observed-token-stop';
        break;
      }
      console.log(JSON.stringify({ event: 'started', id: entry.id }));
      const record = await runSlot(root, frozen, entry, controller.signal);
      records.push(record);
      if (record.usage) observedTokens += record.usage.inputTokens + record.usage.outputTokens;
      console.log(
        JSON.stringify({
          event: 'finished',
          id: entry.id,
          status: record.status,
          acceptance: record.acceptance,
          observedTokensLowerBound: observedTokens,
        }),
      );
      if (record.status !== 'exited' || !record.usage) {
        reason = record.status !== 'exited' ? record.status : 'unknown-usage';
        break;
      }
    }
  } catch (error) {
    reason = 'admission-or-collection-failure';
    throw error;
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    const slots = journeySlots(root, frozen.slots, records);
    const usage = journeyUsage([...records, ...slots.unresolved]);
    write(path.join(root, 'results.json'), {
      format: 1,
      pins,
      reason,
      ...usage,
      costUSD: null,
      records,
      ...slots,
    });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, first, second] = process.argv.slice(2);
  if (command === 'prepare' && first && second)
    await prepare(path.resolve(first), path.resolve(second));
  else if (command === 'run' && first && !second) await run(path.resolve(first));
  else throw new Error('Usage: native-journey-smoke.mjs prepare FIXTURE NEW_ROOT | run ROOT');
}
