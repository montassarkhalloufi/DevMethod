# Politique native unique : frontière de commande vérifiée, admission non validée

16 septembre 2026. Début observé : 12:25:52 UTC. Dernier probe exécuté et contrôlé : 12:32:55 UTC. Travail borné à huit minutes. Aucun tour modèle, fournisseur, modification de configuration globale ou admission. Les anciens dossiers de campagne, drivers et ledgers ne sont pas modifiés. Quatre contextes fictifs distincts sont conservés.

**Résultat : une politique native nommée permet d'exécuter Node et Git avec les refus ciblés demandés, sans emboîter Seatbelt.** Le dernier probe réussit ses 31 observations avec sortie 0, sans stderr. Il reste **provisoire**, et n'est **pas équivalent à l'ancien profil** : les répertoires ancêtres et temporaires système sont lisibles, leurs écritures sont refusées. Les noms de fichiers de campagne et de workers restent visibles, mais les contenus d'évaluation explicitement protégés restent inaccessibles. Le parent a autorisé cette différence pour préparer la piste, sans admission.

## Artefacts réutilisables et provenance

- Profil, argv exacts, runtime, timestamps et résultats individuels finaux **avec exigences administrées incluses** : `/private/tmp/devmethod-single-sandbox-verification-v4-managed.json`.
- Nouveau contexte final : `/private/tmp/devmethod-single-sandbox-probe-9YEYyl`.
- Programme de contrôle réellement exécuté : `workers/probe/probe.mjs` dans ce contexte.
- Orchestrateur exact conservé : `driver-v4-managed.mjs` dans ce contexte ; source de préparation à `/private/tmp/devmethod-single-sandbox-probe.mjs`.
- Variante précédente, sans inclusion explicite des exigences administrées : `/private/tmp/devmethod-single-sandbox-verification-v3.json`, contexte `…/devmethod-single-sandbox-probe-fo0ce5`, avec son `driver-v3.mjs`.
- Premier essai strict conservé : `/private/tmp/devmethod-single-sandbox-verification.json` et contexte `…/devmethod-single-sandbox-probe-eR1sPZ`.
- Deuxième essai conservé avec ses deux échecs de listings : `/private/tmp/devmethod-single-sandbox-verification-v2.json` et contexte `…/devmethod-single-sandbox-probe-X9OFFO`.

Les JSON contiennent des chemins absolus locaux pour la reproduction, pas des credentials ni un dump d'environnement. Pour réutiliser la politique, reconstruire les chemins sur une **nouvelle** arborescence et choisir de nouveaux fichiers de sortie ; ne pas relancer cet orchestrateur inchangé pour écraser les artefacts figés.

Runtime observé : Codex CLI **0.147.0**, Node **24.18.0**, macOS **arm64**. Chaque probe est un `codex sandbox`, pas un `codex exec`, avec timeout de quinze secondes et sortie limitée à 256 KiB. Les processus de probe sont lancés depuis le contexte hôte autorisé pour éviter l'emboîtement déjà démontré, puis enfermés dans **leur propre politique native**. Aucun mode sans sandbox n'est utilisé.

## Évolution des trois essais

1. **Strict :** `:slash_tmp=deny`, `:tmpdir=deny`, racine du contexte `deny`, worker `write`. Le loader Node échoue avant le programme : `EPERM lstat '/private/tmp'`. Refuser toute lecture refuse aussi les métadonnées ancêtres nécessaires au chargement. Le JSON garde cet échec ; aucun contrôle applicatif n'est déclaré passé.
2. **Refus ciblés :** temporaires système en `read`, refus sur evaluator, ledger, sibling et source, worker en `write`. **21/23** contrôles passent. Les deux autres révèlent que les listes du contexte et de son dossier `workers` sont visibles. Le résultat reste `passed:false` ; il n'a pas été réécrit en succès.
3. **Variante déclarée, autorisée pour préparation :** mêmes frontières, plus refus des fichiers directs de protocole/résultat/logs. Les deux observations de listings attendent désormais explicitement leur visibilité. **31/31 observations attendues**, sortie 0 ; huit nouveaux refus de fichiers sont vérifiés. Ce succès concerne la variante, pas le contrat strict de l'essai 1.
4. **Contrôle final administré :** exactement la même politique dans une nouvelle arborescence, avec `--include-managed-config` ajouté à l'invocation `codex sandbox`. **31/31 observations attendues**, sortie 0, stderr vide. Les trois premiers essais ne passaient pas cette option : ils ne sont pas présentés comme validant les exigences administrées. Le profil custom n'a pas été refusé par cette invocation finale ; aucune exigence administrée n'a été modifiée ou contournée. Cela ne constitue pas un inventaire des exigences effectivement présentes.

## Politique effective de l'essai final

Le JSON final fournit chaque chemin réel et la chaîne TOML transmise comme un seul argument. Structure normalisée ci-dessous ; les placeholders sont des rôles, pas une commande directement exécutable :

