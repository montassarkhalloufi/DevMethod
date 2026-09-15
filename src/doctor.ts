import * as fs from 'node:fs';
import path from 'node:path';
import { tools, modules, templates, type Tool, type Provenance } from './init.js';
import { commandSkills } from './commands.js';
import { isReviewRuntimePath } from './review-runtime.js';
import { parseJson, checkPath, stat, hashFileSha256, MAX_MANIFEST_BYTES } from './filesystem.js';

type Finding = { severity: 'warning' | 'error'; code: string; path?: string; message: string };
export type Manifest = {
  format: 2;
  kit: 'devmethod';
  tool: Tool;
  skills: string[];
  files: Record<string, string>;
  provenance?: Provenance;
};
export type DoctorReport = {
  format: 1;
  destination: string;
  status: 'ok' | 'warning' | 'error';
  tool?: Tool;
  skills?: string[];
  checked: number;
  unchanged: number;
  findings: Finding[];
};
interface InstallationInspection {
  report: DoctorReport;
  manifest?: Manifest;
  hashes: Map<string, string>;
}
interface PayloadInspection {
  actual?: string;
  finding?: Finding;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasManifestShape(value: unknown): value is Record<string, unknown> & {
  tool: Tool;
  skills: string[];
  files: Record<string, unknown>;
} {
  return (
    object(value) &&
    value.format === 2 &&
    value.kit === 'devmethod' &&
    typeof value.tool === 'string' &&
    Object.hasOwn(tools, value.tool) &&
    Array.isArray(value.skills) &&
    value.skills.includes('project-foundation') &&
    new Set(value.skills).size === value.skills.length &&
    value.skills.every(
      (name) => typeof name === 'string' && modules.includes(name as (typeof modules)[number]),
    ) &&
    object(value.files)
  );
}

function isSkillFile(parts: string[], name: string): boolean {
  return (
    (parts.length === 4 && parts[3] === 'SKILL.md') ||
    (parts.length >= 5 &&
      ['assets', 'references'].includes(parts[3] ?? '') &&
      name.endsWith('.md')) ||
    isReviewRuntimePath(parts)
  );
}

function validateManifestPaths(manifest: {
  tool: Tool;
  skills: string[];
  files: Record<string, unknown>;
}): void {
  const root = tools[manifest.tool];
  const supportedSkills = [...manifest.skills, ...commandSkills(manifest.skills)];
  const required = [
    ...templates,
    'DEVMETHOD-LICENSE',
    ...manifest.skills.map((name) => `${root}/${name}/SKILL.md`),
  ];
  for (const name of required) {
    if (!Object.hasOwn(manifest.files, name))
      throw new Error(`Manifest is missing required entry: ${name}`);
  }
  // Validate every entry before any payload reads. A manifest never grants filesystem access.
  for (const [name, hash] of Object.entries(manifest.files)) {
    const parts = name.split('/');
    const safe = parts.every(
      (part) => /^[a-zA-Z0-9._-]+$/.test(part) && part !== '.' && part !== '..',
    );
    const rootFile = templates.includes(name) || name === 'DEVMETHOD-LICENSE';
    const skillFile =
      parts.slice(0, 2).join('/') === root &&
      supportedSkills.includes(parts[2] ?? '') &&
      isSkillFile(parts, name);
    if (!safe || (!rootFile && !skillFile))
      throw new Error(`Manifest contains an unsupported path: ${name}`);
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash))
      throw new Error(`Invalid SHA-256 for: ${name}`);
  }
}

function validProvenance(value: unknown): boolean {
  return (
    object(value) &&
    value.packageName === 'devmethod-ai' &&
    typeof value.packageVersion === 'string' &&
    /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.+-]+)?$/.test(value.packageVersion) &&
    typeof value.payloadSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(value.payloadSha256)
  );
}

export function validateManifest(value: unknown): Manifest {
  if (!hasManifestShape(value))
    throw new Error(
      'Expected a DevMethod format 2 manifest with a supported host and unique modules including project-foundation.',
    );
  validateManifestPaths(value);
  if (value.provenance !== undefined && !validProvenance(value.provenance))
    throw new Error('Invalid installation provenance.');
  return value as Manifest;
}

