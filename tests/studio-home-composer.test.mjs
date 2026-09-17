import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  stdin: {
    contents: `import { createRoot } from 'react-dom/client';
      import { IdeaComposer } from './studio-ui/src/features/home/components/IdeaComposer';
      import { useIdeaComposer } from './studio-ui/src/features/home/hooks/useIdeaComposer';
      function Harness(props) {
        const composer = useIdeaComposer(props);
        return <IdeaComposer operation={props.operation} composer={composer} />;
      }
      export function mount(host, props) {
        const root = createRoot(host);
        const update = (value) => root.render(<Harness {...value} />);
        update(props);
        return { update, dispose: () => root.unmount() };
      }`,
    resolveDir: path.resolve('.'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ComposerTest',
  jsx: 'automatic',
  loader: { '.svg': 'dataurl', '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const reply = (value, ok = true) => ({ ok, json: async () => value });
const idle = { phase: 'idle', project: null, error: '' };
const catalog = {
  options: [
    {
      id: 'resend',
      title: 'Resend',
      description: 'Courriels transactionnels',
      capabilities: ['email'],
    },
    {
      id: 'supabase',
      title: 'Supabase',
      description: 'Base de données',
      capabilities: ['database'],
    },
  ],
  capabilities: [
    { id: 'email', title: 'Courriel' },
    { id: 'database', title: 'Données' },
  ],
};

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected composer state not reached');
}

function fixture(
  t,
  { fetcher = async () => reply(catalog), reader, guides = [], mcpConnections = [] } = {},
) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.structuredClone = structuredClone;
  window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new window.Event('close'));
  };
  if (reader) window.FileReader = reader;
  const calls = [];
  window.fetch = (url, init) => {
    if (url === '/api/mcp')
      return Promise.resolve(reply({ presets: [], connections: mcpConnections, supported: true }));
    if (url === '/api/connectors/guides') return Promise.resolve(reply({ guides }));
    calls.push({ url, init });
    return fetcher(url, init);
  };
  window.eval(bundle.outputFiles[0].text + '\nwindow.ComposerTest = ComposerTest;');
  const submissions = [];
  let edits = 0;
  let props = {
    operation: idle,
    onSubmit: (input) => submissions.push(JSON.parse(JSON.stringify(input))),
    onEdit: () => edits++,
  };
  const handle = window.ComposerTest.mount(window.document.getElementById('root'), props);
  t.after(() => {
    handle.dispose();
    window.close();
  });
  return {
    window,
    document: window.document,
    calls,
    submissions,
    get edits() {
      return edits;
    },
    update(value) {
      props = { ...props, ...value };
      handle.update(props);
    },
    dispose: handle.dispose,
  };
}

function button(f, label, scope = f.document) {
  return [...scope.querySelectorAll('button')].find(
    (node) => (node.getAttribute('aria-label') || node.textContent).trim() === label,
  );
}

const dialog = (f) => f.document.querySelector('dialog');
const idea = (f) => f.document.querySelector('[name="idea"]');

const slackGuide = {
  optionId: 'slack',
  guideVersion: 1,
  title: 'Slack',
  description: 'Préparer un partage manuel.',
  flows: [
    {
      id: 'slack-bot',
      title: 'Bot de l’application',
      description: 'Publier avec le bot.',
      usage: 'application',
      identity: 'bot',
      transport: 'api',
      questions: [
        {
          id: 'channelAccess',
          title: 'Canaux concernés',
          options: [
            { id: 'joined-channels', title: 'Canaux où le bot est membre' },
            { id: 'public-channels', title: 'Tous les canaux publics' },
          ],
        },
      ],
    },
  ],
  sources: [],
};
const guidedCatalog = {
  ...catalog,
  options: [
    ...catalog.options,
    { id: 'slack', title: 'Slack', description: 'Messages de projet', capabilities: ['messaging'] },
  ],
};
const notionGuide = {
  ...slackGuide,
  optionId: 'notion',
  title: 'Notion',
  flows: [
    {
      ...slackGuide.flows[0],
      id: 'notion-context',
      title: 'Contexte de l’assistant',
      usage: 'assistant',
      transport: 'mcp',
      questions: [],
    },
  ],
};
const notionCatalog = {
  ...catalog,
  options: [
    { id: 'notion', title: 'Notion', description: 'Documentation', capabilities: ['content'] },
  ],
};

