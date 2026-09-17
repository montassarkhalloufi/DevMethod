# Accueil enrichi, aperçus et connexions MCP — 17 septembre 2026

Base : `0a885b8`. Portée : modifications locales sur `codex/typed-react-studio`.
Demande et décisions : [PLAN](../../PLAN.md), [ADR 023](../../../../ADR-023-studio-home.md),
[ADR 024](../../../../ADR-024-workspace-mcp.md). Aucun déploiement public ni push.

## Résultat livré

- Compositeur centré sur l’idée, nom facultatif, type de projet, Plan/Construire, direction
  visuelle, liens, fichiers et préférences de services. Première demande persistante et
  création idempotente ; les imports et la reprise conservent leurs parcours existants.
- Six inspirations originales interactives : portfolio, tableau de bord, boutique,
  rendez-vous, Kanban et présentation. Recherche/catégories, fenêtre d’essai et reprise
  du brief/style. Les données restent explicitement fictives ; choisir n’importe pas
  une application déjà construite.
- Projets récents avec leurs vrais fichiers générés et données locales sauvegardées en
  lecture seule ; états sans version, sources sans runtime et indisponibilité explicites.
- Serveurs MCP de l’espace avec OAuth, Bearer ou sans authentification ; sélection visible
  dans le prompt, partagée entre projets au choix. Le pont hôte appelle réellement les
  outils selon les permissions et le job courants. Les API du projet restent des intentions
  d’intégration distinctes des connexions du créateur.
- Deux animations demandées : exemples tapés/effacés en boucle et contour lumineux porté
  de 2 à 3 px. Le texte n’entre jamais dans la valeur du champ. Au focus, l’exemple laisse
  une invitation stable et le halo se met en pause. Mouvement réduit : animations désactivées.

## Recette navigateur réelle

Chrome, bibliothèque temporaire dédiée, accueil `127.0.0.1:4360`. Aucun nouveau modèle
produit lancé et aucun job de recette pris en charge automatiquement.

| Parcours | Observation |
| --- | --- |
| Galerie | Démo Pause : jour/créneau modifiables, retour visuel immédiat ; réutiliser remplit idée, type et style sans perdre le contenu précédent. |
| Création Plan | Idée, type, style, préférence Notion et lien conservés dans la nouvelle demande ; statut en attente, aucune exécution commencée. |
| Brouillon | Ouvrir Les Ateliers depuis une idée non enregistrée ouvre la confirmation ; Garder mon idée préserve la saisie et laisse la page utilisable. |
| Aperçu réel | Les Ateliers affiche les vrais ateliers et disponibilités après remplacement de l’échec réseau par l’instantané de données local en lecture seule. |
| Mobile | Largeur CSS 390 px, document 390 px après correction du halo de fond ; cartes sur une colonne, aperçu 1280 × 800 réduit à la carte. |
| Animations | Placeholder observé à plusieurs étapes de saisie/effacement ; invitation fixe au focus, valeur utilisateur préservée ; contour de 3 px et pause au focus observés. |
| OAuth Notion | Le bouton ouvre l’écran officiel « Grant DevMethod Studio access to Notion », callback loopback vers notre accueil. Aucun consentement accordé ; question utilisateur restée sans réponse pendant la recette, expiration explicite après dix minutes. |
| OAuth local | Serveur de recette distinct : découverte OAuth, enregistrement, PKCE, callback et outils/list réellement échangés. UI « Connecté · 2 outils », sélection visible dans le prompt. |
| Projet avec MCP | Création Plan avec le MCP local sélectionné ; le nouveau Studio conserve son badge connecté et sa sélection, avec la demande en attente. |
| Déconnexion | Depuis le Studio créé, déconnexion du serveur de recette : état Déconnecté et sélection indisponible. Fixture arrêtée ; aucune connexion fictive n’est présentée comme un compte fournisseur réel. |

Captures : [accueil bureau](desktop-composer.png), [MCP sélectionné](desktop-mcp-selected.png),
[aperçu mobile réel](mobile-real-preview.png), [MCP dans le projet créé](studio-mcp-selected.png).
Le redimensionnement d’un ancien onglet avait laissé une capture incohérente ; elle n’est
pas conservée comme preuve. La recette bureau a été reprise dans un nouvel onglet à 1562 px.

## Vérifications automatisées et revue

Le build TypeScript/Vite, les tests du dépôt, ESLint, Prettier, les liens documentaires et
le contenu du paquet sont contrôlés ; résultat machine final dans [validation.json](validation.json).
Les tests couvrent création/rejeu/redémarrage, fichiers et limites, galerie, sauvegarde
avant navigation, aperçus isolés, OAuth/discovery/PKCE/refresh, annulation/rejeu/expiration,
Bearer, SSE, réseau privé et redirections refusés, statut honnête, permissions du job,
CLI authentifié, schémas en worker borné et absence de secrets dans contexte/export.

Revue indépendante : correction des ressources HTML/CSS locales à chemin racine ; réponse
HTTP 205/en-têtes invalides convertie en erreur au lieu d’arrêter le serveur ; admission
MCP transactionnelle après échec disque. Régressions locales reproduites avant correction.
Un test de timeout React a révélé une course dans la fixture : il attend maintenant la
libération du timer de l’ancienne frame avant de déclencher celui de la nouvelle. Aucun
changement de délai produit pour masquer cet échec.

## Limites conservées

- Le protocole local est éprouvé ; les comptes réels Notion/Linear/Sentry ne sont pas
  déclarés connectés ni testés de bout en bout. Notion atteint le consentement seulement.
  [Observations Bolt](../lovable-connectors/BOLT-CONNECTIONS.md) et
  [matrice historique du catalogue](../lovable-connectors/CONNECTION-COVERAGE.md) restent distinctes.
- Le runner natif isolé ne consomme pas ces MCP. L’exécution est celle du pont hôte manuel.
  L’OAuth par utilisateur final (`App user`), les API applicatives natives, un coffre OS,
  l’authentification multi-utilisateur publique et le déploiement restent hors de cette livraison.
- Les aperçus n’émulent pas les API externes ; les chemins construits dans du JavaScript
  libre ne sont pas réécrits. Les règles HTML/CSS ne rebasent que les actifs du manifeste.
- L’upload réel Chrome a été bloqué par la permission d’accès aux URL de fichiers de
  l’extension. Aucun réglage de permission n’a été modifié ; les tests FileReader et HTTP
  sont verts mais ne remplacent pas cet essai navigateur manquant.
- Les captures et recettes agent ne constituent pas une validation visuelle utilisateur
  ni une preuve de supériorité sur Bolt/Lovable. Les références inspirent l’expérience,
  sans copie de leur identité ni promesse d’une parité fonctionnelle complète.
