// Explicit live evaluation of fictional inputs; never part of npm test.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createStudioStore } from './studio/store.mjs';
import { createAgentRunner } from './studio/runner.mjs';
import { riskPrompt, acceptRiskOutput } from './studio/risk-model.mjs';
import { digest } from './studio/files.mjs';

if (!process.argv.includes('--live'))
  throw new Error('Essais IA réels : fournir explicitement --live.');
const output = process.argv[process.argv.indexOf('--output') + 1];
if (!process.argv.includes('--output') || !output) throw new Error('Fichier --output requis.');
const executable = process.env.CODEX_EXECUTABLE || 'codex';
const cases = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('../evaluation/hybrid-risk/cases.json', import.meta.url))),
);
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'hybrid-risk-eval-'));
const store = createStudioStore(root);
const runner = createAgentRunner({
  store,
  jobs: {},
  options: { executable, maxJobs: 8, timeoutMs: 90000, maxTokens: 120000 },
});
const results = {
  protocol: 'hybrid-risk-1',
  at: new Date().toISOString(),
  provider: execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim(),
  model: 'CLI default; model identifier not exposed by this JSON stream',
  cases: [],
};
try {
  for (const fixture of cases) {
    if (!runner.status().automatic) break;
    const context = {
      protocol: 'hybrid-risk-1',
      revisionId: fixture.id,
      baseRevisionId: 'before',
      criteria: [{ id: 'invariant', text: fixture.criteria }],
      before: [{ path: fixture.path, content: fixture.before }],
      after: [{ path: fixture.path, content: fixture.after }],
      changedFiles: [fixture.path],
      limits: [],
    };
    const prompt = riskPrompt(context),
      started = Date.now();
    const result = await runner.inspect({ id: `risk-${fixture.id}`, prompt });
    let validation = 'not-returned';
    if (result.ok) {
      try {
        acceptRiskOutput(result.result, context);
        validation = 'accepted';
      } catch (error) {
        validation = error.message;
      }
    }
    results.cases.push({
      id: fixture.id,
      split: fixture.split,
      inputHash: digest(JSON.stringify(context)),
      promptHash: digest(prompt),
      elapsedMs: Date.now() - started,
      validation,
      ...result,
    });
    fs.writeFileSync(
      output,
      JSON.stringify({ ...results, budget: runner.status() }, null, 2) + '\n',
    );
    console.log(
      `${fixture.id}: ${result.ok ? validation : result.error} (${Date.now() - started} ms)`,
    );
  }
} finally {
  await runner.close();
  store.close();
}
