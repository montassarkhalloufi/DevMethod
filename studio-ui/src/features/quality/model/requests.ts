import type { QualityCheck, QualityReport, QualityRequest } from './contracts';
import { checkStatus } from './selectors';

export function prepareQualityRequest(check: QualityCheck, report: QualityReport): QualityRequest {
  const evidence = check.evidence;
  const checkId = evidence?.checkId ?? check.id;
  const kind = checkStatus(check) === 'configure' ? 'connect' : 'fix';
  const revisionId = evidence?.revisionId ?? report.revisionId;
  const title = `${kind === 'connect' ? 'Connecter' : 'Corriger'} : ${check.title}`;
  const prompt = [
    title,
    `Contrôle : ${checkId}. Version concernée : ${revisionId}.`,
    `Version actuellement sélectionnée : ${report.revisionId}. Fraîcheur : ${check.freshness}.`,
    `Objectif : ${evidence?.expected ?? check.objective}`,
    `Résultat observé : ${evidence?.observed || check.reason || 'Aucune exécution.'}`,
    `Outil : ${evidence?.tool ?? check.tool}.`,
    evidence
      ? `Preuve : ${evidence.id} · ${evidence.finishedAt ?? evidence.startedAt} · empreinte ${evidence.fingerprint ?? 'non enregistrée'}.`
      : 'Aucune preuve de réussite enregistrée.',
    ...(evidence?.findings ?? [])
      .slice(0, 10)
      .map(
        (finding) =>
          `${finding.source.path}${finding.source.line ? `:${finding.source.line}` : ''} — ${finding.message}`,
      ),
    check.nextAction ? `Prérequis : ${check.nextAction}` : '',
    ...(evidence?.limits ?? []).map((limit) => `Limite : ${limit}`),
    kind === 'connect'
      ? 'Examiner les outils et accès déjà disponibles. Proposer puis raccorder le contrôle adapté au projet, avec exécution bornée et preuve sur sa version exacte. Ne pas déduire de résultat avant son exécution ; aucune installation, dépense ou action externe implicite.'
      : 'Réexaminer la preuve et la version actuelle avant toute correction. Préserver les données et décisions, corriger le périmètre affecté, puis relancer les vérifications pertinentes sur la nouvelle version. Une preuve ancienne ne valide jamais la nouvelle version.',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 12000);
  return { kind, revisionId, checkId, title, prompt };
}
