import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { startStudio } from '../scripts/studio/server.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';
import { connectorOptions } from '../scripts/studio/connectors-catalog.mjs';
import {
  configureProjectConnector,
  reportConnectorProbe,
  readProjectConnectors,
} from '../scripts/studio/connectors.mjs';

const execute = promisify(execFile);
const tools = [
  { name: 'fixture_tool', inputSchema: { type: 'object' }, outputSchema: { type: 'object' } },
];
const configuration = (option) => ({
  id: 'coverage',
  optionId: option.id,
  purpose: option.purpose,
  profileRef: 'host:coverage-fixture',
  secretRefs: ['env:COVERAGE_ACCESS', 'host:coverage-credentials'],
});

function temporaryRoot() {
  return fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'connector-coverage-'));
}

test('every catalogue capability accepts bounded host attestations without treating configuration as connection', async (t) => {
  for (const option of connectorOptions)
    await t.test(`${option.id} (${option.transport})`, async (t) => {
      const root = temporaryRoot(),
        store = createStudioStore(root);
      t.after(() => {
        store.close();
        fs.rmSync(root, { recursive: true, force: true });
      });
      t.mock.method(globalThis, 'fetch', () => {
        throw new Error('A catalogue attestation must not access any network');
      });
      const initial = store.read(),
        config = configuration(option);
      const configured = configureProjectConnector(store, config).connections[0];
      assert.equal(configured.status, 'configured');
      assert.equal(configured.probe, null);
      assert.deepEqual(configured.secretRefs, config.secretRefs);
      assert.equal(configured.profileRef, config.profileRef);
      const registryFile = path.join(root, '.devmethod/connectors.json');
      const before = fs.readFileSync(registryFile);
      assert.throws(
        () =>
          configureProjectConnector(store, {
            ...config,
            expectedVersion: 1,
            apiKey: 'sentinel-value',
          }),
        { status: 400 },
      );
      assert.throws(
        () =>
          configureProjectConnector(store, {
            ...config,
            expectedVersion: 1,
            secretRefs: ['raw-value'],
          }),
        { status: 400 },
      );
      assert.deepEqual(fs.readFileSync(registryFile), before);
      const observation = {
        connectionId: config.id,
        connectionVersion: 1,
        status: 'available',
        tool: { name: 'Protocol fixture', version: 'fixture-1' },
        ...(option.transport === 'mcp' ? { tools } : {}),
        summary: 'Fixture de protocole uniquement ; aucun fournisseur connecté.',
      };
      assert.throws(
        () =>
          reportConnectorProbe(store, {
            ...observation,
            eventId: 'bad-capability',
            observedAt: new Date().toISOString(),
            capabilities: ['invented-capability'],
          }),
        { status: 400 },
      );
      assert.throws(
        () =>
          reportConnectorProbe(store, {
            ...observation,
            connectionVersion: 9,
            eventId: 'bad-version',
            observedAt: new Date().toISOString(),
            capabilities: [option.capabilities[0]],
          }),
        { status: 409 },
      );
      if (option.transport === 'mcp')
        assert.throws(
          () =>
            reportConnectorProbe(store, {
              ...observation,
              tools: [],
              eventId: 'no-tools',
              observedAt: new Date().toISOString(),
              capabilities: [option.capabilities[0]],
            }),
          { status: 400 },
        );
      for (const [index, capability] of option.capabilities.entries()) {
        const report = reportConnectorProbe(store, {
          ...observation,
          eventId: `capability-${index}`,
          observedAt: new Date().toISOString(),
          capabilities: [capability],
        });
        const connection = report.connections[0];
        assert.equal(connection.status, 'attested');
        assert.deepEqual(connection.probe.capabilities, [capability]);
        if (option.transport === 'mcp')
          assert.match(connection.probe.tools[0].inputSchemaFingerprint, /^[a-f0-9]{64}$/);
      }
      const changed = configureProjectConnector(store, {
        ...config,
        expectedVersion: 1,
        profileRef: 'host:coverage-reconfigured',
      }).connections[0];
      assert.equal(changed.version, 2);
      assert.equal(changed.status, 'configured');
      assert.equal(changed.probe, null);
      const failed = reportConnectorProbe(store, {
        ...observation,
        connectionVersion: 2,
        eventId: 'failure',
        status: 'failed',
        observedAt: new Date().toISOString(),
        capabilities: [],
        tools: [],
      }).connections[0];
      assert.equal(failed.status, 'failed');
      assert.deepEqual(store.read(), initial);
      assert.equal(
        readProjectConnectors(store).connections.some((entry) => entry.status === 'connected'),
        false,
      );
      assert.doesNotMatch(fs.readFileSync(registryFile, 'utf8'), /sentinel-value|raw-value|apiKey/);
    });
});

