# Contrats et invariants à préserver

Cette page est la checklist conceptuelle du mainteneur. Un invariant est une propriété que toutes
les routes et interfaces doivent respecter, pas seulement un cas heureux testé par une vue.

## 1. Mission et autorité

Le contrat [`Mission`](../../src/mission.ts) borne le résultat, le périmètre, les exclusions, les
incertitudes, les critères, les sources et les conditions d'arrêt.

Invariants :

- une mission possède au moins une source, un élément de périmètre, un critère et une condition
  d'arrêt ;
- les chemins sont relatifs, sûrs et ne ciblent pas un secret ;
- une mission active ou bloquée possède une prochaine action ; une mission terminée n'en possède
  aucune ;
- une dépendance bloquée ou une contradiction non résolue bloque la mission ;
- un hash de source établit l'identité des octets, pas leur vérité ;
- un contexte capturé n'accorde aucune autorisation d'exécution.

## 2. Preuve et fraîcheur

Une preuve n'est favorable au Control Plane que si
[`evidenceSupports`](../../src/control-plane/policy.ts) observe simultanément :

```text
status = observed
freshness = current
outcome = passed
```

Tout autre triplet reste insuffisant. `declared/passed`, `observed/stale/passed` et
`observed/current/running` ne sont pas des variantes presque valides.

Les dépendances donnent la portée d'invalidation. Une nouvelle révision ne doit pas effacer
l'historique ; elle doit rendre obsolètes les preuves dépendant des entrées modifiées.

## 3. Risque et autonomie

[`assessRisk`](../../src/control-plane/policy.ts) agrège des signaux et retient le niveau actif le
plus élevé. La politique v1 ne calcule ni moyenne, ni score de confiance, ni probabilité.

Ordre de priorité :

1. arrêt persistant ou risque critique ;
2. risque élevé, action irréversible ou responsabilité réservée ;
3. risque moyen, source indisponible ou preuve insuffisante ;
4. absence de signal actif dans le périmètre observé.

Une acceptation humaine peut neutraliser seulement un signal déclaré `humanResolvable` dans le
`contextKey` exact. Elle ne neutralise pas automatiquement une source indisponible ou une preuve
manquante.

## 4. État Studio

Le propriétaire est [`store.mjs`](../../scripts/studio/store.mjs).

- `.devmethod/studio.json` est limité à 16 Mio ;
- l'écriture passe par un fichier temporaire en mode exclusif, `fsync`, puis renommage ;
- les liens symboliques et fichiers spéciaux sont refusés sur le chemin du stockage ;
- `commit(expectedVersion)` applique une concurrence optimiste ;
- le mutateur doit être synchrone ;
- les collections historiques sont append-only selon leurs règles ;
- une nouvelle demande commence en état `queued` ;
- les transitions terminales d'un job ne sont pas réécrites ;
- un verrou lie une instance de serveur au workspace.

Ne contournez pas `commit` par une écriture directe de `studio.json`. Vous supprimeriez validation,
conflit de version, atomicité et invariants de transition en une fois.

## 5. Frontière personne / agent

Dans [`server.mjs`](../../scripts/studio/server.mjs), le token worker n'autorise pas les accords
attribués à la personne. À l'inverse, les opérations worker réclament ce token.

Exemples d'actions humaines réservées : projet, choix de design, approbation du plan, activation
d'une révision. Des routes de délégation distinctes existent lorsque le contrat le permet ; elles
enregistrent l'acteur au lieu de faire passer un agent pour une personne.

## 6. Frontière navigateur / serveur

- le serveur écoute sur `127.0.0.1` ;
- les mutations navigateur vérifient l'origine ;
- les corps doivent être JSON et bornés ;
- les routes du Control Plane refusent les clés supplémentaires ;
- les lectures sensibles répondent avec `Cache-Control: no-store` ;
- la CSP interdit les objets, les ancêtres de frame et les connexions non prévues ;
- une route inconnue échoue explicitement.

Le loopback réduit l'exposition réseau, mais ne remplace ni l'authentification du worker, ni la
validation d'origine, ni la validation métier.

## 7. UI et état asynchrone

Le hook [`useControl`](../../studio-ui/src/features/control/useControl.ts) protège contre les
réponses tardives avec un compteur de génération et des `AbortController`. Une mutation active
empêche un second envoi concurrent. Les erreurs utilisent `role=alert`, les progressions
`role=status`, et un rapport ancien est présenté comme non confirmé.

Un composant ne doit pas recalculer le risque, fabriquer un succès ou modifier directement un
snapshot. La vue présente le rapport serveur et déclenche des intentions typées.

## 8. Artefacts générés

- `src/` possède les sources TypeScript du package ;
- `dist/` est une sortie compilée distribuée ;
- `studio-ui/src/` possède les îlots React ;
- `dist/studio-ui/` est leur bundle ;
- les fichiers de preuve historiques ne doivent pas être remplacés par une nouvelle exécution.

Une modification de source sans reconstruction peut laisser GitHub ou le package npm exécuter un
autre comportement que celui relu.

## Matrice « changement → invariants à revalider »

| Changement | Invariants prioritaires | Tests de départ |
| --- | --- | --- |
| champ de mission | sûreté des chemins, état, unicité | `mission`, `checkpoint`, `closure-loop` |
| transition de job | append-only, statut terminal, version | `studio-domain`, `studio-runner*` |
| route HTTP | origine, rôle, taille, forme, erreur | test HTTP du domaine concerné |
| règle de risque | priorité, résolvabilité, preuve favorable | `control-plane` |
| source du graphe | provenance, dépendances, invalidation | `control-plane`, `studio-control-plane` |
| action MCP | permission, admission, schéma, journal | `studio-mcp*` |
| widget React | état ancien, focus, responsive, erreur | test widget puis navigateur |
| release | source et artefact généré alignés | build, package smoke, archive exacte |
