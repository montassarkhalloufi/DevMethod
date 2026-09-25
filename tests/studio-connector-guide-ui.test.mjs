import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { prepareConnectorGuide, readConnectorGuides } from '../scripts/studio/connector-guides.mjs';

const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: 'tsx',
    contents: `
    import {useEffect,useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {ConnectorGuide,useConnectorGuides,useGuidePreparation} from './studio-ui/src/features/connectors/index.ts';
    export {readGuideDefinitions,readGuidePreparation} from './studio-ui/src/features/connectors/model/guides.ts';
    export function mount(host, options={}) {
      const root=createRoot(host), observed={};
      function Harness() {
        const catalog=useConnectorGuides();
        const request=useGuidePreparation();
        const [draft,setDraft]=useState(options.input || null);
        const definition=catalog.guides.find(item=>item.optionId===(options.optionId || 'slack'));
        useEffect(()=>{Object.assign(observed,{catalog,request,draft});});
        return <>
          {catalog.error ? <p role="alert">{catalog.error}</p> : null}
          <button onClick={catalog.refresh}>Relire les guides</button>
          {definition ? <ConnectorGuide definition={definition} draft={draft} preparation={request.preparation}
            preparing={request.loading} error={request.error} onChange={value=>{request.reset();setDraft(value);}}
            onPrepare={request.prepare} onApply={options.onApply} applyLabel="Ajouter au projet"/> : null}
        </>;
      }
      root.render(<Harness/>);
      return {state:()=>observed,dispose:()=>root.unmount()};
    }
  `,
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'GuideTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

const reply = (value, ok = true) => ({ ok, json: async () => value });
const input = (audience = 'selected-public-channels') => ({
  optionId: 'slack',
  guideVersion: 1,
  flowId: 'slack-bot',
  answers: { actions: ['send-messages'], audience },
});

async function until(predicate) {
  for (let i = 0; i < 150; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected guide state not reached');
}

function fixture(t, fetcher, options = {}) {
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.fetch = fetcher;
  dom.window.eval(bundle.outputFiles[0].text + '\nwindow.GuideTest=GuideTest;');
  const applied = [];
  const handle = dom.window.GuideTest.mount(dom.window.document.getElementById('root'), {
    onApply: (value) => applied.push(value),
    ...options,
  });
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  return { dom, document: dom.window.document, handle, applied };
}

const button = (f, label) =>
  [...f.document.querySelectorAll('button')].find((node) => node.textContent.includes(label));

function choose(f, label) {
  const node = [...f.document.querySelectorAll('label')].find(
    (item) => item.querySelector('strong')?.textContent === label,
  );
  assert.ok(node, `Choice ${label} exists`);
  node.querySelector('input').click();
}

test('guided Slack choices are progressive, keep keyboard focus and render only the server preparation before explicit apply', async (t) => {
  const posts = [];
  const f = fixture(t, async (url, init) => {
    if (init?.method === 'POST') {
      posts.push({ url, input: JSON.parse(init.body) });
      return reply(prepareConnectorGuide(posts.at(-1).input));
    }
    return reply(readConnectorGuides());
  });
  await until(() => button(f, 'Préciser la configuration'));
  assert.equal(
    f.document.activeElement.tagName,
    'H3',
    'Opening the guide reveals its heading even after scrolling the catalogue',
  );
  assert.equal(button(f, 'Préciser la configuration').disabled, true);
  choose(f, 'Un bot pour l’application');
  await until(() => !button(f, 'Préciser la configuration').disabled);
  button(f, 'Préciser la configuration').click();
  await until(() => button(f, 'Vérifier la préparation'));
  assert.equal(f.document.activeElement.tagName, 'H3');
  assert.equal(button(f, 'Vérifier la préparation').disabled, true);
  choose(f, 'Lire l’historique des conversations autorisées');
  await setTimeout(5);
  choose(f, 'Envoyer des messages');
  await setTimeout(5);
  choose(f, 'Canaux privés choisis');
  await until(() => !button(f, 'Vérifier la préparation').disabled);
  assert.equal(posts.length, 0);
  button(f, 'Vérifier la préparation').click();
  button(f, 'Vérifier la préparation').click();
  await until(() => f.document.querySelector('.connector-guide-summary'));
  assert.equal(posts.length, 1, 'Duplicate local clicks share one preparation');
  assert.equal(posts[0].url, '/api/connectors/guides/prepare');
  assert.match(f.document.querySelector('.connector-guide-summary').textContent, /groups:history/);
  assert.match(
    f.document.querySelector('.connector-guide-summary').textContent,
    /Aucun nouvel accès connecté/,
  );
  assert.equal(f.applied.length, 0);
  assert.equal(f.document.querySelector('dialog'), null);
  button(f, 'Ajouter au projet').click();
  assert.equal(f.applied.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(f.applied[0].input.answers.actions)), [
    'send-messages',
    'read-history',
  ]);
});

