# Vue d'ensemble de la méthode

DevMethod organise le travail entre une personne et un agent autour d'une mission autorisée. La
méthode ne remplace pas le système de tickets, les règles du dépôt, les tests ou les permissions.
Elle donne une structure commune pour comprendre, décider, livrer, vérifier et reprendre.

## Principes

1. **Un résultat avant une activité.** Une mission décrit un changement observable, pas une liste
   de gestes génériques.
2. **L'autorité dépend du sujet.** Le code décrit le comportement livré ; un ADR explique un choix ;
   une preuve exécutée décrit ce qu'un contrôle a observé.
3. **Une décision avant ses détails dépendants.** Une architecture non acceptée reste une
   proposition, même si elle est détaillée.
4. **Une preuve possède un périmètre.** Elle est liée à une version, une source, une procédure et
   des limites.
5. **Les états restent distincts.** Implémenté, testé localement, en PR, fusionné, publié et vérifié
   en production ne sont pas synonymes.
6. **La reprise ne donne pas d'autorisation.** Un checkpoint restaure le contexte ; l'action suivante
   reste soumise au périmètre courant.

## Modes de collaboration

| Mode | Délégation | Point d'intervention humaine |
| --- | --- | --- |
| Guidé | L'agent prépare et exécute le périmètre autorisé | Choix et acceptation des résultats utiles |
| DevAuto | Les choix structurants sont acceptés puis l'agent livre automatiquement | Nouvelle décision structurante ou dérive observée |
| Autonome | Les choix réversibles sont délégués | Permission externe, décision hors délégation ou arrêt |

Les trois modes conservent les mêmes exigences de preuve, de review et de sécurité.

## Six modules, quatorze étapes

Les modules installables sont `project-foundation`, `decision-architecture`, `design-to-code`,
`react-feature-engineering`, `reliable-ai-integration` et `scoped-delivery`. Les étapes visibles
`devmethod-*` chargent ces procédures sans les dupliquer. Voir le [workflow détaillé](WORKFLOW.md)
et la [référence des commandes](../COMMANDS.md).

## Formats de travail

- **Quick** : correction claire dans des contrats existants ; état et preuves peuvent rester dans
  la conversation.
- **Standard** : fonctionnalité traversant plusieurs composants ou sessions ; plan et reprise sont
  utiles.
- **Major** : nouvelle capacité ou décision conséquente ; résoudre les choix et séparer les slices.

Le risque et la politique du dépôt peuvent imposer un chemin plus strict que la taille apparente.