async function httpFixture(t) {
  const root = temporaryRoot(),
    studio = await startStudio({ workspace: root, port: 0, previewPort: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) => {
    updateProject(state, {
      name: 'Coverage fixture',
      idea: 'Check the bridge contract',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Create local fixture files' });
  });
  const claim = studio.jobs.claim('Coverage fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Fixture</h1>');
  fs.writeFileSync(path.join(claim.workDirectory, 'main.js'), 'const ready = true;\n');
  const delivered = await studio.jobs.finish({
    jobId: claim.job.id,
    title: 'Fixture',
    summary: 'Fixture source files',
  });
  const runtime = studio.runtime();
  return {
    root,
    studio,
    revisionId: delivered.revision.id,
    file: path.join(root, 'revisions', delivered.revision.id, 'app/main.js'),
    async post(route, input, worker = false) {
      const response = await fetch(runtime.url + '/api/connectors/' + route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(worker ? { Authorization: 'Bearer ' + runtime.token } : { Origin: runtime.url }),
        },
        body: JSON.stringify(input),
      });
      return { status: response.status, value: await response.json() };
    },
  };
}

for (const [transport, optionId, capability, checkId] of [
  ['local', 'node-check', 'code-quality', 'source-syntax'],
  ['api', 'diagnostic-api', 'code-quality', 'source-syntax'],
  ['mcp', 'playwright-mcp', 'browser-testing', 'end-to-end'],
])
  test(`HTTP ${transport} receipts preserve provenance, reject mismatches and distinguish real Node execution from blocked provider fixtures`, async (t) => {
    const f = await httpFixture(t),
      option = connectorOptions.find((entry) => entry.id === optionId);
    assert.equal((await f.post('configure', configuration(option))).status, 200);
    assert.equal(
      (await f.post('executions', { connectionId: 'coverage', revisionId: f.revisionId, checkId }))
        .status,
      409,
    );
    const probe = {
      connectionId: 'coverage',
      connectionVersion: 1,
      eventId: 'available',
      status: 'available',
      tool:
        transport === 'local'
          ? { name: 'Node.js', version: process.versions.node }
          : { name: 'Protocol fixture', version: 'fixture-1' },
      capabilities: [capability],
      ...(transport === 'mcp' ? { tools } : {}),
      observedAt: new Date().toISOString(),
      summary: 'Host protocol fixture, no external provider connection.',
    };
    assert.equal((await f.post('probe', probe)).status, 403);
    assert.equal((await f.post('probe', probe, true)).status, 200);
    const prepared = await f.post('executions', {
      connectionId: 'coverage',
      revisionId: f.revisionId,
      checkId,
    });
    assert.equal(prepared.status, 200);
    const ticket = prepared.value,
      startedAt = new Date().toISOString();
    if (transport === 'local')
      await execute(process.execPath, ['--check', f.file], { timeout: 5000 });
    const result = {
      runId: ticket.runId,
      connectionId: 'coverage',
      revisionId: f.revisionId,
      fingerprint: ticket.fingerprint,
      tool: ticket.tool,
      source: {
        kind: `host-${transport}`,
        ...(transport === 'mcp' ? { toolName: 'fixture_tool' } : {}),
      },
      startedAt,
      finishedAt: new Date().toISOString(),
      status: transport === 'local' ? 'passed' : 'blocked',
      observed:
        transport === 'local'
          ? 'Node actually accepted the fixture syntax.'
          : 'Protocol fixture only; no external provider or tools call was performed.',
      findings: [],
      metrics: transport === 'local' ? { exitCode: 0, files: 1 } : { externalCalls: 0 },
      limits: [
        'No application behavior or external provider integration established by this fixture.',
      ],
    };
    assert.equal((await f.post('results', result)).status, 403);
    assert.equal(
      (await f.post('results', { ...result, fingerprint: '0'.repeat(64) }, true)).status,
      409,
    );
    assert.equal(
      (
        await f.post(
          'results',
          { ...result, source: { kind: transport === 'local' ? 'host-api' : 'host-local' } },
          true,
        )
      ).status,
      400,
    );
    assert.equal(
      (await f.post('results', { ...result, status: undefined, isError: false }, true)).status,
      400,
    );
    if (transport === 'mcp')
      assert.equal(
        (
          await f.post(
            'results',
            { ...result, source: { kind: 'host-mcp', toolName: 'unobserved' } },
            true,
          )
        ).status,
        400,
      );
    const imported = await f.post('results', result, true);
    assert.equal(imported.status, 200);
    const check = imported.value.checks.find((entry) => entry.id === checkId);
    assert.equal(check.evidence.status, result.status);
    assert.equal(check.evidence.source.kind, result.source.kind);
    assert.equal(check.evidence.provider.optionId, optionId);
    assert.equal(check.evidence.provider.attestation, 'host-bridge');
    assert.equal(check.evidence.id, ticket.runId);
    assert.equal(check.evidence.toolVersion, ticket.tool.version);
    assert.equal((await f.post('results', result, true)).status, 200);
    assert.equal(fs.readdirSync(path.join(f.root, '.devmethod/quality')).length, 1);
    assert.equal(
      (await f.post('results', { ...result, observed: 'Changed receipt' }, true)).status,
      409,
    );
  });
