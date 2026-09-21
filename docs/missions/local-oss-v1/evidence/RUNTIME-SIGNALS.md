# Signaux du navigateur — 21 septembre 2026

Tranche locale de [la mission](../PLAN.md), distincte de la recette native.

## Contrat

L’aperçu produit émet ses erreurs et rejets de promesses vers le Studio. Le collecteur
vérifie fenêtre, origine et révision affichée, ignore les comparaisons et brouillons de
l’éditeur, puis conserve une observation négative bornée. La page peut imiter le signal :
provenance `preview-signal`, aucune exécution indépendante attestée, aucun succès ni accord
humain déduit. L’absence d’erreur rapportée ne constitue pas une preuve de fonctionnement.

L’observation conserve révision et empreinte, survit au redémarrage et à l’export/restauration
avec l’état du projet. Déduplication persistante, vingt observations par révision et cinq
cents par projet. Un signal actuel exige une vérification supplémentaire ; il ne suffit
pas à autoriser une correction automatique. Un signal d’une autre révision est obsolète.
Le mécanisme actuel ne résout pas automatiquement un signal transitoire sur une même révision.

## Essai navigateur contrôlé

Fixture séparée `runtime-signal-fixture`, non générée par l’agent natif, clairement nommée
« Fixture contrôlée — signaux navigateur ». Aucun appel fournisseur.

- Révision `e0db0c62-ca71-4df9-9ae6-aa5d7a56b76e`.
- Clic réel CUA dans l’iframe sur « Déclencher l’erreur contrôlée ».
- Exception JavaScript observée et enregistrement persistant
  `d20f9813-7236-4ee9-9beb-f9ad22cc7d5d`, sans champ `executor`.
- Message rapporté : « Uncaught Error: Erreur contrôlée du collecteur runtime ».
- Fichier `index.html`, ligne 1, empreinte
  `c32c2937696cd4b04482cca1fcbeaa2f0bd4adb08aeda1579bf4ede08737c965`.

L’essai a révélé deux défauts de présentation : un tableau qualité masquait le panneau de
contrôle et le signal était compté comme contrôle de livraison. Le correctif UI `85573c0`
conserve le contrôle d’exécution visible après montage du véritable widget React et sépare
les observations des contrôles de livraison. La provenance détaillée du signal est affichée
avec son diagnostic ; un agent désactivé n’est plus décrit comme un budget épuisé.

Nouvel essai CUA le 21 septembre à 11:43 UTC, après redémarrage du même projet, mêmes données
et ports : panneau de contrôle et tableau qualité visibles ensemble, provenance non attestée
et diagnostic inspectés ; deux clics séparés par un rechargement conservent le même signal,
son identifiant et sa date. Lecture du stockage : version 6, une seule observation runtime.
Le pied d’aperçu indique deux contrôles de livraison réussis, zéro échec technique et une
observation non attestée. Rendu de l’aperçu et de Vérifications inspecté visuellement.

Validation ciblée : 61 tests runtime/interface réussis, puis 11 tests éditeur réussis. La
première suite globale a détecté une assertion historique exigeant l’absence de collecteur
dans l’aperçu produit (1210/1211 réussis). Le contrat mis à jour vérifie la séparation entre
identité du brouillon et de la révision, l’absence de collecteur dans la comparaison et
la normalisation d’une ligne inconnue vers `null`. Logs sous le répertoire privé de mission.
Suite globale finale : build et **1211 tests réussis**, lint global et format global réussis
(test éditeur reformatté puis lint ciblé), liens documentaires résolus. Logs
`runtime-full-tests-final.log`, `runtime-lint.log`, `runtime-format.log`.

Les observations CUA sont effectuées par l’agent ; elles ne prouvent ni intervention humaine
ni vérification native du produit. La campagne native suspendue reste inchangée.
