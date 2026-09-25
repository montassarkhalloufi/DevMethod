# Studio technique — checkpoint du 17 septembre 2026

Cette tranche prolonge l’existant React et le parcours Conception. Elle répond aux trois références utilisateur Code, Architecture et Vérifications, puis aux retours sur la hauteur utile, le menu fixe et la molette. Les anciens checkpoints restent historiques. Choix techniques : [ADR-018](../../ADR-018-project-intelligence-workspace.md).

## Livré et relié aux sources

- Coque commune : Conception, Aperçu, Code, Décisions, Vérifications, Historique. Les trois modes sont dans une liste compacte ; une seule navigation reste en haut, hors défilement. Les exceptions de délégation restent effectives.
- Code : arborescence réelle classée par couche ou fonctionnalité, recherche, coloration Monaco, lecture/comparaison/édition, diagnostics, sauvegarde du brouillon et compilation contrôlée. Un sélecteur permet de revenir directement à la version appliquée pour reprendre l’édition. L’inspecteur expose les sources et les relations disponibles. « Diagnostic du Studio » reste séparé du code du projet.
- Architecture : modèle déterministe JS/TS/configuration, provenance de chaque relation, sélection, recherche, filtres, déplacement, zoom, liste accessible, comparaison et export SVG. Les positions sont conservées au rafraîchissement.
- Flux : dépendances associées aux entrées reconnues, branches d’erreur présentes dans leurs sources, liens vers le code et limites explicites. Il ne s’agit pas d’une chronologie mesurée sans instrumentation.
- Impact : ajouts, modifications, suppressions, relations connues, consommateurs potentiels, contrats et preuves à réexaminer. Aucun résultat ancien n’est transféré à la nouvelle version.
- Vérifications : catalogue extensible, familles et compteurs filtrés, version/empreinte/environnement/date/durée, attendu/observé, diagnostic source et journal. Les contrôles disponibles peuvent être lancés ensemble, séquentiellement, ou séparément. L’arrêt d’un lot se fait après le contrôle courant.
- Six adaptateurs locaux : syntaxe, imports relatifs, JSON, inventaire du bundle, marqueurs explicites de secrets, compilation React/TypeScript stricte du profil contrôlé. L’inventaire ou la syntaxe ne sont pas présentés comme tests fonctionnels complets.
- Un échec ou un outil absent prépare une demande de correction ou de connexion dans le flux DevMethod, avec son contexte exact. Le brouillon déjà saisi est conservé. Préparer la demande ne lance pas automatiquement un agent ni une commande du projet.

## Parcours réellement éprouvés

### Modifier, compiler, adopter

La copie isolée `/private/tmp/devmethod-editor-technical-qa`, sur le port 4350, provient du projet de démonstration. Dans Monaco, un code TypeScript invalide a produit 13 diagnostics et empêché l’adoption. La correction du composant `Registrations.tsx` a été enregistrée, compilée et affichée dans l’aperçu du brouillon ; l’adoption explicite a créé `cb98b65d-926c-4ce5-b882-e5bb44374c5a`. Le titre « Mes inscriptions · vérification éditeur » apparaît dans l’application interactive de cette copie. L’analyse du brouillon utilise une identité distincte et n’hérite pas des preuves de sa base.

Le SHA-256 des données de la copie avant et après adoption reste `7e5a1c94e6383910e6d583268c97fbe8ca94c0af27a7a8fd803bd40ab32e73c0`. Le projet utilisateur du port 4346 garde le même SHA et sa version active `d7cd1dff-4985-46ea-abbc-40bdc930346e`.

### Molette, espace et navigation

Le défaut de molette a été reproduit : un panneau intérieur sans débordement avait `overscroll-behavior: contain` et retenait les gestes destinés au conteneur extérieur. Après correction, la colonne droite passe réellement de 0 à 692 puis 2293 px sur Qualité. Conception, Flux, Impact, explorateur et inspecteur défilent également ; aucun handler global ne détourne la molette. [Mesures avant/après](evidence/technical/scroll-browser.json).

Sur un viewport DOM 1562 × 762, l’en-tête mesure 56 px ; le code dispose d’environ 495 px de hauteur et la zone centrale de 532 px. Les coordonnées des onglets restent identiques entre les six vues. Aux petits écrans, l’en-tête comporte deux lignes et la navigation défile horizontalement sans élargir la page. [Code](evidence/technical/code-layout-browser.json), [navigation](evidence/technical/shell-navigation-browser.json), [revue des vues](evidence/technical/model-views-compact-review.json).

