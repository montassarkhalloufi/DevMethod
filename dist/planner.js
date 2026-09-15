import { object, text, id, safePath } from './records.js';
const strings = (value) => Array.isArray(value) &&
    value.length <= 128 &&
    value.every(text) &&
    new Set(value).size === value.length;
function overlaps(first, second) {
    const a = first.toLowerCase(), b = second.toLowerCase();
    return a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
}
function validAttempts(attempts, maximum) {
    return (Number.isInteger(attempts) &&
        attempts >= 0 &&
        Number.isInteger(maximum) &&
        maximum >= 1 &&
        maximum <= 10 &&
        attempts <= maximum);
}
function validTask(value) {
    return (object(value) &&
        id(value.id) &&
        text(value.owner) &&
        safePath(value.worktree) &&
        strings(value.owns) &&
        value.owns.length > 0 &&
        value.owns.every(safePath) &&
        strings(value.dependsOn) &&
        value.dependsOn.every(id) &&
        strings(value.acceptance) &&
        value.acceptance.length > 0 &&
        safePath(value.checkpoint) &&
        typeof value.status === 'string' &&
        ['pending', 'running', 'passed', 'failed', 'blocked', 'cancelled'].includes(value.status) &&
        validAttempts(value.attempts, value.maxAttempts) &&
        typeof value.evidence === 'string' &&
        ['current', 'stale', 'missing'].includes(value.evidence));
}
function validatePlan(input) {
    if (!object(input) ||
        input.format !== 1 ||
        typeof input.status !== 'string' ||
        !['active', 'complete', 'cancelled'].includes(input.status) ||
        ![1, 2].includes(input.concurrency) ||
        !text(input.contractOwner) ||
        !strings(input.sharedContracts) ||
        !input.sharedContracts.every(safePath) ||
        !Array.isArray(input.tasks) ||
        !input.tasks.length ||
        input.tasks.length > 128)
        throw new Error('Expected bounded plan format 1, concurrency 1 or 2, contractOwner, sharedContracts and 1–128 tasks.');
    for (const task of input.tasks) {
        if (!validTask(task))
            throw new Error('Invalid task: require ownership, isolated worktree, dependencies, acceptance, bounded attempts, checkpoint and evidence state.');
    }
    return input;
}
function validateTaskRelations(plan, byId) {
    if (byId.size !== plan.tasks.length)
        throw new Error('Duplicate task ID.');
    for (const task of plan.tasks) {
        if (task.dependsOn.some((dependency) => !byId.has(dependency)))
            throw new Error('Unknown dependency.');
        const writesSharedContract = task.owns.some((owned) => plan.sharedContracts.some((contract) => overlaps(owned, contract)));
        if (writesSharedContract && task.owner !== plan.contractOwner)
            throw new Error('Shared contracts require the single contract owner.');
        if (['running', 'passed', 'failed'].includes(task.status) && task.attempts === 0)
            throw new Error('Running, passed or failed tasks require a recorded attempt.');
    }
}
function validateIsolation(tasks) {
    for (let index = 0; index < tasks.length; index++) {
        const first = tasks[index];
        for (const second of tasks.slice(index + 1)) {
            if (overlaps(first.worktree, second.worktree))
                throw new Error('Worktrees must be distinct and non-nested.');
            if (first.owns.some((owned) => second.owns.some((other) => overlaps(owned, other))))
                throw new Error('Task ownership must not overlap, even across dependent tasks.');
        }
    }
}
function dependencyOrder(tasks) {
    const done = new Set();
    while (done.size < tasks.length) {
        let progress = false;
        for (const task of tasks) {
            if (!done.has(task.id) && task.dependsOn.every((dependency) => done.has(dependency))) {
                done.add(task.id);
                progress = true;
            }
        }
        if (!progress)
            throw new Error('Task dependency cycle.');
    }
    return done;
}
function taskState(task, results) {
    if (task.status === 'running')
        return 'needs-reconciliation';
    const prerequisitesPassed = task.dependsOn.every((dependency) => results.get(dependency) === 'passed');
    if (task.status === 'passed')
        return task.evidence === 'current' && prerequisitesPassed ? 'passed' : 'blocked';
    if (task.status !== 'pending')
        return task.status;
    if (task.attempts >= task.maxAttempts)
        return 'exhausted';
    if (task.evidence === 'stale')
        return 'blocked';
    return prerequisitesPassed ? 'eligible' : 'blocked';
}
function inspectTaskStates(byId, order) {
    const results = new Map();
    for (const key of order)
        results.set(key, taskState(byId.get(key), results));
    return results;
}
function validatePlanState(plan, results) {
    const running = plan.tasks.filter((task) => task.status === 'running').length;
    if (running > plan.concurrency)
        throw new Error('Running tasks exceed concurrency.');
    if (plan.status === 'complete' && [...results.values()].some((state) => state !== 'passed'))
        throw new Error('Completed plan requires current passing evidence for every task.');
    return running;
}
function selectCandidates(plan, results, running) {
    if (plan.status !== 'active' || running !== 0)
        return [];
    return plan.tasks
        .filter((task) => results.get(task.id) === 'eligible')
        .slice(0, plan.concurrency)
        .map((task) => task.id);
}
export function inspectPlan(input) {
    const plan = validatePlan(input);
    const byId = new Map(plan.tasks.map((task) => [task.id, task]));
    validateTaskRelations(plan, byId);
    validateIsolation(plan.tasks);
    const results = inspectTaskStates(byId, dependencyOrder(plan.tasks));
    const running = validatePlanState(plan, results);
    const candidates = selectCandidates(plan, results, running);
    return {
        format: 1,
        status: plan.status,
        tasks: plan.tasks.map((task) => ({ id: task.id, state: results.get(task.id) })),
        candidates,
        adapter: 'manual-planning-only',
        dispatch: 'not-implemented',
        limitations: 'Claims are supplied by the operator; validate checkpoint evidence and actual isolated worktrees before use. Running tasks require reconciliation. No retries, host dispatch or new authorization.',
    };
}
