import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {setLocale} from './studio-ui/src/i18n';
      import {CustomConnection} from './studio-ui/src/features/mcp/components/CustomConnection';
      import {McpPromptSelection} from './studio-ui/src/features/mcp/components/McpPromptSelection';
      import {connectorText, connectorMessage} from './studio-ui/src/features/connectors/model/i18n';
      import {useComposerGuides} from './studio-ui/src/features/home/hooks/useComposerGuides';
      import {useHome} from './studio-ui/src/features/home/hooks/useHome';
      import {useDecisionAction} from './studio-ui/src/features/decisions/hooks/useDecisionAction';
      import {useIdeaComposer} from './studio-ui/src/features/home/hooks/useIdeaComposer';
      import {useConnectors} from './studio-ui/src/features/connectors/hooks/useConnectors';
      import {useProjectGuide} from './studio-ui/src/features/connectors/hooks/useProjectGuide';
      const controller = {active:null, connect:()=>{ throw new Error('No provider call authorized'); }};
      export {setLocale, connectorText, connectorMessage};
      const guideInput = { optionId:'slack',guideVersion:1,flowId:'slack-bot',answers:{actions:['send-messages'],audience:'selected-public-channels'} };
      function Readers() {
        const catalog=useConnectors(null);
        const guide=useProjectGuide('slack',guideInput);
        return <><input aria-label="fixture draft" defaultValue="Texte utilisateur"/><p data-catalog>{catalog.report?.catalog.capabilities[0].title}</p><p data-guide>{guide.definition?.flows[0].title}</p><button onClick={()=>guide.prepare(guideInput)}>Prepare fixture</button><p data-preview>{guide.confirmed?.title}</p></>;
      }
      function HomeCatalog() {
        const composer=useIdeaComposer({operation:{phase:'idle'},onSubmit:()=>{throw new Error('No submission authorized')},onEdit:()=>{}});
        return <><input aria-label="idea" value={composer.draft.idea} onChange={event=>composer.setField('idea',event.target.value)}/><button data-load onClick={composer.loadCatalog}>Catalog</button><button data-select onClick={()=>composer.toggleConnector('postgresql')}>Select</button><p data-choice>{JSON.stringify(composer.draft.connectors)}</p><p data-home-catalog>{composer.catalog?.capabilities[0].title}</p></>;
      }
      function RetainedStates() {
        const guides=useComposerGuides({busy:false,selected:[],onApply:()=>true,onEdit:()=>{}});
        const home=useHome({navigate:()=>{}});
        const decision=useDecisionAction({proposalId:'fixture',baseRevision:null,draftScope:'fixture'});
        return <><button data-open onClick={()=>guides.open('slack')}>Open</button><button data-prepare onClick={()=>guides.prepare(guideInput)}>Prepare</button><p data-preview>{guides.preparation?.title}</p><button data-error onClick={()=>decision.run(async()=>{throw new Error('Ces permissions ont changé. Rechargez-les avant de réessayer.');})}>Fail locally</button><p data-error-message>{decision.error}</p><p data-load-error>{home.loadError}</p></>;
      }
      export function mountRetained(node) { const root=createRoot(node);root.render(<RetainedStates/>);return ()=>root.unmount(); }
      export function mountHomeCatalog(node) { const root=createRoot(node);root.render(<HomeCatalog/>);return ()=>root.unmount(); }
      export function mountReaders(node) { const root=createRoot(node);root.render(<Readers/>);return ()=>root.unmount(); }
      export function mount(node) {
        const root=createRoot(node);
        root.render(<><CustomConnection controller={controller} disabled={false}/>
          <McpPromptSelection connections={[{id:'fixture',name:'Nom conservé',provider:'github',url:'https://example.invalid/readonly',auth:'bearer',status:'connected',tools:[{name:'fixture.read'}]}]} selectedIds={[]} onToggle={()=>{}} onManage={()=>{}}/>
        </>);
        return () => root.unmount();
      }
    `,
    loader: 'tsx',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'LocaleConnectors',
  jsx: 'automatic',
  loader: { '.svg': 'dataurl', '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(condition) {
  for (let i = 0; i < 100; i++) {
    if (condition()) return;
    await setTimeout(5);
  }
  assert.ok(condition(), 'Expected localized connector UI');
}

function fixture(t) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.eval(bundle.outputFiles[0].text);
  const api = w.LocaleConnectors,
    node = w.document.querySelector('#root');
  const unmount = api.mount(node);
  t.after(() => {
    unmount();
    dom.window.close();
  });
  return { w, api, node };
}

test('connector forms default to English and live switching preserves user input and connection identity', async (t) => {
  const { w, api, node } = fixture(t);
  await until(() => node.textContent.includes('Add a custom server'));
  assert.match(node.textContent, /Nom conservé · read-only/);
  assert.equal(node.querySelector('[name="mcp-name"]'), null);
  [...node.querySelectorAll('button')]
    .find((button) => button.textContent.includes('Add a custom server'))
    .click();
  await until(() => node.querySelector('[name="mcp-name"]'));
  const input = node.querySelector('[name="mcp-name"]');
  input.value = 'Saisie utilisateur conservée';
  input.dispatchEvent(new w.Event('input', { bubbles: true }));
  api.setLocale('fr');
  await until(() => node.textContent.includes('Nom du serveur'));
  assert.equal(node.querySelector('[name="mcp-name"]'), input);
  assert.equal(input.value, 'Saisie utilisateur conservée');
  assert.match(node.textContent, /Nom conservé · lecture seule/);
  api.setLocale('en');
  await until(() => node.textContent.includes('Server name'));
  assert.equal(input.value, 'Saisie utilisateur conservée');
  assert.equal(node.querySelector('[name="mcp-auth"]').value, 'oauth');
});

test('an already displayed local validation error changes language without submitting again', async (t) => {
  const { w, api, node } = fixture(t);
  await until(() => node.querySelector('.mcp-add-custom'));
  node.querySelector('.mcp-add-custom').click();
  await until(() => node.querySelector('form'));
  node
    .querySelector('form')
    .dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => node.textContent.includes('Enter a name and the MCP server address.'));
  api.setLocale('fr');
  await until(() => node.textContent.includes('Indiquez un nom et l’adresse du serveur MCP.'));
  api.setLocale('en');
  await until(() => node.textContent.includes('Enter a name and the MCP server address.'));
});

test('known copy and named placeholders are localized while unknown text is preserved', (t) => {
  const { api } = fixture(t);
  assert.equal(api.connectorText('Interdire', 'en'), 'Deny');
  assert.equal(api.connectorText('Interdire', 'fr'), 'Interdire');
  assert.equal(
    api.connectorText('These permissions changed. Reload them before trying again.', 'fr'),
    'Ces permissions ont changé. Rechargez-les avant de réessayer.',
  );
  assert.equal(api.connectorText('Private user text', 'en'), 'Private user text');
  assert.equal(
    api.connectorMessage('Voir {name}', 'View {name}', 'en', { name: 'Nom conservé' }),
    'View Nom conservé',
  );
});

import {
  connectorCapabilities,
  connectorOptions,
  projectConnectorCatalog,
} from '../scripts/studio/connectors-catalog.mjs';
import {
  connectorGuideDefinitions,
  projectConnectorGuides,
} from '../scripts/studio/connector-guides-catalog.mjs';
import {
  prepareConnectorGuide,
  projectConnectorPreparation,
  validateConnectorGuideSnapshots,
} from '../scripts/studio/connector-guides.mjs';
import { readConnectorsRoute } from '../scripts/studio/connector-routes.mjs';
import { connectorGuideRoute } from '../scripts/studio/connector-guide-routes.mjs';

test('catalog projections translate presentation only and never mutate canonical catalog contracts', () => {
  const canonical = structuredClone({
    capabilities: connectorCapabilities,
    options: connectorOptions,
  });
  assert.deepEqual(projectConnectorCatalog('fr'), canonical);
  const en = projectConnectorCatalog();
  for (const [index, option] of en.options.entries()) {
    const original = canonical.options[index];
    const fields = (value) =>
      Object.fromEntries(
        Object.entries(value).filter(
          ([key]) => !['title', 'description', 'cost', 'limits'].includes(key),
        ),
      );
    const contract = fields(option);
    const originalContract = fields(original);
    assert.deepEqual(contract, originalContract);
    assert.notEqual(option.description, original.description, original.id);
    assert.notEqual(option.cost, original.cost, original.id);
    assert.equal(option.limits.length, original.limits.length, original.id);
    option.limits.forEach((text, i) => assert.notEqual(text, original.limits[i], original.id));
  }
  en.capabilities.forEach((entry, i) => {
    assert.equal(entry.id, canonical.capabilities[i].id);
    assert.equal(entry.purpose, canonical.capabilities[i].purpose);
    assert.notEqual(entry.description, canonical.capabilities[i].description);
  });
  en.options[0].checkIds.push('fixture-only');
  assert.deepEqual({ capabilities: connectorCapabilities, options: connectorOptions }, canonical);
});

test('every guide flow has an English preview while canonical fingerprint, access and authorization inputs remain unchanged', () => {
  const originals = structuredClone(connectorGuideDefinitions);
  assert.deepEqual(projectConnectorGuides('fr'), originals);
  const english = projectConnectorGuides();

  function contract(value) {
    if (Array.isArray(value)) return value.map(contract);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['title', 'description'].includes(key))
        .map(([key, item]) => [key, contract(item)]),
    );
  }

  assert.deepEqual(contract(english), contract(originals));
  for (const guide of originals)
    for (const flow of guide.flows) {
      const inputs = flow.questions.reduce(
        (answers, question) =>
          answers.flatMap((answer) =>
            (question.multiple
              ? [question.options.map((item) => item.id)]
              : question.options.map((item) => item.id)
            ).map((choice) => ({ ...answer, [question.id]: choice })),
          ),
        [{}],
      );
      for (const answers of inputs) {
        const input = { optionId: guide.optionId, guideVersion: 1, flowId: flow.id, answers };
        const canonical = prepareConnectorGuide(input);
        const saved = structuredClone(canonical);
        const display = projectConnectorPreparation(canonical);
        assert.notEqual(display.title, canonical.title);
        display.summary.forEach((text, i) =>
          assert.notEqual(text, canonical.summary[i], `${flow.id} summary ${i}`),
        );
        display.prerequisites.forEach((text, i) =>
          assert.notEqual(text, canonical.prerequisites[i], `${flow.id} prerequisite ${i}`),
        );
        assert.deepEqual(display.input, canonical.input);
        assert.deepEqual(display.nativeConnection, canonical.nativeConnection);
        assert.equal(display.access, 'not-connected');
        assert.equal(display.setupFingerprint, canonical.setupFingerprint);
        display.permissions.forEach((entry, i) => {
          assert.equal(entry.scope, canonical.permissions[i].scope);
          assert.notEqual(entry.reason, canonical.permissions[i].reason);
        });
        assert.deepEqual(canonical, saved);
        validateConnectorGuideSnapshots([canonical]);
        assert.throws(() => validateConnectorGuideSnapshots([display]), /non canonique/);
        assert.deepEqual(projectConnectorPreparation(canonical, 'fr'), canonical);
      }
    }
  assert.deepEqual(connectorGuideDefinitions, originals);
});

test('catalog and guide GET boundaries select explicit language and default to English without provider access', async () => {
  function response() {
    return {
      status: null,
      value: null,
      writeHead(status) {
        this.status = status;
      },
      end(text) {
        this.value = JSON.parse(text);
      },
    };
  }

  const store = {
    root: '/private/tmp/devmethod-i18n-no-project-fixture',
    read: () => ({ activeRevision: null, revisions: [] }),
  };
  for (const locale of [undefined, 'en', 'fr']) {
    const suffix = locale ? `?language=${locale}` : '';
    const catalog = response();
    assert.equal(
      readConnectorsRoute(new URL(`http://127.0.0.1/api/connectors${suffix}`), catalog, store),
      true,
    );
    assert.equal(catalog.status, 200);
    assert.equal(
      catalog.value.catalog.capabilities[0].title,
      locale === 'fr' ? 'Tests automatisés' : 'Automated tests',
    );
    const guides = response();
    assert.equal(
      await connectorGuideRoute(
        { method: 'GET' },
        guides,
        new URL(`http://127.0.0.1/api/connectors/guides${suffix}`),
        'http://127.0.0.1',
      ),
      true,
    );
    assert.equal(guides.status, 200);
    assert.equal(
      guides.value.guides[0].flows[0].title,
      locale === 'fr' ? 'Un bot pour l’application' : 'A bot for the application',
    );
  }
});

