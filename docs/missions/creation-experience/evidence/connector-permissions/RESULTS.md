# Connecteurs : permissions, guides et GitHub MCP

Livraison locale vérifiée le 17 septembre 2026, base `1e6c510`, diff de cette tranche.
Portée autorisée et contrats : [ADR 026](../../../../ADR-026-connector-permissions-and-interactions.md).

## Résultats

- Connexions partagées, sélection par projet, permissions Autoriser/Demander/Interdire
  réellement appliquées dans le pont MCP ; contrôle de version et contrats d’outils.
- Accords ponctuels liés aux arguments, expiration, déduplication, résultat inconnu après
  interruption. Le worker ne peut modifier ni politiques, ni sélection, ni connexions,
  ni décisions humaines, même avec une Origin valide.
- Guides Slack/Notion/Linear/GitHub, brouillons et questionnaires de mission persistants,
  résumés réouvrables, comptes et permissions en fiche, configuration avancée repliée.
- GitHub MCP distinct de l’API applicative, PAT masqué privé et lecture seule par défaut.
  Le nom de connexion reste distinct d’une identité de compte non fournie par MCP.

## Preuves exécutées

| Critère | Preuve |
| --- | --- |
| Refus, expiration, aucune invocation avant accord, arguments changés, double clic | Tests broker/journal et HTTP, serveur MCP local avec compteur d’invocations. |
| Restrictions immédiates, élargissement différé, outils/schémas nouveaux | Tests snapshot/CAS, changements de contrat d’entrée et sortie, retrait et réapparition. |
| Interruption, déconnexion et mission annulée | Tests unknown/cancelled et absence de relance. |
| Autorité humaine non forgeable par worker | Régressions HTTP jeton valide + Origin exacte, refus avant mutation. |
| Reprise et races de brouillons | Régressions GET tardif après ou pendant POST, CAS et tombstones ; contexte initial inchangé. |
| Visibilité dans le prompt | Tests de synchronisation entre hooks/bundles sans payload de secret. |
| GitHub | Protocole MCP local, validation des endpoints, champ PAT masqué, secret absent du prompt/export. Aucun PAT réel testé. |
| Desktop et mobile | 8 parcours Chrome : quatre guides en 1440×1050 et 390×844 ; étapes, choix partiels, fermeture/reprise, retour et résumé. [Observations](browser-guides.json). |
| Accord dans le navigateur | Après recharge de la carte pending : 0 appel ; clic « Autoriser cette action » : 1 ; nouvelle recharge : toujours 1. Aucun pageerror, aucun débordement horizontal mobile. |
| Politique dans le navigateur | Modification d’un outil vers Interdire, état global Personnalisé, présentation mobile sans débordement. |

Captures inspectées : [GitHub et champ PAT](github-pat-desktop.png),
[Notion mobile](notion-mobile.png), [carte d’accord](action-desktop.png),
[permissions mobile](permissions-mobile.png).

Les régressions ont notamment corrigé des réponses GET obsolètes, la désynchronisation du
prompt, la sélection MCP modifiable par worker et une action groupée touchant les outils
masqués par un filtre. Les guides n’accordent jamais des droits fournisseur.

## Contrôles du dépôt

`npm test` : 1068/1068 réussis (inclut build TypeScript et bundles distribués).
`npm run lint`, `npm run format:check`, `npm run check:docs` et `npm pack --dry-run`
réussis. Le dernier utilise `--cache /private/tmp/devmethod-npm-cache` car le cache npm
personnel n’est pas accessible en écriture ; aucune modification de ce cache personnel.

Logs locaux : `/private/tmp/devmethod-permissions-{test,lint,format,docs,pack}.log`.
Aucune CI distante, publication, autorisation OAuth ou ressource fournisseur réelle modifiée.
Les contrôles Chrome sont de véritables interactions de navigateur avec Studio local ; le
serveur MCP est explicitement une fixture de protocole. Ils ne prouvent pas une connexion
GitHub authentifiée. Celle-ci nécessite un PAT saisi dans le champ de connexion.

L’interface ne peut pas limiter les outils que l’agent hôte utilise directement en dehors
du pont DevMethod. Stripe, Cloud, registres MCP, OAuth Slack natif et utilisateurs finaux
restent hors de la livraison.
