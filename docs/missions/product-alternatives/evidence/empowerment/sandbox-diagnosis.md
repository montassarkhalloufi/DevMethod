# Microadmission arrêtée : incompatibilité locale de sandboxes emboîtés

Diagnostic du 16 septembre 2026, commencé à 12:19:35 UTC, enveloppe maximale sept minutes. Aucun nouveau tour modèle, appel fournisseur, changement de configuration globale, changement de permission permanente, écriture dans les campagnes ou relance de slot. Les probes exécutent uniquement `pwd`, une lecture de version Node et le sous-commande local `codex sandbox`. Auteur : agent de diagnostic.

**Cause locale démontrée : un deuxième `sandbox-exec` ne peut pas appliquer son sandbox dans le premier sur cet hôte.** Le cas échoue avec deux profils minimaux `allow default`, sans Codex. Le même échec est reproduit avec le profil exact de la microadmission, puis avec le sandbox Codex local strictement read-only. Il n'est donc pas nécessaire d'invoquer une erreur spécifique du modèle, une règle métier ou un refus de lecture particulier pour produire `sandbox_apply: Operation not permitted`.

## Résultat arrêté à préserver

`/private/tmp/devmethod-empowerment-admission-20260916/result.json` indique un processus terminé proprement en 47,218 s, une réponse finale et un accounting valide, mais `readinessPassed:false`. Les fichiers de travail restent identiques aux hashes d'entrée. Le test indépendant trouve toujours `within(-2, 0, 10) === -2`, au lieu de zéro. Le travail produit demandé n'est donc pas livré.

Consommation observée : **50 760 tokens d'entrée + 952 tokens de sortie = 51 712**. Les **40 704 tokens d'entrée lus dans le cache sont inclus** dans les 50 760, pas à ajouter. Le seuil souple de 20 000 est dépassé de **31 712 tokens**. Ce seuil entre appels n'était pas un plafond d'inférence en cours de tour. Le slot est fermé ; aucun appel suivant ou réessai n'est justifié par ce diagnostic. Le coût monétaire n'est pas disponible.

Les sept événements JSONL comprennent des messages de l'assistant puis `turn.completed`. Aucun événement de commande exécutée n'y figure. Les affirmations de l'assistant sur ses tentatives de `pwd` sont donc un récit, pas une trace complète de chaque commande. Le stderr fournit néanmoins une preuve directe d'un helper filesystem échouant avec le code 71 lors d'une tentative sur `index.js` ; il rapporte aussi un premier patch invalide, indépendant de cette panne. On ne doit pas transformer toutes les tentatives en commandes réussies ni masquer l'erreur de hunk. La réponse finale reconnaît le blocage ; aucune fausse livraison réussie n'est annoncée.

Extrait matériel du stderr :

```text
fs sandbox helper failed with status exit status: 71:
sandbox-exec: sandbox_apply: Operation not permitted
```

Les avertissements de catalogue `supports_parallel_tool_calls` manquant existent également. Ils ne sont pas nécessaires à la reproduction et ne sont pas la cause démontrée de cette erreur Seatbelt.

## Contre-épreuves locales exécutées

Contexte : macOS arm64, Node 24.18.0, Codex CLI 0.147.0 ; cwd exact `…/devmethod-empowerment-admission-20260916/workers/calibration` ; environnement filtré identique obtenu par `codexEnvironment()`. Le profil exact est lu depuis `protocol.json`, sans modification. Tous les processus de probe sont bornés à cinq secondes et 64 KiB ; aucun d'eux n'ouvre de thread modèle.

| Cas exécuté depuis le contexte hôte autorisé | Sortie | Résultat |
| --- | ---: | --- |
| `/bin/pwd` | 0 | cwd attendu |
| `sandbox-exec -p '(version 1) (allow default)' /bin/pwd` | 0 | cwd attendu |
| Deux `sandbox-exec` emboîtés, tous deux `allow default`, puis `/bin/pwd` | 71 | `sandbox_apply: Operation not permitted` |
| Profil externe exact, puis `/bin/pwd` | 0 | cwd attendu |
| Profil externe exact, puis `sandbox-exec` minimal, puis `/bin/pwd` | 71 | même erreur |
| Profil externe exact, puis Node `-p process.version` | 0 | `v24.18.0` |
| `codex sandbox -P :read-only -C WORKER -- /bin/pwd` | 0 | cwd attendu |
| Profil externe exact, puis la même commande Codex read-only | 71 | même erreur |

Le premier probe tenté directement dans le sandbox de notre outil local échouait déjà avec un seul `sandbox-exec` visible : il se trouvait lui-même dans un contexte sandboxé. Les comparaisons ci-dessus ont été explicitement autorisées hors de cette couche d'outil, uniquement pour des commandes locales sans effet, afin de comparer réellement une couche à deux. Aucun processus fournisseur n'a été lancé dans ce contexte.

Une tentative intermédiaire `codex sandbox -c sandbox_mode=…` sans `-P` est sortie 2 en demandant `--permission-profile`. Elle n'a testé aucune application de sandbox et n'est pas comptée comme preuve du défaut. Le probe corrigé utilise le profil intégré `:read-only`, sans changement de configuration. Le sous-commande présent dans cette version est `codex sandbox [COMMAND]`, pas un sous-commande `macos` à supposer.

