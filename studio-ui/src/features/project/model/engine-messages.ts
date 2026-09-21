import { translate } from '../../../i18n';
const messages: Record<string, string> = {
  'Version du projet absente.': 'Project version missing.',
  'Intégrité de la version du projet invalide : son manifeste a changé.':
    'Project version integrity invalid: its manifest changed.',
  'Brouillon éditeur indisponible.': 'Editor draft unavailable.',
  'Le brouillon enregistré appartient à une autre version.':
    'The saved draft belongs to another version.',
  'Intégrité du brouillon invalide.': 'Draft integrity invalid.',
  'Aucune version du projet à analyser.': 'No project version to analyze.',
  'Import calculé : cible non résolue statiquement.':
    'Computed import: target not statically resolved.',
  'URL calculée : appel HTTP détecté, destination inconnue.':
    'Computed URL: HTTP call detected, destination unknown.',
  'Hooks et préfixes de plugin non résolus.': 'Plugin hooks and prefixes unresolved.',
  'Route calculée : chemin non résolu statiquement.':
    'Computed route: path not statically resolved.',
  'routeur importé': 'imported router',
  'Préfixes de montage et middlewares non résolus.': 'Mount prefixes and middleware unresolved.',
  'Groupes de routes, rewrites et segments dynamiques non normalisés.':
    'Route groups, rewrites and dynamic segments not normalized.',
  'Exception levée dans le code': 'Exception thrown in code',
  'Branche de récupération catch': 'Catch recovery branch',
  déstructuration: 'destructuring',
  'Décorateur Nest calculé : route non résolue.': 'Computed Nest decorator: route unresolved.',
  'décorateurs NestJS': 'NestJS decorators',
  'Préfixe global, guards, interceptors et pipes non résolus.':
    'Global prefix, guards, interceptors and pipes unresolved.',
  'Limite de 120 faits atteinte pour ce fichier ; graphe partiel.':
    'Limit of 120 facts reached for this file; partial graph.',
  'Impact direct par imports, routes et déclarations ; absence de lien ne garantit pas absence d’impact.':
    'Direct impact through imports, routes and declarations; no link does not guarantee no impact.',
  'Tests associés par import explicite uniquement ; aucune exécution ni couverture déduite.':
    'Tests linked through explicit imports only; no execution or coverage inferred.',
  'Un renommage apparaît comme suppression + ajout. Les modifications non enregistrées dans l’éditeur sont exclues.':
    'A rename appears as removal + addition. Unsaved editor changes are excluded.',
  'Les contrôles de la base ne sont pas transférés à la nouvelle version ; leur périmètre exact doit être réévalué.':
    'Base checks do not transfer to the new version; their exact scope must be reassessed.',
  'Aucune base fournie : comparaison non calculée.': 'No base provided: comparison not computed.',
  'Interface et serveur colocalisés': 'Colocated interface and server',
  'AST : JSX et route/ressource serveur dans le même fichier':
    'AST: JSX and server route/resource in the same file',
  'AST : route ou client de ressource serveur': 'AST: route or server resource client',
  'AST : JSX ou stockage navigateur': 'AST: JSX or browser storage',
  'Module à qualifier': 'Module to classify',
  'Fichier de plus de 256 Kio : inventorié mais non analysé.':
    'File larger than 256 KiB: inventoried but not analyzed.',
  'Langage inventorié ; aucun extracteur sémantique disponible pour ce fichier.':
    'Language inventoried; no semantic extractor available for this file.',
  'Catégorie logique, indépendante des processus déployés.':
    'Logical category, independent of deployed processes.',
  'Configuration JSON invalide : non interprétée.': 'Invalid JSON configuration: not interpreted.',
  'Aucun script déclaré': 'No declared script',
  'Service déclaré ; aucun processus observé.': 'Declared service; no process observed.',
  'Contrat déclaré : implémentation serveur et routage non établis.':
    'Declared contract: server implementation and routing not established.',
  'schéma OpenAPI': 'OpenAPI schema',
  'modèle Prisma déclaré': 'declared Prisma model',
  'table SQL déclarée': 'declared SQL table',
  'Déclare la route': 'Declares route',
  'Champs non détaillés': 'Fields not detailed',
  'Déclaration uniquement ; aucune validation exécutée.':
    'Declaration only; no validation executed.',
  'Déclare le contrat': 'Declares contract',
  'AST : construction du client ': 'AST: client construction ',
  'Client présent dans le code ; connexion, serveur et disponibilité non observés.':
    'Client present in code; connection, server and availability not observed.',
  ' · alias non résolu': ' · unresolved alias',
  ' · bibliothèque': ' · library',
  'Un import ne démontre ni service, ni processus, ni installation effective.':
    'An import does not demonstrate a service, process or actual installation.',
  'Alias déclaré ; aucune cible locale résolue dans ce snapshot.':
    'Declared alias; no local target resolved in this snapshot.',
  'Bibliothèque Node/npm ou module non résolu. Ce n’est pas un service externe.':
    'Node/npm library or unresolved module. This is not an external service.',
  'alias non résolu': 'unresolved alias',
  'bibliothèque/module importé': 'imported library/module',
  'Plusieurs configurations donnent des cibles différentes : ':
    'Multiple configurations produce different targets: ',
  'Import local non résolu : ': 'Unresolved local import: ',
  'AST + alias déclaré tsconfig/jsconfig': 'AST + declared tsconfig/jsconfig alias',
  'AST : import statique': 'AST: static import',
  'Résolution relative ou paths/baseUrl du snapshot ; conditions du bundler et configuration de déploiement non exécutées.':
    'Relative or paths/baseUrl resolution within the snapshot; bundler conditions and deployment configuration not executed.',
  'Importé par ce test': 'Imported by this test',
  'AST : import dans un fichier de test': 'AST: import in a test file',
  'Aucune assertion exécutée ; couverture non établie.':
    'No assertion executed; coverage not established.',
  'AST : destination HTTP littérale': 'AST: literal HTTP destination',
  'Plusieurs routes candidates ; résolution non établie.':
    'Multiple candidate routes; resolution not established.',
  'Destination HTTP ; implémentation non résolue dans ce snapshot.':
    'HTTP destination; implementation unresolved in this snapshot.',
  'destination réseau absolue': 'absolute network destination',
  'destination HTTP locale non résolue': 'unresolved local HTTP destination',
  'AST fetch/axios + correspondance méthode/chemin': 'AST fetch/axios + method/path matching',
  'Routage réel, préfixes, rewrites, réseau et réponse non observés. Paramètres de requête, fragments et informations de connexion retirés des URL.':
    'Actual routing, prefixes, rewrites, network and response not observed. Query parameters, fragments and connection details removed from URLs.',
  'AST : stockage navigateur': 'AST: browser storage',
  'API du navigateur appelée dans le code ; contenu et durée non observés.':
    'Browser API called in code; content and duration not observed.',
  'AST : appel API navigateur': 'AST: browser API call',
  'AST : appel sur le client construit': 'AST: call on the constructed client',
  'Opération potentielle ; exécution et transaction non observées.':
    'Potential operation; execution and transaction not observed.',
  'Vue de dépendances du fichier, sans ordre d’exécution ni preuve que chaque branche participe à ce parcours.':
    'File dependency view, without execution order or evidence that each branch participates in this journey.',
  'Imports transitifs, middleware, branches dynamiques, état et effets réseau non suivis. Aucune trace observée.':
    'Transitive imports, middleware, dynamic branches, state and network effects not tracked. No observed trace.',
  'Sources locales du projet — analyse statique, aucun outil du projet exécuté':
    'Local project sources — static analysis, no project tool executed',
  'Brouillon éditeur persisté sur ': 'Editor draft saved on ',
  'Snapshot immuable du projet': 'Immutable project snapshot',
  'Projet uniquement ; runtime DevMethod exclu. Aucun processus, test, compilation ou requête réseau exécuté.':
    'Project only; DevMethod runtime excluded. No process, test, compilation or network request executed.',
  'Analyse syntaxique TypeScript/JavaScript, imports relatifs, routes Express/Fastify/Next/Nest, fetch/axios, types, Zod, clients connus, stockage navigateur, déclarations Prisma/SQL et configurations JSON.':
    'TypeScript/JavaScript syntax analysis, relative imports, Express/Fastify/Next/Nest routes, fetch/axios, types, Zod, known clients, browser storage, Prisma/SQL declarations and JSON configurations.',
  'Les catégories de chemin sont inférées. Absence de détection ne prouve pas absence de serveur. Python et les autres langages sont inventoriés sans analyse sémantique.':
    'Path categories are inferred. Absence of detection does not prove absence of a server. Python and other languages are inventoried without semantic analysis.',
  'Alias paths/baseUrl résolus dans le snapshot (JSONC, héritage local simple) ; include/exclude, références de projets et configuration du bundler non interprétés. Aucune résolution sémantique globale des wrappers, de la réflexion ou du routage dynamique.':
    'Paths/baseUrl aliases resolved in the snapshot (JSONC, simple local inheritance); include/exclude, project references and bundler configuration not interpreted. No global semantic resolution of wrappers, reflection or dynamic routing.',
  'Graphes et parcours décrivent des dépendances possibles, jamais une trace d’exécution. Pas de garantie d’exhaustivité.':
    'Graphs and journeys describe possible dependencies, never an execution trace. Completeness is not guaranteed.',
  'Affichage borné à 80 parcours.': 'Display limited to 80 journeys.',
  'Héritage de configuration cyclique : aliases non hérités.':
    'Cyclic configuration inheritance: aliases not inherited.',
  'Configuration parente absente du snapshot : ': 'Parent configuration absent from snapshot: ',
  'Héritage de package ou multiple non résolu ; aucun fichier installé consulté.':
    'Package or multiple inheritance unresolved; no installed file inspected.',
  'Version inconnue : sélectionner une version disponible.':
    'Unknown version: select an available version.',
  'Signal de l’aperçu navigateur — non attesté': 'Browser preview signal — unattested',
  'Signal à reproduire ; aucune commande exécutée ni validation métier déduite.':
    'Signal to reproduce; no command executed or business validation inferred.',
  'Aperçu intégré du Studio ; événement rapporté par la page':
    'Studio embedded preview; event reported by the page',
  'La page peut imiter ce signal. Une reproduction indépendante est requise ; aucune réussite ne peut être déduite de son absence.':
    'The page can imitate this signal. Independent reproduction is required; its absence cannot imply success.',
  'Observation enregistrée par un agent': 'Observation recorded by an agent',
  'Consulter une preuve enregistrée dans le projet.': 'Consult evidence recorded in the project.',
  'Commande historique consultable ; aucun lancement arbitraire depuis ce panneau.':
    'Historical command available for inspection; no arbitrary execution from this panel.',
  'Non renseigné dans la preuve historique': 'Not specified in historical evidence',
  'Résultat enregistré par le parcours de livraison. Le journal brut reste accessible dans les preuves historiques ; il n’est pas recopié ici pour éviter d’exposer des valeurs sensibles.':
    'Result recorded by the delivery flow. The raw log remains available in historical evidence; it is not copied here to avoid exposing sensitive values.',
  'Périmètre limité à ce contrôle ; ni validation globale, ni validation humaine déduite. Provenance héritée, empreinte détaillée non enregistrée.':
    'Scope limited to this check; no overall or human validation inferred. Inherited provenance, detailed fingerprint not recorded.',
  'Aucun critère métier enregistré dans le cadrage de ce projet.':
    "No business criterion recorded in this project's framing.",
  'Exercer ces critères sur une copie autorisée, conserver les étapes, les résultats attendus et observés et la version exacte.':
    'Exercise these criteria on an authorized copy, retaining steps, expected and observed results and the exact version.',
  'Enregistrer d’abord les critères observables dans Conception, puis choisir les scénarios utiles au projet.':
    'First record observable criteria in Design, then choose scenarios useful to the project.',
  'Configuration du navigateur illisible ; aucune exécution autorisée.':
    'Browser configuration unreadable; no execution authorized.',
  'Un scénario désigne un critère absent du cadrage actuel ; corriger son lien avant exécution.':
    'A scenario references a criterion absent from the current framing; correct its link before execution.',
  'Un contrôle réussi ne valide que son périmètre. Les procédures externes ne sont pas exécutées par ce Studio.':
    'A successful check validates only its scope. External procedures are not executed by this Studio.',
  'L’analyse statique ne démontre ni le comportement réel, ni la qualité visuelle.':
    'Static analysis demonstrates neither actual behavior nor visual quality.',
  'Contrôle interrompu ; aucun résultat tardif positif enregistré.':
    'Check interrupted; no late positive result recorded.',
  'Sources, critères ou configuration modifiés pendant le contrôle ; résultat à réévaluer, aucune réussite enregistrée.':
    'Sources, criteria or configuration changed during the check; result requires reassessment, no success recorded.',
  'Les 100 premiers diagnostics sont affichés ; le total reste dans le résumé.':
    'The first 100 diagnostics are shown; the total remains in the summary.',
  'Contrôle inconnu.': 'Unknown check.',
  'Un contrôle est déjà en cours dans ce projet.': 'A check is already running in this project.',
  'Journal qualité plein ; archiver explicitement avant de continuer.':
    'Quality log full; explicitly archive before continuing.',
  'Contrôle en cours sur les fichiers de cette version.': "Check running on this version's files.",
  'Empreintes des fichiers confrontées au manifeste de la version.':
    'File fingerprints compared against the version manifest.',
  'Outil indisponible ou contrôle interrompu ; aucun résultat positif enregistré.':
    'Tool unavailable or check interrupted; no positive result recorded.',
};
export function engineMessage(value: string, locale: 'en' | 'fr'): string {
  if (locale === 'fr') return value;
  if (messages[value]) return translate(value, messages[value], undefined, locale);
  for (const [fr, en] of Object.entries(messages)) {
    if (fr.endsWith(' ') && value.startsWith(fr)) return en + value.slice(fr.length);
    if (fr.startsWith(' · ') && value.endsWith(fr)) return value.slice(0, -fr.length) + en;
  }
  return value;
}
