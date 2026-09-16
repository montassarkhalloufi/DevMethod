# Résultats — création et évolution locales

16 septembre 2026. **Un parcours local exécutable a été réalisé et repris ; aucun avantage
comparatif ni rupture n’est démontré.** Les limites et règles d’arrêt sont fixées dans
[PLAN.md](PLAN.md). Ce rapport distingue exécution native, travail de l’agent hôte et
observations navigateur. Il ne transforme pas les contrôles de l’équipe d’agents en étude humaine.

## Ce qui a été construit

Studio accepte une intention et des références, conserve cadrage et décisions, confie une
demande durable à un agent, reçoit ses vrais fichiers, les exécute sur une origine locale
distincte et lie les contrôles à leurs versions. Les données métier restent séparées du code.
Le bridge hôte et l’adaptateur Codex partagent le contrat de réception ; une demande annulée,
interrompue ou devenue obsolète ne peut pas annoncer tardivement un succès.

Ce mécanisme est réutilisable : le cas Les Ateliers n’est pas encodé dans un moteur de
scénarios Studio. L’[exemple enregistré](../../../examples/studio-ateliers/README.md) permet
de reconstruire et d’essayer le résultat sans nouveau modèle. Reconstruction d’un résultat
et génération d’une application sont deux opérations différentes.

La lecture Code et la comparaison utilisent les fichiers réels et leurs empreintes, avec
une base de comparaison issue de la demande. L’éditeur est désormais implémenté : textes
jusqu’à 256 Kio, brouillon versionné, enregistrement automatique après 700 ms, vérification
JS/JSON et exécution navigateur sur une troisième origine avec données d’essai isolées.
L’adoption crée une version exacte du build sans transférer les données d’essai ni les
anciens contrôles. Les limites sont détaillées dans le [contrat](CONTRACT.md).

Les tests ciblés rapportés pour cette tranche sont **19 réussis** : 11 tests backend dans
`tests/studio-editor.test.mjs` et 10 tests UI dans `tests/studio-editor-ui.test.mjs`.
Ils couvrent notamment les conflits,
la conservation des textes, le dernier bon aperçu après syntaxe invalide, l’isolation des
données, l’absence d’exécution applicative serveur, l’adoption du build exact et le rejet des
messages runtime d’une autre fenêtre/origine/version. Ces contrôles automatisés, dont des
interactions DOM, ne prouvent pas le parcours complet dans un vrai navigateur.

Le [parcours navigateur enregistré](evidence/studio/editor-journey.json) a ensuite réellement
exercé édition → erreur statique → erreur runtime → récupération → adoption. Une modification
du pied de page HTML a été enregistrée et exécutée sur la troisième origine. L'essai a révélé
un **faux succès de `node --check FILE`** sur un fichier `.js` avec imports ESM et expression
incomplète. Le vérificateur corrigé reçoit les octets exacts sur stdin avec un mode explicite
module/commonjs ; les builds antérieurs doivent être revérifiés avant adoption. Après un vrai
redémarrage, le même code invalide a produit le diagnostic `app.js:270`, avec conservation
du dernier bon aperçu. [Erreur statique bloquée](evidence/studio/editor-syntax-blocked.jpg).

Une erreur levée par du JavaScript syntaxiquement valide a ensuite bloqué l'adoption dans
l'interface ; restaurer le code a permis un nouvel aperçu sans ce signal.
[Erreur runtime](evidence/studio/editor-runtime-error.jpg). L'inscription « Essai brouillon »
existe dans la copie d'essai version 11 seulement. Les données actives version 10 sont restées
identiques, SHA-256 `22aac06a026ec812cdee26b830e3e7b49ef8a10ddba441099bcc9297894f6cb8`.

