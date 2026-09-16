// Opt-in maintenance comparison; never imported by the distributed CLI.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { supervise, reserveRun, recordRun } from './native-host.mjs';
import { codexEnvironment, codexUsage, codexVersion } from './hosts/codex.mjs';
import { verifyFixture } from './hosts/checks.mjs';
import { gitState } from '../dist/records.js';
import {
  nativeArguments,
  nativeShellPreflight,
  journeyRuntime,
  assertRuntime,
  tree,
  assertFrozen,
} from './native-journey-smoke.mjs';

const source = fileURLToPath(new URL('../', import.meta.url));
export const maintenanceLimits = Object.freeze({
  maxRuns: 7,
  timeoutMs: 120000,
  maxBytes: 2097152,
  observedTokenStop: 100000,
  model: 'gpt-5.6-sol',
  effort: 'low',
  host: codexVersion,
  stable: '6f31552ac3f68c70ee1caa7b4bffb1181341a336',
});
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) =>
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const run = (command, args, cwd = source) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 4194304,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

function drivers() {
  return Object.fromEntries(
    [
      'scripts/native-maintenance.mjs',
      'scripts/native-journey-smoke.mjs',
      'scripts/native-host.mjs',
      'scripts/hosts/codex.mjs',
      'scripts/hosts/checks.mjs',
      'dist/filesystem.js',
      'dist/records.js',
    ].map((file) => [file, digest(fs.readFileSync(path.join(source, file)))]),
  );
}

function disabledSkills() {
  const roots = [
    path.join(process.env.HOME, '.agents/skills'),
    path.join(process.env.CODEX_HOME ?? path.join(process.env.HOME, '.codex'), 'skills'),
  ].filter((root) => fs.existsSync(root));
  return run('rg', ['--files', '--hidden', ...roots, '-g', 'SKILL.md'])
    .split('\n')
    .filter(Boolean)
    .flatMap((file) => [file, path.dirname(file)]);
}

export function maintenanceReadProfile(root, directory, fixture) {
  // The host can use its authenticated provider, but cannot read evaluator/sibling inputs.
  // Its own workspace-write policy still owns write/network permissions for tool commands.
  return `(version 1) (allow default) (deny file-read* (subpath ${JSON.stringify(source)}) (subpath ${JSON.stringify(fixture)}) (require-all (subpath ${JSON.stringify(root)}) (require-not (subpath ${JSON.stringify(directory)}))))`;
}

function initializeGit(directory) {
  run('git', ['init', '-q'], directory);
  run('git', ['add', '.'], directory);
  run(
    'git',
    [
      '-c',
      'user.name=Evaluator',
      '-c',
      'user.email=evaluator@example.invalid',
      'commit',
      '-qm',
      'Frozen fictional readiness task',
    ],
    directory,
  );
}

function readiness(root) {
  const directory = path.join(root, 'workers', 'readiness');
  fs.mkdirSync(path.join(directory, '.runtime/tmp'), { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'clamp.mjs'),
    'export const clamp = (n) => Math.min(10, n);\n',
  );
  fs.writeFileSync(
    path.join(directory, 'TASK.md'),
    'Correct clamp(n) for finite numbers to return n bounded to the inclusive range 0..10. Write and run a small Node test. No dependencies. Finish with a concise final response describing the verified result.\n',
  );
  initializeGit(directory);
  return {
    id: 'readiness',
    arm: 'ordinary',
    directory,
    prompt: fs.readFileSync(path.join(directory, 'TASK.md'), 'utf8'),
    protectedPaths: ['TASK.md'],
    initial: tree(directory),
    initialGit: gitState(directory),
  };
}

async function installMethod(directory, method) {
  const { initialize } = await import(pathToFileURL(path.join(method, 'dist/init.js')));
  initialize({ destination: directory, tool: 'codex' });
  fs.mkdirSync(path.join(directory, '.method'));
  fs.cpSync(path.join(method, 'dist'), path.join(directory, '.method/dist'), { recursive: true });
  fs.cpSync(path.join(method, 'docs'), path.join(directory, '.method/docs'), { recursive: true });
  fs.writeFileSync(path.join(directory, '.method/package.json'), '{"type":"module"}\n');
}

