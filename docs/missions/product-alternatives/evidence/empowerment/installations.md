# Installations locales Codex — 16 septembre 2026

Deux projets sans code applicatif ont été initialisés avec Git et les installateurs officiels de releases. Rien n'a été installé dans DevMethod ni comme plugin global. Aucun modèle, fournisseur ou campagne n'a été invoqué. Ce résultat établit l'installation locale et certains prérequis déterministes ; il ne prouve pas encore l'activation ou l'efficacité des méthodes dans une conversation Codex.

## Projets et provenance

| Projet | Source release | Compétences locales | Fichiers hors .git | Taille des fichiers |
| --- | --- | ---: | ---: | ---: |
| `spec-kit/` | v1.0.7, `fe1d00e3ccaf495880aaf90fb0e17679e82f065b` | 18 | 53 | 371 596 octets |
| `bmad/` | v6.12.0, `05bfbd46d00766ec88eb9b42e76be2c575d64d7b` | 29 | 251 | 1 753 704 octets |

Racine : `/private/tmp/devmethod-empowerment-install-20260916`.

Les deux clones sources fournis sous `/private/tmp/devmethod-empowerment-methods-20260916` sont restés propres selon `git status --porcelain`. Chaque projet a sa propre racine Git, branche `codex/method-adoption`, sans commit initial. Les fichiers de méthode restent visibles comme changements non committés ; aucune réalisation applicative n'est prétendue.

`MANIFEST.json` contient les deux commits, tous les fichiers de projet avec taille et SHA-256, les compétences présentes, les statuts Git, les commandes exactes, dates UTC, durées et codes de sortie. Son hash à la livraison est `cd3a7c96bd02a59a9b7de05cc42d90abb7fed7d21cbb108a3a376229dfb956a6`. Les journaux bruts et les enregistrements JSON par commande sont dans `logs/`.

## Ce qui a été réellement exécuté

- Spec Kit a été construit et installé depuis son clone de release dans le venv `runtime/spec-venv/`, puis initialisé avec `init --here --force --non-interactive --integration codex --script sh`. Les skills sont dans `spec-kit/.agents/skills/`.
- Deux extensions officielles **optionnelles et bundled**, `assess` et `bug`, ont ensuite été ajoutées par l'installateur. Elles ajoutent huit skills aux dix du noyau. Aucun preset, extension communautaire, orchestrateur personnalisé ou extension Git n'a été ajouté.
- BMAD core et bmm ont été installés avec `--modules bmm --tools codex --user-name Opérateur --communication-language French --document-output-language French --yes`. Les skills sont dans `bmad/.agents/skills/`, le runtime documentaire dans `bmad/_bmad/`. Il s'agit de la voie release, pas de la nouvelle distribution plugin de main.
- Le statut officiel `specify integration status --json` donne `ok`, intégration Codex, zéro fichier géré manquant ou modifié, zéro chemin invalide et zéro manifeste non vérifié pour les manifestes contrôlés. Cet outil contrôle le noyau et l'intégration ; l'inventaire complet joint inclut aussi les fichiers des extensions.
- Le résolveur BMAD a effectivement produit la configuration fusionnée française. Le renderer officiel de `bmad-build` a généré un snapshot statique `workflow.md` sous `_bmad/render/` avec exit 0. Le contenu de ce workflow **n'a pas été exécuté** ; aucune étape de travail agentique n'a été commencée.

Le premier essai BMAD a échoué en 0,643 s : `NODE_PATH` permettait les require CommonJS, mais pas l'import ESM de picocolors. C'est une erreur de placement des dépendances dans notre préparation, pas un résultat de capacité de la méthode. Le log n'a pas été supprimé. La correction a copié le source officiel dans `runtime/bmad-release/`, sans son `.git`, et placé un lien `node_modules` vers `runtime/bmad/node_modules/`. Les fichiers de cette copie ont été comparés byte à byte au clone de release. Le second essai réussit en 0,877 s. Aucun source de méthode n'a été modifié pour obtenir ce succès.

## Français et configuration de l'opérateur

BMAD enregistre `document_output_language = "French"` dans `_bmad/config.toml` et `communication_language = "French"` dans `_bmad/config.user.toml`. Le niveau utilisateur par défaut reste `intermediate` ; ce réglage doit être déclaré dans un protocole qui étudie l'expérience du propriétaire.

Une instruction identique de langue a été ajoutée par l'opérateur dans `AGENTS.md` des deux projets : échanges et documents humains en français, noms techniques et syntaxe préservés. Pour Spec Kit, c'est l'adaptation locale de langue ; elle n'est pas présentée comme un paramètre natif de son installateur. Les templates des méthodes restent ceux livrés, sans traduction ni changement de workflow.

