# ADR 021 — Reprendre les sources d’un projet existant

Date : 2026-09-17. Statut : accepté pour la tranche locale, sous la délégation de reprise et d’évolution des projets existants. Complète [ADR 016](ADR-016-local-creation-studio.md) et [ADR 017](ADR-017-typed-react-studio.md).

## Décision

Ajouter `studio import --source DOSSIER --workspace DOSSIER_VIDE [--dry-run]`. La source est un dossier local ou un dépôt déjà cloné. L’import copie ses fichiers admissibles dans un nouveau workspace distinct, sans modifier la source, cloner un dépôt, installer de dépendances ni exécuter les scripts trouvés. `init` reste l’installation indépendante des skills ; `restore` reste la reprise d’un export Studio.

Une copie isolée a été retenue plutôt qu’un rattachement en écriture au dépôt : elle rend la référence initiale et la première évolution comparables sans imposer à un projet inconnu les conventions du runtime Studio. L’écriture directe dans le dépôt, la synchronisation Git et l’exécution de configurations arbitraires restent hors de cette tranche.

## Contrats

- La baseline porte `origin: {kind: "import"}` et n’a pas de `jobId`. Elle n’invente ni génération, ni contrôle réussi, ni approbation. Elle devient la référence active consultable du workspace.
- `state.import` conserve nom de source, date, empreinte du manifeste, inventaire/exclusions et contexte sourcé. Cette provenance reste attachée à la baseline et immuable ; l’analyse courante des révisions reste distincte.
- Les faits de contexte distinguent déclarations et détections, avec chemin et empreinte du fichier. README, manifestes, commandes déclarées, tests, services et instructions existantes sont inventoriés. Objectifs produit, décisions acceptées, exécution et historique Git restent inconnus tant qu’ils ne sont pas établis.
- Un dossier statique directement servi peut recevoir `profile: "static"`. Les autres projets reçoivent `profile: "source-only"` : consultation, analyse, édition et export disponibles, aperçu/compilation/exécution indisponibles. Aucune conversion de stack n’est effectuée.
- Une évolution source-only produit une révision candidate, même sans cadrage approuvé. Elle ne s’active jamais automatiquement. L’activation exige ensuite le cadrage approuvé et une action explicite ; elle ne transforme pas le snapshot en preuve de fonctionnement. Les gates existantes des profils exécutables restent inchangées.

## Conservation et limites

Inspection bornée, manifestes SHA-256, copie vérifiée, nouvelle inspection avant publication et installation du workspace par renommage d’un staging. Un dépassement, lien symbolique, fichier spécial ou changement de source refuse l’import entier. Les exclusions sont retournées explicitement ; un `--dry-run` ne crée aucun fichier, même pas le dossier de destination.

Les chemins usuels Next `[id]`, `(groupe)` et `@slot` utilisent le contrat relatif commun ; traversals, séparateurs inverses et chemins absolus restent refusés. Les plafonds et exclusions précis sont dans [le guide d’import](STUDIO-IMPORT.md).

Le détecteur de marqueurs de secrets est heuristique, pas une certification d’absence de secrets. `.gitignore` n’est pas interprété. Le registre ne reconstitue pas l’historique Git et ne certifie pas l’exhaustivité sémantique d’une analyse AST.

## Vérification

Les tests `studio-import.test.mjs` et `studio-import-cli.test.mjs` exercent octets source inchangés, dry-run sans écriture, baseline sans job/preuve, provenance, fichiers Next, JSON malformé/scalaires, exclusions, refus des liens et dépassements, échec de publication, édition source-only, activation réservée, aperçu indisponible et export/restauration. Les tests historiques de domaine, stockage, édition, chemins, archive, sources et analyse restent applicables.

Ces essais utilisent des projets locaux fictifs. Ils ne constituent pas une validation native d’un agent, un déploiement ou un constat de fonctionnement du projet importé.