test('a service guide opens from the catalogue without submitting or changing the brief', async (t) => {
  const f = fixture(t, { guides: [slackGuide], fetcher: async () => reply(guidedCatalog) });
  await until(() => idea(f));
  type(f, '[name="idea"]', 'Le brief original');
  await openOptions(f, 'tools');
  await until(() => button(f, 'Configurer Slack', dialog(f)));
  button(f, 'Configurer Slack', dialog(f)).click();
  await until(() => dialog(f).textContent.includes('Bot de l’application'));
  assert.equal(idea(f).value, 'Le brief original');
  assert.equal(f.submissions.length, 0);
  assert.equal(f.calls.filter((call) => call.init?.method === 'POST').length, 0);
  f.update({ operation: { ...idle, phase: 'creating' } });
  await until(() => dialog(f).querySelector('.connector-guide-question')?.disabled);
  submit(f);
  assert.equal(f.submissions.length, 0);
});

const preparedGuide = (input) => ({
  input,
  setupFingerprint: 'a'.repeat(64),
  title: 'Partage manuel préparé',
  summary: ['Envoyer le résumé avec un bot.'],
  permissions: [{ scope: 'chat:write', reason: 'Publier le résumé choisi.' }],
  prerequisites: ['Autoriser un compte Slack.'],
  access: 'not-connected',
  nativeConnection: null,
});

function chooseGuide(f, title) {
  const label = [...dialog(f).querySelectorAll('.connector-guide-choice')].find((node) =>
    node.textContent.includes(title),
  );
  assert.ok(label, `Missing guide choice: ${title}`);
  label.querySelector('input').click();
}

const guideStep = (f, title) =>
  [...dialog(f).querySelectorAll('.connector-guide-steps button')].find((node) =>
    node.textContent.endsWith(title),
  );

async function answerSlackGuide(f) {
  await openOptions(f, 'tools');
  await until(() => button(f, 'Configurer Slack', dialog(f)));
  button(f, 'Configurer Slack', dialog(f)).click();
  await until(() => dialog(f).querySelector('.connector-guide-choice'));
  chooseGuide(f, 'Bot de l’application');
  await until(() => !button(f, 'Préciser la configuration →').disabled);
  button(f, 'Préciser la configuration →').click();
  await until(() => dialog(f).textContent.includes('Canaux concernés'));
  chooseGuide(f, 'Canaux où le bot est membre');
  await until(() => !button(f, 'Vérifier la préparation →').disabled);
}

async function closeOptions(f) {
  button(f, 'Fermer les options').click();
  await until(() => !dialog(f).open);
}

function guideFetcher(url, init) {
  return Promise.resolve(
    reply(url.endsWith('/prepare') ? preparedGuide(JSON.parse(init.body)) : guidedCatalog),
  );
}

test('validated guide answers survive catalogue and dialog navigation, reopen from a chip, and reach the exact launch once', async (t) => {
  const f = fixture(t, { guides: [slackGuide], fetcher: guideFetcher });
  await until(() => idea(f));
  type(f, '[name="idea"]', 'Mon brief intact');
  await answerSlackGuide(f);
  guideStep(f, 'Usage').click();
  await until(() => button(f, '← Retour au catalogue'));
  button(f, '← Retour au catalogue').click();
  await until(() => !dialog(f).querySelector('.connector-guide'));
  button(f, 'Configurer Slack', dialog(f)).click();
  await until(() => dialog(f).querySelector('.connector-guide-question input:checked'));
  assert.match(
    dialog(f).querySelector('.connector-guide-question input:checked').closest('label').textContent,
    /Canaux où le bot est membre/,
  );
  await closeOptions(f);
  await openOptions(f, 'tools');
  assert.ok(dialog(f).querySelector('.connector-guide-question input:checked'));
  button(f, 'Vérifier la préparation →').click();
  await until(() => button(f, 'Ajouter à ma demande'));
  assert.equal(f.submissions.length, 0);
  const expected = {
    optionId: 'slack',
    guideVersion: 1,
    flowId: 'slack-bot',
    answers: { channelAccess: 'joined-channels' },
  };
  assert.deepEqual(
    JSON.parse(f.calls.find((call) => call.init?.method === 'POST').init.body),
    expected,
  );
  button(f, 'Ajouter à ma demande').click();
  await until(() => f.document.querySelector('.composer-guide-chip'));
  assert.match(f.document.querySelector('.composer-guide-chip').textContent, /Slack · À connecter/);
  await closeOptions(f);
  button(f, 'Configurer Slack').click();
  await until(() => dialog(f).open && button(f, 'Ajouter à ma demande'));
  assert.match(dialog(f).textContent, /Envoyer le résumé avec un bot/);
  await closeOptions(f);
  assert.equal(idea(f).value, 'Mon brief intact');
  submit(f);
  assert.equal(f.submissions.length, 1);
  assert.deepEqual(f.submissions[0].launch, {
    action: 'build',
    projectType: 'website',
    design: '',
    connectors: ['slack'],
    connectorGuides: [expected],
    mcpConnectionIds: [],
    links: [],
    attachments: [],
  });
  assert.equal(f.calls.filter((call) => call.init?.method === 'POST').length, 1);
  button(f, 'Retirer Slack').click();
  await until(() => !f.document.querySelector('.composer-guide-chip'));
  submit(f);
  assert.deepEqual(f.submissions[1].launch.connectors, []);
  assert.equal(f.submissions[1].launch.connectorGuides, undefined);
});

