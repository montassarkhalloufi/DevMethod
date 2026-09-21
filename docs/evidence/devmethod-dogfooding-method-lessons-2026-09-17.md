# Construire DevMethod avec DevMethod : enseignements vérifiables

Date : 17 septembre 2026. Synthèse du dépôt et des preuves conservées, sans nouvelle
campagne comparative ni nouveau test produit. Le résultat démontré est une méthode
plus explicite sur la délégation, les preuves et les accès, accompagnée d'un Studio
local qui permet réellement de créer, corriger, reprendre et exporter un projet.
Un gain général de productivité, une meilleure compréhension humaine ou une
supériorité sur les concurrents ne sont pas établis.

Deux boucles sont distinguées : **construire DevMethod en appliquant ses propres
règles**, puis **utiliser Studio pour produire le site DevMethod**. La première a
modifié des instructions réutilisables et leur outillage. La seconde a éprouvé une
livraison réelle et révélé de nouveaux défauts du produit qui la portait.

## Périmètre historique : ce qui existait avant le 17 septembre

La proportionnalité, les décisions explicites, la reprise et la séparation entre
preuve technique et résultat utilisateur ne sont pas des inventions de cette séance.
L'[ADR 011](../ADR-011-evidence-coverage-and-loop-inspection.md), daté du 15 septembre,
séparait déjà intégrité, couverture déclarée et achèvement sémantique. Ses inspecteurs
restent facultatifs ; un hash n'établit pas qu'un test porte sur le bon comportement.

Le 16 septembre, le commit `617b22c` a corrigé l'objet de l'évaluation : mesurer le
parcours **personne + agent + méthode**, y compris la construction du contexte, plutôt
que comparer uniquement des agents auxquels l'opérateur aurait déjà fourni un dossier
expert. Cette correction touche les consignes distribuées de décision produit,
d'exploration et de provenance des hypothèses. Son effet sur le travail de personnes
reste à mesurer. [Décision, sources et limites](../missions/product-alternatives/EMPOWERMENT.md).

L'[audit des acquis du 16 septembre](../missions/creation-experience/evidence/acquis.md)
constatait que la méthode écrite couvrait déjà la chaîne demandée. Le manque concernait
l'accès continu aux vrais objets : code courant, données, choix, tâche d'agent, aperçu
et preuves. Studio a été choisi pour rendre ces objets inspectables, sans obliger toute
application à entrer dans le schéma expérimental de l'Atelier.

Les commits `37c9633`, `f9f8f2c` et `7d2b043` ont ensuite apporté le Studio local,
l'édition React typée et le parcours de décisions/design. Les références React/Vercel
versionnées améliorent les ressources disponibles ; leur installation ne prouve pas
leur bonne application. Les contrats distinguent sélectionner, approuver et appliquer,
avec des contrôles attachés à la révision concernée.
[ADR 017](../ADR-017-typed-react-studio.md),
[ADR 018](../ADR-018-required-versioned-react-guidance.md),
[ADR 019](../ADR-019-studio-decision-journey.md).

## Évolutions attestées le 17 septembre

Les commits ci-dessous sont des repères du Git local inspecté. Leur présence ici ne
signifie ni fusion dans `main`, ni publication npm. Les relevés cités conservent leurs
limites à la date de chaque tranche ; un ancien « non disponible » n'est pas un état
courant après une livraison ultérieure.

