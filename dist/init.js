import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { commandSkills } from './commands.js';
import { reviewRuntimeFiles } from './review-runtime.js';
import { isVercelResource } from './skill-resources.js';
import { parseJson, checkPath, stat, MAX_MANIFEST_BYTES } from './filesystem.js';
export const tools = {
    codex: '.agents/skills',
    claude: '.claude/skills',
    cursor: '.cursor/skills',
};
export const modules = [
    'project-foundation',
    'decision-architecture',
    'design-to-code',
    'react-feature-engineering',
    'reliable-ai-integration',
    'scoped-delivery',
];
export const templates = [
    'PROJECT_PROFILE.md',
    'AGENTS.foundation.md',
    'START_HERE.md',
    'ENGINEERING_POLICY.template.md',
];
const packageRoot = fileURLToPath(new URL('../', import.meta.url));
function walk(directory, prefix = '') {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((entry) => {
        const relative = prefix + entry.name;
        if (entry.isSymbolicLink())
            throw new Error(`Symbolic source: ${relative}`);
        if (entry.isDirectory())
            return walk(path.join(directory, entry.name), relative + '/');
        if (!entry.isFile())
            throw new Error(`Unsupported source: ${relative}`);
        return [relative];
    });
}
function profile(data, tool) {
    return Buffer.from(data.toString().replace(/\.(?:agents|claude|cursor)\/skills/g, tools[tool]));
}
function selectModules(options) {
    if (!Object.hasOwn(tools, options.tool))
        throw new Error('Unknown tool');
    const selected = [...new Set(['project-foundation', ...(options.selected ?? modules)])];
    for (const name of selected) {
        if (!modules.includes(name))
            throw new Error(`Unknown module: ${name}`);
    }
    return selected;
}
function installationDestination(input) {
    const destination = path.resolve(input);
    checkPath(destination);
    if (destination === packageRoot || destination.startsWith(packageRoot + path.sep))
        throw new Error('Install outside the distribution directory');
    const info = stat(destination);
    if (info && !info.isDirectory())
        throw new Error('Destination must be a directory');
    return destination;
}
function assertNoDuplicateSkills(destination, tool, selected) {
    const alternateRoots = Object.values(tools).filter((root) => root !== tools[tool]);
    for (const name of [...selected, ...commandSkills(selected)]) {
        for (const root of alternateRoots) {
            if (stat(path.join(destination, root, name)))
                throw new Error(`Duplicate skill in another host directory: ${root}/${name}`);
        }
    }
}
function installationManifest(tool, selected, files) {
    const hashes = Object.fromEntries([...files].map(([name, data]) => [name, createHash('sha256').update(data).digest('hex')]));
    return {
        format: 2,
        kit: 'devmethod',
        tool,
        skills: selected,
        files: hashes,
        provenance: bundledProvenance(hashes),
    };
}
function matchesLegacyManifest(file, expected) {
    const existing = parseJson(fs.readFileSync(file, 'utf8'));
    return Boolean(existing &&
        typeof existing === 'object' &&
        existing.provenance === undefined &&
        existing.format === 2 &&
        existing.kit === expected.kit &&
        existing.tool === expected.tool &&
        JSON.stringify(existing.skills) === JSON.stringify(expected.skills) &&
        Object.keys(existing.files ?? {}).length === Object.keys(expected.files).length &&
        Object.entries(expected.files).every(([name, hash]) => existing.files?.[name] === hash));
}
function assertExistingFileMatches(relative, target, data, info, manifest) {
    const conflict = () => new Error(`Conflict; no files written: ${relative}`);
    if (!info.isFile())
        throw conflict();
    if (relative === 'kit-manifest.json') {
        if (info.size > MAX_MANIFEST_BYTES)
            throw new Error('Manifest must be a regular file no larger than 1 MiB.');
        // Preserve a legacy manifest only when the complete installation contract matches.
        if (matchesLegacyManifest(target, manifest))
            return;
    }
    if (info.size !== data.length || !fs.readFileSync(target).equals(data))
        throw conflict();
}
function findPendingFiles(destination, files, manifest) {
    const pending = [];
    for (const [relative, data] of files) {
        const target = path.join(destination, relative);
        checkPath(target);
        const info = stat(target);
        if (info)
            assertExistingFileMatches(relative, target, data, info, manifest);
        else
            pending.push([target, data]);
    }
    return pending;
}
function createDirectory(directory, created) {
    if (stat(directory))
        return;
    createDirectory(path.dirname(directory), created);
    fs.mkdirSync(directory);
    created.push(directory);
}
function installPendingFiles(pending) {
    const created = [];
    const directories = [];
    try {
        for (const [target, data] of pending) {
            createDirectory(path.dirname(target), directories);
            checkPath(target);
            const descriptor = fs.openSync(target, 'wx');
            created.push(target);
            try {
                fs.writeFileSync(descriptor, data);
            }
            finally {
                fs.closeSync(descriptor);
            }
        }
    }
    catch (error) {
        for (const file of created.reverse())
            fs.unlinkSync(file);
        for (const directory of directories.reverse())
            fs.rmdirSync(directory);
        throw error;
    }
}
export function initialize(options) {
    const selected = selectModules(options);
    const destination = installationDestination(options.destination);
    assertNoDuplicateSkills(destination, options.tool, selected);
    const files = bundledFiles(options.tool, selected);
    const manifest = installationManifest(options.tool, selected, files);
    files.set('kit-manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
    const pending = findPendingFiles(destination, files, manifest);
    if (!options.dryRun)
        installPendingFiles(pending);
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
function addSkillFiles(files, tool, selected) {
    for (const name of [...selected, ...commandSkills(selected)]) {
        const source = path.join(packageRoot, '.agents/skills', name);
        checkPath(source);
        for (const relative of walk(source)) {
            const vendor = name === 'react-feature-engineering' && relative.startsWith('references/vercel/');
            const vendorResource = isVercelResource(name, relative);
            if (!/^(SKILL\.md|assets\/.*\.md|references\/.*\.md)$/.test(relative) && !vendorResource)
                throw new Error(`Unexpected payload file: ${name}/${relative}`);
            const data = fs.readFileSync(path.join(source, relative));
            files.set(`${tools[tool]}/${name}/${relative}`, vendor ? data : profile(data, tool));
        }
    }
}
function addReviewRuntimeFiles(files, tool) {
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
export function bundledFiles(tool, selected) {
    const files = new Map();
    addSkillFiles(files, tool, selected);
    if (selected.includes('scoped-delivery'))
        addReviewRuntimeFiles(files, tool);
    for (const template of templates)
        files.set(template, profile(fs.readFileSync(path.join(packageRoot, '.agents/skills/project-foundation/assets', template)), tool));
    files.set('DEVMETHOD-LICENSE', fs.readFileSync(path.join(packageRoot, 'LICENSE')));
    return files;
}
export function bundledProvenance(hashes) {
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
