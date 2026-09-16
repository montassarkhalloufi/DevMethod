import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkPackedGuard } from './package-guard-smoke.mjs';
const archive = process.argv[2];
if (!archive) throw new Error('Usage: node scripts/package-smoke.mjs PACKAGE_TGZ');
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-package-'));
const run = (command, args, cwd = root, expected = 0, input) => {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 30000, input });
  assert.equal(r.status, expected, `${command} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
};
try {
  // stdin avoids GNU tar treating a Windows drive letter as a remote host.
  run('tar', ['-xzf', '-'], root, 0, fs.readFileSync(path.resolve(archive)));
  const pkg = path.join(root, 'package');
  const cli = path.join(pkg, 'dist/cli.js');
  if (process.platform !== 'win32') {
    run(process.execPath, ['scripts/evidence-demo.mjs'], pkg);
    console.log(
      'Packed application evidence journey: correction, restart, maintenance and sticky stop passed.',
    );
    const { prepareRestartFixture } = await import(
      pathToFileURL(path.join(pkg, 'scripts/evidence-restart-comparison.mjs')).href
    );
    const { inspectEvidence, runEvidence } = await import(
      pathToFileURL(path.join(pkg, 'dist/evidence-runtime.js')).href
    );
    const restartWorkspace = path.join(root, 'restart-evidence');
    fs.mkdirSync(restartWorkspace);
    const restartOptions = prepareRestartFixture(restartWorkspace);
    for (const candidate of ['healthy', 'lost-restart']) {
      const candidateRoot = path.join(restartWorkspace, candidate);
      const expected = candidate === 'healthy' ? 0 : 1;
      run(
        process.execPath,
        [
          path.join(restartOptions.evaluatorRoot, 'restart-check.mjs'),
          candidateRoot,
          'candidate',
          'queue-partial',
        ],
        root,
        expected,
      );
      const plan = inspectEvidence({ ...restartOptions, root: candidateRoot });
      const result = await runEvidence({
        ...restartOptions,
        root: candidateRoot,
        session: path.join(restartWorkspace, `session-${candidate}`),
        permit: plan.permit,
      });
      assert.equal(result.status, expected === 0 ? 'supported' : 'failed');
    }
    console.log(
      'Packed restart checker: healthy acceptance and known restart fault detection passed.',
    );
  }
  const call = (args, expected = 0) => run(process.execPath, [cli, ...args], root, expected);
  assert.equal(JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'))).version, '0.5.0');
  run(process.execPath, ['evaluation/maintenance-fixtures/scripts/verify.mjs'], pkg);
  run(process.execPath, ['scripts/check-docs.mjs'], pkg);
  assert.match(call(['--help']), /Markdown PLAN\/tickets and legacy missions/);
  assert.ok(fs.existsSync(path.join(pkg, 'dist/closure.js')));
  assert.ok(fs.existsSync(path.join(pkg, 'dist/loop.js')));
  const loopFixture = {
    format: 1,
    missionId: 'PACK',
    state: 'active',
    nextAction: 'Inspect fixture',
    stopReason: null,
    limits: {
      maxAttempts: 2,
      maxConsecutiveNoProgress: 1,
      maxDurationMs: null,
      maxObservedTokens: null,
    },
    attempts: [],
  };
  fs.writeFileSync(path.join(root, 'loop.json'), JSON.stringify(loopFixture));
  assert.equal(JSON.parse(call(['loop', '--loop', 'loop.json', '--json'])).status, 'eligible');
  loopFixture.state = 'abandoned';
  loopFixture.nextAction = null;
  loopFixture.stopReason = 'Fixture scope ended';
  fs.writeFileSync(path.join(root, 'loop.json'), JSON.stringify(loopFixture));
  assert.equal(JSON.parse(call(['loop', '--loop', 'loop.json', '--json'], 1)).status, 'abandoned');
  call(['closure'], 2);
  const { digest, gitState } = await import(pathToFileURL(path.join(pkg, 'dist/records.js')).href);
  const closureRoot = path.join(root, 'closure');
  fs.mkdirSync(closureRoot);
  const writeClosure = (name, value) => fs.writeFileSync(path.join(closureRoot, name), value);
  writeClosure('.gitignore', 'checkpoint.json\n');
  writeClosure('contract.md', 'Verify the fictional criterion.');
  writeClosure('check.log', 'Fictional executed check: passed');
  writeClosure('code.txt', 'fixture');
  writeClosure(
    'mission.json',
    JSON.stringify({
      format: 1,
      id: 'PACK',
      path: 'standard',
      owner: 'fixture',
      outcome: 'Verify coverage',
      scope: ['Fixture'],
      exclusions: ['Publish'],
      invariants: ['Preserve fixture'],
      uncertainties: [],
      status: 'active',
      nextAction: 'Review',
      stopConditions: ['Verified'],
      dependencies: [],
      contradictions: [],
      acceptance: [
        {
          id: 'AC1',
          description: 'Fixture criterion',
          changes: ['code.txt'],
          verification: 'Never execute',
          kind: 'automated',
        },
      ],
      sources: [
        {
          id: 'contract',
          path: 'contract.md',
          level: 'domain',
          reason: 'Fixture',
          authority: 'Fixture',
          kind: 'accepted-decision',
          revision: 'fixture',
        },
      ],
    }),
  );
  run('git', ['init'], closureRoot);
  run('git', ['add', '.'], closureRoot);
  run(
    'git',
    [
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'fixture',
    ],
    closureRoot,
  );
  const pin = (id, file) => ({
    id,
    path: file,
    sha256: digest(fs.readFileSync(path.join(closureRoot, file))),
  });
  const snapshot = gitState(closureRoot);
  writeClosure(
    'checkpoint.json',
    JSON.stringify({
      format: 1,
      scope: 'Fixture',
      status: 'active',
      nextAction: 'Review',
      git: snapshot,
      sources: [
        pin('mission', 'mission.json'),
        pin('contract', 'contract.md'),
        pin('code', 'code.txt'),
      ],
      evidence: [
        {
          ...pin('check', 'check.log'),
          sourceIds: ['mission', 'contract', 'code'],
          dependsOn: [],
          outcome: 'passed',
          criterionIds: ['AC1'],
          kind: 'automated',
          revision: snapshot.commit,
        },
      ],
    }),
  );
  const closureArgs = [
    'closure',
    '--dest',
    closureRoot,
    '--mission',
    'mission.json',
    '--checkpoint',
    'checkpoint.json',
    '--json',
  ];
  assert.equal(JSON.parse(call(closureArgs)).status, 'supported');
  writeClosure('code.txt', 'changed fixture');
  assert.equal(JSON.parse(call(closureArgs, 1)).status, 'reverify');
  checkPackedGuard(call, closureRoot, path.join(root, 'guard-session'));
  const behavioral = JSON.parse(
    run(
      process.execPath,
      ['scripts/evaluate-behavior.mjs', 'evaluation/behavioral/pending.json'],
      pkg,
    ),
  );
  assert.equal(behavioral.plannedRuns, 36);
  assert.equal(behavioral.nativeCompletedRuns, 0);
  assert.equal(behavioral.nativePassRateAmongCompleted, null);
  const preparedRoot = path.join(root, 'prepared-review');
  const prepared = JSON.parse(
    run(process.execPath, ['scripts/prepare-behavior-case.mjs', 'REVIEW', preparedRoot], pkg),
  );
  assert.equal(prepared.status, 'prepared-not-run');
  assert.ok(Object.keys(prepared.files).length > 0);
  assert.ok(!fs.existsSync(path.join(preparedRoot, 'oracle.json')));
  for (const resource of [
    'project-foundation/references/exploration.md',
    'project-foundation/references/delivery-planning.md',
    'project-foundation/assets/EXISTANT.md',
    'project-foundation/assets/OPPORTUNITES.md',
    'project-foundation/assets/CADRAGE.md',
    'project-foundation/assets/REGLES.md',
    'scoped-delivery/assets/PLAN.md',
    'scoped-delivery/assets/TICKET.md',
    'scoped-delivery/assets/REPRISE.md',
    'scoped-delivery/assets/MISSION.md',
    'scoped-delivery/assets/REVIEW.md',
    'scoped-delivery/references/review-workflow.md',
  ]) {
    assert.ok(fs.statSync(path.join(pkg, '.agents/skills', resource)).size > 0, resource);
  }
  assert.ok(
    fs.existsSync(
      path.join(pkg, 'examples/mission-dialogue/docs/missions/first-save/tickets/SAVE-1.md'),
    ),
  );
  for (const file of [
    'review.js',
    'review-cli.js',
    'review-model.js',
    'review-browser.js',
    'review-ui.css',
  ])
    assert.ok(fs.statSync(path.join(pkg, 'dist', file)).size > 0, file);
  const reviewRoot = path.join(root, 'review-output');
  const reviewResult = JSON.parse(
    call([
      'review',
      '--demo',
      '--dest',
      reviewRoot,
      '--output',
      'review.html',
      '--markdown',
      'REVIEW.md',
      '--json',
    ]),
  );
  assert.equal(reviewResult.status, 'corrections');
  assert.ok(
    fs
      .readFileSync(path.join(reviewRoot, 'review.html'), 'utf8')
      .includes('Content-Security-Policy'),
  );
  assert.ok(fs.readFileSync(path.join(reviewRoot, 'REVIEW.md'), 'utf8').includes('R-01'));
  call(['review', '--demo', '--dest', reviewRoot, '--output', 'review.html'], 2);

  for (const testFile of [
    ...fs
      .readdirSync(path.join(pkg, 'examples/pocket-tasks/tests'))
      .filter((f) => f.endsWith('.test.mjs'))
      .map((f) => `examples/pocket-tasks/tests/${f}`),
    'evaluation/greenfield/acceptance.test.mjs',
    'evaluation/greenfield/security.test.mjs',
  ]) {
    run(process.execPath, ['--test', testFile], pkg);
  }
  for (const host of ['codex', 'claude', 'cursor']) {
    const project = path.join(root, host);
    call(['init', '--tool', host, '--dest', project]);
    assert.equal(JSON.parse(call(['doctor', '--dest', project, '--json'])).status, 'ok');
    const skillRoot = {
      codex: '.agents/skills',
      claude: '.claude/skills',
      cursor: '.cursor/skills',
    }[host];
    const entries = fs
      .readdirSync(path.join(project, skillRoot))
      .filter((name) => name.startsWith('devmethod-'));
    assert.equal(entries.length, 14);
    assert.ok(entries.includes('devmethod-review'));
    for (const name of entries)
      assert.ok(fs.statSync(path.join(project, skillRoot, name, 'SKILL.md')).size > 0);
    assert.ok(
      fs.statSync(path.join(project, skillRoot, 'scoped-delivery/references/review-format.md'))
        .size > 0,
    );
    fs.copyFileSync(
      path.join(pkg, 'examples/review/review.json'),
      path.join(project, 'review-fixture.json'),
    );
    const reportRun = JSON.parse(
      run(process.execPath, [
        path.join(project, skillRoot, 'scoped-delivery/scripts/review-agent.mjs'),
        '--dest',
        project,
        '--review',
        'review-fixture.json',
        '--output',
        'actual-report.html',
        '--markdown',
        'actual-report.md',
      ]),
    );
    assert.equal(reportRun.status, 'corrections');
    assert.ok(
      fs
        .readFileSync(path.join(project, 'actual-report.html'), 'utf8')
        .includes('Content-Security-Policy'),
    );
    assert.ok(fs.statSync(path.join(project, 'actual-report.md')).size > 0);
    const profile = path.join(project, 'PROJECT_PROFILE.md');
    fs.appendFileSync(profile, '\nFictional local customization.\n');
    const before = fs.readFileSync(profile);
    const preview = JSON.parse(call(['update-preview', '--dest', project, '--json']));
    assert.equal(
      preview.entries.find((e) => e.path === 'PROJECT_PROFILE.md').classification,
      'customized',
    );
    call(['init', '--tool', host, '--dest', project], 2);
    assert.deepEqual(fs.readFileSync(profile), before);
  }
  call([
    'init',
    '--tool',
    'claude',
    '--modules',
    'scoped-delivery',
    '--dest',
    path.join(root, 'subset'),
  ]);
  const project = path.join(root, 'mission');
  fs.mkdirSync(path.join(project, 'examples'), { recursive: true });
  fs.cpSync(path.join(pkg, 'examples/mission'), path.join(project, 'examples/mission'), {
    recursive: true,
  });
  fs.writeFileSync(path.join(project, '.gitignore'), 'evidence/\n');
  run('git', ['init'], project);
  run('git', ['add', '.'], project);
  run(
    'git',
    [
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'fixture',
    ],
    project,
  );
  const args = ['--dest', project, '--json'];
  assert.equal(
    JSON.parse(call(['mission', '--mission', 'examples/mission/mission.json', ...args])).status,
    'ready',
  );
  const context = call(['context', '--mission', 'examples/mission/mission.json', ...args]);
  fs.mkdirSync(path.join(project, 'evidence'));
  fs.writeFileSync(path.join(project, 'evidence/context.json'), context);
  assert.equal(
    JSON.parse(call(['context-check', '--context', 'evidence/context.json', ...args])).status,
    'ready',
  );
  fs.appendFileSync(path.join(project, 'examples/mission/CONTRACT.md'), '\nChanged contract.\n');
  assert.equal(
    JSON.parse(call(['context-check', '--context', 'evidence/context.json', ...args], 1)).status,
    'reverify',
  );
  assert.deepEqual(
    JSON.parse(call(['plan', '--plan', 'examples/mission/plan.json', ...args])).candidates,
    ['api'],
  );
  if (process.argv[3]) {
    const legacy = path.join(root, 'legacy-package');
    fs.mkdirSync(legacy);
    run(
      'tar',
      ['-xzf', '-', '--strip-components=1'],
      legacy,
      0,
      fs.readFileSync(path.resolve(process.argv[3])),
    );
    const adopted = path.join(root, 'legacy-adopted');
    run(process.execPath, [
      path.join(legacy, 'dist/cli.js'),
      'init',
      '--tool',
      'codex',
      '--dest',
      adopted,
    ]);
    const customized = path.join(adopted, '.agents/skills/project-foundation/SKILL.md');
    const profile = path.join(adopted, 'PROJECT_PROFILE.md');
    fs.appendFileSync(customized, '\nLocal workflow policy.\n');
    fs.appendFileSync(profile, '\nFilled project context.\n');
    const before = [fs.readFileSync(customized), fs.readFileSync(profile)];
    const preview = JSON.parse(call(['update-preview', '--dest', adopted, '--json']));
    const skillPath = '.agents/skills/project-foundation/SKILL.md';
    const upstreamChanged = !fs
      .readFileSync(path.join(legacy, skillPath))
      .equals(fs.readFileSync(path.join(pkg, skillPath)));
    assert.equal(
      preview.entries.find((e) => e.path === skillPath).classification,
      upstreamChanged ? 'conflict' : 'customized',
    );
    assert.equal(
      preview.provenance,
      JSON.parse(fs.readFileSync(path.join(adopted, 'kit-manifest.json'))).provenance
        ? 'recorded'
        : 'unknown',
    );
    call(['init', '--tool', 'codex', '--dest', adopted], 2);
    assert.deepEqual([fs.readFileSync(customized), fs.readFileSync(profile)], before);
    console.log(
      `Actual legacy tarball: ${upstreamChanged ? 'local/upstream conflict' : 'unchanged upstream with local customization'} detected; filled profile/custom skill preserved.`,
    );
  }
  console.log(
    'Packed 0.5.0: three host installs, subset, customization preservation, mission/context/staleness/planning and documentation links passed. No native host execution.',
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
