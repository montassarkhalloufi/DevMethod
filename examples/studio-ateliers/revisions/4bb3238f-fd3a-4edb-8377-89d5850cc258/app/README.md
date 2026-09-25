# Les Ateliers

Application navigateur locale en HTML, CSS et JavaScript natifs. Elle attend le service fourni par l’environnement sur la même origine :

- `GET /api/data` → `{ "version": ..., "data": ... }`
- `POST /api/data` avec `{ "version": ..., "data": ... }`

Un `409` recharge la version courante sans effacer la saisie locale, puis propose de rejouer l’inscription sur ces données fraîches. Les données initiales ne sont envoyées que si le service ne contient encore aucune donnée.

Tests de logique : `node --test app/tests.mjs` depuis la racine du projet.

Évolution : un atelier complet propose une liste d’attente nominative. L’ordre de cette liste, conservé dans les données, détermine la promotion : annuler une inscription donne sa place à la première personne du même atelier. Une personne peut quitter la liste sans modifier les places confirmées. Aucun email n’est envoyé.

Les anciennes données sans `waitlist` sont lues comme une liste vide, sans modifier leurs inscriptions ni leurs champs supplémentaires. Le nouveau champ n’est persisté qu’à une action utilisateur réussie. Une liste existante de format incompatible est refusée au lieu d’être remplacée.

Vérification de cette évolution : 13 tests Node passent (migration additive, capacité, FIFO, redémarrage JSON, retrait de liste, réessai après données concurrentes). Un contrôle DOM avec service simulé en mémoire a vérifié les liaisons formulaire/message/filtre/conflit ; il ne remplace pas le contrôle visuel dans un navigateur.
