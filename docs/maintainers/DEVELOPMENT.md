# Environnement de développement

## Prérequis

- Node.js 22.13+ sur la ligne 22, ou Node.js 24+ ;
- npm ;
- Git avec au moins un commit ;
- navigateur local pour les changements d'interface.

## Installation et baseline

```sh
npm ci
npm run build
npm test
```

Avant une modification, lire `CONTRIBUTING.md`, l'ADR propriétaire et l'état Git. Préserver les
fichiers non suivis de l'utilisateur et éviter les reformatages hors périmètre.

## Lancer le Studio

```sh
npm run studio
```

Pour un workspace dédié, consulter `node dist/cli.js studio --help` ou [le guide Studio](../STUDIO.md).
Les ports, sessions et fichiers runtime sont locaux ; ne publiez jamais leurs tokens.

## Boucle recommandée

1. établir un test ou une observation de baseline ;
2. modifier une responsabilité cohérente ;
3. exécuter le contrôle ciblé ;
4. reconstruire les artefacts générés affectés ;
5. exécuter les gates complètes avant livraison ;
6. vérifier l'UI dans un navigateur si son comportement ou son rendu change ;
7. relire le diff, les fichiers non suivis et les données privées.

## Commandes de qualité

```sh
npm run lint
npm run format:check
npm test
npm run check:docs
npm run quality:report
npm pack --dry-run
```

Une modification documentaire utilise des contrôles proportionnés ; elle n'exige pas une matrice
d'application sans impact. Un changement de source compilée exige le build et les tests affectés.
