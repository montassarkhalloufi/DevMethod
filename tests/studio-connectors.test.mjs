import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';
import { checkJavaScript } from '../scripts/studio/verify.mjs';
import {
  readProjectConnectors,
  configureProjectConnector,
  reportConnectorProbe,
  prepareConnectorIntegration,
  prepareExternalQualityRun,
} from '../scripts/studio/connectors.mjs';
import { importExternalQualityResult, readProjectQuality } from '../scripts/studio/quality.mjs';
import { connectorCapabilities, connectorOptions } from '../scripts/studio/connectors-catalog.mjs';
import { qualityCatalog } from '../scripts/studio/quality-catalog.mjs';

async function fixture(t, source = 'const broken = ;') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'studio-connectors-')));
  const store = createStudioStore(root),
    jobs = createJobs(store);
  store.commit(store.read().version, (state) =>
    updateProject(state, {
      name: 'Fixture',
      idea: 'Local checks',
      mode: 'delegated',
      constraints: [],
    }),
  );
  const deliver = async (content) => {
    store.commit(store.read().version, (state) =>
      queueRequest(state, { request: 'Local fixture' }),
    );
    const claim = jobs.claim('Fixture');
    fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Fixture</h1>');
    fs.writeFileSync(path.join(claim.workDirectory, 'main.js'), content);
    return (
      await jobs.finish({ jobId: claim.job.id, title: 'Fixture', summary: 'Real file fixture' })
    ).revision.id;
  };
  const revisionId = await deliver(source);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    store,
    root,
    revisionId,
    deliver,
    file: path.join(root, 'revisions', revisionId, 'app/main.js'),
  };
}

function configured(f, optionId = 'node-check', purpose = 'diagnostics') {
  const report = configureProjectConnector(f.store, {
    id: 'tool-1',
    optionId,
    purpose,
    profileRef: 'host:fixture',
    secretRefs: ['env:FIXTURE_ACCESS'],
  });
  return report.connections[0];
}

function probe(f, overrides = {}) {
  const input = {
    connectionId: 'tool-1',
    connectionVersion: 1,
    eventId: 'probe-1',
    status: 'available',
    tool: { name: 'Node.js', version: process.versions.node },
    capabilities: ['code-quality'],
    observedAt: new Date().toISOString(),
    ...overrides,
  };
  reportConnectorProbe(f.store, input);
  return input;
}

function ticket(f, overrides = {}) {
  return prepareExternalQualityRun(f.store, {
    connectionId: 'tool-1',
    revisionId: f.revisionId,
    checkId: 'source-syntax',
    ...overrides,
  });
}

function result(ticket, overrides = {}) {
  return {
    runId: ticket.runId,
    connectionId: ticket.connectionId,
    revisionId: ticket.revisionId,
    fingerprint: ticket.fingerprint,
    tool: ticket.tool,
    source: { kind: 'host-local' },
    startedAt: ticket.admittedAt,
    finishedAt: new Date().toISOString(),
    status: 'passed',
    observed: 'Contrôle local exécuté.',
    findings: [],
    metrics: { files: 1 },
    ...overrides,
  };
}

test('catalogue offers diagnostic tools and independent application providers without claiming connection', async (t) => {
  const f = await fixture(t),
    version = f.store.read().version;
  const report = readProjectConnectors(f.store, f.revisionId);
  assert.deepEqual(report.connections, []);
  const mailOptions = report.catalog.options
    .filter((option) => option.capabilities.includes('mail'))
    .map((option) => option.id);
  for (const id of ['smtp', 'mailpit', 'resend', 'brevo', 'gmail'])
    assert.ok(mailOptions.includes(id));
  assert.ok(report.catalog.options.some((option) => option.id === 'postgresql'));
  assert.ok(report.catalog.options.some((option) => option.id === 'supabase'));
  assert.ok(report.catalog.options.some((option) => option.id === 'appwrite'));
  assert.ok(report.catalog.options.every((option) => option.docs.startsWith('https://')));
  assert.equal(f.store.read().version, version);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/connectors.json')), false);
});

