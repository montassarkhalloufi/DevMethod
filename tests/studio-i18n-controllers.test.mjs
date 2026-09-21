import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { setLocale } from '../scripts/studio/public/i18n.js';
import { createAgentController } from '../scripts/studio/public/agent-controller.js';
import { createMcpSelectionController } from '../scripts/studio/public/mcp-selection.js';
import { createProgressController } from '../scripts/studio/public/progress-controller.js';
import { createTechnicalWorkspace } from '../scripts/studio/public/technical-workspace.js';
import { installComparisonGuard } from '../scripts/studio/public/comparison-guard.js';

for (const kind of ['agent', 'mcp', 'progress']) {
  test(`${kind} loading failure relocalizes without retrying its loader`, async (t) => {
    const dom = new JSDOM(
      '<details open><div id="agent-configuration"></div></details><div id="prompt-mcp-tools"></div><div id="job-progress"></div>',
      { url: 'http://localhost' },
    );
    const document = dom.window.document;
    let attempts = 0;
    const loadWidget = async () => {
      attempts++;
      throw new Error('unavailable');
    };
    const controller =
      kind === 'agent'
        ? createAgentController({ document, onStatus() {}, loadWidget })
        : kind === 'mcp'
          ? createMcpSelectionController({ document, onGuidesChange() {}, loadWidget })
          : createProgressController({ document, api: { progress() {} }, loadWidget });
    t.after(() => {
      controller.dispose();
      dom.window.close();
    });
    if (kind === 'agent') controller.update({ settings: { version: 1 }, availability: {} });
    if (kind === 'progress')
      controller.update({ jobs: [{ id: 'job', status: 'failed' }], revisions: [] });
    await setImmediate();
    const initialAttempts = attempts;
    const en = document.body.textContent;
    setLocale('fr', document, dom.window);
    assert.notEqual(document.body.textContent, en);
    setLocale('en', document, dom.window);
    assert.equal(document.body.textContent, en);
    assert.equal(attempts, initialAttempts);
  });
}

test('technical workspace keeps user objective and changes only loading feedback on language switch', async (t) => {
  const dom = new JSDOM(
    '<div id="technical-objective"></div><div id="technical-decision"><span id="technical-decision-title"></span><span id="technical-decision-state"></span></div><div><div id="quality-workbench"></div></div>',
    { url: 'http://localhost' },
  );
  let loads = 0;
  const workspace = createTechnicalWorkspace({
    document: dom.window.document,
    window: dom.window,
    sourceView: {},
    openPanel() {},
    refresh() {
      throw new Error('unexpected reload');
    },
    comparisonBase() {},
    showVersion() {},
    loadQualityWidget: async () => {
      loads++;
      throw new Error('missing');
    },
  });
  t.after(() => {
    workspace.destroy();
    dom.window.close();
  });
  workspace.update(
    { brief: { outcome: 'Mon objectif français' }, project: {}, proposals: [], revisions: [] },
    null,
    'checks',
  );
  await setImmediate();
  assert.match(
    dom.window.document.querySelector('#quality-workbench').textContent,
    /quality table/,
  );
  setLocale('fr', dom.window.document, dom.window);
  assert.match(
    dom.window.document.querySelector('#quality-workbench').textContent,
    /tableau de qualité/,
  );
  assert.equal(
    dom.window.document.querySelector('#technical-objective').textContent,
    'Mon objectif français',
  );
  assert.equal(loads, 1);
});

test('serialized comparison guard defaults to English and shares preference without changing application content', async (t) => {
  const dom = new JSDOM(
    '<html lang="en"><button title="App title">Texte application</button><input value="données"></html>',
    { url: 'http://localhost:53200', runScripts: 'outside-only' },
  );
  t.after(() => dom.window.close());
  dom.window.eval(`(${installComparisonGuard.toString()})();`);
  const button = dom.window.document.querySelector('button');
  assert.match(button.title, /Read-only comparison/);
  assert.equal(button.disabled, true);
  dom.window.document.cookie = 'devmethod-studio-language=fr; Path=/';
  dom.window.dispatchEvent(new dom.window.Event('focus'));
  assert.match(button.title, /Comparaison en lecture seule/);
  assert.equal(button.textContent, 'Texte application');
  assert.equal(dom.window.document.querySelector('input').value, 'données');
  assert.equal(dom.window.document.documentElement.lang, 'en');
  assert.equal(button.disabled, true);
  dom.window.document.cookie = 'devmethod-studio-language=en; Path=/';
  dom.window.dispatchEvent(new dom.window.Event('focus'));
  assert.equal(button.title, 'App title · Read-only comparison. Open the application to interact.');
  await setImmediate();
});