test('guide preparation errors retain answers and an edited selected guide must be confirmed again before launch', async (t) => {
  let fail = true;
  const f = fixture(t, {
    guides: [slackGuide],
    fetcher: async (url, init) => {
      if (url.endsWith('/prepare') && fail)
        return reply({ error: 'Préparation indisponible, réessayez.' }, false);
      return guideFetcher(url, init);
    },
  });
  await until(() => idea(f));
  type(f, '[name="idea"]', 'Préserver le brief et les réponses');
  await answerSlackGuide(f);
  button(f, 'Vérifier la préparation →').click();
  await until(() => button(f, 'Réessayer la préparation'));
  assert.match(dialog(f).querySelector('[role="alert"]').textContent, /indisponible/);
  assert.equal(f.submissions.length, 0);
  fail = false;
  button(f, 'Réessayer la préparation').click();
  await until(() => button(f, 'Ajouter à ma demande'));
  button(f, 'Ajouter à ma demande').click();
  await until(() => f.document.querySelector('.composer-guide-chip'));
  await closeOptions(f);
  button(f, 'Configurer Slack').click();
  await until(() => dialog(f).open && guideStep(f, 'Configuration'));
  guideStep(f, 'Configuration').click();
  await until(() => dialog(f).textContent.includes('Canaux concernés'));
  chooseGuide(f, 'Tous les canaux publics');
  await closeOptions(f);
  submit(f);
  await until(() => f.document.querySelector('.composer-error'));
  assert.equal(f.submissions.length, 0);
  assert.match(f.document.querySelector('.composer-error').textContent, /guide modifié/);
  assert.equal(idea(f).value, 'Préserver le brief et les réponses');
  button(f, 'Retirer Slack').click();
  await until(() => !f.document.querySelector('.composer-guide-chip'));
  submit(f);
  assert.equal(f.submissions.length, 1);
  assert.equal(f.submissions[0].launch.connectorGuides, undefined);
});

test('an assistant guide is separate from application services and adding it makes no MCP or business request', async (t) => {
  const f = fixture(t, {
    guides: [notionGuide],
    fetcher: async (url, init) =>
      reply(url.endsWith('/prepare') ? preparedGuide(JSON.parse(init.body)) : notionCatalog),
  });
  await until(() => idea(f));
  type(f, '[name="idea"]', 'Consulter le contexte');
  await openOptions(f, 'tools');
  await until(() => button(f, 'Configurer Notion', dialog(f)));
  button(f, 'Configurer Notion', dialog(f)).click();
  await until(() => dialog(f).querySelector('.connector-guide-choice'));
  chooseGuide(f, 'Contexte de l’assistant');
  await until(() => !button(f, 'Préciser la configuration →').disabled);
  button(f, 'Préciser la configuration →').click();
  await until(() => button(f, 'Vérifier la préparation →'));
  button(f, 'Vérifier la préparation →').click();
  await until(() => button(f, 'Ajouter à ma demande'));
  button(f, 'Ajouter à ma demande').click();
  await until(() => f.document.querySelector('.composer-guide-chip'));
  await closeOptions(f);
  submit(f);
  assert.deepEqual(f.submissions[0].launch.connectors, []);
  assert.deepEqual(f.submissions[0].launch.mcpConnectionIds, []);
  assert.deepEqual(f.submissions[0].launch.connectorGuides, [
    { optionId: 'notion', guideVersion: 1, flowId: 'notion-context', answers: {} },
  ]);
  assert.deepEqual(
    f.calls.filter((call) => call.init?.method === 'POST').map((call) => call.url),
    ['/api/connectors/guides/prepare'],
  );
});

