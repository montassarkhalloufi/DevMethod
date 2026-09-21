# Conséquences examinées et intervention locale — 21 septembre 2026

Contrat : [ADR 035](../../../ADR-035-reviewed-local-consequences.md), après la
[couverture métier examinée](BUSINESS-COVERAGE.md). Ce relevé couvre les commits de lecteur
et d’interface `745e758` à `f6cd8a9` et leur raccordement backend dans la même tranche.
La révision et les empreintes du paquet final sont consignées hors payload dans
`evaluation-private/local-oss-v1/intervention-package-final-manifest.json`.

## Parcours CUA et provenance

L’agent intégrateur a piloté Studio via CUA sur la fixture de persistance existante :
version `1ddd230a-c083-4870-8b9a-1fd6ce04596c`, base et candidate exactes présentées dans
le dialogue. Trois jobs de fixture, aucun appel fournisseur. Le reçu navigateur réel
`82a72d6c-8a03-4b99-944f-496fa17deeca` reste celui de la
[recette navigateur](BROWSER-VERIFICATION.md) ; ouvrir cet examen ne le réexécute pas.
La provenance `source:user` désigne la route locale : **les clics CUA sont ceux de l’agent,
pas une intervention humaine**.

Première décision `58fbf755-0402-46ba-bd15-d77f97ee761d` : conséquences laissées inconnues,
résolution `keep-stopped`. Puis un examen est préparé avec données et contrats concernés
(`affected`) et résolution `accept-local`, périmètre et justification explicites.

Dans un second onglet, un brouillon de demande est enregistré avec Enregistrer, sans
cliquer sur Envoyer. La confirmation du premier onglet reçoit 409 : les champs sont
conservés et la confirmation désactivée. Actualiser ne produit aucune écriture ; un
nouveau clic explicite enregistre `e4f37eaa-1b40-4fe2-8a6b-e2dbf1e980ce`. L’ancienne
résolution reste dans l’historique, avec statut remplacé ; la seconde devient active.
Ces observations de concurrence sont rapportées par l’agent intégrateur ayant effectué
le parcours, distinctes du relevé disque ci-dessous.

Un défaut de présentation des libellés en ligne a été repéré sur bureau, corrigé en
`f6cd8a9` et réexaminé sur bureau puis à 390 × 844. Les cinq champs sont empilés et mesurent
302 pixels ; le dialogue mesure 350 pixels sans débordement horizontal. Identités et
historique sont repliés à l’ouverture. Deux confirmations supplémentaires, dont celle
sur mobile `9142d4cd-1137-4854-92c7-8cb14add98b6`, portent l’historique à quatre avis.
Le message de réussite apparaît près du bouton et les saisies restent présentes.
Le viewport temporaire a été réinitialisé. Captures inspectées via CUA ; aucune image
enregistrée sur disque n’est revendiquée ici.

## Résultat observé et invariants

Le relevé privé `evaluation-private/local-oss-v1/intervention-replay.json`, daté du
21 septembre à 14:29:43 UTC après la confirmation mobile, confronte les quatre décisions
avec l’état réel (`intervention-replay-final.log`) :

- Trois jobs et trois reçus ; jobs, version active, données et ledger inchangés.
- Une modification de `index.html`, avec indices textuels positifs de persistance et
  de contrat aux lignes 4 à 6. Les données sont disponibles, version 1, non vides ;
  aucune clé ni valeur métier n’apparaît dans le résumé d’examen.
- Deux facteurs de risque restent présents : `persistent-data` et `contract-changed`.
  Les deux inconnues factuelles `persistentData` et `contractChanged` sont conservées ;
  `reviewedUnknowns` indique séparément que ces deux inconnues ont été appréciées.
- Le contrôle réel reste `stop`, motif `agent-unavailable`. Une sonde pure de la politique,
  avec disponibilité simulée, retourne l’opération proposée `activate` : **aucune activation
  ni exécution du runner n’a été effectuée par cette sonde**.
- Export/restauration : historique et observations conservés, acceptation non effective
  dans la copie et avis à réévaluer. Le workspace et les configurations locales font partie
  du contexte ; un export ne transporte pas une permission de poursuivre.

Les observations historiques sont un snapshot borné : état résumé des données, fichiers
changés, indices avec chemins/lignes, limites, inconnues, facteurs et preuves examinées
avec statut, fraîcheur, confiance, provenance et empreinte. Elles restent distinctes du
contrôle courant recalculé. Le contrôle historique du job n’est pas réécrit.
Le serveur capture ces observations depuis le contrôle reconstitué au moment de la
confirmation, après relecture et contrôle du contexte ; le client ne fournit pas ce
snapshot. Sa validation borne les collections et exclut les valeurs applicatives.
L’historique conserve ainsi ce qui a été examiné, même si les preuves courantes évoluent.

## Régressions et vérifications enregistrées

Journaux privés sous `evaluation-private/local-oss-v1/logs/`. Les suites se recouvrent :
leurs totaux ne doivent pas être additionnés.

