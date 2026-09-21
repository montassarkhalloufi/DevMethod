# Lovable — parcours des configurations observées

17 septembre 2026. Inspection interactive dans Chrome, sur la session autorisée par
l’utilisateur. Ce relevé porte sur l’interface effectivement accessible ; les mécanismes
internes sont documentés séparément dans [RESEARCH.md](RESEARCH.md). La traduction en
écarts DevMethod est dans [DEVMethod-GAPS.md](DEVMethod-GAPS.md).

## Portée et méthode

Les familles de configuration de l’espace et du projet ont été parcourues. Les formulaires
ont été ouverts, leurs options d’authentification examinées puis abandonnées sans sauvegarde.
Aucun compte fournisseur connecté, consentement OAuth accordé, email envoyé, paiement,
achat, publication, migration ou demande de génération déclenché. Les réglages existants
n’ont pas été changés. Les données de compte, identifiants de projet et liens d’aperçu
authentifiés ne sont pas reproduits ici.

Le catalogue affichait 115 entrées et 5 activations. Cela ne constitue **pas 115 tests
de connecteurs** : les parcours représentatifs et mécanismes configurables ont été
examinés, pas chaque fournisseur ni chaque opération distante. Les fonctions verrouillées
par l’offre du compte ou par l’activation du Cloud sont identifiées ci-dessous. L’inspection
ne donne pas accès au code interne de Lovable.

## Accueil, travail et navigation

| Surface | Observation | Conséquence utile pour DevMethod |
| --- | --- | --- |
| Accueil | Point de départ centré sur la demande, raccourci de connexion d’outils, projets et modèles ; navigation globale repliable | Accueil distinct d’un projet, avec création, import et reprise explicites |
| Projet | Discussion et résultat côte à côte ; onglets Preview, Files, Code, More ; accès à l’historique | Garder le produit visible ; ouvrir les réglages secondaires à la demande |
| Composeur | Build modifie directement, Plan discute avant construction ; menu Project vers historique, knowledge, settings, GitHub/GitLab | Séparer mode de travail et permissions ; conserver le brouillon lors des changements de vue |
| Contexte | Skills, Projects, Connectors, Project connectors, capture et pièces jointes dans un menu recherché | Ne pas confondre outils disponibles, outils liés au projet et pièces de contexte |
| Historique | Versions datées, signets, menu d’actions, retour à une version | La sélection/inspection d’une version doit rester distincte de son adoption |
| Files | Recherche, grille/liste, aperçu ; état vide dans le projet inspecté | Un espace de fichiers produit n’est pas l’arborescence du code |
| Code | Recherche et arbre dépliable ; lecture seule avec offre supérieure proposée sur ce compte | Afficher les capacités réelles du compte sans simuler une édition |
| Aperçu | Taille d’écran, actualisation, sélection de page, sélection d’élément, texte, dessin et commentaire | Les outils contextuels évitent de charger l’espace permanent |

Les captures Bolt fournies par l’utilisateur décrivent les plans et journaux d’actions.
Cette session Lovable ne comportait pas de génération en cours : elle ne vérifie donc
pas la latence réelle d’un plan en streaming.

## Catalogue et connexions

Catalogue en fenêtre dédiée, recherche, icônes, états, tri et catégories. Catégories
affichées : Ecommerce 10, Marketing 17, Messaging 11, Productivity 51, Sales 14,
Security 2, Google 13, Microsoft 10, AWS 3. Les catégories peuvent se recouper ; leurs
compteurs ne sont pas un total de fournisseurs uniques.

Une fiche distingue description, documentation, connexions privées et partagées, puis
la création d’une connexion. Filtres privés : créées par moi/toutes ; partagés : créées
par moi/partagées avec moi/toutes. Une activation du catalogue n’est pas une preuve
d’authentification ou de liaison à une application.

### App + chat et App user

Le cas Power BI a permis de comparer les deux créations depuis la même fiche.

| Dimension | App + chat | App user, affiché en bêta |
| --- | --- | --- |
| Identité utilisée | Une connexion commune, utilisée dans le chat et par les requêtes de l’app | Chaque utilisateur final connecte son propre compte |
| Exemple | Tableau de bord utilisant le compte de service de l’entreprise | Chaque client consulte les données accessibles à son propre compte |
| Configuration observée | Nom, credentials, partage privé par défaut | Nom, client OAuth, credentials du client, partage privé par défaut ; liaison au projet ensuite |
| Power BI | Service principal : tenant, client ID, secret, modèle sémantique par défaut facultatif ; autre parcours avec application OAuth Microsoft | Tenant, client ID et client secret ; configuration des permissions déléguées Dataset.Read.All et Workspace.Read.All |
| Limite affichée | Service principal incompatible avec certains modèles RLS/SSO ; le parcours délégué respecte les droits correspondants | Les permissions du fournisseur et de l’utilisateur restent déterminantes |

