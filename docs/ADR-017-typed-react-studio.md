# ADR 017 — Sources React typées et compilation locale vérifiable

Date : 2026-09-16. Statut : accepté sous la délégation technique de la mission.
Complète [ADR 016](ADR-016-local-creation-studio.md) ; ne modifie pas les trois modes.

## Besoin et alternatives

L’utilisateur veut modifier un vrai projet React 19+, comprendre sa structure et ses erreurs,
puis essayer son résultat sans quitter Studio. Le précédent éditeur vérifiait seulement la
syntaxe JavaScript/JSON ; un fichier TS affiché comme texte n’aurait pas satisfait ce besoin.

1. Garder HTML/JS et colorer le texte : effort minimal, mais aucun contrat TypeScript exécuté.
2. Profil React/Vite local avec compilation contrôlée et éditeur Monaco : retenu pour cette
   application interactive. Code exportable, séparation vues/hooks/modèle/services, pas de
   serveur applicatif supplémentaire.
3. Next.js avec Server Components et NestJS pour un backend métier : pertinent selon les
   besoins de rendu, secrets, authentification et services ; complexité non justifiée par
   l’API JSON locale actuelle. Vite n’implémente pas les Server Components. NestJS est un
   framework backend, pas une alternative au bundler Vite. Aucune compatibilité runtime
   Next/Nest n’est annoncée pour ce profil.

## Contrat choisi

Le manifeste `package.json` déclare `devmethod.profile: "react-ts"`. La source comprend
`index.html`, `src/main.tsx` et `src/styles.css`. Le template exporté contient Vite et son
plugin React, TypeScript strict/noUncheckedIndexedAccess, Tailwind et un Button adapté de
shadcn avec attribution MIT. Les hooks synchronisent React et les données ; les règles
pures et la validation des réponses réseau sont dans des modules distincts.

Studio prend un snapshot des sources et lance un compilateur de confiance borné dans un
processus séparé. TypeScript contrôle tous les fichiers TS/TSX de src avec des options
strictes imposées. Esbuild lie React et une liste explicite de bibliothèques installées ;
Tailwind génère les styles depuis ces sources. Les scripts et configurations exécutables du
projet ne sont pas exécutés. Aucun téléchargement ni installation par build. Une dépendance
absente est un diagnostic, pas une fausse promesse de portabilité.

`app/` conserve les sources originales. `compiled/` possède son propre manifeste d’empreintes,
lié à la révision. Le preview ne sert que les artefacts déclarés et vérifiés. L’adoption
recontrôle la base, le contexte et les sources ; une erreur ne remplace ni le code actif,
ni les saisies, ni les données. L’export inclut sources, artefacts, décisions et données :
le runtime de lecture fonctionne sans recompilation. L’utilisation autonome de Vite installe
les dépendances déclarées et nécessite Node compatible avec cette version de Vite.

Monaco s’exécute dans un composant React typé, avec workers et CSS locaux. Il colore selon
l’extension, affiche les lignes et diagnostics et permet l’édition/diff. Ses diagnostics de
fichier restent distincts du typecheck complet côté serveur. Le texte de secours reste
accessible si le bundle ne charge pas, avec une limitation visible.

## Coûts, limites et autorité

Le paquet distribué devient plus lourd et embarque des dépendances de compilation. Le CLI
méthode n’en importe pas lors d’une installation de skills, mais le paquet n’est plus sans
runtime dependencies. Versions exactes et lockfile sont conservés. Aucun service payant.
La coloration n’est pas une preuve de correction ; le typage ne remplace pas les contrôles
métier, les essais navigateur ni la comparaison avec une approche simple.

La palette globale reste une décision visuelle distincte : après cet ADR, l’utilisateur a
validé la référence M bleu nuit/ardoise, décrite dans le contrat de design du Studio.
L’évolution technique et la coloration sont explicitement demandées.

## Critères fixés avant les essais d’intégration

- Projet React 19 strict réellement compilé et exécutable ; CSS Tailwind produit.
- Erreur de type → fichier/ligne/direction, aucune adoption ; correction → aperçu renouvelé.
- Source TS exacte conservée dans le diff/export ; données inchangées à l’adoption/redémarrage.
- Éditeur réel vérifié dans un navigateur : coloration TSX/CSS/JSON, saisie, changement de
  fichier, diagnostics et reprise ; les tests DOM seuls ne valident pas Monaco ni sa CSP.
- Template générique et exemple métier passent leur tsc et Vite ; pas de réécriture des
  anciennes preuves figées. Compilation bornée à 15 s, aucun nouvel appel de modèle natif
  (budget précédent clos). En cas d’échec, conserver le brouillon et le dernier build valide.

Sources officielles consultées : [React TypeScript](https://react.dev/learn/typescript),
[choisir une application React](https://react.dev/learn/creating-a-react-app),
[Vite](https://vite.dev/guide/), [shadcn avec Vite](https://ui.shadcn.com/docs/installation/vite),
[Tailwind/Vite](https://tailwindcss.com/docs/installation/using-vite),
[Monaco](https://microsoft.github.io/monaco-editor/).
