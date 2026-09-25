# Parcours de maîtrise

Ce cursus n'est pas une simple liste de fichiers. Chaque niveau combine connaissance, pratique et
preuve observable. Comptez une à deux semaines pour le réaliser sérieusement si TypeScript, Node et
React sont déjà familiers, puis une contribution réelle relue pour valider l'autonomie.

## Niveau 1 — Expliquer

- distinguer méthode, skills, CLI, Studio et Control Plane ;
- expliquer mission, preuve, révision et autonomie effective ;
- nommer les non-promesses du produit.

Exercice : présenter DevMethod en cinq minutes sans employer « automatique » pour une capacité non
vérifiée.

Références : [promesse](../product/PROMISE.md), [état actuel](../product/CURRENT-STATE.md) et
[glossaire](../product/GLOSSARY.md).

## Niveau 2 — Utiliser

- installer dans un dossier jetable ;
- exécuter Pocket Tasks ;
- créer ou reprendre un projet Studio ;
- lire une vérification et ses limites ;
- distinguer candidate et version appliquée.

Preuve attendue : un compte rendu qui relie chaque écran consulté à sa source, sa révision et sa
limite. Une capture seule ne suffit pas.

Parcours pratique : exécuter le [tutoriel Studio](../studio/USER-GUIDE.md#tutoriel-guide-dans-un-workspace-jetable)
avant de lire les routes internes.

## Niveau 3 — Diagnostiquer

- retrouver le fichier propriétaire depuis une vue ;
- relier une route à son store et à son test ;
- provoquer puis expliquer un conflit de version ;
- suivre une preuve périmée jusqu'à `Verify`.

Travaux obligatoires : les traces 1 à 5 du [cycle de requête](../architecture/REQUEST-LIFECYCLE.md)
et au moins trois scénarios du [playbook d'incident](FAILURE-PLAYBOOK.md). Utiliser l'[atlas des
moteurs](../architecture/ENGINE-ATLAS.md) pour choisir la frontière, puis les
[dossiers de code](CODE-DOSSIERS.md) pour suivre ses symboles.

## Niveau 4 — Étendre

- livrer une tranche verticale ;
- préserver domaine/adaptateur/UI ;
- ajouter un scénario négatif pertinent ;
- vérifier l'interface dans un navigateur réel ;
- mettre à jour le guide et la preuve.

Utiliser les [recettes de changement](CHANGE-RECIPES.md) et annoncer avant le changement les
[invariants](../architecture/CONTRACTS-AND-INVARIANTS.md) qui seront revalidés.

Avant de modifier une procédure ou un runtime, vérifier dans la
[carte théorie → code](../architecture/THEORY-TO-CODE.md) quelle couche possède réellement la règle.

## Niveau 5 — Maintenir

- arbitrer un changement de frontière et enregistrer l'ADR ;
- déterminer quelles preuves sont invalidées ;
- préparer une archive candidate exacte ;
- distinguer tests de packaging et comportement natif ;
- arrêter honnêtement une mission bloquée.

Preuve attendue : laboratoires 1 à 10, préparation d'une candidate non publiée, puis revue d'une
contribution réelle selon le [barème](LABS-AND-ASSESSMENT.md).

## Semaine type

| Jour | Travail | Résultat observable |
| --- | --- | --- |
| 1 | promesse, méthode, Studio | présentation exacte et non-promesses |
| 2 | théorie → code, atlas, serveur | carte des propriétaires, moteurs et routes |
| 3 | traces Control Plane, candidate et MCP | diagrammes de séquence complets |
| 4 | contrats, store, sécurité locale | checklist d'invariants par changement |
| 5 | frontend, tests et réponses périmées | diagnostic d'un scénario UI |
| 6–7 | laboratoires 3 à 9 | preuves reproductibles et comptes rendus |
| 8–9 | petite tranche verticale | diff, tests, navigateur et documentation |
| 10 | release simulée et revue | candidate exacte, non publiée, rapport honnête |

## Questions de contrôle

Vous devez pouvoir répondre sans chercher au hasard :

1. pourquoi `version` et `snapshotKey` sont-ils tous les deux nécessaires ?
2. pourquoi une acceptation humaine ne peut-elle pas rendre une preuve favorable ?
3. que devient un job `running` après un redémarrage brutal ?
4. quelle différence existe entre permission MCP et admission Control Plane ?
5. où placer une nouvelle règle de risque et où ne pas la placer ?
6. comment empêcher une réponse React tardive d'écraser une nouvelle révision ?
7. que prouve réellement un hash de source ?
8. quels artefacts doivent être reconstruits avant une release ?
9. pourquoi un package construit n'est-il pas encore une version publiée ?
10. quand un changement impose-t-il une décision architecturale ?
11. quelles parties des quatorze étapes sont des procédures et lesquelles possèdent un enforcement logiciel ?
12. quel moteur possède l'import, la qualité, l'intelligence statique et le broker MCP ?

La progression du [manuel HTML](../handbook/index.html) est une aide personnelle stockée dans le
navigateur. Elle ne certifie aucun de ces niveaux.
