# Appréciation de couverture métier — 21 septembre 2026

Tranche intégrée à `c6316f1`, compatibilité historique corrigée en `0adb804`, puis
chargement différé du validateur et artefacts UI vérifiés ensemble. Contrat :
[ADR 034](../../../ADR-034-reviewed-business-coverage.md) et
[contrat Studio](../../creation-experience/CONTRACT.md). Cette preuve complète la
[recette navigateur](BROWSER-VERIFICATION.md) ; elle ne remplace pas la
[recette native suspendue](NATIVE-INVENTORY.md).

## Nature et portée de la preuve

Le navigateur a réellement exécuté les assertions de la fixture de persistance. L’agent
pilote ensuite Studio via CUA pour apprécier leur pertinence. La provenance `source:user`
désigne la route locale de décision : **ce parcours n’est pas une intervention humaine**.
Aucun fournisseur n’est appelé pour cette appréciation. Les tests à reçus synthétiques
établissent séparément les invariants de projection et d’autorité ; ils ne sont pas des
exécutions navigateur.

Version examinée : `1ddd230a-c083-4870-8b9a-1fd6ce04596c`. Reçu navigateur réel :
`82a72d6c-8a03-4b99-944f-496fa17deeca`, déjà décrit dans la recette navigateur : sept
étapes, quatre assertions réussies, 1 833 ms, sauvegarde puis relecture après redémarrage.
L’appréciation réutilise ce reçu exact ; elle ne prétend pas avoir réexécuté les assertions.
Le critère `persistence` ne devient couvert qu’après une appréciation suffisante et actuelle,
liée aux scénarios sélectionnés, aux sources, au manifeste, aux critères et au reçu exacts.

## Parcours et conservation observés

Le relevé privé `evaluation-private/local-oss-v1/coverage-replay.json`, daté du
21 septembre à 13:53:13 UTC, conserve la confrontation avec l’état du produit :

- Première appréciation partielle `538f3d02-4f5d-420b-9295-ba4b073c3bdf`, ensuite remplacée.
- Appréciation suffisante `39b95359-d475-4f08-bbbb-3ff558112765`, ensuite remplacée.
- Appréciation suffisante `44bee58e-d328-461d-9ca4-593370cbbfac`, ensuite remplacée.
- Appréciation suffisante active `ca82014b-fa72-4b45-bb28-de0c13cf630f` ; couverture effective
  courante limitée au critère `persistence`.
- Trois jobs et trois reçus conservés ; version active inchangée et données applicatives
  intactes. Le contrôle d’exécution reste `stop`.

Les décisions restent dans l’historique, avec leur conclusion et leur statut. Le reçu
qualité n’est pas réécrit par l’appréciation. L’export/restauration conserve décisions et
reçus ; la copie n’emporte pas l’autorisation locale du navigateur. Son reçu est
`reevaluate` et sa couverture effective est absente. Cette observation ne vaut pas
réexécution réussie dans l’environnement restauré.

## Concurrence et maintien du formulaire dans Studio

Observations CUA rapportées par l’agent intégrateur qui a réalisé le parcours, distinctes
du relevé JSON : dans un premier onglet, critère `persistence`, scénario `durable-value`,
conclusion suffisante, portée et justification saisis. Dans un second onglet du même Studio,
un brouillon de demande explicitement réservé à la recette est enregistré, sans cliquer
sur Envoyer et sans appel fournisseur. La confirmation du premier onglet reçoit 409 : les
textes restent présents et le bouton de confirmation devient désactivé. « Actualiser
l’examen » ne crée aucune décision ; un second clic explicite enregistre `39b95359`.

Après correction du démontage du formulaire (`0c4b28c`), une troisième appréciation
(`44bee58e`) est enregistrée : confirmation affichée, formulaire et textes conservés, liste
actualisée avec les trois décisions. Le graphe montre l’appréciation partielle obsolète,
l’appréciation suffisante actuelle et le lien vers `persistence` ; l’agent reste arrêté.

Le formulaire a été inspecté à 390 × 844 : largeur visible et largeur de contenu égales
à 268 px, sans débordement horizontal constaté. Le message de résultat était présent mais
trop bas ; `e502ba9` le déplace près du formulaire. Une quatrième confirmation réelle
(`ca82014b`) a ensuite été observée sur le rendu à 390 × 844 : message visible immédiatement
sous le bouton, textes conservés, liste portée à quatre appréciations. La région de détail
mesure 308 px de largeur visible et de contenu, sans débordement. La taille du navigateur
a été rétablie après l’essai. Aucune capture sauvegardée n’est revendiquée ici.

