import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createControlView } from '../scripts/studio/public/control-view.js';

function control(nodes = []) {
  return {
    graph: { revisionId: 'candidate', nodes, edges: [] },
    risk: {
      severity: 'critical',
      probability: 'unknown',
      evidenceQuality: 'missing',
      factors: [{ id: 'fixture-diagnostic', severity: 'critical', reason: 'Critical fixture' }],
      unknowns: [],
      limits: [],
    },
    autonomy: { requestedMode: 'guided', action: 'stop', reasons: ['usage-unknown'] },
    interventions: [],
  };
}

function evidence(id, extra = {}) {
  return {
    id: 'evidence:' + id,
    type: 'evidence',
    revisionId: 'candidate',
    sourceId: id,
    kind: 'technical',
    status: 'failed',
    freshness: 'current',
    trusted: true,
    criterionIds: [],
    ...extra,
  };
}

function fixture(report, locale = 'en', prefix = '') {
  const dom = new JSDOM(`<html lang="${locale}" data-studio-language-ready>`, {
    url: 'http://localhost',
  });
  dom.window.document.body.append(
    ...createControlView(dom.window.document, report, 'candidate', prefix),
  );
  return {
    dom,
    document: dom.window.document,
    section: dom.window.document.querySelector('[data-attention-summary]'),
  };
}

test('attention shows critical risks and stops before all groups, without granting actions', () => {
  const f = fixture(
    control([
      evidence('failure'),
      evidence('old', { freshness: 'obsolete' }),
      evidence('runtime', { kind: 'runtime', trusted: false }),
    ]),
  );
  assert.ok(f.section, 'An attention summary must be rendered by the actual control view');
  assert.match(f.section.textContent, /Items to review/);
  assert.match(f.section.textContent, /Usage is unknown/);
  assert.match(f.section.textContent, /Critical fixture/);
  assert.equal(f.section.querySelectorAll('button,input,form,[data-action]').length, 0);
  assert.equal(f.section.querySelectorAll('details').length, 0);
  const text = f.section.textContent;
  assert.ok(text.indexOf('Critical fixture') < text.indexOf('Technical check'));
  assert.match(text, /Non-current/);
  assert.match(text, /Not attested by Studio/);
  assert.match(text, /missing evidence/i);
  f.dom.window.close();
});

test('attention links use existing prefixed graph identities and keep historical evidence out of groups', () => {
  const report = control([
    evidence('failed'),
    evidence('passed', { status: 'passed' }),
    evidence('history', { revisionId: 'older' }),
  ]);
  const original = structuredClone(report);
  const f = fixture(report, 'en', 'dialog-');
  assert.ok(f.section);
  const links = [...f.section.querySelectorAll('a')];
  assert.ok(links.length);
  for (const link of links) {
    const id = decodeURIComponent(link.hash.slice(1));
    assert.ok(id.startsWith('dialog-control-node-'));
    assert.ok(f.document.getElementById(id));
  }
  assert.ok(links.some((link) => link.hash.includes('failed')));
  assert.ok(!links.some((link) => link.hash.includes('history')));
  assert.ok(!links.some((link) => link.hash.includes('passed')));
  assert.match(f.section.textContent, /Historical.*1/);
  assert.deepEqual(report, original);
  f.dom.window.close();
});

test('zero observations still show stops and critical factors, with explicit FR scope and no invented observations', () => {
  const f = fixture(control(), 'fr');
  assert.ok(f.section);
  assert.match(f.section.textContent, /Points à examiner/);
  assert.match(f.section.textContent, /Consommation est inconnue|consommation est inconnue/);
  assert.match(f.section.textContent, /Critical fixture/);
  assert.match(f.section.textContent, /0/);
  assert.match(f.section.textContent, /preuve manquante|preuves manquantes/);
  assert.equal(f.section.querySelectorAll('a,button').length, 0);
  f.dom.window.close();
});

test('known critical factors are localized and host attestation stays distinct from Studio trust', () => {
  const report = control([
    evidence('host', {
      kind: 'agent-observation',
      status: 'passed',
      trusted: false,
      provenance: 'host-attested',
    }),
  ]);
  report.risk.factors = [
    {
      id: 'external-outcome-unknown',
      severity: 'critical',
      reason: 'Le résultat d’une action externe est inconnu.',
    },
    { id: 'permission-revoked', severity: 'critical', reason: 'Une permission a été retirée.' },
    {
      id: 'unknown-diagnostic',
      severity: 'critical',
      reason: '<script>Diagnostic conservé</script>',
    },
  ];
  const f = fixture(report);
  assert.match(f.section.textContent, /The outcome of an external action is unknown/);
  assert.match(f.section.textContent, /A permission was revoked/);
  assert.doesNotMatch(
    f.section.textContent,
    /Le résultat d’une action externe|Une permission a été retirée/,
  );
  assert.match(f.section.textContent, /Agent observation/);
  assert.match(f.section.textContent, /Not attested by Studio/);
  assert.match(f.section.textContent, /Observations to review: 1/);
  assert.match(f.section.textContent, /<script>Diagnostic conservé<\/script>/);
  assert.equal(f.section.querySelector('script'), null);
  assert.equal(report.graph.nodes[0].provenance, 'host-attested');
  f.dom.window.close();
  const fr = fixture(report, 'fr');
  assert.match(fr.section.textContent, /Non attestée par Studio/);
  assert.match(fr.section.textContent, /Observation de l’agent/);
  fr.dom.window.close();
});