Le connecteur Power BI observé expose des requêtes sur modèles sémantiques ; la fiche
ne promet pas l’intégration visuelle de rapports, l’écriture ni leur rafraîchissement.
Les callbacks OAuth du client App user et du connecteur personnalisé standard sont
distincts. Aucun callback, refresh, consentement, accès réel ou révocation n’a été testé.
Voir les [sources spécialisées et limites](RESEARCH.md).

### Ajouter une API personnalisée

Le bouton d’ajout ouvre trois possibilités distinctes : Custom connector, MCP server,
MCP registry. Le formulaire Custom connector définit un fournisseur avant de créer
ses connexions :

- identité : nom, description courte et longue, logo PNG/JPG/WebP facultatif,
  catégorie et lien de documentation ;
- API : URL de base ; authentification Bearer, clé en header, clé en query, Basic,
  avancée ou OAuth 2 ;
- contrôle de connexion : méthode HTTP et chemin d’une requête de test ;
- mode avancé : clé du champ, libellé, emplacement header, nom du header, préfixe,
  caractère secret et aperçu de la requête ; plusieurs champs possibles ;
- OAuth : URLs d’autorisation et de token, scopes, séparateur facultatif, PKCE,
  callback fourni ; client ID/secret configurés ensuite par l’espace ;
- connaissances pour l’agent : fichiers nommés avec description d’usage et contenu
  expliquant endpoints, requêtes/réponses et pièges, sans credentials.

Les contrôles Save/Create restaient inutilisés. Le formulaire révèle le contrat
proposé à l’utilisateur ; il ne prouve pas les détails du stockage ou de l’exécuteur.

### MCP : trois rôles à ne pas mélanger

| Parcours | Paramètres visibles | Ce qui n’a pas été exécuté |
| --- | --- | --- |
| Ajouter un serveur à l’agent | Nom, URL, OAuth par défaut, Bearer/API key ou aucune auth ; bouton adapté Add & authorize/Add server | Handshake, liste d’outils, appels et permissions effectives |
| Ajouter un registre MCP | URL du registre, nom d’affichage facultatif, Bearer facultatif ; connexion désactivée si vide | Ingestion d’annuaire et connexion à une de ses entrées |
| Piloter Lovable depuis un autre agent | Settings → MCP server, endpoint Lovable, OAuth, guides Claude/Claude Code/Cursor/VS Code | Attribution d’accès et actions de construction/déploiement/SQL |
| Exposer l’app aux assistants | Projet → Agent integrations, documentation et bouton d’activation | Activation, publication et usage par ChatGPT/Claude |

Un registre est un annuaire. Il ne remplace pas l’authentification de chacun des serveurs.
Le MCP du produit Lovable et le MCP d’une application publiée ont des consommateurs
différents de celui d’un outil appelé par l’agent constructeur.

## Réglages de l’espace

Toutes les entrées suivantes ont été ouvertes ; les niveaux d’offre indiquent ce qui
était affiché dans cette session, sans garantie de tarification ou de disponibilité future.

| Entrée | Configuration ou limite observée |
| --- | --- |
| Account | Profil, préférences, entraînement IA, comptes liés, sécurité, sessions, suppression ; valeurs personnelles non conservées |
| Devices & apps | Slack, Telegram, desktop macOS/Windows et mobile ; MCP local lié au desktop |
| Workspace general | Nom/avatar/identifiant/handle, plafond mensuel membre, transfert propriétaire, quitter, suppression récupérable pendant 60 jours selon l’UI |
| Plans & credit usage | Offres, périodicité, crédits, consommation ; aucun achat ni changement |
| Slack | DMs avec contexte personnel/partagé ; canaux avec contexte workspace visible par les membres ; consentement de connexion non donné |
| People | Membres, rôle, date, usage mensuel/total ; aucune invitation |
| Groups / Identity | Écrans réservés Business, gouvernance et identité/SSO |
| Knowledge | Instructions communes aux projets : conventions, bibliothèques, comportement |
| Skills | Ajout/import, invocation par slash ou automatique ; accessibilité, objectif, migration, redesign, SEO, création de skill/vidéo parmi les exemples visibles |
| Templates | Réservé Business |
| Connector settings | Gouvernance Business ; accès aux registres MCP et formulaire d’ajout |
| Git | GitHub, GitLab.com/self-managed, Bitbucket Cloud ; connexions disponibles aux projets |
| Build secrets | Réservé Enterprise ; secrets d’environnement de build |
| Managed registry | Registre npm privé Enterprise ; distinct des registres MCP |
| MCP server | Connexion d’agents externes au compte Lovable via OAuth |
| Workspace domains | Achat/transfert, offre Pro ; aucune opération effectuée |
| Privacy & security | Politiques d’accès, publication, partage, conservation et protection détaillées ci-dessous |
| Security center | Business : insights, analyse de code, chaîne de dépendances, secrets, automatisation |
| Audit logs | Réservé Enterprise |

