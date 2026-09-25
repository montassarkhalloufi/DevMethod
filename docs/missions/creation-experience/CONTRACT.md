# DevMethod Studio — contrat d’exécution v3

État documentaire au 16 septembre 2026 ; le format persistant reste `format: 1`.
[Décision initiale](../../ADR-016-local-creation-studio.md), [profil React](../../ADR-017-typed-react-studio.md)
et [guide de lancement](../../STUDIO.md).
Le contrat appartient à l’intégration ; les exécuteurs respectent ses frontières.

## Portée et deux exécuteurs disponibles

Applications locales en vrais fichiers HTML/CSS/JavaScript/assets ou en sources React/TypeScript
compilées, avec service JSON persistant. Le profil `react-ts` est déclaré dans
`package.json` sous `devmethod.profile` ; le profil statique reste disponible sans ce champ.
Ce runtime n’est ni un IDE universel, ni un hébergeur, ni un fournisseur d’auth,
de paiement ou de génération d’images. Les références raster sont importées ; celles de
la mission ont été produites par une capacité de l’hôte, distincte du CLI Studio.

- **Bridge hôte**, sans `--agent` : demandes durables consommées par un agent via CLI/HTTP.
  Le serveur ne lance pas de fournisseur. Attendre un agent est un état explicite.
- **Adaptateur Codex facultatif**, `--agent codex` : lance le CLI installé et son accès existant
  pour une demande bornée, sans plugins, réseau, recherche web, installation de paquets ou
  sous-agents. Il copie les références et le design sélectionné dans le staging et produit
  `context.json` et `method.md`. Ce dernier lit les skills distribués Foundation, Design et,
  selon la phase, Architecture ou Scoped Delivery. Ce guidage ne prouve pas l’exécution de
  toute la méthode et n’apporte pas les capacités absentes.

Une demande `running` correspond à une prise en charge réelle, `ready` à un résultat reçu.
Aucun délai visuel n’invente une construction réussie. Le profil statique contrôle la syntaxe
des fichiers `.js`/`.mjs` livrés. Le profil React contrôle TypeScript strict et compile les
sources avec TypeScript, esbuild et Tailwind de confiance ; ces contrôles ne couvrent ni
le comportement métier ni la fidélité du rendu.

## Modes, choix et approbation

| Valeur persistée | Mode visible | Choix structurants | Activation du code |
| --- | --- | --- | --- |
| `guided` | Guidé | Validation nécessaire | Explicite |
| `devauto` | DevAuto | Validation nécessaire | Automatique dans le périmètre approuvé |
| `delegated` | Autonome | Choix réversibles délégués | Automatique |

Les modes expriment des valeurs par défaut. `project.delegation`, facultatif, porte les trois
champs requis `structure`, `visual`, `adoption`, chacun égal à `agent` ou `user`. La politique
explicite prime sur le mode et reste conservée quand un ancien client `/api/project` omet
ce champ. `effectiveDelegation(state)` renvoie cette politique ou le repli historique :
structure déléguée seulement en `delegated`, visual délégué dans les trois modes, adoption
déléguée sauf en `guided`. Ce repli n’ajoute pas d’obligation d’image aux anciens projets.
Aucun mode ni champ de délégation n’étend les autorisations externes.

`planApprovalStatus(state)` retourne `{structureApproved,visualApproved,planApproved,missing,
recorded:{structure,visual}}`. Les booléens `*Approved` indiquent une frontière satisfaite
par délégation **ou** accord ; `recorded` indique uniquement l’existence de la décision
utilisateur active correspondante. `missing` contient `structure` et/ou `visual`.
`hasApprovedPlan(state)` renvoie `planApproved`, sans fabriquer d’accord humain.

Avec `visual: 'user'`, une direction existante doit être sélectionnée et une décision active
`source: 'user'`, `topic: 'visual-approval'`, `choice: selectedDesignId` doit exister.
`chooseDesign(state,{id,reason})` enregistre cette approbation et remplace l’ancienne.
Importer une référence ou proposer un design ne suffit pas. `/api/approve` refuse de
contourner ce contrôle, même si structure est déléguée ou que le mode est Autonome.

