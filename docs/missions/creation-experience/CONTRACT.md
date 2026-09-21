# DevMethod Studio — contrat d’exécution v4

État documentaire au 21 septembre 2026, comportement de `b1ecb82` ; le format persistant reste `format: 1`.
[Décision initiale](../../ADR-016-local-creation-studio.md), [profil React](../../ADR-017-typed-react-studio.md)
et [guide de lancement](../../STUDIO.md). Cette version intègre les
[candidats supervisés](../../ADR-030-studio-candidate-supervision.md),
[l’adoption examinée](../../ADR-032-reviewed-local-adoption.md) et la
[vérification navigateur locale](../../ADR-033-local-browser-verification.md).
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
  pour une demande bornée, sans plugins, réseau direct, installation de paquets ou
  sous-agents. Les outils MCP sélectionnés peuvent être exposés par le pont Studio dédié
  au job ; le broker conserve ses permissions exactes `allow/ask/deny`. Le processus ne
  reçoit aucun pouvoir d’approbation et ne doit pas répéter un effet externe inconnu. Il copie les références et le design sélectionné dans le staging et produit
  `context.json` et `method.md`. Ce dernier lit les skills distribués Foundation, Design et,
  selon la phase, Architecture ou Scoped Delivery. Ce guidage ne prouve pas l’exécution de
  toute la méthode et n’apporte pas les capacités absentes.

Une demande `running` correspond à une prise en charge réelle, `ready` à un résultat reçu.
Aucun délai visuel n’invente une construction réussie. Le profil statique contrôle la syntaxe
des fichiers `.js`/`.mjs`/`.cjs` livrés. L’admission contrôle aussi les documents JSON
et les scripts JavaScript inline des fichiers HTML, sans les exécuter. Le profil React contrôle TypeScript strict et compile les
sources avec TypeScript, esbuild et Tailwind de confiance ; ces contrôles ne couvrent ni
le comportement métier ni la fidélité du rendu.

## Modes, choix et approbation

| Valeur persistée | Mode visible | Choix structurants | Délégation d’adoption par défaut |
| --- | --- | --- | --- |
| `guided` | Guidé | Validation nécessaire | Utilisateur |
| `devauto` | DevAuto | Validation nécessaire | Agent, dans le périmètre approuvé |
| `delegated` | Autonome | Choix réversibles délégués | Agent |

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
avec application de base inchangée ne crée pas de révision. La délégation d’adoption ne
constitue pas une preuve de réussite : le runner natif, l’éditeur et la reprise locale
appellent `jobs.finish(input, {deferActivation:true})`, option interne distincte du payload
worker. Ils conservent un candidat avant examen ou décision de contrôle. Le chemin bridge
historique sans cette option conserve l’activation sous `adoption:'agent'`, uniquement si
l’admission technique réussit et hors profil `source-only` ; `adoption:'user'` conserve le
candidat. Cette différence de parcours ne doit pas être présentée comme une supervision
métier générale de toutes les livraisons.
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
| `.devmethod/agent-settings.json` | Accès confirmé et limites de configuration locale, non exportés |
| `.devmethod/agent.json` | Admissions et reçus de consommation durables |
| `.devmethod/quality/` | Reçus qualité validés, exportés avec leur provenance et portée |
| `.devmethod/browser.json` | Autorisation locale, canal, consentement automatique, version et identité ; non exportés |
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
 project:{name,idea,mode:'guided'|'devauto'|'delegated',constraints:[],expectedProfile?:'react-ts'|'static',
   delegation?:{structure:'agent'|'user',visual:'agent'|'user',adoption:'agent'|'user'}},
 draft:'',references:[{id,name,file,mime}],
 brief:{outcome,scope:[],excluded:[],criteria:[{id,text}]},
 decisions:[{id,topic,choice,reason,status:'active'|'superseded'|'hypothesis',source:'user'|'agent',review?}],
 designs:[{id,title,description,file}],selectedDesignId:null|string,
 jobs:[{id,request,element:null|{selector,text},baseRevision:null|string,
   status:'queued'|'running'|'ready'|'failed'|'cancelled'|'interrupted',
   worker:null|string,createdAt,finishedAt?,summary?,error?,correction?,recovery?,control?}],
 revisions:[{id,jobId?,origin?,profile?,title,summary,createdAt,files:[{path,sha256,bytes}],
   compilation?:{profile:'react-ts',protocol:'react-strict-v1',files:[{path,sha256,bytes}]}}],
 activeRevision:null|string,
 checks:[{id,revisionId,label,status:'passed'|'failed',
   kind:'command'|'agent-observation'|'runtime-observation',command?,output?,executor?,protocol?,fingerprint?,createdAt}],
 events:[{id,type,text,createdAt}]}
