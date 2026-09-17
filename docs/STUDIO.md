# DevMethod Studio — créer, essayer et reprendre une application locale

Studio relie une idée, ses choix, de vrais fichiers exécutés et leurs vérifications. Cette
version produit des applications React 19 / TypeScript strict et conserve le profil
HTML/CSS/JavaScript, avec données JSON locales dans les deux cas.
Elle ne fournit ni authentification, ni hébergement public, ni paiement, ni génération
d’images intégrée. Les références visuelles peuvent être importées. L’agent hôte peut
produire des images lorsqu’il dispose de cette capacité ; le CLI Studio ne la crée pas.

Un projet existant peut être [importé par copie](STUDIO-IMPORT.md), avec un contexte
sourcé, une référence conservée et une édition des sources même sans runtime compatible.
Le [catalogue Outils et services](STUDIO-CONNECTORS.md) permet de choisir et configurer
des outils de contrôle ou des services applicatifs, puis de préparer leur usage par l’agent
hôte. Il ne les installe ni ne les connecte automatiquement.

## Démarrer

Node.js 22+ est requis. Depuis une installation DevMethod :

```sh
devmethod studio --workspace /chemin/absolu/mon-produit --port 4330 --preview-port 4331
```

Depuis le dépôt, remplacer `devmethod` par `node scripts/studio.mjs` **et retirer le mot
`studio`** :

```sh
node scripts/studio.mjs --workspace /chemin/absolu/mon-produit --port 4330 --preview-port 4331
```

Choisir un dossier dédié, distinct du dépôt DevMethod, sans liens symboliques dans son
chemin. Le terminal affiche l’adresse locale ; ouvrir `http://127.0.0.1:4330/`. Le produit
s’exécute sur une origine distincte, au port 4331. Garder les mêmes ports à la reprise
préserve aussi l’origine des éventuels brouillons navigateur du produit.

Sans `--agent`, les demandes attendent un agent hôte connecté par le bridge décrit plus
bas. Aucun appel fournisseur n’est lancé. Le choix d’un mode ne connecte pas un agent.

Pour essayer le parcours **déjà enregistré** Les Ateliers depuis le dépôt, reconstruire
l’exemple dans un dossier absent ou vide, puis lancer le serveur :

```sh
node scripts/studio.mjs example --workspace /tmp/devmethod-example
node scripts/studio.mjs serve --workspace /tmp/devmethod-example
```

Sur macOS, `/tmp` étant un lien symbolique, employer son chemin réel dans les deux commandes :

```sh
node scripts/studio.mjs example --workspace /private/tmp/devmethod-example
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-example
```

Ouvrir l’adresse affichée. L’exemple restaure les versions, références, décisions, données et
contrôles enregistrés, y compris les échecs. Il ne régénère pas l’application et ne lance aucun
appel modèle. La consommation historique de 277 934 tokens et son arrêt sont conservés ;
reconstruire cet exemple ne renouvelle pas le budget. Les données de démonstration sont fictives.

## Choisir son degré de délégation

| Mode | Choix structurants | Nouvelle version de code |
| --- | --- | --- |
| Guidé | Cadrage, design sélectionné et architecture à valider | À examiner puis activer explicitement |
| DevAuto | Les mêmes choix restent à valider | Réalisation déléguée et activation automatique dans le périmètre approuvé |
| Autonome | Choix réversibles également délégués | Activation automatique ; mêmes limites et contrôles |

Ces modes donnent des valeurs par défaut. Une délégation explicite peut les préciser avec
trois responsabilités : `structure` (produit et technique), `visual` (choix visuel) et
`adoption` (activation du code), chacune confiée à `agent` ou `user`. L’agent hôte peut
enregistrer cette politique dans `project.delegation` via `/api/project` ; les trois champs
sont alors requis. Par exemple, `{ "structure": "agent", "visual": "user", "adoption":
"user" }` délègue les décisions produit et techniques tout en réservant le visuel et
l’activation. Le nom Guidé ne révoque pas cette délégation.

Si `visual` vaut `user`, choisir explicitement une proposition enregistre l’image sélectionnée
et une décision d’approbation correspondante. Importer une image, exprimer une préférence ou
laisser un agent sélectionner un identifiant ne vaut pas approbation. Le serveur refuse toute
nouvelle révision de code avant cet accord, y compris en Autonome. Sans politique explicite,
les anciens projets gardent leur comportement : aucun accord d’image indépendant n’est exigé.

