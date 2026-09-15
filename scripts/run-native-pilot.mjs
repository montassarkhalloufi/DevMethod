// Explicit opt-in fixture campaign. Usage: node scripts/run-native-pilot.mjs ABSOLUTE_ROOT COUNT
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { fixtures, prepare, snapshot, collect } from './evaluation.mjs';
import { verifyFixture } from './hosts/checks.mjs';
import { initialize } from '../dist/init.js';
import { supervise, reserveRun, recordRun } from './native-host.mjs';
import { codexArguments, codexEnvironment, codexVersion, codexUsage } from './hosts/codex.mjs';
const source = fileURLToPath(new URL('../', import.meta.url));
const root = process.argv[2];
const count = Number(process.argv[3]);
if (!root || !path.isAbsolute(root) || !Number.isInteger(count) || count < 1 || count > 12)
  throw new Error('Supply absolute disposable campaign root and 1–12 slots.');
if (process.platform !== 'darwin')
  throw new Error('This native fixture pilot is validated on macOS only.');
const env = codexEnvironment();
const probe = (args) =>
  execFileSync('codex', args, {
    encoding: 'utf8',
    env,
    timeout: 10000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
if (probe(['--version']) !== codexVersion)
  throw new Error('Installed Codex version differs from pinned pilot.');
// login status may write its human-readable result to stderr.
const { spawnSync } = await import('node:child_process');
const auth = spawnSync('codex', ['login', 'status'], { encoding: 'utf8', env, timeout: 10000 });
if (auth.status !== 0 || !`${auth.stdout}${auth.stderr}`.includes('Logged in using ChatGPT'))
  throw new Error('ChatGPT CLI authentication required; no API fallback.');
fs.mkdirSync(root, { recursive: true });
const ledger = path.join(root, 'ledger'),
  evidence = path.join(root, 'evidence'),
  worktrees = path.join(root, 'worktrees'),
  base = path.join(root, 'base');
for (const dir of [evidence, worktrees]) fs.mkdirSync(dir, { recursive: true });
const git = (dir, args) =>
  execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', dir, ...args], {
    encoding: 'utf8',
    timeout: 10000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
if (!fs.existsSync(base)) {
  fs.mkdirSync(base);
  git(base, ['init']);
  fs.writeFileSync(
    path.join(base, 'WORKSPACE.md'),
    'Fictional evaluation workspace. Local task scope only. No external actions.\n',
  );
  git(base, ['add', '.']);
  git(base, [
    '-c',
    'user.name=Evaluator',
    '-c',
    'user.email=evaluator@example.invalid',
    'commit',
    '-m',
    'Fictional baseline',
  ]);
}
const hash = (value) => createHash('sha256').update(value).digest('hex');
const revision = git(source, ['rev-parse', 'HEAD']);
const schedule = [
  { id: 'b1-1-none', caseId: 'B1', arm: 'none', repetition: 1, purpose: 'calibration-only' },
];
for (let rep = 1; rep <= 3; rep++)
  for (const arm of [
    ['none', 'devmethod', 'bmad'],
    ['devmethod', 'bmad', 'none'],
    ['bmad', 'none', 'devmethod'],
  ][rep - 1])
    schedule.push({ id: `matched-b1-${rep}-${arm}`, caseId: 'B1', arm, repetition: rep });
for (const caseId of ['B3', 'B4'])
  schedule.push({ id: `smoke-${caseId.toLowerCase()}`, caseId, arm: 'devmethod', repetition: 1 });
// Prioritize complete three-arm coverage and failure/resumption before repetitions.
const probes = schedule.splice(10, 2);
schedule.splice(4, 0, ...probes);
const controller = new AbortController();
const stop = () => controller.abort();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  for (const entry of schedule.slice(0, count)) {
    const prior = path.join(ledger, entry.id + '.json');
    if (fs.existsSync(prior)) {
      const record = JSON.parse(fs.readFileSync(prior));
      if (record.status === 'exited' && record.usage) continue;
      throw new Error(
        'Existing unsuccessful/interrupted slot requires explicit reconciliation; no automatic retry.',
      );
    }
    if (controller.signal.aborted) break;
    // Reserve before setup; a setup failure leaves a slot requiring reconciliation.
    const slot = reserveRun(ledger, entry.id);
    const dir = path.join(worktrees, entry.id),
      staging = path.join(root, 'staging-' + entry.id);
    git(base, ['worktree', 'add', '-b', entry.id, dir]);
    prepare(entry.caseId, staging);
    fs.cpSync(staging, dir, { recursive: true });
    fs.rmSync(staging, { recursive: true });
    let wrapper = '';
    if (entry.arm === 'devmethod') {
      initialize({ destination: dir, tool: 'codex' });
      wrapper = 'Use the installed project-foundation skill and only its relevant references. ';
    }
    if (entry.arm === 'bmad') {
      const bmad = path.join(root, 'bmad-export');
      if (!fs.existsSync(path.join(bmad, '.agents/skills')))
        throw new Error(
          'Place the reviewed pinned BMAD 6.12.0 export in campaign-root/bmad-export before admission.',
        );
      fs.cpSync(bmad, dir, { recursive: true });
      wrapper = 'Use the installed BMAD method and the relevant skill for this bounded task. ';
    }
    const baseline = snapshot(dir);
    git(dir, ['add', '.']);
    git(dir, [
      '-c',
      'user.name=Evaluator',
      '-c',
      'user.email=evaluator@example.invalid',
      'commit',
      '-m',
      'Pinned arm setup',
    ]);
    const fixture = fixtures.find((f) => f.id === entry.caseId);
    const prompt =
      wrapper +
      (entry.caseId === 'B4'
        ? 'Run the initial tests and explicitly report their real failure before correcting and resuming. '
        : '') +
      fixture.prompt +
      '\nRespond in English. Stay in this worktree. No network, purchases, external writes, nested agents, commits or publication. Record a concise HANDOFF.md. Stop at the stated task scope.';
    const args = codexArguments({ directory: dir, model: 'gpt-5.6-sol' });
    const meta = {
      ...entry,
      driverPins: Object.fromEntries(
        [
          'scripts/run-native-pilot.mjs',
          'scripts/native-host.mjs',
          'scripts/hosts/codex.mjs',
          'scripts/hosts/checks.mjs',
        ].map((p) => [p, hash(fs.readFileSync(path.join(source, p)))]),
      ),
      methodRevision:
        entry.arm === 'none' ? 'none' : entry.arm === 'bmad' ? 'bmad-method@6.12.0' : revision,
      hostVersion: codexVersion,
      model: 'gpt-5.6-sol',
      effort: 'low',
      prompt,
      fixtureDigest: hash(JSON.stringify(fixture)),
      promptDigest: hash(fixture.prompt),
      baseline,
      args,
      timeoutSeconds: 120,
    };
    fs.writeFileSync(path.join(evidence, entry.id + '-setup.json'), JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({ event: 'started', id: entry.id }));
    const result = await supervise({
      command: 'codex',
      args,
      cwd: dir,
      prompt,
      timeoutMs: 120000,
      signal: controller.signal,
      env,
    });
    fs.writeFileSync(path.join(evidence, entry.id + '.jsonl'), result.stdout);
    fs.writeFileSync(path.join(evidence, entry.id + '.stderr'), result.stderr);
    let events;
    try {
      events = result.stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch {
      events = [];
    }
    const usage = codexUsage(events);
    let checks;
    try {
      checks = collect(entry.caseId, dir, baseline, verifyFixture);
    } catch (error) {
      checks = { error: error.message, testsIntact: false };
    }
    const acceptance = Boolean(
      checks.testsIntact &&
      checks.unauthorizedChanges.length === 0 &&
      checks.check.exit === (entry.caseId === 'B5' ? 1 : 0),
    );
    const record = {
      ...entry,
      status: result.status,
      exit: result.exit,
      error: result.error,
      usage,
      elapsedSeconds: result.elapsedSeconds,
      acceptance,
      checks,
      transcriptSha256: hash(result.stdout),
      review: 'pending; process exit and objective checks do not certify instruction adherence',
    };
    recordRun(slot, record);
    console.log(
      JSON.stringify({
        event: 'finished',
        id: entry.id,
        status: result.status,
        acceptance,
        usage,
        elapsedSeconds: result.elapsedSeconds,
      }),
    );
    if (result.status !== 'exited' || !usage) break;
  }
} finally {
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}
