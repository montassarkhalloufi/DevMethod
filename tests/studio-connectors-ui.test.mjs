import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { connectorCapabilities, connectorOptions } from '../scripts/studio/connectors-catalog.mjs';
import { prepareConnectorGuide, readConnectorGuides } from '../scripts/studio/connector-guides.mjs';

const bundle = await build({
  entryPoints: [path.resolve('studio-ui/src/connectors-widget.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ConnectorsTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected connector state not reached');
}

const reply = (value, ok = true) => ({ ok, json: async () => value });

function report(revisionId = 'r1', connections = []) {
  return {
    schemaVersion: 1,
    revisionId,
    catalog: { capabilities: connectorCapabilities, options: connectorOptions },
    connections,
    limits: ['Bridge hôte uniquement.'],
  };
}

function configured(optionId = 'node-check', status = 'configured') {
  return {
    id: optionId,
    optionId,
    purpose: connectorOptions.find((item) => item.id === optionId).purpose,
    profileRef: 'host:local',
    secretRefs: [],
    version: 1,
    configuredAt: new Date().toISOString(),
    status,
    probe:
      status === 'attested'
        ? {
            id: 'p1',
            tool: { name: 'Node', version: '24' },
            status: 'available',
            capabilities: ['code-quality'],
            tools: [],
            observedAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            summary: 'Réponse reçue.',
          }
        : null,
  };
}

function fixture(t, fetcher, extra = {}) {
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.fetch = fetcher;
  dom.window.eval(bundle.outputFiles[0].text + '\nwindow.ConnectorsTest = ConnectorsTest;');
  const requests = [];
  const props = { revisionId: 'r1', onPrepareRequest: (value) => requests.push(value), ...extra };
  const handle = dom.window.ConnectorsTest.mountConnectorsWidget(
    dom.window.document.getElementById('root'),
    props,
  );
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  return { dom, document: dom.window.document, props, handle, requests };
}

const button = (f, label) =>
  [...f.document.querySelectorAll('button')].find(
    (node) => !node.closest('[hidden]') && node.textContent.includes(label),
  );

const activeOption = (f) => f.document.querySelector('.connector-detail h3')?.textContent;
const optionTitle = (id) => connectorOptions.find((item) => item.id === id).title;
const cards = (f) => [...f.document.querySelectorAll('.connector-card')];

function searchFor(f, value) {
  const input = f.document.querySelector('input[type="search"]');
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLInputElement.prototype, 'value').set.call(
    input,
    value,
  );
  input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
}

function editProfile(f, value) {
  const input = f.document.querySelector('input[placeholder="host:mon-profil"]');
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLInputElement.prototype, 'value').set.call(
    input,
    value,
  );
  input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
}

test('unsaved connection fields survive returning to the catalogue and reopening the provider', async (t) => {
  const f = fixture(t, async () => reply(report('r1', [configured('postgresql')])));
  await until(() => cards(f).length);
  button(f, 'PostgreSQL').click();
  await until(() => f.document.querySelector('form'));
  editProfile(f, 'host:my-project');
  await until(
    () =>
      f.document.querySelector('input[placeholder="host:mon-profil"]').value === 'host:my-project',
  );
  button(f, 'Retour au catalogue').click();
  await until(() => !f.document.querySelector('.connector-detail'));
  button(f, 'PostgreSQL').click();
  await until(() => f.document.querySelector('form'));
  assert.equal(
    f.document.querySelector('input[placeholder="host:mon-profil"]').value,
    'host:my-project',
  );
});

test('saving locks the submitted fields and restores editing after the saved version arrives', async (t) => {
  let release;
  let connection = configured('postgresql');
  const f = fixture(t, async (_url, init) => {
    if (init?.method === 'POST')
      return new Promise((resolve) => {
        release = resolve;
      });
    return reply(report('r1', [connection]));
  });
  await until(() => cards(f).length);
  button(f, 'PostgreSQL').click();
  await until(() => f.document.querySelector('form'));
  editProfile(f, 'host:saved');
  await setTimeout(5);
  f.document
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => release);
  assert.equal(f.document.querySelector('input[placeholder="host:mon-profil"]').disabled, true);
  assert.equal(f.document.querySelector('form textarea').disabled, true);
  connection = { ...connection, version: 2, profileRef: 'host:saved' };
  release(reply(report('r1', [connection])));
  await until(() => !f.document.querySelector('input[placeholder="host:mon-profil"]').disabled);
  assert.equal(
    f.document.querySelector('input[placeholder="host:mon-profil"]').value,
    'host:saved',
  );
});