function protectedPins(entry) {
  return Object.fromEntries(
    Object.entries(entry.initial).filter(
      ([file]) =>
        entry.protectedPaths.includes(file) ||
        file.startsWith('.agents/') ||
        file.startsWith('.method/') ||
        [
          'AGENTS.foundation.md',
          'START_HERE.md',
          'kit-manifest.json',
          'DEVMETHOD-LICENSE',
        ].includes(file),
    ),
  );
}

async function prepareCase(fixture, root, method, item, arm) {
  const id = `${arm}-${item.id}`;
  const directory = path.join(root, 'workers', id);
  fs.mkdirSync(directory);
  if (arm === 'B') await installMethod(directory, method);
  // Adopt the same project/profile after installation; preserve its original Git history.
  fs.cpSync(path.join(fixture, item.directory), directory, { recursive: true });
  if (!fs.existsSync(path.join(directory, '.git')))
    throw new Error('Frozen case Git history missing.');
  fs.mkdirSync(path.join(directory, '.runtime/tmp'), { recursive: true });
  const guidance =
    arm === 'A'
      ? 'Use your ordinary tools and sound engineering judgment.'
      : 'Use the installed DevMethod skills proportionately, starting with the relevant entry point. The optional offline CLI is node .method/dist/cli.js.';
  return {
    id,
    arm,
    caseId: item.id,
    directory,
    evaluator: item.evaluator,
    prompt: `${guidance}\n${item.prompt}\nWork only in this workspace. Preserve unrelated changes. No network, dependency installation, nested agents, commits or external actions. Build and run your own relevant checks; independent evaluation occurs afterward. Finish with a concise HANDOFF.md and final response identifying your actual changes, verification and limits. Technical choices in this scope are delegated. Respond in English.`,
    protectedPaths: item.protectedPaths,
    initial: tree(directory),
    initialGit: gitState(directory),
  };
}

export async function prepareMaintenance(fixture, root) {
  if (!path.isAbsolute(root) || fs.existsSync(root))
    throw new Error('Use a new absolute campaign root.');
  if (process.platform !== 'darwin')
    throw new Error('Only the inspected macOS profile is supported.');
  fs.mkdirSync(root);
  for (const name of ['workers', 'private', 'methods']) fs.mkdirSync(path.join(root, name));
  const method = path.join(root, 'methods', 'stable');
  fs.mkdirSync(method);
  const archive = path.join(root, 'methods', 'stable.tar');
  run('git', ['archive', '--format=tar', '--output', archive, maintenanceLimits.stable]);
  run('tar', ['-xf', archive, '-C', method]);
  fs.unlinkSync(archive);
  const manifest = read(path.join(fixture, 'manifest.json'));
  if (manifest.cases.length !== 3)
    throw new Error('Exactly three frozen maintenance cases required.');
  const slots = [readiness(root)];
  for (const [index, item] of manifest.cases.entries()) {
    for (const arm of index % 2 ? ['B', 'A'] : ['A', 'B']) {
      slots.push(await prepareCase(fixture, root, method, item, arm));
    }
  }
  for (const entry of slots) entry.protected = protectedPins(entry);
  const frozen = {
    format: 1,
    at: new Date().toISOString(),
    limits: maintenanceLimits,
    fixture: path.resolve(fixture),
    fixturePins: tree(fixture),
    runtime: journeyRuntime(),
    drivers: drivers(),
    disabledSkills: disabledSkills(),
    slots,
    prior: {
      result: 'PR34 A-initial timeout, total usage unknown; immutable old ledger retained',
      authorization:
        'New user request explicitly asks diagnosis, one complete readiness trial, then bounded comparison. This is a new protocol, not a retry of the old product task.',
    },
  };
  write(path.join(root, 'frozen.json'), frozen);
  fs.writeFileSync(
    path.join(root, 'frozen.sha256'),
    digest(fs.readFileSync(path.join(root, 'frozen.json'))) + '\n',
    { flag: 'wx' },
  );
  return {
    root,
    slots: slots.map(({ id }) => id),
    digest: fs.readFileSync(path.join(root, 'frozen.sha256'), 'utf8').trim(),
  };
}

