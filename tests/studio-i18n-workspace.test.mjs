import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

async function bundle(contents, platform = 'node') {
  const output = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true,
    write: false,
    format: platform === 'node' ? 'esm' : 'iife',
    platform,
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"test"' },
  });
  return output.outputFiles[0].text;
}

const models = await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      await bundle(`
export {presentQualityReport} from './studio-ui/src/features/quality/model/catalog-presentation';
export {presentProjectModel} from './studio-ui/src/features/project/model/presentation';
export {prepareQualityRequest} from './studio-ui/src/features/quality/model/requests';
export {statusLabels,dateLabel} from './studio-ui/src/features/quality/model/selectors';
`),
    ).toString('base64')
);

test('quality presentation translates current catalogue labels without rewriting evidence or IDs', () => {
  const receipt = {
    id: 'receipt',
    observed: 'Texte français utilisateur',
    expected: 'Objectif original',
    fingerprint: 'unchanged',
  };
  const check = {
    id: 'source-syntax',
    reason: 'Capacité code non détectée dans cette version ; confirmer le périmètre si nécessaire.',
    title: 'Syntaxe des sources',
    tool: 'Node --check / parseur TypeScript installé',
    objective: 'Repérer les erreurs de syntaxe sans exécuter le programme.',
    evidence: receipt,
  };
  const report = {
    checks: [check],
    historical: [check],
    categories: [{ id: 'functional', label: 'Fonctionnel' }],
    limits: [],
  };
  const before = JSON.stringify(report);
  const en = models.presentQualityReport(report, 'en');
  assert.equal(en.checks[0].title, 'Source syntax');
  assert.equal(
    en.checks[0].reason,
    'Capability code was not detected in this version; confirm the scope if needed.',
  );
  assert.equal(en.categories[0].label, 'Functional');
  assert.equal(en.checks[0].evidence, receipt);
  assert.equal(en.historical, report.historical);
  assert.equal(models.presentQualityReport(report, 'fr').checks[0].title, 'Syntaxe des sources');
  assert.equal(JSON.stringify(report), before);
});

test('project projection preserves source labels, traces and fingerprints while explaining static limits in English', () => {
  const trace = { events: [{ label: 'Journal utilisateur' }] };
  const analysis = {
    fingerprint: 'exact',
    environment: 'Snapshot immuable du projet',
    scope: 'test',
    files: [],
    elements: [
      {
        id: 'id',
        label: 'Client français',
        description: 'Service déclaré ; aucun processus observé.',
        provenance: [],
      },
    ],
    relations: [],
    flows: [{ kind: 'observed', trace }],
    issues: [],
    limits: ['Affichage borné à 80 parcours.'],
  };
  const original = { analysis, previous: null, impact: { limits: [] } };
  const before = JSON.stringify(original);
  const en = models.presentProjectModel(original, 'en');
  assert.equal(en.analysis.elements[0].description, 'Declared service; no process observed.');
  assert.equal(en.analysis.elements[0].label, 'Client français');
  assert.equal(en.analysis.flows[0].trace, trace);
  assert.equal(en.analysis.fingerprint, 'exact');
  assert.equal(JSON.stringify(original), before);
});

test('request framing and status/date formatting take explicit locale without translating receipt text', () => {
  const check = {
    id: 'test',
    title: 'Mon contrôle',
    status: 'failed',
    freshness: 'current',
    tool: 'outil',
    objective: 'Mon objectif',
    evidence: null,
  };
  const en = models.prepareQualityRequest(check, { revisionId: 'r' }, 'en');
  const fr = models.prepareQualityRequest(check, { revisionId: 'r' }, 'fr');
  assert.match(en.prompt, /Check: test/);
  assert.match(fr.prompt, /Contrôle : test/);
  assert.match(en.prompt, /Mon objectif/);
  assert.equal(models.statusLabels('en').passed, 'Passed');
  assert.notEqual(
    models.dateLabel('2026-09-17T12:00:00Z', 'en'),
    models.dateLabel('2026-09-17T12:00:00Z', 'fr'),
  );
});

const ui = await bundle(
  `import {createRoot} from 'react-dom/client';
import {useBrowserConfiguration} from './studio-ui/src/features/quality/hooks/useBrowserConfiguration';
import {setLocale} from './studio-ui/src/i18n';
function View(){const state=useBrowserConfiguration();return <><output>{state.error}</output><input value={state.draft.channel} onChange={()=>{}}/><button onClick={()=>state.setDraft({...state.draft,channel:'msedge'})}>edit</button></>}
const root=createRoot(document.getElementById('root'));root.render(<View/>);window.changeLocale=setLocale;window.unmount=()=>root.unmount();`,
  'browser',
);

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate());
}

test('locale switches preserve drafts and pending reads; existing local error feedback switches language', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'http://localhost',
    runScripts: 'outside-only',
  });
  t.after(() => {
    dom.window.unmount();
    dom.window.close();
  });
  let calls = 0,
    resolve;
  dom.window.fetch = () => {
    calls++;
    return new Promise((done) => {
      resolve = done;
    });
  };
  dom.window.eval(ui);
  await until(() => calls === 1);
  dom.window.document.querySelector('button').click();
  await until(() => dom.window.document.querySelector('input').value === 'msedge');
  dom.window.changeLocale('fr');
  await setTimeout(20);
  assert.equal(calls, 1);
  assert.equal(dom.window.document.querySelector('input').value, 'msedge');
  resolve({ ok: false, json: async () => ({}) });
  await until(
    () =>
      dom.window.document.querySelector('output').textContent ===
      'Réglage navigateur indisponible.',
  );
  dom.window.changeLocale('en');
  await until(
    () =>
      dom.window.document.querySelector('output').textContent === 'Browser settings unavailable.',
  );
  assert.equal(calls, 1);
  assert.equal(dom.window.document.querySelector('input').value, 'msedge');
});
