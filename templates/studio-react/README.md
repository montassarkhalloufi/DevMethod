# Démarrage React pour Studio

Socle réutilisable React 19, TypeScript strict (`noUncheckedIndexedAccess`), Vite 8
et Tailwind 4. Il contient un écran de départ et un composant Button adapté de
shadcn/ui ; aucun métier, compte utilisateur ou service externe n’est simulé.

Le champ `package.json` `devmethod.profile: "react-ts"` sélectionne explicitement
le profil Studio. Les entrées sont `src/main.tsx` et `src/styles.css` ; l’alias
`@/` désigne `src/`. Le compilateur de confiance de Studio utilise ses dépendances
autorisées et produit des artefacts séparés des sources. Il n’exécute ni les
scripts npm ni `vite.config.ts` du projet et n’installe aucune dépendance.

## Utiliser le socle

Copier ce dossier dans les sources `app/` d’un travail Studio, sans `node_modules/`
ni `dist/`. Conserver `THIRD_PARTY_NOTICES.md` lors de la copie. Pour travailler
hors Studio, avec Node ≥ 22.12 et les dépendances du manifeste installées :

```sh
npm run dev
npm run typecheck
npm run build
npm run preview
```

Vite écrit le site dans `dist/`. Le chemin relatif `base: './'` permet de servir
ces fichiers statiques. Il n’ajoute pas de backend. Une application qui utilise
`/api/data` doit être servie avec l’API locale correspondante ou recevoir un
adaptateur explicite ; `vite preview` seul ne la fournit pas.

## Faire évoluer une fonctionnalité

- `src/app/` compose l’application et ses vues.
- `src/features/<fonction>/components/` contient les éléments d’interface.
- `src/features/<fonction>/hooks/` gère les interactions, requêtes et leur cycle de vie.
- `src/features/<fonction>/model/` contient types et règles pures, testables sans React.
- `src/features/<fonction>/services/` adapte les entrées et sorties externes.
- `src/shared/` contient uniquement les primitives réellement partagées.

Ces dossiers de fonctionnalité se créent lorsque le besoin apparaît. Le socle
n’introduit pas un magasin global, un routeur ou des couches vides. Les couleurs
et variantes sont dans `styles.css` et `shared/ui/button.tsx` ; une direction
visuelle sélectionnée reste une décision de projet à conserver.

## Limites vérifiées

Le Button fournit composition avec Radix Slot, variantes, focus et état désactivé.
Le catalogue complet shadcn n’est pas installé ; sa provenance et la licence MIT
figurent dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Les versions npm sont fixées dans le manifeste. Le profil Studio compilé n’est
pas un serveur Next.js, un moteur RSC ou un backend NestJS. Authentification,
hébergement et services payants ne sont pas fournis par ce socle.