`approvePlan(state,{reason})` ajoute une décision `source: 'user'`, `topic: 'delivery-scope'`,
dont `choice` est `planApprovalKey(state)` ; l’ancienne approbation active est remplacée.
Une idée, un résultat cadré et au moins un critère sont requis. L’empreinte canonique couvre
`project.idea`, `project.constraints`, `brief`, `selectedDesignId` et le contenu des décisions
actives dont le sujet normalisé vaut `architecture`. Elle exclut identifiants techniques,
version de code, brouillon, événements et contrôles. Changer le plan invalide l’accord
structurel ; une structure déléguée ne nécessite pas d’accord utilisateur artificiel.

Si une approbation requise manque, le runner produit un cadrage seulement. `finishJob` refuse
une révision sans politique satisfaite avant **et après** les changements de cadrage/décisions
proposés, quel que soit le mode. Le bridge est soumis au même contrôle. Un résultat de cadrage
avec application de base inchangée ne crée pas de révision. `adoption: 'agent'` active une
révision reçue ; `adoption: 'user'` la conserve pour activation explicite.
Le contrôle visuel est conservateur : il bloque toute nouvelle révision de l’application,
sans analyser quels fichiers dépendent du choix visuel. Ce n’est pas encore une autorisation
granulaire permettant de livrer seulement son backend pendant cette attente.

Les consignes de cette mission délèguent produit et technique mais réservent le visuel.
Après l’accord initial K, l’utilisateur a rejeté l’olive lors de l’essai. Il a ensuite
explicitement validé la maquette M bleu nuit et son brief ; cette référence devient active
pour le shell, avec la composition K conservée. L’implémentation et les contrôles rendus
sont décrits dans la [revue navigateur](evidence/react-studio/LAYOUT-REVIEW.md) ; l’accord
sur l’image reste distinct de la portée de ces observations.
Le runtime ne révoque pas un accord persistant à partir d’une conversation ; l’agent hôte
doit réconcilier cette réouverture. Ces choix concernent le shell, pas les applications créées.

Les validations de l’interface sont des actions enregistrées, pas une preuve indépendante
de validation humaine. Une décision reçue dans le résultat d’un agent doit porter `source: 'agent'`.
Les décisions actives de même sujet remplacent les anciennes sans effacer leur contenu.

## État et fichiers

Workspace absolu dédié, distinct du dépôt DevMethod, sans liens symboliques ni traversée.
Node.js 22+ pour Studio et le runtime exporté. La distribution Studio comprend désormais
les dépendances npm de compilation et React ; elles sont installées avec DevMethod, jamais
téléchargées par un build de projet. Le runtime de consultation exporté sert les artefacts
déjà compilés avec les modules natifs de Node. Le chemin Vite autonome des sources exige
Node ≥ 22.12 et les dépendances de développement déclarées dans le projet.

| Emplacement | Rôle |
| --- | --- |
| `.devmethod/studio.json` | État canonique et version optimiste |
| `.devmethod/data.json` | Données métier, indépendantes du code |
| `.devmethod/studio.lock` | Un seul écrivain ; verrou conservateur après arrêt brutal |
| `.devmethod/runtime.json` | Adresse locale et token privé du bridge, non exportés |
| `.devmethod/agent.json` | Admissions et reçus de consommation durables |
| `.devmethod/editor.json` | Brouillon de code, version optimiste, base, changements et builds ; non exporté |
| `.devmethod/editor-preview/` | Builds du brouillon et copie isolée de données ; non exportés |
| `.devmethod/job-keys/` | Contexte enregistré à la prise en charge |
| `.devmethod/logs/` | Traces fournisseur locales, non exportées |
| `work/<jobId>/app/` | Staging modifiable d’une seule demande |
| `revisions/<revisionId>/app/` | Snapshot de fichiers avec empreintes SHA-256 |
| `revisions/<revisionId>/compiled/` | Artefacts React et notices de licences, avec manifeste distinct |
| `references/` | Fichiers importés, noms dérivés par le serveur |

