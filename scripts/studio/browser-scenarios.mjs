import { createRequire } from 'node:module';
import { digest } from './files.mjs';

const require = createRequire(import.meta.url);

export const browserProtocol = 'studio-browser-v1';
const text = { type: 'string', maxLength: 2000 };
const identifier = { type: 'string', pattern: '^[A-Za-z0-9_-]{1,100}$' };
const roles =
  'alert alertdialog article banner blockquote button caption cell checkbox code columnheader combobox complementary contentinfo definition deletion dialog directory document emphasis feed figure form generic grid gridcell group heading img insertion link list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio meter navigation none note option paragraph presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status strong subscript superscript switch tab table tablist tabpanel term textbox time timer toolbar tooltip tree treegrid treeitem'.split(
    ' ',
  );
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
const target = {
  oneOf: [
    object({ role: { enum: roles }, name: { ...text, minLength: 1 } }),
    object({ testId: { ...text, minLength: 1 } }),
  ],
};
const step = (action, fields = {}) => object({ action: { const: action }, ...fields });
const schema = object({
  schemaVersion: { const: 1 },
  scenarios: {
    type: 'array',
    minItems: 1,
    maxItems: 6,
    items: object({
      id: identifier,
      title: { ...text, minLength: 1 },
      criterionIds: { type: 'array', maxItems: 30, uniqueItems: true, items: identifier },
      steps: {
        type: 'array',
        minItems: 1,
        maxItems: 80,
        items: {
          oneOf: [
            step('fill', { target, value: text }),
            step('click', { target }),
            step('expectText', { target, text }),
            step('expectValue', { target, value: text }),
            step('expectVisible', { target }),
            step('reload'),
            step('restart'),
            step('expectData', {
              path: {
                type: 'array',
                maxItems: 16,
                items: {
                  anyOf: [
                    {
                      type: 'string',
                      minLength: 1,
                      maxLength: 200,
                      not: { enum: ['__proto__', 'prototype', 'constructor'] },
                    },
                    { type: 'integer', minimum: 0, maximum: 1000000 },
                  ],
                },
              },
              expected: {},
            }),
          ],
        },
      },
    }),
  },
});
let validator;

function validate(manifest) {
  // Reading Studio state remains possible without installed analysis dependencies.
  // Validation is required only when a browser manifest is actually inspected.
  if (!validator) {
    const Ajv = require('ajv');
    validator = new Ajv({ strict: false, allErrors: false }).compile(schema);
  }
  return validator(manifest);
}

const invalid = () => {
  throw new Error('Manifeste devmethod.browser.json invalide ou hors limites.');
};

function boundedJSON(value, depth = 0) {
  if (depth > 8 || (typeof value === 'number' && !Number.isFinite(value))) invalid();
  if (typeof value === 'string' && value.length > 2000) invalid();
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length > 100) invalid();
    for (const key of keys) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) invalid();
      boundedJSON(value[key], depth + 1);
    }
  }
}

/** Reads only the captured source bytes. Absence is unavailable, never a passing check. */
export function readBrowserScenarios(snapshot) {
  if (snapshot.issue) throw new Error('Sources du candidat indisponibles ou modifiées.');
  const file = snapshot.files?.find((entry) => entry.path === 'devmethod.browser.json');
  if (!file)
    throw new Error('Ajoutez devmethod.browser.json pour décrire les assertions à exécuter.');
  const bytes = file.contents;
  if (!Buffer.isBuffer(bytes) || bytes.length > 65536 || digest(bytes) !== file.sha256) invalid();
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString('utf8'));
  } catch {
    invalid();
  }
  if (!validate(manifest)) invalid();
  const ids = new Set();
  let count = 0;
  for (const scenario of manifest.scenarios) {
    if (ids.has(scenario.id) || !scenario.steps.some((entry) => entry.action.startsWith('expect')))
      invalid();
    ids.add(scenario.id);
    count += scenario.steps.length;
    for (const entry of scenario.steps.filter((item) => item.action === 'expectData')) {
      if (Buffer.byteLength(JSON.stringify(entry.expected)) > 16384) invalid();
      boundedJSON(entry.expected);
    }
  }
  if (count > 80) invalid();
  return {
    schemaVersion: 1,
    protocol: browserProtocol,
    manifestFingerprint: digest(bytes),
    scenarios: manifest.scenarios,
  };
}

export function substituteBrowserNonce(value, nonce) {
  if (typeof value === 'string') return value.replaceAll('{{nonce}}', nonce);
  if (Array.isArray(value)) return value.map((item) => substituteBrowserNonce(item, nonce));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, substituteBrowserNonce(item, nonce)]),
    );
  return value;
}