test('curated catalogue covers common project capabilities with consistent bridge-only metadata', () => {
  const expected = {
    payments: ['stripe', 'paddle'],
    commerce: ['shopify', 'woocommerce'],
    storage: ['s3', 'cloudflare-r2'],
    ai: ['openai', 'anthropic', 'gemini', 'ollama'],
    'version-control': ['github', 'gitlab'],
    cms: ['strapi', 'directus', 'contentful', 'sanity'],
    messaging: ['slack', 'discord', 'telegram', 'twilio', 'gmail', 'brevo'],
    productivity: ['notion', 'airtable', 'google-calendar'],
    analytics: ['posthog', 'matomo', 'google-analytics'],
    search: ['meilisearch', 'algolia'],
    hosting: ['cloudflare-workers', 'vercel', 'netlify'],
  };
  for (const [capability, options] of Object.entries(expected)) {
    for (const id of options) {
      const item = connectorOptions.find((entry) => entry.id === id);
      assert.ok(item?.capabilities.includes(capability), `${id} offers ${capability}`);
      assert.equal(item.purpose, 'application');
    }
  }
  assert.equal(new Set(connectorOptions.map((entry) => entry.id)).size, connectorOptions.length);
  assert.equal(
    new Set(connectorCapabilities.map((entry) => entry.id)).size,
    connectorCapabilities.length,
  );
  const checks = new Set(qualityCatalog.map((entry) => entry.id));
  for (const option of connectorOptions) {
    const documentation = new URL(option.docs);
    assert.equal(documentation.protocol, 'https:');
    assert.equal(documentation.username + documentation.password, '');
    assert.ok(option.description && option.cost && option.limits.length);
    for (const id of option.capabilities)
      assert.equal(connectorCapabilities.find((entry) => entry.id === id)?.purpose, option.purpose);
    for (const id of option.checkIds) assert.ok(checks.has(id), `${option.id}: known check ${id}`);
    if (option.purpose === 'application') {
      assert.deepEqual(option.checkIds, []);
      assert.ok(
        option.limits.some((limit) => limit.includes('Préparation d’intégration uniquement')),
      );
    }
  }
});

test('every catalogue option can be configured and application capabilities prepare without external execution', async (t) => {
  const f = await fixture(t, 'const valid = 1;'),
    originalVersion = f.store.read().version,
    originalSource = fs.readFileSync(f.file);
  let expectedVersion = 0;
  for (const option of connectorOptions) {
    const report = configureProjectConnector(f.store, {
      id: 'catalogue-fixture',
      optionId: option.id,
      purpose: option.purpose,
      profileRef: 'host:catalogue-fixture',
      secretRefs: ['env:CATALOGUE_FIXTURE_ACCESS'],
      expectedVersion,
    });
    expectedVersion++;
    const connection = report.connections[0];
    assert.equal(connection.status, 'configured');
    assert.equal(connection.probe, null);
    if (option.purpose !== 'application') continue;
    for (const capability of option.capabilities) {
      const prepared = prepareConnectorIntegration(f.store, {
        connectionId: connection.id,
        revisionId: f.revisionId,
        capability,
      });
      assert.equal(prepared.kind, 'integrate');
      assert.equal(prepared.revisionId, f.revisionId);
      assert.equal(prepared.capability, capability);
      assert.ok(prepared.prompt.includes(option.docs));
      assert.match(prepared.prompt, /n’autorise ni provisionnement/);
    }
  }
  assert.equal(f.store.read().version, originalVersion);
  assert.deepEqual(fs.readFileSync(f.file), originalSource);
  assert.equal(readProjectConnectors(f.store).connections.length, 1);
});