| Journal | Résultat observé | Portée |
| --- | --- | --- |
| `intervention-proposal-behavior-red.log` | 6/7 | Une proposition visuelle déléguée déjà ouverte pouvait remplacer une résolution d’arrêt réservée |
| `intervention-proposal-green.log` | 7/7 | Garde centrale lors de l’ajout des décisions, y compris le chemin des propositions |
| `intervention-history-red.log` | 7/8 | Snapshot historique insuffisant : observations examinées non conservées |
| `intervention-connected-final.log` | 73/73 | Contrôle, fraîcheur, contexte, API, invariants et historique après corrections |
| `intervention-full-tests.log` | 1 389/1 394 | Premier passage global, cinq échecs à traiter avant clôture |
| `intervention-fixtures-green.log` | 33/33 | Adaptations ciblées des fixtures après ce passage global |
| `intervention-full-final.log` | Build réussi et 1 395/1 395 | Passage global final, zéro échec, annulation ou test ignoré |
| `intervention-lint-final.log`, `intervention-format-final.log` | Réussis | Premier passage, antérieur au dernier ajustement visuel |
| `intervention-format-complete.log` | Réussi | Format après correction des fixtures et du formulaire |
| `intervention-lint-complete.log` | Échec de complexité 16 > 15 | Dernier ajustement du retour de chargement dans le formulaire |
| `intervention-lint-complete-final.log`, `intervention-ui-complete.log` | Lint réussi et 13/13 | Retour de chargement séparé en `6ad244a`, sans changement de comportement |
| `intervention-format-complete-final.log`, `intervention-docs-complete.log` | Réussis | Format global et liens documentaires après les derniers ajustements |
| `intervention-package-smoke.log` | Réussi | Archive réellement installée, React strict, Studio, redémarrage, export/restauration et CLI sur trois profils |

Les cinq échecs globaux concernent des fixtures dépourvues de `decisions`, une comparaison
ancienne du contrôle incluant désormais l’empreinte de contexte qui évolue avec la
configuration, et une assertion DOM attendant zéro bouton alors qu’un bouton d’examen
légitime existe. Les adaptations ciblées ne doivent pas affaiblir le refus des sources
altérées, les contrôles de fraîcheur ni le rendu des diagnostics comme texte.
Le passage global suivant (`intervention-full-final.log`) exécute la construction
TypeScript, les bundles et notices Studio, puis réussit les 1 395 tests. Le premier
passage rouge reste conservé comme trace de diagnostic.
La dernière décomposition du message de chargement est couverte par les 13 tests ciblés ;
elle ne modifie ni contrat, rendu ni parcours. La suite globale inchangée n’a pas été relancée
pour cette extraction. Le lint global final et les liens documentaires réussissent.

Le correctif d’autorité est placé dans `appendDecisions`, avant toute supersession :
les sujets réservés « Conséquences locales » et « Couverture métier » exigent leur
examen structuré. Une proposition visuelle déléguée déjà ouverte ne peut donc plus
remplacer une résolution d’arrêt par une décision libre portant le même sujet.
La régression comportementale rouge puis verte exerce ce chemin, au-delà du seul
refus d’un payload worker direct.

Le lecteur de conséquences vérifie les sources de la candidate et de sa base, résume les
données avec une borne de 8 Mio et ne produit que des indices textuels positifs. La collecte
s’arrête au 201e indice distinct : 200 entrées maximum et une anomalie explicite de contexte
incomplet, incompatible avec une acceptation. L’absence d’indice n’est jamais une preuve
négative. Les tests du lecteur couvrent notamment sources/base altérées, données illisibles,
changement de workspace, de configuration, de cadrage et de preuves, sans mutation locale.

## Limites et clôture à compléter

L’acceptation locale exige deux appréciations connues et refuse « non concerné » contre
un indice positif ou des données persistantes non vides. Elle ne transforme pas une
appréciation en fait vérifié : seules les conséquences examinées dans cette portée peuvent
cesser de bloquer. Admission, critères manquants, erreurs runtime, permissions outils,
consommation inconnue, interruption et budget clos restent des verrous indépendants.
Un arrêt explicite demeure applicable à cette candidate, même après péremption du contexte,
jusqu’à son remplacement explicite ; il ne s’étend pas à une autre candidate.

L’écriture n’adopte aucune version, ne réveille aucun fournisseur et ne remet aucun budget
à zéro. Le raccord du runner pour exécuter une recommandation `continue/activate` reste
à terminer séparément. La campagne native inventaire demeure suspendue ; cette recette
ne démontre ni autonomie native complète ni validation humaine réelle.

Revue indépendante ciblée du snapshot historique, de sa fraîcheur et de la garde avant
supersession : aucun défaut concret résiduel identifié, inspection sans nouvelle exécution
globale. Aucun succès de CI distante, publication ou intégration finale n’est déduit des
résultats locaux ci-dessus.

L’archive locale inspectée contient 1 514 fichiers et les cinq modules du nouvel examen,
sans `evaluation-private`, dépendances installées, fichier `.env` ou métadonnées Git.
L’inventaire réel est conservé dans `intervention-package-inventory.json`. Les métadonnées
npm masquent les UUID de six versions d’exemples contrôlés (36 chemins) ; les noms réels
proviennent de l’inventaire tar. Installation et essais de cette archive réussis. Les
dernières notes seules sont ensuite incluses dans le paquet final ; ses essais et empreintes
sont consignés dans `intervention-package-final-smoke.log` et le manifeste privé mentionné
en tête, sans modifier à nouveau son payload. Aucune invocation fournisseur ni publication.