| Repère | Évolution réelle | Preuve et portée |
| --- | --- | --- |
| `b8724c1` | Consignes réutilisables : résultat avant mécanique, poursuite du travail déjà délégué, première composition UI vérifiée avant réplication, états de contrôle précis et correction suivie d'une nouvelle preuve. | [Trois exercices hôtes isolés et contrôles du kit](../missions/creation-experience/evidence/method-feedback/RESULTS.md). Pas de comparaison aveugle ni de mesure générale d'effort. |
| `8ae6108` | Plan et actions durables dans le travail en cours, sans assimiler progression et qualité. | [Publication, reprise, interruption et navigateur réels](../missions/creation-experience/evidence/progress/RESULTS.md) ; événements de recette identifiés, pas d'essai fournisseur natif. |
| `708afdb` | Adoption de l'existant, contexte sourcé, choix local/API/MCP et retour de contrôles externes liés aux sources et critères. Les skills sont aussi modifiés. | [Import préservé et vrai `node --check` transmis par le pont hôte](../missions/creation-experience/evidence/adoption-connectors/RESULTS.md). Les 54 définitions du catalogue ne sont pas 54 intégrations exécutées. |
| `0a885b8`, `28418f0` | Accueil persistant, création/import/reprise, brief enrichi, vrais aperçus, connexions MCP et sélection dans le contexte. | [Accueil](../missions/creation-experience/evidence/home/RESULTS.md), [composeur et MCP](../missions/creation-experience/evidence/home-composer/RESULTS.md). Protocole OAuth local éprouvé ; consentement Notion atteint mais non accordé pendant cette recette. |
| `44492cd`, `1e6c510`, `53b15df` | Observation des parcours concurrents, guides versionnés, choix persistants, questionnaires de mission et permissions imposées dans le pont d'outils. | [Préparation guidée](../ADR-025-guided-connector-preparation.md) puis [preuves de permissions et reprise](../missions/creation-experience/evidence/connector-permissions/RESULTS.md). Aucun PAT GitHub réel testé. |
| Corrections après `53b15df` | Message trompeur à la réouverture d'un guide et types MIME vidéo/sous-titres corrigés pendant la réalisation du site. | [Rapport du site](studio-site-dogfooding-2026-09-17.md). Régressions rouges puis vertes ; la suite antérieure de 1068 tests ne couvrait pas ces deux nouveaux cas. |

### 1. Réduire la charge de procédure sans retirer les contrôles utiles

Le changement canonique de `b8724c1` demande de présenter le résultat, l'incertitude
matérielle et l'action suivante dans les termes de la personne. Une continuation déjà
autorisée demeure à la charge de l'agent ; la commande suivante ne doit pas devenir
une nouvelle formalité d'approbation. Une correction bornée n'impose ni matrice
complète, ni document supplémentaire, ni reprise de tous les stages.
[Dimensionnement](../../.agents/skills/project-foundation/references/work-sizing.md),
[commandes](../../.agents/skills/project-foundation/references/operating-commands.md).

L'exercice de petite correction apporte un résultat concret : seul le titre demandé
change, les modifications préexistantes sont conservées, aucune nouvelle délégation
n'est demandée et aucun test applicatif inutile n'est lancé. Il s'agit d'un exemple
réussi, pas d'une statistique de concision. La revue UI du même protocole reste longue
et n'a pas de navigateur : savoir proposer une bonne vérification n'est pas l'avoir
effectuée.

### 2. Transformer le contexte en objets conservés, sans inventer leur histoire

Les bugs de reprise ont montré que « les réponses sont sauvegardées » était trop vague.
Il faut conserver le brief, les choix partiels, l'étape, la version et leur relation avec
la demande initiale. La régression d'un GET ancien arrivant après un POST récent a
concrètement rétabli de vieilles réponses ; elle a été reproduite puis corrigée.
La demande initiale reste un snapshot immuable, distinct des réponses humaines
ultérieures. [Preuves de reprise et de concurrence](../missions/creation-experience/evidence/connector-permissions/RESULTS.md).