test('locale changes reload catalog, guide and current preview while keeping the mounted draft', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.AbortSignal = AbortSignal;
  w.AbortController = AbortController;
  const calls = [];
  w.fetch = async (path, options = {}) => {
    calls.push(path);
    const url = new URL(path, 'http://127.0.0.1');
    const locale = url.searchParams.get('language');
    assert.ok(['en', 'fr'].includes(locale));
    let value;
    if (url.pathname === '/api/connectors')
      value = {
        schemaVersion: 1,
        revisionId: null,
        catalog: projectConnectorCatalog(locale),
        connections: [],
        limits: [],
      };
    else if (url.pathname === '/api/connectors/guides')
      value = { guides: projectConnectorGuides(locale) };
    else if (url.pathname === '/api/connectors/guides/prepare')
      value = projectConnectorPreparation(prepareConnectorGuide(JSON.parse(options.body)), locale);
    else throw new Error('No provider access authorized');
    return { ok: true, json: async () => value };
  };
  w.eval(bundle.outputFiles[0].text);
  const api = w.LocaleConnectors;
  const node = w.document.querySelector('#root');
  const unmount = api.mountReaders(node);
  t.after(() => {
    unmount();
    w.close();
  });
  await until(() => node.querySelector('[data-catalog]')?.textContent === 'Automated tests');
  await until(
    () => node.querySelector('[data-guide]')?.textContent === 'A bot for the application',
  );
  const input = node.querySelector('input');
  input.value = 'Brouillon conservé';
  node.querySelector('button').click();
  await until(
    () => node.querySelector('[data-preview]')?.textContent === 'Slack — A bot for the application',
  );
  api.setLocale('fr');
  await until(() => node.querySelector('[data-catalog]')?.textContent === 'Tests automatisés');
  await until(
    () => node.querySelector('[data-guide]')?.textContent === 'Un bot pour l’application',
  );
  await until(
    () => node.querySelector('[data-preview]')?.textContent === 'Slack — Un bot pour l’application',
  );
  assert.equal(node.querySelector('input'), input);
  assert.equal(input.value, 'Brouillon conservé');
  assert.ok(calls.includes('/api/connectors/guides/prepare?language=fr'));
});

