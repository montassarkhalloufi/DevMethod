import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { setImmediate } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { createAgentRunner } from '../scripts/studio/runner.mjs';
import { createControlPlane } from '../scripts/studio/control-plane.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';
import { acceptRiskOutput, riskCommand } from '../scripts/studio/risk-model.mjs';
import { buildRiskContext } from '../scripts/studio/risk-context.mjs';
import { validateControlPlane } from '../dist/control-plane/validation.js';
import {
  configureProjectConnector,
  reportConnectorProbe,
  prepareExternalQualityRun,
} from '../scripts/studio/connectors.mjs';
import { importExternalQualityResult, readProjectQuality } from '../scripts/studio/quality.mjs';

const usage = { inputTokens: 10, outputTokens: 5 };
const output = {
  summary: 'Hypothèse de fixture, aucun modèle ni test réel.',
  findings: [
    {
      category: 'concurrency',
      path: 'main.js',
      side: 'after',
      line: 1,
      reason: 'Deux accès peuvent partager le même état.',
      invariant: 'Une seule écriture acceptée.',
      scenario: 'Lancer deux appels synchronisés et compter les écritures.',
      uncertainty: 'Protection interne non fournie.',
    },
  ],
  limits: [],
};

async function fixture(t, execute) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'risk-contract-'));
  const store = createStudioStore(root),
    jobs = createJobs(store);
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Risk fixture',
      idea: 'Fixture fictive de contrats',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Fixture' });
  });
  const claim = jobs.claim('fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Fixture</h1>');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'main.js'),
    'async function reserve() { await db.insert(); }',
  );
  jobs.finish({
    jobId: claim.job.id,
    title: 'Fixture',
    summary: 'Écriture fictive, sans exécution.',
  });
  const runner = createAgentRunner({ store, jobs, options: { maxJobs: 2 }, execute });
  const plane = await createControlPlane({ store, agent: () => runner });
  t.after(async () => {
    await runner.close();
    await plane.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const report = plane.read();
  return {
    store,
    runner,
    plane,
    report,
    input: { revisionId: report.hybrid.revisionId, contextKey: report.hybrid.contextKey },
  };
}

async function settle(f) {
  const end = Date.now() + 3000;
  while (f.plane.read().hybrid.analysis?.status === 'running') {
    assert.ok(Date.now() < end, 'Injected boundary must settle');
    await setImmediate();
  }
}

test('explicit analysis is deduplicated, uses shared budget and only adds inferred findings and real proof requirements', async (t) => {
  let release,
    calls = 0;
  const f = await fixture(t, (input) => {
    calls++;
    assert.equal(input.inspection, true);
    return new Promise((resolve) => {
      release = () => resolve({ ok: true, result: output, usage });
    });
  });
  for (let i = 0; i < 3; i++) f.plane.read();
  assert.equal(calls, 0);
  f.plane.analyze(f.input);
  f.plane.analyze(f.input);
  assert.equal(calls, 1);
  assert.equal(f.runner.status().attempts, 1);
  assert.throws(() => f.runner.inspect({ id: 'duplicate', prompt: 'no' }), /occupé/);
  release();
  await settle(f);
  const report = f.plane.read();
  assert.equal(report.hybrid.analysis.status, 'completed');
  assert.equal(report.policy.id, 'control-plane-v2');
  assert.ok(report.snapshot.nodes.find((node) => node.checkId === 'concurrency').required);
  assert.equal(
    report.snapshot.nodes.find((node) => node.source === 'Hypothèse contextuelle IA').status,
    'inferred',
  );
  assert.notEqual(report.snapshot.decision.effective, 'Auto-Continue');
  assert.equal(f.runner.status().knownTokens, 15);
  f.plane.analyze(f.input);
  assert.equal(calls, 1);
  validateControlPlane(f.store.read().controlPlane);
});

test('criteria changed during execution make late findings historical; stale requests cannot launch again', async (t) => {
  let release;
  const f = await fixture(
    t,
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  f.plane.analyze(f.input);
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria.push({ id: 'new', text: 'Nouvel invariant' });
  });
  release({ ok: true, result: output, usage });
  await f.plane.close();
  const current = f.plane.read();
  assert.equal(current.hybrid.analysis, undefined);
  assert.equal(current.analyses[0].status, 'completed');
  assert.throws(() => f.plane.analyze(f.input), /contexte a changé/);
  assert.ok(!current.snapshot.nodes.some((node) => node.source === 'Hypothèse contextuelle IA'));
});

