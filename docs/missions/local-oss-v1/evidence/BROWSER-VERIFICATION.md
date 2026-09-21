# Contrôle navigateur exécuté — 21 septembre 2026

Contrat : [ADR 033](../../../ADR-033-local-browser-verification.md),
[protocole utilisateur](../../../STUDIO-BROWSER-CHECKS.md). Cette recette est une fixture
construite par le harnais local, distincte de l’inventaire natif et de toute validation humaine.

## Parcours réellement exercé

Projet « Fixture contrôlée — persistance navigateur ». Dans Studio, via CUA : activation
explicite du pilote Chrome, puis lancement du contrôle depuis Vérifications. Sauvegarder
le réglage ne lance rien. Exécuteur installé : Playwright 1.63.0, Chrome 153.0.8010.48,
Node 24.18.0, macOS arm64. Nouveau processus et contexte ; données de recette initialement vides.

- Version correcte `46ebdccb-2409-4d02-8397-fbf51d827c9b` : reçu
  `9f7660cb-a227-42f7-84a1-178275a642a7`, 12:31:47 UTC, 1 912 ms. Sept étapes, quatre
  assertions réussies : saisie à nonce unique, sauvegarde, texte de confirmation,
  données persistées, redémarrage du serveur et nouveau contexte, valeur relue et données.
- Variante défectueuse `80dd3145-703b-47a6-9535-b1b157c1b011` : reçu
  `a4efa11c-1f14-4c0d-aba5-9cb0cd371532`, 12:32:33 UTC, 6 194 ms. La sauvegarde et
  le fichier de données sont corrects, mais le chargement ignore la valeur persistée.
  L’étape 6 `expectValue` échoue après redémarrage ; l’assertion suivante n’est pas exécutée.

Résultats et diagnostics lus dans l’interface et confrontés au journal disque. La donnée
sentinelle du projet et sa version 1 sont intactes : les scénarios ne lisent ni ne modifient
les données utilisateur. Réglage inspecté à 390 × 844, contrôles accessibles, largeur du
contenu égale à celle du bloc (338 px), puis viewport rétabli.

## Éditeur et adoption

Le même Studio a servi à essayer la tranche éditeur : modification d’un commentaire de
la version active, vérification, « Préparer et examiner ». Candidat créé
`1ddd230a-c083-4870-8b9a-1fd6ce04596c` sans activation. Fermer conserve l’ancienne active ;
rouvrir réutilise ce candidat sans nouveau job. Une raison identifiant le clic de l’agent
et l’absence de validation humaine est saisie avant confirmation. Décision
`5cdf48e5-4e78-46d3-8803-a4af76e45bfe`, candidat adopté, brouillon réconcilié vers cette
version avec zéro modification résiduelle. Trois jobs seulement : deux fixtures et
une édition manuelle. Aucun appel fournisseur.

## Conservation, vérification et limites

Une régression d’export a été reproduite : les reçus qualité détaillés étaient absents
après restauration. Le correctif conserve le journal validé dans l’archive ; le test passe
après correction. Les vrais reçus de cette fixture ont aussi été exportés/restaurés par
les fonctions du produit et confrontés octet par octet. La configuration locale du
navigateur n’est pas transportée : reprise désactivée et preuve à réévaluer sur ce nouvel
environnement. Aucun téléchargement par le navigateur n’est attesté ici.

La revue indépendante a conduit à inclure les réglages navigateur dans l’empreinte de
l’examen d’adoption et à éviter d’attribuer tous les critères du cadrage à un lancement
interrompu. La revue du pilote n’a pas confirmé d’autre défaut matériel. Tests du pilote
avec doubles explicitement identifiés : bornes, annulation, résultats tardifs, refus réseau,
mutation de sources et fermeture en échec. Ils ne remplacent pas les essais réels ci-dessus.

Le reçu atteste les assertions, pas leur exhaustivité métier. Les IDs de critères restent
déclaratifs ; aucun critère n’est automatiquement validé, aucune adoption ou correction
native n’est déclenchée. Les scénarios sont lancés explicitement depuis Vérifications ;
l’invocation automatique restait à raccorder à ce stade ; sa recette contrôlée figure
ci-dessous. Le
filtrage réseau est applicatif, sans confinement OS ni garantie contre un navigateur compromis.
L’intervention humaine, les outils utilisés par le vrai agent, le site et le film restent ouverts.

Journaux et relevé privés sous `evaluation-private/local-oss-v1/` : `browser-verifier-replay.json`,
`browser-connected.log`, `browser-corrections.log`, `browser-export-red.log` et suites globales.
Le premier passage global (1 260/1 263) conserve ses trois échecs de fixtures : synchronisation
d’un lancement simulé, sélecteur UI ambigu, délai MCP partagé avec le test des 201 outils.
Leurs corrections conservent les attentes et les délais produit.

Après corrections : build et **1 264 tests globaux réussis**, zéro échec/annulation/ignoré,
lint global réussi. Logs `browser-full-tests-final.log` et `browser-lint-final.log`.
Format global et liens documentaires réussis. Dernier ajustement de présentation : une
version sans frontend reste « Non applicable » ; les onze tests qualité concernés passent
ensuite (`browser-applicability.log`). Archive npm inspectée : aucun fichier privé de
recette, six modules navigateur présents. Installation et smoke de l’archive réussis
(`browser-package-smoke.log`) : Studio/React/édition/persistance/export et CLI, sans
fournisseur ni exécution native hôte. Ces contrôles ne constituent pas une CI distante.