## Vérifications automatisées déjà exécutées

Lecture des journaux privés sous `evaluation-private/local-oss-v1/logs/` ; aucun test
supplémentaire n’a été lancé pour rédiger ce document. Les suites suivantes se recouvrent
et leurs totaux ne doivent pas être additionnés.

| Journal | Résultat observé | Portée |
| --- | --- | --- |
| `coverage-connected-final.log` | 64/64 | Contrôle, admission examinée, API couverture, autorité, CAS et interface connectée |
| `coverage-unit-final.log` | 19/19 | Liaison exacte, fraîcheur, refus des assertions incomplètes et des reçus sans clôture confirmée |
| `coverage-full-tests.log` | 1 345/1 348 | Premier passage global, trois échecs liés au chargement immédiat d’Ajv dans les fixtures sans dépendances |
| `coverage-dependencies-final.log` | 41/41 | Correction ciblée du chargement d’Ajv, incluant les trois anciens échecs et les contrôles navigateur/couverture |
| `coverage-lint-final.log`, `coverage-format-final.log` | Réussis | Lint et format globaux au passage enregistré |
| `coverage-ui-build-final.log` | Réussi | Construction des artefacts UI |
| `coverage-full-final.log` | **1 351/1 351, build réussi** | Passage global après corrections Ajv et compatibilité des anciennes décisions |
| `coverage-lint-complete.log`, `coverage-format-complete.log` | Réussis | Lint et format globaux du code final de cette tranche |

La régression du reçu affiché réussi sans clôture confirmée a été observée rouge
(`coverage-completion-red.log`, 18/19), puis verte dans la suite unitaire. Le code exige
une date de fin valide et cohérente avec le début avant d’accepter la couverture.

Les huit tests d’intégration ajoutés dans `61bcf48` ont passé contre les modules de la
tranche : lien `covers` et nœud d’appréciation ; remplacement partiel/négatif ; export et
restauration ; nouveau reçu sans héritage ; critère modifié sans périmer la preuve technique
indépendante ; mutation du reçu entre lecture et confirmation ; refus d’une appréciation
forgée par le worker. Ils vérifient également l’absence de changement des jobs, de leur
contrôle historique, de l’active, de la délégation, du reçu et du ledger.

Les anciennes décisions à sujet libre commençant par « Couverture métier » restent lisibles,
sans réécriture. Les nouvelles livraisons agent ne peuvent pas utiliser ce préfixe pour
remplacer une appréciation. Deux chargements historiques ont d’abord échoué, puis passé
après déplacement de la restriction à la frontière de livraison (`0adb804`). Les trois
régressions ajoutées sont incluses dans le passage global final.

## Limites et paquet

Une appréciation suffisante exprime une pertinence dans le périmètre saisi. Elle ne prouve
ni exhaustivité métier, ni absence d’effets inconnus, ni sécurité universelle. Les critères
déclarés dans le manifeste restent distincts des critères effectivement couverts. Les
assertions absentes, échouées, périmées ou non locales ne sont pas promues en preuve.
Les décisions `job.control` historiques restent immuables ; seul le contrôle courant est
recalculé. Les conséquences inconnues restent à examiner même lorsqu’un critère est couvert.

Ce parcours ne lève aucune permission, ne remet aucun budget à zéro, ne réveille pas le
runner et n’adopte aucune version. La campagne native inventaire reste suspendue ; cette
recette CUA ne démontre ni autonomie native complète ni intervention humaine réelle.

Le passage global final remplace le résultat initial pour le code corrigé ; il n’efface pas
la régression observée. Le code final et ses artefacts sont enregistrés en `a37be56`.
L’archive de 1 507 fichiers inclut les modules de couverture, le widget compilé et les
contrats ; les fichiers privés de recette sont exclus. Son installation réelle et les essais
React strict, Studio, données, reprise, export/restauration et CLI ont réussi
(`coverage-package-smoke.log`). Les dernières notes documentaires rejoignent ensuite
l’archive finale, avec résultat et empreintes consignés hors paquet dans
`coverage-package-final-smoke.log` et `coverage-package-final-manifest.json`.
Voir [le point de continuation](../REPRISE.md). Aucune CI distante ni publication n’est revendiquée.
