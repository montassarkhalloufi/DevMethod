import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { describeComparison, comparisonURL } from '../scripts/studio/public/comparison-view.js';
import { createProposalController } from '../scripts/studio/public/proposal-controller.js';

const bundle = await build({
  stdin: {
    contents: `export { mountDecisionWidget } from './decision-widget';`,
    resolveDir: path.resolve('studio-ui/src'),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'DecisionTest',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"test"' },
});

async function until(predicate) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected decision state was not rendered');
}

const proposal = () => ({
  id: 'decision',
  topic: 'Retour de confirmation',
  question: 'Comment montrer la confirmation ?',
  stage: 'implementation',
  baseRevision: 'current',
  selectedOptionId: null,
  recommendation: { optionId: 'inline', reason: 'Conserver le contexte.' },
  options: [
    {
      id: 'inline',
      title: 'Dans la page',
      consequences: ['Le formulaire reste visible.'],
      preview: { kind: 'image', referenceId: 'image', status: 'simulation' },
    },
    { id: 'page', title: 'Page dédiée', consequences: ['Une navigation supplémentaire.'] },
  ],
});

async function fixture(t, options = {}) {
  const dom = new JSDOM('<main id="root"></main>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  if (options.storage)
    for (const [key, value] of options.storage) dom.window.localStorage.setItem(key, value);
  if (options.blockStorage)
    Object.defineProperty(dom.window, 'localStorage', {
      get() {
        throw new Error('Storage denied');
      },
    });
  dom.window.eval(bundle.outputFiles[0].text);
  const handle = dom.window.DecisionTest.mountDecisionWidget(
    dom.window.document.getElementById('root'),
  );
  const calls = [];
  const props = {
    proposal: { ...proposal(), ...options.proposal },
    draftScope: options.scope ?? '/fixture/project-a',
    activeRevision: 'current',
    execution: 'host',
    actions: {
      select: async (_id, optionId) => {
        calls.push(['select', optionId]);
        props.proposal = { ...props.proposal, selectedOptionId: optionId };
        handle.update(props);
      },
      approve: async (...input) => {
        calls.push(['approve', ...input]);
        throw new Error('Conflit : réexaminer la proposition.');
      },
    },
  };
  handle.update(props);
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  await until(() => dom.window.document.querySelector('input'));
  return { dom, handle, props, calls, document: dom.window.document };
}

function typeReason(f, value) {
  const node = f.document.querySelector('textarea');
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLTextAreaElement.prototype, 'value').set.call(
    node,
    value,
  );
  node.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
}

function storedReasons(f) {
  return Object.entries(f.dom.window.localStorage);
}

test('a decision reason survives remount and page reload only for its project, proposal and base without approving', async (t) => {
  const f = await fixture(t);
  typeReason(f, 'Conserver le contexte de cette personne.');
  const saved = storedReasons(f);
  assert.equal(saved.length, 1);
  f.handle.dispose();
  const reloaded = await fixture(t, { storage: saved });
  assert.equal(
    reloaded.document.querySelector('textarea').value,
    'Conserver le contexte de cette personne.',
  );
  assert.deepEqual(reloaded.calls, []);
  assert.equal(reloaded.document.querySelector('input').checked, false);
  for (const options of [
    { scope: '/fixture/project-b' },
    { proposal: { id: 'another-proposal' } },
    { proposal: { baseRevision: 'another-base' } },
  ]) {
    const isolated = await fixture(t, { ...options, storage: saved });
    assert.equal(isolated.document.querySelector('textarea').value, '');
    assert.deepEqual(storedReasons(isolated), saved);
    assert.deepEqual(isolated.calls, []);
  }
  reloaded.props.draftScope = '/fixture/project-b';
  reloaded.handle.update(reloaded.props);
  await until(() => reloaded.document.querySelector('textarea').value === '');
  typeReason(reloaded, 'Une raison propre au deuxième projet.');
  reloaded.props.draftScope = '/fixture/project-a';
  reloaded.handle.update(reloaded.props);
  await until(
    () =>
      reloaded.document.querySelector('textarea').value ===
      'Conserver le contexte de cette personne.',
  );
  assert.equal(storedReasons(reloaded).length, 2);
  assert.deepEqual(reloaded.calls, []);
});

