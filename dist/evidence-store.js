import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkPath, parseJson } from './filesystem.js';
import { hash, object, text } from './records.js';
import { boundedFile, inside } from './evidence-contract.js';
function validateState(value) {
    if (!object(value) || value.format !== 1 || !object(value.scope))
        throw new Error('Invalid evidence state.');
    if (![value.scope.root, value.scope.evaluatorRoot, value.scope.contractPath].every(text))
        throw new Error('Invalid stored scope.');
    if (typeof value.pending !== 'boolean' || typeof value.halted !== 'boolean')
        throw new Error('Invalid stored execution state.');
    if (![value.maxAttempts, value.maxNoProgress].every((n) => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 10))
        throw new Error('Invalid stored bounds.');
    if (!Array.isArray(value.attempts) ||
        value.attempts.length > 10 ||
        !Array.isArray(value.revisions) ||
        value.revisions.length > 10)
        throw new Error('Invalid stored history.');
    for (const attempt of value.attempts) {
        if (!object(attempt) ||
            !hash(attempt.permit) ||
            !hash(attempt.before) ||
            !Array.isArray(attempt.criteria) ||
            !Array.isArray(attempt.results))
            throw new Error('Invalid stored attempt.');
        if (!['supported', 'failed', 'unchallenged', 'interrupted'].includes(String(attempt.outcome)))
            throw new Error('Invalid stored outcome.');
        if (attempt.criteria.length > 64 || attempt.results.length > 64)
            throw new Error('Stored attempt exceeds bounds.');
    }
    return value;
}
export function atomicRecord(directory, file, data, maxBytes) {
    const bytes = Buffer.from(JSON.stringify(data) + '\n');
    if (bytes.length > maxBytes)
        throw new Error('Evidence record exceeds storage bound.');
    const target = path.join(directory, file);
    checkPath(target);
    const temporary = `${target}.${randomUUID()}.tmp`;
    const descriptor = fs.openSync(temporary, 'wx', 0o600);
    try {
        fs.writeFileSync(descriptor, bytes);
        fs.fsyncSync(descriptor);
    }
    finally {
        fs.closeSync(descriptor);
    }
    fs.renameSync(temporary, target);
}
export function openEvidenceStore(options, session, create) {
    const directory = path.resolve(session);
    checkPath(directory);
    for (const root of [options.root, options.evaluatorRoot]) {
        if (inside(root, directory) || inside(directory, root))
            throw new Error('Session must be outside candidate and evaluator directories and their ancestors.');
    }
    if (!fs.existsSync(directory)) {
        if (!create)
            return null;
        fs.mkdirSync(directory, { mode: 0o700 });
    }
    if (!fs.statSync(directory).isDirectory())
        throw new Error('Expected session directory.');
    const lock = path.join(directory, 'lock');
    const descriptor = fs.openSync(lock, 'wx', 0o600);
    try {
        fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
        const statePath = path.join(directory, 'state.json');
        if (!fs.existsSync(statePath) && fs.readdirSync(directory).some((file) => file !== 'lock'))
            throw new Error('Unowned evidence session must be empty.');
        const state = fs.existsSync(statePath)
            ? validateState(parseJson(boundedFile(statePath, 2 * 1024 * 1024).toString('utf8')))
            : null;
        if (state && JSON.stringify(state.scope) !== JSON.stringify(options))
            throw new Error('Evidence session scope mismatch.');
        return {
            state,
            save: (record) => atomicRecord(directory, 'state.json', validateState(record), 2 * 1024 * 1024),
            freeze: (attempt, snapshot) => atomicRecord(directory, `snapshot-${attempt}.json`, snapshot, 48 * 1024 * 1024),
            close: () => {
                fs.closeSync(descriptor);
                fs.unlinkSync(lock);
            },
        };
    }
    catch (error) {
        fs.closeSync(descriptor);
        fs.unlinkSync(lock);
        throw error;
    }
}