```text
{format:1,version:1,
 project:{name,idea,mode:'guided'|'devauto'|'delegated',constraints:[],
   delegation?:{structure:'agent'|'user',visual:'agent'|'user',adoption:'agent'|'user'}},
 draft:'',references:[{id,name,file,mime}],
 brief:{outcome,scope:[],excluded:[],criteria:[{id,text}]},
 decisions:[{id,topic,choice,reason,status:'active'|'superseded'|'hypothesis',source:'user'|'agent'}],
 designs:[{id,title,description,file}],selectedDesignId:null|string,
 jobs:[{id,request,element:null|{selector,text},baseRevision:null|string,
   status:'queued'|'running'|'ready'|'failed'|'cancelled'|'interrupted',
   worker:null|string,createdAt,finishedAt?,summary?,error?}],
 revisions:[{id,jobId,title,summary,createdAt,files:[{path,sha256,bytes}],
   compilation?:{profile:'react-ts',protocol:'react-strict-v1',files:[{path,sha256,bytes}]}}],
 activeRevision:null|string,
 checks:[{id,revisionId,label,status:'passed'|'failed',
   kind:'command'|'agent-observation',command?,output?,createdAt}],
 events:[{id,type,text,createdAt}]}
```

`designs.file` désigne un identifiant de référence image, pas un chemin libre. `constraints`,
`scope` et `excluded` sont des tableaux de chaînes. Une révision nécessite `index.html` ;
limites actuelles : 256 fichiers, 32 Mio de code par tranche, 8 Mio par référence.

Pour une révision React, `files` décrit les sources exactes et `compilation.files` les
artefacts produits. L’aperçu sert seulement le second manifeste et vérifie les empreintes ;
la vue Code lit le premier. L’export conserve les deux ensembles. Le fichier compilé
`THIRD_PARTY_NOTICES.txt` inclut les licences complètes locales des paquets dont le JavaScript
contribue au bundle, Tailwind lorsque du CSS est produit et les notices de projet présentes
à la racine (`THIRD_PARTY_NOTICES.md` / `.txt`). Il appartient au manifeste et suit l’export.

`react-strict-v1` impose TypeScript strict et `noUncheckedIndexedAccess` aux fichiers TS/TSX
de `src`. Les sources ne peuvent pas désactiver le contrôle par directives de suppression
ou `any` explicite. `src/main.tsx` est l’entrée et `@/` désigne `src/`. La liste d’imports
est explicite : React/react-dom, clsx, tailwind-merge, class-variance-authority et
@radix-ui/react-slot. Les scripts npm, configurations Vite exécutables et plugins du projet
ne sont pas lancés. Une extension ou dépendance non supportée produit une erreur ; Next.js,
RSC et NestJS ne sont pas exécutés par ce profil. Les sources exportées proposent leur
propre chemin Vite, distinct de cette compilation contrôlée.

`createStudioStore(workspace)` retourne `{root,read(),commit(expectedVersion,mutator),close()}`.
`commit` clone, applique une mutation synchrone, valide les invariants et les transitions,
écrit atomiquement puis incrémente la version. Lectures et résultats sont des copies.
`createInitialStudioState()` et `validateStudioState(state)` sont exportés par le store.
Un état corrompu est refusé sans remplacement silencieux. Au redémarrage, les demandes
encore `running` deviennent `interrupted` ; aucun nouvel essai n’est déduit de cet état.

## Demandes et adoption

Les fonctions de domaine mutent le brouillon confié par le store : `updateProject`, `setDraft`,
`queueRequest`, `claimJob`, `failJob`, `cancelJob`, `finishJob`, `chooseDesign`, `approvePlan`,
`activateRevision`, `recordCheck`, `interruptRunningJobs`. `effectiveDelegation`, `planApprovalKey`,
`planApprovalStatus` et `hasApprovedPlan` calculent les responsabilités et accords sans mutation.

Une demande conserve son texte, son élément et sa révision de départ. Une seule peut être
`running`. Le serveur copie la base dans son staging ; le résultat contient de vrais fichiers,
pas une annonce de fichiers à créer. L’adoption est refusée si la demande est terminée,
annulée ou interrompue, si sa base n’est plus active, ou si le contexte du projet a changé
depuis la prise en charge. Les fichiers de travail restent disponibles. Le brouillon d’une
future demande n’invalide pas le résultat courant.

Un cadrage seul doit apporter au moins `brief`, des `decisions` ou des `designs`. Une
application devient une révision dont le serveur calcule les empreintes. Le code disponible,
le code actif et les contrôles sont distincts. Les anciens contrôles restent attachés à leur
révision ; ils ne deviennent pas automatiquement valides pour la suivante. Une observation
d’agent n’est jamais un contrôle indépendant ni une validation humaine.

