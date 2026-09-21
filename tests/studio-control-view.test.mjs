import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { evaluateControl, criteriaFingerprint } from '../scripts/studio/control-policy.mjs';
import { createControlView } from '../scripts/studio/public/control-view.js';

// Explicit policy/DOM fixtures, not a native execution or a human approval.
function input() {
  const state = {
    project: { mode: 'guided' },
    brief: { criteria: [{ id: 'save', text: 'Conserver <script>les données</script>.' }] },
    jobs: [{ id: 'job', status: 'ready' }],
    revisions: [{ id: 'candidate', jobId: 'job', files: [{ path: 'main.tsx', sha256: 'abc' }] }],
    checks: [
      {
        id: 'build',
        executor: 'studio',
        kind: 'command',
        revisionId: 'candidate',
        status: 'passed',
      },
    ],
  };
  return {
    state,
    revisionId: 'candidate',
    admission: { allowed: true },
    delegation: { adoption: 'agent' },
    execution: { localOnly: true, reversible: true, persistentData: false, contractChanged: false },
  };
}

function render(control, displayed = 'candidate') {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  const root = dom.window.document.querySelector('main');
  root.append(...createControlView(dom.window.document, control, displayed));
  return { root, text: root.textContent };
}

test('technical success retains missing business evidence, exact target and unknown probability', () => {
  const result = render(evaluateControl(input()), 'active');
  assert.match(result.text, /Vérifications à renforcer/);
  assert.match(result.text, /Des critères attendent une preuve de fonctionnement/);
  assert.match(result.text, /ne concerne pas la version affichée \(active\)/);
  assert.match(result.text, /Probabilité : inconnue, non mesurée/);
  assert.match(result.text, /Mode demandé : Guidé/);
  assert.match(result.text, /Un succès technique ne démontre pas/);
  assert.equal(result.root.querySelectorAll('script').length, 0);
  assert.match(result.text, /<script>les données<\/script>/);
  assert.ok(
    [...result.root.querySelectorAll('button')].every(
      (button) => button.dataset.action === 'intervention-review',
    ),
  );
  assert.equal(result.root.querySelectorAll('form').length, 0);
});

test('obsolete business proof remains linked to criterion and revision with provenance; untrusted evidence stays untrusted', () => {
  const fixture = input();
  fixture.evidence = [
    {
      id: 'journey',
      kind: 'business',
      executor: 'agent',
      revisionId: 'candidate',
      criterionIds: ['save'],
      criteriaFingerprint: criteriaFingerprint(fixture.state),
      status: 'passed',
      protocol: 'fixture-only',
      environment: { browser: 'fixture' },
      createdAt: '2026-09-21T12:00:00Z',
      limits: ['Scénario fictif, aucune recette native.'],
    },
  ];
  fixture.state.brief.criteria[0].text = 'Autre attente';
  const control = evaluateControl(fixture);
  control.graph.nodes.find((node) => node.id === 'evidence:build').provenance = 'legacy-recorded';
  const { root, text } = render(control);
  assert.match(text, /Obsolète pour la version évaluée/);
  assert.match(text, /source non attestée par Studio/);
  assert.match(text, /enregistrement hérité, origine à examiner/);
  assert.match(text, /Scénario fictif/);
  assert.match(text, /Empreinte : non renseignée/);
  for (const anchor of root.querySelectorAll('a')) {
    const target = decodeURIComponent(anchor.getAttribute('href').slice(1));
    assert.ok(
      root.ownerDocument.getElementById(target),
      'Every evidence link resolves to its node',
    );
  }
  assert.match(text, /a produit/);
  assert.match(text, /contrôlée par/);
  assert.match(text, /couvre/);
});

