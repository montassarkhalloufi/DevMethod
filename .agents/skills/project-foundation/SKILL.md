---
name: project-foundation
description: Bootstrap or resume a software project with a reusable decision, architecture, design and delivery foundation. Use for a project starter kit, initial engineering conventions, or recovery of project context across sessions; skip isolated edits that already have sufficient context.
---

# Project Foundation

Installer un contexte de travail durable à partir du projet réel. Ce kit est une méthode réutilisable, pas une autorité supérieure aux instructions du projet. Lire uniquement les modules utiles.

## Démarrer ou reprendre
1. Lire CONTRIBUTING.md lorsqu'il existe, les instructions applicables, le statut du travail, les manifestes/lockfiles et les décisions citées. Inspecter les sources fournies avant de choisir une stack. Ne pas lire les secrets.
2. Identifier séparément la vérité produit, les décisions acceptées, le scope exécutable, la référence visuelle et le code livré. Leur autorité dépend du sujet, pas seulement de leur date. Ne jamais confondre une proposition, une maquette et une implémentation.
3. Réutiliser le profil local existant. Sinon adapter [le profil](assets/PROJECT_PROFILE.md) depuis les sources et décisions de la session. Marquer les inconnues. Ne demander que ce qui bloque une décision matérielle; avancer sur le reste.
4. Décrire le résultat demandé, ses exclusions, les frontières touchées et la plus petite tranche utile. Une demande de kit ne déclenche pas de développement dans les projets étudiés.
5. Appliquer le module pertinent ci-dessous. Préserver les autorisations de la session; le kit n'autorise pas de nouveaux achats, publications, messages, merges ou modifications de sources externes.
6. Livrer le résultat vérifié dans le périmètre demandé. Enregistrer un checkpoint compact si la tâche doit se poursuivre, pas une nouvelle copie de toutes les sources.

Avant adoption, définir la stack, les commandes, le scope, les permissions de déploiement et le traitement des données dans le profil. Si CONTRIBUTING.md est absent, le signaler comme source manquante sans inventer son contenu ni bloquer une création autonome déjà cadrée. Les skills sont des procédures optionnelles; ils ne remplacent ni policy, ni décisions, ni tests, ni review.

Les exemples, historiques et sources propres à un projet restent dans ce projet. Ce kit ne les considère jamais comme des règles universelles.

## Méthode de travail réutilisable

Ce kit formalise une méthode complète : exploration → cadrage → design → architecture → planification → implémentation → tests → review → intégration. Une nouvelle contrainte, un échec de validation ou une décision ouverte ramène à la commande appropriée.

Lire [les commandes opératoires](references/operating-commands.md) pour toute invocation avec une étape, ou pour structurer un nouveau projet, un epic ou une tranche. Dans Codex, lancer `$project-foundation status`. Dans Claude Code ou Cursor, lancer `/project-foundation status`. Remplacer `status` par l'étape souhaitée. Les commandes ne remplacent pas celles du projet.

À la fin de toute exécution, donner ce qui est fait, ce qui reste incertain ou bloqué, et une seule prochaine commande recommandée.

## Modules du kit

| Besoin | Skill à résoudre par son nom |
|---|---|
| Arbitrer produit/stack, ADR, DDD ou frontières backend | decision-architecture |
| Traduire une référence approuvée en UI et vérifier la fidélité | design-to-code |
| Construire/refactorer React, hooks, état et frontières serveur/client | react-feature-engineering |
| Concevoir agents produit, preuves, fournisseurs IA et jobs | reliable-ai-integration |
| Transformer un scope en livraison vérifiable, review et reprise | scoped-delivery |

Résoudre les noms via les skills disponibles ou les frontmatters des dossiers locaux. Ne pas supposer que les dossiers installés conservent leur nom initial. Si un module manque, indiquer le manque et traiter le travail indépendant; ne pas prétendre l'avoir chargé.

Pour React, le module maison complète les skills officiels Vercel. Les URLs de référence ne constituent pas une installation. Les sources approuvées et épinglées du projet priment sur une version amont plus récente.

## Copier le dossier dans un autre projet
L'installateur DevMethod copie les skills sélectionnés, leurs ressources, les modèles de contexte et un prompt de démarrage. Il préserve les fichiers divergents et ne modifie pas les instructions existantes.

Depuis le projet cible, avec Node.js 22+ et npm :
```bash
npx --yes --package=github:montassarkhalloufi/DevMethod devmethod init --tool codex
```

Choisir `--tool claude` ou `--tool cursor` pour ces outils. Sans option, un terminal interactif demande le choix. Ajouter `--modules decision-architecture,scoped-delivery` pour limiter les modules; project-foundation reste inclus. Ajouter `--dry-run` pour inspecter sans écrire, ou `--dest` pour installer dans un dossier neuf. npm télécharge le paquet; l'installateur lui-même fonctionne hors ligne. Claude Code nécessite de reporter les règles utiles dans son `CLAUDE.md` existant, ou d'y importer un `AGENTS.md` existant avec `@AGENTS.md`.

Inspecter le résumé. Les fichiers identiques sont réutilisés; tout conflit bloque l'ensemble avant écriture. Le dossier contient les skills du profil choisi, `PROJECT_PROFILE.md`, `AGENTS.foundation.md`, `START_HERE.md`, `DEVMETHOD-LICENSE` et un manifeste d'intégrité. Pour une autre installation, relancer le CLI depuis l'autre projet. L'installation ne prouve pas qu'un modèle connecté a exécuté les commandes.

Pour une mise à jour : installer dans un dossier neuf et comparer avant fusion. Fusionner les règles utiles dans les instructions existantes seulement si cette adoption est demandée. Ne pas remplacer `AGENTS.md`, les décisions, lockfiles ou skills déjà approuvés. Adapter le profil une seule fois, puis le réutiliser.