Le commit `708afdb` applique la même discipline à un dépôt importé : code observé,
raison rapportée, hypothèse et inconnue ne sont pas interchangeables. L'installation
du kit n'adopte pas automatiquement le produit ; l'import ne doit ni exécuter ses
scripts ni fabriquer un PRD historique. Cette règle est réutilisable hors Studio.
[Adoption de l'existant](../../.agents/skills/project-foundation/references/existing-project.md).

### 3. Vérifier la première interaction réelle, puis la correction exacte

La méthode précise maintenant les sondes utiles aux défauts rencontrés : vraie molette
dans les zones imbriquées, menu avec l'éditeur monté, faible hauteur, redimensionnement
et retour du focus. Les captures prouvent l'apparence ; les tests DOM portent sur leurs
assertions ; ni les uns ni les autres ne prouvent seuls ces gestes.
[Contrat UI corrigé](../../.agents/skills/design-to-code/references/ux-contract.md).

Le site offre un contre-exemple utile à une lecture trop rassurante des tests verts.
Sa première révision avait des contrôles ciblés réussis, mais le navigateur a révélé
deux liens publics en 404, huit pixels de débordement mobile et l'absence de retour
pendant une copie en attente. Une seconde révision a corrigé ces points et reçu sa
propre observation positive. L'échec précédent est conservé. La chaîne « constat →
correction → nouvelle vérification » a donc été utilisée sur un livrable réel, sans
garantir qu'aucun autre défaut n'existe.
[Révisions, observations et interactions](studio-site-dogfooding-2026-09-17.md).

Ces bugs justifient surtout de mieux activer les règles existantes, pas d'ajouter un
rituel à chaque changement. La consigne distribuée distingue désormais défaut local,
règle réutilisable manquante et règle présente mais non appliquée.
[Correction bornée](../../.agents/skills/scoped-delivery/references/bounded-correction.md).

### 4. Ne pas confondre choix, connexion, autorisation et résultat

Le catalogue seul répondait mal à la demande « connecter ». Le produit a évolué vers
une vraie négociation MCP et une découverte d'outils, puis vers des permissions
Autoriser/Demander/Interdire imposées côté serveur. Les tests avec un serveur MCP local
comptent les invocations : zéro avant accord humain, une après accord, aucune seconde
exécution au rechargement. Un worker muni d'un jeton valide ne peut pas se donner les
droits de la personne.
[Contrat](../ADR-026-connector-permissions-and-interactions.md),
[preuves](../missions/creation-experience/evidence/connector-permissions/RESULTS.md).

La portée reste essentielle : les politiques protègent le pont DevMethod, pas tous les
outils qu'un agent hôte pourrait utiliser hors de ce pont. Un MCP accessible au
constructeur n'installe pas le service dans l'application et ne fournit pas l'OAuth de
ses utilisateurs finaux. Le runner natif isolé ne reçoit pas automatiquement ces MCP.
Le guide de choix réutilisable conserve ces distinctions et demande de vérifier
l'opération utile, au-delà du seul succès de découverte.
[Choisir les outils et services](../../.agents/skills/decision-architecture/references/tool-and-service-selection.md).

### 5. Tester l'artefact livré dans son contexte de destination

Les 404 du site provenaient de documents présents dans le checkout mais absents du
`main` public. Vérifier l'existence locale était insuffisant pour promettre un lien
public utilisable. Les pages anglaises ont été intégrées à la livraison avec des
commandes de checkout, sans prétendre que ces nouveautés étaient déjà publiées sur npm.

Le téléchargement de la deuxième révision, sa restauration en 22 fichiers puis son
ouverture indépendante ont éprouvé un autre contrat que l'aperçu de développement.
L'ajout du film a encore révélé des types MIME manquants ; la régression couvre les
octets et en-têtes du serveur vivant et du runtime exporté/restauré. Elle ne prouve pas
le décodage vidéo. L'état de la lecture navigateur et de l'export final est consigné
dans le [rapport de livraison du site](studio-site-dogfooding-2026-09-17.md), qui en
reste la source, plutôt qu'être recopié ici pendant sa finalisation.

## Ce que la comparaison concurrente apporte réellement

Ce tableau exploite les observations datées des 16–17 septembre ; il ne constitue pas
une nouvelle vérification des produits en ligne ou de leurs offres commerciales.

| Référence | Observation ou recherche conservée | Enseignement et limite |
| --- | --- | --- |
| Lovable | Dans le scénario Slack Plan, trois questions, retour sans perte de choix, résumé puis plan non approuvé. Les formulaires distinguent App + chat et App user. | Reprendre la progression besoin/usage/identité/configuration, avec réponses conservées. Le plan n'établit ni connexion Slack ni envoi. [Scénarios](../missions/creation-experience/evidence/lovable-connectors/SCENARIOS.md). |
| Lovable, Notion | L'assistant choisit correctement MCP pour le contexte de construction, mais promet des restrictions de lecture non établies par le grant fournisseur. Le relevé les confronte aux sources officielles. | Un dialogue convaincant peut être faux sur les droits. Séparer intention de lecture, accès fournisseur et restriction locale ; ne pas copier une promesse générée. [S8](../missions/creation-experience/evidence/lovable-connectors/SCENARIOS.md#s8--notion-comme-contexte-de-lassistant). |
| Bolt | Formulaire MCP HTTP/SSE et modes d'authentification ; Notion passe de Connect à Connected, puis affiche 44 outils et leurs réglages. | Rendre connexion, découverte et sélection inspectables. Aucun outil métier appelé ; origine précise du consentement non établie, refresh/révocation non exercés. Le paragraphe « pas encore OAuth » du relevé décrit le checkpoint historique, antérieur à notre livraison MCP. [Observation](../missions/creation-experience/evidence/lovable-connectors/BOLT-CONNECTIONS.md). |
| Spec Kit et BMAD | Recherche épinglée sur leurs parcours d'adoption, de changement, de clarification, de design et de reprise ; installations locales documentées. | Ces capacités ne sont pas exclusives à DevMethod. Les campagnes interrompues ne permettent aucun classement d'efficacité. [Sources et versions](../missions/product-alternatives/evidence/empowerment/methods-current.md), [résultats](../missions/product-alternatives/RESULTS.md). |

Studio a rapproché son point d'entrée et ses connexions de parcours observés chez les
builders. Sa combinaison locale — fichiers inspectables, choix conservés, preuves
liées aux révisions, import et export — est maintenant utilisable. Son avantage net
sur un builder ou sur un agent ordinaire bien accompagné reste une hypothèse : aucune
mesure comparable de préparation, compréhension, effort, coût et résultat accepté
n'est disponible. Les services cloud, API applicatives gérées et comptes utilisateurs
des concurrents ne sont pas reproduits par la seule présence de cartes dans un catalogue.

## Contre-exemples et limites à conserver

- Sur les cas de reprise effectivement comparés, les contrôles ordinaires ont détecté
  les mêmes défauts que le laboratoire avec moins d'invocations. Le laboratoire reste
  optionnel ; il n'est pas un préalable général à la qualité.
  [Audit des acquis](../missions/creation-experience/evidence/acquis.md).
- Le schéma figé de l'Atelier ne représentait pas un vrai programme temporel ; un agent
  ordinaire a construit un éditeur adapté. Une autre modification explicite a aussi
  réussi sans runtime spécial de décision. Cela réfute ces nécessités particulières,
  pas toute contribution du guidage.
  [Résultats conservés](../missions/product-alternatives/RESULTS.md).
- La campagne maintenance n'a admis aucun des six essais A/B après son échec préalable.
  Calibration des contrôles, diagnostic de sandbox et restauration de fixtures ne
  constituent pas six tâches utilisateur réussies.
  [Arrêt et comptabilité](../missions/maintenance-value/RESULTS.md).
- Les recettes navigateur ont été exécutées par des agents ; les retours du propriétaire
  sur le produit sont réels mais ne forment pas une étude humaine comparative. Les
  comptes fournisseurs réels, un PAT GitHub, le déploiement public et toutes les opérations
  des 54 options ne sont pas validés par les fixtures locales.
- Le nombre croissant de tests signale une couverture ajoutée, pas une qualité universelle.
  Les nouveaux bugs du site et de Studio, après une suite verte, en sont une illustration.
  Les preuves réutilisées doivent garder leur révision, leur procédure et leurs limites.

## Plan d'amélioration proposé — six actions vérifiables

Les actions suivantes ne sont pas annoncées comme livrées. Elles réutilisent les
propriétaires actuels des règles et du produit ; elles ne demandent pas six nouveaux
documents ni une campagne payante immédiate.

1. **P1 — Activer la recette de la première tranche représentative.** Avant de répéter
   une composition ou d'intégrer un nouveau média, choisir le geste risqué et le tester
   dans le vrai runtime. Propriétaires : design-to-code et livraison Studio.
   **Critère :** sur le prochain changement UI significatif, conserver une observation
   desktop/mobile de la première tranche, comprenant le risque visé et la conservation
   des saisies ; toute correction de ce comportement obtient une observation distincte.
   Pas de matrice universelle ajoutée aux changements de texte.

2. **P1 — Fermer la chaîne aperçu → artefact transporté → ouverture indépendante.**
   Réemployer l'export/restauration existant et traiter les URLs publiques, chemins
   d'actifs et types MIME comme des contrats de livraison. Propriétaire : Studio.
   **Critère :** un prochain livrable avec documentation et média s'ouvre dans un dossier
   restauré ; ses liens ciblés, sa lecture média et ses sous-titres sont exercés, avec
   résultats liés à cette révision. Un simple HTTP 200 ou un fichier présent ne suffit pas.

3. **P1 — Éprouver une seule opération fournisseur utile, sous autorisation explicite.**
   Partir des contrats MCP déjà livrés, sans élargir le catalogue pour remplacer une
   vérification manquante. Propriétaire : intégration connecteurs.
   **Critère :** avec un compte et une ressource de test autorisés, observer connexion,
   découverte, une lecture désignée, refus d'une action interdite et état après
   déconnexion ; aucun secret dans prompt/export/journal. Sans accès, garder ce critère
   non exécuté. Pour une API applicative, définir séparément appelant, identité et
   preuve d'intégration ; une lecture MCP ne la valide pas.

4. **P2 — Réduire le contexte transmis en préservant ce qui sert à la reprise.** La
   conservation complète a corrigé des omissions mais peut aussi augmenter répétition
   et volume. Propriétaires : contexte de mission et construction des demandes.
   **Critère :** sur un projet existant après interruption et changement sans rapport,
   une nouvelle tâche retrouve décision active, raison utile, données antérieures et
   preuves encore applicables ; le contrôle affecté est revalidé. Comparer le contexte
   envoyé à la version complète et montrer ce qui a été retiré, sans présenter la seule
   baisse d'octets comme gain humain.

5. **P2 — Mesurer l'effort de bout en bout sur un besoin réel.** Reprendre le protocole
   déjà défini dans [EMPOWERMENT](../missions/product-alternatives/EMPOWERMENT.md), avec
   un agent ordinaire compétent comme référence et, si le périmètre le permet, un
   builder ou une méthode concurrente épinglée. Propriétaire : évaluation de la méthode.
   **Critère :** fixer besoin, accès, qualité attendue et arrêt avant l'essai ; compter
   préparation, décisions humaines, supervision, corrections, reprise et résultat
   accepté. Déclarer attente, consommation inconnue et effet d'apprentissage séparément.
   Une étude à un propriétaire reste un cas, sans classement général ni relance d'une
   campagne arrêtée pour obtenir un résultat favorable.

6. **P2 — Garder une entrée de preuve actuelle et peu coûteuse à relire.** Les rapports
   datés sont nécessaires mais leurs limites historiques peuvent devenir ambiguës,
   comme le relevé Bolt antérieur au MCP natif. Propriétaires : mission et handoff.
   **Critère :** depuis le point d'entrée courant, retrouver en une navigation le dernier
   état, le contrat et les preuves de chaque tranche ; annoter les limites remplacées
   par un lien daté, sans réécrire l'observation ancienne. Pour chaque nouveau défaut,
   décider explicitement « code local / règle manquante / règle non appliquée » et ne
   changer un skill que si la leçon se transfère au-delà de ce bug.

## Méthode de rédaction

Lecture des missions, ADR, preuves, consignes canoniques et historique Git jusqu'à
`53b15df`, plus des corrections locales consignées dans le rapport du site. Les faits
de navigateur cités proviennent de leurs recettes identifiées ; cette synthèse n'a
relancé ni navigateur, ni suite applicative, ni fournisseur. Les actions et priorités
sont des propositions déduites des écarts observés. Le contrôle documentaire vérifie
les liens locaux ; il ne valide pas ces propositions ni les services externes.