**Pour copier ou exporter :** le manifeste inclut aussi les fichiers gitignored. BMAD conserve une partie des réponses dans `config.user.toml` ; un simple export des seuls fichiers suivis par Git perdrait cette configuration française. Copier la totalité du projet hors `.git`, ou préserver explicitement ces fichiers, puis vérifier l'inventaire. Aucun pin public portable/anonymisé n'a été créé ici ; les logs contiennent les chemins locaux de l'installation.

## Entrées effectivement présentes

Spec Kit :

- besoin de feature : `$speckit-constitution`, `$speckit-specify`, `$speckit-clarify` si pertinent, `$speckit-plan`, `$speckit-tasks`, `$speckit-analyze`, `$speckit-implement`, `$speckit-converge` ; le processus se choisit selon le besoin, cette liste ne prescrit pas tous les contrôles à chaque changement ;
- idée à clarifier/évaluer : `$speckit-assess-intake`, `research`, `define`, `shape`, `decide` sous le même préfixe ;
- réparation : `$speckit-bug-assess`, `$speckit-bug-fix`, `$speckit-bug-test`.

Pour l'existant, le guide officiel recommande d'adopter le dépôt puis traiter le prochain changement borné. Les projets préparés sont vides : ils ne représentent pas encore un cas d'adoption brownfield, ni une spec ou constitution approuvée. Rien n'a été inventé pour remplir ces artefacts.

BMAD : les fichiers de compétences `bmad-help`, `bmad-build`, `bmad-project-context`, `bmad-spec`, `bmad-architecture`, `bmad-ux`, `bmad-correct-course`, `bmad-sprint-planning`, `bmad-walkthrough`, `bmad-retrospective` et `bmad-deep-recon` sont présents, entre autres. Une session Codex pourra invoquer la compétence nommée depuis le projet ; pour l'entrée générale de cette release, commencer par `bmad-help` est la recommandation de l'installateur. Pour une modification bornée, `bmad-build` est disponible ; pour le contexte d'un existant, `bmad-project-context` l'est aussi. Aucune de ces compétences n'a été activée auprès d'un modèle lors de cette tâche.

## Runtimes, caches et coût observé

Node v24.18.0, Python 3.14.6 et uv 0.12.5 existants ont été utilisés. Les dépendances Python sont figées dans `logs/spec-freeze.log`, celles de l'installateur BMAD dans `runtime/bmad/package-lock.json`. npm a signalé une dépréciation de glob ; le journal est conservé. Les dépendances de développement BMAD et les scripts npm de cycle de vie n'ont pas été installés/exécutés.

`setup.py` conserve les commandes et le périmètre d'environnement : caches npm, uv, Python et XDG sous `cache/`, répertoire temporaire sous `tmp/`, fichier npmrc local sous `runtime/`. HOME et CODEX_HOME n'ont pas été redéfinis. Aucun plugin global, dépendance globale ou skill du dépôt DevMethod n'a été installé. Le PATH utilise les outils déjà présents. Le checkout n'a pas été débarrassé des préférences globales de l'hôte : une future comparaison doit encore contrôler ce contexte, le modèle, ses autorisations et l'activation réelle des skills.

| Travail instrumenté | Temps subprocess observé |
| --- | ---: |
| Spec Kit : venv + dépendances | 1,282 s |
| Spec Kit : init | 1,217 s |
| Spec Kit : extensions assess + bug | 1,254 s |
| Spec Kit : statut + freeze | 0,728 s |
| BMAD : dépendances | 3,089 s |
| BMAD : premier essai échoué + reprise | 1,520 s |
| BMAD : résolution + rendu statique | 0,256 s |

Les durées sont celles des commandes, pas un temps humain économisé. Les installations de dépendances étaient parallèles : ne pas additionner les colonnes pour produire une durée murale comparative. Les logs instrumentés s'étendent de 12:20:42,763 à 12:23:41,798 UTC, intervalle incluant interventions de l'agent et attente entre commandes. La lecture préparatoire, les autorisations automatiques, la rédaction et l'inventaire ne sont pas intégralement chronométrés : **effort actif opérateur-agent non mesuré**. Aucun coût utilisateur ou avantage de méthode n'est inféré.

Le script `setup.py` est la trace reproductible des phases, pas une promesse d'idempotence sur une installation déjà existante. Ses chemins sont locaux et certaines préparations (copie BMAD et AGENTS.md) sont décrites ci-dessus. Il n'exécute aucun provider. Avant toute future session, le parent possède le protocole et décide des entrées humaines ; cette livraison ne vaut pas admission de campagne.
