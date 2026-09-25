# Bolt — parcours de configuration et connexion Notion

Observation interactive du 17 septembre 2026 dans Chrome, session de l’utilisateur.
Complète le [relevé Lovable](UI-OBSERVATIONS.md) et la
[matrice de couverture DevMethod](CONNECTION-COVERAGE.md).

## Configurations examinées

Depuis le menu du compte, Settings donne accès à General, Applications, Knowledge,
Connectors (MCP), Add-on features, Subscription & Tokens, Cloud et Skills library.
General expose notamment thème, sons, modèle par défaut, retour à la ligne et choix
de systèmes de design. Cette observation ne prouve pas chaque option enregistrée.

Le catalogue MCP observé propose Notion, Linear, Miro, Context7, GitHub, Sentry,
Granola, Shaders et Jira, ainsi que l’ajout d’un serveur personnalisé. Son formulaire
a été ouvert : nom, URL, transport HTTP ou SSE, authentification None, API Key ou
MCP OAuth. Choisir API Key fait apparaître le champ masqué et son bouton de visibilité ;
choisir OAuth retire ce champ. L’ajout reste désactivé sans nom et URL. Le réglage
d’activation pour les nouveaux projets est séparé. Ce formulaire a été annulé sans
enregistrer de serveur ni saisir de clé.

La [documentation officielle Bolt](https://support.bolt.new/building/using-bolt/connect-mcp)
décrit ces transports et authentifications, l’activation par projet, les permissions
globales des outils et leur actualisation. Le comportement observé est cohérent avec
ce contrat ; l’implémentation interne de Bolt n’a pas été inspectée.

## Connexion réellement observée

La fiche Notion affichait initialement Connect et aucun outil. Après activation de
Connect, une fenêtre de callback Bolt a été observée puis s’est fermée. La fiche a
ensuite affiché **Connected** et une liste d’outils. Edit a montré :

- URL `https://mcp.notion.com/mcp`, transport HTTP, authentification MCP OAuth ;
- 44 outils sur 44 activés, avec cases individuelles et commande Disable all ;
- indication que les changements d’outils s’appliquent à tous les projets ;
- activation pour les nouveaux projets cochée dans l’état obtenu ;
- menu Edit, Refresh connection, Disconnect.

Edit a été annulé. Aucun outil métier Notion n’a été exécuté, aucun contenu Notion
n’a été lu ou modifié et aucun réglage d’outil n’a été changé. L’agent n’a pas cliqué
sur un écran de consentement fournisseur lors de ce parcours. Une autorisation
existante ou une intervention concurrente peut expliquer le passage par le callback ;
la provenance exacte du consentement n’est pas établie par cette observation.
Le résultat prouve le statut connecté et la découverte affichée, pas le fonctionnement
de chacune des 44 opérations, du refresh token ou de la révocation.

## Applications et captures fournies

Les captures utilisateur montrent Applications : Supabase pour données/authentification,
Netlify pour hébergement, Figma pour import de design, GitHub pour code. La capture de
consentement Netlify indique la création et gestion de projets dans les équipes, avec
retour vers `https://bolt.new/connect/netlify`. La capture Notion affiche le choix de
workspace, les accès présentés et le retour MCP vers Bolt. Ces captures documentent
les écrans ; elles ne constituent pas une autorisation d’accès exécutée par DevMethod.
Supabase, Netlify et Figma n’ont pas été connectés pendant cette recette.

## Conséquence pour DevMethod

Préserver trois dimensions distinctes : service applicatif utilisé par le produit,
outils accessibles à l’agent pendant la construction, et identité de chaque utilisateur
de l’application. Le catalogue DevMethod couvre des intentions et le pont avec l’hôte ;
il ne fournit pas encore les cycles OAuth natifs observés ici. La matrice liée en tête
sépare les contrats testés, les simulations, l’exécution locale et les essais fournisseurs
restant à effectuer. Aucun résultat exhaustif de toutes les connexions n’est annoncé.
