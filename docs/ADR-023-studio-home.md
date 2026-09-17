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
exacte, un corps JSON de 64 Kio maximum et un schéma fermé. Les chemins fournis sont
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