function addFinding(report: DoctorReport, finding: Finding): void {
  report.findings.push(finding);
  if (finding.severity === 'error' || report.status === 'ok') report.status = finding.severity;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function inspectManifest(destination: string): { manifest?: Manifest; finding?: Finding } {
  const relative = 'kit-manifest.json';
  try {
    const file = path.join(destination, relative);
    checkPath(file);
    const info = stat(file);
    if (!info)
      return {
        finding: {
          severity: 'error',
          code: 'manifest-missing',
          path: relative,
          message:
            'No installation manifest. Check --dest or install into a fresh staging directory.',
        },
      };
    if (!info.isFile() || info.size > MAX_MANIFEST_BYTES)
      throw new Error('Manifest must be a regular file no larger than 1 MiB.');
    return { manifest: validateManifest(parseJson(fs.readFileSync(file, 'utf8'))) };
  } catch (error) {
    return {
      finding: {
        severity: 'error',
        code: 'manifest-invalid',
        path: relative,
        message: errorMessage(error),
      },
    };
  }
}

function inspectPayload(
  destination: string,
  relative: string,
  expected: string,
): PayloadInspection {
  try {
    const file = path.join(destination, relative);
    checkPath(file);
    const info = stat(file);
    if (!info)
      return {
        finding: {
          severity: 'error',
          code: 'file-missing',
          path: relative,
          message: 'Restore from a reviewed staging installation.',
        },
      };
    if (!info.isFile())
      return {
        finding: {
          severity: 'error',
          code: 'file-type',
          path: relative,
          message: 'Expected a regular file.',
        },
      };
    const actual = hashFileSha256(file);
    if (actual === expected.toLowerCase()) return { actual };
    return {
      actual,
      finding: {
        severity: 'warning',
        code: 'file-modified',
        path: relative,
        message:
          'Differs from the initial installation. Review intentional customization; nothing was overwritten.',
      },
    };
  } catch (error) {
    return {
      finding: {
        severity: 'error',
        code: 'file-unreadable',
        path: relative,
        message: errorMessage(error),
      },
    };
  }
}

function inspectHostCopy(destination: string, relative: string): Finding | undefined {
  try {
    const file = path.join(destination, relative);
    checkPath(file);
    if (stat(file))
      return {
        severity: 'error',
        code: 'duplicate-host',
        path: relative,
        message: 'Another host contains this module. Keep one reviewed copy per project.',
      };
  } catch (error) {
    return {
      severity: 'error',
      code: 'host-unreadable',
      path: relative,
      message: errorMessage(error),
    };
  }
  return undefined;
}

function inspectOtherHosts(report: DoctorReport, manifest: Manifest): void {
  const alternateRoots = Object.values(tools).filter((root) => root !== tools[manifest.tool]);
  for (const name of [...manifest.skills, ...commandSkills(manifest.skills)]) {
    for (const root of alternateRoots) {
      const finding = inspectHostCopy(report.destination, `${root}/${name}`);
      if (finding) addFinding(report, finding);
    }
  }
}

/** One quiescent inspection supplies diagnostics and hashes to the update comparison. */
export function inspectInstallation(destination: string): InstallationInspection {
  const report: DoctorReport = {
    format: 1,
    destination: path.resolve(destination),
    status: 'ok',
    checked: 0,
    unchanged: 0,
    findings: [],
  };
  const hashes = new Map<string, string>();
  const { manifest, finding } = inspectManifest(report.destination);
  if (finding) addFinding(report, finding);
  if (!manifest) return { report, hashes };
  report.tool = manifest.tool;
  report.skills = manifest.skills;
  for (const [relative, expected] of Object.entries(manifest.files)) {
    report.checked++;
    const result = inspectPayload(report.destination, relative, expected);
    if (result.actual) hashes.set(relative, result.actual);
    if (result.actual === expected.toLowerCase()) report.unchanged++;
    if (result.finding) addFinding(report, result.finding);
  }
  inspectOtherHosts(report, manifest);
  return { report, manifest, hashes };
}

/** Inspect the recorded installation baseline without writes, commands or network calls. */
export function diagnose(destination: string): DoctorReport {
  return inspectInstallation(destination).report;
}