async function prepareNotionGuide(f) {
  await until(() => idea(f));
  type(f, '[name="idea"]', 'Consulter le contexte sans changer mon brief');
  await openOptions(f, 'tools');
  await until(() => button(f, 'Configurer Notion', dialog(f)));
  button(f, 'Configurer Notion', dialog(f)).click();
  await until(() => dialog(f).querySelector('.connector-guide-choice'));
  chooseGuide(f, 'Contexte de l’assistant');
  await until(() => !button(f, 'Préciser la configuration →').disabled);
  button(f, 'Préciser la configuration →').click();
  await until(() => button(f, 'Vérifier la préparation →'));
  button(f, 'Vérifier la préparation →').click();
  await until(() => button(f, 'Connecter Notion', dialog(f)));
}

test('a prepared MCP guide invokes the native endpoint only on Connect and shows its returned status without losing the brief', async (t) => {
  let finishConnection;
  const connection = {
    id: 'c81791bd-28d5-4ef7-9764-2993f7d61614',
    name: 'Notion test UI',
    provider: 'notion',
    url: 'https://mcp.notion.com/mcp',
    auth: 'oauth',
    status: 'connected',
    tools: [{ name: 'search' }],
  };
  const f = fixture(t, {
    guides: [notionGuide],
    fetcher: async (url, init) => {
      if (url === '/api/mcp/connect')
        return new Promise((resolve) => {
          finishConnection = () => resolve(reply({ connection }));
        });
      return reply(
        url.endsWith('/prepare')
          ? {
              ...preparedGuide(JSON.parse(init.body)),
              nativeConnection: { providerId: 'notion', url: 'https://mcp.notion.com/mcp' },
            }
          : notionCatalog,
      );
    },
  });
  const popup = {
    opener: f.window,
    closed: false,
    document: { title: '', body: { textContent: '' } },
    close() {
      this.closed = true;
    },
  };
  let opened = 0;
  f.window.open = () => {
    opened++;
    return popup;
  };
  await prepareNotionGuide(f);
  assert.equal(opened, 0);
  button(f, 'Connecter Notion', dialog(f)).click();
  await until(
    () =>
      finishConnection &&
      dialog(f)
        .querySelector('.composer-guide-connect')
        .textContent.includes('Connexion MCP en cours'),
  );
  assert.equal(button(f, 'Connecter Notion', dialog(f)).disabled, true);
  assert.deepEqual(JSON.parse(f.calls.find((call) => call.url === '/api/mcp/connect').init.body), {
    provider: 'notion',
  });
  finishConnection();
  await until(() =>
    dialog(f)
      .querySelector('.composer-guide-connect')
      .textContent.includes('Connecté · 1 outils découverts'),
  );
  assert.equal(opened, 1);
  assert.equal(popup.closed, true);
  assert.equal(f.submissions.length, 0);
  button(f, 'Ajouter à ma demande').click();
  await until(() => f.document.querySelector('.composer-guide-chip'));
  assert.match(f.document.querySelector('.composer-guide-chip').textContent, /MCP connecté/);
  await closeOptions(f);
  submit(f);
  assert.deepEqual(f.submissions[0].launch.mcpConnectionIds, [connection.id]);
  assert.deepEqual(f.submissions[0].launch.connectors, []);
  assert.equal(f.submissions[0].idea, 'Consulter le contexte sans changer mon brief');
});

test('an unsupported native target is reported safely without opening OAuth or submitting the project', async (t) => {
  const f = fixture(t, {
    guides: [notionGuide],
    fetcher: async (url, init) =>
      reply(
        url.endsWith('/prepare')
          ? {
              ...preparedGuide(JSON.parse(init.body)),
              nativeConnection: { providerId: 'notion', url: 'https://invalid.example/mcp' },
            }
          : notionCatalog,
      ),
  });
  let opened = 0;
  f.window.open = () => {
    opened++;
    return null;
  };
  await prepareNotionGuide(f);
  button(f, 'Connecter Notion', dialog(f)).click();
  await until(() => dialog(f).querySelector('.composer-guide-connect [role="alert"]'));
  assert.match(
    dialog(f).querySelector('.composer-guide-connect [role="alert"]').textContent,
    /prise en charge/,
  );
  assert.equal(opened, 0);
  assert.equal(
    f.calls.some((call) => call.url === '/api/mcp/connect'),
    false,
  );
  assert.equal(f.submissions.length, 0);
  assert.equal(idea(f).value, 'Consulter le contexte sans changer mon brief');
});