test('a completed analysis that reports missing context keeps an unresolved coverage signal', async (t) => {
  const f = await fixture(t, async () => ({
    ok: true,
    usage,
    result: {
      summary: 'Aucun défaut précis établi dans le contexte fourni.',
      findings: [],
      limits: ['La transaction interne du stockage n’est pas fournie.'],
    },
  }));
  f.plane.analyze(f.input);
  await settle(f);
  const report = f.plane.read();
  assert.equal(report.hybrid.analysis.status, 'completed');
  const coverage = report.snapshot.input.signals.find((signal) => signal.id === 'hybrid-coverage');
  assert.ok(coverage, 'Une réponse recevable ne résout pas sa propre lacune de couverture.');
  assert.equal(coverage.level, 'medium');
  assert.equal(coverage.humanResolvable, false);
});

test('cancellation ignores a late result and unknown consumption suspends the shared runner', async (t) => {
  let release;
  const f = await fixture(
    t,
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const running = f.plane.analyze(f.input);
  f.plane.cancelAnalysis({ id: running.hybrid.analysis.id });
  release({ ok: true, result: output, usage: null });
  await f.plane.close();
  assert.equal(f.plane.read().hybrid.analysis.status, 'cancelled');
  assert.equal(f.plane.read().hybrid.analysis.output, undefined);
  assert.equal(f.runner.status().usageUnknown, true);
  assert.equal(f.runner.status().automatic, false);
});

test('malformed output and invented references fail closed without removing required evidence', async (t) => {
  const f = await fixture(t, async () => ({
    ok: true,
    usage,
    result: { ...output, autonomy: 'Auto-Continue' },
  }));
  f.plane.analyze(f.input);
  await settle(f);
  assert.equal(f.plane.read().hybrid.analysis.status, 'failed');
  assert.equal(f.plane.read().hybrid.analysis.output, undefined);
  assert.notEqual(f.plane.read().snapshot.decision.effective, 'Auto-Continue');
  const context = buildRiskContext(f.store, f.input.revisionId);
  assert.throws(
    () =>
      acceptRiskOutput({ ...output, findings: [{ ...output.findings[0], line: 999 }] }, context),
    /Référence/,
  );
  assert.throws(
    () =>
      acceptRiskOutput(
        { ...output, findings: [{ ...output.findings[0], path: '../secret' }] },
        context,
      ),
    /Référence/,
  );
  assert.throws(
    () =>
      f.store.commit(f.store.read().version, (state) => {
        state.controlPlane.analyses = [];
      }),
    /Journal/,
  );
});

test('risk execution command restricts capabilities instead of trusting instructions in code', () => {
  const args = riskCommand('/fixture', '/fixture/result', '/fixture/schema');
  assert.equal(args[args.indexOf('--sandbox') + 1], 'read-only');
  for (const feature of [
    'shell_tool',
    'unified_exec',
    'apps',
    'plugins',
    'multi_agent',
    'browser_use',
    'code_mode_host',
  ]) {
    const index = args.indexOf(feature);
    assert.equal(args[index - 1], '--disable');
  }
  assert.ok(args.includes('--ignore-user-config') && args.includes('--ignore-rules'));
});

test('targeted scenarios bind real host receipts; a new AI finding invalidates an older green receipt on the same revision', async (t) => {
  const f = await fixture(t, async () => ({ ok: true, result: output, usage }));
  configureProjectConnector(f.store, {
    id: 'tests',
    optionId: 'node-test',
    purpose: 'diagnostics',
    profileRef: 'host:fixture',
    secretRefs: [],
  });
  reportConnectorProbe(f.store, {
    connectionId: 'tests',
    connectionVersion: 1,
    eventId: 'probe',
    status: 'available',
    tool: { name: 'Fixture de contrat', version: '1' },
    capabilities: ['automated-testing'],
    observedAt: new Date().toISOString(),
  });
  const ticket = prepareExternalQualityRun(f.store, {
    connectionId: 'tests',
    revisionId: f.input.revisionId,
    checkId: 'concurrency',
  });
  assert.ok(ticket.riskRequirement.fingerprint);
  assert.match(ticket.prompt, /Scénarios ciblés/);
  const result = {
    runId: ticket.runId,
    connectionId: ticket.connectionId,
    revisionId: ticket.revisionId,
    fingerprint: ticket.fingerprint,
    tool: ticket.tool,
    source: { kind: 'host-local' },
    startedAt: ticket.admittedAt,
    finishedAt: new Date().toISOString(),
    status: 'passed',
    observed: 'Attestation injectée pour tester le contrat, pas une preuve du modèle.',
    findings: [],
    metrics: {},
  };
  importExternalQualityResult(f.store, result);
  assert.equal(
    f.plane.read().snapshot.nodes.find((node) => node.checkId === 'concurrency').freshness,
    'current',
  );
  f.plane.analyze(f.input);
  await settle(f);
  assert.equal(
    f.plane.read().snapshot.nodes.find((node) => node.checkId === 'concurrency').freshness,
    'stale',
  );
  assert.equal(
    readProjectQuality(f.store, f.input.revisionId).checks.find(
      (check) => check.id === 'concurrency',
    ).freshness,
    'reevaluate',
  );
  const next = prepareExternalQualityRun(f.store, {
    connectionId: 'tests',
    revisionId: f.input.revisionId,
    checkId: 'concurrency',
  });
  assert.notEqual(next.riskRequirement.fingerprint, ticket.riskRequirement.fingerprint);
  assert.ok(next.riskRequirement.scenarios.some((scenario) => scenario.includes('synchronisés')));
});

test('an interrupted analysis is retained after restart and its unresolved receipt blocks another call', async (t) => {
  const f = await fixture(t, async () => ({ ok: false, usage: null, error: 'fixture' }));
  f.store.commit(f.store.read().version, (state) => {
    state.controlPlane.analyses = [
      {
        id: 'risk-interrupted',
        contextKey: f.input.contextKey,
        revisionId: f.input.revisionId,
        provider: 'Fixture',
        status: 'running',
        startedAt: new Date().toISOString(),
      },
    ];
  });
  fs.writeFileSync(
    path.join(f.store.root, '.devmethod/agent.json'),
    JSON.stringify({
      attempts: 1,
      knownTokens: 0,
      unknownUsage: false,
      runs: [{ jobId: 'risk-interrupted', status: 'running', startedAt: new Date().toISOString() }],
    }),
  );
  f.store.close();
  const restarted = createStudioStore(f.store.root);
  const runner = createAgentRunner({ store: restarted, jobs: {}, options: {} });
  assert.equal(restarted.read().controlPlane.analyses[0].status, 'interrupted');
  assert.equal(runner.status().usageUnknown, true);
  assert.throws(() => runner.inspect({ id: 'retry', prompt: 'Forbidden' }), /budget/);
  await runner.close();
  restarted.close();
});

test('semantic permission findings raise human attention but an agreement never supplies the authorization proof', async (t) => {
  const permission = {
    ...output,
    findings: [
      { ...output.findings[0], category: 'permissions', reason: 'Condition d’accès à examiner.' },
    ],
  };
  const f = await fixture(t, async () => ({ ok: true, result: permission, usage }));
  f.plane.analyze(f.input);
  await settle(f);
  let report = f.plane.read();
  assert.equal(report.snapshot.decision.effective, 'Human Decision');
  const item = report.attention.find((entry) => entry.riskIds.includes('hybrid-permissions'));
  report = f.plane.decide({
    itemId: item.id,
    resolution: 'accept',
    reason: 'Décision de fixture uniquement.',
    version: report.version,
    snapshotKey: report.snapshot.key,
  });
  assert.equal(report.snapshot.decision.effective, 'Verify');
  const proof = report.snapshot.nodes.find((node) => node.checkId === 'authorization');
  assert.equal(proof.required, true);
  assert.notEqual(proof.outcome, 'passed');
});

test('a development request queued during inspection resumes within the same remaining budget', async (t) => {
  let release,
    developmentCalls = 0;
  const f = await fixture(t, (input) => {
    if (input.inspection)
      return new Promise((resolve) => {
        release = resolve;
      });
    developmentCalls++;
    fs.writeFileSync(path.join(input.directory, 'app/index.html'), '<h1>Demande reprise</h1>');
    return Promise.resolve({
      ok: true,
      result: { title: 'Fixture conservée', summary: 'Contrat de reprise uniquement.' },
      usage,
    });
  });
  f.plane.analyze(f.input);
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Demande explicitement mise en attente pendant l’analyse' }),
  );
  f.runner.wake();
  assert.equal(developmentCalls, 0);
  release({ ok: true, result: output, usage });
  const deadline = Date.now() + 3000;
  while (f.runner.status().running) {
    assert.ok(Date.now() < deadline);
    await setImmediate();
  }
  assert.equal(developmentCalls, 1);
  assert.equal(f.runner.status().attempts, 2);
  assert.equal(f.store.read().jobs.at(-1).status, 'ready', f.store.read().jobs.at(-1).error);
});
