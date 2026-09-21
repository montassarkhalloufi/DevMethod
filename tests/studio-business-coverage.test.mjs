import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createInitialStudioState, createStudioStore } from '../scripts/studio/store.mjs';
import { claimJob, finishJob, queueRequest } from '../scripts/studio/domain.mjs';
import {
  coverageBindings,
  projectBrowserCoverage,
  scenarioCanCover,
} from '../scripts/studio/business-coverage.mjs';
import { coverageTopic, validateCoverageRecord } from '../scripts/studio/coverage-record.mjs';
import { businessCriteriaFingerprint } from '../scripts/studio/quality-criteria.mjs';

function fixture() {
  const state = {
    brief: { criteria: [{ id: 'save', text: 'Relire la valeur sauvegardée après redémarrage.' }] },
    decisions: [],
  };
  const manifest = {
    manifestFingerprint: 'a'.repeat(64),
    scenarios: [
      {
        id: 'save-restart',
        title: 'Sauvegarder et relire',
        criterionIds: ['save'],
        steps: [
          { action: 'fill', target: { role: 'textbox', name: 'Valeur' }, value: '{{nonce}}' },
          { action: 'click', target: { role: 'button', name: 'Sauvegarder' } },
          { action: 'restart' },
          {
            action: 'expectValue',
            target: { role: 'textbox', name: 'Valeur' },
            value: '{{nonce}}',
          },
        ],
      },
    ],
  };
  const run = {
    id: 'receipt',
    revisionId: 'candidate',
    checkId: 'business-browser',
    fingerprint: 'b'.repeat(64),
    source: { kind: 'studio-adapter' },
    status: 'passed',
    freshness: 'current',
    startedAt: '2026-09-21T14:00:00.000Z',
    finishedAt: '2026-09-21T14:00:02.000Z',
    businessCriteria: { fingerprint: businessCriteriaFingerprint(state) },
    browserDriverVersion: '1.63.0',
    browser: {
      protocol: 'studio-browser-v1',
      driverVersion: '1.63.0',
      browserVersion: 'controlled-fixture',
      manifestFingerprint: manifest.manifestFingerprint,
      sourceFingerprint: 'b'.repeat(64),
      scenarios: [
        {
          id: 'save-restart',
          status: 'passed',
          executedSteps: 4,
          assertions: [{ step: 4, action: 'expectValue', status: 'passed' }],
        },
      ],
    },
  };
  const decision = {
    id: 'assessment',
    source: 'user',
    status: 'active',
    reason: 'Relecture indépendante après redémarrage.',
    topic: coverageTopic('candidate', 'save'),
    coverage: {
      schemaVersion: 1,
      ...coverageBindings(state, run, manifest),
      criterion: { ...state.brief.criteria[0] },
      scenarioIds: ['save-restart'],
      conclusion: 'sufficient',
      scope: 'Valeur texte locale dans le navigateur de recette.',
      reviewKey: 'c'.repeat(64),
      createdAt: '2026-09-21T15:00:00.000Z',
    },
  };
  return { state, run, manifest, decision };
}

test('passing declarations do not cover a criterion; an exact explicit assessment does', () => {
  const { state, run, manifest, decision } = fixture();
  assert.deepEqual(projectBrowserCoverage(state, run, manifest), []);
  validateCoverageRecord(decision.coverage);
  state.decisions.push(decision);
  const assessments = projectBrowserCoverage(state, run, manifest);
  assert.equal(assessments.length, 1);
  assert.equal(assessments[0].criterionId, 'save');
  assert.equal(assessments[0].contributes, true);
  assert.equal(assessments[0].freshness, 'current');
});

for (const conclusion of ['partial', 'irrelevant'])
  test(`${conclusion} retains interpretation without closing the criterion`, () => {
    const { state, run, manifest, decision } = fixture();
    decision.coverage.conclusion = conclusion;
    state.decisions.push(decision);
    const [assessment] = projectBrowserCoverage(state, run, manifest);
    assert.equal(assessment.contributes, false);
    assert.equal(assessment.freshness, 'current');
    assert.equal(assessment.conclusion, conclusion);
  });

