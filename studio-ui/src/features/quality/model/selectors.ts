import type { QualityCheck, QualityStatus } from './contracts';

export const statusLabels: Record<QualityStatus | 'configure', string> = {
  notrun: 'Non exécuté',
  running: 'En cours',
  passed: 'Réussi',
  failed: 'Échec',
  blocked: 'Bloqué',
  notapplicable: 'Non applicable',
  configure: 'Connexion nécessaire',
};
export function checkStatus(check: QualityCheck): QualityStatus | 'configure' {
  return check.execution === 'external' &&
    !check.evidence &&
    check.status === 'blocked' &&
    check.freshness === 'current'
    ? 'configure'
    : check.status;
}
export function runnableChecks(checks: QualityCheck[]) {
  return checks.filter(
    (check) => check.canRun && check.execution === 'studio' && check.freshness === 'current',
  );
}
export const freshnessLabels = {
  current: 'Version sélectionnée',
  obsolete: 'Autre version',
  reevaluate: 'À réévaluer',
} as const;

export function filterChecks(checks: QualityCheck[], category: string, status: string) {
  return checks.filter(
    (check) =>
      (category === 'all' || check.category === category) &&
      (status === 'all' || checkStatus(check) === status),
  );
}

export function summarizeChecks(checks: QualityCheck[]) {
  return checks.reduce(
    (counts, check) => {
      counts.total++;
      if (check.freshness !== 'current') {
        counts.reevaluate++;
        return counts;
      }
      counts[checkStatus(check)]++;
      return counts;
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      notrun: 0,
      blocked: 0,
      configure: 0,
      running: 0,
      notapplicable: 0,
      reevaluate: 0,
    },
  );
}

export const shortRevision = (revision: string) => revision.slice(0, 8);
export function durationLabel(milliseconds: number | null | undefined) {
  if (milliseconds == null) return '—';
  return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(2)} s`;
}
export function dateLabel(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'Non exécuté';
}