Aucun mode n’autorise une dépense nouvelle, un déploiement ou un service externe. Quand un
accord requis manque, le runner reste au cadrage. Après validation, envoyer la demande de
réalisation. Modifier l’intention, les contraintes, le cadrage, la référence sélectionnée ou
la décision d’architecture invalide l’accord structurel correspondant ; une simple version
de code ne l’invalide pas. L’état expose séparément les responsabilités déléguées et les
accords enregistrés. La conversation ne révoque pas automatiquement un accord persistant :
l’agent doit réconcilier une décision rouverte avant le travail qui en dépend.

Pour le shell Studio, K a fixé la composition, le résultat visible, « Qui décide ? », les
choix révisables et les preuves par version. Après essai, l’utilisateur a rejeté l’esthétique
olive (« camouflage »). Après la proposition L, l’utilisateur a validé **M bleu nuit /
ardoise / violet**, avec trois niveaux de surface et une séparation plus lisible des blocs.
Voir la [référence et ses critères](missions/creation-experience/STUDIO-DESIGN.md).
Le design Agenda de l’application créée reste distinct de celui du shell.

## Le parcours visible

1. Décrire le projet, choisir le mode et joindre des références PNG, JPEG, WebP, texte ou
   Markdown. Sauvegarder, puis envoyer une première demande.
2. Examiner le cadrage, les propositions et les décisions. Les images sont de vrais fichiers
   de référence ; une image importée n’est pas une preuve que l’application lui est fidèle.
3. Essayer la version produite dans l’aperçu. « Prête », « active » et « vérifiée » décrivent
   des états différents. Lire la portée des contrôles : une syntaxe valide ne prouve pas
   une inscription fonctionnelle ni un rendu fidèle.
4. Sélectionner un élément du produit pour accompagner une demande d’évolution, ou décrire
   directement le changement. Le contexte de cet élément est joint à la demande.
5. Consulter les anciennes versions et leurs contrôles. Revenir au code précédent conserve
   les données métier actuelles ; cela ne restaure pas une ancienne base de données.

La vue Code lit les fichiers réels de la version examinée et compare leur texte à la version
de départ de sa demande. Elle n’invente pas de diff pour un binaire, un aperçu tronqué ou une
comparaison trop coûteuse. Depuis la version active, ouvrir « Modifier le code » pour travailler
sur un brouillon séparé.

## Comprendre le projet et exécuter ses contrôles

Dans **Code**, les vues **Fichiers / Architecture / Flux / Impact** utilisent la même version
du projet. L’explorateur classe logiquement les fichiers par couche ou fonctionnalité, sans
les déplacer. Le menu de l’analyse permet d’inclure le brouillon enregistré et de lire son
périmètre ; ses preuves restent distinctes de celles de sa base. Les fichiers du serveur qui
héberge DevMethod sont dans **Diagnostic du Studio**, séparés du backend éventuel du projet.

La carte d’architecture permet la sélection, la recherche, les filtres, le zoom, le déplacement,
la comparaison et l’export SVG. Les relations renvoient aux sources reconnues. **Flux** expose
les dépendances associées aux entrées détectées, sans inventer leur ordre d’exécution ;
**Impact** distingue modifications constatées et consommateurs potentiellement concernés.
Sans instrumentation, aucun temps de réponse ni état de service observé n’est affiché.

Dans **Vérifications**, choisir une famille puis un contrôle pour voir sa portée et ses preuves.
**Exécuter les contrôles disponibles** lance les adaptateurs pilotables sur la version
sélectionnée : syntaxe, imports relatifs, JSON, inventaire du bundle, marqueurs de secrets et
compilation React stricte lorsque le profil est compatible. L’arrêt d’une série laisse le
contrôle courant se terminer. Les résultats restent associés à leurs empreintes et à leur
environnement ; quelques réussites ne valident pas toute l’application.

Un outil non raccordé indique **Connexion nécessaire**, ses prérequis et une action pour
préparer la connexion. Un diagnostic réel propose **Préparer une correction** : version,
preuve et constat sont ajoutés au brouillon de demande, sans effacer le texte existant ni
envoyer automatiquement la demande. Le traitement suit ensuite le bridge et la délégation
du projet. Un agent hôte manuel doit effectivement prendre en charge la demande.

Le menu global reste fixe ; la discussion et le travail défilent séparément. **Focus technique**
replie la discussion tout en conservant l’accès aux décisions à examiner. Les détails,
vérifications et aperçus du brouillon sont repliables. Les limites et essais de cette tranche
sont consignés dans le [checkpoint technique](missions/creation-experience/TECHNICAL-CHECKPOINT.md).