test('Slack guide is saved with configuration, survives a failed save, and forwards the structured server preparation', async (t) => {
  const posts = [];
  let connection;
  let failSave = true;
  const f = fixture(t, async (url, init) => {
    if (url === '/api/connectors/guides') return reply(readConnectorGuides());
    if (init?.method === 'POST') {
      const input = JSON.parse(init.body);
      posts.push({ url, input });
      if (url.endsWith('/guides/prepare')) return reply(prepareConnectorGuide(input));
      if (url.endsWith('/configure')) {
        if (failSave) {
          failSave = false;
          return reply({ error: 'Stockage temporairement indisponible.' }, false);
        }
        connection = { ...configured('slack'), guide: input.guide };
        return reply(report('r1', [connection]));
      }
      return reply({
        prompt: 'Intégration Slack, sans action externe automatique.',
        connectorGuides: [connection.guide],
      });
    }
    return reply(report('r1', connection ? [connection] : []));
  });
  await until(() => cards(f).length);
  button(f, 'Slack').click();
  await until(() => button(f, 'Préciser la configuration'));
  const choose = (label) => {
    const option = [...f.document.querySelectorAll('.connector-guide label')].find(
      (item) => item.querySelector('strong')?.textContent === label,
    );
    assert.ok(option);
    option.querySelector('input').click();
  };
  choose('Un bot pour l’application');
  await until(() => !button(f, 'Préciser la configuration').disabled);
  button(f, 'Préciser la configuration').click();
  await until(() => button(f, 'Vérifier la préparation'));
  choose('Envoyer des messages');
  await setTimeout(5);
  choose('Canaux privés choisis');
  await until(() => !button(f, 'Vérifier la préparation').disabled);
  assert.equal(button(f, 'Enregistrer la configuration').disabled, true);
  button(f, 'Vérifier la préparation').click();
  await until(() => !button(f, 'Enregistrer la configuration').disabled);
  button(f, 'Enregistrer la configuration').click();
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.match(f.document.querySelector('[role="alert"]').textContent, /Stockage/);
  assert.ok(f.document.querySelector('.connector-guide-summary'));
  button(f, 'Enregistrer la configuration').click();
  await until(() => button(f, 'Préparer l’intégration'));
  assert.equal(posts.filter((post) => post.url.endsWith('/configure')).length, 2);
  assert.equal(connection.guide.answers.audience, 'selected-private-channels');
  assert.equal(button(f, 'Préparer l’intégration').disabled, false);
  button(f, 'Préparer l’intégration').click();
  await until(() => f.requests.length === 1);
  assert.equal(f.requests[0].connectorGuides[0].flowId, 'slack-bot');
  assert.match(f.requests[0].prompt, /sans action externe/);
  editProfile(f, 'host:another-account');
  await until(() => button(f, 'Préparer l’intégration').disabled);
  assert.match(f.document.body.textContent, /Enregistrez les réglages/);
});

test('catalog offers multiple application providers without claiming connection or execution', async (t) => {
  const calls = [];
  const f = fixture(t, async (url, init) => {
    calls.push({ url, init });
    return reply(report());
  });
  await until(() => f.document.querySelector('.connector-card'));
  assert.equal(f.document.querySelector('.connector-detail'), null);
  assert.equal(f.document.querySelector('form'), null);
  assert.match(f.document.body.textContent, /Services de l’application/);
  assert.ok(connectorOptions.filter((item) => item.capabilities.includes('database')).length >= 3);
  assert.ok(connectorOptions.filter((item) => item.capabilities.includes('mail')).length >= 2);
  assert.match(f.document.body.textContent, /À configurer/);
  assert.doesNotMatch(f.document.body.textContent, /Disponibilité attestée/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, undefined);
});