L'adoption effectuée dans le navigateur a créé la révision active
`1aea70fe-1134-4dfa-a872-a79e3003b6aa` : seul le pied de page de `index.html` a changé.
[Version adoptée](evidence/studio/editor-adopted.jpg). Elle possède un nouveau contrôle de
syntaxe JS/JSON ; aucun ancien contrôle fonctionnel n'a été recopié. Les inscriptions
confirmées de Noa, Omar et Lina et l'attente de Sami restent dans les données du produit.
Ces observations sont celles d'un agent, sans validation humaine. Les diagnostics de
références sont heuristiques ; le build ne couvre ni tests métier, CSS, JavaScript inline,
TypeScript, bundler ou services cloud. Les signaux runtime ne sont pas des preuves indépendantes.

Une revue indépendante supplémentaire a reproduit deux défauts de reprise : une ancienne copie
locale ressurgissait après relecture du brouillon partagé, et un aperçu précédent restait
interactif après changement de base sans build. Les corrections retirent la copie locale
uniquement après réponse réussie et masquent l’iframe quand aucun build de la nouvelle base
n’existe. Deux tests de régression observent les transitions et la réouverture.

Les vérifications locales de la candidate rapportent **472 tests réussis sur 472**, lint
et format globaux réussis. Les 22 tests UI source/éditeur repassent après les corrections
finales. Le contrôle du paquet a d’abord échoué sur deux liens vers des tests non distribués ;
les liens ont été corrigés. Le smoke complet du paquet local a ensuite réussi, avec les
installations des trois profils, le Studio, l’édition isolée, l’erreur ESM, l’adoption,
le brouillon après redémarrage et l’export/restauration. Aucun appel fournisseur durant ces
contrôles. Les profils installés ne prouvent pas l’exécution native de Claude ou Cursor.

Ces résultats locaux proviennent de macOS avec Node 24.18.0. Le workflow de la PR vérifiera
le commit candidat sur les trois systèmes ; les résultats locaux seuls ne permettent pas
de déclarer Windows ou Linux validés. Les captures et la revue UX sont liées au code du
Studio, distinct des six révisions de l’application d’exemple.

[Registre des contrôles et empreintes du runtime](evidence/local-verification.json).
La [revue UX de l’éditeur](evidence/studio/EDITOR-UX-REVIEW.md) conserve deux défauts mobiles
avant correction puis les nouvelles observations : menu accessible et 320 px de code visibles
à 390 × 843, 301,6 px sur desktop 1563 × 813. Ce contrôle de lisibilité et d’accès ne valide
pas la nouvelle palette et ne constitue pas une étude d’utilisabilité humaine.

## Parcours Les Ateliers : observations et résultats négatifs

