import { createRequire } from 'node:module';
import { runBrowserVerification } from './browser-execution.mjs';

const require = createRequire(import.meta.url);

export function runBrowserScenarios(snapshot, options = {}) {
  return runBrowserVerification(snapshot, options, async () => {
    const version = require('playwright-core/package.json').version;
    if (version !== '1.63.0') throw new Error('Version du pilote incompatible.');
    const { chromium } = await import('playwright-core');
    return { chromium, version };
  });
}
