# Studio — checkpoint du recadrage décision et parcours

Date : 2026-09-16. Complète le [checkpoint React](REACT-CHECKPOINT.md) et
[ADR 019](../../ADR-019-studio-decision-journey.md). Ce document décrit le candidat en cours
d’intégration ; ses preuves sont distinctes de celles de la tranche précédente.

## Périmètre demandé

La référence N précise l’interface : décision actuelle lisible, options verticales, conséquences,
bloc « À préserver » et preuves distinctes, avec historique accessible mais secondaire.
Foundation, Explore, Frame, Design, Architecture et Delivery doivent rendre le travail compréhensible.
Le [contrat de disposition](design/DECISION-LAYOUT.md) conserve le détail et la provenance de N.
Le panneau n’invente ni conversation, ni phase achevée, ni accord de la personne.

Une décision en attente est maintenant un objet structuré : question, options, conséquences,
recommandation et aperçu lié à une image ou une version. Avant/Proposition compare ces sources
identifiées. Sélection, approbation, réalisation et adoption restent distinctes ; une image porte
le statut simulation. Les contrôles d’une version ne deviennent pas ceux d’une autre option.

Le parcours Design conserve directions, master détaillé, écrans dérivés et prototype réel. L’accord
du master est indépendant du choix de direction. La régression trouvée lors de la revue acceptait
encore une livraison après choix de direction malgré un master en attente : elle est reproduite
puis corrigée dans le domaine. Un master non approuvé, absent ou devenu périmé bloque désormais
la réalisation ; le refus conserve le job et sa base. Les projets sans parcours restent compatibles.

## Implémenté et limites d’intégration

Les règles et tests ciblés résident dans [le contrat domaine](../../../scripts/studio/domain.mjs),
[les propositions](../../../scripts/studio/proposals.mjs),
[le parcours](../../../scripts/studio/design-journey.mjs) et
leurs régressions (`tests/studio-proposals.test.mjs` dans le dépôt). Le store conserve l’historique,
les jobs prennent ces champs en compte dans leur empreinte et le serveur impose l’acteur.
`approval.visualBlock` permet d’expliquer le besoin de validation du master plutôt que de
redemander la direction. Une modification importante déjà approuvée peut renouveler son
empreinte seulement lors de l’accord explicite de la proposition correspondante.

Le [contexte transmis à l’agent](../../../scripts/studio/workflow.mjs) décrit les formes réelles
de `proposals` et les actions versionnées du parcours. Le runner peut recevoir les propositions
dans `decisions.json`. Il n’accepte pas un objet `designJourney` arbitraire en fin de job.
Les actions d’hôte du parcours s’effectuent entre les jobs pour ne pas invalider leur contexte.
Le raccord worker est exposé par `/api/design/master/delegate-approval` et
`/api/proposals/delegate-approval` : acteur agent imposé, délégation effective vérifiée,
version courante exigée et refus sans mutation. Les tests HTTP distinguent accord réservé et
délégué, interdisent l’accord humain par token et conservent le brouillon lors d’une réalisation.
La revue a aussi reproduit une modification de sa propre délégation par le worker via
`/api/project` ; cette route lui est maintenant interdite, avec régression rouge puis verte.
Le raccord HTTP n’établit pas à lui seul un parcours natif autonome complet.

Code distingue les fichiers du projet des sources installées du backend local, en lecture seule.
Les [services](../../STUDIO-SERVICES.md) exposent leur origine, leur état observé et leurs limites.
Le runtime est un processus Node avec les serveurs de preview et stockage JSON ; il n’est pas
un orchestrateur de microservices. Les services de `devmethod.project.json` sont des déclarations
liées aux fichiers existants, non des backends exécutés. Auth, hébergement et APIs externes ne sont
pas déduits de ce manifeste. Une sonde saine atteste seulement une lecture JSON valide.
L’origine de comparaison `comparisonPreviewOrigin` lit les données courantes de l’application
mais refuse leur modification ; l’application active reste accessible sur sa propre origine
avec ses écritures habituelles. Ce n’est ni une copie de données ni une isolation de processus.
La régression HTTP vérifie refus 405, conservation des données puis lecture d’une modification
effectuée par l’application active. Les trois previews se ferment avec Studio.

## Lancer et essayer

Depuis le dépôt, installer les dépendances avec `npm ci`, puis `npm run build`. Les espaces locaux
de cette session se relancent avec :

```sh
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-react-live --port 4342 --preview-port 4343
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-reframe-demo --port 4346 --preview-port 4347
```