## HTTP et CLI

Trois origines loopback séparées : Studio `127.0.0.1:4330`, produit `127.0.0.1:4331` par défaut
au CLI, et aperçu éditeur sur un port libre annoncé par `editorPreviewOrigin`. Hôte vérifié, POST navigateur de même origine, POST agent avec token privé. Aucun
endpoint navigateur n’accepte une commande shell à exécuter. 400 = invalide, 403 = origine ou
accès interdit, 404 = absent, 409 = conflit/contexte obsolète.

| Route | Requête / réponse utile |
| --- | --- |
| `GET /api/state` | État canonique |
| `GET /api/runtime` | `previewOrigin`, `editorPreviewOrigin`, mode/exécution de l’agent, limites, `delegation`, `approval`, `planApproved`, capacités ; jamais le token |
| `GET /api/source?revision=<id>&path=<chemin>` | Fichier déclaré : `{revisionId,path,content,binary,truncated,bytes,sha256}` ; lecture seule |
| `GET /api/editor?baseRevision=<id>` | Lire/initialiser le brouillon depuis la version active ; paramètre facultatif pour récupérer le brouillon existant |
| `POST /api/editor/save` | `{version,baseRevision,changes:[{path,content}]}` → brouillon enregistré |
| `POST /api/editor/build` | `{version,baseRevision}` → diagnostics et dernier aperçu valide |
| `POST /api/editor/apply` | `{version,baseRevision,title}` → `{state,revision,draft,activated,adoptionError}` |
| `POST /api/editor/reset` | `{version,baseRevision}` → nouveau brouillon explicite depuis la version active |
| `POST /api/project` | `{version,name,idea,mode,constraints,delegation?}` |
| `POST /api/draft` | `{version,text}` |
| `POST /api/requests` | `{version,request,element?}` → `{state,job}` |
| `POST /api/jobs/cancel` | `{version,jobId}` |
| `POST /api/design` | `{version,id,reason}` |
| `POST /api/approve` | `{version,reason}` |
| `POST /api/activate` | `{version,id,reason}` |
| `POST /api/references` | `{version,name,mime,base64}` → `{state,reference}` ; PNG/JPEG/WebP/texte/Markdown |
| `GET /references/<id>` | Fichier importé déclaré |
| `GET /api/export` | Bundle USTAR portable |
| `POST /api/jobs/claim` | Agent : `{worker}` → `{state,job,workspace,workDirectory,context}` |
| `POST /api/jobs/finish` | Agent : `{jobId,title,summary,brief?,decisions?,designs?}` |
| `POST /api/jobs/fail` | Agent : `{jobId,error}` |
| `POST /api/checks` | Agent : `{revisionId,label,status,kind,command?,output?}` |

Les opérations agent n’exigent pas de version du client : le serveur sérialise la mutation.
`kind: 'command'` exige la commande ; `agent-observation` ne doit pas fabriquer de commande.
Les contrôles déclarés par le bridge demeurent attribués à leur exécutant.

`/api/source` n’accepte que les chemins déclarés dans une révision connue. Il vérifie taille
et SHA-256 avant de rendre le contenu UTF-8 comme texte ; les binaires ont `content: null`.
L’aperçu textuel est borné à 256 Kio et marque sa troncature. La vue Code compare les contenus
réels avec la `baseRevision` de la demande ayant produit la révision. Elle refuse une
comparaison binaire, tronquée ou dépassant son budget de calcul ; elle n’annonce pas une
différence partielle comme complète. Cette route reste distincte des opérations d’édition.

Les routes POST éditeur exigent l’origine Studio, même si un token agent est fourni. Elles
reçoivent la version du brouillon, distincte de celle du projet. L’absence d’acquittement
n’est jamais un enregistrement réussi. `save`/`build`/`apply` refusent un brouillon ou une base
périmés en 409 sans supprimer les textes ; un build en cours exclut les écritures concurrentes.