test('category and configured filters preserve search, card selection and focus after detail navigation', async (t) => {
  const f = fixture(t, async () =>
    reply(report('r1', [configured('postgresql', 'attested'), configured('smtp')])),
  );
  await until(() => cards(f).length);
  const applicationCount = connectorOptions.filter((item) => item.purpose === 'application').length;
  assert.equal(cards(f).length, applicationCount);
  const categoryTitle = connectorCapabilities.find((item) => item.id === 'database').title;
  const category = () =>
    [...f.document.querySelectorAll('[aria-label="Catégories des connecteurs"] button')].find(
      (node) => node.firstChild.textContent === categoryTitle,
    );
  const databaseCount = connectorOptions.filter(
    (item) => item.purpose === 'application' && item.capabilities.includes('database'),
  ).length;
  assert.equal(category().querySelector('.connector-count').textContent, String(databaseCount));
  button(f, 'Configurés').click();
  await until(() => cards(f).length === 2);
  assert.equal(category().querySelector('.connector-count').textContent, '1');
  category().click();
  await until(() => cards(f).length === 1);
  searchFor(f, 'POSTGRES');
  await until(
    () => f.document.querySelector('.connector-result-count').textContent === '1 solution',
  );
  const trigger = cards(f)[0];
  assert.equal(trigger.tagName, 'BUTTON');
  trigger.focus();
  trigger.click();
  await until(() => activeOption(f) === optionTitle('postgresql'));
  assert.equal(f.document.activeElement, button(f, 'Retour au catalogue'));
  assert.equal(
    f.document.querySelector('dialog'),
    null,
    'Detail uses the existing popup, not another dialog',
  );
  button(f, 'Retour au catalogue').click();
  await until(() => !f.document.querySelector('.connector-detail'));
  assert.equal(f.document.activeElement, trigger);
  assert.equal(trigger.getAttribute('aria-current'), 'true');
  assert.equal(f.document.querySelector('input[type="search"]').value, 'POSTGRES');
  assert.equal(category().getAttribute('aria-pressed'), 'true');
  assert.equal(button(f, 'Configurés').getAttribute('aria-pressed'), 'true');
  assert.equal(cards(f).length, 1);
  assert.equal(f.requests.length, 0);
});

test('search and dynamic categories handle no matches and diagnostics without configuring anything', async (t) => {
  const calls = [];
  const f = fixture(t, async (url, init) => {
    calls.push({ url, init });
    return reply(report());
  });
  await until(() => cards(f).length);
  searchFor(f, 'unavailable-fixture-provider');
  await until(() => cards(f).length === 0);
  assert.match(f.document.querySelector('.connector-empty').textContent, /autre recherche/);
  searchFor(f, '');
  button(f, 'Diagnostic et vérifications').click();
  await until(
    () =>
      cards(f).length === connectorOptions.filter((item) => item.purpose === 'diagnostics').length,
  );
  assert.equal(f.document.querySelector('.connector-detail'), null);
  const diagnosticCategories = connectorCapabilities.filter(
    (item) => item.purpose === 'diagnostics',
  );
  assert.equal(
    f.document.querySelectorAll('[aria-label="Catégories des connecteurs"] button').length,
    diagnosticCategories.length + 1,
  );
  button(f, 'Configurés').click();
  await until(() => cards(f).length === 0);
  assert.match(
    f.document.querySelector('.connector-empty').textContent,
    /Aucun connecteur configuré/,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, undefined);
});

test('metadata configuration does not enable running until host attests the capability', async (t) => {
  const posts = [];
  let connection;
  const f = fixture(
    t,
    async (url, init) => {
      if (init?.method === 'POST') {
        posts.push({ url, input: JSON.parse(init.body) });
        connection = configured();
      }
      return reply(report('r1', connection ? [connection] : []));
    },
    { checkId: 'source-syntax' },
  );
  await until(() => f.document.querySelector('form'));
  assert.equal(activeOption(f), optionTitle('node-check'), 'Prefer a suitable local tool');
  f.document
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => button(f, 'Préparer l’exécution'));
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, '/api/connectors/configure');
  assert.equal(posts[0].input.optionId, 'node-check');
  assert.match(f.document.body.textContent, /Configuré · connexion à vérifier/);
  assert.equal(button(f, 'Préparer l’exécution').disabled, true);
  button(f, 'Préparer la vérification de connexion').click();
  assert.equal(f.requests.length, 1);
  assert.match(f.requests[0].prompt, /configuration 1/);
  assert.match(f.requests[0].prompt, /POST \/api\/connectors\/probe/);
  assert.equal(posts.length, 1, 'Preparing a probe does not execute it');
});