- **4342** conserve le projet, son brouillon de 2 616 caractères et sa version active. Ouvrir
  **Parcours**, puis **Design** : trois directions conservées, master retenu, déclinaison mobile,
  prototype compilé. Le master a été enregistré rétrospectivement par l’agent sous délégation,
  avec cette provenance visible ; ce n’est pas une nouvelle validation humaine.
- **4346** est une copie explicitement nommée « démonstration ». Choisir une option : le formulaire
  ciblé s’ouvre dans la proposition compilée, alors que l’autre option conserve le bouton initial.
  **Avant / Proposition** compare les versions réelles. **Revenir à l’application** sort de la
  comparaison sans résoudre la décision ; **Reprendre la comparaison** la restaure.
- Dans **Code**, les fichiers de l’application affichent la révision examinée. **Backend et
  services** montre les sources du runtime et les sondes bornées. **Agrandir cette vue** libère
  l’espace ; la séparation entre discussion et produit se règle à la souris ou au clavier.

Les workspaces dans `/private/tmp` sont des données locales de session, pas des fixtures distribuées.
Exporter depuis Studio pour les conserver ailleurs. Le scénario détaillé et ses identifiants sont
dans [demo.json](evidence/reframe/demo.json), le raccord du parcours dans
[journey.json](evidence/reframe/journey.json).

## Observations et portée des preuves

La copie de démonstration possède une vraie candidate React/TypeScript, construite par l’agent
hôte sans nouvel appel fournisseur : `d7cd1dff`. Elle n’est pas adoptée ; la version active reste
`336de365`. Les données métier gardent leur empreinte
`7e5a1c94e6383910e6d583268c97fbe8ca94c0af27a7a8fd803bd40ab32e73c0`.

| Vérification | Observation / limite |
| --- | --- |
| Choix et Avant/Proposition dans Chrome | L’URL de l’iframe et la révision de Code correspondent à l’option ; la sortie vers l’application conserve la décision en attente. |
| Écriture depuis une comparaison | Refus 405 visible ; le nom saisi reste disponible pour réessayer. Les données ne changent pas. |
| Historique au clavier | Le conteneur d’activité défile ; la carte de décision et la page restent en place. |
| Raison de décision après rechargement | Texte retrouvé dans le navigateur, décision toujours en attente. Brouillon local isolé par projet/proposition/base, avertissement si stockage indisponible. |
| Redimensionnement | Flèche droite sur le séparateur : 444 → 460 ; double-clic rétablit la disposition. |
| Code agrandi | Coloration Monaco avec six couleurs. La capture initiale a révélé un éditeur limité à 158 px et un pied coupé : après correction, 252 px de code à 762 px de hauteur, 496 px à 1 024 px ; les trois lignes de preuves sont entières. Identifiants et empreintes restent accessibles dans « Version et fichier ». |
| Mobile 390 px | Largeur du document égale au viewport, sans débordement horizontal ; les panneaux se suivent verticalement. |
| Parcours / Design | Le lien de phase défile dans le panneau ; une régression qui déplaçait toute la page a été corrigée puis revérifiée. |
| Master devenu insuffisant | Test React : quand la personne reprend le visuel, l’ancien accord délégué est signalé comme historique et insuffisant. Le serveur garde le blocage. |
| Comparaison d’image, conflit et approbation | Contrôles automatisés de composants/domaine/HTTP ; pas une validation humaine du design. |

Captures : [décision desktop](evidence/reframe/decision-desktop.png),
[mobile](evidence/reframe/decision-mobile.png), [code backend](evidence/reframe/backend-code.png),
[parcours Design](evidence/reframe/journey-design.png). La capture desktop utilise 1 536 × 1 024 px
CSS, comme N. Les contenus et le design de l’application réellement retenue diffèrent de la scène
illustrative N ; aucun délai de 24 h ni compteur de la maquette n’a été codé dans Studio.
Les détails rapprochés comprennent radios, icônes SVG, badge, typographie, surfaces et états.
Il subsiste des différences de densité et de composition : cette inspection ne prouve pas une
correspondance pixel à pixel.

Voir les [observations navigateur](evidence/reframe/browser.json), les
[empreintes avant/après redémarrage](evidence/reframe/restart.json) et la
[revue Vercel applicable](evidence/reframe/VERCEL-REVIEW.md). Les résultats globaux et le
redémarrage sont consignés dans le [registre de validation](evidence/reframe/validation.json)
de cette tranche : **583 tests passent**, avec TypeScript, lint et formatage. Les anciens tests
et la CI verte de `63f7044` ne sont pas attribués automatiquement à ce recadrage.

Aucun nouvel appel natif n’est autorisé par ce recadrage : budget clos, campagnes antérieures
arrêtées conservées. Aucun bénéfice humain comparatif ou avantage de productivité n’est déduit
des tests techniques ; l’hypothèse reste un guidage plus lisible et une continuité mieux conservée.

