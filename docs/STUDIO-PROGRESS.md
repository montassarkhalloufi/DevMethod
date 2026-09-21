# Progression d’une demande Studio

Le plan et le journal d’actions accompagnent une demande identifiée par `jobId` et sa
révision de départ. Ils ne modifient pas la version du projet. Les états canoniques de la
demande restent ceux du Studio : une livraison `ready` n’est pas une validation de tests.
Les contrôles et leurs preuves restent dans `checks`. La compilation React exécutée par
le runtime publie son début et son résultat observé avant la livraison ; un journal
indisponible ne remplace pas le résultat réel du compilateur.

## Runner Codex local

Le runner traduit les événements `item.started`, `item.updated` et `item.completed` du
CLI pour `command_execution`, `file_change`, `web_search` et `agent_message`. Il utilise
des libellés génériques et ne transmet ni commande, ni arguments, ni sortie, ni texte des
messages. Les chemins affichés appartiennent à `app/` ; les chemins cachés ou extérieurs
sont écartés. Une commande opaque telle que `cat …` ne devient pas une lecture déclarée.
Le journal CLI brut privé existant conserve son rôle de diagnostic ; il n’est pas servi
par l’API de progression.

Le prompt demande à l’agent d’ajouter des lignes JSON à `progress.jsonl`, à la racine du
staging de la demande, en dehors de `app/`. Un objet plan remplace le plan courant :

```json
{"type":"plan","title":"Créer la page","steps":[{"id":"page","title":"Écrire la page","status":"running"}]}
```

Chaque ligne doit finir par un saut de ligne. Les étapes conservent leur identifiant et
utilisent `pending`, `running`, `completed` ou `blocked`. Le runner accepte 1 à 40 étapes,
des titres de 160 caractères au maximum et des identifiants de 80 caractères composés
de lettres ASCII, chiffres, `_` et `-`. Les plans `todo_list` du CLI servent de repli
jusqu’au premier plan explicite valide ; ils ne remplacent plus ensuite ce plan.

L’agent peut aussi déclarer une lecture effectivement effectuée avec un chemin relatif à
`app/` :

```json
{"type":"action","id":"read-main","kind":"read","label":"Lecture","status":"completed","path":"src/main.tsx"}
```

Le libellé affiché précise que cette lecture est déclarée par l’agent. Le fichier ne doit
pas dupliquer les commandes, modifications ou messages déjà observés dans le flux CLI.
Les autres actions du fichier sont ignorées. Ne jamais y inscrire de secret, sortie de
commande, variable d’environnement ou contenu privé. Un plan ou une lecture déclarée
ne prouve ni une exécution réussie ni la qualité du résultat.

La lecture incrémentale a lieu toutes les 100 ms et se termine à la fin de l’exécuteur,
à son annulation ou au délai maximal du runner. Le canal est borné à 256 Kio, 16 Kio par
ligne et 500 événements publiés par demande. Les liens symboliques, remplacements et
troncatures du fichier sont refusés ; les lignes invalides sont ignorées. Les événements
tardifs ne relancent aucune exécution. Une sortie CLI `turn.failed` ou `error` invalide le
résultat même si le processus rend le code zéro. L’arrêt global de l’exécuteur ne change
pas automatiquement les actions en échec : sans résultat explicite, leur état reste
inachevé et l’interface s’appuie sur le statut terminal de la demande pour le signaler.
Les nouveaux tests utilisent des exécuteurs injectés et une fixture de processus local.
Ce canal de progression n’a pas été essayé avec un appel fournisseur natif payant ;
son alimentation effective par un modèle reste à vérifier lors d’un essai autorisé.

## Agent hôte manuel

Après `claim`, l’agent hôte peut publier vers `POST /api/jobs/progress` sur l’URL locale du
Studio. L’authentification exige `Authorization: Bearer <token>` ; le token se lit dans
`.devmethod/runtime.json` du workspace autorisé et reste privé. Le navigateur ne reçoit
pas ce token. La commande suivante gère cette authentification localement :

```sh
devmethod studio progress --workspace /chemin/absolu/mon-produit --file payload.json
```

`claim.context.progress` fournit le point d’entrée, la commande, les schémas et les limites.
Le fichier `payload.json` contient par exemple :

```json
{"jobId":"identifiant-retourné-par-claim","eventId":"host-plan-1","event":{"type":"plan","title":"Correction locale","steps":[{"id":"edit","title":"Modifier le fichier","status":"running"}]}}
```

Pour une action, utiliser `event` avec `{type:"action",id,kind,label,status,path?}`.
`kind` accepte `read`, `write`, `command`, `search`, `check` ou `message` ; `status` accepte
`running`, `completed` ou `failed`. Un identifiant d’action reste stable durant ses mises
à jour. `eventId` identifie une publication : rejouer exactement la même publication
est idempotent ; réutiliser son identifiant avec un autre contenu est refusé.

Le corps JSON est limité à 32 Kio. L’API accepte au maximum 40 étapes, 200 actions
récentes et 2 000 publications par demande. Les titres sont limités à 200 caractères,
les libellés à 400, les chemins relatifs à `app/` à 300. Les identifiants commencent par
une lettre ou un chiffre et contiennent au maximum 128 caractères parmi
`A–Z a–z 0–9 _ . : -`. Ne pas fournir `source` ou `version` : le serveur attribue la source
`host` et conserve les horodatages. Le contenu demeure une déclaration de l’hôte.

`GET /api/jobs/progress?jobId=<id>` renvoie l’instantané courant. Après la fin, l’annulation
ou l’obsolescence de la demande, toute nouvelle publication est refusée ; seul un rejeu
exact déjà reçu reste admis. Le bridge ne lance pas d’agent et ne reconstruit pas ses
activités : un hôte qui ne publie rien apparaît sans plan ni actions déclarés.

## Affichage et conservation

Le Studio lit automatiquement l’instantané toutes les deux secondes pendant l’attente
ou l’exécution, avec une seule lecture à la fois et un délai maximal de dix secondes.
Il suspend les lectures périodiques dans un onglet masqué, puis reprend à son retour.
Un problème de lecture conserve le dernier état affiché et propose de réessayer. Ce
rythme constitue un suivi interactif local, pas une garantie de latence temps réel.

Les étapes sans résultat final ne deviennent jamais terminées à la livraison ou à
l’interruption de la demande. Le journal reste dans `.devmethod/progress/` après
rechargement et redémarrage du même workspace. Cette première version ne l’inclut pas
dans l’archive d’export du projet ; les demandes, décisions et contrôles continuent à
suivre leur contrat d’export existant.

Les liens de fichier ouvrent la révision livrée du même job, quand elle contient ce
chemin. Le code du staging pendant l’exécution n’est pas édité par cette vue. Les
événements affichés ne sont ni des validations humaines ni des preuves de tests.