```toml
[permissions.devmethod_single_probe]
extends = ":workspace"

[permissions.devmethod_single_probe.network]
enabled = false

[permissions.devmethod_single_probe.filesystem]
":root" = "read"
":tmpdir" = "read"
":slash_tmp" = "read"
"<ROOT>/evaluator" = "deny"
"<ROOT>/ledger" = "deny"
"<ROOT>/workers/sibling" = "deny"
"<ROOT>/workers/probe" = "write"
"<ROOT>/workers/probe/.codex" = "read"
"<ROOT>/workers/probe/.agents" = "read"
"<ROOT>/workers/probe/.git" = "write"
"<ROOT>/workers/probe/.runtime/tmp" = "write"
"<SOURCE_REPOSITORY>" = "deny"
"<ROOT>/protocol.json" = "deny"
"<ROOT>/result.json" = "deny"
"<ROOT>/raw.jsonl" = "deny"
"<ROOT>/raw.stderr" = "deny"
"<ROOT>/dispatch.json" = "deny"
"<ROOT>/frozen.json" = "deny"
"<ROOT>/frozen.sha256" = "deny"
"<ROOT>/probe-result.json" = "deny"
```

Forme de lancement réellement utilisée :

```text
codex sandbox -P devmethod_single_probe --include-managed-config -C <WORKER>
  -c permissions.devmethod_single_probe=<INLINE_TOML_TABLE>
  -- <PINNED_NODE_EXECUTABLE> <WORKER>/probe.mjs
```

Il n'y a pas de `--sandbox`, `sandbox_mode` ou `sandbox_workspace_write` dans cet argv : la documentation précise leur incompatibilité avec les profils nommés. Elle décrit également l'héritage `:workspace` et les priorités des chemins plus précis. Les comportements ci-dessous sont mesurés localement, pas déduits de la documentation. [Permissions Codex](https://learn.chatgpt.com/docs/permissions).

## Frontières effectivement observées

| Opération | Observation finale |
| --- | --- |
| Lire le fichier du worker, écrire un résultat | Autorisé |
| Écrire dans `.runtime/tmp` du worker | Autorisé |
| Lire/list­er evaluator, ledger, sibling et dépôt parent | EPERM |
| Lire les huit fichiers directs protégés | EPERM |
| Lister la racine du contexte et `workers` | Autorisé et déclaré ; les noms restent visibles |
| Lire `.codex` et `.agents` du worker | Autorisé, pour les instructions figées |
| Écrire dans `.codex` ou `.agents` du worker | EPERM |
| Écrire hors worker dans la racine du contexte | EPERM |
| Écrire dans `/tmp` et le vrai temporaire système | EPERM |
| Écrire une métadonnée `.git`, puis `git add` et `git commit` | Autorisé ; commit local fictif créé |
| Connexion TCP à `127.0.0.1:9` | EPERM |

L'essai réseau utilise une adresse loopback et un port de test ; il ne contacte aucun fournisseur. Son résultat démontre un refus de connexion locale dans ce profil, pas une exploration exhaustive de tous les transports. Les tests d'écriture externe emploient des noms uniques fictifs ; tous sont refusés. Aucun fichier externe créé à nettoyer.

La politique `:root=read` permet encore de lire des chemins qui ne sont pas explicitement refusés. Elle ne prétend pas isoler tous les fichiers personnels de l'utilisateur. Le refus du dépôt parent est démontré ; les refus de données de campagne sont limités à l'inventaire gelé. Tout autre fichier d'évaluation créé directement dans la racine serait lisible sans nouvelle règle. Pour une utilisation ultérieure, regrouper les sorties cachées dans un dossier refusé et geler l'inventaire des exceptions directes avant le travail.

## Limites qui empêchent une admission maintenant

- Ce contrôle valide le chemin **commande native sandboxée**, avec un vrai script Node et de vrais accès filesystem/Git. Il ne valide pas le chargement initial d'instructions, de configuration, de contexte ou de fichiers par le processus Codex hôte avant un outil.
- Les helpers natifs d'édition/lecture employés par `apply_patch` ne sont pas exercés ici. Leur utilisation de la même politique doit être établie sans modèle avant toute assertion d'équivalence.
- Les hooks, plugins, connecteurs, web et autres surfaces demandent leurs propres restrictions ; ce profil ne remplace pas les flags du protocole précédent. Aucune suppression de ces protections n'est proposée.
- L'environnement du probe est filtré par `codexEnvironment()`. Les arguments exacts sont conservés. Aucune configuration globale n'est écrite, mais le chargement effectif complet de la configuration par un futur `exec` n'est pas couvert par le succès de `sandbox -P`.
- `.git` writable est une exception explicite et testée, utile au workflow demandé ; elle ne démontre pas la sûreté de toute commande Git ou de hooks externes. Le commit de test désactive les hooks par argument local.
- Aucun résultat humain, avantage de méthode, tour natif complet ou mesure de tokens n'est ajouté. La campagne à 51 712 tokens reste arrêtée et son dépassement n'est ni annulé ni imputé à ces probes sans modèle.

Conclusion opérationnelle : **piste locale viable pour les commandes sous la variante déclarée ; profil encore provisoire pour un hôte agent complet**. Les échecs précédents et les différences de visibilité restent conservés. Aucune campagne ne doit être admise sur la seule base du compteur 31/31.
