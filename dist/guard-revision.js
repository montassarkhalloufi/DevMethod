import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { checkPath } from './filesystem.js';
import { readLocal, readRecord, safePath, secretPath } from './records.js';
import { validateMission } from './mission.js';
const MAX_FILES = 10000;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
function gitOutput(root, args) {
    return execFileSync('git', [
        '--no-optional-locks',
        '--no-replace-objects',
        '-c',
        'core.fsmonitor=false',
        '-C',
        root,
        ...args,
    ], {
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: MAX_FILE_BYTES,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, GIT_PAGER: 'cat', GIT_TERMINAL_PROMPT: '0' },
    });
}
function entries(output, pattern) {
    const records = output.split('\0').filter(Boolean);
    if (records.length > MAX_FILES)
        throw new Error('Committed context exceeds the file limit.');
    const result = new Map();
    for (const record of records) {
        const match = pattern.exec(record);
        if (!match)
            throw new Error('Unsupported Git entry.');
        const mode = match[1];
        const oid = match[2];
        const file = match[3];
        if (!['100644', '100755'].includes(mode) ||
            !safePath(file) ||
            secretPath(file) ||
            result.has(file))
            throw new Error('Unverifiable committed path.');
        result.set(file, { mode, oid, file });
    }
    return result;
}
function matchingIndex(root, committed) {
    const indexed = entries(gitOutput(root, ['ls-files', '--stage', '-z']), /^(\d{6}) ([a-f0-9]{40}(?:[a-f0-9]{24})?) 0\t(.+)$/);
    return (indexed.size === committed.size &&
        [...indexed.values()].every((entry) => {
            const original = committed.get(entry.file);
            return original?.mode === entry.mode && original.oid === entry.oid;
        }));
}
function evidencePath(file, snapshot) {
    return (file === snapshot.reportPath ||
        file === snapshot.artifactPath ||
        file.startsWith(`${snapshot.artifactPath}/`));
}
function declaredInputsCommitted(root, snapshot, committed) {
    if (!safePath(snapshot.reportPath) || !safePath(snapshot.artifactPath))
        return false;
    // Evidence cannot disguise tracked code or configuration as an uncommitted observation.
    if ([...committed.keys()].some((file) => evidencePath(file, snapshot)))
        return false;
    const mission = validateMission(readRecord(root, snapshot.missionPath));
    const required = [
        ...mission.sources.map((source) => source.path),
        ...mission.acceptance.flatMap((criterion) => criterion.changes),
    ];
    return required.every((file) => committed.has(file) && !evidencePath(file, snapshot));
}
function committedBytesMatch(root, committed, algorithm) {
    let total = 0;
    for (const entry of committed.values()) {
        const target = path.resolve(root, entry.file);
        checkPath(target);
        const info = fs.lstatSync(target);
        total += info.size;
        if (!info.isFile() || info.size > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES)
            return false;
        // Windows does not expose Git's executable bit through ordinary file permissions.
        if (process.platform !== 'win32' && Boolean(info.mode & 0o111) !== (entry.mode === '100755'))
            return false;
        const bytes = readLocal(root, entry.file, MAX_FILE_BYTES);
        const oid = createHash(algorithm).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
        if (oid !== entry.oid)
            return false;
    }
    return true;
}
/** Strict raw-byte profile: no clean filters, text conversion, external diff or submodule traversal. */
export function hasCommittedGuardInputs(root, snapshot) {
    try {
        checkPath(path.resolve(root));
        const revision = gitOutput(root, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
        if (revision !== snapshot.git.commit || !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(revision))
            return false;
        const committed = entries(gitOutput(root, ['ls-tree', '-r', '-z', '--full-tree', revision]), /^(\d{6}) blob ([a-f0-9]{40}(?:[a-f0-9]{24})?)\t(.+)$/);
        return (matchingIndex(root, committed) &&
            declaredInputsCommitted(root, snapshot, committed) &&
            committedBytesMatch(root, committed, revision.length === 64 ? 'sha256' : 'sha1'));
    }
    catch {
        return false;
    }
}
