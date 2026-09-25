import fs from 'node:fs';
import { digest, safeFile } from './files.mjs';
import { portableBudget } from './budget.mjs';
import { createJobProgress } from './progress.mjs';
import { evidenceNode } from './control-sources.mjs';

export function runnerStop(store, sourceIssues) {
  try {
    const file = safeFile(store.root, '.devmethod/agent.json');
    if (!fs.existsSync(file)) return null;
    const info = fs.lstatSync(file);
    if (!info.isFile() || info.size > 1024 * 1024) throw new Error('Invalid ledger');
    const ledger = portableBudget(file);
    const live = new Set(
      store
        .read()
        .jobs.filter((job) => job.status === 'running')
        .map((job) => job.id),
    );
    for (const run of store.read().controlPlane?.analyses ?? [])
      if (run.status === 'running') live.add(run.id);
    return ledger.unknownUsage ||
      ledger.runs.some((run) => run.status === 'running' && !live.has(run.jobId))
      ? digest(JSON.stringify(ledger))
      : null;
  } catch {
    sourceIssues.push('Budget du runner indisponible ; aucune reprise automatique.');
    return 'unavailable-runner-ledger';
  }
}

export function progressNodes(store, context, sourceIssues) {
  const progress = createJobProgress(store),
    nodes = [];
  for (const job of store.read().jobs.slice(-20)) {
    try {
      const journal = progress.read(job.id);
      for (const action of journal.actions ?? [])
        nodes.push(
          evidenceNode(context, {
            id: `progress:${job.id}:${action.id}`,
            kind: 'job',
            label: action.label,
            missionId: job.id,
            revisionId: job.baseRevision,
            at: action.at ?? job.createdAt,
            source: 'Progression déclarée par l’agent',
            status: 'declared',
            explanation: `Action ${action.kind} déclarée ${action.status} ; ce statut ne prouve pas la réussite d’un contrôle.`,
            link: action.path
              ? { panel: 'code', path: action.path, revisionId: job.baseRevision ?? undefined }
              : { panel: 'history' },
          }),
        );
    } catch {
      sourceIssues.push('Une progression de mission est indisponible.');
    }
  }
  return nodes;
}

export function observedSecuritySignals(nodes) {
  return nodes
    .filter(
      (node) =>
        node.checkId === 'secret-markers' &&
        node.outcome === 'failed' &&
        node.freshness === 'current',
    )
    .map((node) => ({
      id: 'security-secret',
      category: 'permissions',
      level: 'high',
      reason: 'Un contrôle a détecté des marqueurs de secrets ; corriger avant toute transmission.',
      evidenceIds: [node.id],
      humanResolvable: false,
    }));
}
