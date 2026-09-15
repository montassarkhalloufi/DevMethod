# Revue indépendante — history-refactor

Candidat exact : `1f4b299a228da901614a9bc2f03b3d9905df0203`, worktree propre `/workspace/scratch/0182c7a94d20/history-refactor`. Périmètre : loop/planner, dist associé et les deux suites mises à jour. Aucun fichier du dépôt modifié. Reviewer distinct de l'auteur de cette refactorisation ; le reviewer a écrit le correctif antérieur des bornes connues, ce qui est déclaré pour qualifier son indépendance.

**Avis favorable : aucun défaut de régression identifié.** Les extractions suivent des responsabilités réelles, sans changement de format, d'admission ou de promesse d'exécution.

Points contrôlés :

- `validateLoop` conserve la séquence schéma → actions/état → tentatives, les mêmes bornes, refus de valeurs non entières et exigences pour les preuves déclarées passées.
- `ObservedUsage.known` reste une borne inférieure non négative ; `total` reste null dès qu'une valeur manque. `observeUsage` rejette l'overflow même après null. Les préfixes sont examinés **avant** consommation de la tentative suivante ; un succès tardif ne supprime pas les dépassements antérieurs.
- Tous les findings de préfixe précèdent ceux de retry, comme avant. La priorité reste abandoned → interruption/inconnu → blocked → correct-course → closure-required → limites → état final. Aucune prochaine action n'est exposée hors eligible.
- Le compteur progressif `noProgress` remplace à résultat égal le calcul final inverse : il compte exactement les tentatives terminales consécutives sans progrès.
- Le planner conserve l'ordre des validations relationnelles/isolation/cycle/concurrence/completion ; la topologie sert à calculer les dépendances, tandis que rapports et candidats restent dans l'ordre déclaré. Une tâche running suspend tous les candidats ; stale/missing ne peuvent remplacer une preuve courante d'un prérequis passé.
- Les chemins d'ownership et worktrees restent comparés sans distinction de casse et avec relation ancêtre ; aucun contrôle d'isolation réelle, dispatch ou retry ajouté.

## Preuves consultées et exécution indépendante

- Exécuté par ce reviewer sur le commit exact : `node --test tests/closure-loop.test.mjs tests/planner.test.mjs` → **22/22 réussis, zéro skip**. Les deux nouveaux tests fixent l'ordre des findings et des candidats ; leurs assertions correspondent au contrat existant.
- Preuve différentielle fournie par l'auteur : `history-refactor-differential.mjs/.json` → 899 comparaisons (155 traces, 72 états loop, 11 entrées loop malformées, 648 états plan, 13 plans malformés), aucune différence JSON/erreur enregistrée. J'ai lu le harness et vérifié que les deux modules baseline correspondent **octet par octet au parent du commit**, et les deux modules finaux au commit exact. Cette grande matrice n'a pas été rejouée par le reviewer.
- Probe d'oracle fourni : `history-refactor-loop155.json`, script `evaluation/hardening-audit/loop-probe.mjs` consulté : 155 traces, 71 avec inconnu, zéro franchissement ou admission dangereuse manqué. L'oracle calcule ses bornes par BigInt, sans reprendre la fonction de comptage du produit. Il s'agit d'une preuve déterministe bornée, pas de comportement natif ni de convergence générale.

Pins vérifiés : baseline loop `177a60e1a7bf79ee592dc6d3a59d0d9494ceaf294475fa49a9b00db9198bfcbb`, final loop `1f84ea8ca14f6131a52bb9f9360264e76ddc9b855bbf8a7b9bda9cc136684895` ; baseline planner `34bf128f1acb59c6dd687baa2a117f04ed9cb291652aeb1b8939d224826fab53`, final planner `45bcb6c22041291b0436d527be44cf95b78ac0e29a25bb771368f343d3206e73`.

Les gates du candidat intégré restent nécessaires. Cet avis ne certifie ni la vérité des métadonnées ni des worktrees isolés, et ne transforme pas le planner en ordonnanceur.
