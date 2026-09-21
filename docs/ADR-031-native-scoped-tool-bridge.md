# ADR-031 — Pont outils natif limité à une mission

- Date : 2026-09-21
- Statut : accepté dans la délégation technique réversible de la mission v1 locale
- Portée : runner Codex local, broker MCP existant ; aucune publication ni nouvelle campagne

## Besoin et choix

Le runner isolé ne disposait pas du pont MCP manuel, malgré les connexions sélectionnées dans
Studio. Les permissions figées au claim, leur réévaluation et le registre d'actions du broker
doivent aussi gouverner les appels natifs. Un accès à un outil ne constitue pas une preuve
métier, et la sélection d'une connexion ne constitue pas un accord général.

Le runner configure un serveur STDIO MCP dédié au processus. Celui-ci expose uniquement
`studio_tools`, `studio_call` et `studio_actions`. Il transmet les requêtes à une session HTTP
éphémère sur loopback, qui injecte l'identité du job et appelle le broker existant. Le client
ne peut fournir ni autre job ni décision d'autorisation. Les accords restent dans Studio.

La configuration MCP par commande, arguments et variables d'environnement est documentée par
[OpenAI](https://learn.chatgpt.com/docs/extend/mcp?surface=cli). Le parseur du Codex installé
accepte les paramètres générés (`codex mcp get devmethod --json`, lecture seule). Cela ne
constitue pas une exécution du modèle ni une recette native.

## Alternatives considérées

| Option | Conséquence décisive |
| --- | --- |
| Conserver uniquement le pont hôte manuel | Ne satisfait pas l'accès aux outils depuis le runner natif. |
| Donner l'accès HTTP général du worker au processus | Expose des routes de mutation hors du seul besoin outils et demande d'élargir son accès réseau. |
| Pont STDIO limité au job, retenu | Réutilise les permissions et le registre, sans exposer le jeton général du worker ni ouvrir le réseau du shell. |

## Invariants

- Session créée seulement pour un job réclamé avec connexions sélectionnées ; fermeture en
  fin de traitement, y compris échec et annulation pendant la préparation.
- Jeton aléatoire en mémoire, transmis au serveur STDIO par environnement explicite ; ni
  contexte écrit, configuration durable, aperçu, export ou journal ne le reçoit.
- Host/Bearer vérifiés, requêtes navigateur refusées ; corps et réponses bornés. Identité
  du job relue avant dispatch ; aucun endpoint de sélection, configuration ou approbation.
- Appel avec `requestId` obligatoire ; broker responsable de la déduplication et de
  `allow/ask/deny`. Aucun retry transport. Un effet inconnu reste inconnu.
- Connexion, schéma, arguments, permission et statut du job recontrôlés par le broker.
  Données fournisseur non fiables ; aucun résultat transport promu en validation métier.
- Réseau du shell toujours désactivé. Ce pont donne uniquement les outils déjà sélectionnés,
  dans leur périmètre autorisé. Il n'installe aucun connecteur ni navigateur.

## Preuves et limites

Tests avec vrai Client/STDIO SDK, session HTTP locale et broker, fournisseur fictif déclaré :
transmission, portée, refus d'approbation, déduplication, permission en attente, timeout,
annulation avant fournisseur et fermeture. Pas de nouvel appel Codex/LLM ni de service externe.
La campagne inventaire demeure arrêtée pour consommation inconnue. L'utilisation de ces
outils par un vrai job natif reste à démontrer après autorisation appropriée ; de même pour
un connecteur représentatif et le navigateur. Revoir le choix si l'hôte ne peut lancer le
serveur STDIO, sans repli automatique vers un accès réseau plus large.