test('configuration preserves secret references only and stale changes cannot overwrite it', async (t) => {
  const f = await fixture(t),
    version = f.store.read().version;
  const connection = configured(f);
  assert.equal(connection.status, 'configured');
  assert.equal(connection.probe, null);
  assert.equal(f.store.read().version, version);
  assert.throws(
    () =>
      configureProjectConnector(f.store, {
        id: 'tool-1',
        optionId: 'eslint',
        purpose: 'diagnostics',
      }),
    /Configuration modifiée/,
  );
  assert.throws(
    () =>
      configureProjectConnector(f.store, {
        id: 'private',
        optionId: 'resend',
        purpose: 'application',
        apiKey: 'private',
      }),
    /champ inconnu/,
  );
  assert.throws(
    () =>
      configureProjectConnector(f.store, {
        id: 'private',
        optionId: 'resend',
        purpose: 'application',
        secretRefs: ['sk_live_' + 'x'.repeat(30)],
      }),
    /Référence attendue/,
  );
  assert.throws(
    () =>
      configureProjectConnector(f.store, {
        id: 'private',
        optionId: 'resend',
        purpose: 'application',
        profileRef: 'host:sk_live_' + 'x'.repeat(30),
      }),
    /sensible/,
  );
  const data = fs.readFileSync(path.join(f.root, '.devmethod/connectors.json'), 'utf8');
  assert.doesNotMatch(data, /sk_live|apiKey/);
  assert.match(data, /env:FIXTURE_ACCESS/);
});

test('MCP probe records an authenticated-host declaration and schema digests, never a check result', async (t) => {
  const f = await fixture(t);
  const checksBeforeProbe = f.store.read().checks;
  configured(f, 'playwright-mcp');
  probe(f, {
    tool: { name: 'Playwright MCP', version: 'fixture' },
    capabilities: ['browser-testing'],
    tools: [
      {
        name: 'browser_snapshot',
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
      },
    ],
  });
  const connection = readProjectConnectors(f.store).connections[0];
  assert.equal(connection.status, 'attested');
  assert.equal(connection.probe.tools[0].inputSchemaFingerprint.length, 64);
  assert.equal(connection.probe.tools[0].inputSchema, undefined);
  assert.deepEqual(f.store.read().checks, checksBeforeProbe);
  assert.throws(() => probe(f, { eventId: 'bad', capabilities: ['mail'] }), /Capacité invalide/);
  assert.throws(
    () => probe(f, { eventId: 'bad', capabilities: ['browser-testing'], tools: [] }),
    /manquants/,
  );
});

test('a late older probe cannot replace the newest observed connection state', async (t) => {
  const f = await fixture(t);
  configured(f);
  const first = probe(f);
  const second = probe(f, {
    eventId: 'probe-2',
    status: 'failed',
    observedAt: new Date(Date.parse(first.observedAt) + 1000).toISOString(),
  });
  assert.throws(
    () => probe(f, { eventId: 'probe-old', observedAt: first.observedAt }),
    /ancien|antérieur/,
  );
  reportConnectorProbe(f.store, second);
  assert.equal(readProjectConnectors(f.store).connections[0].status, 'failed');
});

test('probe replay is idempotent, conflicting replay fails, and config changes invalidate it', async (t) => {
  const f = await fixture(t);
  configured(f);
  const input = probe(f),
    file = path.join(f.root, '.devmethod/connectors.json');
  const bytes = fs.readFileSync(file);
  reportConnectorProbe(f.store, input);
  assert.deepEqual(fs.readFileSync(file), bytes);
  assert.throws(() => reportConnectorProbe(f.store, { ...input, status: 'failed' }), /Rejeu/);
  configureProjectConnector(f.store, {
    id: 'tool-1',
    optionId: 'node-check',
    purpose: 'diagnostics',
    expectedVersion: 1,
  });
  assert.equal(readProjectConnectors(f.store).connections[0].status, 'configured');
  assert.throws(() => probe(f, { eventId: 'old-config' }), /ancienne configuration/);
});

test('tickets require an applicable attested tool and do not execute or register success', async (t) => {
  const f = await fixture(t);
  configured(f);
  assert.throws(() => ticket(f), /probe/);
  probe(f);
  assert.throws(() => ticket(f, { checkId: 'end-to-end' }), /ne prend pas en charge/);
  const admitted = ticket(f);
  assert.equal(Date.parse(admitted.expiresAt) - Date.parse(admitted.admittedAt), 1800000);
  assert.equal(admitted.fingerprint, readProjectQuality(f.store, f.revisionId).fingerprint);
  assert.match(admitted.prompt, /succès de transport/);
  assert.equal(
    readProjectQuality(f.store, f.revisionId).checks.find((check) => check.id === 'source-syntax')
      .status,
    'notrun',
  );
});

