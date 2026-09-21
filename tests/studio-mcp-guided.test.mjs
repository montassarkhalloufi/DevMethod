import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionInput } from '../scripts/studio/mcp-contract.mjs';

const readonlyURL = 'https://mcp.linear.app/mcp/readonly';
test('Linear readonly remains readonly on reconnect and does not borrow a broader grant', () => {
  const write = connectionInput({ provider: 'linear' }, []).config;
  const existing = { ...write, secret: { accessToken: 'fixture-write-token' } };
  const read = connectionInput({ provider: 'linear', url: readonlyURL }, [existing]);
  assert.equal(read.config.url, readonlyURL);
  assert.notEqual(read.config.id, existing.id);
  assert.deepEqual(read.secret, {});
  const reconnect = connectionInput({ provider: 'linear', id: read.config.id }, [read.config]);
  assert.equal(reconnect.config.url, readonlyURL);
  assert.throws(() =>
    connectionInput({ provider: 'linear', url: 'https://other.example/mcp' }, []),
  );
  assert.throws(() => connectionInput({ provider: 'notion', url: readonlyURL }, []));
});