test('a read-only Linear guide warns about a selected standard connection until the user explicitly removes it', async (t) => {
  const linearGuide = {
    ...notionGuide,
    optionId: 'linear',
    title: 'Linear',
    flows: [{ ...notionGuide.flows[0], id: 'linear-read', title: 'Consultation en lecture seule' }],
  };
  const linear = (id, url) => ({
    id,
    provider: 'linear',
    name: 'Linear',
    auth: 'oauth',
    status: 'connected',
    url,
    tools: [{ name: 'search' }],
  });
  const connections = [
    linear('a4d6a057-7e0a-4a45-ae13-aec64273a7cd', 'https://mcp.linear.app/mcp'),
    linear('c68c6142-a6ba-4fd6-b6b9-2f5a6aa4d10b', 'https://mcp.linear.app/mcp/readonly'),
  ];
  const f = fixture(t, {
    guides: [linearGuide],
    mcpConnections: connections,
    fetcher: async (url, init) =>
      reply(
        url.endsWith('/prepare')
          ? {
              ...preparedGuide(JSON.parse(init.body)),
              nativeConnection: { providerId: 'linear', url: connections[1].url },
            }
          : {
              ...catalog,
              options: [
                {
                  id: 'linear',
                  title: 'Linear',
                  description: 'Suivi des demandes',
                  capabilities: ['productivity'],
                },
              ],
            },
      ),
  });
  await until(() => f.document.querySelectorAll('.mcp-prompt-chip').length === 2);
  const chips = () => [...f.document.querySelectorAll('.mcp-prompt-chip')];
  chips()[0].click();
  chips()[1].click();
  await until(() => chips().every((chip) => chip.getAttribute('aria-pressed') === 'true'));
  type(f, '[name="idea"]', 'Consulter les demandes Linear');
  await openOptions(f, 'tools');
  await until(() => button(f, 'Configurer Linear', dialog(f)));
  button(f, 'Configurer Linear', dialog(f)).click();
  await until(() => dialog(f).querySelector('.connector-guide-choice'));
  chooseGuide(f, 'Consultation en lecture seule');
  await until(() => !button(f, 'Préciser la configuration →').disabled);
  button(f, 'Préciser la configuration →').click();
  await until(() => button(f, 'Vérifier la préparation →'));
  button(f, 'Vérifier la préparation →').click();
  await until(() => button(f, 'Ajouter à ma demande'));
  button(f, 'Ajouter à ma demande').click();
  await until(() =>
    f.document.body.textContent.includes(
      'Une connexion Linear avec accès standard est aussi sélectionnée.',
    ),
  );
  await closeOptions(f);
  assert.equal(chips()[0].getAttribute('aria-pressed'), 'true');
  assert.equal(chips()[1].getAttribute('aria-pressed'), 'true');
  chips()[0].click();
  await until(
    () =>
      !f.document.body.textContent.includes(
        'Une connexion Linear avec accès standard est aussi sélectionnée.',
      ),
  );
  assert.equal(chips()[1].getAttribute('aria-pressed'), 'true');
  submit(f);
  assert.deepEqual(f.submissions[0].launch.mcpConnectionIds, [connections[1].id]);
  assert.equal(f.submissions[0].launch.connectorGuides[0].flowId, 'linear-read');
});

function type(f, selector, value) {
  const node = f.document.querySelector(selector);
  const proto =
    node.tagName === 'TEXTAREA'
      ? f.window.HTMLTextAreaElement.prototype
      : node.tagName === 'SELECT'
        ? f.window.HTMLSelectElement.prototype
        : f.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
  node.dispatchEvent(
    new f.window.Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
  );
}

function submit(f) {
  f.document
    .querySelector('form')
    .dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true }));
}

function beforeUnload(f) {
  const event = new f.window.Event('beforeunload', { cancelable: true });
  f.window.dispatchEvent(event);
  return event.defaultPrevented;
}

