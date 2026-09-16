# Les Ateliers — exemple React typé

Port React 19 de l’application locale Les Ateliers, à partir de la révision
`1aea70fe-1134-4dfa-a872-a79e3003b6aa`. Il conserve la composition Agenda,
les trois catégories, les filtres, inscriptions, annulations et liste d’attente
FIFO. Il ne crée ni une nouvelle validation visuelle ni une preuve comparative
de supériorité de DevMethod.

## Sources et exécution

Le profil `package.json` `devmethod.profile: "react-ts"`, les entrées
`src/main.tsx` / `src/styles.css` et l’alias `@/` sont compatibles avec le
compilateur de confiance de Studio. Copier les sources de ce dossier dans
`app/` d’un travail Studio, sans `node_modules/` ni `dist/`, puis conserver le
parcours normal de compilation, vérification et adoption du projet. Ce dossier
est un exemple de sources ; il n’active pas automatiquement une révision existante.

Avec Node ≥ 22.12 et les dépendances du manifeste installées :

```sh
npm run typecheck
npm test
npm run build
```

Le build Vite exporte `dist/`. Le serveur qui le sert doit aussi fournir
`/api/data` sur la même origine. `npm run dev` et `npm run preview` démarrent
uniquement Vite : sans cette API ou proxy explicitement configuré, l’interface
signale une erreur de chargement. Elle ne remplace pas le stockage métier par
un faux résultat local.

## Contrat métier

`GET /api/data` renvoie `{ version, data }`. `POST /api/data` reçoit
`{ version, data }`, confirme la nouvelle version ou refuse une écriture devenue
obsolète par `409`. Les données sont validées à la frontière du service.
Seul l’objet initial `{}` déclenche la création du programme de démonstration.
Un format inconnu provoque une erreur explicite, sans remise à zéro.

Les champs inconnus sont conservés, y compris ceux des inscriptions existantes.
Une ancienne structure sans `waitlist` est lue avec une liste vide. Un atelier
complet propose une attente ; l’annulation d’une inscription promeut, dans la
même écriture, la première personne en attente de cet atelier. Aucun email
n’est envoyé. Le libellé « Mes inscriptions » désigne les inscriptions de cette
démonstration partagée : il n’existe pas d’identité ni d’authentification.

Après un conflit, les données sont relues et la demande reste disponible pour
une nouvelle tentative explicite. Un clic n’est annoncé enregistré qu’après
l’accusé de réception de l’API. Les champs saisis restent dans le navigateur
(`les-ateliers:drafts:v1`) jusqu’à confirmation ; une indisponibilité du stockage
est indiquée et la saisie demeure alors en mémoire pour la session.

## Séparation et vérification

- `model/` : types, validation, capacité, FIFO et transitions immuables.
- `services/` : transport injectable et contrôle des réponses HTTP.
- `hooks/` : cycle des requêtes, interruption, conflits et brouillons de saisie.
- `components/` : vues Agenda, formulaire et inscriptions ; `app/` les compose.

Les dix tests de `tests/` couvrent notamment la reprise d’anciennes données,
le refus d’un format incompatible, la conservation des champs, la promotion
FIFO, l’initialisation concurrente et l’absence de faux succès sur `409`/`500`.
TypeScript strict et les builds Vite contrôlent les sources. Ces contrôles ne
remplacent pas un essai navigateur de la révision React ni une validation humaine.

Le Button est une adaptation réelle de shadcn/ui, documentée dans
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Les images externes et les polices
distantes ne sont pas nécessaires. L’exemple ne fournit ni cloud, ni comptes,
ni framework serveur ; il utilise le stockage JSON local de Studio.
