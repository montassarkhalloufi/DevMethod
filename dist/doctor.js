import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { tools, modules, templates } from './init.js';
import { commandSkills } from './commands.js';
import { parseJson, checkPath, stat } from './filesystem.js';
function object(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function validateManifest(value) {
    if (!object(value) || value.format !== 2 || value.kit !== 'devmethod' ||
        typeof value.tool !== 'string' || !Object.hasOwn(tools, value.tool) ||
        !Array.isArray(value.skills) || !value.skills.includes('project-foundation') ||
        new Set(value.skills).size !== value.skills.length ||
        !value.skills.every(name => typeof name === 'string' && modules.includes(name)) ||
        !object(value.files))
        throw new Error('Expected a DevMethod format 2 manifest with a supported host and unique modules including project-foundation.');
    const root = tools[value.tool];
    const supportedSkills = [...value.skills, ...commandSkills(value.skills)];
    const required = [...templates, 'DEVMETHOD-LICENSE', ...value.skills.map(name => `${root}/${name}/SKILL.md`)];
    for (const name of required) {
        if (!Object.hasOwn(value.files, name))
            throw new Error(`Manifest is missing required entry: ${name}`);
    }
    // Validate every entry before any payload reads. A manifest never grants filesystem access.
    for (const [name, hash] of Object.entries(value.files)) {
        const parts = name.split('/');
        const safe = parts.every(part => /^[a-zA-Z0-9._-]+$/.test(part) && part !== '.' && part !== '..');
        const rootFile = templates.includes(name) || name === 'DEVMETHOD-LICENSE';
        const skillFile = parts.slice(0, 2).join('/') === root && supportedSkills.includes(parts[2]) &&
            ((parts.length === 4 && parts[3] === 'SKILL.md') ||
                (parts.length >= 5 && ['assets', 'references'].includes(parts[3] ?? '') && name.endsWith('.md')));
        if (!safe || (!rootFile && !skillFile))
            throw new Error(`Manifest contains an unsupported path: ${name}`);
        if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash))
            throw new Error(`Invalid SHA-256 for: ${name}`);
    }
    if (value.provenance !== undefined) {
        const p = value.provenance;
        if (!object(p) || p.packageName !== 'devmethod-ai' || typeof p.packageVersion !== 'string' ||
            !/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.+-]+)?$/.test(p.packageVersion) ||
            typeof p.payloadSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(p.payloadSha256))
            throw new Error('Invalid installation provenance.');
    }
    return value;
}
/** Inspect the recorded installation baseline without writes, commands or network calls. */
export function diagnose(destination) {
    const report = { format: 1, destination: path.resolve(destination), status: 'ok', checked: 0, unchanged: 0, findings: [] };
    const add = (severity, code, message, file) => {
        report.findings.push({ severity, code, ...(file === undefined ? {} : { path: file }), message });
        if (severity === 'error' || report.status === 'ok')
            report.status = severity;
    };
    let manifest;
    try {
        const file = path.join(report.destination, 'kit-manifest.json');
        checkPath(file);
        const info = stat(file);
        if (!info) {
            add('error', 'manifest-missing', 'No installation manifest. Check --dest or install into a fresh staging directory.', 'kit-manifest.json');
            return report;
        }
        if (!info.isFile() || info.size > 1024 * 1024)
            throw new Error('Manifest must be a regular file no larger than 1 MiB.');
        manifest = validateManifest(parseJson(fs.readFileSync(file, 'utf8')));
    }
    catch (error) {
        add('error', 'manifest-invalid', error instanceof Error ? error.message : String(error), 'kit-manifest.json');
        return report;
    }
    report.tool = manifest.tool;
    report.skills = manifest.skills;
    for (const [relative, expected] of Object.entries(manifest.files)) {
        report.checked++;
        try {
            const file = path.join(report.destination, relative);
            checkPath(file);
            const info = stat(file);
            if (!info) {
                add('error', 'file-missing', 'Restore from a reviewed staging installation.', relative);
                continue;
            }
            if (!info.isFile()) {
                add('error', 'file-type', 'Expected a regular file.', relative);
                continue;
            }
            const actual = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
            if (actual === expected.toLowerCase())
                report.unchanged++;
            else
                add('warning', 'file-modified', 'Differs from the initial installation. Review intentional customization; nothing was overwritten.', relative);
        }
        catch (error) {
            add('error', 'file-unreadable', error instanceof Error ? error.message : String(error), relative);
        }
    }
    for (const name of [...manifest.skills, ...commandSkills(manifest.skills)]) {
        for (const root of Object.values(tools)) {
            if (root === tools[manifest.tool])
                continue;
            const relative = `${root}/${name}`;
            try {
                const file = path.join(report.destination, relative);
                checkPath(file);
                if (stat(file))
                    add('error', 'duplicate-host', 'Another host contains this module. Keep one reviewed copy per project.', relative);
            }
            catch (error) {
                add('error', 'host-unreadable', error instanceof Error ? error.message : String(error), relative);
            }
        }
    }
    return report;
}
