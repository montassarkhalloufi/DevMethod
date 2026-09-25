# Vérification — parcours documentaire

Date : 25 septembre 2026
Révision inspectée : `ef539e5`

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| `npm run check:docs` | réussi | liens Markdown locaux |
| `npm run lint` | réussi | sources maintenues, dont le vérificateur documentaire étendu |
| `npm run format:check` | réussi | périmètre Prettier officiel du dépôt |
| vérificateur des liens HTML locaux | 71/71 résolus | `href` et `src` du manuel approfondi |
| `node --check docs/handbook/handbook.js` | réussi | syntaxe JavaScript |
| Prettier ciblé | réussi | HTML, CSS et JavaScript du manuel |
| `git diff --check` | réussi | espaces et marqueurs de conflit |
| tests Control Plane ciblés | 12/12 réussis | moteur et routes documentés |
| navigateur, format étroit | réussi | rendu, menu, recherche, chapitres, progression |
| navigateur, 1280 × 720 | réussi | traces, hiérarchie et lien profond |
| navigateur, 390 × 844 | réussi | cartes empilées et menu défilable de 14 chapitres |
| arbre d'accessibilité | réussi | titres, liens, dialogue de recherche, boutons et case de progression exposés |
| lecteur Markdown → HTML | réussi | UTF-8, titres, sommaire, listes, tableaux, code et liens internes |
| lecteur responsive | réussi | lecture et sommaire mobile à 390 × 844 |
| restriction des sources | réussi | chemin avec traversée `../..` refusé avant tout fetch |
| `node --check` | réussi | scripts du manuel, du lecteur et du contrôle documentaire |
| recherche globale `OAuth` | réussi | atlas et guide MCP retrouvés parmi les références profondes |
| progression de lecture | réussi | aucun niveau de compétence attribué depuis les cases de lecture |
| diagrammes HTML | réussi | flux et séquence rendus, source Mermaid conservée |
| navigateur desktop | réussi | atlas, sommaire fixe, tableaux et diagrammes lisibles |
| navigateur étroit | réussi | diagrammes empilés, contenu et sommaire accessibles |
| tests ciblés de l'atlas | 35/35 réussis | Control Plane, store, widgets, résolution React et broker MCP |
| commandes de laboratoires ciblées | réussi | invalidation, concurrence, route hostile et timeout MCP |
| création du workspace tutoriel | réussi | 51 fichiers créés sous `/private/tmp` sans écraser un projet |

## Scénario navigateur observé

1. Chargement de `/docs/handbook/` sans dépendance distante.
2. Ouverture du dialogue de recherche au clavier ou depuis l'en-tête.
3. Recherche de `policy.ts`, qui propose le chapitre **Carte du code**.
4. Recherche de `snapshotKey`, qui propose le chapitre **Contrats et invariants**.
5. Navigation directe vers `#traces` ; le titre reste visible sous la barre fixe après correction du
   scroll initial.
6. Marquage d'un chapitre comme compris ; le compteur et la barre utilisent le total dynamique de
   quatorze chapitres.
7. Ouverture et défilement du menu mobile ; les quatorze chapitres, dont **Niveau expert**, restent
   accessibles et le chapitre actif est visible.
8. Depuis **Niveau expert**, ouverture de `LEARNING-PATH.md` dans le lecteur HTML : accents,
   hiérarchie, tableau et liens internes correctement structurés.
9. Navigation depuis cette page vers `PROMISE.md` sans retour au Markdown brut.
10. Lecture de `REQUEST-LIFECYCLE.md` : liens contenant du code, listes multi-lignes et blocs
    Mermaid correctement présentés ; bouton de copie exposé.
11. Test mobile du lecteur et ouverture de son sommaire.

## Commande de test métier

```sh
node --test tests/control-plane.test.mjs tests/studio-control-plane.test.mjs
```

Le passage de ces tests confirme les règles citées pour la révision inspectée ; il ne transforme pas
les autres fonctionnalités du Studio en fonctionnalités vérifiées.

Le démarrage d'un second serveur de tutoriel n'a pas été répété dans le sandbox courant, qui refuse
un nouveau bind loopback. Le serveur documentaire déjà actif et les suites HTTP existantes ont
permis la vérification navigateur et des frontières concernées. La première version de la commande
utilisait `/tmp`; son échec observé sur macOS, où ce chemin est symbolique, a conduit à la procédure
finale vérifiée sous `/private/tmp`.
