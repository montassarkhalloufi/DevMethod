import path from 'node:path';
import { createHash } from 'node:crypto';
import { bundledFiles, bundledProvenance, type Provenance } from './init.js';
import { inspectInstallation, type Manifest } from './doctor.js';
import { checkPath, stat, hashFileSha256 } from './filesystem.js';

type Entry = {
  path: string;
  classification: 'unchanged' | 'updated' | 'customized' | 'conflict' | 'added' | 'removed';
  installedSha256?: string;
  baselineSha256?: string;
  candidateSha256?: string;
  candidateChanged: boolean;
  missing?: boolean;
  collision?: boolean;
};
export type UpdateReport = {
  format: 1;
  destination: string;
  status: 'ok' | 'warning' | 'error';
  installed?: Provenance;
  candidate?: Provenance;
  provenance: 'recorded' | 'unknown';
  entries: Entry[];
  findings: { code: string; path?: string; message: string }[];
};

function recordProvenance(report: UpdateReport, manifest: Manifest): void {
  report.installed = manifest.provenance;
  report.provenance = manifest.provenance ? 'recorded' : 'unknown';
  if (manifest.provenance) return;
  if (report.status === 'ok') report.status = 'warning';
  report.findings.push({
    code: 'provenance-unknown',
    message:
      'Legacy installation: package version is unknown; recorded file hashes remain the comparison baseline.',
  });
}

function currentFileHash(
  destination: string,
  name: string,
  inspected: Map<string, string>,
): string | undefined {
  const known = inspected.get(name);
  if (known !== undefined) return known;
  // Candidate additions may be existing unrecorded files and still need an explicit check.
  const file = path.join(destination, name);
  checkPath(file);
  const info = stat(file);
  if (!info) return undefined;
  if (!info.isFile()) throw new Error(`Expected a regular file: ${name}`);
  return hashFileSha256(file);
}

function classifyFile(
  baseline: string | undefined,
  actual: string | undefined,
  candidate: string | undefined,
): Entry['classification'] {
  if (baseline === undefined) return 'added';
  const customized = actual !== baseline;
  if (customized && baseline !== candidate && actual !== candidate) return 'conflict';
  if (customized) return 'customized';
  if (candidate === undefined) return 'removed';
  return baseline === candidate ? 'unchanged' : 'updated';
}

function compareFile(
  name: string,
  baseline: string | undefined,
  actual: string | undefined,
  candidate: string | undefined,
): Entry {
  const collision = baseline === undefined && actual !== undefined;
  return {
    path: name,
    classification: classifyFile(baseline, actual, candidate),
    installedSha256: actual,
    baselineSha256: baseline,
    candidateSha256: candidate,
    candidateChanged: baseline !== candidate,
    ...(actual === undefined ? { missing: true } : {}),
    ...(collision ? { collision: true } : {}),
  };
}

function comparePayload(
  report: UpdateReport,
  manifest: Manifest,
  inspected: Map<string, string>,
): void {
  const candidate = bundledFiles(manifest.tool, manifest.skills);
  const hashes = Object.fromEntries(
    [...candidate].map(([name, data]) => [name, createHash('sha256').update(data).digest('hex')]),
  );
  report.candidate = bundledProvenance(hashes);
  const names = [...new Set([...Object.keys(manifest.files), ...candidate.keys()])].sort();
  for (const name of names) {
    const baseline = manifest.files[name]?.toLowerCase();
    const actual = currentFileHash(report.destination, name, inspected);
    const entry = compareFile(name, baseline, actual, hashes[name]);
    report.entries.push(entry);
    const customized = baseline !== undefined && actual !== baseline;
    if ((customized || entry.collision) && report.status === 'ok') report.status = 'warning';
  }
}

/** Preview only. Reuse one inspection; no writes, migrations, subprocesses, or network calls. */
export function previewUpdate(destination: string): UpdateReport {
  const report: UpdateReport = {
    format: 1,
    destination: path.resolve(destination),
    status: 'ok',
    provenance: 'unknown',
    entries: [],
    findings: [],
  };
  try {
    const { report: diagnostics, manifest, hashes } = inspectInstallation(report.destination);
    report.findings.push(...diagnostics.findings);
    report.status = diagnostics.status;
    // Missing files are represented in the comparison, but remain diagnostic errors.
    if (diagnostics.findings.some((f) => f.severity === 'error' && f.code !== 'file-missing'))
      return report;
    if (!manifest) throw new Error('Invalid manifest file.');
    recordProvenance(report, manifest);
    comparePayload(report, manifest, hashes);
  } catch (error) {
    report.status = 'error';
    report.findings.push({
      code: 'preview-failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return report;
}
