// Explicit bounded series. Source checkout and reviewed BMAD export required.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { codexEnvironment, codexVersion } from './hosts/codex.mjs';
import { createHash } from 'node:crypto';
import { initialize } from '../dist/init.js';
import { prepare, snapshot, collect } from './evaluation.mjs';
import { verifyFixture } from './hosts/checks.mjs';
import { runCodexTask } from './hosts/codex-task.mjs';
import { reserveRun, recordRun } from './native-host.mjs';
const count = Number(process.argv[2]),
  bmad = process.argv[3];
if (
  process.platform !== 'darwin' ||
  !Number.isInteger(count) ||
  count < 1 ||
  count > 6 ||
  !bmad ||
  !path.isAbsolute(bmad)
)
  throw Error(
    'Usage: node scripts/run-comparison-v2.mjs COUNT_1_TO_6 ABSOLUTE_BMAD_EXPORT (macOS)',
  );
if (
  execFileSync('codex', ['--version'], { encoding: 'utf8', env: codexEnvironment() }).trim() !==
  codexVersion
)
  throw Error('Codex version mismatch');
const auth = spawnSync('codex', ['login', 'status'], {
  encoding: 'utf8',
  env: codexEnvironment(),
  timeout: 10000,
});
if (auth.status !== 0 || !`${auth.stdout}${auth.stderr}`.includes('Logged in using ChatGPT'))
  throw Error('ChatGPT authentication required');
const evidence = path.resolve('evaluation-private/comparison-v2');
fs.mkdirSync(evidence, { recursive: true });
const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
const revision = git(process.cwd(), ['rev-parse', 'HEAD']);
const schedule = ['bmad', 'devmethod', 'devmethod', 'bmad', 'bmad', 'devmethod'];
for (const [index, arm] of schedule.slice(0, count).entries()) {
  const id = `b1-${index + 1}-${arm}`,
    file = path.join(evidence, 'ledger', id + '.json');
  if (fs.existsSync(file)) {
    const previous = JSON.parse(fs.readFileSync(file));
    if (previous.status === 'exited' && previous.usage) continue;
    throw Error('Unsuccessful slot requires reconciliation');
  }
  const slot = reserveRun(path.join(evidence, 'ledger'), id);
  const cwd = fs.mkdtempSync('/private/tmp/devmethod-comparison-'),
    fixture = path.join(cwd, 'task');
  prepare('B1', fixture);
  if (arm === 'bmad') fs.cpSync(bmad, fixture, { recursive: true });
  else initialize({ destination: fixture, tool: 'codex' });
  // Export rendering belongs to each invocation, not the preparation directory.
  if (arm === 'bmad')
    fs.rmSync(path.join(fixture, '_bmad/render'), { recursive: true, force: true });
  git(fixture, ['init', '-b', 'fix-page-size']);
  fs.writeFileSync(
    path.join(fixture, '.git/info/exclude'),
    '/.runtime/\n/_bmad/render/\n/_bmad-output/\n',
  );
  git(fixture, ['add', '.']);
  git(fixture, [
    '-c',
    'user.name=Evaluator',
    '-c',
    'user.email=evaluator@example.invalid',
    'commit',
    '-m',
    'Pinned fictional baseline',
  ]);
  const baseline = snapshot(fixture);
  const prompt =
    (arm === 'bmad'
      ? 'Use the installed bmad-build-auto skill. '
      : 'Use the installed project-foundation skill and relevant references. ') +
    'Fix page-size.mjs so all supplied acceptance tests pass. Preserve acceptance.test.mjs and change no unrelated source files. You may create method artifacts under _bmad-output/, runtime renderings under _bmad/render/, and temporary files under .runtime/. Deliver the local fix and HANDOFF.md. Routine planning and implementation are authorized. Synchronous subagents are authorized, up to three child agents concurrently, depth one; no detached work. Git staging in this isolated repository is authorized; no commits, external writes, network tools, purchases or publication. Wait for all children before finishing.';
  fs.writeFileSync(
    path.join(evidence, id + '-setup.json'),
    JSON.stringify(
      {
        arm,
        revision,
        cwd: fixture,
        prompt,
        baseline,
        model: 'gpt-5.6-sol',
        effort: 'low',
        bmadVersion: '6.12.0',
        driverPins: Object.fromEntries(
          [
            'run-comparison-v2.mjs',
            'hosts/codex-task.mjs',
            'hosts/codex-rpc.mjs',
            'hosts/codex-meter.mjs',
            'hosts/checks.mjs',
            'hosts/codex.mjs',
            'evaluation.mjs',
            'native-host.mjs',
          ].map((file) => [
            file,
            createHash('sha256')
              .update(fs.readFileSync(new URL(file, import.meta.url)))
              .digest('hex'),
          ]),
        ),
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ event: 'started', id }));
  const result = await runCodexTask({
    cwd: fixture,
    prompt,
    logFile: path.join(evidence, id + '.jsonl'),
  });
  let checks;
  try {
    checks = collect('B1', fixture, baseline, verifyFixture);
  } catch (e) {
    checks = { error: e.message };
  }
  const disallowed = checks.unauthorizedChanges?.filter(
    (name) =>
      baseline[name] !== undefined ||
      !['_bmad-output/', '_bmad/render/', '.runtime/'].some((prefix) => name.startsWith(prefix)),
  );
  const handoffPresent =
    fs.existsSync(path.join(fixture, 'HANDOFF.md')) &&
    fs.statSync(path.join(fixture, 'HANDOFF.md')).isFile() &&
    fs.statSync(path.join(fixture, 'HANDOFF.md')).size > 0;
  const acceptance = Boolean(
    handoffPresent && checks.testsIntact && checks.check.exit === 0 && disallowed?.length === 0,
  );
  recordRun(slot, { ...result, arm, acceptance, handoffPresent, checks, disallowed });
  console.log(
    JSON.stringify({
      event: 'finished',
      id,
      status: result.status,
      usage: result.usage,
      acceptance,
    }),
  );
  if (result.status !== 'exited' || !result.usage) break;
}