import { translateStudioError } from '../scripts/studio/public/error-messages.js';

test('exact known product errors switch both ways; provider text, quoted user content and prototype names stay untouched', () => {
  const french = 'Ces permissions ont changé. Rechargez-les avant de réessayer.';
  const english = 'These permissions changed. Reload them before trying again.';
  assert.equal(translateStudioError(french, 'en'), english);
  assert.equal(translateStudioError(english, 'fr'), french);
  assert.equal(translateStudioError(french, 'fr'), french);
  assert.equal(translateStudioError(english, 'en'), english);
  for (const external of [
    'Provider: ' + french,
    'User wrote "' + english + '"',
    'Provider raw diagnostics',
    '__proto__',
    'constructor',
  ]) {
    assert.equal(translateStudioError(external, 'en'), external);
    assert.equal(translateStudioError(external, 'fr'), external);
  }
});

import { homeLaunchCatalog, projectHomeLaunchCatalog } from '../scripts/studio/home-launch.mjs';

test('Home catalog switches language without changing canonical launch options, idea or selected service IDs', async (t) => {
  const canonical = homeLaunchCatalog();
  assert.deepEqual(projectHomeLaunchCatalog('fr'), canonical);
  assert.equal(projectHomeLaunchCatalog().capabilities[0].title, 'Email delivery');
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.AbortSignal = AbortSignal;
  w.AbortController = AbortController;
  const calls = [];
  w.fetch = async (route) => {
    calls.push(route);
    const url = new URL(route, 'http://127.0.0.1');
    if (url.pathname === '/api/mcp/connections')
      return { ok: true, json: async () => ({ supported: true, presets: [], connections: [] }) };
    if (url.pathname === '/api/connectors/guide-drafts')
      return { ok: true, json: async () => ({ scopeId: 'fixture', drafts: [] }) };
    assert.equal(url.pathname, '/api/home/catalog', 'No provider or write request authorized');
    const locale = url.searchParams.get('language');
    assert.ok(['en', 'fr'].includes(locale));
    return { ok: true, json: async () => projectHomeLaunchCatalog(locale) };
  };
  w.eval(bundle.outputFiles[0].text);
  const api = w.LocaleConnectors;
  const node = w.document.querySelector('#root');
  const unmount = api.mountHomeCatalog(node);
  t.after(() => {
    unmount();
    w.close();
  });
  await until(() => node.querySelector('[data-load]'));
  const input = node.querySelector('input');
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(
    input,
    'Mon idée inchangée',
  );
  input.dispatchEvent(new w.Event('input', { bubbles: true }));
  node.querySelector('[data-select]').click();
  node.querySelector('[data-load]').click();
  await until(() => node.querySelector('[data-home-catalog]').textContent === 'Email delivery');
  await until(() => node.querySelector('[data-choice]').textContent === '["postgresql"]');
  api.setLocale('fr');
  await until(() => node.querySelector('[data-home-catalog]').textContent === 'Envoi de mails');
  assert.equal(node.querySelector('input'), input);
  assert.equal(input.value, 'Mon idée inchangée');
  assert.equal(node.querySelector('[data-choice]').textContent, '["postgresql"]');
  assert.ok(calls.includes('/api/home/catalog?language=en'));
  assert.ok(calls.includes('/api/home/catalog?language=fr'));
  assert.deepEqual(homeLaunchCatalog(), canonical);
});

