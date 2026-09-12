---
name: scoped-delivery
description: Turn an authorized software scope into a bounded implementation, meaningful verification, review and resumable handoff. Use for delivery workflows, agent coordination or continuing a ticket; skip trivial text edits and do not start unrelated backlog work.
---

# Scoped Delivery

Finir le périmètre autorisé sans réinventer le projet, multiplier les revues ou confondre un statut avec une preuve.

## Avant d'agir
Lire CONTRIBUTING.md et les décisions acceptées, les instructions applicables, la décision/ticket et l'état réel du code/PR. Identifier les fichiers possédés et les changements utilisateur existants. Préserver la politique du projet sur branches, worktrees, CI et compétences obligatoires.

Un scope est prêt si l'objectif, exclusions, contrats, dépendances et critères de succès sont suffisamment définis. Utiliser [assets/SLICE.md](assets/SLICE.md) pour un ticket substantiel, sans bureaucratie pour une correction claire. Une contradiction bloque uniquement le travail qui dépend de l'arbitrage.

## Livrer
- Une intention cohérente par tranche; préférer une verticale utile à des couches laissées déconnectées.
- Un writer par branche/surface par défaut. Les sous-agents ne se déclenchent que si la session et l'environnement les autorisent et qu'un travail borné le justifie.
- Si travail parallèle autorisé : worktrees/branches isolés, propriétaire unique des contrats/migrations/lockfiles, dépendances et ordre de merge explicites. Reviews en lecture seule.
- Tests ciblés pendant l'implémentation, puis vérifications des surfaces affectées. Ne pas répéter un check vert inchangé ni écrire un test qui compare seulement l'implémentation à elle-même.
- Lire [references/verification-and-cost.md](references/verification-and-cost.md) pour les critères de review et les coûts.
- Pour une PR, garder draft tant que le code change. Reviewer un commit identifié; une modification ultérieure invalide les preuves affectées. Regrouper les corrections puis revue ciblée.
- Les merges, déploiements, messages et mises à jour de documents externes suivent les autorisations présentes, jamais un vieux prompt copié. Si l'action finale n'est pas autorisée, préparer un résultat concret vérifié avant de demander.
- Après une intégration autorisée, vérifier l'état réel. Continuer uniquement le backlog explicitement inclus dans la mission, en respectant budget et limites du projet.

## Reprise
Enregistrer [assets/CHECKPOINT.md](assets/CHECKPOINT.md) pour un travail long : sources versions, scope, commit, validations, blockers, prochaine action. Ne pas recopier les espaces Notion/Drive ou tout le registre d'outils. À la reprise, vérifier seulement les éléments susceptibles d'avoir changé.

Mettre à jour ensemble décisions affectées, contrats publics, tests et statut réel d'implémentation. Exécuter les commandes qualité documentées du projet; ne pas affaiblir un test ou lint pour obtenir du vert. Examiner le diff pour secrets, données personnelles et changements involontaires. Respecter la politique de publication et de migration existante.

## Compte rendu
Dire ce qui fonctionne, les preuves de vérification, les limites matérielles et ce qui reste requis. Distinguer implémenté localement, PR, intégré, déployé et vérifié en production. Un statut « Done » ne prouve aucun de ces états.