async function openOptions(f, section = 'references') {
  await until(() => idea(f));
  const trigger =
    section === 'references'
      ? button(f, 'Ajouter des références')
      : [...f.document.querySelectorAll('.composer-option-actions button')].find((node) =>
          node.textContent.includes(section === 'tools' ? 'Outils' : 'Design'),
        );
  trigger.focus();
  trigger.click();
  await until(() => dialog(f).open);
  return trigger;
}

function selectFiles(f, files) {
  const input = f.document.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new f.window.Event('change', { bubbles: true }));
}

test('the inline idea starts immediately, type suggestions preserve written text, and keyboard submits once', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  assert.equal(idea(f).value, '');
  assert.equal(f.document.querySelector('[name="launch-action"]').value, 'build');
  submit(f);
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.activeElement, idea(f));
  button(f, 'Application').click();
  await until(() => idea(f).value.includes('application web'));
  type(f, '[name="idea"]', 'Un carnet pour mon association.');
  await setTimeout(10);
  button(f, 'Présentation web').click();
  await setTimeout(10);
  assert.equal(idea(f).value, 'Un carnet pour mon association.');
  idea(f).dispatchEvent(
    new f.window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }),
  );
  submit(f);
  assert.equal(f.submissions.length, 1);
  assert.deepEqual(f.submissions[0], {
    kind: 'new',
    idea: 'Un carnet pour mon association.',
    launch: {
      action: 'build',
      projectType: 'slides',
      design: '',
      connectors: [],
      mcpConnectionIds: [],
      links: [],
      attachments: [],
    },
  });
});

test('gallery seeds append once, update preferences and focus, clear stale errors and defer while busy', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  submit(f);
  await until(() => f.document.querySelector('[role="alert"]'));
  f.update({
    seed: {
      id: 1,
      idea: 'Une galerie photographique',
      projectType: 'website',
      design: 'Éditorial',
    },
  });
  await until(
    () =>
      idea(f).value === 'Une galerie photographique' && !f.document.querySelector('[role="alert"]'),
  );
  await until(() => f.document.activeElement === idea(f));
  type(f, '[name="idea"]', 'Mon brief existant');
  await setTimeout(10);
  f.update({
    seed: { id: 2, idea: 'Un second angle', projectType: 'prototype', design: 'Chaleureux' },
  });
  await until(() => idea(f).value === 'Mon brief existant\n\nUn second angle');
  f.update({});
  await setTimeout(10);
  assert.equal(idea(f).value, 'Mon brief existant\n\nUn second angle');
  f.update({
    operation: { ...idle, phase: 'creating' },
    seed: { id: 3, idea: 'Une suite', projectType: 'app' },
  });
  await until(() => idea(f).disabled);
  assert.equal(idea(f).value, 'Mon brief existant\n\nUn second angle');
  f.update({ operation: idle });
  await until(() => idea(f).value.endsWith('\n\nUne suite'));
  submit(f);
  assert.equal(f.submissions[0].launch.projectType, 'app');
  assert.equal(f.submissions[0].launch.design, 'Chaleureux');
});

test('one native options dialog keeps panel input, restores focus on Escape and transmits the selected context', async (t) => {
  const f = fixture(t);
  const trigger = await openOptions(f);
  assert.equal(f.document.querySelectorAll('dialog').length, 1);
  assert.equal(f.document.activeElement.id, 'composer-options-title');
  type(f, '#composer-reference-link', 'https://example.com/inspiration');
  await setTimeout(10);
  button(f, 'Ajouter').click();
  await until(() => f.document.querySelectorAll('.composer-reference-url').length === 1);
  selectFiles(f, [
    new f.window.File(['Une référence écrite'], 'brief.md', { type: 'text/markdown' }),
  ]);
  await until(() => f.document.querySelector('[aria-label="Fichiers joints"]'));
  button(f, 'Design', dialog(f)).click();
  await setTimeout(10);
  f.document.querySelector('.composer-style').click();
  button(f, 'Projet', dialog(f)).click();
  await setTimeout(10);
  type(f, '[name="project-name"]', 'Mon projet');
  button(f, 'Outils et services', dialog(f)).click();
  await until(() => f.document.querySelector('[value="resend"]'));
  f.document.querySelector('[value="resend"]').click();
  await setTimeout(10);
  const cancel = new f.window.Event('cancel', { cancelable: true });
  dialog(f).dispatchEvent(cancel);
  if (!cancel.defaultPrevented) dialog(f).close();
  await until(() => !dialog(f).open);
  assert.equal(f.document.activeElement, trigger);
  type(f, '[name="idea"]', 'Une demande concrète');
  type(f, '[name="launch-action"]', 'plan');
  await setTimeout(10);
  submit(f);
  const input = f.submissions[0];
  assert.equal(input.name, 'Mon projet');
  assert.equal(input.launch.action, 'plan');
  assert.match(input.launch.design, /^Sobre et précis\./);
  assert.deepEqual(input.launch.connectors, ['resend']);
  assert.deepEqual(input.launch.links, ['https://example.com/inspiration']);
  assert.deepEqual(input.launch.attachments, [
    {
      name: 'brief.md',
      mime: 'text/markdown',
      base64: Buffer.from('Une référence écrite').toString('base64'),
    },
  ]);
  button(f, 'Retirer Resend').focus();
  button(f, 'Retirer Resend').click();
  await until(() => !button(f, 'Retirer Resend'));
  assert.equal(f.document.activeElement, idea(f));
});

