import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkPath, parseJson } from './filesystem.js';
import { digest, hash, id, object, text } from './records.js';
import { boundedFile, inside } from './evidence-contract.js';
function ensure(value, label) {
    if (!value)
        throw new Error(`Invalid evidence state: ${label}.`);
}
function fields(value, required, optional = '') {
    ensure(object(value), 'expected record');
    ensure(required.split(' ').every((key) => Object.hasOwn(value, key)) &&
        Object.keys(value).every((key) => [...required.split(' '), ...optional.split(' ').filter(Boolean)].includes(key)), 'record fields');
    return value;
}
function entries(value, minimum = 0, maximum = 64) {
    ensure(Array.isArray(value) && value.length >= minimum && value.length <= maximum, 'array bounds');
    return value;
}
const date = (value) => text(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const note = (value) => value === null || text(value);
const member = (value, choices) => typeof value === 'string' && choices.split(' ').includes(value);
export function evidenceFailureSignature(criteria) {
    return digest(JSON.stringify(criteria
        .filter(({ status }) => status === 'failed' || status === 'calibration-failed')
        .map(({ id: key, status }) => [key, status])
        .sort(([a], [b]) => a.localeCompare(b))));
}
function validateCriteria(value) {
    const criteria = entries(value, 1).map((item) => {
        const criterion = fields(item, 'id status');
        ensure(id(criterion.id) &&
            member(criterion.status, 'supported failed calibration-failed unchallenged interrupted'), 'criterion');
        return criterion;
    });
    ensure(new Set(criteria.map(({ id }) => id)).size === criteria.length, 'duplicate criterion');
    return criteria;
}
function validateResults(value, criteria) {
    const results = entries(value, 1).map((item) => {
        const result = fields(item, 'check mode status', 'reason verdicts');
        ensure(id(result.check) && id(result.mode) && member(result.status, 'completed interrupted not-run'), 'result identity');
        if (result.status === 'completed') {
            ensure(result.reason === undefined && object(result.verdicts), 'completed result envelope');
            const verdicts = Object.entries(result.verdicts);
            ensure(verdicts.length > 0 &&
                verdicts.every(([key, verdict]) => criteria.some(({ id }) => id === key) &&
                    (verdict === 'passed' || verdict === 'failed')), 'criterion verdicts');
        }
        else {
            ensure(result.verdicts === undefined, 'unfinished result verdicts');
            ensure(result.status === 'interrupted'
                ? text(result.reason)
                : result.reason === undefined || result.reason === 'calibration-failed', 'unfinished result reason');
        }
        return result;
    });
    ensure(new Set(results.map(({ check, mode }) => `${check}/${mode}`)).size === results.length, 'duplicate result');
    const interrupted = results.findIndex(({ status }) => status === 'interrupted');
    ensure(results.every((result, index) => index > interrupted && interrupted >= 0
        ? result.status === 'not-run'
        : result.status !== 'not-run' || result.reason === 'calibration-failed'), 'interrupted result order');
    return results;
}
function validateAttempt(value, permits, halted) {
    const attempt = fields(value, 'startedAt durationMs outcome permit before after signature criteria results diagnosis adjustment');
    ensure(hash(attempt.permit) &&
        permits.has(attempt.permit) &&
        hash(attempt.before) &&
        (attempt.after === null || hash(attempt.after)), 'attempt provenance');
    ensure(date(attempt.startedAt) &&
        typeof attempt.durationMs === 'number' &&
        Number.isFinite(attempt.durationMs) &&
        attempt.durationMs >= 0 &&
        attempt.durationMs <= Number.MAX_SAFE_INTEGER, 'attempt timing');
    ensure(note(attempt.diagnosis) && note(attempt.adjustment), 'attempt notes');
    ensure(member(attempt.outcome, 'supported failed unchallenged interrupted'), 'attempt outcome');
    const criteria = validateCriteria(attempt.criteria);
    const results = validateResults(attempt.results, criteria);
    const failures = criteria.some(({ status }) => status === 'failed' || status === 'calibration-failed');
    ensure(attempt.signature ===
        (attempt.outcome === 'failed' ? evidenceFailureSignature(criteria) : null), 'failure identity');
    if (attempt.outcome === 'supported') {
        ensure(criteria.every(({ status }) => status === 'supported') &&
            results.every(({ status }) => status === 'completed') &&
            attempt.before === attempt.after, 'supported attempt');
        ensure(criteria.every(({ id }) => results.some((result) => result.mode === 'candidate' && result.verdicts?.[id] === 'passed')), 'supported candidate coverage');
        ensure(results
            .filter(({ mode }) => mode === 'candidate')
            .every(({ verdicts }) => Object.values(verdicts).every((verdict) => verdict === 'passed')), 'supported candidate verdicts');
    }
    if (attempt.outcome === 'failed')
        ensure(failures && results.every(({ status }) => status !== 'interrupted'), 'failed attempt');
    if (attempt.outcome === 'unchallenged')
        ensure(!failures &&
            criteria.some(({ status }) => status === 'unchallenged') &&
            results.every(({ status }) => status === 'completed'), 'unchallenged attempt');
    if (attempt.outcome === 'interrupted')
        ensure(results.some(({ status }) => status === 'interrupted') || halted, 'interrupted attempt');
    if (results.some(({ status }) => status === 'interrupted'))
        ensure(attempt.outcome === 'interrupted', 'interrupted outcome');
    return attempt;
}
function validateState(value) {
    const state = fields(value, 'format scope pending halted reason maxAttempts maxNoProgress revisions attempts');
    const scope = fields(state.scope, 'root evaluatorRoot contractPath');
    ensure(Object.values(scope).every((value) => text(value) && path.isAbsolute(value) && path.resolve(value) === value), 'scope');
    ensure(state.format === 1 && typeof state.pending === 'boolean' && typeof state.halted === 'boolean', 'execution state');
    ensure(state.halted ? text(state.reason) : state.reason === null, 'halt reason');
    ensure([state.maxAttempts, state.maxNoProgress].every((number) => Number.isInteger(number) && Number(number) >= 1 && Number(number) <= 10), 'bounds');
    const revisions = entries(state.revisions, 0, 10).map((value) => {
        const revision = fields(value, 'permit contractSha256 adoptedAt');
        ensure(hash(revision.permit) && hash(revision.contractSha256) && date(revision.adoptedAt), 'revision');
        return revision;
    });
    const permits = new Set(revisions.map(({ permit }) => String(permit)));
    const attempts = entries(state.attempts, 0, 10).map((attempt) => validateAttempt(attempt, permits, state.halted === true));
    ensure(revisions.length <= attempts.length + Number(state.pending) &&
        attempts.length <= Number(state.maxAttempts), 'history bounds');
    return state;
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