## Complément — espaces de conception et défilement

Après `23b7a34`, deux retours ont été traités ensemble : les étapes avant code étaient
noyées dans le bilan Parcours et les accordéons ouverts pouvaient rendre le panneau droit
impossible à parcourir. La tranche réutilise les données et l’identité existantes.

**Conception** remplace le libellé Parcours. Projet, Discovery, Cadrage, Design, Architecture
et Réalisation ouvrent un espace à la fois, dans le panneau droit ; la conversation reste
présente. Le cadrage expose résultat, périmètre, exclusions et critères enregistrés. Les
références du projet sont accessibles. Discovery affiche les hypothèses disponibles et
signale l’absence d’un espace structuré pour leurs sources et expériences, sans inventer
une étude menée.

Design possède quatre vues : directions comparables → master détaillé → écrans et états →
prototype. Pour une identité nouvelle, le skill demande trois directions du même écran,
pas trois masters complets ; un format explicitement différent et une identité déjà
approuvée restent possibles. Le prototype d’usage est distinct d’un POC technique risqué.
« Essayer ce prototype » n’apparaît que pour une révision liée existante : l’ouverture ne
l’adopte pas. Un master à réexaminer est signalé aussi dans cette vue. « Préparer » reste
une composition de demande, avec protection du brouillon ; aucune génération d’image ou
réalisation implicite n’a été ajoutée.

