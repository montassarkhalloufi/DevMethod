import { translate } from '../../../i18n';
import type { QualityCheck, QualityStatus } from './contracts';

export const statusLabels = (
  locale: 'en' | 'fr' = 'en',
): Record<QualityStatus | 'configure', string> => ({
  notrun: translate('Non exécuté', 'Not run', undefined, locale),
  running: translate('En cours', 'Running', undefined, locale),
  passed: translate('Réussi', 'Passed', undefined, locale),
  failed: translate('Échec', 'Failed', undefined, locale),
  blocked: translate('Bloqué', 'Blocked', undefined, locale),
  notapplicable: translate('Non applicable', 'Not applicable', undefined, locale),
  configure: translate('Connexion nécessaire', 'Connection required', undefined, locale),
});
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
export const freshnessLabels = (locale: 'en' | 'fr' = 'en') =>
  ({
    current: translate('Version sélectionnée', 'Selected version', undefined, locale),
    obsolete: translate('Autre version', 'Another version', undefined, locale),
    reevaluate: translate('À réévaluer', 'Needs review', undefined, locale),
  }) as const;

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
export function durationLabel(milliseconds: number | null | undefined, locale: 'en' | 'fr' = 'en') {
  if (milliseconds == null) return '—';
  return milliseconds < 1000
    ? `${new Intl.NumberFormat(locale).format(milliseconds)} ms`
    : `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(milliseconds / 1000)} s`;
}
export function dateLabel(value?: string | null, locale: 'en' | 'fr' = 'en') {
  return value
    ? new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : translate('Non exécuté', 'Not run', undefined, locale);
}
