# ADR 025 — Préparation guidée des connecteurs

Date : 2026-09-17. Statut : accepté dans la portée autorisée par le « go » utilisateur.
Complète [ADR 022](ADR-022-connectors-host-bridge.md), [ADR 023](ADR-023-studio-home.md)
et [ADR 024](ADR-024-workspace-mcp.md). Référence :
[cadre observé dans Lovable](missions/creation-experience/evidence/lovable-connectors/GUIDED-CONTRACT.md).

## Décision et portée

Le catalogue ne suffit pas à exprimer identité, usage et permissions. Un guide déterministe,
versionné et propre au fournisseur collecte des choix finis ; le serveur valide les réponses
et prépare un résumé utilisable par l’agent. Première tranche : Slack API bot, utilisateur
partagé ou compte de chaque utilisateur final ; Notion MCP contexte/documentation ; Linear
MCP consultation ou préparation de modifications.

Les trois catégories restent distinctes : API de l’application, outils de l’assistant
réutilisables entre projets, comptes OAuth individuels des utilisateurs de l’application.
Aucun de ces guides ne remplace le gestionnaire OAuth ni ne prouve une installation.
Un formulaire libre généré par le modèle permettrait des scopes et garanties inventés ;
un assistant OAuth universel masquerait les contraintes de fournisseurs. Les définitions
finies et contrôlées sont retenues, avec l’agent pour réaliser l’intégration applicative.

## Contrat implémenté

- `GET /api/connectors/guides` retourne les trois définitions publiques, sur Home et Studio.
- `POST /api/connectors/guides/prepare` est pur : `{optionId, guideVersion:1, flowId, answers}`.
  Les champs et réponses inconnus, doublons et combinaisons incompatibles sont refusés.
- La préparation retourne les choix canoniques, un titre, un résumé, les permissions
  proposées, les prérequis, l’empreinte SHA-256 et éventuellement l’endpoint natif.
  Son statut est toujours `access: not-connected` : seule la connexion réelle porte son statut.
- Le lancement Home et les requêtes d’un projet acceptent au plus douze `connectorGuides`,
  uniques par fournisseur. Le serveur revalide et fige les préparations dans le job ;
  `claim.context.connectorGuides` transmet ce snapshot immuable à l’agent.
  Les choix font partie de l’empreinte de rejeu Home.
- La configuration d’une API peut sauvegarder son guide avec les références existantes,
  sous contrôle de version CAS. Les anciens enregistrements sans guide restent lisibles.
- Le brouillon du Studio persiste `draftConnectorGuides` avec le texte. `/api/draft` conserve
  ce champ quand il est omis par un ancien client ; `[]` le vide. Après envoi, le navigateur
  conserve les choix modifiés depuis la capture et attend l’enregistrement des sélections MCP.

Les secrets, scopes arbitraires et URLs fournies comme réponses sont interdits. La v1 doit
conserver sa sémantique pour relire ses snapshots ; un changement sémantique demande une
nouvelle version et une stratégie de lecture. Les limites locales et de corps HTTP existantes
s’appliquent. Aucun service, coût, job fournisseur ou ressource distante n’est créé par préparer.

## Connexion native et présentation

Notion garde ses permissions réelles : l’intention de lecture n’est pas une garantie OAuth
readonly. Linear offre son endpoint officiel `/mcp/readonly`, distinct de `/mcp`. Le gestionnaire
ne réutilise les secrets qu’à endpoint identique et conserve le readonly lors d’une reconnexion.
Les pastilles nomment les deux périmètres ; une alerte signale un accès standard également
sélectionné, sans le désélectionner ni révoquer un consentement implicitement.

Slack demande encore une application enregistrée et une intégration côté serveur. Les scopes
bot et utilisateur sont séparés ; le mode App user prépare le besoin mais ne fournit pas
un runtime OAuth multi-utilisateur. Les boutons MCP passent par le gestionnaire existant.
Le runner natif isolé ne reçoit pas automatiquement les outils MCP ; le pont hôte reste la
voie existante. Le consentement réel Linear Read a été ouvert puis annulé pendant la QA,
sans octroi d’accès. Aucun test n’a envoyé de message ou modifié une ressource externe.

## Vérification et suite

[Preuves et limites de livraison](missions/creation-experience/evidence/guided-connectors/RESULTS.md).
Étendre les guides à d’autres fournisseurs demande de vérifier leurs contrats officiels et
leurs parcours, pas de copier des scopes entre services. L’adaptateur Slack préenregistré,
le runtime App user et les API partagées App + chat restent des tranches séparées.
