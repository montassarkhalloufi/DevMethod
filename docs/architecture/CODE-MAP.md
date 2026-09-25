# Carte du code et ordre de lecture

Cette carte sert à trouver les fichiers. Pour comprendre les responsabilités et leurs interactions,
lire ensuite l'[atlas des sept moteurs](ENGINE-ATLAS.md), la [carte théorie → code](THEORY-TO-CODE.md)
et les [dossiers de code annotés](../maintainers/CODE-DOSSIERS.md).

## Les premiers fichiers à lire

| Ordre | Fichier | Pourquoi |
| --- | --- | --- |
| 1 | `README.md` | Promesse publique et statut de candidate |
| 2 | `CONTRIBUTING.md` | Gates, versions Node, build et publication |
| 3 | `package.json` | Scripts réellement disponibles |
| 4 | `src/cli.ts` | Point d'entrée du binaire |
| 5 | `src/cli-commands.ts` | Commandes CLI et limites affichées |
| 6 | `src/commands.ts` | Propriété des quatorze étapes |
| 7 | `src/init.ts` | Installation et payload des skills |
| 8 | `scripts/studio/server.mjs` | Composition du serveur Studio |
| 9 | `scripts/studio/domain.mjs` | Invariants du registre et des versions |
| 10 | `scripts/studio/store.mjs` | Persistance atomique et transitions |
| 11 | `scripts/studio/runner.mjs` | Cycle des missions et workers |
| 12 | `scripts/studio/quality.mjs` | Catalogue et résultats de contrôles |
| 13 | `src/control-plane/contracts.ts` | Langage du Control Plane |
| 14 | `src/control-plane/policy.ts` | Politique déterministe |
| 15 | `scripts/studio/control-plane.mjs` | Adaptation des sources réelles |
| 16 | `studio-ui/src/features/control/ControlPlane.tsx` | Composition des vues |

## Domaines principaux

### Méthode et CLI

- `mission.ts`, `planner.ts`, `checkpoint.ts`, `closure.ts` : contexte et critères ;
- `evidence-*` : contrat, exécution et stockage de preuves applicatives ;
- `guard-*` : gates locales optionnelles et arrêt persistant ;
- `review-*` : modèle, rendu Markdown/HTML et ouverture ;
- `.agents/skills/` : procédures sources installées vers les hosts.

### Studio serveur

- `server.mjs` compose routes, sessions et modules optionnels ;
- `domain.mjs` valide le registre et possède les transitions métier ;
- `store.mjs` protège les écritures et leurs limites ;
- `runner.mjs`, `jobs.mjs`, `progress.mjs` gèrent les missions ;
- `preview.mjs`, `editor.mjs`, `source.mjs` gèrent aperçu et sources ;
- `quality*.mjs` et `intelligence*.mjs` produisent contrôles et analyses ;
- `mcp-*.mjs` séparent sélection, permission, transport et journal.

### Interface

La coque historique se trouve dans `scripts/studio/public/`. Les vues complexes sont des îlots
React compilés depuis `studio-ui/src/`. Les fichiers `*-widget.tsx` sont les points de montage ;
les dossiers `features/` possèdent vues, hooks et logique pure de présentation.

## Du changement au test

| Changement | Sources probables | Tests à commencer par |
| --- | --- | --- |
| Commande CLI | `src/cli-commands.ts` | `commands`, `install`, `doctor` |
| Contrat mission | `src/mission.ts` | `mission`, `checkpoint`, `closure-loop` |
| Preview/édition | `scripts/studio/preview.mjs`, `editor.mjs` | `studio-editor`, `studio-comparison-preview` |
| Job/progression | `runner.mjs`, `progress.mjs` | `studio-runner*`, `studio-progress*` |
| Contrôle qualité | `quality*.mjs` | `studio-quality*` |
| MCP | `mcp-*.mjs` | `studio-mcp*` |
| Intelligence code | `intelligence/` | `studio-intelligence*`, `studio-project-model-views` |
| Control Plane | `src/control-plane/`, `control-*.mjs` | `control-plane`, `studio-control-*` |
| UI React | `studio-ui/src/` | tests widget/UI puis navigateur ciblé |

## Fichiers générés

`dist/` est compilé depuis `src/` et doit être commité avec les sources pour l'installation GitHub.
Les bundles Studio React sont produits par `npm run build:studio-ui`. Ne modifiez pas un artefact
généré sans modifier sa source et reconstruire.
