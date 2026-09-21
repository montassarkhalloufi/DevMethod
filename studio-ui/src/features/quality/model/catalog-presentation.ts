import { translate } from '../../../i18n';
import { engineMessage } from '../../project/model/engine-messages';
import type { QualityReport, QualityCheck } from './contracts';
const catalog: Record<string, Record<'title' | 'tool' | 'objective', [string, string]>> = {
  'source-syntax': {
    title: ['Syntaxe des sources', 'Source syntax'],
    tool: [
      'Node --check / parseur TypeScript installé',
      'Node --check / installed TypeScript parser',
    ],
    objective: [
      'Repérer les erreurs de syntaxe sans exécuter le programme.',
      'Detect syntax errors without executing the program.',
    ],
  },
  'react-strict-build': {
    title: ['Compilation React stricte', 'Strict React compilation'],
    tool: [
      'Compilateur contrôlé React / TypeScript strict',
      'Controlled strict React / TypeScript compiler',
    ],
    objective: [
      'Vérifier les types et compiler le profil React pris en charge, sans exécuter le programme ou ses scripts.',
      'Check types and compile the supported React profile without executing the program or its scripts.',
    ],
  },
  'relative-imports': {
    title: ['Résolution des imports relatifs', 'Relative import resolution'],
    tool: ['AST TypeScript + manifeste de la version', 'TypeScript AST + version manifest'],
    objective: [
      'Vérifier que les imports statiques relatifs pointent vers un fichier de cette version.',
      'Check that static relative imports point to a file in this version.',
    ],
  },
  'json-format': {
    title: ['Documents JSON', 'JSON documents'],
    tool: ['JSON.parse', 'JSON.parse'],
    objective: [
      'Vérifier le format des documents JSON sans exécuter leur contenu.',
      'Check JSON document format without executing its contents.',
    ],
  },
  'type-checking': {
    title: ['Typage et contrats statiques', 'Types and static contracts'],
    tool: ['TypeScript tsc --noEmit', 'TypeScript tsc --noEmit'],
    objective: [
      'Vérifier la cohérence des types avec la configuration et les dépendances du projet.',
      'Check type consistency with project configuration and dependencies.',
    ],
  },
  linting: {
    title: ['Lint et conventions du projet', 'Lint and project conventions'],
    tool: ['ESLint et règles du projet', 'ESLint and project rules'],
    objective: [
      'Contrôler les conventions configurées sans assimiler le lint à un test de comportement.',
      'Check configured conventions without equating lint with behavior testing.',
    ],
  },
  'unit-tests': {
    title: ['Tests unitaires et assertions', 'Unit tests and assertions'],
    tool: ['Runner de tests du projet', 'Project test runner'],
    objective: [
      'Exercer la logique et examiner la pertinence des assertions.',
      'Exercise logic and examine the relevance of assertions.',
    ],
  },
  'integration-tests': {
    title: ['Intégration et contrats', 'Integration and contracts'],
    tool: ['Runner et services du projet', 'Project runner and services'],
    objective: [
      'Vérifier les contrats entre modules et services.',
      'Check contracts between modules and services.',
    ],
  },
  'end-to-end': {
    title: ['Parcours de bout en bout', 'End-to-end journeys'],
    tool: ['Playwright ou navigateur autorisé', 'Playwright or authorized browser'],
    objective: [
      'Exécuter les parcours réels, y compris les cas limites.',
      'Execute real journeys, including edge cases.',
    ],
  },
  'mutation-testing': {
    title: ['Pertinence par mutation', 'Assertion relevance through mutation'],
    tool: ['Outil de mutation adapté au projet', 'Project-appropriate mutation tool'],
    objective: [
      'Éprouver si les assertions détectent des défauts introduits.',
      'Check whether assertions detect introduced defects.',
    ],
  },
  'bundle-size': {
    title: ['Inventaire du bundle compilé', 'Compiled bundle inventory'],
    tool: ['Manifeste et taille des artefacts', 'Artifact manifest and size'],
    objective: [
      'Mesurer les octets compilés ; aucune latence ni performance utilisateur déduite.',
      'Measure compiled bytes; no latency or user performance inferred.',
    ],
  },
  loading: {
    title: ['Chargement, réseau et cache', 'Loading, network and cache'],
    tool: ['DevTools Network / Lighthouse', 'DevTools Network / Lighthouse'],
    objective: [
      'Mesurer les ressources, le cache et le chargement.',
      'Measure resources, cache and loading.',
    ],
  },
  responsiveness: {
    title: ['Réactivité et tâches longues', 'Responsiveness and long tasks'],
    tool: ['Profiler du navigateur', 'Browser profiler'],
    objective: [
      'Mesurer les tâches JavaScript qui retardent les interactions.',
      'Measure JavaScript tasks that delay interactions.',
    ],
  },
  'react-renders': {
    title: ['Rendus React', 'React renders'],
    tool: ['React Profiler', 'React Profiler'],
    objective: ['Mesurer les rendus et leurs causes.', 'Measure renders and their causes.'],
  },
  'api-latency': {
    title: ['Latences API et tracing', 'API latency and tracing'],
    tool: ['Profiler backend / OpenTelemetry', 'Backend profiler / OpenTelemetry'],
    objective: [
      'Mesurer les temps et erreurs d’une requête.',
      'Measure request duration and errors.',
    ],
  },
  'database-queries': {
    title: ['Requêtes, index et N+1', 'Queries, indexes and N+1'],
    tool: ['EXPLAIN et profiler de base', 'EXPLAIN and database profiler'],
    objective: [
      'Examiner les plans de requêtes sur une base autorisée.',
      'Examine query plans on an authorized database.',
    ],
  },
  memory: {
    title: ['Mémoire et allocations', 'Memory and allocations'],
    tool: ['Heap profiler', 'Heap profiler'],
    objective: [
      'Observer les allocations et rechercher les fuites.',
      'Observe allocations and investigate leaks.',
    ],
  },
  load: {
    title: ['Charge, débit et endurance', 'Load, throughput and endurance'],
    tool: ['k6 ou outil autorisé', 'k6 or authorized tool'],
    objective: [
      'Mesurer débit, erreurs et stabilité sous charge.',
      'Measure throughput, errors and stability under load.',
    ],
  },
  keyboard: {
    title: ['Clavier et focus', 'Keyboard and focus'],
    tool: ['Revue navigateur manuelle', 'Manual browser review'],
    objective: [
      'Parcourir les actions et vérifier le focus visible.',
      'Navigate actions and check visible focus.',
    ],
  },
  semantics: {
    title: ['Sémantique, libellés et contrastes', 'Semantics, labels and contrast'],
    tool: ['Analyse automatisée + revue manuelle', 'Automated analysis + manual review'],
    objective: [
      'Vérifier les noms accessibles, la structure et les contrastes.',
      'Check accessible names, structure and contrast.',
    ],
  },
  responsive: {
    title: ['Responsive et compatibilité', 'Responsive layout and compatibility'],
    tool: ['Navigateurs et tailles représentatives', 'Representative browsers and sizes'],
    objective: [
      'Vérifier le rendu, le défilement et la compatibilité.',
      'Check rendering, scrolling and compatibility.',
    ],
  },
  'ui-states': {
    title: ['États vides, chargements et erreurs', 'Empty, loading and error states'],
    tool: ['Parcours navigateur', 'Browser journeys'],
    objective: [
      'Vérifier les états utiles et les moyens de récupération.',
      'Check useful states and recovery options.',
    ],
  },
  'secret-markers': {
    title: ['Marqueurs explicites de secrets', 'Explicit secret markers'],
    tool: ['Détecteur borné de formats sensibles', 'Bounded sensitive-format detector'],
    objective: [
      'Repérer des clés privées PEM et formats de jetons connus ; valeurs masquées.',
      'Detect PEM private keys and known token formats; values redacted.',
    ],
  },
  authorization: {
    title: ['Autorisations et isolation', 'Authorization and isolation'],
    tool: ['Tests API avec identités de test', 'API tests with test identities'],
    objective: [
      'Vérifier les limites d’accès côté serveur.',
      'Check server-side access boundaries.',
    ],
  },
  'server-validation': {
    title: ['Validation serveur', 'Server validation'],
    tool: ['Tests de contrats et entrées invalides', 'Contract tests and invalid inputs'],
    objective: [
      'Éprouver les entrées reçues par le serveur.',
      'Exercise inputs received by the server.',
    ],
  },
  dependencies: {
    title: ['Dépendances et analyse statique', 'Dependencies and static analysis'],
    tool: ['Analyseur SAST / audit du verrou installé', 'SAST analyzer / installed lockfile audit'],
    objective: [
      'Examiner les dépendances et les chemins risqués.',
      'Review dependencies and risky paths.',
    ],
  },
  'dynamic-security': {
    title: ['Sécurité dynamique autorisée', 'Authorized dynamic security'],
    tool: [
      'Scanner configuré pour la cible autorisée',
      'Scanner configured for the authorized target',
    ],
    objective: [
      'Examiner une cible explicitement autorisée.',
      'Examine an explicitly authorized target.',
    ],
  },
  'network-recovery': {
    title: ['Coupures, délais et reprise', 'Disconnections, timeouts and recovery'],
    tool: ['Injection de fautes réseau', 'Network fault injection'],
    objective: [
      'Vérifier les timeouts, les erreurs et la conservation des saisies.',
      'Check timeouts, errors and input preservation.',
    ],
  },
  concurrency: {
    title: ['Concurrence et idempotence', 'Concurrency and idempotence'],
    tool: ['Tests d’intégration concurrents', 'Concurrent integration tests'],
    objective: [
      'Éprouver les transactions, doublons et mises à jour concurrentes.',
      'Exercise transactions, duplicates and concurrent updates.',
    ],
  },
  backup: {
    title: ['Sauvegarde et restauration', 'Backup and restoration'],
    tool: ['Exercice de restauration', 'Restoration exercise'],
    objective: [
      'Restaurer une copie autorisée et confronter les données.',
      'Restore an authorized copy and compare data.',
    ],
  },
  observability: {
    title: ['Logs, exceptions et traces', 'Logs, exceptions and traces'],
    tool: ['Instrumentation et collecteur du projet', 'Project instrumentation and collector'],
    objective: [
      'Observer une exécution avec des données sensibles masquées.',
      'Observe execution with sensitive data redacted.',
    ],
  },
  availability: {
    title: ['Disponibilité et alertes', 'Availability and alerts'],
    tool: ['Sondes et alertes du projet', 'Project probes and alerts'],
    objective: ['Vérifier un service réellement lancé.', 'Check an actually running service.'],
  },
  rollback: {
    title: ['Déploiement et retour arrière', 'Deployment and rollback'],
    tool: ['Pipeline autorisé du projet', 'Authorized project pipeline'],
    objective: [
      'Éprouver la reprise et le retour arrière sans publier depuis ce contrôle.',
      'Exercise recovery and rollback without publishing from this check.',
    ],
  },
  costs: {
    title: ['Coût et consommation', 'Cost and usage'],
    tool: ['Mesures du fournisseur et du runtime', 'Provider and runtime measurements'],
    objective: [
      'Rapprocher la consommation réellement mesurée du périmètre.',
      'Compare actual measured usage against scope.',
    ],
  },
  'business-journey': {
    title: ['Critères métier du projet', 'Project business criteria'],
    tool: ['Scénarios issus du cadrage', 'Scenarios from framing'],
    objective: [
      'Vérifier les critères du projet ; aucun scénario sectoriel n’est inventé.',
      'Check project criteria; no industry-specific scenario is invented.',
    ],
  },
  'business-browser': {
    title: ['Scénarios navigateur du candidat', 'Candidate browser scenarios'],
    tool: ['Playwright · navigateur local isolé', 'Playwright · isolated local browser'],
    objective: [
      'Exécuter les assertions déclarées sur une copie du candidat et des données de recette vides.',
      'Execute declared assertions on a copy of the candidate with empty test data.',
    ],
  },
};
const categories: Record<string, [string, string]> = {
  functional: ['Fonctionnel', 'Functional'],
  performance: ['Performance', 'Performance'],
  accessibility: ['Accessibilité', 'Accessibility'],
  security: ['Sécurité', 'Security'],
  reliability: ['Fiabilité', 'Reliability'],
  operations: ['Exploitation', 'Operations'],
  business: ['Métier', 'Business'],
};
function presentCheck(check: QualityCheck, locale: 'en' | 'fr'): QualityCheck {
  const labels = catalog[check.id];
  // Evidence remains an exact historical receipt, including its original language.
  if (!labels) return check;
  const display = { ...check };
  for (const field of ['title', 'tool', 'objective'] as const) {
    const pair = labels[field];
    if (check[field] === pair[0]) display[field] = translate(pair[0], pair[1], undefined, locale);
  }
  if (check.reason) display.reason = engineMessage(check.reason, locale);
  const capability =
    /^Capacité ([a-zA-Z]+) non détectée dans cette version ; confirmer le périmètre si nécessaire\.$/.exec(
      check.reason ?? '',
    );
  if (capability)
    display.reason = translate(
      'Capacité {scope} non détectée dans cette version ; confirmer le périmètre si nécessaire.',
      'Capability {scope} was not detected in this version; confirm the scope if needed.',
      { scope: capability[1]! },
      locale,
    );

  if (
    check.reason ===
    'Cette technique nécessite un outil ou une session dédiée non pilotée par ce Studio.'
  )
    display.reason = translate(
      check.reason,
      'This technique requires a dedicated tool or session not controlled by this Studio.',
      undefined,
      locale,
    );
  const next =
    'Exécuter ' +
    check.tool +
    ' dans un environnement autorisé, puis conserver une preuve liée à cette version.';
  if (check.nextAction === next)
    display.nextAction = translate(
      'Exécuter {tool} dans un environnement autorisé, puis conserver une preuve liée à cette version.',
      'Run {tool} in an authorized environment, then retain evidence linked to this version.',
      { tool: display.tool },
      locale,
    );
  else if (check.nextAction) display.nextAction = engineMessage(check.nextAction, locale);
  return display;
}
export function presentQualityReport(
  report: QualityReport | null,
  locale: 'en' | 'fr',
): QualityReport | null {
  if (!report) return null;
  return {
    ...report,
    categories: report.categories.map((category) => ({
      ...category,
      label: categories[category.id]
        ? translate(categories[category.id]![0], categories[category.id]![1], undefined, locale)
        : category.label,
    })),
    checks: report.checks.map((check) => presentCheck(check, locale)),
    limits: report.limits.map((value) => engineMessage(value, locale)),
  };
}
