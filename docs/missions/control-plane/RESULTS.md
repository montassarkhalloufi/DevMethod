# Control Plane — résultat et preuves

Mission du 25 septembre 2026, depuis `f6d6b4b3a89066b9baa8d1e18acc7dbb10d8be0c`
sur `codex/studio-0.6-integration`, version conservée `0.6.0-beta.1`.
La révision de livraison est le commit contenant ce rapport ; son SHA exact, le résultat de CI
et l’intégration sont consignés dans la [PR 41](https://github.com/montassarkhalloufi/DevMethod/pull/41).
Ce rapport décrit les observations locales ; il ne présume ni la CI distante ni une fusion.

## Livraison

Le [domaine pur](../../../src/control-plane/) calcule graphe, risque, attention et autonomie.
L’[ADR 027](../../ADR-027-control-plane.md) décrit le stockage atomique existant, les adaptateurs
Studio et l’admission effective des jobs, de l’application d’une version et des appels MCP.
Les six vues React lisent ces états ; les actions utilisent les routes et journaux réels.
Une réussite déclarée, une preuve périmée ou un audit absent ne permettent pas Auto-Continue.
Les permissions existantes restent nécessaires, y compris après un accord d’attention humaine.

## Scénarios démontrés

| Scénario demandé | Preuve exécutée | Résultat observé |
| --- | --- | --- |
| 1. Risque faible, preuves suffisantes | `control-plane.test.mjs`, intégration de continuation | Auto-Continue ; application uniquement avec délégation, base et plan valides |
| 2. Risque moyen / preuve périmée | Domaine, graphe navigateur sur ancienne version | Verify ; statut À renouveler, révision observée conservée |
| 3. Permissions / risque élevé | Domaine, attention réservée, tests MCP HTTP | Human Decision ; accord MCP exact distinct et contrôlé avant transmission |
| 4. Critique / non-convergence | Domaine, intégration runner et MCP | Bounded Stop persistant ; prise de travail et transmission refusées |
| 5. Nouvelle révision | Domaine et contrôles locaux réels | Seules les dépendances touchées sont invalidées ; pas d’adoption automatique |
| 6. Renouvellement | Domaine, API et bouton navigateur | Nouveau run réel, preuve actualisée, recalcul ; les autres manques subsistent |
| 7. Décision humaine | Domaine, API CAS et parcours navigateur | Raison persistante, résolution distincte de lecture, rejeu déterministe |
| 8. Redémarrage | Test intégration et arrêt / relance de la copie locale | Graphe, attention et intervention restaurés |
| 9. Source indisponible | Analyseur absent, routes, serveur arrêté dans le navigateur | Indisponibilité explicite ; état précédent signalé périmé, actions bloquées |
| 10. Mode demandé | Domaine, serveur et boutons UI | Recalcul réel, sans assimiler Autonome à Auto-Continue |

Les attestations de navigateur fournies par le test de continuation sont des **fixtures de contrat**
explicitement simulées. Elles vérifient l’adaptateur et la continuation, sans valider visuellement
un produit. Les contrôles locaux syntaxe/imports/secrets sont réellement exécutés.

## Vérification navigateur

Copie locale jetable de **Les Ateliers**, six versions, 51 fichiers de projet, 77 nœuds après
l’intervention et les observations de services. Projet fictif ; aucune donnée utilisateur importée.
Observation desktop à **1586 × 992**, même taille que les trois références approuvées.
La démonstration conserve trois preuves requises manquantes : métier, bout en bout, comparaison
visuelle. L’UI ne les déclare pas réussies à partir des tests du Studio.

| Capture réelle | Observation |
| --- | --- |
| [Vue d’ensemble](evidence/browser-overview-desktop.jpg) | Mode Autonome, Verify, 3/6 preuves ; navigation des cartes et filtres |
| [Graphe synthétique](evidence/browser-graph-desktop.jpg) | Version, sélection, inspecteur, source et aperçu réellement concernés |
| [Attention](evidence/browser-attention-desktop.jpg) | Décision réservée avant son examen ; lire ne la résout pas ; trois preuves à renouveler |
| [Preuve périmée](evidence/browser-proof-stale.jpg) | Ancienne version, révision observée différente, renouvellement réel ensuite |
| [Erreur de lecture](evidence/browser-error-stale.jpg) | Serveur arrêté ; dernier rapport affiché comme périmé ; reprise après redémarrage |
| [Mobile](evidence/browser-overview-mobile.jpg) et [historique mobile](evidence/browser-history-mobile.jpg) | 390 × 844, navigation accessible sans débordement horizontal du document |
| [Clavier et hauteur réduite](evidence/browser-keyboard-short.jpg) | 1280 × 650, focus visible et action atteignable au clavier |
| [Graphe détaillé : critères](evidence/browser-graph-detailed-criteria.jpg) | Nœuds espacés, noms complets et relations réelles dans les marges |
| [Graphe détaillé : preuves](evidence/browser-graph-detailed-proofs.jpg) | Passage d’une preuve au risque et retour, recherche et familles |

Chargement, échec et reprise sont aussi exercés dans le navigateur DOM automatisé ; les captures
ci-dessus proviennent du vrai navigateur. Les parcours exercés comprennent le filtre de version,
le filtre de type, les invalidations, les preuves manquantes, le zoom, la sélection au clavier,
l’ouverture dans l’aperçu, le lancement d’un contrôle, l’examen motivé d’une décision et la sonde
réelle des services locaux. Les contrôles ne montrent leur résultat qu’après réception du journal.

Écarts motivés aux maquettes : valeurs et textes issus des sources réelles, navigation mobile
compacte et défilement lorsque les libellés sont longs. Après le retour utilisateur sur le graphe
dense, la vue complète utilise neuf familles, des nœuds ronds numérotés et des lignes dans les marges.
Elle garde tous les nœuds ; les liens dessinés concernent la sélection, et l’inspecteur permet de
suivre chaque relation entrante ou sortante et de revenir en arrière. Les familles sont un ordre
de lecture, pas de nouvelles assertions causales. Le zoom détaillé reste au minimum à 80 % pour
préserver les caractères ; le déplacement utilise le défilement natif. La synthèse conserve son
zoom et son déplacement libres. La préférence finale de l’utilisateur pour les nœuds ronds
est retenue dans la vue détaillée aussi. Aucune image de référence n’est utilisée comme interface.

## Contrôles locaux

- `npm test` : **1 089 tests réussis**, zéro échec, zéro ignoré ; inclut compilation stricte et UI.
- `npm run lint`, `npm run format:check`, `npm run check:docs`, `npm run quality:report` : réussis.
- `git diff --check` : réussi.
- `npm pack --dry-run --cache /private/tmp/devmethod-control-npm-cache` : inspection de packaging,
  sans publication ; cache temporaire utilisé car le cache npm personnel n’était pas accessible.
- Tests de disposition : fixture de 90 nœuds, conservation des libellés, absence de recouvrement,
  marges de routage, direction des relations et absence de liens inventés.
- Tests UI : sélection, retour, filtre vide, attente du résultat réel, panne et reprise.

La mesure [API locale](evidence/api-observation.json) porte sur 12 lectures, 77 nœuds et 14
instantanés : première lecture 167,92 ms, médiane suivante 149,19 ms, maximum 319,07 ms.
Le rapport complet représente environ 2,32 Mo, historique inclus. Ce n’est ni un test de charge,
ni une mesure de chargement du navigateur. Les limites du registre sont explicites : 250
instantanés / 2 000 transitions / 1 000 interventions, sous la limite globale de 16 Mio.

## Limites et périmètre

Les analyses Architecture/Flux/Impact restent des inférences statiques. Les attestations externes
ne prouvent que le périmètre annoncé par leur source. L’observation des services est une sonde
locale avec expiration, pas un audit métier, sécurité dynamique ou disponibilité de production.
Les marqueurs de secrets ne remplacent pas un audit de sécurité complet. Aucune calibration
apprise, publication npm, création de tag ou release n’est réalisée dans cette mission.

Les corrections Windows ciblent les chemins du journal de progression et le refus des liens
symboliques, ainsi qu’une fixture d’import indépendante des séparateurs. Leur résultat distant
est à lire dans la CI du commit exact, sans extrapoler depuis macOS.

Les fichiers personnels et documents de prépublication restent hors du commit. Les trois
références approuvées sont versionnées séparément des captures réelles. Les deux autres images
préexistantes du dossier de mission restent préservées et exclues.