## Correction de fraîcheur après restauration

Une revue supplémentaire a trouvé une collision de compteur : réenregistrer la première
configuration d’un projet restauré pouvait rendre un ancien reçu actuel sans exécution.
Régression reproduite rouge (`browser-restored-identity-red.log`), puis corrigée : chaque
enregistrement crée une identité locale capturée dans le reçu. Activation, identité,
compteur, canal et version du pilote sont comparés à la clôture et à la lecture.
Les anciennes configurations sont lisibles sans mutation ; leur réenregistrement explicite
est requis. Les anciens reçus sans identité restent à réévaluer.

Nouvel essai depuis Studio/CUA sur la version éditée `1ddd230a-c083-4870-8b9a-1fd6ce04596c` :
réenregistrement demandé et effectué, puis reçu `82a72d6c-8a03-4b99-944f-496fa17deeca`,
sept étapes et quatre assertions réussies en 1 833 ms. Le contrôle était bloqué avant
réenregistrement. Reçu exporté/restauré identique ; une configuration Chrome recréée avec
le même compteur garde sa preuve à réévaluer, tandis que l’original reste actuel.
Données de projet intactes, trois jobs inchangés, aucun fournisseur. Relevé privé
`browser-identity-replay.json`. Revue indépendante ciblée sans nouveau défaut confirmé.

Après correction : build et **1 266 tests globaux réussis**, zéro échec/annulation/ignoré,
lint, format et liens documentaires réussis (`browser-identity-full-tests.log`,
`browser-identity-lint.log`, `browser-identity-format.log`).
Archive reconstruite après ce correctif : 1 501 fichiers, aucune donnée privée de recette,
les six modules navigateur présents. Installation et smoke réussis sur cette archive
(`browser-identity-package-smoke.log`) ; aucun appel fournisseur ni publication.

## Supervision automatique — fournisseur simulé, navigateur réel

Raccordement local `cb3e418`, `7b49c30`, `e9f0c63` : consentement automatique distinct et
désactivé par défaut ; exécution après admission du candidat, avant verdict final ;
revalidation du contexte, des permissions et des outils pendant l’attente. Le même service
qualité produit le reçu. Annulation et révocation refusent les résultats tardifs ; aucune
adoption ni couverture métier n’est ajoutée. Le tableau suit le début et la fin à révision
constante. Revue indépendante ciblée sans défaut bloquant confirmé.

Deux projets de fixture explicitement nommés « fournisseur simulé » ont été exercés via CUA.
Un exécutable local déterministe remplace Codex pour la sonde et la production du candidat :
**aucun compte, modèle ni fournisseur réel n’a été appelé**. Le code de supervision, le
service qualité et Chrome sont réels. L’option a été cochée et enregistrée dans Studio,
puis une demande envoyée ; aucun clic sur « Exécuter ce contrôle » ni actualisation manuelle.

- Version correcte `c73cb9ba-e8f0-48f0-89fc-40a553094054`, reçu
  `2a348b69-262c-462f-a473-46de456f5435` : sept étapes et quatre assertions réussies,
  6 679 ms. Le résultat apparaît automatiquement dans Vérifications.
- Variante ignorant la relecture `83bfcea1-04df-4d59-a7e3-7aadad204e30`, reçu
  `434aca79-ba8e-4fbd-a3db-e75e5b4280f4` : échec `expectValue` à l’étape 6 après
  sauvegarde et redémarrage, 7 860 ms. Diagnostic et assertion en échec visibles.

Dans chaque projet : un job, un reçu navigateur, aucune version active, données sentinelles
intactes. La borne d’un appel simulé est atteinte ; le contrôle local s’exécute puis la
supervision reste arrêtée pour budget clos, sans deuxième appel. Les tokens zéro proviennent
du fournisseur fictif et ne sont pas une mesure de coût native. Les critères effectifs restent
vides et `persistence` reste déclaratif. Relevé disque privé `browser-auto-replay.json`.
Rendu bureau et détail des reçus inspectés. L’état intermédiaire « en cours » est couvert
par les tests d’interface ; il n’a pas été capturé pendant ces deux essais rapides.

Contrôles ciblés : 48 tests runner, dont la frontière réelle service qualité/journal/contrôle
avec adaptateur navigateur simulé ; 40 tests connectés configuration, qualité et interface.
Le premier passage global conserve deux échecs sur les délais de fixtures MCP
(`browser-auto-full-tests.log`, 1 298/1 300) : un délai peut expirer avant que l’effet ou
la réception HTTP présupposés par le test aient eu lieu. Lint et format globaux réussis.
Correction `e7df5e1` : temps contrôlé après frontière observée, cas avant frontière conservés
avec zéro effet/requête, absence de répétition toujours vérifiée. Rouge contrôlé puis
18 tests MCP réussis ; aucun changement du code produit ni de ses délais.
Passage final : build et **1 302 tests globaux réussis**, zéro échec/annulation/ignoré,
lint et format globaux réussis (`browser-auto-full-tests-final.log`,
`browser-auto-lint-final.log`, `browser-auto-format-final.log`). Archive inspectée :
1 502 fichiers, aucun fichier privé, module de supervision navigateur présent.
Installation et smoke de l’archive finale réussis (`browser-auto-package-smoke.log`) :
Studio, React strict, édition, persistance, export/restauration et CLI. Aucun fournisseur.
La campagne native réelle reste suspendue ; cette recette ne la remplace pas et ne vaut
pas intervention humaine.
