import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { commandSkills } from './commands.js';
import { reviewRuntimeFiles } from './review-runtime.js';
import { parseJson, checkPath, stat, MAX_MANIFEST_BYTES } from './filesystem.js';

export const tools = {
  codex: '.agents/skills',
  claude: '.claude/skills',
  cursor: '.cursor/skills',
} as const;
export type Tool = keyof typeof tools;
export const modules = [
  'project-foundation',
  'decision-architecture',
  'design-to-code',
  'react-feature-engineering',
  'reliable-ai-integration',
  'scoped-delivery',
] as const;
export const templates = [
  'PROJECT_PROFILE.md',
  'AGENTS.foundation.md',
  'START_HERE.md',
  'ENGINEERING_POLICY.template.md',
];
export type Provenance = { packageName: string; packageVersion: string; payloadSha256: string };
interface InstallOptions {
  destination: string;
  tool: Tool;
  selected?: string[];
  dryRun?: boolean;
}
interface InstallationManifest {
  format: 2;
  kit: 'devmethod';
  tool: Tool;
  skills: string[];
  files: Record<string, string>;
  provenance: Provenance;
}
type Payload = Map<string, Buffer>;
type PendingFile = [string, Buffer];
const packageRoot = fileURLToPath(new URL('../', import.meta.url));

