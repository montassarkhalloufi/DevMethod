export function refreshGraph(input) {
    const nodes = input.nodes.map((node) => {
        const dependencies = Object.entries(node.dependencies);
        const changed = dependencies.some(([key, value]) => input.dependencies[key] !== value);
        const revisionChanged = node.dependencyScope === 'revision' && node.revisionId !== input.revisionId;
        const expired = Boolean(node.expiresAt && Date.parse(node.expiresAt) <= Date.parse(input.at));
        const stale = changed || revisionChanged || expired;
        return { ...node, freshness: stale ? 'stale' : node.freshness };
    });
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const edges = [...input.edges];
    const invalid = new Set(nodes
        .filter((node) => node.freshness !== 'current' || node.outcome === 'failed')
        .map((node) => node.id));
    // Traverse reverse dependencies once per invalidated node; cycles terminate.
    const dependents = new Map();
    for (const edge of edges) {
        if (edge.relation === 'depends-on')
            dependents.set(edge.to, [...(dependents.get(edge.to) ?? []), edge.from]);
        if (['contradicts', 'invalidates'].includes(edge.relation))
            invalid.add(edge.to);
    }
    const queue = [...invalid];
    for (let index = 0; index < queue.length; index++) {
        for (const id of dependents.get(queue[index]) ?? []) {
            if (!invalid.has(id)) {
                invalid.add(id);
                queue.push(id);
            }
        }
    }
    for (const id of invalid) {
        const node = byId.get(id);
        if (node && node.outcome !== 'failed' && node.freshness === 'current')
            node.freshness = 'stale';
    }
    edges.push(...invalidationEdges(nodes, input.revisionId));
    return { nodes, edges };
}
function invalidationEdges(nodes, revisionId) {
    const code = nodes.find((entry) => entry.kind === 'code' && entry.revisionId === revisionId);
    if (!code)
        return [];
    return nodes
        .filter((entry) => entry.freshness === 'stale' && entry.id !== code.id)
        .map((node) => ({
        id: `invalid:${code.id}:${node.id}`,
        from: code.id,
        to: node.id,
        relation: 'invalidates',
        explanation: 'Une dépendance ou la version observée ne correspond plus.',
    }));
}
