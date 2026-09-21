# Application d’une candidate sous contrôle courant

21 septembre 2026. Preuve locale de la tranche définie par
[l’ADR 036](../../../ADR-036-controlled-candidate-activation.md), après les examens de
[couverture métier](BUSINESS-COVERAGE.md) et de conséquences. Cette preuve ne reprend pas
[la campagne native suspendue](NATIVE-INVENTORY.md) et ne certifie pas une intervention humaine.

## Comportement exercé

Le runner conserve son verdict historique, puis consomme `continue/activate` par une
transition dédiée. Le service relit le contrôle courant avant le commit : sources,
base, preuves, conséquences, délégation, outils et état d’exécution. L’application porte
une provenance moteur et ne se présente pas comme une adoption manuelle. Une candidate
déjà conservée dispose d’une action locale distincte, sans réveil du fournisseur.

Les tests utilisent une admission réellement exécutée, le vrai journal qualité et les
API ordinaires d’examen. L’exécuteur fournisseur et l’adaptateur navigateur sont fictifs ;
`readProjectControl` n’est pas remplacé. Les appréciations créées par le harnais ne sont
pas des validations humaines. Sources principales :

- `tests/studio-runner-activation.test.mjs` : consommation unique, relecture après verdict,
  maintien de la file et du ledger, reprise après écartement explicite.
- `tests/studio-controlled-activation.test.mjs` : service, domaine, transport HTTP,
  provenance, fraîcheur, export/restauration et refus des autorités forgées.

## Régressions observées et résultats ciblés

Le premier passage des six tests runner a produit cinq échecs utiles : une véritable
recommandation favorable n’activait pas la candidate ; après révocation de délégation,
modification d’un reçu, arrêt explicite ou changement de base, l’ancien `continue`
laissait partir la demande suivante, soit deux appels fictifs au lieu d’un. Le cas de
consommation inconnue était déjà correctement arrêté. Tests livrés en `d2f817d`, intégrés
en `40fc611`, puis six cas verts avec le raccord produit.

Le blocage corrigé révélait une autre impasse : une candidate `continue/activate` non
appliquée ne pouvait pas être écartée. Le nouveau test a échoué avec « Aucun candidat
arrêté à écarter », puis est passé après correction du prédicat. Sept tests runner verts :
`continue/correct` reste exclu, l’écartement seul ne lance rien, le deuxième appel fictif
ne survient qu’après l’action explicite suivie du réveil autorisé. La demande conserve
sa base ; les admissions et jetons augmentent normalement, sans réinitialisation du ledger.
Test `e577228`, intégré en `4a45058`.

Les dix-sept cas d’application couvrent notamment la relecture de données/base/délégation/
sources, travail concurrent, limites et consommation inconnue, refus worker/origine/Host,
forme stricte, rejeu CAS, application déjà effectuée sans nouvelle écriture, conservation
historique et restauration sans transfert d’autorité. Le test d’écartement interdit aussi
l’application d’une candidate explicitement abandonnée (`65ceadd`).

Le journal privé `evaluation-private/local-oss-v1/logs/controlled-activation-connected-final.log`
atteste **49 tests connectés réussis**, zéro échec. `controlled-activation-full.log` atteste
le build et **1 423 tests globaux réussis**, zéro échec. Les journaux `controlled-activation-lint.log`
et `controlled-activation-format.log` consignent les commandes globales ; le second conclut
explicitement que tous les fichiers contrôlés respectent Prettier.

Ces résultats précèdent deux corrections : bouton d’application masqué par le tableau qualité
et possibilité de superséder une décision d’écartement via une autre voie de décision.
La frontière d’ajout des décisions refuse désormais ce contournement, avec les régressions
`8262b30` intégrées ; une vérification indépendante rapporte 19 tests ciblés réussis.
Le bouton masqué est corrigé par `80a9ded` et un seul bouton est
observé dans la recette ci-dessous. Les 1 423 tests précédents ne certifient pas ces versions
corrigées ; le passage global final est consigné ci-dessous.

## Fixture navigateur et limites de recette