| Étape | Fait observé et provenance | Portée et limite |
| --- | --- | --- |
| Idée, exploration et cadrage | L’agent de mission a préparé le besoin fictif, comparé trois directions raster, enregistré le cadrage et l’architecture par les vrais endpoints. [Trace](evidence/journey/preparation.json), [références](DESIGN.md). | Le cadrage et le choix Agenda viennent de la délégation à l’agent ; pas d’entretien utilisateur ni de préférence humaine mesurée. |
| Première construction | Une demande native Codex a effectivement produit les fichiers de la révision `63ac6700-375d-44e2-b28d-6eefad79de90`. [Reçu de consommation](evidence/journey/native-usage.json). | Une remise de fichiers ne prouve pas une application utilisable. |
| Erreur récupérable | Le navigateur a montré que le code refusait le stockage initial `{}` comme incompatible. L’agent hôte a corrigé ce contrat, puis livré `210f6cc8-5be2-4e3e-a7ec-fc7d7404f4e9` avec 7 tests de logique/stockage. Le contrôle initial `failed` demeure dans l’exemple. | Faux départ conservé ; un résultat natif terminé et des tests initiaux ne garantissaient pas le premier usage. |
| Inscription et conflit | Inscription, filtre, capacité et annulation ont été essayés ; un conflit HTTP 409 a été provoqué avec conservation de la saisie pour réessayer. [Capture du conflit](evidence/journey/conflict.jpg). | Observation du parent dans un vrai navigateur ; ce n’est pas une validation humaine indépendante. |
| Changement de besoin | L’hôte a consommé une nouvelle demande et livré `3e5a7370-5d8d-405b-84df-5255562e886d` : attente FIFO par atelier, promotion après annulation, conservation des inscriptions et champs existants. 13 tests de logique plus contrôles de syntaxe sont rattachés à cette version. [Promotion visible](evidence/journey/waitlist-promotion.jpg). | Réalisation par l’agent hôte via le bridge, sans second appel natif du produit. |
| Arrêt et reprise | Le serveur a été arrêté puis relancé. Données version 10 identiques octet pour octet, même design, même révision `b44b4b37…`, même brouillon Studio et mêmes demandes. Le navigateur retrouve Noa, Omar, Lina et Sami en attente. [Trace avant/après](evidence/journey/restart.json). | Préservation réellement observée ; aucun engagement de migration universelle entre schémas incompatibles. |
| Export autonome | L’archive de 7 235 072 octets a été restaurée : 37 fichiers, données identiques, code servi concordant et budget conservé. L’application exportée a tourné sur le port 4337 sans installation DevMethod. [Reçu](evidence/journey/export.json). | Cet export correspond au snapshot `b44b4b37…`, antérieur à la correction CSS finale. Il ne vérifie pas rétroactivement les versions suivantes. |
| Correction visuelle ciblée | La version `b44b4b37…` cachait le dernier filtre mobile au premier affichage et densifiait mal les cartes desktop. La révision CSS `4bb3238f-fd3a-4edb-8377-89d5850cc258` a été contrôlée dans Chrome à 1280 × 960 et 390 × 843 pixels CSS : cartes en trois colonnes, filtres qui reviennent à la ligne, pas de débordement horizontal global. [Mesures finales](evidence/journey/final-visual-metrics.json). | Contrôle agent sur les deux corrections affectées, sans rejouer inscription, annulation, persistance, accessibilité ou tous les breakpoints. La disposition mobile reste différente du master pour la rangée d’action. |

[Capture desktop finale](evidence/journey/final-desktop.jpg) et
[capture mobile finale](evidence/journey/final-mobile.jpg) sont des vues du viewport, pas
des captures complètes de page. Les [mesures antérieures](evidence/journey/b44b4b37-final-visual-metrics.json)
conservent les deux défauts avant correction. La fidélité pixel parfaite n’est pas établie.