Un défaut de la grille Focus plaçait le contenu dans une colonne de largeur nulle ; il a été corrigé et contrôlé. Un clic de diagnostic sur une première ouverture asynchrone perdait sa ligne : la position est maintenant différée jusqu’au montage visible de Monaco. Le diagnostic de la fixture négative ouvre réellement la ligne 5 et focalise le code.

Pendant l’essai du défaut Focus, un clic a changé accidentellement le mode du port 4346 en DevAuto. Il a été remis à son mode Autonome initial via l’interface ; l’historique est conservé, les trois responsabilités et les données métier n’ont pas été modifiées.

### Projets représentatifs et preuves négatives

- Port 4348 : fixture clairement identifiée, sources React/Express/PostgreSQL/Zod analysées sur deux versions. La carte montre les sources réelles, sans prétendre que ses services ont été démarrés. Les modifications incluent créations et suppression. [Parcours détaillé](evidence/technical/model-views-browser.json).
- Port 4352 : fixture de source invalide importée dans un instantané immuable pour éprouver le diagnostic. La livraison React normale avait correctement refusé cette source. Le contrôle exécuté par le Studio a détecté la vraie erreur TS1110 de `src/registration.ts:5`, sur `09ca76c6`. Aucun résultat d’échec n’a été injecté. [Preuve](evidence/technical/quality-failure-browser.json).
- Port 4350 : contrôles réels et raccord vers une demande sur la copie isolée. Les résultats de l’ancienne base restent historiques ; ils ne valident pas silencieusement `cb98b65d`.

## Captures natives de l’application

Les captures ne sont pas des images générées ni retouchées. Elles ont un viewport de 1563 × 762 pixels côté PNG, un pixel différent de la mesure DOM conservée dans les rapports.

- [Code](evidence/technical/code.png)
- [Code modifiable — copie de validation](evidence/technical/code-editable.png)
- [Architecture](evidence/technical/architecture.png)
- [Vérifications avec échec réel](evidence/technical/quality-failure.png)
- [Détail du diagnostic](evidence/technical/quality-failure-detail.png)
- [Flux](evidence/technical/flow.png), [Impact](evidence/technical/impact.png)

Les proportions sont adaptées au viewport réel, plus bas que les références. La présentation reproduit leur organisation, avec des données factuelles : aucune base, aucun service e-mail, aucune branche Git ni aucun compteur n’est ajouté pour remplir une maquette.

## Validation et limites

La suite complète a passé **683/683 tests**, incluant le typage et la compilation. Après l’extraction finale du sélecteur de version dans son propre composant, les 13 tests du workbench et le build ont été rejoués avec succès. ESLint, Prettier, les liens documentaires et `git diff --check` passent. Le paquet local final a réussi le smoke test : installations hôtes, démarrage sans dépendances de projet, édition/adoption, compilation React stricte avec dépendances, conservation des données, redémarrage et export/restauration. Aucune publication ni requête fournisseur. [Bilan et sorties](evidence/technical/delivery-validation.json).

Ces contrôles du Studio ne sont pas des preuves que tous les projets créés sont corrects. Le chargement à la demande de l’analyse a corrigé la régression du démarrage d’un paquet sans `node_modules` ; dans cet environnement, une analyse nécessitant TypeScript annonce explicitement son prérequis.

Limites explicites :

1. L’analyse sémantique couvre les formes JS/TS et configurations reconnues, pas tous les langages ni les appels dynamiques. Les imports externes npm ne deviennent pas des microservices. La détection de dépendances ne prouve pas l’absence d’impact inconnu.
2. Les flux déduits du code n’ont pas de durée de production. Aucun collecteur universel ni démarrage automatique des backends/microservices n’a été ajouté. Les services déclarés, sources détectées et observations restent séparés.
3. Les six contrôles pilotables sont bornés. Un runner de tests, Lighthouse, k6, un collecteur de traces ou un pipeline de déploiement non raccordé reste une capacité à connecter, avec une raison et une demande préparée. Le Studio n’exécute pas les scripts arbitraires d’un projet sous couvert d’un bouton de test.
4. Le compilateur d’édition est le profil React/TypeScript contrôlé. Les configurations serveur et dépendances backend ne sont pas lancées automatiquement ; elles restent éditables et analysables dans les sources du projet.
5. Le ciblage aperçu → source indique son absence de mapping fiable lorsque le projet n’en fournit pas. Les tests associés par import ne sont ni tous les tests possibles ni des tests réputés réussis.
6. L’agent hôte reste manuel sur les instances de démonstration. La demande de correction est durable après envoi, mais le Studio ne lance pas un agent déconnecté. Le budget natif précédent reste clos.
7. Les diagnostics locaux de Monaco ne remplacent pas le contrôle du projet : la fixture négative a été détectée par le compilateur serveur même en l’absence de marqueurs locaux. L’éditeur annonce « aucun diagnostic local reçu », jamais une validation globale déduite de cette absence.

