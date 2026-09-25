const categories = ['visual', 'interaction', 'network', 'concurrency', 'permissions', 'logic'];
const text = (value, max = 2000) => typeof value === 'string' && value.length > 0 && value.length <= max;
function requireValid(value) {
    if (!value)
        throw new Error('Journal d’analyse de risque invalide.');
}
function record(value) {
    requireValid(value && typeof value === 'object' && !Array.isArray(value));
}
export function validateRiskOutput(value) {
    record(value);
    requireValid(Object.keys(value).every((key) => ['summary', 'findings', 'limits'].includes(key)));
    requireValid(text(value.summary) && Array.isArray(value.findings) && value.findings.length <= 10);
    requireValid(Array.isArray(value.limits) &&
        value.limits.length <= 20 &&
        value.limits.every((entry) => text(entry)));
    for (const finding of value.findings) {
        record(finding);
        requireValid(Object.keys(finding).every((key) => [
            'category',
            'path',
            'side',
            'line',
            'reason',
            'invariant',
            'scenario',
            'uncertainty',
        ].includes(key)));
        requireValid(categories.includes(String(finding.category)) &&
            ['before', 'after'].includes(String(finding.side)));
        requireValid(Number.isSafeInteger(finding.line) && Number(finding.line) > 0);
        for (const key of ['path', 'reason', 'invariant', 'scenario', 'uncertainty'])
            requireValid(text(finding[key]));
    }
}
export function validateRiskRuns(value) {
    requireValid(Array.isArray(value) && value.length <= 100);
    const ids = new Set();
    for (const run of value) {
        record(run);
        for (const key of ['id', 'contextKey', 'revisionId', 'provider'])
            requireValid(text(run[key]));
        requireValid(!ids.has(run.id));
        ids.add(run.id);
        requireValid(['running', 'completed', 'failed', 'cancelled', 'interrupted'].includes(String(run.status)));
        requireValid(Number.isFinite(Date.parse(String(run.startedAt))));
        if (run.status !== 'running')
            requireValid(Number.isFinite(Date.parse(String(run.finishedAt))));
        if (run.status === 'completed') {
            requireValid(run.usage != null);
            validateRiskOutput(run.output);
        }
        else
            requireValid(run.output === undefined);
        if (run.error !== undefined)
            requireValid(text(run.error));
        validateUsage(run.usage);
    }
    requireValid(value.filter((run) => run.status === 'running').length <= 1);
}
export function validateRiskRunTransition(previous = [], next = []) {
    requireValid(next.length >= previous.length);
    previous.forEach((old, index) => {
        const current = next[index];
        requireValid(current);
        if (old.status !== 'running')
            requireValid(JSON.stringify(old) === JSON.stringify(current));
        else
            for (const key of ['id', 'contextKey', 'revisionId', 'provider', 'startedAt'])
                requireValid(old[key] === current[key]);
    });
    for (const run of next.slice(previous.length))
        requireValid(run.status === 'running');
}
function validateUsage(value) {
    if (value == null)
        return;
    record(value);
    for (const key of ['inputTokens', 'outputTokens'])
        requireValid(Number.isSafeInteger(value[key]) && Number(value[key]) >= 0);
}