Liens directs de la session : [cadrage](http://127.0.0.1:4342/#journey-frame),
[design](http://127.0.0.1:4342/#journey-design),
[prototype](http://127.0.0.1:4342/#journey-design-prototype).
Les espaces et jalons sont dans l’URL. Précédent/suivant et rechargement conservent la vue ;
les onglets Code/Vérifications restent cohérents avec leur URL après navigation.

La colonne droite défile indépendamment sur ordinateur. Les critères, services et détails
ouverts agrandissent le contenu ; ils n’écrasent plus le code à hauteur nulle. Les preuves
peuvent passer sous la ligne de flottaison mais restent accessibles. Le mobile conserve
son défilement naturel. Voir [mesures avant/après](evidence/scroll/browser.json),
[capture code](evidence/scroll/backend-open-scrolled.png) et
[capture Conception](evidence/scroll/conception-design.png).

Vérification de cette tranche : **586 tests** passent, dont navigation du widget et du
shell, périmètre/exclusions et ouverture du prototype sans adoption. Build TypeScript/Vite,
lint, formatage, liens documentaires et `npm pack --dry-run` ont été contrôlés. La première
exécution des tests HTTP dans le sandbox a échoué avec `listen EPERM` ; la même suite a
ensuite passé avec l’ouverture des serveurs locaux autorisée. La revue a trouvé et corrigé
la reprise initiale du mauvais onglet, l’avertissement historique masqué dans Prototype et
le double abonnement aux événements de navigation.

Navigateur : passage Cadrage/Design, retour du prototype par historique et rechargement
vérifiés ; le prototype `336de365` ouvre bien sa révision dans l’iframe du projet principal.
Cadrage à 390 × 840 : document de 390 px, aucun débordement horizontal. Les mesures du
panneau droit tous détails ouverts sont conservées dans la trace ci-dessus. Aucun nouvel
appel fournisseur, aucune approbation, aucun changement de données applicatives pendant
ces observations. Cette tranche ne prouve ni l’exécution native autonome du parcours entier,
ni une fidélité pixel à pixel, ni une validation humaine du produit.

Revue React/Vercel : React 19, vues séparées des actions et de la navigation navigateur ;
état d’URL lu via une seule souscription externe avec nettoyage ; état serveur non recopié
dans un état local d’approbation ; rendu limité à l’espace actif ; imports directs, widget
chargé seulement à l’ouverture, liens natifs et clics modifiés conservés, focus visible,
images dimensionnées, libellés et états vides explicites. La complexité de la vue dérivés /
prototype a conduit à séparer leurs responsabilités. Pas de nouveau runtime Next/RSC,
service d’image, dépendance ou règle Vercel modifiée. Le contrôle porte sur ces surfaces,
pas sur une conformité globale, un profilage de longues listes ou un audit lecteur d’écran.

## Complément — hiérarchie et états de la référence « gg »

Référence utilisateur : `gg.png`, reçue pendant la tranche précédente. Les surfaces restent
bleu nuit ; les badges Agent sont cyan, les actions/sélections violettes, les attentes ambre,
les contrôles passés menthe et les blocages rouges. Le Studio utilise sa police sans empattement ;
le design propre de l’application n’a pas été remplacé par celui de la scène illustrative.

- **Responsabilités** : trois lignes issues de la délégation effective, sans déduire un accord
  d’un responsable. Les explications sont dépliables. Les réglages regroupent chaque libellé
  et son sélecteur : grille adaptative, aucun alignement fondé sur des espaces.
- **Colonne gauche** : décision active ou dernier résultat, contraintes compactes et historique
  replié. Sur ordinateur, la colonne et l’historique défilent ; la saisie reste ancrée en bas.
  À petite largeur, les panneaux suivent le défilement naturel avec les liens d’accès rapide.
- **Aperçu** : une barre réunit scénario/version, comparaison, largeur, ciblage, agrandissement
  et ouverture externe. Le scénario est une inspection locale : changer le scénario ne
  remplace pas le choix enregistré, n’approuve rien et ne déplace pas le focus. Les scénarios
  disponibles viennent des propositions ; aucun catalogue universel de routes n’est inventé.
- **Version affichée** : le pied et les preuves suivent son identifiant exact. La version
  appliquée reste telle même si elle était auparavant proposée ; une ancienne version dans
  « Avant » est la version de départ. Une image/simulation n’hérite jamais des tests de l’app.
  Une couverture complète n’est pas déduite d’un seul contrôle. Responsable visuel, accord
  sur le rendu ciblé et attente restent distincts.
- **Comparaison** : origine en lecture seule avec refus HTTP 405, formulaires et contrôles
  désactivés visiblement, y compris après rendu React. « Ouvrir la version appliquée » quitte
  la comparaison ; l’ouverture externe interactive conserve la révision/scénario affichés.
  L’application normale garde ses interactions. Le garde est aussi présent dans l’export.

La désactivation est générique : tous les boutons de l’application sont inactifs en comparaison,
y compris ceux qui pourraient servir uniquement à naviguer. Les liens locaux natifs et les
accordéons restent lisibles. Ce garde ne constitue pas une isolation générale d’un programme
arbitraire ; la frontière des données reste le refus d’écriture du serveur de comparaison.
Le backend embarqué reste consultable en lecture seule ; ce recadrage ne crée pas un orchestrateur
de microservices ni une exécution autonome des demandes par l’agent hôte.

Les données de démonstration restent telles que trouvées : `d7cd1dff` a été appliquée dans
l’historique par la personne, et la proposition reposant sur `336de365` est devenue périmée.
L’interface conserve ce blocage réel ; aucune validation n’a été fabriquée pour embellir la capture.
Les espaces Conception utilisent toujours les contrats existants et leurs limites documentées.

Les traces de défilement et de redimensionnement sont dans
[observations de la colonne gauche](evidence/scroll/left-browser.json).
La capture de référence de cette tranche est
[Studio sur ordinateur](evidence/scroll/studio-semantic-desktop.png).
Le défaut de débordement mobile de la barre trouvé en revue reste consigné avec sa correction,
au lieu d’être effacé des observations.

Validation finale de cet ensemble : **606 tests passent**, build TypeScript/Vite inclus,
lint et formatage sans erreur, liens documentaires valides, `npm pack --dry-run` réussi.
[Registre et empreintes du code contrôlé](evidence/scroll/validation.json).
[Contrastes mesurés](evidence/scroll/semantic-contrast.json) : toutes les paires consignées
passent 4,5:1 ; le minimum relevé est 5,44:1. Ce calcul ne certifie pas tout WCAG.

Navigateur : 1 536 × 1 024, 1 309 × 727 et 390 × 840 ; défilement de l’historique jusqu’à sa
fin, déplacement indépendant des deux colonnes, saisie visible sur ordinateur, sélecteurs
regroupés à 320 puis 600 px de largeur de discussion. Le débordement de la barre mobile
(408 px dans 368 px disponibles) a été reproduit puis corrigé à 368/368 px. L’application
prévisualisée garde ses propres règles responsive. Le ciblage d’un champ natif désactivé
nécessitait `pointerdown` en mode inspection : le défaut a été reproduit et corrigé sans
rendre ce champ modifiable. Les preuves de comparaison détaillent les essais sans écriture.

[Comparaison vérifiée dans Chrome](evidence/scroll/readonly-browser.json) : saisie refusée,
Tab ignorant les champs désactivés, focus conservé sur Avant/Version appliquée, ciblage du
champ désactivé réussi après correction, lien externe ouvrant la révision exacte avec formulaire
actif. Empreinte des données avant/après identique, quatre inscriptions et une attente conservées.
Le dry-run npm final a d’abord rencontré `EPERM` dans le cache utilisateur ; il a été relancé
avec un cache temporaire dédié, sans changement de permissions globales.
