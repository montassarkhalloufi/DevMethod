# Dossiers de code annotés

Ces dossiers ne recopient pas les sources. Ils indiquent les symboles à lire, leurs appelants, leurs
effets et les tests qui permettent de vérifier une interprétation. Ouvrez les fichiers dans l'ordre
indiqué, puis revenez à la trace concernée.

## Dossier A — mission et fermeture

**Question :** comment une intention devient-elle un résultat dont la fermeture peut être inspectée ?

| Étape | Symbole | Ce qu'il faut comprendre |
| --- | --- | --- |
| 1 | `validateMission` dans `src/mission.ts` | forme bornée, critères et champs autorisés |
| 2 | `missionStatus` | `ready`, `blocked` et `complete` sont dérivés, pas déclarés librement |
| 3 | `captureContext` | les sources sont capturées avec leurs empreintes |
| 4 | `inspectCheckpoint` | une source modifiée invalide sa dépendance, pas toute l'histoire |
| 5 | `inspectClosure` | la fermeture combine mission, contexte et couverture des critères |

Entrées : mission et checkpoint JSON. Effets : aucun changement métier du projet ; ce sont des
inspecteurs. Tests : `mission.test.mjs`, `checkpoint.test.mjs`, `closure-loop.test.mjs`.

## Dossier B — une mutation Studio

**Question :** pourquoi deux onglets ne peuvent-ils pas approuver silencieusement deux états
incompatibles ?

1. `server.mjs` reçoit une requête et sélectionne le service.
2. Le service valide la forme et appelle une transition de `domain.mjs`.
3. `store.update` acquiert le verrou, relit l'état et compare la version attendue.
4. `validateTransition` compare ancien et nouvel état.
5. `persist` écrit un fichier temporaire puis le renomme.
6. Une version ancienne reçoit `409` ; l'état durable reste celui de la première mutation.

À observer : aucune règle métier importante ne doit vivre seulement dans un bouton désactivé.
Tests : `studio-store.test.mjs`, `studio-domain.test.mjs`, `studio-integration.test.mjs`.

## Dossier C — job vers candidate

**Question :** pourquoi un processus terminé n'active-t-il pas automatiquement son résultat ?

| Symbole | Responsabilité |
| --- | --- |
| `queueRequest` | créer un job lié à une demande et une base |
| `claimJob` | réserver un job à un worker |
| `createAgentRunner` | construire le prompt, lancer et recueillir un résultat borné |
| `finishJob` | valider la completion et créer la candidate |
| `runProjectQuality` | rattacher les contrôles à la candidate |
| `continueVerifiedRevision` | revérifier les gates avant activation |

Effets : événements, job, manifestes de révision, résultats de contrôles et éventuellement révision
active. Tests : `studio-runner.test.mjs`, `studio-quality.test.mjs`,
`studio-integration-safety.test.mjs`.

## Dossier D — édition et réponse tardive

**Question :** comment le Studio évite-t-il d'adopter un brouillon vérifié sur une ancienne base ?

Commencer par `createEditor` dans `editor.mjs`. Suivre la création du brouillon, la fusion des
changements, la vérification et les comparaisons de version. Lire ensuite le hook React qui appelle
les routes d'édition. Rechercher les cas « base a changé », « brouillon a changé » et « vérification
en cours ».

Invariants : saisie conservée lors d'un conflit, aucun résultat tardif adopté comme actuel, aucun
chemin hors workspace et aucune activation avant les choix réservés. Tests : `studio-editor`,
`studio-editor-ui`, `studio-react-resolution`.

## Dossier E — snapshot d'intelligence

**Question :** qu'est-ce qui rend une analyse statique actuelle ou obsolète ?

1. `verifiedSources` choisit les fichiers de la révision.
2. `fingerprint` identifie le contenu analysé.
3. `immutableSnapshot` ou `draftSnapshot` produit l'entrée bornée.
4. les modules `ast`, `resolution`, `model` et `impact` construisent les vues ;
5. le cache de `createProjectIntelligence` reste lié à l'empreinte.

Ne pas déduire d'une arête statique qu'un appel se produit au runtime. Tests :
`studio-intelligence.test.mjs`, `studio-project-model-views.test.mjs`.

## Dossier F — un contrôle qualité

**Question :** comment un résultat devient-il une preuve liée à une révision ?

Lire `readProjectQuality`, puis `runProjectQuality`, `finishRun` et
`importExternalQualityResult`. Suivre `checkId`, `requestId`, la révision, les capacités disponibles,
la configuration du fournisseur et le journal. Vérifier les chemins distincts : local exécutable,
externe demandé, indisponible, réussi, échoué et périmé.

Tests : `studio-quality.test.mjs`, `studio-quality-requests.test.mjs`. Un test réussi ne doit jamais
être reformulé en certification générale.

## Dossier G — un appel MCP

**Question :** pourquoi connexion, permission et autorisation d'action restent-elles séparées ?

1. `createMcpManager` observe ou renouvelle une connexion.
2. `connector-guides` et `connector-interactions` préparent la configuration sans inventer une
   connexion active.
3. `mcp-selection` choisit les connexions utilisables par la mission.
4. `createMcpBroker` fige outils, versions et empreintes.
5. `mcp-policy` calcule `allow`, `ask` ou `deny`.
6. le Control Plane admet ou bloque la tentative selon le contexte courant.
7. `mcp-schema` valide les arguments ; `mcp-network` borne la destination.
8. `mcp-actions` journalise la demande et son résultat incertain ou terminal.

Tests : `studio-mcp-broker`, `studio-mcp-permissions`, `studio-mcp-network`,
`studio-mcp-storage`. Ne jamais relancer aveuglément une écriture après un résultat inconnu.

## Dossier H — décision du Control Plane

**Question :** comment un bouton visible est-il relié à une preuve, un risque et une action ?

Suivre l'ordre : `ControlPlane.tsx` → `useControl.ts` → `control-routes.mjs` →
`control-plane.mjs` → `control-sources.mjs` → `engine.ts` → `policy.ts` → `graph.ts` →
`store.mjs`. Refaire ensuite le chemin retour jusqu'au composant.

Les deux clés à distinguer sont :

- `version`, qui protège le registre Studio contre une écriture concurrente ;
- `snapshotKey`, qui protège le contexte exact de la décision de contrôle.

Tests : `control-plane.test.mjs`, `studio-control-plane.test.mjs`,
`studio-control-widget.test.mjs`.

## Fiche d'annotation personnelle

Pour tout autre fichier important, conserver cette structure :

```text
Question utilisateur :
Entrées :
Symbole propriétaire :
Appelants :
Consommateurs :
Effets durables :
Invariants :
Pannes attendues :
Test qui peut réellement échouer :
Limite de ce que le test démontre :
```