test('local reasons are bounded and missing project identity never falls back to a shared storage key', async (t) => {
  const f = await fixture(t);
  typeReason(f, 'x'.repeat(4001));
  await until(() => f.document.querySelector('textarea').value.length === 4000);
  const saved = storedReasons(f);
  assert.equal(JSON.parse(saved[0][1]).text.length, 4000);
  f.props.draftScope = undefined;
  f.handle.update(f.props);
  await until(() => f.document.querySelector('textarea').value === '');
  typeReason(f, 'Sans identité de projet, mémoire seulement.');
  await until(() => f.document.body.textContent.includes('stockage local'));
  assert.deepEqual(storedReasons(f), saved);
  assert.deepEqual(f.calls, []);
});

test('selection and rejected approval preserve the saved reason; only successful approval clears its submitted draft', async (t) => {
  const f = await fixture(t);
  typeReason(f, 'Raison durable');
  f.document.querySelector('input').click();
  await until(() => !f.document.querySelector('button[type=submit]').disabled);
  assert.equal(storedReasons(f).length, 1);
  f.document.querySelector('button[type=submit]').click();
  await until(() => f.document.querySelector('[role=alert]'));
  assert.match(storedReasons(f)[0][1], /Raison durable/);
  f.props.actions.approve = async () => {
    f.calls.push(['approved']);
  };
  f.handle.update(f.props);
  await setTimeout(5);
  f.document.querySelector('button[type=submit]').click();
  await until(() => f.calls.some(([action]) => action === 'approved'));
  await until(() => f.document.querySelector('textarea').value === '');
  assert.deepEqual(storedReasons(f), []);
});

test('a reason typed while approval is pending survives its completion and storage failure is explicit', async (t) => {
  const f = await fixture(t, { proposal: { selectedOptionId: 'inline' } });
  let finish;
  f.props.actions.approve = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  f.handle.update(f.props);
  typeReason(f, 'Première raison');
  await setTimeout(5);
  f.document.querySelector('button[type=submit]').click();
  await until(() => finish);
  typeReason(f, 'Nouvelle réflexion pendant la réponse');
  finish();
  await until(() => !f.document.querySelector('button[type=submit]').disabled);
  assert.equal(f.document.querySelector('textarea').value, 'Nouvelle réflexion pendant la réponse');
  assert.match(storedReasons(f)[0][1], /Nouvelle réflexion/);
  const blocked = await fixture(t, { blockStorage: true });
  typeReason(blocked, 'Saisie conservée en mémoire');
  await until(() => blocked.document.body.textContent.includes('stockage local'));
  assert.equal(blocked.document.querySelector('textarea').value, 'Saisie conservée en mémoire');
  assert.deepEqual(blocked.calls, []);
});

test('selecting a visual option does not approve or apply it; failed approval preserves the reason', async (t) => {
  const f = await fixture(t);
  f.document.querySelector('input').click();
  await until(
    () =>
      f.document.querySelector('input').checked &&
      !f.document.querySelector('button[type=submit]').disabled,
  );
  assert.deepEqual(f.calls, [['select', 'inline']]);
  const reason = f.document.querySelector('textarea');
  Object.getOwnPropertyDescriptor(f.dom.window.HTMLTextAreaElement.prototype, 'value').set.call(
    reason,
    'Garder le contexte',
  );
  reason.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  f.document.querySelector('button[type=submit]').click();
  await until(() => f.document.querySelector('[role=alert]'));
  assert.match(f.document.querySelector('[role=alert]').textContent, /Conflit/);
  assert.equal(reason.value, 'Garder le contexte');
  assert.equal(f.calls.filter(([action]) => action === 'approve').length, 1);
  assert.match(f.document.body.textContent, /préparer la réalisation/);
  assert.doesNotMatch(f.document.body.textContent, /Tests réussis/);
});

test('a stale base disables approval and a visual simulation never says implemented rendering was validated', async (t) => {
  const f = await fixture(t);
  f.props.proposal = { ...f.props.proposal, stage: 'visual', selectedOptionId: 'inline' };
  f.handle.update(f.props);
  await until(() => /Retenir cette proposition visuelle/.test(f.document.body.textContent));
  f.props.activeRevision = 'new';
  f.handle.update(f.props);
  await until(() => f.document.querySelector('button[type=submit]').disabled);
  assert.match(f.document.body.textContent, /version actuelle a changé/);
  assert.equal(f.calls.length, 0);
});