test('a real local Node diagnostic returns through the bridge with version, metrics and correction details', async (t) => {
  const f = await fixture(t);
  configured(f);
  probe(f);
  const admitted = ticket(f),
    start = new Date().toISOString();
  const measured = await checkJavaScript(f.file);
  assert.notEqual(measured.code, 0);
  const input = result(admitted, {
    startedAt: start,
    status: 'failed',
    observed: 'Le parseur Node a refusé la syntaxe.',
    findings: [
      { message: 'Syntaxe JavaScript invalide.', source: { path: 'main.js', line: measured.line } },
    ],
    metrics: { exitCode: measured.code, files: 1 },
  });
  const report = importExternalQualityResult(f.store, input);
  const evidence = report.checks.find((check) => check.id === 'source-syntax').evidence;
  assert.equal(evidence.status, 'failed');
  assert.equal(evidence.id, admitted.runId);
  assert.equal(evidence.toolVersion, process.versions.node);
  assert.equal(evidence.provider.attestation, 'host-bridge');
  assert.equal(evidence.source.kind, 'host-local');
  assert.equal(evidence.findings[0].source.path, 'main.js');
  assert.equal(evidence.metrics.exitCode, measured.code);
  assert.match(evidence.limits.join(' '), /pas l’exécution distante/);
  importExternalQualityResult(f.store, input);
  assert.equal(fs.readdirSync(path.join(f.root, '.devmethod/quality')).length, 1);
  assert.throws(
    () => importExternalQualityResult(f.store, { ...input, observed: 'Different receipt' }),
    /autre contenu/,
  );
});

test('external success requires explicit status and rejects secrets, foreign files and conflicting findings', async (t) => {
  const f = await fixture(t, 'export const valid = 1;');
  configured(f);
  probe(f);
  const admitted = ticket(f),
    input = result(admitted);
  const missing = { ...input };
  delete missing.status;
  assert.throws(() => importExternalQualityResult(f.store, missing), /Résultat du contrôle/);
  assert.throws(
    () => importExternalQualityResult(f.store, { ...missing, isError: false }),
    /champ inconnu/,
  );
  assert.throws(
    () => importExternalQualityResult(f.store, { ...input, observed: 'ghp_' + 'x'.repeat(36) }),
    /sensible/,
  );
  assert.throws(
    () =>
      importExternalQualityResult(f.store, {
        ...input,
        status: 'failed',
        findings: [{ message: 'Invalid', source: { path: '../outside.js' } }],
      }),
    /Chemin/,
  );
  assert.throws(
    () =>
      importExternalQualityResult(f.store, {
        ...input,
        status: 'failed',
        findings: [{ message: 'Invalid', source: { path: 'absent.js' } }],
      }),
    /absent/,
  );
  assert.throws(
    () =>
      importExternalQualityResult(f.store, {
        ...input,
        findings: [{ message: 'Unresolved', target: 'Page de connexion' }],
      }),
    /diagnostics non résolus/,
  );
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/quality')), false);
});

test('results reject outdated snapshots, connections, tools and late timestamps', async (t) => {
  const f = await fixture(t);
  configured(f);
  probe(f);
  const admitted = ticket(f),
    input = result(admitted);
  assert.throws(
    () => importExternalQualityResult(f.store, { ...input, fingerprint: 'a'.repeat(64) }),
    /empreinte/,
  );
  assert.throws(
    () =>
      importExternalQualityResult(f.store, {
        ...input,
        tool: { name: 'Node.js', version: 'wrong' },
      }),
    /Outil ou version/,
  );
  assert.throws(
    () =>
      importExternalQualityResult(f.store, {
        ...input,
        finishedAt: new Date(Date.parse(admitted.expiresAt) + 1).toISOString(),
      }),
    /Horodatages/,
  );
  configureProjectConnector(f.store, {
    id: 'tool-1',
    optionId: 'node-check',
    purpose: 'diagnostics',
    expectedVersion: 1,
  });
  probe(f, { eventId: 'probe-2', connectionVersion: 2 });
  assert.throws(() => importExternalQualityResult(f.store, input), /Configuration ou probe/);
  const next = ticket(f);
  await f.deliver('export const changed = 2;');
  assert.throws(
    () => importExternalQualityResult(f.store, result(next)),
    /Version appliquée modifiée/,
  );
});

