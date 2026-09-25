import { policy } from './policy.js';
function requireValue(value, message) {
    if (!value)
        throw new Error(`Control Plane : ${message}`);
}
function record(value) {
    requireValue(value && typeof value === 'object' && !Array.isArray(value), 'objet invalide.');
}
function list(value, maximum) {
    requireValue(Array.isArray(value) && value.length <= maximum, 'journal absent ou capacité atteinte.');
}
function text(value) {
    requireValue(typeof value === 'string' && value.length <= 20000, 'texte invalide.');
}
function validateSnapshot(value) {
    record(value);
    text(value.key);
    text(value.contextKey);
    record(value.input);
    record(value.input.action);
    record(value.input.dependencies);
    requireValue(['guided', 'devauto', 'delegated'].includes(String(value.input.requested)), 'mode invalide.');
    requireValue(Number.isFinite(Date.parse(String(value.input.at))), 'date invalide.');
    record(value.decision);
    record(value.risk);
    record(value.evidence);
    requireValue(['Auto-Continue', 'Verify', 'Human Decision', 'Bounded Stop'].includes(String(value.decision.effective)), 'décision invalide.');
    requireValue(value.decision.policyId === policy.id && value.risk.policyId === policy.id, 'politique inconnue.');
    list(value.nodes, 5000);
    list(value.edges, 20000);
    for (const node of value.nodes) {
        record(node);
        text(node.id);
        text(node.label);
        text(node.explanation);
        text(node.source);
        record(node.dependencies);
        list(node.limits, 100);
        requireValue(['observed', 'declared', 'inferred', 'missing'].includes(String(node.status)), 'provenance invalide.');
        requireValue(['current', 'stale', 'unavailable'].includes(String(node.freshness)), 'fraîcheur invalide.');
        requireValue(['passed', 'failed', 'unknown', 'running'].includes(String(node.outcome)), 'résultat invalide.');
        requireValue(typeof node.required === 'boolean', 'couverture invalide.');
    }
    const ids = new Set(value.nodes.map((node) => node.id));
    requireValue(ids.size === value.nodes.length, 'nœuds dupliqués.');
    for (const edge of value.edges) {
        record(edge);
        requireValue(ids.has(edge.from) && ids.has(edge.to), 'relation sans cible.');
        requireValue(['validates', 'contradicts', 'depends-on', 'invalidates'].includes(String(edge.relation)), 'relation invalide.');
    }
}
export function validateControlPlane(value) {
    record(value);
    requireValue(value.schemaVersion === 1 && JSON.stringify(value.policy) === JSON.stringify(policy), 'format ou politique inconnus ; aucun remplacement automatique.');
    validateSnapshot(value.snapshot);
    list(value.history, 250);
    list(value.transitions, 2000);
    list(value.attention, 2000);
    list(value.interventions, 1000);
    value.history.forEach(validateSnapshot);
    for (const item of value.attention) {
        record(item);
        text(item.id);
        text(item.contextKey);
        text(item.cause);
        list(item.evidenceIds, 5000);
        list(item.riskIds, 100);
        requireValue(['open', 'read', 'resolved', 'rejected', 'superseded'].includes(String(item.status)), 'état d’attention invalide.');
    }
    for (const entry of value.interventions) {
        record(entry);
        text(entry.id);
        text(entry.reason);
        text(entry.itemId);
        text(entry.contextKey);
        requireValue(entry.actor === 'user' && ['accept', 'reject'].includes(String(entry.resolution)), 'intervention invalide.');
    }
}
export function validateControlTransition(previous, next) {
    if (!previous)
        return;
    requireValue(next, 'le journal ne peut pas être supprimé.');
    for (const key of ['history', 'interventions', 'transitions']) {
        requireValue(next[key].length >= previous[key].length, 'le passé ne peut pas être supprimé.');
        previous[key].forEach((entry, index) => requireValue(JSON.stringify(entry) === JSON.stringify(next[key][index]), 'le passé ne peut pas être réécrit.'));
    }
}
