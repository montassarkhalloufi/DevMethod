# Guides connecteurs — livraison du 17 septembre 2026

Suite au « go » sur le [cadre G1–G3](../lovable-connectors/GUIDED-CONTRACT.md), les guides
Slack, Notion et Linear sont implémentés dans l’accueil et les projets existants.
[Décision et contrat](../../../../ADR-025-guided-connector-preparation.md).

## Résultat

Choix de l’usage, questions propres au fournisseur, retour aux étapes sans perdre les réponses,
résumé calculé côté serveur et ajout explicite à la demande. Les choix sont transmis sous forme
structurée au job, indépendamment de la prose. Dans un projet, le brouillon les conserve après
rechargement ; l’envoi ne supprime pas une nouvelle préparation ajoutée entre-temps.

Les API de projet, outils MCP de l’assistant et comptes des utilisateurs finaux sont séparés.
Le raccord OAuth existant sert Notion/Linear. Slack affiche ce qui reste à implémenter et
les permissions proposées : aucune fausse installation ni connexion « verte ».

## Preuves exécutées

- `npm test` : 1 013 tests réussis, incluant build TypeScript/Vite et protocole HTTP local.
- Après la dernière correction du chargement différé : 28 tests `studio-ui` réussis,
  dont conservation du contexte guidé avant montage du widget.
- Guides : validation stricte, fingerprint/rejeu, CAS, anciens formats, snapshot immuable,
  brouillon rechargé, isolation du secret et refus des champs/scopes injectés.
- UI : reprise des réponses, changement de parcours, préparation en erreur, appels tardifs,
  absence d’OAuth implicite, popup bloquée, annulation, contexte exact et reconnexion readonly.
- Revue indépendante : pertes de brouillon pendant sauvegarde/retour, course pendant attente
  MCP et perte avant chargement widget détectées puis corrigées et couvertes.
- ESLint et Prettier sur le dépôt : réussis.
- `npm pack --dry-run --cache /private/tmp/devmethod-guides-npm-cache` : réussi.
  Cache temporaire utilisé après une erreur de permission du cache npm habituel ; aucune publication.
- `npm run check:docs` et `git diff --check` : réussis.

## Parcours navigateur observés

Dans une bibliothèque locale dédiée `/private/tmp/devmethod-guided-qa` :

1. Accueil → Configurer Slack → bot → messages → canaux publics choisis → résumé → ajout au
   prompt → création en mode Planifier. Le projet contient la demande et le snapshot Slack ;
   aucun agent n’est lancé par ce test.
2. Projet existant → Linear → lecture seule → Issues → ajout à la demande → enregistrer →
   recharger. La pastille et la réponse Issues sont retrouvées.
3. Connecter Linear ouvre le consentement réel du fournisseur, intitulé DevMethod Studio,
   accès Read, callback local et ressource `/mcp/readonly`. Annuler revient à une erreur
   explicite ; le guide et ses réponses sont conservés. Aucun consentement n’a été accordé.
4. Premier guide Slack corrigé après constat : le catalogue conservait son scroll bas.
   À la réouverture, focus sur le titre visible et étapes visibles au-dessus des cartes.
5. Desktop : viewport réel 1562 × 762 CSS px. Mobile : viewport demandé 390 × 844,
   réel 354 × 767 à cause du zoom Chrome 110 %. Pas de débordement horizontal,
   choix, progression et ajout restent accessibles par défilement. Override remis à zéro.

Captures : [Slack desktop](slack-desktop.png), [Linear desktop](linear-desktop.png),
[Slack mobile](slack-mobile.png).
Les scénarios concurrentiels originaux restent dans [SCENARIOS](../lovable-connectors/SCENARIOS.md).

## Limites explicites

Il s’agit de trois guides natifs et de leur transmission, pas d’une couverture de tous les
fournisseurs du catalogue. Le parcours OAuth a été réellement exercé jusqu’à l’annulation
pour Linear ; la réussite avec compte accordé et `tools/list` relève des tests protocole
locaux dans cette tranche. Aucun accès privé, message Slack ou écriture Notion/Linear testé.
Slack API et App user demandent encore leur adaptateur et le runtime d’application.
Le brouillon Home reste en mémoire pendant la visite ; seul le brouillon d’un projet est
persisté côté serveur. Les réponses incomplètes non ajoutées au prompt restent en mémoire.
