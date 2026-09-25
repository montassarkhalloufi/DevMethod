# Reprendre un projet local dans Studio

Studio peut partir d’un nouveau workspace ou copier les sources d’un projet existant. Pour un dépôt distant, fournir d’abord un clone local obtenu par le moyen habituel. L’import n’accède pas au réseau et ne lance aucun fournisseur.

```bash
devmethod studio import --source /chemin/absolu/projet --workspace /chemin/absolu/atelier --dry-run
devmethod studio import --source /chemin/absolu/projet --workspace /chemin/absolu/atelier
devmethod studio --workspace /chemin/absolu/atelier
```

Utiliser des chemins réels sans lien symbolique ; sur macOS, le chemin canonique de `/tmp` est `/private/tmp`. Source et destination doivent être distinctes et non imbriquées. La destination doit être absente ou vide. Le dry-run retourne l’inventaire, les exclusions, le contexte et le profil proposé sans créer la destination.

## Ce qui est conservé

Les octets des fichiers admissibles sont copiés sans reformater les sources ni modifier `package.json`. Le manifeste contient taille et SHA-256 de chaque fichier ; l’import est refusé si les fichiers changent pendant la copie. La source originale reste intacte. Les permissions exécutables et l’historique Git ne sont pas transférés comme contrat de reprise.

`state.import` contient le nom du dossier source, sa date d’import, l’empreinte du manifeste, les exclusions et le contexte initial. Il ne conserve pas son chemin absolu. Chaque fait de contexte cite le chemin et l’empreinte d’un fichier de la baseline. Une commande npm détectée est seulement déclarée, pas exécutée. README et instructions sont identifiés ; une documentation n’est pas convertie en accord humain. Les questions produit, décisions et validations manquantes restent explicites.

La baseline est une révision `origin: {kind: "import"}`, sans job de génération ni contrôle réussi. L’analyse via `GET /api/project/model` porte sur les sources réelles de la révision sélectionnée ; la provenance d’import reste historique et ne se réécrit pas après les éditions.

## Éditer et faire évoluer

Un dossier HTML/CSS/JS directement servi peut être classé `static`. Les autres projets, notamment ceux avec manifeste npm, Next, backend ou absence d’`index.html`, restent `source-only`. Cette classification est conservatrice et ne garantit pas qu’un aperçu statique fonctionne.

Un projet source-only reste consultable dans Code, analysable et éditable. L’éditeur enregistre un snapshot avec le protocole `source-snapshot-v1`, sans exécuter de test, de compilation ou de script. Aucun aperçu n’est proposé ; le serveur d’aperçu répond explicitement 501. La première édition ou livraison par l’agent crée une version candidate sans la rendre automatiquement active. Le cadrage doit être approuvé avant activation explicite. Aucun contrôle réussi n’est créé pour ce simple snapshot.

Le bridge `claim` fournit les faits initiaux et la consigne de préserver stack, manifestes et contrats. Les mises à jour se font dans le staging de la tâche, jamais dans le dossier original. Export/restauration conservent les sources et cette provenance ; aucune synchronisation de retour vers le dépôt n’est implicite.

## Plafonds et exclusions

- 256 fichiers inclus et 32 Mio au total ; 2 500 entrées inspectées et 40 niveaux de profondeur. Les chemins doivent être représentables dans l’export USTAR existant. Un dépassement refuse tout l’import.
- Texte interprété/éditable jusqu’à 256 Kio par fichier ; les fichiers plus grands et les binaires conservent leurs octets mais ne deviennent pas du texte inventé.
- Contexte limité à 500 faits, avec mention explicite d’une réduction ; registre d’import limité à 512 Kio. L’analyse conserve ses limites et diagnostics.
- Dossiers exclus : `.git`, `.hg`, `.svn`, `.devmethod`, `node_modules`, `vendor`, `.venv`, `venv`, `__pycache__`, `.next`, `.nuxt`, `.cache`, `dist`, `build`, `coverage`, `.ssh`, `.aws`, `secrets`, `credentials`.
- Fichiers exclus : `.env` et `.env.*`, `.npmrc`, `.pypirc`, `.netrc`, `.git-credentials`, clés `.pem/.key/.p12/.pfx/.keystore`, données/journaux `.sqlite/.sqlite3/.db/.log/.dump`, fichier `.git` et `.DS_Store`.
- Les exclusions réelles sont listées avec leur raison. `.gitignore` n’est pas interprété. Un lien non exclu ou un fichier spécial refuse l’import ; aucun lien externe n’est suivi.
- Certains marqueurs connus de clés privées/tokens refusent l’import sans afficher leur valeur. Cette détection limitée ne prouve pas l’absence de secrets dans des fichiers arbitraires.

Les exports gardent leurs plafonds existants : 64 Mio de contenu et 1 500 entrées ; USTAR impose également ses limites de longueur de chemin. Un projet importé ne reçoit pas automatiquement un runtime compatible, une installation de dépendances, des credentials, une publication ou une migration de données.

Décision : [ADR 021](ADR-021-import-existing-project.md).