test('catalog failure is retryable and tool search, categories and selection survive panel changes', async (t) => {
  let unavailable = true;
  const f = fixture(t, {
    fetcher: async () => {
      if (unavailable) throw new Error('Catalogue hors ligne');
      return reply(catalog);
    },
  });
  await openOptions(f, 'tools');
  await until(() => button(f, 'Réessayer le catalogue'));
  assert.match(dialog(f).querySelector('[role="alert"]').textContent, /Chargement impossible/);
  unavailable = false;
  button(f, 'Réessayer le catalogue').click();
  await until(() => f.document.querySelectorAll('.composer-tool-option').length === 2);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].url, '/api/home/catalog');
  assert.equal(f.calls[0].init.credentials, 'same-origin');
  assert.equal(f.calls[0].init.method, undefined);
  f.document.querySelector('[value="supabase"]').click();
  type(f, '[name="composer-tool-search"]', 'donnees');
  await until(() => f.document.querySelectorAll('.composer-tool-option').length === 1);
  assert.match(f.document.querySelector('.composer-tool-option').textContent, /Supabase/);
  type(f, 'select[aria-label="Catégorie des outils"]', 'email');
  await until(() => dialog(f).textContent.includes('Aucun outil ne correspond'));
  button(f, 'Références', dialog(f)).click();
  button(f, 'Outils et services', dialog(f)).click();
  await setTimeout(10);
  assert.equal(f.document.querySelector('[name="composer-tool-search"]').value, 'donnees');
  assert.equal(
    f.document.querySelector('select[aria-label="Catégorie des outils"]').value,
    'email',
  );
  type(f, 'select[aria-label="Catégorie des outils"]', 'all');
  await until(() => f.document.querySelector('[value="supabase"]'));
  assert.equal(f.document.querySelector('[value="supabase"]').checked, true);
  assert.equal(f.calls.length, 2);
});

test('references reject unsafe links and oversized files without removing accepted context', async (t) => {
  const f = fixture(t);
  await openOptions(f);
  type(f, '#composer-reference-link', 'https://user:secret@example.com');
  await setTimeout(10);
  button(f, 'Ajouter').click();
  await until(() => dialog(f).textContent.includes('sans identifiant ni mot de passe'));
  assert.equal(
    f.document.querySelector('#composer-reference-link').value,
    'https://user:secret@example.com',
  );
  type(f, '#composer-reference-link', 'https://example.com');
  await setTimeout(10);
  button(f, 'Ajouter').click();
  await until(() => f.document.querySelector('.composer-reference-url'));
  selectFiles(f, [new f.window.File(['notes'], 'notes.txt', { type: 'text/plain' })]);
  await until(() => f.document.querySelector('[aria-label="Fichiers joints"] li'));
  selectFiles(f, [
    new f.window.File([new Uint8Array(2 * 1024 * 1024 + 1)], 'too-large.png', {
      type: 'image/png',
    }),
  ]);
  await until(() => dialog(f).textContent.includes('entre 1 octet et 2 Mio'));
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 1);
  assert.match(f.document.querySelector('[aria-label="Fichiers joints"]').textContent, /notes.txt/);
  assert.equal(
    f.document.querySelector('.composer-reference-url').textContent,
    'https://example.com/',
  );
  selectFiles(f, [
    new f.window.File(['valid'], 'valid.txt', { type: 'text/plain' }),
    new f.window.File(['bad'], 'script.js', { type: 'application/javascript' }),
  ]);
  await until(() => dialog(f).textContent.includes('Choisissez une image'));
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 1);
});

