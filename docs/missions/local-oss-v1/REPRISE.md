# Point de continuation — 21 septembre 2026, après première recette native

La [PR brouillon 40](https://github.com/montassarkhalloufi/DevMethod/pull/40) est
ouverte sur `codex/local-oss-v1-review`. Première CI : Linux, macOS et fullstack
réussis ; sept échecs Windows diagnostiqués et corrigés. Deux défauts produit
de chemins/liens dans le suivi de progression, trois hypothèses de fixtures.
Revue indépendante, **1 507 tests et build locaux**, lint et format réussis.
Voir [preuve CI](evidence/PLATFORM-CI.md) ; la PR porte les résultats du prochain
commit, sans réattribuer les anciens succès. Branche de travail et copies privées
conservées, aucun merge/publication ni nouvel appel agent.

Le [bilan de maturité A–H](evidence/MATURITY.md) est maintenant établi sur la base
`9ecf22b` : mécanismes locaux implémentés, recette complète encore partielle.
La préparation de PR utilise une branche de revue depuis main avec un arbre
identique au travail contrôlé, pour exclure l’ancien historique contenant des
preuves personnelles. La branche de travail reste intacte. Une capture Brevo est
conservée uniquement en privé et son relevé textuel public est explicitement
dérivé ; voir [provenance](evidence/PUBLIC-EVIDENCE.md). Parent, égalité des arbres,
objets poussés, archive et résultats CI doivent être consignés dans le dossier
d’intégration avant toute revendication de livraison distante.

Comparaison du site approfondie sur bureau/mobile : géométrie et texte normalisé
identiques pour les 91 blocs mesurés de l’accueil ; aucun nouveau défaut établi.
Les six espaces et deux retours de ligne des guides restent ouverts. Les quatre
preuves historiques distribuées qui contenaient un chemin personnel ont désormais
des [dérivés publics explicites](evidence/PUBLIC-EVIDENCE.md) ; originaux conservés
en privé, empreintes distinguées, revue indépendante et liens documentaires vérifiés.
Les trois bundles portables contiennent des historiques de fixtures dédiées.
L’inspection d’intégration confirme la réconciliation avec `main` (`65fbcb92`) :
aucun commit de main manquant, 147 commits locaux d’avance avant cette note.
Aucune ancienne PR à rejouer ; CI distante et PR dédiée restent à préparer.

Vue **Points à examiner / Items to review** ajoutée dans Vérifications : comptes
issus des observations, preuves historiques séparées, liens et arrêts visibles.
Recette CUA FR/EN bureau/mobile, état inchangé ; **1 504 tests**, build, lint et
format réussis. Voir [preuve de concentration](evidence/ATTENTION-CONCENTRATION.md).
La recette du site a aussi confirmé FAQ, ancres, copie exacte, lecture/pause et
sous-titres du film historique ; la recherche vidéo reste non validée. Le nouveau
film anglais et le prochain appel site restent suspendus aux mêmes entrées attendues.

Nouvelle tranche locale : **Corriger cette version / Request changes** permet une
demande depuis un candidat sans adoption préalable. Filiation, contrôles, limites,
saisies et historique conservés ; régression de compteur de correction corrigée
après revue indépendante. Build et **1 494 tests globaux**, lint et format réussis ;
parcours CUA bureau/mobile FR/EN exercé sur fixture sans fournisseur. Voir
[preuve de correction ciblée](evidence/CANDIDATE-REQUEST.md). Le site reste suspendu,
aucun appel supplémentaire ni relèvement de budget. Export/restauration autonome
du candidat site maintenant vérifiés, sans changer sa version active.
Paquet installé et smoke réussi ; sources du parcours et assets inclus, aucun fichier
privé emballé. Le serveur du site tourne avec ce correctif sur 4442, état/données/
réglages/ledger identiques après redémarrage. Dialogue anglais ouvert avec la demande
de correction préparée mais non envoyée. Après éventuel accord d’un seul appel,
borner aussi le total d’admissions à deux (une déjà consommée), sans effacer le registre.

Dernier ajout : portage du site livré par l’agent lancé depuis Studio, candidat React
`d4208c0d-ce2a-4dd0-9163-3b36dee83116`, non activé. Le contrôle local natif a relevé
une erreur `srclang`, corrigée en `srcLang`, puis réussi sur les sources livrées ;
Studio a réexécuté ses deux contrôles d’admission. Une première recette navigateur
confirme navigation, clavier, filtres et menu mobile ; six espaces et deux retours
de ligne des guides restent à corriger. Voir [preuve site](evidence/NATIVE-SITE.md).
La consommation connue de cet appel dépasse le seuil choisi pour ce chantier :
appels suivants suspendus, demande d’un appel de correction pendante. L’inventaire
reste séparément suspendu pour consommation inconnue.

Interface Studio FR/EN réalisée, anglais par défaut, choix mémorisé
entre accueil et projets. Voir [ADR-037](../../ADR-037-studio-interface-language.md).
Les catalogues, contrôles, dialogues et éditeurs se relocalisent sans changer les
saisies, sources, permissions ni preuves historiques. Les messages d’état de l’agent
partagent maintenant la même traduction dans le shell et le panneau React ; les
diagnostics inconnus restent inchangés, y compris les noms de propriétés héritées.
Build et **1 465 tests globaux**,
lint, format et liens documentaires réussis. Recette CUA accueil/projet aux largeurs
desktop et 390 px ; cette validation de traduction emploie des fixtures explicites.
Le site reste en anglais ; narration, sous-titres et dix nouveaux enregistrements
du film doivent être anglais. Dix passages de narration sont disponibles avec la
voix `af_heart` approuvée ; le montage et ses enregistrements restent à réaliser.
L’utilisateur a explicitement autorisé FFmpeg pour filmer uniquement la fenêtre
Studio, sans microphone. Aucune séquence vidéo n’a encore été enregistrée : la
permission macOS de capture reste désactivée pour l’application hôte affichée
« ChatGPT ». Le panneau système est ouvert et l’activation par l’utilisateur est
demandée. La capture d’essai a été refusée avant exécution par la validation
automatique, car son identifiant de fenêtre n’était plus confirmé ; revérifier une
cible Studio actuelle après autorisation, sans réutiliser cet identifiant périmé.
La campagne inventaire interrompue et sa décision de reprise pendante restent
inchangées.

Objectif durable toujours actif : finir la v1 locale OSS selon [PLAN](PLAN.md), critères A–H.
Branche `codex/local-oss-v1`, worktree39b2 ; source2701 en lecture seule. Aucun push, merge,
publication, achat ou nouvelle PR effectué. Les preuves anciennes ne certifient pas HEAD.

## Livré localement

- Reprise exacte5f39da5, réconciliation mainabff07b.
- Admission asynchrone JS ; JSON et scripts HTML intégrés parse5/VM/Node ; reçu Studio requis
  pour activation auto/manuelle. Source React échouée conservée en candidate immuable,
  diagnostic présent, aperçu refusé tant que non compilée. Comportement distinct.
- Configuration Codex locale depuis Studio : sonde installation/connexion/type d’accès,
  consentement persistant ChatGPT/API, limites durables, aucun repli de facturation.
  React widget et panneau utilisables desktop/mobile. Stack attendue persistée/visible,
  transmise et confrontée aux sources, sans conversion silencieuse des imports.
- Supervision native : finalisation diffère l’activation ; décision persistée puis correction
  technique unique si déléguée/attribuable/autorisée et budget connu. Correction repart de
  la candidate, contexte et délégation recontrôlés au claim. Échec répété/bornes/inconnus arrêtent.
  Candidat valide sans preuve métier reste à vérifier. Résolution explicite d’écartement
  libère les demandes conservées sans reset. Revue indépendante P1/P2 corrigés.
- Graphe de preuve dérivé critère/job/révision/contrôle, facteurs de risque qualitatifs,
  interventions regroupées et action d’autonomie affichés dans Vérifications et utilisés
  pour la correction/arrêt. **PARTIAL** : données de conséquences encore largement inconnues,
  preuves qualité et états outils raccordés avec leur provenance/fraîcheur ; signaux runtime négatifs reliés à leur révision, pas de preuve métier native
  complète ni de probabilité mesurée. Une observation de l’agent n’est pas trusted Studio.
- Reprise locale explicite d’un travail arrêté : garde parent, sources, metadata et ledger,
  crée une nouvelle vérification sans fournisseur, sans activation automatique.
- Outil local `check-work.mjs` : commande exacte fournie dans contexte natif, timeout annoncé
  dans prompt, sources copiées/contrôlées sans scripts package ; pas de reçu Studio forgé.
  Adaptation issue du timeout observé, pas encore rejouée par un nouvel appel natif.

## Recette réelle et arrêt conservé

[Preuve détaillée](evidence/NATIVE-INVENTORY.md). Projet inventaire React créé depuis Studio,
job96e83931-5efa-4d52-a160-524cb08229c5 : timeout300s, usage inconnu ; une admission conservée.
Aucun nouvel appel. Question explicite pendante sur éventuelle reprise malgré cette inconnue ;
ne pas présumer une réponse ni contourner par nouveau projet/registre.

Sources natives reprises par bouton Studio, 11 fichiers identiques, candidate
1673aa69-5737-45f9-ac2d-67c3d23bd010. Deux contrôles exécutés réussis ; ajout, modification,
persistance et conflit entre onglets observés via CUA. Observation agent enregistrée séparément.
Export produit via fonction serveur puis restauré avec CLI : sources/bundles identiques,
ledger inconnu conservé, données retrouvées, écriture isolée sur runtime autonomelocalhost4399.
Clic Exporter réel effectué mais téléchargement navigateur non attesté. Candidate non activée,
ouverte par son URL de révision explicite. Rien ne prouve une intervention humaine.

## Restant nécessaire

Compléter preuves métier/runtime et accès outils du runner natif ; fermeture complète C–G ; documenter/exercer
les politiques et résolutions avec contexte réel. Tester reprise/évolution native seulement si
autorisée après l’arrêt. Recueillir vraie intervention humaine sur résultat concret.
Portage site React natif puis filmaf_heart avec vrais enregistrements, fidélité et export.
Audit baseline :5554190a-1048-43c9-b0b5-bdff378e7d05, dernière de devmethod-site-en.tar ; aucune
acceptation utilisateur plus récente trouvée. Film actuel Daniel historique, voixaf_heart
approuvée séparément ; Remotion ready:false, scenes/cues vides, dix captures réelles requises.
Ne pas produire le site à l’extérieur puis le réimporter comme natif.

Validation récente :771 tests Studio, puis1138 tests globaux avec build réussis ; lint/format
réussis avant dernier outil check-work. Cet outil et son raccordement :20 tests ciblés réussis.
Logs privés sous evaluation-private/local-oss-v1/logs. Vérification package/CI et revue finale
restent à refaire au candidat final. Objectif non terminé.


## Raccordement contrôle — continuation du 21 septembre

Commits locaux c59f787, 5284e60, 1624b8e, b6c5310, af1df98 et 4fa926d :
lecture partagée des preuves qualité, déduplication des reçus liés, fraîcheur sélective,
provenance conservée et projection des résultats MCP limitée au transport. Les résultats
inconnus en mémoire du broker renforcent le journal disque sans promouvoir un succès non
persisté. Relecture avant admission et correction, après livraison et arrêt. Permission en
attente conserve l'identifiant de la demande originale, sans nouveau mécanisme d'autorisation.
Journal qualité illisible : autonomie arrêtée, Studio et inspection toujours disponibles.

111 tests intégrés réussis (`control-connected-final.log`) sur contrôle, runner, configuration,
qualité et serveur HTTP. Revue indépendante : fermeture de l'erreur d'ouverture sur journal
illisible ; remplacement explicite d'anciennes preuves après réexécution compatible intégré en 3140ffd, historique conservé. Ces tests sont
locaux/contrôlés, aucun nouvel appel fournisseur ni recette native supplémentaire.

Le pont natif est maintenant implémenté : serveur MCP STDIO limité à la mission, session
loopback éphémère et broker existant, sans accès aux routes d'approbation ni ouverture réseau
du shell. Voir [ADR-031](../../ADR-031-native-scoped-tool-bridge.md). Tests protocolaires avec
SDK réel et fournisseur fictif ; utilisation par un vrai job natif encore non démontrée.
La campagne interrompue reste arrêtée ; aucun appel fournisseur supplémentaire.

Validation après pont outils natif : build + **1196 tests globaux réussis**, lint global,
format global et liens documentaires réussis. Logs privés `native-tools-full-tests.log`,
`native-tools-lint.log`, `native-tools-format.log` ; protocole intégré 55 tests puis API
capacités 12 tests. Revue indépendante ciblée sans nouveau constat après correction de
consignes contradictoires et annulation pendant préparation. Les exécuteurs de tests restent
explicitement fictifs : aucune consommation modèle n'est engagée par ces validations.

## Signaux runtime — continuation du 21 septembre

Collecteur de l’aperçu produit raccordé au stockage : observations négatives bornées,
dédupliquées, liées à leur révision et empreinte, exportables. Ni commande exécutée,
ni réussite, ni accord humain. Le contrôle exige une vérification supplémentaire sur un
signal actuel ; l’agent indisponible est distingué du budget réellement épuisé.
Correction `85573c0` : le montage du tableau qualité ne masque plus le contrôle d’exécution.
Les compteurs de livraison séparent désormais observations et commandes.

[Preuve et limites](evidence/RUNTIME-SIGNALS.md) : fixture navigateur contrôlée réellement
exercée, redémarrage et rechargement sans duplication, rendu inspecté. Aucune recette native
supplémentaire. Build et **1211 tests globaux réussis**, lint/format et liens documentaires
réussis sur cette tranche. Les preuves métier, l’intervention humaine et le site/film restent
à terminer ; le nouveau résultat n’efface pas les limites de la campagne suspendue.

## Adoption explicite examinée — continuation du 21 septembre

L’action d’adoption depuis Historique ouvre désormais un examen de la version exacte, avec
raison obligatoire, empreinte du contexte, refus des confirmations périmées et trace des
preuves/risques/inconnues dans Décisions. L’adoption locale ne relance pas l’agent ni ne lève
son arrêt. Voir [ADR 032](../../ADR-032-reviewed-local-adoption.md) et
[preuve contrôlée](evidence/LOCAL-ADOPTION.md). Essai réel CUA à deux onglets, bureau et mobile,
explicitement distinct d’une intervention humaine. Build et **1231 tests globaux** réussis,
lint et format globaux réussis. Revue indépendante ciblée sans nouveau défaut bloquant.
Paquet local inspecté sans données privées ; installation et smoke de l’archive réussis,
sans fournisseur ni publication. CI distante et recette native finales restent à faire.

À ce point de la continuation, le raccordement de l’éditeur et le pilote navigateur étaient
encore à réaliser. Leur état actualisé est décrit ci-dessous. La décision sur la reprise native
reste pendante ; aucune continuation automatique de la mission ne vaut réponse.

## Éditeur examiné et contrôle navigateur réel — continuation du 21 septembre

L’éditeur prépare une candidate immuable sans activation, puis ouvre le même examen que
l’historique. Fermer conserve active/brouillon ; rouvrir réutilise la candidate ; adoption
confirmée réconcilie le brouillon et conserve les saisies concurrentes. Tranche intégrée
en `3af6a8b`, 61 tests ciblés réussis et essai CUA réel sur fixture contrôlée.

Choix technique délégué [ADR 033](../../ADR-033-local-browser-verification.md) : pilote local
optionnel Playwright 1.63.0, Chrome/Edge installé, réglage explicite depuis Vérifications.
Scénarios JSON bornés, copie des fichiers, données vides, assertions réellement exécutées,
redémarrage serveur/contexte et journal par révision. Aucun profil utilisateur ni fournisseur.
[Preuve](evidence/BROWSER-VERIFICATION.md) : scénario de persistance réussi (sept étapes,
quatre assertions), variante perdant la relecture détectée à la sixième étape. Données
du projet intactes. Rendu bureau/mobile inspecté. Les liens aux critères restent déclaratifs.

Reçus qualité désormais conservés dans l’export/restauration ; autorisation locale navigateur
non exportée. Revue indépendante : configuration incluse dans l’empreinte d’adoption et
liens de critères bornés aux scénarios déclarés. Le premier passage global a exposé trois
fixtures fragiles ; synchronisation/sélecteurs et séparation du délai MCP corrigés sans
changer les règles produit. Build et **1264 tests globaux réussis**, lint global réussi,
format global réussi avant ces dernières notes. Journaux privés `browser-*-final.log`.
Onze tests qualité réussis après le dernier ajustement « Non applicable » pour les versions
sans frontend. Archive locale inspectée sans fichiers privés ; installation/smoke réussis
sur le paquet produit (`browser-package-smoke.log`), sans fournisseur ni publication.

Restant immédiat : raccorder le contrôle navigateur à la supervision native et évaluer
la pertinence de sa couverture avant de fermer les critères métier. Lancement depuis
Vérifications démontré ; invocation automatique et vraie utilisation par l’agent natif
non démontrées. Campagne native toujours suspendue, intervention humaine non obtenue,
site React et film non réalisés, CI distante/PR/intégration finales toujours ouvertes.

Dernière revue : collision de compteur navigateur après restauration reproduite et corrigée.
Chaque configuration reçoit une identité locale ; même compteur/canal après restauration
ne rafraîchit plus un ancien reçu. Migration explicite des anciens réglages, sans mutation
à la lecture. Nouvel essai navigateur réel réussi sur la version éditée : sept étapes,
quatre assertions, données intactes. Export/restauration de ce reçu vérifié avec compteur
identique ; preuve toujours à réévaluer dans la copie. **1 266 tests globaux et build réussis**,
lint/format et liens documentaires réussis. Voir la section de correction dans
[la preuve navigateur](evidence/BROWSER-VERIFICATION.md).
Paquet reconstruit après correction, inspecté sans données privées, installé et essayé
avec succès (`browser-identity-package-smoke.log`). Aucun push, merge ni publication.

## Vérification automatique après candidat — continuation du 21 septembre

Le raccordement auparavant manquant est maintenant implémenté (`cb3e418`, `7b49c30`,
`e9f0c63`) et exercé avec fournisseur simulé et vrai navigateur. Consentement séparé,
aucun rattrapage historique, arrêt et révocation, rafraîchissement de l’interface à révision
constante. Le candidat sain passe ; la variante perdant la relecture échoue à l’étape 6.
Les deux restent non activés et leur budget clos interdit un nouvel appel. Sources et limites
dans [la preuve navigateur](evidence/BROWSER-VERIFICATION.md). Aucune recette native réelle
ni intervention humaine supplémentaire ; le site et le film restent à réaliser.

48 tests runner et 40 tests connectés réussis, revue indépendante sans nouveau défaut confirmé.
Premier passage global : 1 298/1 300 ; deux fixtures MCP présupposent que l’effet a débuté avant
un délai court, ce qui n’est pas garanti sous charge. Synchronisation corrigée en `e7df5e1` :
horloge/signal contrôlés après la frontière observée, cas avant frontière également testés,
sans modification des bornes produit. Dix-huit tests MCP réussis. Lint/format globaux réussis.
Passage final après correction : **1 302 tests globaux et build réussis**, zéro échec,
lint et format globaux réussis. Journaux `browser-auto-*-final.log`.
Archive finale inspectée sans données privées ; installation et smoke réussis
(`browser-auto-package-smoke.log`). Sources, interface générée et preuves enregistrées localement.

Restant après cette tranche : vérifier la pertinence de la couverture des critères et les
résolutions d’intervention, exercer outils et boucle avec le vrai agent lorsque la reprise
est autorisée, puis site/film, validation humaine et gates d’intégration finale.

## Couverture métier examinée — continuation du 21 septembre

La pertinence des scénarios peut maintenant être examinée depuis Vérifications : critère
exact, scénarios entiers, conclusion explicite, périmètre et justification. La décision
est liée au reçu et à ses empreintes ; seul un résultat local complet et une appréciation
suffisante actuelle contribuent à la couverture. Historique conservé, nouvelle version ou
preuve modifiée à réévaluer. Voir [ADR 034](../../ADR-034-reviewed-business-coverage.md) et
[la preuve](evidence/BUSINESS-COVERAGE.md). Aucun réveil agent, adoption ou reset de budget.

Essai CUA réel sur reçu navigateur existant : concurrence à deux onglets refusée avec
saisies conservées, actualisation sans écriture puis confirmation explicite, historique et
graphe distincts. Deux défauts UI corrigés : disparition du formulaire au rafraîchissement,
puis retour trop bas sur mobile. Nouvelle confirmation à 390 × 844 visible près du bouton.
Export/restauration des quatre appréciations essayé : reçus conservés, permission locale
absente, couverture à réévaluer ; jobs, version active et données de la source inchangés.
Ces actions automatisées ne démontrent pas une intervention humaine.

Premier passage global : 1 345/1 348, chargement Ajv trop tôt dans les installations sans
dépendances. Chargement différé corrigé sans relâcher le schéma ; 41 tests ciblés réussis.
Anciennes décisions à sujet libre de couverture préservées ; restriction des nouvelles
livraisons agent maintenue, trois régressions ajoutées. Passage global final : **1 351 tests
et build réussis**, lint et format globaux réussis. Journaux `coverage-*-complete.log` et
`coverage-full-final.log`. Code et artefacts enregistrés en `a37be56`. Liens documentaires
vérifiés ; archive de 1 507 fichiers inspectée sans données privées, réellement installée
et essayée avec succès (`coverage-package-smoke.log`). Les dernières notes seules sont
ensuite incluses dans une archive finale dont les essais et empreintes sont consignés dans
`coverage-package-final-smoke.log` et `coverage-package-final-manifest.json`, hors paquet.

Restant : conséquences métier et résolutions d’intervention, recette avec vrai agent après
décision de reprise, site React natif/film, validation humaine et intégration finale.
La mission complète reste active ; aucun nouvel appel fournisseur, push, merge ou publication.

## Conséquences examinées et intervention locale — continuation du 21 septembre

Les conséquences peuvent maintenant être examinées depuis Vérifications : versions et base
exactes, fichiers changés, indices positifs bornés, résumé des données sans valeurs, preuves
et limites. Appréciation distincte pour données/contrats, résolution explicite, périmètre et
justification obligatoires. Une acceptation actuelle lève uniquement le verrou de conséquences ;
les inconnues et risques restent visibles. Un arrêt maintenu reste effectif pour cette candidate
jusqu’à remplacement. Voir [ADR 035](../../ADR-035-reviewed-local-consequences.md) et
[la preuve](evidence/LOCAL-INTERVENTIONS.md).

Recette CUA à deux onglets : confirmation périmée refusée, champs conservés, actualisation sans
écriture puis nouveau clic. Défaut de disposition corrigé ; cinq champs empilés et confirmation
lisible à 390 × 844. Quatre appréciations conservées avec observations historiques. Export et
restauration réellement essayés : historique intact, acceptation à réévaluer dans la copie ;
jobs, version active, données et ledger de la source inchangés. Ce sont des actions de l’agent,
pas une intervention humaine. Revue indépendante : contournement via proposition préexistante
reproduit puis fermé à la frontière d’ajout des décisions ; snapshot historique complété et
réexaminé sans nouveau défaut concret résiduel.

Passage global après corrections : **1 395 tests et build réussis**. Le dernier ajustement
visuel a ensuite demandé une décomposition du retour de chargement pour respecter le lint ;
13 tests UI/shell et lint global réussis après cette extraction sans changement de comportement.
Les liens documentaires passent. Journaux `intervention-*-final.log` et
`intervention-ui-complete.log`. L’archive de 1 514 fichiers a été inspectée sans données
privées, réellement installée et essayée avec succès (`intervention-package-smoke.log`).
Les présentes notes sont incluses dans l’archive finale, dont la révision, les empreintes
et le résultat des essais sont consignés hors paquet dans
`intervention-package-final-manifest.json` et `intervention-package-final-smoke.log`.

Prochaine dépendance autorisée : raccorder l’exécution de `continue/activate` au runner avec
relecture des preuves et du contexte, sans nouvel appel fournisseur ni contournement des budgets
ou arrêts conservés. Aujourd’hui l’examen ne réveille pas le runner et n’adopte aucune version ;
le verrou des demandes suivantes reste lié à l’adoption ou à l’écartement explicite.
La recette native inventaire demeure suspendue, consommation inconnue et décision de reprise
pendante. Validation humaine, site React natif, film `af_heart`, CI distante et intégration finale
restent ouverts. Aucun push, merge ni publication.

## Application sous contrôle courant — continuation du 21 septembre

Le runner peut désormais exécuter une recommandation `continue/activate` après relecture
des preuves, de la base, des conséquences et des permissions. Pour une candidate déjà
conservée, l’action locale « Appliquer selon les contrôles » applique la même politique
sans appel fournisseur. La décision porte la provenance « Moteur Studio » et conserve les
observations examinées. L’ancien contrôle du job reste immuable. Une candidate écartée
reste exclue, y compris face à une livraison worker ou une proposition tentant de remplacer
cette résolution. Voir [ADR 036](../../ADR-036-controlled-candidate-activation.md) et
[preuve de la tranche](evidence/CONTROLLED-ACTIVATION.md).

Recette CUA réelle sur fixture isolée : confirmation périmée refusée, brouillon conservé,
puis application unique de la candidate exacte. Deux défauts de rendu observés et corrigés :
bouton masqué par le tableau qualité, puis longues références élargissant la colonne des
décisions sur mobile. Inspection visuelle finale à 390 × 844 et sur bureau. Export/restauration
réellement essayé : une décision moteur, trois jobs, trois révisions, sept checks et quatre
reçus conservés ; données et ledger inchangés. La copie restaurée conserve l’histoire sans
transférer les permissions locales ni la validité des appréciations.

Build et **1 426 tests globaux réussis**, zéro échec, lint et format globaux réussis après
ces corrections. Journaux privés `controlled-activation-*-complete.log`. La révision, les
empreintes et le résultat du smoke de l’archive de cette tranche sont consignés hors paquet
dans `controlled-activation-package-final-manifest.json`. Les résultats d’une archive
antérieure ne certifient pas ce nouveau contenu.

L’agent fournisseur et sa disponibilité sont simulés dans cette recette ; le reçu navigateur
et les manipulations CUA sont réels. Aucun appel fournisseur ni validation humaine n’en
découle. La campagne native reste suspendue jusqu’à décision de reprise : évolution et
correction de l’inventaire, outils représentatifs et boucle complète native restent à
démontrer. Site React natif, film `af_heart`, validation humaine, CI distante et intégration
finale restent ouverts. Aucun push, merge ou publication.
