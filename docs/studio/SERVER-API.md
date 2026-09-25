# Studio serveur et API locale

## Composition

[`startStudio`](../../scripts/studio/server.mjs) assemble un store local, le registre de jobs,
l'éditeur, les aperçus, les modules d'analyse/qualité chargés à la demande, MCP et le Control Plane.
Le serveur principal et l'aperçu ont des responsabilités différentes : l'aperçu exécute la
candidate dans une frontière dédiée ; il ne possède pas l'état canonique du Studio.

Le serveur refuse d'utiliser le dépôt DevMethod lui-même comme workspace produit. Cela évite de
mélanger sources de l'outil, état `.devmethod` et projet géré.

## Familles de routes

| Famille | Exemples | Propriétaire |
| --- | --- | --- |
| état et projet | `GET /api/state`, `POST /api/project` | `server.mjs`, `domain.mjs` |
| demandes et jobs | `/api/requests`, `/api/jobs/*` | `domain.mjs`, `jobs.mjs`, `progress.mjs` |
| sources et éditeur | `/api/source`, `/api/editor/*` | `source.mjs`, `editor.mjs` |
| modèle du projet | `/api/project/model` | `intelligence.mjs` |
| qualité | `/api/project/checks*` | `quality*.mjs` |
| Control Plane | `/api/control*` | `control-plane.mjs`, `control-routes.mjs` |
| MCP | `/api/mcp*` | `mcp-*.mjs` |
| connecteurs | `/api/connectors*` | `connector-*.mjs` |
| runtime | `/api/runtime*` | `backend-runtime.mjs` |
| export et références | `/api/export`, `/references/*` | `bundle.mjs`, `server.mjs` |

Cette table est une carte, pas un schéma OpenAPI. La forme exacte reste possédée par les fonctions
de validation et les tests HTTP.

## Lecture, mutation et worker

Les routes distinguent trois acteurs :

- **lecture navigateur** : origine vérifiée lorsque nécessaire et aucune donnée mise en cache ;
- **mutation humaine** : même origine, version attendue et règles métier ;
- **mutation worker** : bearer token comparé en temps constant et liste de routes dédiée.

Le bearer token ne représente pas une personne. Le serveur refuse qu'un worker l'utilise pour
enregistrer une approbation humaine.

## Concurrence optimiste

Toutes les mutations persistantes sérieuses portent la version lue par le client :

```text
client lit version 17
client prépare une mutation
un autre acteur produit version 18
client envoie expectedVersion = 17
store répond 409 et ne remplace rien
client recharge, conserve si possible sa saisie, puis réévalue
```

Pour le Control Plane, `snapshotKey` ajoute une seconde protection. Deux états Studio peuvent avoir
des versions différentes, mais une décision humaine doit surtout viser les mêmes preuves, risques,
action et révision.

## Stockage durable

Le registre principal vit dans `.devmethod/studio.json`. Autour de lui peuvent exister journaux de
qualité, actions MCP, progression et références. Chaque propriétaire doit conserver :

- taille maximale ;
- validation à la lecture ;
- écriture atomique ou append-only appropriée ;
- refus des liens symboliques aux frontières sensibles ;
- erreur explicite en cas de corruption ;
- aucune réparation silencieuse qui détruirait la preuve du problème.

Au redémarrage, un job trouvé `running` devient interrompu : le serveur ne prétend pas connaître
l'issue d'un processus disparu.

## Modules optionnels

L'intelligence de projet et la qualité sont chargées à la demande. Une dépendance TypeScript
absente produit une erreur de capacité (`503`) au lieu d'empêcher le Studio minimal de démarrer.
Le Control Plane transforme une source indisponible en limite et en incertitude ; il ne fabrique pas
une analyse vide présentée comme complète.

## Comment ajouter une route

1. définir l'acteur autorisé ;
2. définir méthode, origine, taille et forme du corps ;
3. appeler une fonction de domaine ou d'adaptateur propriétaire ;
4. persister via le store avec version attendue ;
5. retourner une erreur stable et compréhensible ;
6. tester succès, rôle interdit, origine invalide, version obsolète et entrée mal formée ;
7. connecter l'UI sans dupliquer la règle ;
8. documenter la nouvelle frontière si elle change l'architecture.

## Tests à lire

- [`studio-domain.test.mjs`](../../tests/studio-domain.test.mjs) pour les transitions ;
- [`studio-store.test.mjs`](../../tests/studio-store.test.mjs) pour la persistance ;
- [`studio-integration-safety.test.mjs`](../../tests/studio-integration-safety.test.mjs) pour les
  protections d'intégration ;
- [`studio-control-plane.test.mjs`](../../tests/studio-control-plane.test.mjs) pour les routes du
  Control Plane ;
- les familles `studio-mcp-*`, `studio-quality-*` et `studio-progress-*` pour leurs contrats.
