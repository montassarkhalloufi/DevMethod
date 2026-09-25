# Connexions MCP réelles et pont hôte — 17 septembre 2026

## Frontière du produit

Les MCP appartiennent à l’espace Studio partagé entre projets ; chaque projet conserve seulement sa sélection d’identifiants. Ils servent ici au contexte et aux actions demandées à l’agent hôte. Les API applicatives restent liées au projet. Une connexion MCP ne crée ni intégration du runtime de l’application publiée ni identité OAuth pour ses utilisateurs.

Cette distinction correspond aux objets différents décrits par Lovable : un [chat connector](https://docs.lovable.dev/integrations/chat-connectors) sert au contexte de construction ; un [app connector](https://docs.lovable.dev/integrations/app-connectors) relie un compte de service à un projet et permet son emploi par le chat et l’application. Le parcours « App user » requiert encore une identité et une autorisation propres à chaque utilisateur final. Le présent pont ne prétend pas livrer ces deux derniers parcours. Voir aussi [RESEARCH](RESEARCH.md) et [écarts DevMethod](DEVMethod-GAPS.md).

## Obligations des fournisseurs vérifiées dans leurs documents

- **Notion** : le [MCP hébergé](https://developers.notion.com/guides/mcp/get-started-with-mcp) utilise une autorisation OAuth interactive ; une clé API Notion ne remplace pas ce parcours. Le [guide client](https://developers.notion.com/guides/mcp/build-mcp-client) décrit l’enregistrement dynamique, PKCE et la réutilisation des identifiants du client. Le renouvellement doit être sérialisé, son jeton rotatif enregistré, et `invalid_grant` conduire à une reconnexion. Les accès héritent de ceux de l’utilisateur et de la politique du workspace.
- **Linear** : le [MCP officiel](https://linear.app/docs/mcp) expose le transport HTTP, OAuth avec enregistrement dynamique et une variante `/mcp/readonly`. Le scope OAuth `read` limite aussi les écritures. Il faut distinguer ce client MCP d’une [application OAuth classique](https://linear.app/developers/oauth-2-0-authentication) ou d’un [agent `actor=app`](https://linear.app/developers/agents), dont l’installation et les scopes ont leurs propres exigences administratives.
- **Sentry** : le [service MCP officiel](https://mcp.sentry.dev/) utilise OAuth et propose des URL bornées à une organisation ou un projet. Ces filtres de découverte ne remplacent pas l’autorisation du compte. Le document public [OAuth authorization server](https://mcp.sentry.dev/.well-known/oauth-authorization-server) annonce un endpoint d’enregistrement, PKCE S256 et ses scopes ; cela ne prouve pas qu’une autorisation réelle de compte a abouti.

Les métadonnées publiques de [Notion](https://mcp.notion.com/.well-known/oauth-authorization-server), [Linear](https://mcp.linear.app/.well-known/oauth-authorization-server) et Sentry annoncent l’enregistrement dynamique. Aucune création d’application manuelle ne peut donc être déclarée universellement obligatoire pour ces trois parcours MCP ; elle peut le devenir pour un serveur sans enregistrement dynamique ni identification de client acceptée. La recherche a seulement lu les documents et métadonnées, sans enregistrer de client ni autoriser de compte fournisseur.

La [spécification MCP d’autorisation](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) impose de traiter la ressource protégée, l’émetteur, PKCE, le paramètre `resource` et la destination des jetons comme des frontières distinctes. L’enregistrement dynamique n’est pas universel. [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html) décrit le navigateur externe et le callback loopback pour un client natif ; son existence dans la norme ne certifie pas l’acceptation de chaque fournisseur.

## Contrat implémenté du pont hôte

Le gestionnaire partagé reçoit et conserve les secrets en dehors des sources du projet. Le projet utilise `.devmethod/mcp-selection.json` avec des identifiants seuls. Au claim, `jobs.mjs` enregistre séparément `.devmethod/mcp-jobs/<jobId>.json` : version de connexion, noms d’outils et empreintes des schémas réellement découverts. Ce fichier ne modifie ni `state.version` ni `contextKey` et n’est pas exporté.

| Interface | Autorisation et résultat |
| --- | --- |
| `GET /api/mcp/selection` | Lecture locale sous Host strict ; rejette une origine étrangère explicite. Retourne `supported`, `nativeRunner:false`, `connectionIds`, éventuellement `reason`. |
| `POST /api/mcp/selection` `{connectionIds}` | Origin utilisateur strict ; le jeton worker seul ne permet pas de modifier la sélection. |
| `GET /api/mcp/tools?jobId=…&connectionId=…` | Bearer worker, job actif sur sa base courante, connexion sélectionnée actuellement **et** lors du claim. Métadonnées des outils encore conformes au snapshot. Ajouter `toolName` pour obtenir son `inputSchema`. |
| `POST /api/mcp/call` `{jobId,connectionId,toolName,arguments}` | Même contrôle ; validation du schéma réel, version de connexion et empreinte inchangées. Résultat MCP borné avec provenance, dates et `isError` préservé. |

Commandes disponibles :

```sh
devmethod studio mcp tools --workspace /projet --file mcp-tools.json
devmethod studio mcp call --workspace /projet --file mcp-call.json
```

Le fichier `mcp-tools.json` contient `{ "jobId": "…", "connectionId": "…", "toolName": "nom.réel" }`. Le fichier d’appel ajoute `"arguments": {}` selon le schéma découvert. Aucun jeton fournisseur ni worker n’est à ajouter au payload : le CLI lit le jeton worker du runtime local, le gestionnaire détient les credentials du fournisseur.

Le contexte livré au job comporte cette marche à suivre, les connexions et vingt noms d’outils au plus par connexion. Il indique explicitement `execution: "manual-host-only"` et `nativeRunner: false`. Le runner natif et son sandbox ne sont pas modifiés. Ouvrir directement un Studio sans gestionnaire partagé rend MCP indisponible et propose de passer par l’accueil.

## Limites et garanties observables

- Sélection : 12 connexions maximum. Découverte : 200 outils par connexion. Snapshot de permissions : 1 Mio maximum. Payload CLI/HTTP : 64 Kio ; schéma : 64 Kio ; résultat brut ou liste d’outils : 256 Kio. Un résultat dépassant la borne échoue explicitement, sans troncature présentée comme complète.
- Les arguments sont validés par AJV 8.20.0 dans un worker local avec limite mémoire et délai de cinq secondes. Dialecte 2020-12 par défaut ; 2019-09 et draft-07 explicitement déclarés pris en charge. `format` reste une annotation ; aucun prétendu contrôle métier ne s’en déduit. Les schémas async, les mots-clés inconnus et les schémas non interprétables sont refusés. Aucun fetch de schéma distant.
- Un seul appel simultané par job ; délai global de vingt secondes, sans relance automatique. La fin du job, une base devenue obsolète, la désélection, une nouvelle autorisation ou un schéma modifié ferment l’accès. Les permissions sont revérifiées après la validation et après l’appel. Un résultat arrivé après révocation n’est pas rendu au worker.
- Un appel déjà transmis peut avoir eu un effet externe avant une annulation, un délai expiré ou une erreur réseau. Le broker ne prétend pas l’annuler rétroactivement ; il ne rejoue pas l’appel et signale cette incertitude. Ajouter une connexion pendant un job ne lui donne pas de nouvelles permissions.
- La sélection donne accès à un service, **pas une autorisation générale d’agir**. Le contexte exige de respecter la demande utilisateur pour les messages, mutations, achats ou destructions. Les [annotations MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) et descriptions d’outils ne constituent pas des permissions fiables. Les résultats sont des données non fiables, jamais des instructions supérieures.
- Le broker ne persiste pas les résultats dans le projet et ne crée ni contrôle réussi, ni version, ni adoption. Les exports restent sans credentials. Les erreurs de parsing, fichiers et transport ne renvoient pas le contenu privé brut. Les autres protections réseau/OAuth sont portées par le gestionnaire partagé et doivent être contrôlées suivant les [recommandations de sécurité MCP](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices).

## Preuves de cette tranche et suites distinctes

`tests/studio-mcp-broker.test.mjs` couvre les permissions persistées, changements de sélection/version/schéma, jobs terminés ou obsolètes, schémas 2020-12, arguments invalides, erreurs d’outil, sortie trop volumineuse, concurrence, timeout et stockage altéré/symbolique. `tests/studio-mcp-broker-http.test.mjs` exerce réellement initialize, tools/list paginé et tools/call via une fixture MCP locale, le gestionnaire, Studio et le CLI. Il vérifie l’authentification, `isError`, l’absence de secrets dans les sorties/exports et l’absence de preuves projet fabriquées.

Cette preuve locale ne certifie ni un compte Notion/Linear/Sentry connecté ni leurs autorisations métier. Restent distincts : recette OAuth réelle consentie par fournisseur, intégration MCP native du runner, comptes applicatifs partagés (« App + chat »), autorisations de chaque utilisateur final (« App user ») et API personnalisée du runtime. Chaque extension nécessite son propre objet d’identité, scopes, cycle de vie de secrets, permission et preuve d’exécution.