test('pending file reads disable edits and submission, apply one batch, and abort on disposal', async (t) => {
  const readers = [];
  class DeferredReader {
    constructor() {
      readers.push(this);
      this.aborted = false;
    }
    readAsDataURL(file) {
      this.file = file;
    }
    abort() {
      this.aborted = true;
      this.onabort?.();
    }
    finish(value) {
      this.result = 'data:text/plain;base64,' + Buffer.from(value).toString('base64');
      this.onload?.();
    }
  }
  const f = fixture(t, { reader: DeferredReader });
  await openOptions(f);
  selectFiles(f, [
    new f.window.File(['one'], 'one.txt', { type: 'text/plain' }),
    new f.window.File(['two'], 'two.txt', { type: 'text/plain' }),
  ]);
  await until(() => idea(f).disabled);
  assert.equal(readers.length, 2);
  assert.equal(f.document.querySelector('[name="reference-link"]').disabled, true);
  submit(f);
  assert.equal(f.submissions.length, 0);
  readers[0].finish('one');
  await setTimeout(10);
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 0);
  readers[1].finish('two');
  await until(() => !idea(f).disabled);
  assert.equal(f.document.querySelectorAll('[aria-label="Fichiers joints"] li').length, 2);
  selectFiles(f, [new f.window.File(['three'], 'three.txt', { type: 'text/plain' })]);
  await until(() => readers.length === 3);
  f.dispose();
  assert.equal(readers[2].aborted, true);
});

test('busy state alone cannot suppress the unsaved guard and errors retain the draft until disposal', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  assert.equal(beforeUnload(f), false);
  type(f, '[name="idea"]', 'Un projet à conserver');
  await until(() => beforeUnload(f));
  f.update({ operation: { ...idle, phase: 'opening' } });
  await until(() => idea(f).disabled);
  assert.equal(beforeUnload(f), true);
  assert.equal(button(f, 'Ajouter des références').disabled, true);
  f.update({ operation: { ...idle, error: 'Ouverture impossible' } });
  await until(() => !idea(f).disabled && beforeUnload(f));
  assert.equal(idea(f).value, 'Un projet à conserver');
  assert.match(f.document.querySelector('[role="alert"]').textContent, /Ouverture impossible/);
  f.dispose();
  assert.equal(beforeUnload(f), false);
});

test('the tool picker caps preferences at twelve and preserves the selection after rejection', async (t) => {
  const options = Array.from({ length: 13 }, (_, index) => ({
    id: `tool-${index}`,
    title: `Outil ${index}`,
    description: 'Service proposé',
    capabilities: ['email'],
  }));
  const f = fixture(t, { fetcher: async () => reply({ ...catalog, options }) });
  await openOptions(f, 'tools');
  await until(() => f.document.querySelectorAll('[name="preferred-connector"]').length === 13);
  for (let index = 0; index < 12; index++) {
    f.document.querySelector(`[value="tool-${index}"]`).click();
    await until(
      () =>
        f.document.querySelectorAll('[name="preferred-connector"]:checked').length === index + 1,
    );
  }
  f.document.querySelector('[value="tool-12"]').click();
  await until(() => dialog(f).textContent.includes('au maximum 12 outils'));
  assert.equal(f.document.querySelectorAll('[name="preferred-connector"]:checked').length, 12);
  assert.equal(f.document.querySelector('[value="tool-12"]').checked, false);
  f.document.querySelector('[value="tool-0"]').click();
  await until(
    () => f.document.querySelectorAll('[name="preferred-connector"]:checked').length === 11,
  );
  f.document.querySelector('[value="tool-12"]').click();
  await until(() => f.document.querySelector('[value="tool-12"]').checked);
});

test('an overlong gallery addition leaves the original brief and project preferences intact', async (t) => {
  const f = fixture(t);
  await until(() => idea(f));
  type(f, '[name="idea"]', 'a'.repeat(16000));
  await setTimeout(10);
  f.update({
    seed: { id: 1, idea: 'Une idée supplémentaire', projectType: 'slides', design: 'Audacieux' },
  });
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(idea(f).value, 'a'.repeat(16000));
  assert.match(
    f.document.querySelector('[role="alert"]').textContent,
    /dépasse la place disponible/,
  );
  assert.equal(button(f, 'Site web').getAttribute('aria-pressed'), 'true');
  assert.equal(button(f, 'Retirer la direction visuelle'), undefined);
});
