import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import { translateAgentMessage } from '../scripts/studio/public/i18n.js';

const output = await build({
  stdin: {
    contents: `
      import {createRoot} from 'react-dom/client';
      import {AgentConfiguration} from './studio-ui/src/features/agent/components/AgentConfiguration';
      export {localizeMessage} from './studio-ui/src/features/agent/model/ui-messages';
      export {createViews} from './scripts/studio/public/views.js';
      export {mountStudio} from './scripts/studio/public/app.js';
      export {setLocale} from './scripts/studio/public/i18n.js';
      export function mountAgent(node, agent) {
        const root=createRoot(node);
        const render=value=>root.render(<AgentConfiguration agent={value} onStatus={()=>{throw new Error('No action authorized')}}/>);
        render(agent);
        return {update:render,dispose:()=>root.unmount()};
      }
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  external: ['/studio-ui/*'],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'AgentStatusFixture',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const html = await fs.readFile(
  new URL('../scripts/studio/public/index.html', import.meta.url),
  'utf8',
);

async function until(condition) {
  for (let i = 0; i < 100; i++) {
    if (condition()) return;
    await setTimeout(5);
  }
  assert.ok(condition(), 'Expected localized agent status');
}

const cases = [
  ['Disponibilité de Codex à vérifier.', 'Codex availability needs checking.', false, false],
  [
    'Accès Codex existant détecté. Les limites de cet accès restent applicables.',
    'Existing Codex access detected. Its limits still apply.',
    true,
    false,
  ],
  ['Prêt à traiter une demande locale.', 'Ready to process a local request.', true, true],
  [
    'Consommation inconnue : exécution automatique suspendue.',
    'Usage unknown: automatic execution suspended.',
    true,
    false,
  ],
  [
    'Seuil de consommation atteint : aucun nouvel appel automatique.',
    'Usage threshold reached: no new automatic call.',
    true,
    false,
  ],
  [
    'Nombre maximal de demandes atteint : aucun nouvel appel automatique.',
    'Maximum request count reached: no new automatic call.',
    true,
    false,
  ],
];

test('canonical unknown, detected, ready and suspended messages agree in shell, status and availability across EN/FR', async (t) => {
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window: w } = dom,
    document = w.document;
  document.body.removeAttribute('data-studio');
  w.structuredClone = structuredClone;
  w.fetch = async () => ({ ok: true, json: async () => ({ interactions: [], actions: [] }) });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  w.eval(output.outputFiles[0].text);
  let agent = {
    automatic: false,
    connected: false,
    running: false,
    configuring: false,
    historicalBudget: false,
    settings: {
      version: 0,
      enabled: false,
      access: null,
      maxJobs: 2,
      maxTokens: 100000,
      timeoutMs: 300000,
    },
    availability: {
      available: null,
      connected: false,
      access: 'unknown',
      version: null,
      checkedAt: null,
      message: cases[0][0],
    },
    message: cases[0][0],
  };
  const state = createInitialStudioState();
  const api = {
    state: async () => structuredClone(state),
    runtime: async () => ({
      agent: structuredClone(agent),
      previewOrigin: 'http://localhost:4331',
    }),
  };
  const app = w.AgentStatusFixture.mountStudio({ document, window: w, api, pollMs: 0 });
  const host = document.createElement('div');
  document.body.append(host);
  const panel = w.AgentStatusFixture.mountAgent(host, agent);
  t.after(() => {
    panel.dispose();
    app.destroy();
    w.close();
  });
  await app.ready;
  for (const [fr, en, connected, automatic] of cases) {
    agent = {
      ...agent,
      connected,
      automatic,
      message: fr,
      availability: {
        ...agent.availability,
        connected,
        available: connected || null,
        access: connected ? 'chatgpt' : 'unknown',
        message: fr,
      },
    };
    const saved = structuredClone(agent);
    panel.update(agent);
    await app.refresh();
    for (const [locale, expected] of [
      ['en', en],
      ['fr', fr],
    ]) {
      w.AgentStatusFixture.setLocale(locale);
      await until(() => host.querySelector('[aria-live=polite]')?.textContent === expected);
      await until(() =>
        document.querySelector('#agent-description').textContent.includes(expected),
      );
      assert.ok(
        [...host.querySelectorAll('p')].filter((node) => node.textContent === expected).length >= 2,
        'Availability and final status share projection',
      );
      if (connected && !automatic) {
        const evidence = document.createElement('div');
        evidence.append(...w.AgentStatusFixture.createViews(document).evidence(state, { agent }));
        assert.ok(
          evidence.textContent.includes(expected),
          'Suspended evidence uses the same status projection',
        );
      }
    }
    assert.deepEqual(agent, saved, 'Rendering does not modify canonical status');
  }
  const diagnostic = 'Provider fixture diagnostic: Disponibilité de Codex à vérifier.';
  agent = {
    ...agent,
    message: diagnostic,
    availability: { ...agent.availability, message: diagnostic },
  };
  panel.update(agent);
  await app.refresh();
  w.AgentStatusFixture.setLocale('en');
  await until(() => host.querySelector('[aria-live=polite]')?.textContent === diagnostic);
  assert.ok(document.querySelector('#agent-description').textContent.includes(diagnostic));
});

test('agent projection matches entire known statuses only and preserves unknown diagnostics', () => {
  for (const [fr, en] of cases) {
    assert.equal(translateAgentMessage(fr, 'en'), en);
    assert.equal(translateAgentMessage(en, 'fr'), fr);
  }
  for (const message of ['Raw provider output', '__proto__', 'Failure: ' + cases[0][0]]) {
    assert.equal(translateAgentMessage(message, 'en'), message);
    assert.equal(translateAgentMessage(message, 'fr'), message);
  }
});

test('agent UI formatter preserves prototype-named diagnostics without treating inherited properties as translations', () => {
  const dom = new JSDOM('', { runScripts: 'outside-only', url: 'http://localhost' });
  try {
    dom.window.eval(output.outputFiles[0].text);
    for (const message of ['__proto__', 'constructor', 'toString']) {
      for (const locale of ['en', 'fr'])
        assert.equal(dom.window.AgentStatusFixture.localizeMessage(message, locale), message);
    }
  } finally {
    dom.window.close();
  }
});