test('a failed preparation preserves answers and retry; changing flow clears incompatible answers and invalidates the old summary', async (t) => {
  let attempts = 0;
  const f = fixture(
    t,
    async (_url, init) =>
      init?.method === 'POST'
        ? ++attempts === 1
          ? reply({ error: 'Guide modifié. Réessayez.' }, false)
          : reply(prepareConnectorGuide(JSON.parse(init.body)))
        : reply(readConnectorGuides()),
    { input: input() },
  );
  await until(() => button(f, 'Vérifier la préparation'));
  button(f, 'Vérifier la préparation').click();
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.handle.state().draft.answers.audience, 'selected-public-channels');
  button(f, 'Réessayer la préparation').click();
  await until(() => button(f, 'Ajouter au projet'));
  button(f, 'Usage').click();
  await until(() => f.document.querySelector('input[type="radio"]'));
  choose(f, 'Chaque utilisateur connecte son compte');
  await until(() => f.handle.state().draft.flowId === 'slack-app-user');
  assert.deepEqual(JSON.parse(JSON.stringify(f.handle.state().draft.answers)), {});
  assert.equal(f.handle.state().request.preparation, null);
  assert.equal(f.applied.length, 0);
});

test('stale preparation responses, reset and disposal cannot restore previous provider state', async (t) => {
  const pending = [];
  const f = fixture(t, (url, init) =>
    init?.method === 'POST'
      ? new Promise((resolve) => pending.push({ url, init, resolve }))
      : Promise.resolve(reply(readConnectorGuides())),
  );
  await until(() => f.handle.state().request);
  const first = f.handle.state().request.prepare(input());
  const second = f.handle.state().request.prepare(input('selected-private-channels'));
  assert.equal(pending[0].init.signal.aborted, true);
  pending[1].resolve(reply(prepareConnectorGuide(input('selected-private-channels'))));
  assert.equal((await second).input.answers.audience, 'selected-private-channels');
  pending[0].resolve(reply(prepareConnectorGuide(input())));
  assert.equal(await first, null);
  await until(
    () =>
      f.handle.state().request.preparation?.input.answers.audience === 'selected-private-channels',
  );
  const third = f.handle.state().request.prepare(input());
  f.handle.state().request.reset();
  assert.equal(pending[2].init.signal.aborted, true);
  pending[2].resolve(reply(prepareConnectorGuide(input())));
  assert.equal(await third, null);
  await until(() => f.handle.state().request.preparation === null);
  const fourth = f.handle.state().request.prepare(input());
  f.handle.dispose();
  assert.equal(pending[3].init.signal.aborted, true);
  pending[3].resolve(reply(prepareConnectorGuide(input())));
  assert.equal(await fourth, null);
});

test('unreadable catalog and mismatched preparation remain explicit and retryable', async (t) => {
  let reads = 0,
    posts = 0;
  const f = fixture(
    t,
    async (_url, init) => {
      if (init?.method === 'POST') {
        posts++;
        return reply(
          prepareConnectorGuide(
            posts === 1 ? input('selected-private-channels') : JSON.parse(init.body),
          ),
        );
      }
      return reply(++reads === 1 ? { guides: [{ optionId: 'broken' }] } : readConnectorGuides());
    },
    { input: input() },
  );
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.querySelector('.connector-guide'), null);
  button(f, 'Relire les guides').click();
  await until(() => button(f, 'Vérifier la préparation'));
  button(f, 'Vérifier la préparation').click();
  await until(() => f.document.querySelector('.connector-guide-error'));
  assert.match(f.document.querySelector('.connector-guide-error').textContent, /d’autres réponses/);
  assert.equal(button(f, 'Ajouter au projet'), undefined);
  button(f, 'Réessayer la préparation').click();
  await until(() => button(f, 'Ajouter au projet'));
  assert.equal(f.handle.state().draft.answers.audience, 'selected-public-channels');
});

test('response readers refuse executable source links, false connected states and malformed answer types', async (t) => {
  const f = fixture(t, async () => reply(readConnectorGuides()));
  const api = f.dom.window.GuideTest;
  const definitions = readConnectorGuides();
  definitions.guides[0].sources[0].url = 'javascript:alert(1)';
  assert.throws(() => api.readGuideDefinitions(definitions), /illisibles/);
  const prepared = prepareConnectorGuide(input());
  assert.throws(() => api.readGuidePreparation({ ...prepared, access: 'connected' }), /illisible/);
  assert.throws(
    () =>
      api.readGuidePreparation({
        ...prepared,
        input: { ...prepared.input, answers: { actions: 12 } },
      }),
    /illisibles/,
  );
  await until(() => f.document.querySelector('.connector-guide'));
});