Le CLI expose `serve` (par défaut), `example`, `status`, `claim`, `finish`, `fail`, `check`, `restore`.
Options : `--workspace`, `--port`, `--preview-port`, `--agent codex`, `--max-jobs`,
`--timeout-ms`, `--worker`, `--file`, `--help`. Il n’existe pas de commande CLI autonome
`upload`, `approve`, `export` ou de réglage CLI `--max-tokens` dans cette version : utiliser
l’interface/API pour ces opérations. `finish`, `fail`, `check` lisent un payload JSON via
`--file`. Les instructions complètes sont dans le [guide](../../STUDIO.md).

Depuis le dépôt, `node scripts/studio.mjs example --workspace /tmp/devmethod-example`, puis
`node scripts/studio.mjs serve --workspace /tmp/devmethod-example` reconstruisent et ouvrent
l’exemple enregistré. Sur macOS, utiliser `/private/tmp/devmethod-example` dans les deux
commandes : les ancêtres symboliques comme `/tmp` sont refusés. La destination doit être
absente ou vide. `example` copie les références, révisions, données et état enregistrés via
export/restauration ; aucun appel modèle n’est lancé, aucun résultat nouveau n’est simulé.
Le budget historique reste conservé, notamment les 277 934 tokens et l’arrêt d’admission.

## Édition, diagnostics et adoption

`GET /api/editor` sans base relit le brouillon existant (404 s’il n’existe pas). Avec une base,
il initialise le brouillon si nécessaire, uniquement depuis la version active ; une autre
base déjà enregistrée provoque un 409. La vue renvoyée contient notamment `version`,
`baseRevision`, `files`, `changedPaths`, `diagnostics`, `buildId`, `builtVersion`, `previewUrl`
et `criteriaToReview`. Les chemins sont validés ; 256 fichiers et 32 Mio au total au maximum.
Un texte modifié est limité à 256 Kio. `content: null` supprime un fichier côté API ; l’interface
actuelle ne propose que la modification de textes existants, sans ajout/suppression.

Un build copie les fichiers de base et applique le brouillon, puis calcule le manifeste.
Pour le profil statique, il vérifie les octets exacts des fichiers JS via stdin : `node --input-type=module --check`
pour `.js`/`.mjs`, `node --input-type=commonjs --check` pour `.cjs`. Les fichiers JSON passent
par `JSON.parse`, avec une borne globale de 10 secondes pour les contrôles. Le protocole
`node-stdin-v1` corrige un faux succès observé de `node --check FILE` sur un fichier ESM
invalide. Un ancien protocole expose `builtVersion: null` et interdit `apply` jusqu'à une
nouvelle vérification ; les textes et le dernier aperçu restent conservés.
Aucun code applicatif n’est exécuté côté serveur. L’absence de `index.html`
ou une erreur statique empêche le nouveau build ; le dernier bon aperçu reste disponible,
sans prétendre représenter les dernières saisies. Les références locales manquantes sont
heuristiques, pas des défauts certains ; un import de package non résolu invite à vérifier
l'import map et n'est pas une preuve de dépendance manquante. Aucun bundler, TypeScript,
validateur CSS, contrôle de JavaScript inline, installation ou test métier n’est fourni par
ce chemin statique. Pour `react-ts`, le build utilise au contraire `react-strict-v1`, avec
contrôle des types, compilation JS/CSS et artefacts séparés décrits plus haut. Le délai de
compilation est borné à 15 secondes ; aucune configuration exécutable du projet n’est chargée.

Le premier build réussi clone les données métier dans l’espace éditeur. Les builds suivants
du même brouillon les conservent. L’iframe exécute réellement l’application avec cette copie,
sur la troisième origine. Le capteur signale erreurs et rejets non traités ; l’interface
accepte uniquement les messages de sa fenêtre, son origine et son build courants. Ces
signaux bornés sont des observations du navigateur, pas une preuve indépendante. L’interface
bloque l’adoption lorsqu’elle a reçu une erreur ; le serveur n’atteste pas la réussite runtime.

L’interface enregistre puis vérifie après 700 ms sans saisie quand l’aperçu automatique est
actif. Elle conserve les modifications non acquittées localement, propose un JSON de secours
et impose un choix explicite pour relire un brouillon concurrent ou repartir de la nouvelle
version active. Préparer une correction renseigne le composer sans envoyer la demande.

