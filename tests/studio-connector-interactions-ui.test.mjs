import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, cancelJob } from '../scripts/studio/domain.mjs';
import { createConnectorInteractions } from '../scripts/studio/connector-interactions.mjs';
import { createConnectorGuideDrafts } from '../scripts/studio/connector-interactions-drafts.mjs';
import { readConnectorGuides, prepareConnectorGuide } from '../scripts/studio/connector-guides.mjs';

const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: 'tsx',
    contents: `
  import {createRoot} from 'react-dom/client';
  import {ConnectorGuide,ConnectorInteractions,useGuideDrafts,useGuidePreparation,useConnectorGuides} from './studio-ui/src/features/connectors/index.ts';
  import {useComposerGuides} from './studio-ui/src/features/home/hooks/useComposerGuides.ts';
  import {useProjectGuides} from './studio-ui/src/features/mcp/hooks/useProjectGuides.ts';
  export {GuideDraftSession} from './studio-ui/src/features/connectors/model/guide-draft-session.ts';
  function Integrated({guide}) {
    return <><button onClick={()=>guide.open('notion')}>Ouvrir Notion</button>
      {guide.activeId && guide.definition ? <ConnectorGuide definition={guide.definition} draft={guide.input} preparation={guide.preparation}
        preparing={guide.preparing} step={guide.step} onStepChange={guide.setStep} onChange={guide.change} onPrepare={guide.prepare}/>:null}
      <output>{guide.selected?.length ?? 0} sélectionné</output></>;
  }
  function Home() { return <Integrated guide={useComposerGuides({busy:false,selected:[],onApply:()=>true,onEdit:()=>{}})}/>; }
  function Project() { return <Integrated guide={useProjectGuides()}/>; }
  function Draft() {
    const drafts=useGuideDrafts(), catalog=useConnectorGuides(), validation=useGuidePreparation();
    const definition=catalog.guides.find(item=>item.optionId==='notion'), draft=drafts.drafts.notion;
    return <>{drafts.error?<p role="alert">{drafts.error}<button onClick={drafts.retry}>Réessayer sauvegarde</button></p>:null}
      {definition ? <ConnectorGuide definition={definition} draft={draft?.input ?? null} preparation={validation.preparation}
        preparing={validation.loading} step={draft?.step} onStepChange={step=>drafts.edit('notion',draft?.input??null,step)}
        onChange={input=>drafts.edit('notion',input,draft?.step??0)} onPrepare={validation.prepare} /> : null}</>;
  }
  export function mount(host,jobId,mode) {
    const root=createRoot(host); root.render(jobId ? <ConnectorInteractions jobId={jobId}/> : mode==='home'?<Home/>:mode==='project'?<Project/>:<Draft/>);
    return ()=>root.unmount();
  }
`,
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'InteractionsTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate, wait = 1500) {
  const limit = Date.now() + wait;
  while (Date.now() < limit) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected persisted questionnaire state');
}

const button = (f, text) =>
  [...f.document.querySelectorAll('button')].find((node) => node.textContent.includes(text));
const choose = (f, value) => {
  const input = [...f.document.querySelectorAll('label')]
    .find((label) => label.textContent.includes(value))
    ?.querySelector('input');
  assert.ok(input, 'Choice exists: ' + value);
  input.click();
};

