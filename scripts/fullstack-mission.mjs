// Deterministic fixture walkthrough, not a native agent evaluation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { captureContext } from '../dist/mission.js';
import { inspectCheckpoint } from '../dist/checkpoint.js';
import { digest } from '../dist/records.js';
const root = fileURLToPath(new URL('../examples/fullstack/', import.meta.url));
const mission = JSON.parse(fs.readFileSync(path.join(root, 'mission.json'), 'utf8'));
const before = captureContext(root, mission);
const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['test'], {
  cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
});
const log = `${result.stdout ?? ''}\n${result.stderr ?? ''}\nExit: ${result.status}; error: ${result.error?.message ?? 'none'}\n`;
fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(root, 'evidence/unit.log'), log);
const outcome = result.status === 0 ? 'passed' : 'failed';
const checkpoint = { format: 1, scope: 'AC-TITLE unit/HTTP/model verification only. AC-STORE and AC-WEB remain separate checks.',
  status: 'active', nextAction: mission.nextAction, git: before.git,
  sources: before.sources.map(({ id, path, sha256 }) => ({ id, path, sha256 })),
  evidence: [{ id: 'unit', path: 'evidence/unit.log', sha256: digest(log), sourceIds: before.sources.map(s => s.id), dependsOn: [],
    outcome, criterionIds: ['AC-TITLE'], kind: 'automated', revision: `${before.git.commit}; working-content ${before.git.diffSha256}` }] };
fs.writeFileSync(path.join(root, 'evidence/context.json'), JSON.stringify(before, null, 2));
fs.writeFileSync(path.join(root, 'evidence/checkpoint.json'), JSON.stringify(checkpoint, null, 2));
const report = inspectCheckpoint(root, checkpoint);
console.log(JSON.stringify({ kind: 'deterministic-fixture', command: 'npm test', outcome, checkpoint: 'examples/fullstack/evidence/checkpoint.json', report,
  limitation: 'This invocation checks unit/HTTP/model only. Database, production e2e and native host behavior are separate evidence.' }, null, 2));
if (result.status !== 0 || report.status !== 'ready') process.exitCode = 1;