`apply` exige le build correspondant exactement à la version courante du brouillon, des
modifications, aucun diagnostic statique d’erreur, les accords requis et aucune demande
agent queued/running. Les empreintes sont revérifiées. Le contrat de jobs crée une révision ;
son adoption explicite ne transfère pas les données d’essai. Un contrôle de syntaxe JS/JSON
est enregistré pour cette seule révision et les critères métier restent à vérifier. Aucun
ancien contrôle n’est recopié. La réponse distingue version créée, activation et éventuelle
erreur d’adoption/réconciliation ; le brouillon repart ensuite de la révision créée.

Le brouillon serveur survit au redémarrage local. L’export de projet exclut ce brouillon et
son espace d’essai : seules les versions adoptées ou remises comme révisions sont conservées.
« Récupérer mes modifications » exporte séparément les textes en JSON ; ce n’est pas un bundle
exécutable ni une preuve d’adoption. La copie navigateur et son localStorage ne sont pas exportés.

## Produit, données et sélection d’élément

L’origine produit sert les fichiers déclarés de `/revisions/<id>/<path>` et la révision
active à `/`. Les empreintes sont revérifiées à la lecture. Le parent et l’iframe vérifient
origine et fenêtre source des messages de sélection ; le mode normal laisse les interactions
métier fonctionner. Échap quitte la sélection.

`GET /api/data` retourne `{version,data}` ; état initial **`{version:1,data:{}}`**.
`POST /api/data` reçoit `{version,data}` : objet JSON, maximum 1 Mio, écriture optimiste
atomique. Un 409 préserve la base actuelle ; l’application doit conserver la saisie, recharger
et proposer un nouvel essai. Le service ne sait pas interpréter les migrations métier.
Revenir au code précédent conserve les données actuelles, pas une ancienne copie.

Studio conserve son propre brouillon. La persistance des formulaires du produit appartient
à l’application et doit être vérifiée. L’export n’emporte pas le localStorage du navigateur.

## Admission, reprise et export

Le runner limite par défaut à deux admissions, 300 000 ms par appel, et refuse un nouvel
appel dès 100 000 tokens connus. **Ce seuil est contrôlé entre appels, sans plafond dur par
appel et sans garantie financière.** Prix inconnu ; cache rapporté séparément, déjà inclus
dans les tokens d’entrée. Un reçu absent/inconnu, une interruption incomplètement comptée ou
un registre incohérent ferme l’admission. Le fichier durable n’est pas réinitialisé au restart.
Aucune relance automatique n’est faite après une admission échouée ou un résultat obsolète.

Le seul essai natif de construction de cette tranche a rapporté 277 934 tokens
(264 412 entrée, dont 228 224 cache ; 13 522 sortie), puis l’admission s’est arrêtée. Aucun
second appel natif. Les interventions suivantes ont été exécutées par l’agent de mission via
le bridge. Ne pas qualifier ce parcours de service entièrement autonome, ni le confondre
avec les campagnes comparatives historiques, qui restent closes.

L’archive contient état, code déclaré, références, données actuelles, runtime `launch.mjs`
et projection assainie du budget. Elle exclut token, credentials globaux, journaux et staging.
Un budget illisible exporte un arrêt pour usage inconnu, pas un budget neuf. La restauration
exige une destination absente ou vide, refuse liens symboliques/traversées/conflits/footer
invalide et passe par un staging avant installation. Limites actuelles : 1 500 entrées,
64 Mio de contenu à l’export. Un chemin USTAR utilise jusqu’à 100 octets pour son nom final
et, si nécessaire, un préfixe de dossier jusqu’à 155 octets ; un chemin non représentable
dans ces champs est refusé.

`node launch.mjs 4399` exécute le produit exporté avec ses données, sans DevMethod ni agent.
`devmethod studio --workspace ...` reprend l’édition. Aucun export n’établit une portabilité
multifournisseur, une migration universelle ou une sécurité de production.

## Évaluation

Le cas opérateur fictif Les Ateliers comprend inscription, filtre, capacité, annulation,
conflit récupérable, ajout d’une liste d’attente et reprise. Les critères et alternatives
sont fixés dans [PLAN.md](PLAN.md) ; les résultats et captures appartiennent aux preuves de
la mission. La réussite d’un mécanisme ne démontre ni un avantage humain, ni une supériorité
sur une bonne consigne ordinaire, BMAD, Spec Kit ou un builder commercial. Le laboratoire
historique et ses résultats négatifs restent conservés et facultatifs.
