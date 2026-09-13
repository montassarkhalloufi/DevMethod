import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { checkPath } from './filesystem.js';
export const object = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
export const text = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 8192;
export const id = (v) => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(v);
export const digest = (v) => createHash('sha256').update(v).digest('hex');
export const hash = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export function safePath(v) {
    return typeof v === 'string' && v.length > 0 && v.length <= 1024 && !/[\\:\x00-\x1f\x7f]/.test(v)
        && v.split('/').every(p => p.length > 0 && p !== '.' && p !== '..' && !/[. ]$/.test(p)
            && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p));
}
export const secretPath = (v) => /(^|\/)(\.env(?:\..*)?|\.git|\.ssh|\.npmrc|credentials(?:\..*)?|secrets?(?:\..*)?)(\/|$)|\.(pem|key|p12|pfx)$/i.test(v);
export function readLocal(root, file, limit = 1024 * 1024) {
    if (!safePath(file))
        throw new Error('Expected a safe repository-relative path.');
    const target = path.resolve(root, file);
    checkPath(target);
    const info = fs.lstatSync(target);
    if (!info.isFile() || info.size > limit)
        throw new Error(`Expected regular file within ${limit} bytes: ${file}`);
    return fs.readFileSync(target);
}
export function readRecord(root, file) {
    if (secretPath(file))
        throw new Error('Secret-like record paths are excluded.');
    const bytes = readLocal(root, file);
    try {
        return JSON.parse(bytes.toString('utf8'));
    }
    catch {
        throw new Error('Invalid JSON record; source text omitted.');
    }
}
function git(root, args) {
    checkPath(path.resolve(root));
    return execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', '-C', path.resolve(root), ...args], {
        encoding: 'utf8', timeout: 10000, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, GIT_PAGER: 'cat', GIT_TERMINAL_PROMPT: '0' }
    });
}
export function gitState(root) {
    // Avoid status/diff: repository-configured clean filters can execute even during reads.
    // ls-files reads index metadata; hash raw tracked bytes ourselves, without conversion.
    const index = git(root, ['ls-files', '--stage', '-z']);
    const tracked = git(root, ['ls-files', '-z']).split('\0').filter(Boolean);
    if (tracked.length > 10000)
        throw new Error('Git provenance exceeds 10000 tracked files.');
    let bytesRead = 0;
    const working = tracked.map(file => {
        if (!safePath(file) || secretPath(file))
            return [file, 'excluded'];
        const target = path.resolve(root, file);
        checkPath(target);
        if (!fs.existsSync(target))
            return [file, 'missing'];
        const info = fs.lstatSync(target);
        if (info.isDirectory())
            return [file, 'directory-or-submodule'];
        bytesRead += info.size;
        if (bytesRead > 64 * 1024 * 1024)
            throw new Error('Git provenance exceeds 64 MiB of tracked content; use selected checkpoint pins instead.');
        return [file, digest(readLocal(root, file, 8 * 1024 * 1024)), info.mode & 0o111];
    });
    const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
    return { branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim(), commit: git(root, ['rev-parse', 'HEAD']).trim(),
        statusSha256: digest(index + '\0' + untracked), diffSha256: digest(JSON.stringify(working)) };
}
export function validGit(v) {
    return object(v) && text(v.branch) && typeof v.commit === 'string' && /^[a-f0-9]{40,64}$/.test(v.commit)
        && hash(v.statusSha256) && hash(v.diffSha256);
}
export function discover(root) {
    const files = git(root, ['ls-files', '-z']).split('\0').filter(v => safePath(v) && !secretPath(v));
    if (files.length > 10000)
        throw new Error('Discovery exceeds 10000 tracked paths; select sources explicitly.');
    return files;
}