## Modifier le code et essayer le brouillon

Les fichiers texte existants jusqu’à 256 Kio sont éditables. Les binaires et les fichiers plus
volumineux restent consultables en lecture seule. L’interface ne propose pas encore d’ajout
ou de suppression de fichiers. Avec « Aperçu automatique », une pause de saisie de 700 ms
déclenche l’enregistrement puis la vérification ; « Vérifier et actualiser » et Ctrl/Cmd+S
permettent de le demander explicitement.

Pour le **profil statique HTML/JS**, la vérification contrôle la syntaxe JavaScript et JSON,
sans exécuter le code applicatif côté serveur. Ce chemin ne fournit ni bundler, TypeScript,
validateur CSS, contrôle du JavaScript inline ni tests métier. Ses références locales
possiblement manquantes sont des avertissements heuristiques. Le **profil React** décrit
plus bas ajoute un contrôle TypeScript strict et une compilation réelle. Aucun des deux
chemins n’installe de paquets pendant la vérification.
Le navigateur exécute ensuite le brouillon sur une **troisième origine locale**, annoncée
par le runtime, avec une copie des données métier. Ces données d’essai sont conservées entre
les builds du même brouillon ; elles ne modifient pas celles du produit actif.

En cas d’erreur statique, le dernier aperçu valide reste affiché et signalé comme ancien.
Les erreurs d’exécution rapportées par l’iframe courante deviennent des diagnostics et
bloquent l’adoption dans l’interface. Un contrôle réussi ne prouve ni le besoin ni la fidélité
visuelle : les critères du projet restent à examiner. « Préparer une correction » copie
les signaux dans la zone de demande, **sans l’envoyer** ni appeler un modèle.

« Adopter cette version » crée une nouvelle révision à partir du build exact vérifié, sous
réserve des choix requis et de l’absence d’une demande agent en cours. Elle transfère le
code, pas les données d’essai. La nouvelle preuve couvre la syntaxe JS/JSON pour le profil
statique, ou le typage et la compilation pour le profil React ;
les contrôles fonctionnels des anciennes versions ne sont pas reconduits. Le brouillon
repart ensuite de cette révision.

Une écriture concurrente ou une version active changée produit un conflit : la saisie locale
reste disponible ; choisir explicitement de relire ou de reprendre la version active.
« Récupérer mes modifications » télécharge un JSON des textes du brouillon. Le brouillon
serveur persiste au redémarrage ; la copie navigateur protège les textes non acquittés
lorsque le stockage local est disponible. L’export du projet ne contient pas ce brouillon
non adopté : récupérer son JSON séparément avant une restauration ailleurs.

