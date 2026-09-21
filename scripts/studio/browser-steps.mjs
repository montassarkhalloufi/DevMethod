import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { substituteBrowserNonce } from './browser-scenarios.mjs';

const normalized = (text) => text.replace(/\s+/g, ' ').trim();

function locate(page, target) {
  return target.testId !== undefined
    ? page.getByTestId(target.testId)
    : page.getByRole(target.role, { name: target.name, exact: true });
}

function dataAt(dataFile, keys) {
  const stat = fs.lstatSync(dataFile);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024)
    throw new Error('Données de recette illisibles.');
  let value = JSON.parse(fs.readFileSync(dataFile, 'utf8')).data;
  for (const key of keys) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = value[key];
  }
  return value;
}

async function assertEventually(read, expected, { remaining, guard, signal }) {
  const deadline = Date.now() + Math.min(5000, remaining());
  for (;;) {
    guard();
    if (isDeepStrictEqual(await read(), expected)) return;
    if (Date.now() >= deadline) throw new Error('L’assertion ne correspond pas à l’état observé.');
    await delay(Math.min(50, deadline - Date.now()), undefined, { signal });
  }
}

export async function executeBrowserStep(step, runtime, nonce, execution) {
  const { remaining, guard } = execution;
  guard();
  const options = { timeout: Math.min(5000, remaining()) };
  const target = step.target
    ? locate(runtime.page, substituteBrowserNonce(step.target, nonce))
    : null;
  const value = substituteBrowserNonce(step.value, nonce);
  switch (step.action) {
    case 'fill':
      await target.fill(value, options);
      break;
    case 'click':
      await target.click(options);
      break;
    case 'expectVisible':
      await target.waitFor({ state: 'visible', ...options });
      break;
    case 'expectText':
      await assertEventually(
        async () => normalized((await target.textContent(options)) ?? ''),
        normalized(substituteBrowserNonce(step.text, nonce)),
        execution,
      );
      break;
    case 'expectValue':
      await assertEventually(() => target.inputValue(options), value, execution);
      break;
    case 'reload':
      await runtime.page.reload({ waitUntil: 'load', timeout: Math.min(10000, remaining()) });
      break;
    case 'restart':
      await runtime.restart();
      break;
    case 'expectData':
      await assertEventually(
        () => dataAt(runtime.dataFile, step.path),
        substituteBrowserNonce(step.expected, nonce),
        execution,
      );
      break;
    default:
      throw new Error('Étape inconnue.');
  }
  guard();
}