test('an open Home guide preview and retained Home/decision errors relocalize without another decision or provider call', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.AbortSignal = AbortSignal;
  w.AbortController = AbortController;
  const calls = [];
  w.fetch = async (route, options = {}) => {
    calls.push(route);
    const url = new URL(route, 'http://127.0.0.1');
    const locale = url.searchParams.get('language');
    let value;
    if (url.pathname === '/api/home')
      return {
        ok: false,
        json: async () => ({ error: 'Configuration modifiée ; relire avant de sauvegarder.' }),
      };
    if (url.pathname === '/api/connectors/guide-drafts') value = { scopeId: 'fixture', drafts: [] };
    else if (url.pathname === '/api/connectors/guides')
      value = { guides: projectConnectorGuides(locale) };
    else if (url.pathname === '/api/connectors/guides/prepare')
      value = projectConnectorPreparation(prepareConnectorGuide(JSON.parse(options.body)), locale);
    else throw new Error('No provider call or decision write authorized');
    return { ok: true, json: async () => value };
  };
  w.eval(bundle.outputFiles[0].text);
  const api = w.LocaleConnectors,
    node = w.document.querySelector('#root');
  const unmount = api.mountRetained(node);
  t.after(() => {
    unmount();
    w.close();
  });
  await until(
    () =>
      node.querySelector('[data-load-error]')?.textContent ===
      'Configuration changed; reload before saving.',
  );
  node.querySelector('[data-open]').click();
  node.querySelector('[data-prepare]').click();
  node.querySelector('[data-error]').click();
  await until(
    () => node.querySelector('[data-preview]')?.textContent === 'Slack — A bot for the application',
  );
  await until(
    () =>
      node.querySelector('[data-error-message]')?.textContent ===
      'These permissions changed. Reload them before trying again.',
  );
  api.setLocale('fr');
  await until(
    () => node.querySelector('[data-preview]')?.textContent === 'Slack — Un bot pour l’application',
  );
  assert.equal(
    node.querySelector('[data-error-message]').textContent,
    'Ces permissions ont changé. Rechargez-les avant de réessayer.',
  );
  assert.equal(
    node.querySelector('[data-load-error]').textContent,
    'Configuration modifiée ; relire avant de sauvegarder.',
  );
  api.setLocale('en');
  await until(
    () => node.querySelector('[data-preview]')?.textContent === 'Slack — A bot for the application',
  );
  assert.equal(
    node.querySelector('[data-error-message]').textContent,
    'These permissions changed. Reload them before trying again.',
  );
  assert.equal(
    calls.filter((route) => route === '/api/home').length,
    1,
    'Existing error is relocalized without retry',
  );
});
