import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repository = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(repository, 'dist/cli.js');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-evidence-demo-'));
const observations = [];
const inputFiles = [
  'store.mjs',
  'server.mjs',
  'public/index.html',
  'public/app.js',
  'public/style.css',
];

function save(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function setup(name) {
  const directory = path.join(workspace, name);
  fs.mkdirSync(directory);
  const root = path.join(directory, 'app');
  const evaluator = path.join(directory, 'evaluator');
  fs.cpSync(path.join(repository, 'examples/evidence-lab/app'), root, { recursive: true });
  fs.cpSync(path.join(repository, 'examples/evidence-lab/evaluator'), evaluator, {
    recursive: true,
  });
  const contract = path.join(evaluator, 'contract.json');
  const strong = JSON.parse(fs.readFileSync(contract));
  const weak = JSON.parse(fs.readFileSync(path.join(evaluator, 'weak-contract.json')));
  strong.candidateInputs = inputFiles;
  weak.candidateInputs = inputFiles;
  save(contract, strong);
  return { root, evaluator, contract, session: path.join(directory, 'session'), strong, weak };
}

function command(context, action, extra = [], expectedExit = 0) {
  const args = [
    'evidence',
    action,
    '--dest',
    context.root,
    '--evaluator',
    context.evaluator,
    '--contract',
    context.contract,
  ];
  if (action !== 'plan') args.push('--session', context.session);
  args.push(...extra);
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    timeout: 130000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const report = JSON.parse(result.stdout);
  observations.push({ command: ['node', cli, ...args], exit: result.status, report });
  save(path.join(workspace, `observation-${observations.length}.json`), observations.at(-1));
  assert.equal(result.status, expectedExit, `${action}: ${result.stdout || result.stderr}`);
  console.log(
    `${path.basename(path.dirname(context.root))}: evidence ${action} → ${report.status ?? 'planned'}`,
  );
  return report;
}

function run(context, expected, notes = []) {
  const plan = command(context, 'plan');
  const report = command(
    context,
    'run',
    ['--permit', plan.permit, ...notes],
    expected === 'supported' ? 0 : 1,
  );
  assert.equal(report.status, expected);
  return report;
}

function freshProcessStore(context, file, seed = false) {
  const program = `import {pathToFileURL} from 'node:url';
    const {createStore} = await import(pathToFileURL(process.argv[1]));
    const store = createStore(process.argv[2]);
    if (process.argv[3] === 'seed') store.reserve({slotId:'garden',requestId:'demo-preserved-booking',seats:1});
    process.stdout.write(JSON.stringify({slots:store.listSlots(),reservations:store.listReservations()}));`;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      program,
      path.join(context.root, 'store.mjs'),
      file,
      seed ? 'seed' : 'read',
    ],
    {
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function changeRequirement(context) {
  const source = path.join(context.root, 'store.mjs');
  const before = fs.readFileSync(source, 'utf8');
  assert.equal(
    before.split('capacity: 3').length,
    2,
    'The deliberate seed change must match exactly one literal.',
  );
  fs.writeFileSync(source, before.replace('capacity: 3', 'capacity: 4'));
  const expectedFile = path.join(context.evaluator, 'expected-seeds.json');
  const expected = JSON.parse(fs.readFileSync(expectedFile));
  expected.slots.find((slot) => slot.id === 'garden').capacity = 4;
  save(expectedFile, expected);
  context.strong.intent +=
    ' New events have four garden seats; previously saved events retain their original capacity and reservations.';
  const capacityCriterion = context.strong.criteria.find(
    (criterion) => criterion.id === 'capacity',
  );
  capacityCriterion.description = capacityCriterion.description.replace(
    'garden with 3',
    'garden with 4',
  );
  save(context.contract, context.strong);
}

function lifecycle() {
  const context = setup('lifecycle');
  save(context.contract, context.weak);
  const weak = run(context, 'failed');
  assert.ok(weak.criteria.some((criterion) => criterion.status === 'calibration-failed'));
  save(context.contract, context.strong);
  const supported = run(context, 'supported', [
    '--diagnosis',
    'The vacuous check misses known faults.',
    '--adjustment',
    'Replace it with independent outcome assertions and declared controls.',
  ]);
  assert.equal(supported.attempts, 2);
  assert.equal(command(context, 'status').status, 'supported');

  const data = path.join(workspace, 'retained-event.json');
  const oldEvent = freshProcessStore(context, data, true);
  changeRequirement(context);
  assert.equal(command(context, 'status', [], 1).status, 'stale');
  const changed = run(context, 'supported');
  assert.equal(changed.attempts, 3);
  assert.equal(command(context, 'status').status, 'supported');
  const retained = freshProcessStore(context, data);
  assert.deepEqual(
    retained,
    oldEvent,
    'A default change must not migrate existing events silently.',
  );
  const newEvent = freshProcessStore(context, path.join(workspace, 'new-event.json'));
  assert.equal(newEvent.slots.find((slot) => slot.id === 'garden').capacity, 4);
  save(path.join(workspace, 'maintenance.json'), { oldEvent, retained, newEvent });
  return context;
}

function stickyStop() {
  // A separate, predeclared fault experiment. Never a replacement for the lifecycle session.
  const context = setup('independent-stop-probe');
  save(context.contract, context.weak);
  run(context, 'failed');
  const stopped = run(context, 'halted', [
    '--diagnosis',
    'The same fault still escapes.',
    '--adjustment',
    'Control probe intentionally reproduces the same criterion failure.',
  ]);
  assert.equal(stopped.attempts, 2);
  save(context.contract, context.strong);
  const afterChange = run(context, 'halted');
  assert.equal(
    afterChange.attempts,
    2,
    'A changed permit must not remove the stop or execute again.',
  );
  assert.equal(command(context, 'status', [], 1).status, 'halted');
}

try {
  const context = lifecycle();
  stickyStop();
  const summary = {
    format: 1,
    workspace,
    node: process.version,
    platform: process.platform,
    observed: [
      'weak-check-rejected',
      'corrected-check-supported',
      'new-process-resume',
      'requirement-and-code-change-stale',
      'changed-candidate-supported',
      'existing-event-preserved',
      'new-event-capacity-four',
      'persistent-stop-survives-permit-change',
    ],
    observations: observations.length,
    serve: [
      'node',
      path.join(context.root, 'server.mjs'),
      '--port',
      '4177',
      '--data',
      path.join(workspace, 'new-event.json'),
    ],
    limitations:
      'Local deterministic application journey. No native model comparison, visual assessment or external adoption result. Separate stop probe retained; no halted session reset.',
  };
  save(path.join(workspace, 'summary.json'), summary);
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  save(path.join(workspace, 'failure.json'), {
    message: String(error),
    observations: observations.length,
  });
  console.error(`Demo failed; all partial observations retained in ${workspace}. ${String(error)}`);
  process.exitCode = 1;
}