function fixture(t, { mission = false, mode } = {}) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-interactions-ui-'));
  const store = createStudioStore(directory),
    drafts = createConnectorGuideDrafts(directory, { scope: 'project' });
  const interactions = createConnectorInteractions(store);
  store.commit(store.read().version, (state) =>
    queueRequest(state, { request: 'Questionnaire UI fixture' }),
  );
  const { job } = createJobs(store).claim('UI fixture');
  if (mission)
    interactions.request({
      jobId: job.id,
      eventId: 'request-1',
      optionId: 'notion',
      guideVersion: 1,
      flowId: 'notion-context',
    });
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const state = { fail: false, posts: [] };
  dom.window.fetch = async (url, init) => {
    const input = init?.body && JSON.parse(init.body);
    try {
      if (init?.method === 'POST') {
        state.posts.push({ url, input });
        if (state.fail && url !== '/api/connectors/guides/prepare')
          throw new Error('fixture offline');
      }
      let result;
      if (url === '/api/connectors/guides') result = readConnectorGuides();
      else if (url === '/api/connectors/guides/prepare') result = prepareConnectorGuide(input);
      else if (url === '/api/connectors/guide-drafts')
        result = input ? drafts.save(input) : drafts.list();
      else if (url === '/api/connectors/interactions/draft') result = interactions.saveDraft(input);
      else if (url === '/api/connectors/interactions/answer') result = interactions.answer(input);
      else if (url.startsWith('/api/connectors/interactions?')) result = interactions.list(job.id);
      else throw new Error('Unexpected fixture route');
      return { ok: true, json: async () => result };
    } catch (error) {
      return { ok: false, json: async () => ({ error: error.message }) };
    }
  };
  dom.window.eval(bundle.outputFiles[0].text + '\nwindow.InteractionsTest=InteractionsTest;');
  let dispose = dom.window.InteractionsTest.mount(
    dom.window.document.getElementById('root'),
    mission ? job.id : null,
    mode,
  );
  t.after(() => {
    dispose();
    dom.window.close();
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    dom,
    document: dom.window.document,
    state,
    drafts,
    interactions,
    store,
    job,
    reload() {
      dispose();
      dispose = dom.window.InteractionsTest.mount(
        dom.window.document.getElementById('root'),
        mission ? job.id : null,
        mode,
      );
    },
  };
}

test('partial wizard choices and current step survive an actual unmount/reload without applying or connecting', async (t) => {
  const f = fixture(t);
  await until(() => button(f, 'Préciser'));
  choose(f, 'Contexte de l’assistant');
  await until(() => f.drafts.list().drafts.length === 1);
  button(f, 'Préciser').click();
  await until(() => f.document.querySelector('input[type="checkbox"]'));
  choose(f, 'Consulter du contenu');
  await until(() => f.drafts.list().drafts[0].input.answers.actions?.length === 1);
  f.reload();
  await until(() => f.document.querySelector('input[type="checkbox"]')?.checked);
  assert.equal(f.drafts.list().drafts[0].step, 1);
  assert.equal(
    f.state.posts.some((post) => post.url.endsWith('/prepare') || post.url.includes('/mcp/')),
    false,
  );
});

test('failed saves preserve local choices and explicit retry persists them with current server version', async (t) => {
  const f = fixture(t);
  await until(() => button(f, 'Préciser'));
  f.state.fail = true;
  choose(f, 'Contexte de l’assistant');
  await until(() => button(f, 'Réessayer sauvegarde'));
  assert.equal(f.document.querySelector('input[type="radio"]').checked, true);
  assert.deepEqual(f.drafts.list().drafts, []);
  f.state.fail = false;
  button(f, 'Réessayer sauvegarde').click();
  await until(() => f.drafts.list().drafts.length === 1);
  assert.equal(f.drafts.list().drafts[0].input.flowId, 'notion-context');
});

for (const mode of ['home', 'project'])
  test(`${mode} composer restores partial answers and step without selecting the service`, async (t) => {
    const f = fixture(t, { mode });
    await until(() => button(f, 'Ouvrir Notion'));
    button(f, 'Ouvrir Notion').click();
    await until(() => button(f, 'Préciser'));
    choose(f, 'Contexte de l’assistant');
    await until(() => f.drafts.list().drafts.length === 1);
    button(f, 'Préciser').click();
    await until(() => f.document.querySelector('input[type="checkbox"]'));
    choose(f, 'Consulter du contenu');
    await until(() => f.drafts.list().drafts[0].input.answers.actions?.length === 1);
    f.reload();
    await until(() => button(f, 'Ouvrir Notion'));
    button(f, 'Ouvrir Notion').click();
    await until(() => f.document.querySelector('input[type="checkbox"]')?.checked);
    assert.equal(f.document.querySelector('output').textContent, '0 sélectionné');
    assert.equal(
      f.state.posts.some((post) => post.url.endsWith('/prepare') || post.url.includes('/mcp/')),
      false,
    );
  });