function preflight(root, permit) {
  const bytes = fs.readFileSync(path.join(root, 'frozen.json'));
  if (
    digest(bytes) !== permit ||
    permit !== fs.readFileSync(path.join(root, 'frozen.sha256'), 'utf8').trim()
  )
    throw new Error('Frozen plan/permit mismatch.');
  const frozen = JSON.parse(bytes);
  assertRuntime(frozen.runtime);
  assertFrozen(frozen.fixture, frozen.fixturePins);
  if (
    JSON.stringify(frozen.drivers) !== JSON.stringify(drivers()) ||
    JSON.stringify(frozen.limits) !== JSON.stringify(maintenanceLimits)
  )
    throw new Error('Driver/budget drift.');
  const env = codexEnvironment();
  if (run('codex', ['--version']) !== maintenanceLimits.host)
    throw new Error('Host version drift.');
  const auth = spawnSync('codex', ['login', 'status'], { encoding: 'utf8', env, timeout: 10000 });
  if (auth.status !== 0 || !`${auth.stdout}${auth.stderr}`.includes('Logged in using ChatGPT'))
    throw new Error('Authenticated subscription unavailable.');
  return frozen;
}

export function maintenanceReady(record) {
  return (
    record?.status === 'exited' &&
    record.exit === 0 &&
    ['inputTokens', 'outputTokens'].every(
      (key) => Number.isSafeInteger(record.usage?.[key]) && record.usage[key] >= 0,
    ) &&
    record.finalResponse === true &&
    record.collectionErrors?.length === 0 &&
    record.protectedChanges?.length === 0 &&
    record.readinessPassed === true
  );
}

function probeReads(root, entry, frozen, profile) {
  const hidden = path.join(root, 'frozen.json');
  const code = `const fs=require('node:fs'),a=require('node:assert/strict'); a.ok(fs.readdirSync(${JSON.stringify(entry.directory)}).length); for(const p of ${JSON.stringify([hidden, path.join(frozen.fixture, 'manifest.json')])}) a.throws(()=>fs.readFileSync(p),{code:'EPERM'});`;
  run('/usr/bin/sandbox-exec', ['-p', profile, process.execPath, '-e', code], entry.directory);
}

