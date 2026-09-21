import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionInput, publicConnection } from '../scripts/studio/mcp-contract.mjs';
import { prepareConnectorGuide, readConnectorGuides } from '../scripts/studio/connector-guides.mjs';
import {
  mcpDisplayName,
  readMcpIndex,
  reconnectMcpInput,
} from '../studio-ui/src/features/mcp/model/mcp.ts';
import { guidedMcpInput } from '../studio-ui/src/features/mcp/model/guided-mcp.ts';

const readonlyURL = 'https://api.githubcopilot.com/mcp/readonly';
const standardURL = 'https://api.githubcopilot.com/mcp/';
const input = {
  optionId: 'github-mcp',
  guideVersion: 1,
  flowId: 'github-read',
  answers: { resources: ['code', 'issues', 'pull-requests'] },
};

test('GitHub preset requires a PAT and defaults to its official readonly endpoint', () => {
  assert.throws(() => connectionInput({ provider: 'github' }, []), { status: 400 });
  const { config, secret } = connectionInput(
    { provider: 'github', bearerToken: 'fixture-github-pat' },
    [],
  );
  assert.equal(config.url, readonlyURL);
  assert.equal(config.auth, 'bearer');
  assert.deepEqual(secret, { bearerToken: 'fixture-github-pat' });
  for (const unsupported of [
    { auth: 'oauth' },
    { auth: 'none' },
    { url: 'https://example.test/mcp/' },
    { url: `${readonlyURL}?token=fixture` },
    { url: 'https://api.githubcopilot.com/mcp/x/all' },
  ])
    assert.throws(
      () => connectionInput({ provider: 'github', bearerToken: 'fixture', ...unsupported }, []),
      { status: 400 },
    );
});

test('GitHub reconnect retains endpoint and never borrows PAT from a broader connection', () => {
  const initial = connectionInput(
    { provider: 'github', url: standardURL, bearerToken: 'fixture-standard-pat' },
    [],
  );
  const existing = { ...initial.config, secret: initial.secret };
  assert.throws(() => connectionInput({ provider: 'github' }, [existing]), { status: 400 });
  const readonly = connectionInput({ provider: 'github', bearerToken: 'fixture-read-pat' }, [
    existing,
  ]);
  assert.notEqual(readonly.config.id, existing.id);
  assert.equal(readonly.config.url, readonlyURL);
  const reconnected = connectionInput({ provider: 'github', id: existing.id }, [existing]);
  assert.equal(reconnected.config.url, standardURL);
  assert.equal(reconnected.secret.bearerToken, 'fixture-standard-pat');
  assert.throws(
    () => connectionInput({ provider: 'github', id: existing.id, url: readonlyURL }, [existing]),
    { status: 400 },
  );
  const publicValue = publicConnection({ ...existing, version: 1, status: 'connected' });
  assert.doesNotMatch(JSON.stringify(publicValue), /fixture-standard-pat|bearerToken|secret/);
});

test('GitHub assistant guide stays separate from application API and does not grant PAT permissions', () => {
  const definitions = readConnectorGuides().guides;
  const guide = definitions.find((entry) => entry.optionId === 'github-mcp');
  assert.equal(guide.flows[0].usage, 'assistant');
  assert.equal(guide.flows[0].id, 'github-read');
  const prepared = prepareConnectorGuide(input);
  assert.equal(prepared.access, 'not-connected');
  assert.deepEqual(prepared.nativeConnection, { providerId: 'github', url: readonlyURL });
  assert.match(prepared.summary.join(' '), /ne modifient pas les droits du jeton/);
  assert.match(prepared.prerequisites.join(' '), /dépôts/);
  assert.match(prepared.prerequisites.join(' '), /expiration/);
  const write = prepareConnectorGuide({ ...input, flowId: 'github-write' });
  assert.equal(write.nativeConnection.url, standardURL);
  assert.notEqual(write.setupFingerprint, prepared.setupFingerprint);
  assert.throws(() => prepareConnectorGuide({ ...input, optionId: 'github' }), { status: 400 });
  assert.throws(
    () =>
      prepareConnectorGuide({ ...input, answers: { ...input.answers, bearerToken: 'fixture' } }),
    { status: 400 },
  );
  assert.throws(() => prepareConnectorGuide({ ...input, answers: { resources: ['admin'] } }), {
    status: 400,
  });
});

test('frontend GitHub model keeps the native PAT flow and labels readonly versus standard', () => {
  const preset = {
    id: 'github',
    name: 'GitHub',
    url: readonlyURL,
    auth: 'bearer',
    docs: 'https://github.com/github/github-mcp-server',
  };
  const connection = {
    id: 'github-fixture',
    name: 'GitHub',
    provider: 'github',
    url: readonlyURL,
    auth: 'bearer',
    status: 'connected',
    tools: [],
  };
  const result = readMcpIndex({ presets: [preset], connections: [connection] });
  assert.equal(result.presets[0].auth, 'bearer');
  assert.match(mcpDisplayName(result.connections[0], 'fr'), /lecture seule/);
  assert.match(mcpDisplayName({ ...connection, url: standardURL }, 'fr'), /accès standard/);
  assert.deepEqual(reconnectMcpInput(connection), {
    id: connection.id,
    provider: 'github',
    url: readonlyURL,
    auth: 'bearer',
  });
  assert.deepEqual(guidedMcpInput(prepareConnectorGuide(input)), {
    provider: 'github',
    url: readonlyURL,
    auth: 'bearer',
  });
  assert.throws(() =>
    guidedMcpInput({ nativeConnection: { providerId: 'github', url: 'https://example.test' } }),
  );
});
