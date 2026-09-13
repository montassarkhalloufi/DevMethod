import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { bundledFiles, bundledProvenance } from './init.js';
import { diagnose, validateManifest } from './doctor.js';
import { checkPath, stat } from './filesystem.js';
const hash = (data) => createHash('sha256').update(data).digest('hex');
/** Preview only. No staging writes, migrations, subprocesses, or network calls. */
export function previewUpdate(destination) {
    const report = { format: 1, destination: path.resolve(destination), status: 'ok', provenance: 'unknown', entries: [], findings: [] };
    try {
        const diagnostics = diagnose(report.destination);
        report.findings.push(...diagnostics.findings);
        report.status = diagnostics.status;
        // Missing files are represented in the comparison, but remain diagnostic errors.
        if (diagnostics.findings.some(f => f.severity === 'error' && f.code !== 'file-missing'))
            return report;
        const manifestPath = path.join(report.destination, 'kit-manifest.json');
        checkPath(manifestPath);
        const info = stat(manifestPath);
        if (!info?.isFile() || info.size > 1024 * 1024)
            throw new Error('Invalid manifest file.');
        const manifest = validateManifest(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
        report.installed = manifest.provenance;
        report.provenance = manifest.provenance ? 'recorded' : 'unknown';
        if (!manifest.provenance) {
            if (report.status === 'ok')
                report.status = 'warning';
            report.findings.push({ code: 'provenance-unknown', message: 'Legacy installation: package version is unknown; recorded file hashes remain the comparison baseline.' });
        }
        const candidate = bundledFiles(manifest.tool, manifest.skills);
        const hashes = Object.fromEntries([...candidate].map(([name, data]) => [name, hash(data)]));
        report.candidate = bundledProvenance(hashes);
        for (const name of [...new Set([...Object.keys(manifest.files), ...candidate.keys()])].sort()) {
            const baseline = manifest.files[name]?.toLowerCase();
            const next = hashes[name];
            const file = path.join(report.destination, name);
            checkPath(file);
            const current = stat(file);
            if (current && !current.isFile())
                throw new Error(`Expected a regular file: ${name}`);
            const actual = current ? hash(fs.readFileSync(file)) : undefined;
            const customized = baseline !== undefined && actual !== baseline;
            const classification = baseline === undefined ? 'added' : customized && baseline !== next && actual !== next ? 'conflict' : customized ? 'customized' : next === undefined ? 'removed' : baseline === next ? 'unchanged' : 'updated';
            const collision = baseline === undefined && actual !== undefined;
            report.entries.push({ path: name, classification, installedSha256: actual, baselineSha256: baseline, candidateSha256: next,
                candidateChanged: baseline !== next, ...(actual === undefined ? { missing: true } : {}), ...(collision ? { collision: true } : {}) });
            if ((customized || collision) && report.status === 'ok')
                report.status = 'warning';
        }
    }
    catch (error) {
        report.status = 'error';
        report.findings.push({ code: 'preview-failed', message: error instanceof Error ? error.message : String(error) });
    }
    return report;
}
