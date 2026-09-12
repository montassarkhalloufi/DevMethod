import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { checkPath, stat } from './filesystem.js';

export const tools = { codex: '.agents/skills', claude: '.claude/skills', cursor: '.cursor/skills' } as const;
export type Tool = keyof typeof tools;
export const modules = ['project-foundation', 'decision-architecture', 'design-to-code', 'react-feature-engineering', 'reliable-ai-integration', 'scoped-delivery'] as const;
export const templates = ['PROJECT_PROFILE.md', 'AGENTS.foundation.md', 'START_HERE.md', 'ENGINEERING_POLICY.template.md'];
const packageRoot = fileURLToPath(new URL('../', import.meta.url));

function walk(directory: string, prefix = ''): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
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

export function initialize(options: { destination: string; tool: Tool; selected?: string[]; dryRun?: boolean }) {
  if (!Object.hasOwn(tools, options.tool)) throw new Error('Unknown tool');
  const selected = [...new Set(['project-foundation', ...(options.selected ?? modules)])];
  for (const name of selected) if (!modules.includes(name as typeof modules[number])) throw new Error(`Unknown module: ${name}`);
  const destination = path.resolve(options.destination);
  checkPath(destination);
  if (destination === packageRoot || destination.startsWith(packageRoot + path.sep)) throw new Error('Install outside the distribution directory');
  if (stat(destination) && !stat(destination)?.isDirectory()) throw new Error('Destination must be a directory');
  const files = new Map<string, Buffer>();
  for (const name of selected) {
    for (const otherRoot of Object.values(tools)) {
      if (otherRoot !== tools[options.tool] && stat(path.join(destination, otherRoot, name))) throw new Error(`Duplicate skill in another host directory: ${otherRoot}/${name}`);
    }
    const source = path.join(packageRoot, '.agents/skills', name);
    checkPath(source);
    for (const relative of walk(source)) {
      if (!/^(SKILL\.md|assets\/.*\.md|references\/.*\.md)$/.test(relative)) throw new Error(`Unexpected payload file: ${name}/${relative}`);
      files.set(`${tools[options.tool]}/${name}/${relative}`, profile(fs.readFileSync(path.join(source, relative)), options.tool));
    }
  }
  for (const template of templates) files.set(template, profile(fs.readFileSync(path.join(packageRoot, '.agents/skills/project-foundation/assets', template)), options.tool));
  files.set('DEVMETHOD-LICENSE', fs.readFileSync(path.join(packageRoot, 'LICENSE')));
  const hashes = Object.fromEntries([...files].map(([name, data]) => [name, createHash('sha256').update(data).digest('hex')]));
  files.set('kit-manifest.json', Buffer.from(JSON.stringify({ format: 2, kit: 'devmethod', tool: options.tool, skills: selected, files: hashes }, null, 2) + '\n'));
  const pending: [string, Buffer][] = [];
  for (const [relative, data] of files) {
    const target = path.join(destination, relative);
    checkPath(target);
    const info = stat(target);
    if (info) {
      if (!info.isFile() || !fs.readFileSync(target).equals(data)) throw new Error(`Conflict; no files written: ${relative}`);
    } else pending.push([target, data]);
  }
  const created: string[] = [];
  const directories: string[] = [];
  function mkdir(directory: string): void {
    if (stat(directory)) return;
    mkdir(path.dirname(directory));
    fs.mkdirSync(directory);
    directories.push(directory);
  }
  if (!options.dryRun) {
    try {
      for (const [target, data] of pending) {
        mkdir(path.dirname(target));
        checkPath(target);
        const descriptor = fs.openSync(target, 'wx');
        created.push(target);
        try { fs.writeFileSync(descriptor, data); } finally { fs.closeSync(descriptor); }
      }
    } catch (error) {
      for (const file of created.reverse()) fs.unlinkSync(file);
      for (const directory of directories.reverse()) fs.rmdirSync(directory);
      throw error;
    }
  }
  return { destination, tool: options.tool, skills: selected, files: files.size, new: pending.length, identical: files.size - pending.length, dryRun: Boolean(options.dryRun) };
}