test('inline mission question resumes, previews then sends only after explicit confirmation', async (t) => {
  const f = fixture(t, { mission: true });
  await until(() => f.document.querySelector('input[type="checkbox"]'));
  choose(f, 'Consulter du contenu');
  await until(() => f.interactions.list().interactions[0].input.answers.actions?.length === 1);
  f.reload();
  await until(() => f.document.querySelector('input[type="checkbox"]')?.checked);
  button(f, 'Vérifier la préparation').click();
  await until(() => button(f, 'Transmettre mes réponses'));
  assert.equal(f.interactions.list().interactions[0].status, 'pending');
  button(f, 'Transmettre mes réponses').click();
  await until(() => f.document.body.textContent.includes('Réponses transmises à l’agent'));
  assert.equal(f.interactions.list().interactions[0].status, 'answered');
  assert.equal(f.state.posts.filter((post) => post.url.endsWith('/answer')).length, 1);
  assert.match(f.document.body.textContent, /À configurer/);
  assert.doesNotMatch(f.document.body.textContent, /Connexion MCP observée/);
  f.reload();
  await until(() => f.document.body.textContent.includes('Réponses transmises à l’agent'));
  assert.equal(button(f, 'Transmettre mes réponses'), undefined);
});

test('pending error keeps answers visible and terminal cancellation disables transmission', async (t) => {
  const f = fixture(t, { mission: true });
  await until(() => f.document.querySelector('input[type="checkbox"]'));
  f.state.fail = true;
  choose(f, 'Consulter du contenu');
  await until(() => button(f, 'Réessayer l’enregistrement'));
  assert.equal(f.document.querySelector('input[type="checkbox"]').checked, true);
  f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: f.job.id }));
  await until(() => f.document.body.textContent.includes('Questionnaire annulé'), 3000);
  assert.equal(f.document.querySelector('input[type="checkbox"]').checked, true);
  assert.equal(button(f, 'Transmettre mes réponses'), undefined);
  assert.equal(
    f.state.posts.some((post) => post.url.endsWith('/answer')),
    false,
  );
});

for (const readArrival of ['after-save', 'during-save'])
  test(`delayed draft read ${readArrival} preserves newer choices and the next write version`, async (t) => {
    const dom = new JSDOM('', { url: 'http://localhost', runScripts: 'outside-only' });
    const input = {
      optionId: 'notion',
      guideVersion: 1,
      flowId: 'notion-context',
      answers: { actions: ['read-content'] },
    };
    const changed = { ...input, answers: { actions: ['prepare-changes'] } };
    const scopeId = 'project:' + 'a'.repeat(24);
    const first = {
      optionId: 'notion',
      input,
      version: 1,
      step: 1,
      updatedAt: '2026-09-17T08:00:00.000Z',
    };
    const saved = { ...first, input: changed, version: 2 };
    const reply = (value) => ({ ok: true, json: async () => value });
    const posts = [];
    let reads = 0,
      releaseRead,
      releaseWrite;
    const oldRead = new Promise((resolve) => {
      releaseRead = () => resolve(reply({ scopeId, drafts: [first] }));
    });
    const write = new Promise((resolve) => {
      releaseWrite = () => resolve(reply({ scopeId, draft: saved }));
    });
    dom.window.fetch = async (_url, options) => {
      if (options.method !== 'POST')
        return ++reads === 1 ? reply({ scopeId, drafts: [first] }) : oldRead;
      const post = JSON.parse(options.body);
      posts.push(post);
      return posts.length === 1
        ? write
        : reply({ scopeId, draft: { ...saved, input: post.input, step: post.step, version: 3 } });
    };
    dom.window.eval(bundle.outputFiles[0].text + '\nwindow.InteractionsTest=InteractionsTest;');
    const session = new dom.window.InteractionsTest.GuideDraftSession();
    t.after(() => {
      session.dispose();
      dom.window.close();
    });
    await session.load();
    const reading = session.load();
    session.edit('notion', changed, 1);
    if (readArrival === 'during-save') {
      releaseRead();
      await reading;
      assert.deepEqual(
        session.snapshot().drafts.notion.input,
        changed,
        'an active write keeps local choices',
      );
    }
    releaseWrite();
    await until(() => !session.snapshot().saving);
    releaseRead();
    await reading;
    assert.equal(
      session.snapshot().drafts.notion.version,
      2,
      'an older GET cannot replace saved version 2',
    );
    assert.deepEqual(session.snapshot().drafts.notion.input, changed);
    session.edit('notion', changed, 2);
    await until(() => posts.length === 2 && !session.snapshot().saving);
    assert.equal(posts[1].expectedVersion, 2, 'the internal CAS version stays monotonic too');
  });