test('attested connector prepares a version-bound execution ticket and forwards exact host prompt', async (t) => {
  const posts = [];
  const f = fixture(
    t,
    async (url, init) => {
      if (init?.method === 'POST') {
        posts.push({ url, input: JSON.parse(init.body) });
        return reply({ prompt: 'Ticket r1, sources exactes, délai borné', runId: 'ticket-1' });
      }
      return reply(report('r1', [configured('node-check', 'attested')]));
    },
    { checkId: 'source-syntax' },
  );
  await until(() => button(f, 'Préparer l’exécution'));
  assert.equal(button(f, 'Préparer l’exécution').disabled, false);
  button(f, 'Préparer l’exécution').click();
  await until(() => f.requests.length);
  assert.deepEqual(posts[0], {
    url: '/api/connectors/executions',
    input: { connectionId: 'node-check', revisionId: 'r1', checkId: 'source-syntax' },
  });
  assert.equal(f.requests[0].prompt, 'Ticket r1, sources exactes, délai borné');
});

test('compatible configured connector takes priority over an unconfigured local tool', async (t) => {
  const f = fixture(t, async () => reply(report('r1', [configured('diagnostic-mcp')])), {
    checkId: 'source-syntax',
  });
  await until(() => f.document.querySelector('.connector-detail'));
  assert.equal(activeOption(f), optionTitle('diagnostic-mcp'));
  assert.equal(button(f, 'Préparer l’exécution').disabled, true);
});

test('compatible attested connector takes priority while an explicit choice remains selected', async (t) => {
  let reads = 0;
  const f = fixture(
    t,
    async () => {
      reads++;
      return reply(
        report('r1', [configured('diagnostic-api'), configured('diagnostic-mcp', 'attested')]),
      );
    },
    { checkId: 'source-syntax' },
  );
  await until(() => f.document.querySelector('.connector-detail'));
  assert.equal(activeOption(f), optionTitle('diagnostic-mcp'));
  assert.equal(button(f, 'Préparer l’exécution').disabled, false);
  button(f, 'Retour au catalogue').click();
  await until(() => !f.document.querySelector('.connector-detail'));
  button(f, optionTitle('node-check')).click();
  await until(() => activeOption(f) === optionTitle('node-check'));
  button(f, 'Actualiser les états').click();
  await until(() => reads === 2);
  assert.equal(activeOption(f), optionTitle('node-check'));
});

test('unselected revision can display the active catalogue without enabling version-bound execution', async (t) => {
  const f = fixture(t, async () => reply(report('r1', [configured('node-check', 'attested')])), {
    revisionId: null,
    checkId: 'source-syntax',
  });
  await until(() => f.document.querySelector('.connector-detail'));
  assert.equal(activeOption(f), optionTitle('node-check'));
  assert.equal(f.document.querySelector('[role="alert"]'), null);
  assert.equal(button(f, 'Préparer l’exécution').disabled, true);
  assert.equal(f.requests.length, 0);
});

test('late catalogue for another revision is discarded and request failure stays explicit', async (t) => {
  const pending = [];
  const f = fixture(
    t,
    (url, init) => new Promise((resolve) => pending.push({ url, init, resolve })),
  );
  await until(() => pending.length === 1);
  f.handle.update({ ...f.props, revisionId: 'r2' });
  await until(() => pending.length === 2);
  assert.equal(pending[0].init.signal.aborted, true);
  pending[1].resolve(reply(report('r2')));
  await until(() => f.document.querySelector('.connector-card'));
  f.document.querySelector('.connector-card').click();
  await until(() => f.document.querySelector('form'));
  pending[0].resolve(reply(report('r1', [configured('node-check', 'attested')])));
  await setTimeout(20);
  assert.doesNotMatch(f.document.body.textContent, /Disponibilité attestée/);
  f.document
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => pending.length === 3);
  pending[2].resolve(reply({ error: 'Configuration modifiée ; relire.' }, false));
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.match(f.document.querySelector('[role="alert"]').textContent, /Configuration modifiée/);
  assert.equal(f.requests.length, 0);
});
