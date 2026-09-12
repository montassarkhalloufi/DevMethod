# Commandes de la méthode

Ces commandes décrivent un parcours de travail réutilisable. Elles ne sont pas des commandes shell et n'autorisent aucune action externe.

## Invocation native

Les noms courts du tableau sont des étapes internes, pas des commandes natives autonomes. Invoquer `$project-foundation verify TASK-1` dans Codex, ou `/project-foundation verify TASK-1` dans Claude Code et Cursor. Appliquer la même syntaxe aux quatorze étapes, avec leur argument éventuel. Ne pas enregistrer `/verify`, `/review` ou les autres noms courts comme commandes globales : ils peuvent entrer en collision avec les commandes de l'outil. Chaque prochaine commande recommandée doit être qualifiée de la même façon. Si l'hôte est inconnu, écrire `project-foundation: verify TASK-1` en langage naturel.

Une étape inconnue affiche les étapes disponibles sans lancer de travail. Sans étape, lire l'état puis appliquer `status`. Le routage est une instruction au modèle, pas un parseur déterministe ni une garantie d'exécution.

Chaque commande commence par lire les instructions applicables, les décisions acceptées, le statut réel et les sources nécessaires. Elle produit un résultat vérifiable, sans inventer les données, règles métier ou validations absentes.

| Commande | But | Suite suggérée |
|---|---|---|
| `/explore` | Comprendre problème, utilisateurs, marché et contraintes | `/frame` |
| `/frame` | Définir valeur, périmètre, exclusions et métriques | `/design` ou `/architecture` |
| `/design` | Définir ou appliquer une direction UX/UI approuvée | `/architecture` |
| `/architecture` | Définir frontières, ADR, contrats, risques et décisions ouvertes | `/plan` |
| `/plan` | Découper en milestone, epics et tickets prêts | `/ready` |
| `/ready <ticket>` | Vérifier scope, DoD, dépendances, contrat et tests | `/implement <ticket>` |
| `/implement <ticket>` | Réaliser une tranche cohérente avec tests ciblés | `/review <ticket>` |
| `/review <ticket>` | Revoir diff, architecture, contrats, tests et risques | `/verify` ou `/implement` |
| `/verify <ticket>` | Exécuter contrôles documentés et évaluer les preuves | `/integrate <ticket>` |
| `/integrate <ticket>` | Préparer PR/merge selon la politique du repo | `/next` |
| `/correct-course` | Traiter changement de scope ou décision invalidée | `/architecture` ou `/plan` |
| `/next` | Reprendre depuis l'état réel et choisir la prochaine tranche | commande adaptée |
| `/status` | Distinguer planifié, en cours, PR, fusionné et déployé | `/next` ou `/correct-course` |
| `/handoff` | Créer un checkpoint concis pour une autre session ou un autre agent | `/next` |

## Règles de sortie

À la fin de toute commande, fournir :
1. **Fait** : résultat concret et preuves disponibles.
2. **Non fait / incertain** : limites, hypothèses et blocages.
3. **Prochaine commande recommandée** : une seule commande, avec le ticket si présent.
4. Demander l'autorisation seulement avant merge, déploiement, publication, message ou action externe non déjà autorisée.

## Ticket prêt

Un ticket prêt contient objectif, périmètre et exclusions, critères d'acceptation, Definition of Done, ADR/contrats à respecter, dépendances/blocages/milestone et stratégie de test. Une dépendance non résolue conduit à `/correct-course`, jamais à une règle inventée.

Exécuter `/ready <ticket>` avant la première modification d'implémentation de la tranche. Lire ses dépendances réelles, pas seulement son statut importé. `/ready` et `/status` sont des évaluations : ils ne corrigent pas le code ni ne changent un tracker externe sans demande correspondante. Pour un projet déjà commencé, évaluer la prochaine tranche et déclarer les gates antérieurs non observés.

Quand l'utilisateur demande un audit ou un test complet du parcours, conserver la sortie de chaque commande au moment de son exécution avec ses entrées, preuves et prochaine commande. Étiqueter les reconstitutions a posteriori; elles ne prouvent pas qu'un contrôle a précédé le code.

## Boucle d'implémentation

`/implement` signifie développer une tranche, tester ce qui est touché, relire le diff et les frontières, corriger, puis lancer les contrôles convenus. Distinguer code local, PR ouverte, code fusionné et déploiement vérifié.

Un échec de `/verify` renvoie vers la correction concernée. Si un gate est bloqué par l'environnement, recommander `/correct-course` ou `/handoff`, pas `/integrate`. Une invocation explicite de `/integrate` avec un gate non satisfait peut préparer un candidat, mais doit refuser son acceptation. `/integrate` respecte le mode de livraison réellement autorisé (local, PR ou merge) et le nomme. En fin de périmètre, `/next` constate la fin et propose `/status` comme consultation facultative; il ne crée pas de nouvelles fonctionnalités ni de boucle automatique.
