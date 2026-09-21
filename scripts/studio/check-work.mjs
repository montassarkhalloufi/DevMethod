import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRealDirectory, copyFiles, digest, fileManifest } from './files.mjs';
import { compileSource, sourceProfile } from './profile.mjs';
import { candidateDocumentChecks } from './document-checks.mjs';
import { candidateSyntaxChecks } from './verify.mjs';

const identity = {
  protocol: 'devmethod-local-work-check-v1',
  provenance: 'agent-executed-local-check',
  admissionReceipt: false,
  limits:
    'Syntax and controlled compilation only; no application behavior verified. Studio independently rechecks admission. No package scripts, installation or provider calls.',
};

const diagnostic = (value) => String(value ?? '').slice(0, 8000);
const normalizeCheck = (check) => ({
  protocol: check.protocol,
  status: check.status,
  diagnostics: diagnostic(check.output),
});

/** The CLI reports diagnostics only. It never writes trusted Studio checks/state. */
export async function checkWork(source) {
  const report = { ...identity, ok: false, sourceFingerprint: null, sourceFiles: 0, checks: [] };
  let temporary;
  try {
    const root = assertRealDirectory(source);
    const files = fileManifest(root);
    report.sourceFingerprint = digest(Buffer.from(JSON.stringify(files)));
    report.sourceFiles = files.length;
    if (!files.some((file) => file.path === 'index.html'))
      throw new Error('index.html is required for a supported local application.');
    temporary = fs.mkdtempSync(path.join(path.dirname(root), '.devmethod-check-'));
    const snapshot = path.join(temporary, 'app');
    copyFiles(root, snapshot, files);
    report.profile = sourceProfile(snapshot, files);
    const documents = await candidateDocumentChecks(snapshot, files);
    const scripts = await candidateSyntaxChecks(snapshot, files);
    report.checks.push(...documents.map(normalizeCheck), ...scripts.map(normalizeCheck));
    if (report.profile === 'react-ts') {
      const build = await compileSource(snapshot, files);
      report.checks.push({
        protocol: build.protocol,
        status: build.ok ? 'passed' : 'failed',
        diagnostics: diagnostic(JSON.stringify(build.diagnostics)),
      });
    }
    if (JSON.stringify(fileManifest(root)) !== JSON.stringify(files))
      throw new Error('Sources changed during verification; this result is stale.');
    report.ok =
      report.checks.length > 0 && report.checks.every((check) => check.status === 'passed');
  } catch (error) {
    report.error = diagnostic(error.message);
  } finally {
    if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
  }
  return report;
}

export function serializeWorkReport(report) {
  const full = JSON.stringify(report);
  if (Buffer.byteLength(full) <= 32768) return full;
  return JSON.stringify({
    ...report,
    error: report.error?.slice(0, 1000),
    checks: report.checks.map(({ protocol, status }) => ({ protocol, status })),
    diagnosticsTruncated: true,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const report =
    args.length === 2 && args[0] === '--source'
      ? await checkWork(args[1])
      : {
          ...identity,
          ok: false,
          checks: [],
          error: 'Usage: node check-work.mjs --source /absolute/path/to/job/app',
        };
  process.stdout.write(serializeWorkReport(report) + '\n');
  process.exitCode = report.ok ? 0 : 1;
}