test('application connectors prepare a revision-bound integration without sending, provisioning or jobs', async (t) => {
  const f = await fixture(t, 'const valid = 1;');
  configured(f, 'resend', 'application');
  const state = f.store.read();
  const request = prepareConnectorIntegration(f.store, {
    connectionId: 'tool-1',
    revisionId: f.revisionId,
    capability: 'mail',
  });
  assert.equal(request.kind, 'integrate');
  assert.equal(request.revisionId, f.revisionId);
  assert.match(request.prompt, /n’autorise ni provisionnement/);
  assert.match(request.prompt, /Ne pas simuler un service absent/);
  assert.deepEqual(f.store.read(), state);
  assert.throws(
    () =>
      prepareConnectorIntegration(f.store, {
        connectionId: 'tool-1',
        revisionId: f.revisionId,
        capability: 'database',
      }),
    /Capacité invalide/,
  );
  assert.throws(() => ticket(f), /ne prend pas en charge/);
});

test('probe and result text reject credential-bearing URLs without persisting their values', async (t) => {
  const f = await fixture(t);
  configured(f);
  const value = 'https://review-user:sentinel-password@invalid.test/path';
  assert.throws(() => probe(f, { summary: value }), /sensible/);
  assert.doesNotMatch(
    fs.readFileSync(path.join(f.root, '.devmethod/connectors.json'), 'utf8'),
    /sentinel-password/,
  );
  probe(f);
  const admitted = ticket(f);
  assert.throws(
    () => importExternalQualityResult(f.store, result(admitted, { observed: value })),
    /sensible/,
  );
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/quality')), false);
});

test('changed connector configuration makes its retained quality evidence reevaluable', async (t) => {
  const f = await fixture(t, 'export const valid = 1;');
  configured(f);
  probe(f);
  const admitted = ticket(f);
  importExternalQualityResult(f.store, result(admitted));
  const check = () =>
    readProjectQuality(f.store, f.revisionId).checks.find((entry) => entry.id === 'source-syntax');
  assert.equal(check().freshness, 'current');
  probe(f, { eventId: 'same-configuration-new-probe' });
  assert.equal(check().freshness, 'current');
  configureProjectConnector(f.store, {
    id: 'tool-1',
    optionId: 'node-check',
    purpose: 'diagnostics',
    expectedVersion: 1,
    profileRef: 'host:different-environment',
  });
  assert.equal(check().freshness, 'reevaluate');
  assert.equal(check().evidence.id, admitted.runId);
});

test('expired execution tickets reject new results without producing quality evidence', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-09-17T12:00:00.000Z') });
  const f = await fixture(t);
  configured(f);
  probe(f);
  const admitted = ticket(f),
    input = result(admitted);
  t.mock.timers.tick(1800001);
  assert.throws(() => importExternalQualityResult(f.store, input), /expiré/);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/quality')), false);
});

test('changed source bytes reject an external receipt even when its supplied fingerprint matches the ticket', async (t) => {
  const f = await fixture(t);
  configured(f);
  probe(f);
  const admitted = ticket(f);
  fs.appendFileSync(f.file, '\nexport const changed = 2;');
  assert.throws(() => importExternalQualityResult(f.store, result(admitted)), /diffèrent/);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/quality')), false);
});

