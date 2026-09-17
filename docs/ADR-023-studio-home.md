# ADR 023 — Accueil local et bibliothèque de projets Studio

Date : 2026-09-17. Statut : accepté dans la portée locale autorisée. Complète
[ADR 016](ADR-016-local-creation-studio.md) et [ADR 021](ADR-021-import-existing-project.md).

## Besoin et choix

L’utilisateur demande que l’URL d’entrée présente les parcours Nouveau, Importer et
Reprendre, sans effacer le projet déjà ouvert. Sous la délégation des choix techniques
réversibles, l’accueil devient un serveur loopback indépendant avec un registre local
persistant. Chaque projet garde son workspace, son verrou et son serveur Studio existant.

Un serveur unique changeant de workspace rendrait ambigus les requêtes en cours, les
aperçus et l’arrêt des jobs. Un simple écran ajouté au serveur d’un projet conserverait
la dépendance à ce projet initial. L’accueil séparé permet de reprendre les contrats de
stockage et d’import sans faire migrer les projets. Le lancement direct reste utilisable ;
la décision peut être révisée sans convertir leurs fichiers.

## Contrats et cycle de vie

`devmethod studio` sans workspace ouvre l’accueil. `studio home --workspace DOSSIER`
choisit sa bibliothèque ; avec un workspace et sans sous-commande, le CLI conserve le
lancement direct d’un projet. Les autres commandes exigent leur workspace comme auparavant.

Le registre contient au plus 200 projets, identifiés par UUID, avec nom, origine
`new|imported|existing`, workspace, date de création et dernière ouverture. Les nouveaux
projets et copies importées résident sous `projects/UUID`. L’ajout d’un workspace existant
inspecte son état sans le réinitialiser ni prendre son verrou. Il n’y a pas de découverte
automatique du disque, de suppression de projet ou de synchronisation de dépôt.

Les mutations de registre sont sérialisées et publiées atomiquement. La création associe
un `requestId` à l’empreinte de son contenu : un rejeu identique restitue le projet enregistré,
un contenu différent produit un conflit. Le registre et les reçus survivent à un arrêt normal.
Ils sont distincts de l’état du produit et de son export.

Ouvrir démarre `startStudio` avec ports attribués par le système, bridge hôte manuel et
URL de retour vers l’accueil. Une ouverture répétée réutilise l’instance possédée. L’accueil
ne lit jamais `runtime.json` pour obtenir une adresse à suivre ou une cible réseau.
Un projet verrouillé par une autre session produit une erreur actionnable ; cette session
et son verrou restent intacts. À l’arrêt, l’accueil termine uniquement ses enfants puis
libère son propre verrou.

## Frontières et limites

Le serveur écoute sur `127.0.0.1`. Le Host est strict et les mutations exigent l’Origin
exacte et un schéma fermé. Le corps JSON est limité à 64 Kio hors création enrichie,
bornée à 12 Mio pour ses pièces jointes. Les chemins fournis sont
absolus et les liens symboliques refusés. Les messages d’erreur ne reprennent pas les
contenus natifs susceptibles de contenir des chemins ou secrets. L’import réutilise ses
contrôles, exclusions et limites existants ; aucun script source n’est exécuté.

Ce modèle vise un usage local par la personne qui contrôle le poste. Il n’ajoute ni
authentification multi-utilisateur, ni partage distant, ni appel fournisseur automatique.
Les sessions ouvertes restent actives jusqu’à l’arrêt de l’accueil ; il n’y a pas de mise
en veille automatique. Les ports changent après redémarrage, donc les données propres
à une origine navigateur ne bénéficient pas d’une adresse stable. Les fichiers Studio
persistent indépendamment ; le lancement direct à ports fixes reste disponible.

Un arrêt brutal peut laisser des verrous à inspecter explicitement. Leur retrait automatique
est exclu. L’écriture atomique du registre ne constitue pas une transaction couvrant
l’ensemble du système de fichiers : un crash entre création du workspace et publication
du registre peut laisser un dossier non référencé. Aucun nettoyage destructif automatique
n’est effectué. Une politique de récupération, un usage distant ou un volume dépassant
la bibliothèque bornée nécessiteraient de réexaminer cette décision.

Les contrats sont exercés par `studio-home-store.test.mjs`, `studio-home-server.test.mjs`,
`studio-home-cli.test.mjs` et `studio-home-ui.test.mjs`. Les résultats datés restent dans
les enregistrements de vérification du chantier ; cet ADR ne tient pas de compteur de tests.

## Extension du 17 septembre — idée, options et inspirations

L’utilisateur a précisé que l’entrée devait être compétitive avec Bolt et Lovable,
centrée sur le besoin et accompagnée d’une galerie vivante. Le nom devient facultatif ;
un objet `launch` optionnel conserve le type, l’action initiale, la direction visuelle,
les intentions de services et les références. Les clients historiques sans `launch`
gardent leur comportement. Les champs et limites sont contrôlés avant toute écriture ;
la demande composée est bornée à 20 000 caractères. Quatre fichiers de 2 Mio au plus
sont validés, nommés par UUID et copiés sans exécution dans le workspace créé.

Une création enrichie publie sa première demande une seule fois. Le reçu existant couvre
le contenu normalisé et les références ; un rejeu identique après redémarrage retrouve
le projet et le même job. Une erreur avant publication nettoie uniquement le nouveau
dossier possédé. La limite de transaction face à un crash brutal décrite plus haut reste
applicable. Le mode Plan est une instruction initiale explicite ; il ne crée pas un
verrou permanent empêchant une nouvelle demande de réalisation.

Les inspirations sont des démonstrations locales interactives. Réutiliser une inspiration
prépare le brief et le style ; cela ne prétend pas importer ses sources. Le catalogue de
services n’est chargé qu’à l’ouverture des options correspondantes. Ni la galerie ni les
préférences n’accordent une autorisation externe ou ne lancent un fournisseur.

## Extension du 17 septembre — aperçus réels des projets

Les cartes récentes affichent les fichiers de la version active, ou de la dernière candidate
quand aucune version n’est active. Un serveur loopback distinct sert uniquement des fichiers
vérifiés contre le manifeste et leur empreinte. Les états vide, sources sans runtime et artefact
indisponible sont explicites. Consulter la bibliothèque n’ouvre pas tous les Studios et ne
consomme pas leurs verrous. Les iframes sont montées près de la zone visible et redimensionnées
à partir d’un viewport fixe ; elles sont non interactives, sandboxées sans `allow-same-origin`.

Pour les applications utilisant le contrat local `/api/data`, le document reçoit un instantané
en lecture seule des données sauvegardées valides, au plus 1 Mio. Un adaptateur `fetch` local
retourne cet instantané pour GET et refuse les mutations ; aucune donnée n’est créée ou
réinitialisée. Les autres API ne sont pas simulées. Une application dépendant d’API externes
peut donc ne pas produire une vignette complète. Le réseau `connect-src`, les formulaires et
les frames imbriquées sont bloqués. Cette politique ne prétend pas neutraliser toute navigation
possible d’un document arbitraire ; l’origine et le sandbox séparent l’application du shell.

Une capture d’image préalable introduirait un navigateur de rendu et son cycle de vie. Un port
par projet ajouterait des serveurs au volume de la bibliothèque. L’origine de lecture commune,
avec snapshot propre à chaque document et aucun endpoint global de données, suffit à la
bibliothèque locale bornée. Un hébergement public nécessiterait une isolation réexaminée.