La fixture conserve désormais six révisions, jusqu'à `1aea70fe…`. La provenance du choix
Agenda a été corrigée par la demande de contexte `5f090ff9-fc4f-47f1-b8d8-cabacf1a6b30`,
sans nouvelle révision de code : l'entrée historique attribuée à `user` est remplacée par
une décision active `source: "agent"`. Le choix reste délégué ; cette correction ne fabrique
ni vote humain ni nouvelle preuve visuelle. L'historique initial est conservé dans
[l'état enregistré](../../../examples/studio-ateliers/state/studio.json).

## Appel natif et budget

Le seul appel natif de construction est `48f29572-b237-42bd-a83e-cfc9d762e6e7`, du
16 septembre à 14:50:41.630 UTC au 14:55:13.634 UTC, soit environ **272 secondes**. Il a
rapporté **277 934 tokens** : 264 412 en entrée et 13 522 en sortie. Les 228 224 tokens
d’entrée en cache sont déjà inclus dans l’entrée ; ne pas les additionner une seconde fois.
Le coût monétaire est **inconnu**.

Le seuil prévu de 100 000 tokens était une admission **entre appels**, pas un plafond dur
pendant un appel. Il a été dépassé au premier appel ; **aucun second appel natif n’a été
lancé**. Le compteur reste fermé et survit à l’export. Les corrections, l’évolution et les
contrôles suivants ont été réalisés par les agents hôtes. Leur consommation n’est pas
exposée ici : elle est inconnue, pas nulle. Les 272 secondes ne sont donc ni le temps total
jusqu’au premier produit utilisable, ni le coût de tout le parcours. Les anciennes campagnes
comparatives restent closes et leurs résultats négatifs ne sont pas effacés.

## Transfert à un second domaine

Le [vestiaire des objets](evidence/holdout/README.md) a été construit par un agent hôte dans
un autre workspace, avec le même contrat Studio et sans modification du runtime pour ce
métier. La révision `8fc388e7-b16b-43e8-b21a-b241b85b081b` gère deux exemplaires homonymes
distincts, prêt, retour, filtre et historique. Quatre tests métier du constructeur passent ;
son parcours Chrome, un redémarrage réel et un lancement autonome de l’archive ont été
[enregistrés](evidence/holdout/receipt.json).

Le parent a ajouté un essai réel à deux onglets : conflit d’écriture récupérable et saisie
contenant littéralement `<script>`, affichée comme texte. La
[capture du contrôle complémentaire](evidence/journey/holdout-conflict.jpg) est distincte des
preuves du constructeur. Le README du holdout décrit sa sous-tâche initiale, avant ce contrôle.

Ce cas démontre un transfert technique à une autre application, **pas un holdout aveugle** :
le constructeur connaissait un protocole antérieur et la demande incluait déjà l’historique.
Il ne compare pas A/B/C, n’isole pas l’apport de Studio et ne mesure aucun avantage humain.

## Ce que l’usage de la méthode a changé

La mission a utilisé Foundation pour retrouver les acquis, Explore pour examiner builders et
publications, Frame pour borner le produit, Design pour proposer de vraies images,
Architecture pour choisir le contrat local, puis Scoped Delivery pour réaliser, contrôler et
reprendre. Ces fonctions existaient déjà dans DevMethod ; les rendre visibles ne les invente pas.
[Acquis inspectés](evidence/acquis.md), [recherche produits](evidence/builders-a.md),
[complément produits](evidence/builders-b.md), [recherche scientifique et réfutations](evidence/science.md).

Deux corrections issues de ce « dogfooding » sont réutilisables : le mode est une valeur par
défaut, les délégations explicites par responsabilité priment ; une préférence de composition
n’approuve pas toute l’esthétique. L’utilisateur a validé K pour le shell Studio, puis a
rejeté l’olive après l’essai (« camouflage »). Composition et fonctions restent retenues,
mais la palette est rouverte. La proposition **L bleu nuit / indigo** attend son accord.

La [revue visuelle distincte du réalisateur](evidence/studio/DESIGN-REVIEW.md) relève cinq
écarts : surfaces peu séparées, produit absent du premier écran mobile, petite typographie,
historique technique uniforme et limites de preuve peu visibles. Elle contredit le jugement
initial de séparation nette malgré l’absence de débordement : les contrôles techniques
n’établissaient pas la qualité artistique. Les revues sont prévues aux étapes significatives
de la mission, sans automation périodique. Le shell reste distinct du design Agenda du produit.

## Ce qui reste à établir

- Obtenir le choix sur L ou la proposition révisée, corriger le shell puis vérifier la référence acceptée.
- Vérifier et relever les gates de la candidate exacte avant livraison de la PR examinable.
- Mesurer l’effort humain total et la qualité acceptée face au même agent bien guidé et au
  DevMethod stable, selon des critères définis avant l’essai. Aucun classement A/B/C ou
  concurrent commercial n’a été réalisé dans cette tranche.

Les études scientifiques motivent ces expériences ; aucune ne mesure DevMethod. Les tests,
captures, registres et revues d’agents ne démontrent pas une supériorité sur une bonne
consigne ordinaire, BMAD, Spec Kit, Bolt, Lovable, Replit, v0 ou Base44. Le laboratoire de
preuves reste optionnel, avec ses résultats négatifs conservés.