function parseEvents(stdout) {
  try {
    return stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export function terminalNativeResponse(events) {
  const end = events.findLastIndex((event) => event.type === 'turn.completed');
  if (end < 0 || end !== events.length - 1) return false;
  const item = events.slice(0, end).findLast((event) => event.type?.startsWith('item.'));
  return (
    item?.type === 'item.completed' &&
    item.item?.type === 'agent_message' &&
    typeof item.item.text === 'string' &&
    item.item.text.trim().length > 0
  );
}

export function assertMaintenanceInput(entry) {
  assertFrozen(entry.directory, entry.initial);
  if (JSON.stringify(gitState(entry.directory)) !== JSON.stringify(entry.initialGit))
    throw new Error('Git attribution changed after preparation.');
}

export function retainMaintenanceOutput(root, id, slot, result) {
  const events = parseEvents(result.stdout);
  const usage = codexUsage(events);
  recordRun(slot, {
    status: result.status,
    exit: result.exit,
    usage,
    elapsedSeconds: result.elapsedSeconds,
  });
  const collectionErrors = [];
  for (const [extension, bytes] of [
    ['jsonl', result.stdout],
    ['stderr', result.stderr],
  ]) {
    try {
      fs.writeFileSync(path.join(root, 'private', `${id}.${extension}`), bytes, { flag: 'wx' });
    } catch (error) {
      collectionErrors.push({ artifact: `${id}.${extension}`, code: error.code ?? 'unknown' });
    }
  }
  return { events, usage, collectionErrors };
}

function requireOutputPaths(root, id) {
  fs.accessSync(path.join(root, 'private'), fs.constants.W_OK);
  for (const suffix of ['.jsonl', '.stderr', '-dispatch.json', '-result.json']) {
    if (fs.existsSync(path.join(root, 'private', id + suffix)))
      throw new Error('Output destination exists before admission; preserve and reconcile.');
  }
}

function readinessCheck(directory) {
  const result = verifyFixture(directory, [
    '--input-type=module',
    '-e',
    "import assert from 'node:assert/strict'; import {clamp} from './clamp.mjs'; for(const [n,want] of [[-1,0],[0,0],[4,4],[10,10],[15,10]]) assert.equal(clamp(n),want);",
  ]);
  return { exit: result.status, stdout: result.stdout, stderr: result.stderr };
}

export async function dispatchMaintenance(root, id, permit) {
  const frozen = preflight(root, permit);
  const index = frozen.slots.findIndex((entry) => entry.id === id);
  if (index < 0) throw new Error('Unknown frozen slot.');
  if (index > 0 && !maintenanceReady(read(path.join(root, 'private/readiness-result.json'))))
    throw new Error('Complete, metered readiness required before comparison.');
  for (const earlier of frozen.slots.slice(0, index)) {
    const previous = read(path.join(root, 'private', `${earlier.id}-result.json`));
    if (
      previous.status !== 'exited' ||
      previous.exit !== 0 ||
      previous.collectionErrors?.length !== 0 ||
      previous.finalResponse !== true
    )
      throw new Error('Unresolved prior completion or collection; no further admission.');
  }
  const entry = frozen.slots[index];
  assertMaintenanceInput(entry);
  const profile = maintenanceReadProfile(root, entry.directory, frozen.fixture);
  probeReads(root, entry, frozen, profile);
  const shell = nativeShellPreflight(entry.directory);
  if (shell.configured.exit !== 0 || shell.configured.stdout.trim() !== 'heredoc-ok')
    throw new Error('Configured shell preflight failed before admission.');
  requireOutputPaths(root, id);
  const slot = reserveRun(path.join(root, 'ledger'), id, maintenanceLimits);
  write(path.join(root, 'private', `${id}-dispatch.json`), { at: new Date().toISOString(), id });
  const result = await supervise({
    command: '/usr/bin/sandbox-exec',
    args: ['-p', profile, 'codex', ...nativeArguments(entry.directory, frozen.disabledSkills)],
    cwd: entry.directory,
    prompt: entry.prompt,
    env: codexEnvironment(),
    timeoutMs: maintenanceLimits.timeoutMs,
    maxBytes: maintenanceLimits.maxBytes,
  });
  const { events, usage, collectionErrors } = retainMaintenanceOutput(root, id, slot, result);
  const actual = tree(entry.directory);
  const protectedChanges = Object.entries(entry.protected)
    .filter(([file, hash]) => actual[file] !== hash)
    .map(([file]) => file);
  const checks = id === 'readiness' ? readinessCheck(entry.directory) : null;
  const record = {
    id,
    arm: entry.arm,
    caseId: entry.caseId ?? null,
    status: result.status,
    exit: result.exit,
    elapsedSeconds: result.elapsedSeconds,
    usage,
    finalResponse: terminalNativeResponse(events),
    collectionErrors,
    protectedChanges,
    readinessPassed: checks?.exit === 0,
    readinessCheck: checks,
    commands: events
      .filter(
        (event) => event.type === 'item.completed' && event.item?.type === 'command_execution',
      )
      .map((event) => event.item),
    initial: entry.initial,
    final: actual,
    transcriptSha256: digest(result.stdout),
    shellPreflight: shell,
    modelAcceptance:
      'Native completion and usage only; independent product and authored-test evaluation is separate.',
  };
  write(path.join(root, 'private', `${id}-result.json`), record);
  return {
    id,
    status: record.status,
    elapsedSeconds: record.elapsedSeconds,
    usage,
    protectedChanges,
    completeReadiness: id === 'readiness' ? maintenanceReady(record) : null,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, first, second, third] = process.argv.slice(2);
  if (command === 'prepare') console.log(JSON.stringify(await prepareMaintenance(first, second)));
  else if (command === 'run')
    console.log(JSON.stringify(await dispatchMaintenance(first, second, third)));
  else throw new Error('Use prepare FIXTURE ROOT, or run ROOT SLOT FROZEN_SHA256.');
}