Le [parcours enregistré de l'éditeur](missions/creation-experience/evidence/studio/editor-journey.json)
a réellement essayé une modification du pied de page, deux erreurs récupérables et
l'adoption de la version `1aea70fe-1134-4dfa-a872-a79e3003b6aa`, sans transférer une inscription
d'essai dans les données actives. Un défaut du contrôle de syntaxe a été découvert puis
corrigé pendant cet essai. Si un ancien build doit être revérifié, relancer « Vérifier et
actualiser » : le brouillon reste conservé. Ces observations d'agent ne sont pas une
validation humaine ni une vérification complète du produit.

Les erreurs, résultats interrompus et contrôles liés à une autre révision restent visibles.
Une demande annulée ou devenue obsolète ne peut pas livrer tardivement son résultat. Un
contexte modifié pendant l’exécution empêche son adoption et conserve les fichiers de travail.
Annuler puis reformuler une demande obsolète permet de repartir du contexte courant.

## Connecter le CLI Codex existant, facultativement

L’adaptateur doit trouver `codex` sur le PATH et utilise son authentification déjà disponible :

```sh
devmethod studio --workspace /chemin/absolu/mon-produit --agent codex --max-jobs 2 --timeout-ms 300000
```

L’exécution native a été essayée sur macOS seulement. Le lancement direct ne prend pas en
charge un lanceur Windows `codex.cmd` : les contrôles d’installation Windows du Studio
utilisent le bridge, pas un appel au fournisseur. Sur cette configuration, utiliser le
bridge avec l’agent hôte ; ne pas interpréter une CI verte comme validation de l’adaptateur
natif Windows. Le Studio ne lance pas automatiquement un shell pour contourner cette limite.

Il lance une demande dans un dossier de travail avec sandbox `workspace-write`, sans réseau,
installation de paquets, plugins, recherche web ou sous-agents. Les références sont copiées
et le contexte transmis. Des skills DevMethod distribués alimentent `method.md` : ce guidage
ne transforme pas les services indisponibles en capacités du produit. L’adaptateur exécute
un contrôle de syntaxe des fichiers JavaScript livrés ; la réception d’un résultat React
passe aussi par le compilateur contrôlé. Les essais fonctionnels et visuels restent à
effectuer et à documenter. L’essai natif conservé ci-dessous portait sur le profil HTML/JS,
pas sur une génération React par cet adaptateur.

Le registre de consommation persiste dans le projet. Par défaut : au plus deux admissions,
300 secondes par appel et arrêt **entre appels** à 100 000 tokens connus. Ce seuil n’est pas
un plafond d’un appel ni une garantie financière. Un usage inconnu suspend les appels
suivants ; l’export conserve cet arrêt. Le prix monétaire reste inconnu.

L’essai natif du 16 septembre 2026 a effectué **un appel : 277 934 tokens rapportés**
(264 412 en entrée, dont 228 224 en cache, et 13 522 en sortie). Il a dépassé le seuil au cours
de cet appel ; aucun second appel natif n’a été lancé. Les corrections et l’évolution
suivantes ont utilisé l’agent de mission par le bridge. Cela prouve une exécution réelle de
cet adaptateur, pas une création autonome complète validée ni une supériorité concurrentielle.

## Utiliser le bridge avec un agent hôte

Garder le serveur lancé. Ces commandes sont destinées à l’agent, pas à la coordination
quotidienne de rôles par l’utilisateur :

```sh
devmethod studio status --workspace /chemin/absolu/mon-produit
devmethod studio claim --workspace /chemin/absolu/mon-produit --worker "Agent hôte"
devmethod studio finish --workspace /chemin/absolu/mon-produit --file /chemin/finish.json
devmethod studio check --workspace /chemin/absolu/mon-produit --file /chemin/check.json
```

`claim` renvoie `job`, `context` et `workDirectory`. Lire le contexte retourné et les références
relatives au workspace ; modifier uniquement le staging de cette demande. L’agent doit
conserver le design choisi, explorer les incertitudes utiles, exécuter ses vérifications et
rapporter leurs limites. Le bridge ne lance pas de processus fournisseur à sa place.

Le [plan et le journal d’actions](STUDIO-PROGRESS.md) peuvent être publiés au fil du travail
et repris après rechargement. Seuls les événements réellement transmis sont affichés.

Exemple de remise d’une application dont `app/index.html` et ses fichiers existent réellement :

```json
{"jobId":"identifiant-retourné","title":"Inscription persistante","summary":"Ce qui a changé et ce qui a été essayé."}
```

Le serveur calcule les empreintes et crée la révision ; l’agent ne fournit pas de faux
manifest. Un résultat de cadrage peut contenir `brief`, `decisions` et `designs` sans nouvelle
application. Les décisions de l’agent utilisent `source: "agent"`. `fail --file` accepte
`{"jobId":"…","error":"Cause observable"}`. Les champs exacts des contrôles et des résultats
sont définis dans le [contrat](missions/creation-experience/CONTRACT.md).

Le service de données du produit expose `GET /api/data` et
`POST /api/data` avec `{ "version": 1, "data": {} }`. **`{}` est le stockage initial vide** ;
l’application décide de son initialisation sans écraser un format non vide inconnu. Un
HTTP 409 signifie qu’une autre écriture est intervenue : conserver la saisie, recharger puis
réessayer sur les données fraîches. Studio ne garantit pas à lui seul les migrations ou la
préservation des formulaires de toute application générée.

## Interrompre, exporter et reprendre

Arrêter le serveur avec Ctrl+C, puis relancer la même commande et le même workspace. Les
projets, demandes, références, décisions, versions et données persistent. Une demande qui
était encore `running` à la réouverture devient `interrupted`, sans relance implicite. Après
un arrêt brutal, le verrou est conservateur : vérifier qu’aucun serveur ne l’utilise avant
une intervention manuelle sur `.devmethod/studio.lock`.

L’export de l’interface produit une archive TAR contenant code déclaré, références, état,
données actuelles, runtime autonome et compteur d’admission portable. Il exclut le token de
contrôle, les journaux fournisseur, les identifiants globaux et les dossiers de travail
inachevés. Il n’efface pas la consommation pour autoriser un nouvel essai.

```sh
devmethod studio restore --workspace /chemin/absolu/projet-restaure --file /chemin/devmethod-project.tar
devmethod studio --workspace /chemin/absolu/projet-restaure
```

La destination doit être absente ou vide. Une archive invalide est refusée avant extraction ;
les écritures passent par un dossier temporaire. Pour essayer l’application exportée sans
installer DevMethod, depuis le dossier extrait :

```sh
node launch.mjs 4399
```

Ouvrir `http://127.0.0.1:4399/`. Cette commande exécute le produit local et son stockage ; elle
ne fournit pas le Studio ni un agent. Le contrat et les fichiers sont portables ; l’exécution
de plusieurs fournisseurs n’a pas été vérifiée. Voir la [conception et ses critères de
réfutation](missions/creation-experience/PLAN.md).

## Profil React et éditeur de code

La tranche React ajoute un profil réutilisable : React 19.3, TypeScript 5.9 strict avec
`noUncheckedIndexedAccess`, Tailwind 4, primitives shadcn/Radix, sources séparées entre
`app`, `features` (vues, hooks, règles pures, services) et `shared`. Le
[template générique](../templates/studio-react/README.md) sert aux nouvelles applications ;
[Les Ateliers React](../examples/studio-ateliers-react/README.md) éprouve inscriptions,
capacité, attente FIFO et conflits sans remplacer les preuves historiques HTML/JS.

```sh
node scripts/studio.mjs example-react --workspace /chemin/absolu/absent/studio-react --delegate-technical
node scripts/studio.mjs serve --workspace /chemin/absolu/absent/studio-react --port 4342 --preview-port 4343
```

Sur ce Mac, choisir `/private/tmp` plutôt que le lien symbolique `/tmp`. `example-react`
reconstruit l’historique puis compile le portage enregistré par le vrai chemin de tâche.
Il n’appelle aucun modèle et conserve le budget natif clos. L’agent hôte reste disponible
par le bridge documenté ; cette commande ne simule pas une génération autonome.

Dans **Code**, choisir un fichier puis **Modifier le code** : Monaco apporte coloration
par extension, numéros de lignes, undo et diff. TS, TSX, JS, JSX, HTML, CSS, JSON et Markdown
possèdent une coloration dédiée ; une extension inconnue reste explicitement en texte.
Les diagnostics immédiats couvrent la syntaxe locale. La vérification serveur couvre tous
les fichiers TS/TSX de `src`, les imports supportés et la compilation réelle. Modifier un
nombre en chaîne à un emplacement typé `number` doit échouer, donner le fichier et la ligne,
et conserver le dernier aperçu valide. Le typage ne prouve ni le besoin ni tous les comportements.

Studio compile avec TypeScript, esbuild et Tailwind installés avec DevMethod. Il n’exécute
pas `vite.config`, les scripts `package.json` ni les plugins applicatifs. Le projet exporté
fournit aussi un chemin Vite autonome vérifié, avec `npm install` puis `npm run build`.
Vite seul ne fournit pas l’API `/api/data` ; le README du projet explique cette frontière.
Le profil supporte les imports React/react-dom, clsx, tailwind-merge,
class-variance-authority et @radix-ui/react-slot. Une autre bibliothèque donne un diagnostic,
sans installation silencieuse. `.mts`, `.cts` et `.jsx` ne sont pas des sources compilables
dans ce profil strict ; utiliser `.ts`/`.tsx`. La coloration de ces extensions ne signifie
pas leur compilation.

Les sources dans `revisions/<id>/app/` et les artefacts dans `compiled/` ont des manifestes
distincts. L’adoption et l’export préservent les sources TS exactes. Le runtime exporté peut
servir l’application déjà compilée avec Node 22+, sans téléchargement ni recompilation.
Les données métier restent hors du code ; changer de version ne restaure pas la base.
Les artefacts incluent `THIRD_PARTY_NOTICES.txt` : versions et licences complètes des paquets
JavaScript réellement incorporés, licence Tailwind si du CSS est produit, et notices locales
du projet. Ce fichier est vérifié et exporté avec les autres artefacts.

Next.js, React Server Components et NestJS ne sont pas exécutés par ce profil local. Ils
restent des choix d’architecture à justifier selon les besoins, pas des cases activées en
apparence. La [décision technique](ADR-017-typed-react-studio.md) distingue ces alternatives.
L’utilisateur a validé la maquette M bleu nuit et son brief pour le shell, en conservant
la composition K. La réalisation et les essais navigateur sont consignés dans la
[revue de disposition](missions/creation-experience/evidence/react-studio/LAYOUT-REVIEW.md).
Ce choix reste distinct du design Agenda de l’application Les Ateliers et des preuves de compilation.
