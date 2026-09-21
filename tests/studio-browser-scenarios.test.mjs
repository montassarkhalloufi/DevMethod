import test from 'node:test';
import assert from 'node:assert/strict';
import { digest } from '../scripts/studio/files.mjs';
import {
  readBrowserScenarios,
  substituteBrowserNonce,
} from '../scripts/studio/browser-scenarios.mjs';

const scenario = () => ({
  id: 'save',
  title: 'Conserver une saisie',
  criterionIds: ['persistence'],
  steps: [{ action: 'expectVisible', target: { role: 'button', name: 'Save' } }],
});
const manifest = () => ({ schemaVersion: 1, scenarios: [scenario()] });

function snapshot(value) {
  const contents = Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
  return { files: [{ path: 'devmethod.browser.json', contents, sha256: digest(contents) }] };
}

test('browser protocol reads exact captured JSON and all supported bounded steps', () => {
  const value = manifest();
  value.scenarios[0].steps.push(
    { action: 'fill', target: { testId: 'name' }, value: '{{nonce}}' },
    { action: 'click', target: { role: 'button', name: 'Save' } },
    { action: 'expectText', target: { testId: 'result' }, text: 'Saved' },
    { action: 'expectValue', target: { testId: 'name' }, value: '{{nonce}}' },
    { action: 'reload' },
    { action: 'restart' },
    { action: 'expectData', path: ['rows', 0, 'name'], expected: { value: '{{nonce}}' } },
  );
  const read = readBrowserScenarios(snapshot(value));
  assert.equal(read.schemaVersion, 1);
  assert.equal(read.protocol, 'studio-browser-v1');
  assert.deepEqual(read.scenarios, value.scenarios);
  assert.match(read.manifestFingerprint, /^[a-f0-9]{64}$/);
});

test('browser protocol rejects absent, malformed, altered and executable/unbounded inputs', () => {
  assert.throws(() => readBrowserScenarios({ files: [] }), /Ajoutez/);
  assert.throws(() => readBrowserScenarios(snapshot('{secret')), /invalide/);
  const altered = snapshot(manifest());
  altered.files[0].contents = Buffer.from('{}');
  assert.throws(() => readBrowserScenarios(altered), /invalide/);
  const mutations = [
    (m) => {
      m.command = 'node arbitrary.js';
    },
    (m) => {
      m.scenarios[0].steps = [{ action: 'evaluate', code: 'process.env' }];
    },
    (m) => {
      m.scenarios[0].steps[0].target = { css: 'button' };
    },
    (m) => {
      m.scenarios[0].steps[0].target.name = ['Save'];
    },
    (m) => {
      m.scenarios[0].steps = [{ action: 'reload' }];
    },
    (m) => {
      m.scenarios.push(scenario());
    },
    (m) => {
      m.scenarios = Array.from({ length: 7 }, (_, i) => ({ ...scenario(), id: 's' + i }));
    },
    (m) => {
      m.scenarios[0].steps = Array.from({ length: 81 }, () => scenario().steps[0]);
    },
    (m) => {
      m.scenarios = ['a', 'b'].map((id) => ({
        ...scenario(),
        id,
        steps: Array.from({ length: 41 }, () => scenario().steps[0]),
      }));
    },
    (m) => {
      m.scenarios[0].steps = [{ action: 'expectData', path: ['__proto__'], expected: null }];
    },
    (m) => {
      m.scenarios[0].steps = [{ action: 'expectData', path: [], expected: 'x'.repeat(17000) }];
    },
    (m) => {
      m.scenarios[0].steps = [{ action: 'expectData', path: [], expected: [[[[[[[[[[0]]]]]]]]]] }];
    },
  ];
  for (const mutate of mutations) {
    const m = manifest();
    mutate(m);
    assert.throws(() => readBrowserScenarios(snapshot(m)), /invalide/);
  }
});

test('nonce substitutes values recursively without turning data into code or rewriting object keys', () => {
  const input = { '{{nonce}}': ['before-{{nonce}}', { value: '{{nonce}}' }, null, 1] };
  assert.deepEqual(substituteBrowserNonce(input, 'unique'), {
    '{{nonce}}': ['before-unique', { value: 'unique' }, null, 1],
  });
  assert.equal(input['{{nonce}}'][0], 'before-{{nonce}}');
});