```

Cette projection résume les champs utiles à ce parcours ; les validations de domaine
restent la référence pour les champs optionnels de propositions, design et import.

`designs.file` désigne un identifiant de référence image, pas un chemin libre. `constraints`,
`scope` et `excluded` sont des tableaux de chaînes. Une révision exécutable nécessite `index.html` ; le profil importé `source-only` conserve
des sources sans imposer cet aperçu ni exécuter les scripts du projet. Limites actuelles : 256 fichiers, 32 Mio de code par tranche, 8 Mio par référence.

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
pas une annonce de fichiers à créer. La livraison est refusée si la demande est terminée,
annulée ou interrompue, si sa base n’est plus active, ou si le contexte du projet a changé
depuis la prise en charge. Les fichiers de travail restent disponibles. Le brouillon d’une
future demande n’invalide pas le résultat courant.

Un cadrage seul doit apporter au moins `brief`, des `decisions` ou des `designs`. Une
application devient une révision dont le serveur calcule les empreintes. Le code disponible,
le code actif et les contrôles sont distincts. Les anciens contrôles restent attachés à leur
révision ; ils ne deviennent pas automatiquement valides pour la suivante. Une observation
d’agent n’est jamais un contrôle indépendant ni une validation humaine.

### Admission et adoption locale examinée

Les reçus d’admission utilisent `executor:'studio'` et un protocole explicite :
`studio-javascript-syntax-v1`, `studio-document-syntax-v1`, ou `react-strict-v1` selon
les fichiers. Une déclaration de commande par un agent ne satisfait pas ce verrou.
Un échec de compilation React conserve les sources du candidat sans fabriquer d’artefacts
valides. Une admission réussie atteste seulement son périmètre technique.

L’action « Utiliser cette version », depuis l’historique ou après préparation dans
l’éditeur, ouvre le même examen : révision exacte, preuves fraîches, admission, risques,
inconnues et interventions. `readActivationReview` retourne une `reviewKey` stable du
contexte examiné. `activateReviewedRevision` exige `{version,id,reviewKey,reason}`, relit
preuves, sources, délégations et configurations d’outils/navigateur, puis effectue un commit
CAS. Un changement pertinent, même hors compteur principal, refuse l’ancien examen en 409.
Actualiser l’examen ne confirme pas l’adoption ; la personne doit agir de nouveau.

L’intégrité des sources et l’admission restent obligatoires. Le profil `source-only` conserve
son verrou de cadrage pour adopter une évolution. Une adoption locale peut consigner un arrêt
agent ou des preuves métier absentes ; elle ne les transforme pas en réussite et ne relance
ni fournisseur ni budget. La décision « Version active » porte un résumé `review` structuré
et borné, réservé à `source:user` : révision, empreintes, clé, motifs, inconnues, risques,
preuves et interventions examinées. Les décisions anciennes restent lisibles. Le worker
ne peut ni appeler l’adoption utilisateur ni forger ce résumé dans sa livraison.

Le runner enregistre un contrôle après livraison et vérification éventuelle. Un candidat
non résolu suspend les demandes suivantes. L’écartement explicite conserve candidat et
preuves ; la correction automatique reste limitée à un échec technique attribuable et à
une tentative, sous délégation, contexte, permissions et budget valides. Un échec métier
n’autorise pas à lui seul une correction fournisseur. `job.control` est une décision
historique immuable ; les décisions ultérieures restent séparées.

## HTTP et CLI

Trois origines loopback séparées : Studio `127.0.0.1:4330`, produit `127.0.0.1:4331` par défaut
au CLI, et aperçu éditeur sur un port libre annoncé par `editorPreviewOrigin`. Hôte vérifié, POST navigateur de même origine, POST agent avec token privé. Aucun
endpoint navigateur n’accepte une commande shell à exécuter. 400 = invalide, 403 = origine ou
accès interdit, 404 = absent, 409 = conflit/contexte obsolète.

| Route | Requête / réponse utile |
| --- | --- |
| `GET /api/state` | État canonique |
| `GET /api/runtime` | `previewOrigin`, `editorPreviewOrigin`, mode/exécution de l’agent, limites, `delegation`, `approval`, `planApproved`, contrôle et statut `agent.verification` éventuel ; jamais le token |
| `GET /api/source?revision=<id>&path=<chemin>` | Fichier déclaré : `{revisionId,path,content,binary,truncated,bytes,sha256}` ; lecture seule |
| `GET /api/editor?baseRevision=<id>` | Lire/initialiser le brouillon depuis la version active ; paramètre facultatif pour récupérer le brouillon existant |
| `POST /api/editor/save` | `{version,baseRevision,changes:[{path,content}]}` → brouillon enregistré |
| `POST /api/editor/build` | `{version,baseRevision}` → diagnostics et dernier aperçu valide |
| `POST /api/editor/apply` | `{version,baseRevision,title}` → `{state,revision,draft,prepared:true,activated:false}` ; préparation seulement |
| `POST /api/editor/reset` | `{version,baseRevision}` → nouveau brouillon explicite depuis la version active |
| `POST /api/project` | `{version,name,idea,mode,constraints,delegation?,expectedProfile?}` |
| `POST /api/agent/probe` | Vérifie disponibilité et type d’accès existant, sans lancer de job |
| `POST /api/agent/configure` | `{version,access,enabled,maxJobs,maxTokens,timeoutMs}` ; utilisateur seulement, limites historiques conservées |
| `GET /api/jobs/progress?jobId=<id>` | Progression reçue pour la demande |
| `POST /api/draft` | `{version,text}` |
| `POST /api/requests` | `{version,request,element?}` → `{state,job}` |
| `POST /api/jobs/cancel` | `{version,jobId}` |
| `POST /api/design` | `{version,id,reason}` |
| `POST /api/approve` | `{version,reason}` |
| `GET /api/activation-review?revision=<id>` | `{version,revision,activeRevision,reviewKey,canActivate,admission,control}` |
| `POST /api/activate` | `{version,id,reviewKey,reason}` → `{state}` ; utilisateur seulement |
| `POST /api/control/discard` | `{version,jobId,reason}` ; utilisateur seulement |
| `POST /api/jobs/recover-work` | `{version,jobId}` ; reprise locale sans fournisseur ni activation |
| `GET /api/project/checks?revision=<id>` | Catalogue, reçus, fraîcheur et disponibilité des contrôles |
| `POST /api/project/checks/run` | `{revisionId,checkId}` ; exécute un adaptateur local du catalogue |
| `GET /api/project/browser` | Configuration navigateur locale et disponibilité du pilote |
| `POST /api/project/browser/configure` | `{version,enabled,channel,automatic?}` ; utilisateur seulement, ne lance rien |
| `POST /api/runtime/observations` | `{revisionId,message,file,line}` ; signal négatif non attesté, utilisateur seulement |
| `POST /api/references` | `{version,name,mime,base64}` → `{state,reference}` ; PNG/JPEG/WebP/texte/Markdown |
| `GET /references/<id>` | Fichier importé déclaré |
| `GET /api/export` | Bundle USTAR portable |
| `POST /api/jobs/claim` | Agent : `{worker}` → `{state,job,workspace,workDirectory,context}` |
| `POST /api/jobs/finish` | Agent : `{jobId,title,summary,brief?,decisions?,designs?}` |
| `POST /api/jobs/fail` | Agent : `{jobId,error}` |
| `POST /api/checks` | Agent : `{revisionId,label,status,kind,command?,output?}` |

Les opérations agent n’exigent pas de version du client : le serveur sérialise la mutation.
`kind: 'command'` exige la commande ; `agent-observation` ne doit pas fabriquer de commande.
Les contrôles déclarés par le bridge restent non attestés : le champ `executor` est réservé
au runtime et ne peut pas être fourni par l’appelant. Une observation iframe persistée est
uniquement `runtime-observation`/`failed`, sans `executor`, dédupliquée et bornée.

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

Le CLI expose l’accueil `home` (par défaut sans workspace), `serve` (par défaut avec workspace),
`example`, `example-react`, `import`, `status`, `claim`, `finish`, `fail`, `check`, `progress`,
`restore`, `connectors`, `connector-probe`, `connector-result`, `guide-request`,
`guide-responses` et `mcp tools|call|actions`. Options selon la commande : `--workspace`, `--source`,
`--dry-run`, `--delegate-technical`, `--port`, `--preview-port`, `--agent codex`, `--max-jobs`,
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
base déjà enregistrée provoque un 409, sauf réconciliation du candidat préparé devenu actif. La vue renvoyée contient notamment `version`,
`baseRevision`, `files`, `changedPaths`, `diagnostics`, `buildId`, `builtVersion`, `previewUrl`,
`preparedRevisionId`
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
bloque la préparation lorsqu’elle a reçu une erreur ; ces signaux du brouillon restent
en mémoire et distincts des observations persistées d’une révision. Leur absence n’atteste
pas la réussite runtime.

L’interface enregistre puis vérifie après 700 ms sans saisie quand l’aperçu automatique est
actif. Elle conserve les modifications non acquittées localement, propose un JSON de secours
et impose un choix explicite pour relire un brouillon concurrent ou repartir de la nouvelle
version active. Préparer une correction renseigne le composer sans envoyer la demande.

`apply` conserve son nom de route mais prépare une version immuable sans l’adopter. Il exige
le build exact du brouillon, des modifications, aucun diagnostic statique d’erreur, les accords
requis pour le code et aucune demande queued/running. Les empreintes sont revérifiées ; les
contrôles d’admission réels sont exécutés par `jobs.finish` avec `deferActivation:true`.
Le même candidat est réutilisé pour les mêmes octets tant que son intégrité est conservée.
Pour `source-only`, un snapshot peut être préparé sans simuler de contrôle ; l’adoption reste
soumise au cadrage. Le bouton « Préparer et examiner » ouvre ensuite l’examen commun.

Fermeture, refus ou contexte périmé conservent le brouillon et l’ancienne version active.
Après adoption, la relecture de l’éditeur compare son dernier contenu au candidat adopté,
conserve les modifications sauvegardées entre-temps et réinitialise les contrôles du
brouillon. L’interface préserve aussi les saisies locales non acquittées pendant cette
relecture. Les sources du candidat restent immuables et les données d’essai ne sont pas
transférées aux données applicatives.

Le brouillon serveur survit au redémarrage local. L’export de projet exclut ce brouillon et
son espace d’essai : seules les versions adoptées ou remises comme révisions sont conservées.
« Récupérer mes modifications » exporte séparément les textes en JSON ; ce n’est pas un bundle
exécutable ni une preuve d’adoption. La copie navigateur et son localStorage ne sont pas exportés.

## Qualité, navigateur et contrôle de l’exécution

Le catalogue et les reçus sont lus pour une révision précise. Les reçus locaux conservent
la provenance `studio-adapter`, l’empreinte de sources, l’outil, l’environnement, les dates,
les résultats et les limites ; les rapports externes restent attestés par leur hôte,
sans acquérir la confiance d’une exécution locale. Le graphe déduplique le reçu qualité et
son éventuel contrôle historique `linkedCheckId`. Un succès technique ne couvre aucun
critère métier. Modifier les critères périme la preuve métier concernée, pas le reçu
technique d’une révision immuable. Des sources altérées invalident les preuves dépendantes.
Un reçu `running` dont l’exécuteur n’est plus actif devient `blocked` à la lecture.

Le contrôle navigateur utilise le pilote optionnel `playwright-core` 1.63.0 avec Chrome ou
Edge installé localement. Le [protocole](../../STUDIO-BROWSER-CHECKS.md) décrit le manifeste
borné `devmethod.browser.json` : actions et assertions déclaratives, cibles accessibles ou
test-id, données synthétiques et `{{nonce}}`. Aucun script de test arbitraire n’est exécuté
côté Node. Le pilote utilise un processus et des contextes vierges, une copie exacte du
candidat et des données vides distinctes par scénario. Un redémarrage de scénario conserve
ces données d’essai ; les assertions sur le stockage ne dépendent pas du DOM. Le réseau est
restreint par le pilote à l’origine du runtime ; ce n’est pas une garantie d’isolation OS.

`enabled` autorise le lancement explicite depuis Vérifications. `automatic`, distinct et
`false` par défaut, autorise la vérification des prochains candidats du runner natif ; il
exige `enabled:true`. Enregistrer ce réglage ne démarre ni navigateur ni fournisseur et
ne rattrape aucun ancien candidat. L’identité aléatoire et le compteur de configuration,
le canal et la version du pilote lient chaque reçu à son contexte local. Les configurations
anciennes sans identité restent lisibles mais exigent un réenregistrement explicite avant
exécution ; leurs reçus restent à réévaluer. Un ancien client qui omet `automatic` ne peut
pas déduire ce consentement.

Après `jobs.finish(...,{deferActivation:true})`, le runner peut vérifier le candidat
exact avant de calculer son contrôle final. Il revalide contexte, base active, admission,
configuration et état des actions outils avant et pendant ce contrôle. Annulation,
révocation, contexte changé ou résultat tardif empêchent une réussite exploitable et
conservent le candidat. La vérification locale peut terminer après épuisement du budget
fournisseur connu ; elle ne crée aucune nouvelle admission et ne lève pas un usage inconnu.
Le statut `agent.verification` expose job, révision, progression et reçu éventuel. L’interface
rafraîchit les preuves de cette révision et empêche les lancements manuels concurrents.

Les assertions réellement exécutées, leur protocole, leurs résultats et leurs limites
sont consultables. Les `reportedCriterionIds` restent déclaratifs. L’examen explicite de
couverture ([ADR 034](../../ADR-034-reviewed-business-coverage.md)) permet de relier un critère
à des scénarios entiers, avec conclusion, périmètre et justification. La décision `coverage`,
de source utilisateur, reste distincte du reçu. Seule une appréciation suffisante, actuelle,
adossée à un reçu local réussi et des assertions complètes, contribue aux `criterionIds`
effectifs du graphe. Une appréciation partielle, négative, remplacée ou périmée ne couvre pas
le critère. Un succès seul ou l’adoption locale n’établit jamais cette couverture.

`GET /api/coverage-review?revision=…&receipt=…` expose critères, étapes, résultats, limites,
appréciations et clé du contexte. `POST /api/coverage-review` accepte exactement
`{version,revisionId,receiptId,reviewKey,criterionId,scenarioIds,conclusion,scope,reason}`,
retourne `{state,decision}`, et exige une relecture serveur et le CAS. Une à six sélections,
conclusion `sufficient|partial|irrelevant`, périmètre non vide de 2 000 caractères maximum,
justification non vide de 4 000 caractères maximum ; corps borné à 16 Kio. Worker refusé,
Host/origine contrôlés. Erreurs : 400 pour entrée invalide, 404 pour version/reçu absent,
409 pour contexte périmé ou reçu incompatible. L’écriture ne réveille pas le runner et ne
change ni version active, ni permissions, ni budget. Les décisions et reçus sont exportés ;
la configuration navigateur absente après restauration invalide leur couverture effective.

Le contrôle courant et ses interventions reflètent cette appréciation sans réécrire les
anciens `job.control`. Une appréciation locale n’est pas une garantie exhaustive ni, si
elle est automatisée, une intervention humaine.

L’examen des conséquences ([ADR 035](../../ADR-035-reviewed-local-consequences.md)) présente
la candidate et sa base, les fichiers changés, les indices textuels positifs, le résumé des
données sans leurs valeurs, les preuves et les limites. L’absence d’indice ne prouve pas
l’absence d’impact. `GET /api/intervention-review?revision=…` retourne ces éléments, le
contrôle, les appréciations historiques, `canReview` et une `reviewKey`.
`POST /api/intervention-review` accepte uniquement
`{version,revisionId,reviewKey,resolution,assessment:{persistentData,contractChanged},scope,reason}`.
Chaque appréciation vaut `affected|not-affected|unknown`, la résolution
`accept-local|keep-stopped`. Aucune valeur n’est présélectionnée dans le formulaire.
Périmètre et justification non vides, respectivement limités à 2 000 et 4 000 caractères ;
corps borné à 16 Kio. Réponse `{state,decision}` ; 400 forme invalide, 404 version absente,
409 contexte périmé, incomplet ou appréciation incompatible, 403 worker/origine/Host refusés.

L’acceptation exige deux appréciations connues et refuse « non concerné » face à un indice
positif ; des données non vides constituent un indice de persistance. Sources/base,
données exactes, workspace, cadrage, délégations, preuves et configurations lient le
contexte. Le serveur le relit avant le commit CAS et capture lui-même les observations
historiques bornées, sans accepter de preuve fournie par le client. La décision structurée
`intervention`, de source utilisateur, remplace l’avis actif pour cette candidate en
conservant l’ancien. Les sujets réservés de couverture et conséquences exigent cet examen
structuré avant toute nouvelle supersession, y compris depuis une proposition préexistante.
Les anciennes décisions libres restent lisibles.

Le risque garde ses inconnues factuelles et facteurs ; `reviewedUnknowns` et
`acceptedFactors` distinguent ce qui a été apprécié localement. Seule une acceptation
actuelle peut lever l’arrêt pour conséquences ; elle ne lève aucun autre verrou de
qualité, outils, budget ou interruption. `keep-stopped` reste effectif pour cette candidate,
même après péremption du contexte, jusqu’à remplacement explicite. Une restauration ailleurs
conserve l’historique mais impose un nouvel examen. Le POST ne réveille pas l’agent, n’adopte
pas de version et ne remet pas le budget à zéro. L’examen seul n’exécute pas une recommandation
`continue/activate`.

Après livraison et vérification, le runner conserve son verdict historique puis relit le
contrôle courant avant d’appliquer une candidate autorisée. L’action locale « Appliquer
selon les contrôles » utilise la même transition pour une candidate déjà conservée, sans
réveiller le fournisseur. Sources, preuves, base, données, délégation, outils et disponibilité
sont relus ; la demande doit être `ready`, sa base encore active et aucun autre travail en
exécution. Consommation inconnue, budget clos, interruption, arrêt maintenu, écartement ou
preuve périmée interdisent l’application. Les profils `source-only` en sont exclus.

`POST /api/control/apply` accepte seulement `{version,revisionId}` (4 Kio). Réponse 200
`{state,applied,decision}` ; 400 forme invalide, 404 candidate absente, 409 version/contexte
périmé ou contrôle défavorable, 403 worker/origine/Host non autorisés. Une candidate déjà
active à version courante retourne `applied:false` sans écriture ; l’ancien compteur reste
refusé. Aucun retry automatique après erreur ; la saisie est conservée lors du rafraîchissement.

Version active et décision sont enregistrées dans un seul commit CAS synchrone, sans
modifier sources, preuves, données, ledger ou `job.control`. La décision structurée
`application`, de source `agent`, est affichée « Moteur Studio » : déclencheur local/runner,
job/base/candidate, empreintes, références des appréciations contributives et observations
historiques. Un worker ne peut fournir cette structure. Une restauration conserve la trace,
sans transférer une permission d’exécution ni autoriser une nouvelle application.

Une ancienne recommandation favorable ne libère pas une candidate non appliquée. Les
demandes suivantes attendent son application ou son écartement explicite ; seule la
correction rattachée exactement au parent `continue/correct` peut continuer. L’écartement
d’une candidate `continue/activate` non appliquée est permis et interdit sa réactivation
automatique. Les sujets `control:<jobId>` sont réservés à cette résolution dédiée, y compris
face à une livraison worker ou à l’approbation d’une proposition ancienne. Voir
[ADR 036](../../ADR-036-controlled-candidate-activation.md).

Les outils externes suivent le broker MCP existant et ses accords exacts. Le pont natif
`studio_tools`, `studio_call`, `studio_actions` est limité au job, avec une capacité locale
éphémère ; il n’offre pas de route d’approbation. Un succès de transport ne devient pas une
preuve de comportement de l’application. Un résultat externe inconnu suspend les nouvelles
actions concernées sans répétition implicite.

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

L’essai natif historique de la mission création a rapporté 277 934 tokens
(264 412 entrée, dont 228 224 cache ; 13 522 sortie), puis l’admission de ce projet s’est arrêtée. Les interventions suivantes de cette
recette historique ont été exécutées par l’agent de mission via le bridge. Ne pas qualifier ce parcours de service entièrement autonome, ni le confondre
avec les campagnes comparatives historiques, qui restent closes.

La continuation [v1 locale](../local-oss-v1/REPRISE.md) possède sa propre recette inventaire :
un appel natif interrompu après 300 secondes avec usage inconnu, puis une reprise locale
sans fournisseur. Cette campagne reste suspendue ; les fixtures fournisseur et les essais
de navigateur réel de la supervision ne constituent pas une nouvelle recette native.
`recover-work` copie le travail d’un job failed/interrupted/cancelled dans une nouvelle
inspection locale après contrôle CAS, contexte et base active. Le parent, ses sources et
son ledger restent conservés ; le candidat produit n’est pas activé.

L’archive contient état, code déclaré, références, données actuelles, runtime `launch.mjs`
et projection assainie du budget, ainsi que les journaux qualité validés et les décisions
d’examen. Elle exclut token, credentials globaux, traces fournisseur, staging, brouillon
éditeur et configuration navigateur locale. Les reçus gardent leur provenance sans exporter
une permission d’exécution. Après restauration, le navigateur est désactivé ; même un
nouveau réglage ayant le même compteur et canal ne rafraîchit pas l’ancien reçu, car son
identité locale diffère. Une nouvelle vérification explicite est nécessaire.
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