test('MCP returns must name an observed tool and keep blocked browser findings distinct from success', async (t) => {
  const f = await fixture(t);
  configured(f, 'playwright-mcp');
  probe(f, {
    tool: { name: 'Playwright MCP', version: 'fixture' },
    capabilities: ['browser-testing'],
    tools: [{ name: 'browser_snapshot', outputSchema: { type: 'object' } }],
  });
  const admitted = ticket(f, { checkId: 'end-to-end' });
  const input = result(admitted, {
    source: { kind: 'host-mcp', toolName: 'browser_snapshot' },
    status: 'blocked',
    observed: 'La fixture ne constitue pas un parcours applicatif complet.',
    findings: [{ message: 'Scénario à définir.', target: 'Page principale' }],
  });
  assert.throws(
    () =>
      importExternalQualityResult(f.store, {
        ...input,
        source: { kind: 'host-mcp', toolName: 'invented' },
      }),
    /non attesté/,
  );
  const report = importExternalQualityResult(f.store, input);
  const check = report.checks.find((entry) => entry.id === 'end-to-end');
  assert.equal(check.status, 'blocked');
  assert.equal(check.evidence.findings[0].source, undefined);
  assert.equal(check.evidence.findings[0].target, 'Page principale');
  assert.equal(check.canRun, false);
});

test('oversized receipts and corrupt connector registers fail without overwriting persisted data', async (t) => {
  const f = await fixture(t);
  configured(f);
  probe(f);
  const admitted = ticket(f);
  const big = result(admitted, {
    status: 'failed',
    findings: Array.from({ length: 100 }, () => ({ message: 'a'.repeat(1000), target: 'Page' })),
  });
  assert.throws(() => importExternalQualityResult(f.store, big), /64 Kio/);
  const file = path.join(f.root, '.devmethod/connectors.json');
  fs.writeFileSync(file, '{broken');
  assert.throws(() => readProjectConnectors(f.store), /illisible/);
  assert.throws(() => configured(f), /illisible/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
});

test('MCP interface changes invalidate dependent evidence while equivalent probes preserve it', async (t) => {
  const f = await fixture(t);
  configured(f, 'playwright-mcp');
  const fields = {
    tool: { name: 'Playwright MCP', version: 'fixture' },
    capabilities: ['browser-testing'],
    tools: [{ name: 'browser_snapshot', outputSchema: { type: 'object' } }],
  };
  probe(f, fields);
  const admitted = ticket(f, { checkId: 'end-to-end' });
  importExternalQualityResult(
    f.store,
    result(admitted, {
      source: { kind: 'host-mcp', toolName: 'browser_snapshot' },
      status: 'blocked',
      observed: 'Scénario de fixture incomplet.',
    }),
  );
  const check = () =>
    readProjectQuality(f.store, f.revisionId).checks.find((entry) => entry.id === 'end-to-end');
  probe(f, { ...fields, eventId: 'equivalent-interface' });
  assert.equal(check().freshness, 'current');
  probe(f, {
    ...fields,
    eventId: 'different-interface',
    tools: [{ name: 'browser_snapshot', outputSchema: { type: 'object', required: ['newField'] } }],
  });
  assert.equal(check().freshness, 'reevaluate');
});

test('a selected inactive revision can be checked without validating the applied revision', async (t) => {
  const f = await fixture(t, 'export const selected = 1;');
  configured(f);
  probe(f);
  const active = await f.deliver('export const applied = 2;');
  const admitted = ticket(f);
  assert.equal(admitted.revisionId, f.revisionId);
  assert.equal(admitted.activeRevision, active);
  const report = importExternalQualityResult(f.store, result(admitted));
  assert.equal(report.revisionId, f.revisionId);
  assert.equal(report.checks.find((entry) => entry.id === 'source-syntax').status, 'passed');
  assert.equal(
    readProjectQuality(f.store, active).checks.find((entry) => entry.id === 'source-syntax').status,
    'notrun',
  );
  const second = ticket(f);
  await f.deliver('export const changedAgain = 3;');
  assert.throws(
    () => importExternalQualityResult(f.store, result(second)),
    /Version appliquée modifiée/,
  );
});

async function businessFixture(t) {
  const f = await fixture(t, 'export const valid = true;');
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria = [{ id: 'draft', text: 'Conserver le brouillon après erreur.' }];
  });
  configured(f, 'diagnostic-api');
  probe(f, { capabilities: ['browser-testing', 'code-quality'] });
  return f;
}

