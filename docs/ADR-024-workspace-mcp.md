# ADR 024 — Connexions MCP de l’espace et services du projet

Date : 2026-09-17. Statut : accepté dans la portée locale demandée par l’utilisateur.
Complète [ADR 022](ADR-022-connectors-host-bridge.md) et [ADR 023](ADR-023-studio-home.md).

## Besoin et décision

L’utilisateur distingue explicitement un serveur MCP réutilisable dans plusieurs projets
(par exemple documenter le projet dans Notion) d’une API nécessaire au fonctionnement
d’une application. Il demande un bouton Connecter effectif et une sélection visible dans
le prompt. Un simple enregistrement de références ou une attestation hôte ne suffit plus.

L’accueil possède un gestionnaire MCP partagé par ses Studios enfants. Chaque projet
conserve uniquement les identifiants de ses connexions sélectionnées ; ni les credentials,
ni les sessions OAuth ne sont copiés dans le workspace du produit. Les API applicatives
restent dans le catalogue du projet : les sélectionner décrit une intention d’intégration,
sans donner à l’application un accès au compte MCP de son créateur.

Alternatives : une connexion par projet multiplierait les consentements et mélangerait
identité du créateur et identité de l’application ; une délégation exclusive aux plugins
de l’hôte ne permettrait pas au bouton Connecter de fonctionner de façon observable.
Un service de credentials distant nécessiterait comptes, hébergement et exploitation,
absents de la portée locale. Le gestionnaire local mutualisé est retenu sous la délégation
technique existante. Il ne constitue pas une architecture multi-utilisateur publique.

## Connexion et contrat

Le SDK MCP officiel assure initialisation, découverte OAuth, enregistrement dynamique,
PKCE S256, échange du code, rafraîchissement et transports Streamable HTTP / repli SSE.
Notion, Linear et Sentry ont des endpoints préconfigurés ; un serveur personnalisé accepte
OAuth, Bearer ou aucun secret. Les fournisseurs qui exigent un client préenregistré non
configuré restent en erreur explicite. Une URL valide n’est pas une connexion réussie.

L’état `connected` exige une initialisation et un `tools/list` réussis et bornés. Le catalogue
public contient noms, descriptions et empreintes de schémas ; les schémas complets restent
côté serveur pour validation des appels. Le registre privé est sous `.mcp-private` dans
la bibliothèque, avec dossier 0700 et fichier 0600. Il n’est pas chiffré par un coffre OS.
Le propriétaire du poste peut y accéder. Les secrets ne sont pas retournés au navigateur,
placés dans le prompt ou inclus dans l’export du projet.

OAuth utilise un état aléatoire à usage unique, un vérificateur PKCE en mémoire et un
retour loopback vers l’accueil, expirant après dix minutes. Redémarrer exige de reprendre
un consentement interrompu. Après redémarrage, les connexions sauvegardées redeviennent
`disconnected` jusqu’à une vérification explicite ; aucun statut vert n’est déduit d’un jeton
sur disque. Déconnecter annule l’opération et efface les credentials locaux. Cela ne révoque
pas un consentement dans le compte du fournisseur ; sa révocation reste disponible là-bas.

Les mutations navigateur exigent l’Origin exacte et le Host est contrôlé. Les URLs ne
contiennent ni identifiants, ni fragments, ni query secrets. HTTPS est requis hors serveur
loopback explicitement choisi. Les destinations DNS sont vérifiées et l’adresse du socket
épinglée ; aucune redirection HTTP automatique ne transporte des credentials. Les réponses,
les listes et les délais sont bornés. Les erreurs n’exposent pas les réponses sensibles.

## Consommation depuis le projet

La sélection du prompt est persistée par projet. Un job enregistre les connexions permises
à sa prise en charge. Le pont hôte expose la découverte et l’appel via le token worker,
en exigeant un job courant, une révision de base courante, une connexion sélectionnée
encore active et un outil connu. Le schéma des arguments est vérifié avant appel ; un contrat
modifié, une désélection, une déconnexion ou un job obsolète invalide l’autorisation locale.
La validation de schéma externe est isolée dans un worker avec délai et mémoire bornés.

Les résultats MCP sont des données externes, pas des instructions. La connexion et la
sélection ne donnent pas une autorisation générale d’envoyer, publier ou modifier des données.
Les commandes du pont permettent à l’agent hôte de réaliser les actions demandées avec ses
règles habituelles. L’identité de chaque utilisateur final de l’app (`App user`) et son cycle
OAuth séparé ne sont pas implémentés par cette connexion du créateur.

L’agent natif isolé reste sans réseau et sans plugins de l’hôte. Il ne peut pas joindre ce
pont local. Cette limite est annoncée ; on ne relâche pas son sandbox et on n’assimile pas
l’ajout d’instructions au prompt à une intégration technique. Le trajet exécuté est le pont
hôte manuel. Un Studio lancé directement sans l’accueil n’a pas ce gestionnaire partagé.

## Capacité, preuves et révision

Usage local borné : 32 connexions d’espace, 200 outils par connexion, 12 connexions choisies
par projet ; opérations réseau et résultats bornés. Pas de nouvelle infrastructure, de
réplication, de synchronisation de credentials ou de coût fournisseur automatique. Une
mutualisation entre comptes, un serveur public, davantage de connexions ou le support du
runner isolé demanderaient de réexaminer identité, quotas, autorisations et exploitation.

Les tests HTTP avec un serveur MCP/OAuth local exercent réellement le protocole et les
refus, sans prouver la compatibilité commerciale de tous les fournisseurs. Les observations
Bolt et les limites des essais réels restent séparées dans
[BOLT-CONNECTIONS](missions/creation-experience/evidence/lovable-connectors/BOLT-CONNECTIONS.md).