test('comparison binds checks to the exact revision and leaves image simulations untested', () => {
  const item = proposal();
  item.selectedOptionId = 'inline';
  const state = {
    activeRevision: 'current',
    checks: [{ revisionId: 'current', status: 'passed' }],
  };
  assert.match(
    describeComparison(state, item, 'proposal').label,
    /Simulation visuelle.*Aucun test/,
  );
  item.options[0].preview = {
    kind: 'revision',
    revisionId: 'candidate',
    status: 'implemented',
    route: '/?item=repair#booking',
    element: { selector: '#booking', text: 'Inscription' },
  };
  const after = describeComparison(state, item, 'proposal');
  assert.match(after.label, /non appliquée.*Aucun contrôle/);
  assert.equal(describeComparison(state, item, 'before').revisionId, 'current');
  assert.equal(describeComparison(state, item, 'before').element.selector, '#booking');
  assert.equal(
    comparisonURL('http://127.0.0.1:4331', 'candidate', after.route),
    'http://127.0.0.1:4331/revisions/candidate/index.html?item=repair#booking',
  );
  assert.throws(
    () => comparisonURL('http://127.0.0.1:4331', 'candidate', '//example.com'),
    /invalide/,
  );
});

test('optional explanation produces an explicit neutral action trace rather than a rejected empty reason', async (t) => {
  const dom = new JSDOM(
    '<aside id="discussion"><details id="activity"></details><div id="active-decision"></div></aside>',
  );
  let props;
  const calls = [];
  const controller = createProposalController({
    document: dom.window.document,
    change: async (route, input) => {
      calls.push({ route, input });
      return {};
    },
    showComparison: () => {},
    loadWidget: async () => ({
      mountDecisionWidget: () => ({
        update: (value) => {
          props = value;
        },
        dispose: () => {},
      }),
    }),
  });
  t.after(() => {
    controller.dispose();
    dom.window.close();
  });
  controller.update(
    { proposals: [proposal()], activeRevision: 'current', revisions: [], jobs: [] },
    {},
  );
  await until(() => props);
  await props.actions.approve('decision', 'inline', '   ');
  assert.deepEqual(calls[0], {
    route: 'proposals/approve',
    input: {
      proposalId: 'decision',
      optionId: 'inline',
      reason: 'Option approuvée explicitement ; aucune justification ajoutée.',
    },
  });
});

test('suspending comparison survives refresh without resolving the proposal, and a successful new selection reopens it', async (t) => {
  const dom = new JSDOM(
    '<aside id="discussion"><details id="activity"></details><div id="active-decision"></div></aside>',
  );
  const item = { ...proposal(), selectedOptionId: 'inline' };
  const state = { proposals: [item], activeRevision: 'current', revisions: [], jobs: [] };
  const calls = [];
  const presentations = [];
  let props;
  let fail = false;
  const controller = createProposalController({
    document: dom.window.document,
    change: async (route, input) => {
      calls.push({ route, input });
      if (fail) return undefined;
      item.selectedOptionId = input.optionId;
      controller.update(state, {});
      return { state };
    },
    showComparison: (active, side, available) =>
      presentations.push({ active: active?.id || null, side, available: available?.id || null }),
    loadWidget: async () => ({
      mountDecisionWidget: () => ({
        update: (value) => {
          props = value;
        },
        dispose() {},
      }),
    }),
  });
  t.after(() => {
    controller.dispose();
    dom.window.close();
  });
  controller.update(state, {});
  await until(() => props);
  controller.suspend();
  controller.update(state, {});
  assert.deepEqual(presentations.at(-1), { active: null, side: 'proposal', available: 'decision' });
  assert.equal(item.selectedOptionId, 'inline');
  assert.equal(item.resolution, undefined);
  assert.deepEqual(calls, []);
  fail = true;
  await assert.rejects(props.actions.select('decision', 'page'), /pas été enregistrée/);
  controller.update(state, {});
  assert.equal(presentations.at(-1).active, null);
  fail = false;
  await props.actions.select('decision', 'page');
  assert.deepEqual(presentations.at(-1), {
    active: 'decision',
    side: 'proposal',
    available: 'decision',
  });
  assert.equal(item.selectedOptionId, 'page');
  assert.ok(calls.every((call) => call.route === 'proposals/select'));
});