function walk(directory: string, prefix = ''): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symbolic source: ${relative}`);
      if (entry.isDirectory()) return walk(path.join(directory, entry.name), relative + '/');
      if (!entry.isFile()) throw new Error(`Unsupported source: ${relative}`);
      return [relative];
    });
}

function profile(data: Buffer, tool: Tool): Buffer {
  return Buffer.from(data.toString().replace(/\.(?:agents|claude|cursor)\/skills/g, tools[tool]));
}

function selectModules(options: InstallOptions): string[] {
  if (!Object.hasOwn(tools, options.tool)) throw new Error('Unknown tool');
  const selected = [...new Set(['project-foundation', ...(options.selected ?? modules)])];
  for (const name of selected) {
    if (!modules.includes(name as (typeof modules)[number]))
      throw new Error(`Unknown module: ${name}`);
  }
  return selected;
}

function installationDestination(input: string): string {
  const destination = path.resolve(input);
  checkPath(destination);
  if (destination === packageRoot || destination.startsWith(packageRoot + path.sep))
    throw new Error('Install outside the distribution directory');
  const info = stat(destination);
  if (info && !info.isDirectory()) throw new Error('Destination must be a directory');
  return destination;
}

function assertNoDuplicateSkills(destination: string, tool: Tool, selected: string[]): void {
  const alternateRoots = Object.values(tools).filter((root) => root !== tools[tool]);
  for (const name of [...selected, ...commandSkills(selected)]) {
    for (const root of alternateRoots) {
      if (stat(path.join(destination, root, name)))
        throw new Error(`Duplicate skill in another host directory: ${root}/${name}`);
    }
  }
}

function installationManifest(
  tool: Tool,
  selected: string[],
  files: Payload,
): InstallationManifest {
  const hashes = Object.fromEntries(
    [...files].map(([name, data]) => [name, createHash('sha256').update(data).digest('hex')]),
  );
  return {
    format: 2,
    kit: 'devmethod',
    tool,
    skills: selected,
    files: hashes,
    provenance: bundledProvenance(hashes),
  };
}

function matchesLegacyManifest(file: string, expected: InstallationManifest): boolean {
  const existing = parseJson(fs.readFileSync(file, 'utf8')) as Partial<InstallationManifest> | null;
  return Boolean(
    existing &&
    typeof existing === 'object' &&
    existing.provenance === undefined &&
    existing.format === 2 &&
    existing.kit === expected.kit &&
    existing.tool === expected.tool &&
    JSON.stringify(existing.skills) === JSON.stringify(expected.skills) &&
    Object.keys(existing.files ?? {}).length === Object.keys(expected.files).length &&
    Object.entries(expected.files).every(([name, hash]) => existing.files?.[name] === hash),
  );
}

function assertExistingFileMatches(
  relative: string,
  target: string,
  data: Buffer,
  info: fs.Stats,
  manifest: InstallationManifest,
): void {
  const conflict = () => new Error(`Conflict; no files written: ${relative}`);
  if (!info.isFile()) throw conflict();
  if (relative === 'kit-manifest.json') {
    if (info.size > MAX_MANIFEST_BYTES)
      throw new Error('Manifest must be a regular file no larger than 1 MiB.');
    // Preserve a legacy manifest only when the complete installation contract matches.
    if (matchesLegacyManifest(target, manifest)) return;
  }
  if (info.size !== data.length || !fs.readFileSync(target).equals(data)) throw conflict();
}

function findPendingFiles(
  destination: string,
  files: Payload,
  manifest: InstallationManifest,
): PendingFile[] {
  const pending: PendingFile[] = [];
  for (const [relative, data] of files) {
    const target = path.join(destination, relative);
    checkPath(target);
    const info = stat(target);
    if (info) assertExistingFileMatches(relative, target, data, info, manifest);
    else pending.push([target, data]);
  }
  return pending;
}

function createDirectory(directory: string, created: string[]): void {
  if (stat(directory)) return;
  createDirectory(path.dirname(directory), created);
  fs.mkdirSync(directory);
  created.push(directory);
}

function installPendingFiles(pending: PendingFile[]): void {
  const created: string[] = [];
  const directories: string[] = [];
  try {
    for (const [target, data] of pending) {
      createDirectory(path.dirname(target), directories);
      checkPath(target);
      const descriptor = fs.openSync(target, 'wx');
      created.push(target);
      try {
        fs.writeFileSync(descriptor, data);
      } finally {
        fs.closeSync(descriptor);
      }
    }
  } catch (error) {
    for (const file of created.reverse()) fs.unlinkSync(file);
    for (const directory of directories.reverse()) fs.rmdirSync(directory);
    throw error;
  }
}

export function initialize(options: InstallOptions) {
  const selected = selectModules(options);
  const destination = installationDestination(options.destination);
  assertNoDuplicateSkills(destination, options.tool, selected);
  const files = bundledFiles(options.tool, selected);
  const manifest = installationManifest(options.tool, selected, files);
  files.set('kit-manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
  const pending = findPendingFiles(destination, files, manifest);
  if (!options.dryRun) installPendingFiles(pending);
  return {
    destination,
    tool: options.tool,
    skills: selected,
    files: files.size,
    new: pending.length,
    identical: files.size - pending.length,
    dryRun: Boolean(options.dryRun),
  };
}

function addSkillFiles(files: Payload, tool: Tool, selected: readonly string[]): void {
  for (const name of [...selected, ...commandSkills(selected)]) {
    const source = path.join(packageRoot, '.agents/skills', name);
    checkPath(source);
    for (const relative of walk(source)) {
      if (!/^(SKILL\.md|assets\/.*\.md|references\/.*\.md)$/.test(relative))
        throw new Error(`Unexpected payload file: ${name}/${relative}`);
      files.set(
        `${tools[tool]}/${name}/${relative}`,
        profile(fs.readFileSync(path.join(source, relative)), tool),
      );
    }
  }
}

function addReviewRuntimeFiles(files: Payload, tool: Tool): void {
  for (const name of reviewRuntimeFiles) {
    const compiled = name.endsWith('.mjs') ? name.replace(/\.mjs$/, '.js') : name;
    const source = path.join(packageRoot, 'dist', compiled);
    checkPath(source);
    let data = fs.readFileSync(source);
    // Explicit .mjs modules work inside CommonJS, ESM and package-less projects.
    if (name.endsWith('.mjs'))
      data = Buffer.from(data.toString().replace(/(from ['"]\.\/[^'"]+)\.js(['"])/g, '$1.mjs$2'));
    files.set(`${tools[tool]}/scoped-delivery/scripts/${name}`, data);
  }
}

/** The exact host-profiled payload shipped with this CLI. */
export function bundledFiles(tool: Tool, selected: readonly string[]): Payload {
  const files: Payload = new Map();
  addSkillFiles(files, tool, selected);
  if (selected.includes('scoped-delivery')) addReviewRuntimeFiles(files, tool);
  for (const template of templates)
    files.set(
      template,
      profile(
        fs.readFileSync(
          path.join(packageRoot, '.agents/skills/project-foundation/assets', template),
        ),
        tool,
      ),
    );
  files.set('DEVMETHOD-LICENSE', fs.readFileSync(path.join(packageRoot, 'LICENSE')));
  return files;
}

export function bundledProvenance(hashes: Record<string, string>): Provenance {
  const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const canonical = Object.keys(hashes)
    .sort()
    .map((name) => [name, hashes[name]]);
  return {
    packageName: metadata.name,
    packageVersion: metadata.version,
    payloadSha256: createHash('sha256').update(JSON.stringify(canonical)).digest('hex'),
  };
}