test('unknown usage and revoked permission are grouped without emitting any retry or agreement', () => {
  const fixture = input();
  fixture.execution = { usageUnknown: true, permissionRevoked: true };
  const result = render(evaluateControl(fixture));
  assert.match(result.text, /Exécution arrêtée/);
  assert.match(result.text, /La consommation est inconnue/);
  assert.match(result.text, /Une permission a été retirée/);
  assert.match(result.text, /Intervention groupée · Critique/);
  assert.match(
    result.text,
    /Périmètre local, Réversibilité, Données persistantes, Contrats consommés/,
  );
  assert.match(result.text, /Conserver l’arrêt/);
  assert.match(result.text, /ne donne aucun accord et ne relance rien/);
  assert.equal(result.root.querySelectorAll('form').length, 0);
  assert.ok(
    [...result.root.querySelectorAll('button')].every(
      (button) => button.dataset.action === 'intervention-review',
    ),
  );
});

test('freshness and provenance remain distinct without promoting reports or transport to business proof', () => {
  const control = evaluateControl(input());
  const sources = [
    'studio-executor',
    'studio-adapter',
    'host-attested',
    'legacy-recorded',
    'studio-mcp-broker',
    'unattested',
  ];
  control.graph.nodes = sources.map((provenance, index) => ({
    id: 'evidence:' + index,
    type: 'evidence',
    sourceId: String(index),
    kind: index === 4 ? 'mcp-transport' : 'technical',
    status: 'passed',
    provenance,
    trusted: true,
    freshness: ['current', 'reevaluate', 'obsolete'][index % 3],
    criterionIds: [],
    linkedCheckId: 'check-' + index,
    reportedCriterionIds: ['reported-' + index],
  }));
  control.graph.edges = [];
  const { text } = render(control);
  for (const expected of [
    'À jour pour la version évaluée',
    'À réévaluer avant utilisation',
    'Obsolète pour la version évaluée',
    'exécuteur Studio',
    'adaptateur Studio',
    'attestation de l’agent hôte',
    'enregistrement hérité',
    'courtier MCP Studio',
    'source non attestée par Studio',
    'Trace de transport MCP — aucune preuve métier',
    'Contrôle lié : check-4',
    'reported-4',
    'Cette déclaration ne démontre pas leur couverture',
  ])
    assert.ok(text.includes(expected), expected);
});

test('tool intervention exposes original scope and denial without a new authorization or retry control', () => {
  const control = evaluateControl(input());
  control.autonomy = {
    requestedMode: 'guided',
    action: 'arbitrate',
    reasons: ['tool-action-pending', 'tool-action-failed'],
  };
  control.interventions = [
    {
      id: 'original-request',
      revisionId: 'candidate',
      reasons: ['tool-action-pending'],
      impact: 'high',
      uncertainties: [],
      evidenceIds: [],
      options: ['inspect-tool-request'],
      recommendation: 'arbitrate',
      scope: {
        requestId: 'original-request',
        jobId: 'original-job',
        baseRevision: 'base-revision',
        connectionId: 'connection-fixture',
        toolName: '<script>fixture_tool</script>',
        inputSchemaFingerprint: 'schema-fingerprint',
        permission: 'deny',
        status: 'unknown',
        expiresAt: '2026-09-21T14:00:00Z',
      },
    },
  ];
  const { text, root } = render(control);
  for (const expected of [
    'Une action outil attend une résolution',
    'Une action outil a échoué',
    'Identité de l’intervention : original-request',
    'Demande outil : original-request',
    'Job : original-job',
    'Version de base : base-revision',
    'Connexion : connection-fixture',
    'Outil : <script>fixture_tool</script>',
    'schéma des arguments : schema-fingerprint',
    'Permission : Refusée',
    'État de l’appel : Inconnu',
    'Examiner la demande dans le contrôle des outils existant',
    'Une trace de transport ne prouve ni un critère métier ni les effets de l’action',
  ])
    assert.ok(text.includes(expected), expected);
  assert.equal(root.querySelectorAll('form, script').length, 0);
  assert.ok(
    [...root.querySelectorAll('button')].every(
      (button) => button.dataset.action === 'intervention-review',
    ),
  );
  const toolGroup = [...root.querySelectorAll('details')].find((group) =>
    group.textContent.includes('Identité de l’intervention : '),
  );
  assert.equal(toolGroup.querySelectorAll('button').length, 0);
});