La fixture locale possède le reçu navigateur réel
`ef7118b8-8f45-4c02-bc14-10b0f1c18397`, pour la candidate
`1ddd230a-c083-4870-8b9a-1fd6ce04596c` : sept étapes et quatre assertions réussies.
Ce reçu établit l’exécution du scénario déclaré ; il reste distinct de la recette d’application.
La sonde de disponibilité Codex est fictive et toute exécution fournisseur est interdite
dans cette fixture. Les journaux privés `controlled-activation-browser-fixture*.log`
identifient cet environnement ; aucune capacité native réelle supplémentaire n’en découle.

## Application réellement exercée

La recette CUA a exposé le bouton masqué par le widget qualité, puis vérifié sa présence
unique après correction. Avec deux onglets, une modification concurrente du brouillon
provoque un refus 409 et conserve la saisie locale. Un second clic depuis la vue mobile
applique exactement la candidate `1ddd230a-c083-4870-8b9a-1fd6ce04596c` ; le message précise
qu’aucun fournisseur n’a été appelé et le bouton disparaît. La décision est attribuée au
« Moteur Studio », `source:agent`, `trigger:local`, datée du 21 septembre 2026 à
14:56:33.268 UTC. Ces manipulations automatisées ne sont pas une intervention humaine.

Un débordement mobile a ensuite été détecté. Après correction de la grille parente en
`88ce2b7`, le détail d’application, ses textes et ses empreintes sont entièrement lisibles
sur la capture inspectée à 390 × 844. La règle inline de `bb2a267`, devenue redondante,
a été retirée. La vue bureau à 1 280 pixels a été inspectée avec une répartition en deux
colonnes. Les tentatives de mesure DOM après correction ont expiré côté outil : cette
preuve est une inspection visuelle des captures, pas une mesure automatisée de largeur.

## État conservé et restauration réellement vérifiés

Le rapport privé `evaluation-private/local-oss-v1/controlled-activation-replay.json`, produit
par `verify-controlled-activation.mjs` et vérifié, constate une seule application persistée :
décision `c4673f0e-0903-43e5-9355-3a979828b1a6` au même instant que ci-dessus. Trois jobs,
trois révisions, sept checks et quatre reçus restent conservés ; contrôles historiques,
données et ledger sont inchangés. Le journal de la sonde fictive ne contient que
`--version` et `login status` : zéro commande fournisseur. La comparaison des reçus utilise
le reçu de préparation capturé séparément et ceux de la fixture source ; le snapshot
`before.json` ne comportait pas leurs empreintes. Le disque atteste l’application unique ;
le refus 409 et le second clic sont des observations de l’opérateur CUA.

L’export de 113 152 octets a été réellement restauré dans une copie distincte. L’état,
la décision d’application, les reçus et les données sont conservés. Les réglages agent
et l’autorisation navigateur ne sont pas transférés. Dans la copie, les preuves navigateur
sont à réévaluer ou obsolètes, aucun critère n’en reçoit une couverture effective et
l’acceptation des conséquences ne contribue plus ; le contrôle renvoie
`stop/agent-unavailable`. Aucun serveur restauré, navigateur ou fournisseur n’a été démarré.
La vérification n’a pas modifié le projet original.

## Validation finale du code et traçabilité du paquet

Après les corrections, `controlled-activation-full-complete.log` atteste le build et
**1 426 tests réussis sur 1 426**, zéro échec, avec sortie 0. Les commandes globales
ESLint et Prettier se terminent également avec sortie 0 ; journaux
`controlled-activation-lint-complete.log` et `controlled-activation-format-complete.log`.
Le serveur de fixture a été arrêté proprement avec sortie 0, l’onglet CUA fermé et le
viewport remis à sa configuration normale.

La vérification de l’archive est distincte de ces tests. La révision, les empreintes,
l’inspection des fichiers et le résultat d’installation/smoke sont consignés hors du
contenu distribué dans `controlled-activation-package-final-manifest.json` et
`controlled-activation-package-final-smoke.log`. Une ancienne archive réussie ne certifie
pas le contenu de cette tranche ; le manifeste identifie les octets réellement essayés.

La validation humaine, la campagne native suspendue, le site/film et les gates d’intégration
finale restent distincts de ces vérifications locales.
