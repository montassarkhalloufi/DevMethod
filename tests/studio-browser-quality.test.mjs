import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';
import { readProjectQuality, runProjectQuality } from '../scripts/studio/quality.mjs';
import { qualityAdapters } from '../scripts/studio/quality-adapters.mjs';
import { readControlEvidence } from '../scripts/studio/quality-evidence.mjs';
import { captureBusinessCriteria } from '../scripts/studio/quality-criteria.mjs';
import { writeQualityRun, qualitySnapshot } from '../scripts/studio/quality-storage.mjs';
import { startStudio } from '../scripts/studio/server.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

async function fixture(t, criterionIds = []) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'browser-quality-'));
  const store = createStudioStore(path.join(root, 'project'));
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Browser contract fixture',
      idea: 'Controlled test',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Create a controlled candidate' });
  });
  const jobs = createJobs(store),
    claim = jobs.claim('fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Fixture</h1>');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'devmethod.browser.json'),
    JSON.stringify({
      schemaVersion: 1,
      scenarios: [
        {
          id: 'heading',
          title: 'Heading fixture',
          criterionIds,
          steps: [
            { action: 'expectText', target: { role: 'heading', name: 'Fixture' }, text: 'Fixture' },
          ],
        },
      ],
    }),
  );
  const { revision } = await jobs.finish(
    { jobId: claim.job.id, title: 'Controlled candidate' },
    { deferActivation: true },
  );
  return { root, store, revision };
}

test('browser check needs explicit configuration and rejects claims to unknown criteria', async (t) => {
  const { store, revision } = await fixture(t, ['invented']);
  let row = readProjectQuality(store, revision.id).checks.find(
    ({ id }) => id === 'business-browser',
  );
  assert.equal(row.canRun, false);
  assert.equal(row.status, 'blocked');
  configureBrowserVerification(store, { version: 0, enabled: true, channel: 'chrome' });
  row = readProjectQuality(store, revision.id).checks.find(({ id }) => id === 'business-browser');
  assert.equal(row.canRun, false);
  assert.match(row.reason, /critère absent|pilote optionnel/);
  assert.equal(store.read().activeRevision, null);
});

test('an enabled legacy configuration cannot launch a browser before explicit local confirmation', async (t) => {
  const { store, revision } = await fixture(t);
  const file = path.join(store.root, '.devmethod/browser.json');
  fs.writeFileSync(
    file,
    JSON.stringify({ schemaVersion: 1, version: 1, enabled: true, channel: 'chrome' }),
  );
  const row = () =>
    readProjectQuality(store, revision.id).checks.find(({ id }) => id === 'business-browser');
  assert.equal(row().canRun, false);
  assert.match(row().reason, /Réenregistrer|pilote optionnel/);
  const saved = configureBrowserVerification(store, {
    version: 1,
    enabled: true,
    channel: 'chrome',
  });
  assert.equal(row().canRun, saved.driverAvailable);
});