test('business tickets capture exact criteria and reject a changed brief without claiming success', async (t) => {
  const f = await businessFixture(t);
  const admitted = ticket(f, { checkId: 'business-journey' });
  assert.deepEqual(admitted.businessCriteria.criteria, f.store.read().brief.criteria);
  assert.match(admitted.businessCriteria.fingerprint, /^[a-f0-9]{64}$/);
  assert.match(admitted.prompt, /Conserver le brouillon après erreur/);
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria = [
      { id: 'notify', text: 'Notifier deux destinataires après validation.' },
    ];
  });
  assert.throws(
    () => importExternalQualityResult(f.store, result(admitted, { source: { kind: 'host-api' } })),
    /Critères métier modifiés/,
  );
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/quality')), false);
});

test('changed business criteria invalidate only dependent evidence and preserve the recorded objective', async (t) => {
  const f = await businessFixture(t);
  const admitted = ticket(f, { checkId: 'business-journey' });
  const input = result(admitted, { source: { kind: 'host-api' } });
  importExternalQualityResult(f.store, input);
  importExternalQualityResult(f.store, result(ticket(f), { source: { kind: 'host-api' } }));
  const check = (id) =>
    readProjectQuality(f.store, f.revisionId).checks.find((row) => row.id === id);
  assert.equal(check('business-journey').freshness, 'current');
  assert.deepEqual(check('business-journey').evidence.businessCriteria, admitted.businessCriteria);
  assert.match(check('business-journey').evidence.expected, /Conserver le brouillon après erreur/);
  f.store.commit(f.store.read().version, (state) => {
    state.project.name = 'Unrelated rename';
  });
  assert.equal(check('business-journey').freshness, 'current');
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria[0].text = 'Notifier deux destinataires après validation.';
  });
  assert.equal(check('business-journey').freshness, 'reevaluate');
  assert.match(check('business-journey').evidence.expected, /Conserver le brouillon après erreur/);
  assert.equal(check('source-syntax').freshness, 'current');
  const replay = importExternalQualityResult(f.store, input);
  assert.equal(replay.checks.find((row) => row.id === 'business-journey').freshness, 'reevaluate');
});

test('business checks require explicit bounded criteria and old unbound records need reevaluation', async (t) => {
  const f = await businessFixture(t);
  const admitted = ticket(f, { checkId: 'business-journey' });
  const input = result(admitted, { source: { kind: 'host-api' } });
  importExternalQualityResult(f.store, input);
  const file = path.join(f.root, '.devmethod/quality', admitted.runId + '.json');
  const oldRun = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete oldRun.businessCriteria;
  fs.writeFileSync(file, JSON.stringify(oldRun));
  assert.equal(
    readProjectQuality(f.store, f.revisionId).checks.find((row) => row.id === 'business-journey')
      .freshness,
    'reevaluate',
  );
  const pending = ticket(f, { checkId: 'business-journey' });
  const ticketFile = path.join(f.root, '.devmethod/connector-executions', pending.runId + '.json');
  const oldTicket = JSON.parse(fs.readFileSync(ticketFile, 'utf8'));
  delete oldTicket.businessCriteria;
  fs.writeFileSync(ticketFile, JSON.stringify(oldTicket));
  assert.throws(
    () => importExternalQualityResult(f.store, result(pending, { source: { kind: 'host-api' } })),
    /Critères métier/,
  );
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria = [];
  });
  assert.throws(() => ticket(f, { checkId: 'business-journey' }), /critères métier/i);
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria = Array.from({ length: 10 }, (_, i) => ({
      id: 'criterion-' + i,
      text: 'x'.repeat(2000),
    }));
  });
  assert.throws(() => ticket(f, { checkId: 'business-journey' }), /Critères métier/);
  assert.equal(fs.readdirSync(path.dirname(ticketFile)).length, 2);
});
