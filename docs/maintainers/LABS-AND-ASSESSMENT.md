# Laboratoires et évaluation de maîtrise

Ces laboratoires s'exécutent depuis le checkout DevMethod avec Node.js 22.13+ ou 24+. Ils ne
demandent ni publication, ni push, ni compte externe. Utilisez un workspace jetable pour toute
manipulation. Un test réussi affiche des lignes TAP `ok`; son code de sortie est `0`.

## Règle commune

Pour chaque laboratoire, conserver un court compte rendu :

```text
Révision inspectée :
Commande ou procédure :
Entrée :
Résultat observé :
Fichiers propriétaires :
Ce que le résultat démontre :
Ce qu'il ne démontre pas :
```

La remise à zéro consiste à supprimer uniquement le workspace temporaire que vous avez vous-même
créé, serveur arrêté. Les tests automatisés créent et nettoient leurs propres dossiers temporaires.

## Laboratoire 1 — raconter le système

**Objectif.** Expliquer DevMethod en dix minutes à une personne qui ne connaît pas le projet.

**Préparer.** Lire la [promesse](../product/PROMISE.md), l'[état actuel](../product/CURRENT-STATE.md),
la [carte théorie → code](../architecture/THEORY-TO-CODE.md) et l'[atlas](../architecture/ENGINE-ATLAS.md).

**Exécuter.** Produire un schéma qui distingue méthode, skills, CLI, Studio, Control Plane, mission,
révision, preuve et permission. Ajouter trois non-promesses.

**Réussite.** Une autre personne peut prédire pourquoi un job terminé n'active pas automatiquement
une candidate et pourquoi une étape `devmethod-*` n'est pas nécessairement un moteur runtime.

## Laboratoire 2 — suivre une lecture Control Plane

**Préparer.** Ouvrir, dans cet ordre :

1. `studio-ui/src/features/control/ControlPlane.tsx` ;
2. `studio-ui/src/features/control/useControl.ts` ;
3. `scripts/studio/control-routes.mjs` ;
4. `scripts/studio/control-plane.mjs` ;
5. `src/control-plane/engine.ts` ;
6. `scripts/studio/store.mjs`.

**Exécuter.** Dessiner la requête GET, les sources lues, le calcul et le commit conditionnel. Puis :

```sh
node --test tests/studio-control-plane.test.mjs
```

**Observer.** Le rapport est recalculé depuis les sources et n'est écrit que si son snapshot change.

**Réussite.** Le diagramme place les règles de risque dans le domaine TypeScript, jamais dans React,
et distingue erreur réseau, source indisponible et snapshot inchangé.

## Laboratoire 3 — invalider puis renouveler une preuve

**Exécuter.**

```sh
node --test --test-name-pattern="new revision invalidates|renewed successful proof" tests/control-plane.test.mjs
```

**Observer.** Une nouvelle révision invalide seulement les preuves dépendantes ; une preuve observée,
actuelle et réussie peut ensuite restaurer la décision.

**Travail manuel.** Dans le test, relever les dépendances qui changent, les nœuds conservés et le
passage de décision. Expliquer la différence entre historique conservé et preuve courante.

**Réussite.** Aucun effacement global du graphe et aucune preuve périmée présentée comme favorable.

## Laboratoire 4 — conflit de version et reprise

**Exécuter.**

```sh
node --test --test-name-pattern="CAS rejects stale writes|second writer" tests/studio-store.test.mjs
```

**Observer.** La première mutation avance la version ; la seconde, fondée sur l'ancienne version,
est refusée. Le redémarrage interrompt le travail actif sans le déclarer réussi.

**Réussite.** Le compte rendu indique version attendue, version courante, code `409`, état durable
préservé et raison pour laquelle « last write wins » serait dangereux pour une approbation.

## Laboratoire 5 — ajouter un signal sans dupliquer la règle

**Préparer.** Créer une branche ou un worktree jetable. Lire la recette
[changement vertical](CHANGE-RECIPES.md) et les [invariants](../architecture/CONTRACTS-AND-INVARIANTS.md).

**Exécuter.** Ajouter d'abord un cas de test synthétique qui échoue pour le signal voulu, puis
implémenter la tranche source → contrat → politique → attention → présentation. Commande minimale :

```sh
node --test tests/control-plane.test.mjs tests/studio-control-plane.test.mjs
```