for (const change of [
  'criterion',
  'source',
  'manifest',
  'receipt',
  'protocol',
  'driver',
  'browser',
  'configuration',
  'superseded',
  'external',
  'worker',
  'missing-assertion',
  'failed-assertion',
  'missing-step',
])
  test(`${change} cannot retain effective business coverage`, () => {
    const { state, run, manifest, decision } = fixture();
    state.decisions.push(decision);
    if (change === 'criterion') state.brief.criteria[0].text = 'Autre obligation';
    if (change === 'source') run.fingerprint = 'd'.repeat(64);
    if (change === 'manifest') manifest.manifestFingerprint = 'd'.repeat(64);
    if (change === 'receipt') run.observed = 'Receipt changed';
    if (change === 'protocol') run.browser.protocol = 'future';
    if (change === 'driver') run.browser.driverVersion = 'future';
    if (change === 'browser') run.browser.browserVersion = 'changed';
    if (change === 'configuration') run.freshness = 'reevaluate';
    if (change === 'superseded') decision.status = 'superseded';
    if (change === 'external') run.provider = { attestation: 'host-bridge' };
    if (change === 'worker') decision.source = 'agent';
    if (change === 'missing-assertion') run.browser.scenarios[0].assertions = [];
    if (change === 'failed-assertion') run.browser.scenarios[0].assertions[0].status = 'failed';
    if (change === 'missing-step') run.browser.scenarios[0].executedSteps = 3;
    assert.ok(projectBrowserCoverage(state, run, manifest).every((item) => !item.contributes));
  });

test('all selected scenario assertions and preceding steps are required', () => {
  const { run, manifest } = fixture();
  assert.equal(scenarioCanCover(run, manifest.scenarios[0]), true);
  run.browser.scenarios[0].assertions.push({ step: 4, action: 'expectValue', status: 'passed' });
  assert.equal(scenarioCanCover(run, manifest.scenarios[0]), false);
});

test('a receipt without confirmed completion cannot contribute despite its passing flag', () => {
  const { state, run, manifest, decision } = fixture();
  delete run.finishedAt;
  decision.coverage = { ...decision.coverage, ...coverageBindings(state, run, manifest) };
  state.decisions.push(decision);
  assert.equal(projectBrowserCoverage(state, run, manifest)[0].contributes, false);
});

for (const source of ['user', 'agent']) {
  test(`legacy free-text coverage topic from ${source} remains loadable without rewriting`, (t) => {
    const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'coverage-legacy-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const state = createInitialStudioState();
    state.decisions.push({
      id: 'legacy-decision',
      topic: 'Couverture métier historique',
      choice: 'Ancien choix',
      reason: 'Ancienne justification',
      status: 'active',
      source,
    });
    fs.mkdirSync(path.join(root, '.devmethod'));
    const file = path.join(root, '.devmethod/studio.json');
    const bytes = JSON.stringify(state);
    fs.writeFileSync(file, bytes);
    const store = createStudioStore(root);
    t.after(() => store.close());
    assert.deepEqual(store.read(), state);
    assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  });
}

test('agent bare coverage topic cannot supersede an existing user assessment', () => {
  const { decision } = fixture();
  const state = createInitialStudioState();
  state.decisions.push({ ...decision, choice: 'Couverture suffisante' });
  const job = queueRequest(state, { request: 'Examiner le projet' });
  claimJob(state, { worker: 'fixture' });
  const before = structuredClone(state);
  assert.throws(
    () =>
      finishJob(state, {
        jobId: job.id,
        decisions: [
          {
            id: 'forged-topic',
            topic: decision.topic,
            choice: 'Remplacer',
            reason: 'Fixture de frontière',
            status: 'active',
            source: 'agent',
          },
        ],
      }),
    /Sujet de couverture réservé/,
  );
  assert.deepEqual(state, before);
});
