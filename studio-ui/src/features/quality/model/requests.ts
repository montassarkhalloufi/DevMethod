import { translate } from '../../../i18n';
import type { QualityCheck, QualityReport, QualityRequest } from './contracts';
import { checkStatus } from './selectors';

export function prepareQualityRequest(
  check: QualityCheck,
  report: QualityReport,
  locale: 'en' | 'fr' = 'en',
): QualityRequest {
  const evidence = check.evidence;
  const checkId = evidence?.checkId ?? check.id;
  const kind = checkStatus(check) === 'configure' ? 'connect' : 'fix';
  const revisionId = evidence?.revisionId ?? report.revisionId;
  const tr = (fr: string, en: string, values?: Record<string, string | number>) =>
    translate(fr, en, values, locale);
  const title = tr('{action} : {title}', '{action}: {title}', {
    action: kind === 'connect' ? tr('Connecter', 'Connect') : tr('Corriger', 'Fix'),
    title: check.title,
  });
  const prompt = [
    title,
    tr(
      'Contrôle : {check}. Version concernée : {revision}.',
      'Check: {check}. Target version: {revision}.',
      { check: checkId, revision: revisionId },
    ),
    tr(
      'Version actuellement sélectionnée : {revision}. Fraîcheur : {freshness}.',
      'Currently selected version: {revision}. Freshness: {freshness}.',
      { revision: report.revisionId, freshness: check.freshness },
    ),
    tr('Objectif : {value}', 'Objective: {value}', {
      value: evidence?.expected ?? check.objective,
    }),
    tr('Résultat observé : {value}', 'Observed result: {value}', {
      value: evidence?.observed || check.reason || tr('Aucune exécution.', 'No execution.'),
    }),
    tr('Outil : {tool}.', 'Tool: {tool}.', { tool: evidence?.tool ?? check.tool }),
    evidence
      ? tr(
          'Preuve : {id} · {date} · empreinte {fingerprint}.',
          'Evidence: {id} · {date} · fingerprint {fingerprint}.',
          {
            id: evidence.id,
            date: evidence.finishedAt ?? evidence.startedAt,
            fingerprint: evidence.fingerprint ?? tr('non enregistrée', 'not recorded'),
          },
        )
      : tr('Aucune preuve de réussite enregistrée.', 'No evidence of success recorded.'),
    ...(evidence?.findings ?? [])
      .slice(0, 10)
      .map(
        (finding) =>
          `${finding.source ? `${finding.source.path}${finding.source.line ? `:${finding.source.line}` : ''}` : finding.target || tr('Constat', 'Finding')} — ${finding.message}`,
      ),
    check.nextAction
      ? tr('Prérequis : {value}', 'Prerequisite: {value}', { value: check.nextAction })
      : '',
    ...(evidence?.limits ?? []).map((limit) =>
      tr('Limite : {value}', 'Limit: {value}', { value: limit }),
    ),
    kind === 'connect'
      ? translate(
          'Examiner les outils et accès déjà disponibles. Proposer puis raccorder le contrôle adapté au projet, avec exécution bornée et preuve sur sa version exacte. Ne pas déduire de résultat avant son exécution ; aucune installation, dépense ou action externe implicite.',
          'Review the tools and access already available. Propose and connect a suitable check with bounded execution and evidence tied to the exact project version. Do not infer results before execution; no implicit installation, spending or external action.',
          undefined,
          locale,
        )
      : translate(
          'Réexaminer la preuve et la version actuelle avant toute correction. Préserver les données et décisions, corriger le périmètre affecté, puis relancer les vérifications pertinentes sur la nouvelle version. Une preuve ancienne ne valide jamais la nouvelle version.',
          'Review the evidence and current version before correcting. Preserve data and decisions, correct the affected scope, then rerun relevant checks on the new version. Old evidence never validates a new version.',
          undefined,
          locale,
        ),
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 12000);
  return { kind, revisionId, checkId, title, prompt };
}