## Reprise locale

Studio utilisateur : `http://127.0.0.1:4346/`, workspace `/private/tmp/devmethod-reframe-demo`, aperçu 4347. Instance précédente 4342 conservée. Ne pas écraser les projets de démonstration pour aligner artificiellement une capture ; les propositions devenues obsolètes restent à réexaminer.

```sh
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-reframe-demo --port 4346 --preview-port 4347
```

Vérifier d’abord le serveur existant et son verrou ; aucun second écrivain. Ne pas ajouter `--agent codex`. Aucune fusion, publication npm ou mise en ligne n’est comprise dans cette livraison.

## Finitions des panneaux — 17 septembre 2026

Les dossiers physiques sont désormais la vue par défaut de l’explorateur. Les classements par couche et fonctionnalité restent optionnels. Le tri place les dossiers avant les fichiers ; chaque niveau ajoute 16 px, avec colonnes chevron/icône/libellé alignées, types de fichiers identifiés et chemin complet en infobulle. La recherche ne détruit pas les replis de l’arbre.

La bordure explorateur/code est redimensionnable à la souris et au clavier (flèches, Maj, Début/Fin, réinitialisation par Entrée ou double-clic). Sa largeur est mémorisée localement, bornée entre 160 et 420 px et contrainte pour laisser au moins 260 px au code. Aux petits écrans, les zones s’empilent et la poignée disparaît.

À gauche, l’historique et la saisie disposent de poignées de hauteur et de boutons −/réinitialiser/+. Leurs préférences sont locales. Le contenu défile dans une zone distincte du formulaire : agrandir le message ne recouvre plus l’historique. La carte de décision laisse le défilement rejoindre sa colonne après son propre contenu. Le mobile conserve le défilement de page et les commandes par bouton.

Les menus source isolent désormais leur empilement de Monaco. Ouvrir un menu ferme le précédent ; un clic extérieur ou Échap le ferme, avec retour du focus au déclencheur pour Échap. Les menus longs restent défilables.

Vérification sur la copie isolée du port 4354 : glisser réel de l’explorateur de 230 à 360 px, bornes clavier 160/420, conservation après rechargement à 364 px, recherche puis retour aux 25 fichiers, indentation mesurée proche de 16 px. Le message a été agrandi par glisser de 52 à 152 px et conservé au rechargement. La colonne gauche a défilé jusqu’à 488 px depuis la carte, sans recouvrir le formulaire. À 390 px, aucune largeur de page excédentaire et poignée d’explorateur masquée. Les menus passent au premier plan ; fermeture exclusive et Échap vérifiés. Aucune écriture métier effectuée pendant ces essais.

- [Capture de l’explorateur redimensionnable](evidence/technical/explorer-resizable.png)
- [Capture du menu source](evidence/technical/source-menu-layer.png)
- [Mesures navigateur](evidence/technical/panel-polish-browser.json)

La suite complète finale passe **702/702 tests** ; typage, build, ESLint et Prettier passent. Le premier lancement sandboxé de la suite a échoué sur les serveurs HTTP locaux (`listen EPERM`) ; l’exécution autorisée avec sockets locales a réussi. La revue indépendante a trouvé le piège de molette de la carte de décision, corrigé puis revérifié dans le navigateur. Le smoke test de paquet du checkpoint précédent n’a pas été répété pour cette tranche UI.

Le raccord d’outils libres a été étudié, sans installation ni nouvel adaptateur dans cette tranche. Priorités proposées : ESLint contrôlé pour les diagnostics, dependency-cruiser pour cycles et frontières, Knip pour les éléments inutilisés, OSV Scanner pour les vulnérabilités connues. Leurs résultats doivent être rattachés à l’empreinte/version contrôlée, à l’outil et sa configuration, puis alimenter une demande de correction et une nouvelle exécution. Les coûts réels nécessitent des mesures fournisseur/runtime ; ils ne se déduisent pas du graphe de dépendances.
