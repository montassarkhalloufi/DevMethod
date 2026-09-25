# Les Ateliers

Application navigateur locale en HTML, CSS et JavaScript natifs. Elle attend le service fourni par l’environnement sur la même origine :

- `GET /api/data` → `{ "version": ..., "data": ... }`
- `POST /api/data` avec `{ "version": ..., "data": ... }`

Un `409` recharge la version courante sans effacer la saisie locale, puis propose de rejouer l’inscription sur ces données fraîches. Les données initiales ne sont envoyées que si le service ne contient encore aucune donnée.

Tests de logique : `node --test app/tests.mjs` depuis la racine du projet.