Reproduction minimale de la propriété de l'hôte, sans Codex ni modèle :

```sh
/usr/bin/sandbox-exec -p '(version 1) (allow default)' /bin/pwd
/usr/bin/sandbox-exec -p '(version 1) (allow default)' \
  /usr/bin/sandbox-exec -p '(version 1) (allow default)' /bin/pwd
```

Le premier doit être exécuté depuis un contexte hôte autorisé non déjà sandboxé pour avoir le sens de cette comparaison. Ici, le premier passe et le second sort 71. Les deux profils minimaux servent seulement au diagnostic `pwd` ; ils ne constituent aucun profil de sécurité pour une campagne.

## Ce qui manquait au préflight

Le probe de canonicalisation et la correction des métadonnées ancêtres étaient utiles : ils permettent au CLI d'atteindre sa validation de configuration. Le probe shell exécutait aussi un sandbox seul. Le probe typed-invalid s'arrêtait volontairement avant toute action outil. Aucun des trois ne vérifiait qu'un processus Codex déjà enfermé dans le profil externe pouvait ensuite créer son propre sandbox pour un outil ou un helper filesystem.

La frontière à vérifier était donc : **hôte externe → sandbox d'isolation de campagne → sandbox interne des outils**. Cette composition échoue localement même lorsque le deuxième profil n'ajoute aucune restriction explicite. La démonstration est propre à l'hôte/macOS inspecté ; elle ne généralise pas à toutes les versions macOS, aux conteneurs Linux ni à toutes les techniques de sandbox.

## Portée sûre d'une correction future, sans l'appliquer ici

**Piste minimale à vérifier sans modèle : exprimer les restrictions dans une seule politique native Codex.** La version installée expose les profils nommés via `codex sandbox -P`. La documentation officielle décrit des accès filesystem `read`, `write`, `deny`, la priorité des sous-chemins et la désactivation du réseau. Elle précise que ces profils ne se composent pas avec `--sandbox`, `sandbox_mode` ou `sandbox_workspace_write` ; conserver ces anciens arguments peut sélectionner l'autre système. [Permissions Codex](https://learn.chatgpt.com/docs/permissions).

Ce n'est pas une réparation déjà validée. Il faut construire un profil temporaire, passé par invocation, qui conserve au moins l'écriture limitée au worker, les protections `.git`/`.codex`, le refus des évaluateurs/ledgers/frères/source et le réseau des commandes désactivé. Puis éprouver sans modèle : `pwd`, Node réel, lecture autorisée, lectures/listings refusés et frontières de filesystem utilisées par les helpers. Notre probe natif read-only valide uniquement `pwd`, pas tout ce futur profil. Les invariants de lecture de l'hôte lui-même — chargement initial d'instructions, extensions ou métadonnées — doivent être examinés séparément de ceux des commandes. Aucun abandon de l'isolation n'est autorisé par la simple réussite de `pwd`.

L'autre approche documentée, `externalSandbox`, dit explicitement à Codex de ne pas appliquer sa propre enforcement lorsque le serveur est déjà sandboxé. Mais le profil externe actuel est `allow default` avec des restrictions **de lecture** : il comptait sur Codex pour l'écriture et le réseau des outils. L'utiliser seul serait donc un affaiblissement non équivalent. Ne pas remplacer mécaniquement `workspace-write` par un mode sans sandbox ou `externalSandbox` pour faire passer l'admission. [App-server, exécution de commandes et sandbox externe](https://learn.chatgpt.com/docs/app-server).

Si une seule politique locale ne peut pas préserver les exigences nécessaires, une véritable isolation de processus/environnement distincte est une autre conception à préparer ; sa disponibilité et ses limites ne sont pas démontrées ici. Cela ne justifie pas de relancer l'actuel slot, d'étendre son budget ou d'exécuter un fournisseur avec `danger-full-access`.

**Conséquence pour le travail en cours :** le diagnostic local est suffisant pour arrêter de déboguer ce problème avec des tours payants. Le prochain travail éventuel est une vérification sans modèle de la frontière d'exécution complète. Toute future microadmission serait une décision séparée et resterait conditionnée à cette vérification ; aucune n'est lancée ni implicitement autorisée par ce rapport.

## Provenance et intégrité

| Fichier sous `/private/tmp/devmethod-empowerment-admission-20260916` | SHA-256 vérifié |
| --- | --- |
| `result.json` | `257f9067d2e1149a1ffccdc85b02565cdd3fd6f02c52fa66baad45d651d84f8f` |
| `raw.jsonl` | `5c2f9ecdd04d6ac4591c0f7bebf6bf6259ad36f132a1715c063dc4c715d4a3b1` |
| `raw.stderr` | `316c210db10f3e442e4a8a62047e71f7d46fa38759029777c677f95d959329ce` |
| `ledger/calibration.json` | `8f743f00079cf19ca08dda335f14133e0bba9ac7d34e16cd54cdc4b079549e8c` |

Les fichiers initiaux du worker ont été comparés aux hashes de `protocol.before` et restent identiques. Les anciens ledgers journey et maintenance ont aussi été relus et hashés, sans écriture. Aucun transcript n'est réécrit ; les seuls extraits ci-dessus minimisent les chemins personnels et ne contiennent pas de credentials.