test('executed browser assertions stay distinct from semantic business coverage and become stale on changed configuration or criteria', async (t) => {
  const { store, revision } = await fixture(t);
  store.commit(store.read().version, (state) => {
    state.brief.criteria = [{ id: 'durable', text: 'The saved value survives a restart.' }];
  });
  const configuration = configureBrowserVerification(store, {
    version: 0,
    enabled: true,
    channel: 'chrome',
  });
  const snapshot = qualitySnapshot(store, revision),
    date = new Date().toISOString();
  const run = {
    schemaVersion: 1,
    id: randomUUID(),
    checkId: 'business-browser',
    source: { kind: 'studio-adapter' },
    title: 'Controlled journal fixture, not a real browser execution',
    revisionId: revision.id,
    fingerprint: snapshot.fingerprint,
    status: 'passed',
    tool: 'Controlled fixture',
    environment: 'test',
    expected: 'Declared assertion',
    observed: 'Fixture observation',
    startedAt: date,
    finishedAt: date,
    findings: [],
    events: [],
    limits: ['Synthetic record for normalization only.'],
    browserConfigurationVersion: 1,
    browserConfigurationId: configuration.configurationId,
    browserChannel: 'chrome',
    browserDriverVersion: configuration.driverVersion,
    reportedCriterionIds: ['durable'],
    businessCriteria: captureBusinessCriteria(store.read()),
    browser: {
      protocol: 'studio-browser-v1',
      driverVersion: '1.63.0',
      browserVersion: 'fixture',
      channel: 'chrome',
      scenarios: [],
    },
  };
  writeQualityRun(store, run);
  const evidence = () =>
    readControlEvidence(store, revision.id).find(({ checkId }) => checkId === 'business-browser');
  assert.equal(evidence().trusted, true);
  assert.equal(evidence().kind, 'business');
  assert.equal(evidence().freshness, 'current');
  assert.deepEqual(evidence().criterionIds, []);
  assert.deepEqual(evidence().reportedCriterionIds, ['durable']);
  run.browserDriverVersion = 'changed-driver';
  writeQualityRun(store, run);
  assert.equal(evidence().freshness, 'reevaluate');
  run.browserDriverVersion = configuration.driverVersion;
  delete run.browserConfigurationId;
  writeQualityRun(store, run);
  assert.equal(evidence().freshness, 'reevaluate', 'Legacy receipts have no local identity');
  run.browserConfigurationId = configuration.configurationId;
  writeQualityRun(store, run);
  assert.equal(evidence().freshness, 'current');
  store.commit(store.read().version, (state) => {
    state.brief.criteria[0].text = 'A different obligation';
  });
  assert.equal(evidence().freshness, 'reevaluate');
  store.commit(store.read().version, (state) => {
    state.brief.criteria[0].text = 'The saved value survives a restart.';
  });
  configureBrowserVerification(store, { version: 1, enabled: true, channel: 'msedge' });
  assert.equal(evidence().freshness, 'reevaluate');
  fs.writeFileSync(
    path.join(store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  const archive = exportProject(store.root, store.read());
  for (const configuration of [
    { enabled: true, channel: 'chrome' },
    { enabled: true, channel: 'msedge' },
    { enabled: false, channel: 'chrome' },
  ]) {
    const restoredPath = path.join(
      store.root,
      '..',
      `restored-${configuration.channel}-${configuration.enabled}`,
    );
    restoreArchive(archive, restoredPath);
    const restored = createStudioStore(restoredPath);
    t.after(() => restored.close());
    const restoredRow = () =>
      readProjectQuality(restored, revision.id).checks.find(({ id }) => id === 'business-browser');
    const preserved = restoredRow();
    assert.deepEqual(preserved.evidence?.browser, run.browser);
    assert.equal(
      preserved.canRun,
      false,
      'Machine-local browser permission is never restored from an archive',
    );
    assert.equal(preserved.evidence.freshness, 'reevaluate');
    const saved = configureBrowserVerification(restored, { version: 0, ...configuration });
    assert.equal(saved.version, run.browserConfigurationVersion);
    assert.equal(
      restoredRow().evidence.freshness,
      'reevaluate',
      'A coinciding configuration counter after restoration cannot refresh an old receipt',
    );
  }
});

test('HTTP browser configuration refuses worker, foreign origin and stale writes without starting a job', async (t) => {
  const { store } = await fixture(t);
  store.close();
  const studio = await startStudio({ workspace: store.root, port: 0 });
  t.after(() => studio.close());
  const runtime = studio.runtime();
  const before = (await (await fetch(runtime.url + '/api/state')).json()).jobs.length;
  const post = (headers, version = 0) =>
    fetch(runtime.url + '/api/project/browser/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ version, enabled: true, channel: 'chrome' }),
    });
  assert.equal((await post({ Authorization: `Bearer ${runtime.token}` })).status, 403);
  assert.equal((await post({ Origin: 'https://foreign.invalid' })).status, 403);
  assert.equal((await post({ Origin: runtime.url })).status, 200);
  assert.equal((await post({ Origin: runtime.url })).status, 409);
  const configuration = await (await fetch(runtime.url + '/api/project/browser')).json();
  assert.equal(configuration.version, 1);
  assert.equal(configuration.enabled, true);
  assert.equal((await (await fetch(runtime.url + '/api/state')).json()).jobs.length, before);
});

test('quality owns the browser receipt, forwards cancellation and rejects a late result after local permission changes', async (t) => {
  for (const outcome of ['success', 'cancelled', 'reconfigured']) {
    await t.test(outcome, async (t) => {
      const { store, revision } = await fixture(t);
      const configuration = configureBrowserVerification(store, {
        version: 0,
        enabled: true,
        automatic: true,
        channel: 'chrome',
      });
      const controller = new AbortController();
      // Explicit controlled adapter: verifies orchestration, never starts a browser.
      t.mock.method(qualityAdapters, 'browser', async (snapshot, options) => {
        assert.equal(snapshot.revision.id, revision.id);
        assert.equal(options.signal, controller.signal);
        assert.equal(options.timeoutMs, 1234);
        assert.equal(options.channel, 'chrome');
        if (outcome === 'cancelled') controller.abort();
        if (outcome === 'reconfigured')
          configureBrowserVerification(store, {
            version: 1,
            enabled: true,
            automatic: false,
            channel: 'chrome',
          });
        return {
          status: 'passed',
          observed: 'Controlled adapter result, no real browser execution',
          findings: [],
          browser: {
            protocol: 'studio-browser-v1',
            driverVersion: configuration.driverVersion,
            browserVersion: 'controlled-fixture',
            channel: 'chrome',
            scenarios: [
              {
                id: 'heading',
                title: 'Heading fixture',
                criterionIds: [],
                status: 'passed',
                executedSteps: 1,
                assertions: [{ step: 1, action: 'expectText', status: 'passed' }],
              },
            ],
          },
        };
      });
      const checksBefore = store.read().checks.length;
      const report = await runProjectQuality(store, revision.id, 'business-browser', {
        signal: controller.signal,
        timeoutMs: 1234,
      });
      const row = report.checks.find(({ id }) => id === 'business-browser');
      assert.equal(row.evidence.browserConfigurationId, configuration.configurationId);
      assert.equal(row.evidence.browserDriverVersion, configuration.driverVersion);
      assert.equal(row.status, outcome === 'success' ? 'passed' : 'blocked');
      assert.equal(store.read().checks.length, checksBefore + (outcome === 'success' ? 1 : 0));
      assert.equal(store.read().activeRevision, null);
      assert.deepEqual(
        readControlEvidence(store, revision.id).find(
          ({ checkId }) => checkId === 'business-browser',
        ).criterionIds,
        [],
      );
    });
  }
});
