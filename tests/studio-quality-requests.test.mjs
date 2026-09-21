import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: [path.resolve('studio-ui/src/features/quality/model/requests.ts')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { prepareQualityRequest } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('a historical failure prepares the original check and evidence version, not its UI row id', () => {
  const check = {
    id: 'history-proof-1',
    title: 'Syntaxe',
    status: 'failed',
    freshness: 'obsolete',
    tool: 'Analyseur',
    execution: 'studio',
    objective: 'Vérifier syntaxe',
    evidence: {
      id: 'proof-1',
      checkId: 'source-syntax',
      revisionId: 'old-revision',
      expected: 'Syntaxe correcte',
      observed: 'Syntaxe incorrecte',
      tool: 'Analyseur',
      finishedAt: '2026-09-17T00:00:00Z',
      fingerprint: 'a'.repeat(64),
      findings: [{ source: { path: 'src/main.ts', line: 5 }, message: 'TS1110' }],
      limits: ['Analyse statique seulement'],
    },
  };
  const request = prepareQualityRequest(check, { revisionId: 'selected-new-revision' }, 'fr');
  assert.equal(request.checkId, 'source-syntax');
  assert.equal(request.revisionId, 'old-revision');
  assert.equal(request.kind, 'fix');
  assert.match(request.prompt, /Contrôle : source-syntax/);
  assert.match(request.prompt, /Version concernée : old-revision/);
  assert.match(request.prompt, /Version actuellement sélectionnée : selected-new-revision/);
  assert.match(request.prompt, /src\/main.ts:5/);
  assert.equal(request.prompt.includes('history-proof-1'), false);
});

test('a connection without evidence retains the catalogue check id and cannot imply execution', () => {
  const check = {
    id: 'unit-tests',
    title: 'Tests unitaires',
    status: 'blocked',
    freshness: 'current',
    tool: 'Runner',
    execution: 'external',
    objective: 'Exercer la logique',
    reason: 'Outil absent',
    nextAction: 'Connecter un runner sur copie autorisée',
    evidence: null,
  };
  const request = prepareQualityRequest(check, { revisionId: 'selected' }, 'fr');
  assert.equal(request.checkId, 'unit-tests');
  assert.equal(request.revisionId, 'selected');
  assert.equal(request.kind, 'connect');
  assert.match(request.prompt, /Aucune preuve de réussite enregistrée/);
  assert.match(request.prompt, /Outil absent/);
});
