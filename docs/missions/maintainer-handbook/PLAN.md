# Mission — parcours documentaire du nouvel arrivant au mainteneur expert

Source : demande utilisateur du 25 septembre 2026. Objectif : permettre à une personne qui ne
connaît ni DevMethod, ni le Studio, ni le code de comprendre le produit, de l'exécuter, de le
modifier sans casser ses contrats, puis d'en maintenir les frontières avancées.

Révision de départ inspectée : `ef539e5` sur `codex/studio-0.6-integration`, Studio
`0.6.0-beta.1`. Le Control Plane est livré dans cette branche et décrit par l'ADR 027. Les fichiers
personnels non suivis (`prepublication-ai-audit.*`, `publication-preparation/`, `.DS_Store`) sont
exclus de la mission.

## Résultats attendus

1. Un manuel HTML hors ligne, coloré, navigable et accessible comme livrable principal.
2. Un point d'entrée textuel et un parcours de lecture progressif.
3. Une présentation honnête de la promesse, de l'état actuel et des limites.
4. Un manuel de la méthode et de ses quatorze étapes visibles.
5. Un guide illustré du Studio et du Control Plane à partir de captures réelles.
6. Des cartes d'architecture, de flux et de code reliées aux fichiers propriétaires.
7. Des guides de développement, test, extension, diagnostic et release.
8. Une validation navigateur desktop/mobile, des liens, de la cohérence et du diff documentaire.
9. Un cursus avancé reliant requêtes, contrats, invariants, incidents et exercices observables.
10. Une seconde passe issue de l'audit de couverture : théorie reliée au runtime, atlas des moteurs,
    dossiers de code, tutoriel Studio et laboratoires réellement exécutables.

## Critères d'acceptation

- Un lecteur peut choisir un parcours utilisateur, contributeur ou mainteneur expert depuis
  `docs/START-HERE.md`.
- Les termes méthode, Studio, CLI, skills, mission, preuve, vérification et Control Plane sont
  distingués.
- Les diagrammes séparent architecture logicielle, flux d'exécution et graphe de confiance.
- Les écrans illustrés utilisent les captures navigateur finales, pas les maquettes cibles.
- La carte du code donne les premiers fichiers à lire et les tests associés à chaque domaine.
- Les commandes copiables correspondent aux scripts et au CLI présents dans la révision inspectée.
- Les fonctionnalités partielles ou non vérifiées restent explicitement limitées.
- Le niveau expert repose sur des laboratoires et un changement relu, pas sur une progression
  déclarative dans l'interface.
- Les sous-systèmes création/import, édition, intelligence, qualité, MCP, exécution et contrôle ont
  chacun propriétaire, flux, état, pannes et tests identifiables.
- La recherche du manuel retrouve les références approfondies et les diagrammes sont lisibles en
  HTML sans dépendance distante.
- `npm run check:docs`, le formatage applicable et `git diff --check` réussissent.

## Exclusions

- Aucun changement de comportement produit.
- Aucune publication npm, release ou modification de version.
- Aucune réécriture des ADR, résultats historiques ou preuves existantes.
- Aucune prétention nouvelle sur Claude Code, Cursor, la production ou un avantage comparatif.