Privacy & security rassemble : accès par défaut des projets, invitations, 2FA,
découverte de l’espace, profils publics, collaborateurs externes, transferts et rôles ;
accès/publication du site, invitations au site, méthodes de connexion et blocage sur
problèmes critiques ; correction automatique ; inactivité/suppression ; partage de
preview, téléchargement et partage entre projets ; MCP distant et MCP local desktop ;
détection de données sensibles, restriction des buckets publics et région de données.
Plusieurs commandes étaient verrouillées Business/Enterprise. Aucun switch n’a été changé.

## Réglages du projet dans More

| Espace | Détails effectivement lus |
| --- | --- |
| Analytics | Période, visiteurs, pages vues, durée/rebond, pages/sources/appareils/pays ; publication requise pour les données |
| Cloud overview | Logs et secrets accessibles ; activation supplémentaire proposée pour base, authentification, utilisateurs et stockage ; connexion à un projet Supabase existant proposée |
| Cloud emails | Envoi au nom de son domaine et délivrabilité ; activation via offre supérieure affichée |
| Cloud secrets | Liste nom/date ; ajout nom/valeur, champs multiples ; l’UI annonce effet immédiat en aperçu et après publication sur le site |
| Cloud logs | Recherche, période, statut, actualisation, téléchargement/copier, pagination ; aucun export réalisé |
| Cloud usage | Période et séries database, compute, network, storage, realtime, AI ; détail base/stockage base et délai possible des mesures |
| AI | Modèle, période, crédits/requêtes/succès/durée ; table statut, run, modèle, crédits, temps, requêtes ; historique Free limité à 24 h et offre supérieure jusqu’à 90 jours ; lien plafond menant à la facturation |
| Agent integrations | Exposer l’application publiée aux assistants ; activation non faite |
| Payments | Paiements intégrés et Shopify, documentation, Explore payments ; lancement agent/configuration commerciale non effectué |
| Connectors | Connexions réellement liées au projet, état vide et accès au catalogue complet |
| Security | Basic/Deep scan, résultats, dépendances dépliables ; scans non lancés ; mémoire de sécurité contextualisant environnement, utilisateurs et sensibilité des données |
| SEO & AI search | Recherche Semrush, suggestions, domaines ; revue existante avec catégories sitemap, contenu/accessibilité, métadonnées, social, données structurées, robots et bases de page ; corriger/ignorer non actionnés |
| Settings general | Nom, sous-domaine, compteurs ; monitoring Pro ; live preview ; catégorie, badge, analytics, contexte des appels IA, correction sécurité et trust center ; partage/remix/transfert/déplacement/suppression |
| Settings knowledge | But, utilisateurs, stack, API, schéma et règles projet ; lien aux règles communes workspace |
| Settings domains | Acheter ou connecter un domaine, offre Pro ; aucun achat |
| Settings Git | Synchronisation bidirectionnelle GitHub/GitLab/Bitbucket ; l’UI précise création d’un nouveau dépôt et absence d’import d’un dépôt existant |

Le volet Share distingue invitation par email/lien, accès de l’espace et rôle d’édition,
partage de preview. Le volet Publish montre état non publié, sous-domaine, domaine
personnalisé, icône/métadonnées, audience et résumé de sécurité avant son bouton final.
L’édition dans le Studio, l’accès au projet et la publication du site sont donc trois
états distincts. La publication n’a pas été déclenchée.

## Limites de la conclusion

Une page indiquant zéro dépendance, aucune activité ou aucun problème ne prouve pas
qu’un scan a été exécuté : dans ce projet, Security proposait encore le premier scan.
Les détails de Cloud nécessitant son activation, les contrôles payants, le code éditable,
les tenants OAuth et les actions fournisseur restent non essayés. Les options de rôle,
de plan et de transport sont complétées par les sources officielles, pas inventées à
partir des boutons. Ce relevé sert de référence UX et de périmètre fonctionnel ; il
ne constitue ni une rétro-ingénierie du backend ni un audit de sécurité de Lovable.