**Réussite.** Le cas absent reste faible, la règle n'est pas dupliquée dans l'UI et le test rouge
initial échouait pour la raison attendue. Ne conservez pas l'exercice dans votre branche de travail
s'il ne correspond pas à une évolution autorisée.

## Laboratoire 6 — diagnostiquer un faux vert

**Exécuter.**

```sh
node --test --test-name-pattern="missing, stale, declared" tests/control-plane.test.mjs
```

**Observer.** `declared/current/passed`, `observed/stale/passed` et une exécution en cours restent
insuffisants.

**Réussite.** Expliquer quel faux positif créerait un test portant seulement sur
`outcome === "passed"`, puis nommer les trois dimensions supplémentaires contrôlées.

## Laboratoire 7 — frontière HTTP hostile

**Exécuter.**

```sh
node --test --test-name-pattern="routes reject forged input" tests/studio-control-plane.test.mjs
node --test --test-name-pattern="malicious Origin" tests/studio-integration-safety.test.mjs
```

**Observer.** Mauvais acteur, origine hostile, forme inconnue ou version obsolète sont refusés sans
effet durable accepté.

**Réussite.** Pour chaque refus, noter la frontière propriétaire, le statut et la preuve d'absence
d'écriture. Aucun refus ne doit dépendre uniquement d'un bouton désactivé.

## Laboratoire 8 — réponse UI tardive

**Préparer.** Lire `useControl.ts` et les hooks des widgets concernés. Repérer `AbortController`, les
identifiants de requête et le contexte de révision.

**Exécuter.**

```sh
node --test tests/studio-control-widget.test.mjs tests/studio-react-resolution.test.mjs
```

**Observer.** Les états chargement, erreur, nouvelle tentative et contexte obsolète restent
distincts ; une réponse ancienne ne fabrique pas un succès.

**Réussite.** Le compte rendu explique à la fois l'annulation réseau et la protection logique : une
annulation seule ne garantit pas que le serveur n'a produit aucun effet.

## Laboratoire 9 — incident MCP à effet inconnu

**Exécuter.**

```sh
node --test --test-name-pattern="timeout aborts once" tests/studio-mcp-broker.test.mjs
```

**Observer.** Le timeout annule une fois, ne relance pas et conserve l'incertitude sur un effet
externe déjà parti.

**Réussite.** Proposer une procédure de réconciliation : relire `requestId`, journal local, statut
du fournisseur et ressource visée avant toute nouvelle écriture. « Réessayer pour voir » échoue.

## Laboratoire 10 — préparer une candidate sans publier

**Exécuter.** Depuis un checkout propre ou en connaissant précisément les changements locaux :

```sh
npm run lint
npm run format:check
npm test
npm run check:docs
npm pack --dry-run
```

**Observer.** Conserver la révision, les commandes, les résultats et le contenu de l'archive. Ne pas
publier et ne pas créer de tag.

**Réussite.** Le rapport distingue archive candidate, commit local, push, merge, tag, publication et
vérification post-publication. Un succès local ne prouve aucun des états suivants.

## Examen de maintenance

Une personne est autonome sur le dépôt lorsqu'elle peut, sans deviner :

| Compétence | Démonstration attendue |
| --- | --- |
| orientation | retrouver propriétaire, consommateurs et tests d'un comportement |
| modèle mental | expliquer intention → révision → preuve → risque → décision |
| contrat | citer les invariants touchés avant une modification |
| implémentation | livrer une tranche domaine/adaptateur/UI sans règle dupliquée |
| vérification | choisir un contrôle qui pourrait révéler le défaut réel |
| diagnostic | préserver l'état et réduire l'incertitude avant de relancer |
| sécurité | séparer acteur, origine, permission, admission et validation |
| reprise | identifier ce qui reste valide après un changement |
| release | prouver l'identité de la candidate sans prétendre qu'elle est publiée |
| communication | distinguer observé, implémenté, vérifié, intégré et disponible |

## Barème observable

| Niveau | Preuve minimale |
| --- | --- |
| découverte | présentation correcte et trois non-promesses |
| utilisateur | tutoriel Studio exécuté avec compte rendu |
| contributeur | laboratoires 2 à 8 et petite tranche relue |
| mainteneur | diagnostic autonome, changement vertical et candidate simulée |
| expert | évolution d'une frontière avec ADR, migration, tests et invalidation sélective |

La progression de lecture du manuel HTML n'accorde aucun niveau. Chaque niveau repose sur les
démonstrations observables ci-dessus et sur une revue réelle du changement produit.
