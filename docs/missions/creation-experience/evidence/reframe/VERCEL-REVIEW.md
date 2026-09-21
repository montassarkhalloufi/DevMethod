# Revue Vercel — décisions, parcours et lien vers l’inscription

Inspection du 2026-09-16, première passe à 20:14:46 UTC, complément persistance à 20:23:03 UTC. Base Git
`63f70444ec6907e203523f1f57d69be8f7a9360c`, avec modifications locales identifiées ci-dessous.
Cette revue complète [la revue React précédente](../react-studio/VERCEL-REVIEW.md), sans en
étendre rétroactivement les preuves. Le relecteur a participé au backend et a corrigé le P2
ci-dessous pendant cette passe : ce n’est ni une évaluation indépendante du produit complet,
ni une observation de compréhension avec un utilisateur.

## Périmètre et sources

React 19.3.0, TypeScript strict, montage client Vite : `features/decisions/**`,
`features/journey/**`, leurs entrées de widget, et le changement de navigation de
`WorkshopCard.tsx` avec `model/navigation.ts`. Le contrôleur de propositions et les règles CSS
de focus, images et disposition ont été lus pour comprendre leurs frontières ; leur fidélité
visuelle finale à N n’est pas attestée par cette lecture.

Sources effectivement lues : wrapper `react-feature-engineering`, `review-and-sources.md`,
index React Best Practices et Composition Patterns, règles individuelles pertinentes et
[Web Interface Guidelines locales](../../../../../.agents/skills/react-feature-engineering/references/vercel/web-design-guidelines/command.md).
Les pins sont `agent-skills` **063bee94c3f4df8453406c830b0a7df0f2860278** et
Web Interface **e3d624baaf29dc1fc645aff3e38f03e564d2d6b1**, suivant la
[provenance distribuée](../../../../../.agents/skills/react-feature-engineering/references/vercel/PROVENANCE.md).
Aucun téléchargement de `main` ni changement des règles n’a été effectué.

## Défaut reproduit puis corrigé

**P2 — accord historique affiché comme suffisant après reprise de la validation visuelle.**
Dans `DesignJourney.tsx:99` et `model/journey.ts:120`, un master approuvé par l’agent, puis une
politique passée à `visual:user`, restait présenté « retenu par délégation » sans action de reprise.
Le backend refusait déjà le code : le défaut concernait l’explication et le prochain geste.

La projection typée expose maintenant cet accord comme insuffisant. Une action prépare une
demande de nouveau master seulement si le callback d’hôte existe réellement ; sinon, une
indication non interactive explique la capacité absente. L’ancien accord n’est pas réécrit,
et aucun accord humain ni appel agent ne résulte du bouton de préparation. Le test monté React
a échoué avant correction, puis vérifié affichage, action connectée, repli sans callback et
conservation de la provenance historique. Le verrou serveur reste l’autorité.

## Règles React et composition applicables

| Règles / famille | Lecture du code et limite de la conclusion |
|---|---|
| `async-cheap-condition-before-await`, `async-defer-await`, `js-early-exit` | Les hooks refusent une seconde action tant que leur ref `inFlight` est active ; une capacité absente est vérifiée avant l’appel. Pas de requêtes indépendantes sérialisées à paralléliser dans ces widgets. |
| `bundle-conditional`, `bundle-analyzable-paths`, `bundle-barrel-imports` | Entrées locales explicites ; widget décision chargé à la première proposition, Parcours à son ouverture. Imports locaux directs, pas de nouvel ensemble d’icônes ni service tiers. Aucun gain de chargement mesuré. |
| `rerender-derived-state-no-effect`, `rerender-move-effect-to-event` | Résumés, master courant, dérivés et libellés sont des projections de props. Sélection/validation/préparation restent dans les handlers ; aucun effet ne copie ces données ou déclenche une mutation. |
| `rerender-use-ref-transient-values`, `rerender-lazy-state-init` | Refs pour les verrous d’action ; états React pour progression/erreur visibles. Le formulaire d’inscription lit le deep-link dans l’initialiseur paresseux. Il ne déplace pas le focus au montage. |
| `rerender-no-inline-components`, `rerender-simple-expression-in-memo` | Composants nommés au niveau module, aucune mémorisation artificielle de transformations courtes. Pas de profil de rendu justifiant `memo`, transition ou valeur différée. |
| `rendering-usetransition-loading` | Adaptation explicite : `pending`/`saving` et la ref représentent un verrou d’écriture, pas seulement du travail de rendu non urgent. Une transition seule ne remplace pas l’exclusion des doubles validations. |
| `rendering-conditional-render`, `js-tosorted-immutable` | Ternaires pour les alternatives ; les `&&` restants portent sur booléens ou texte, sans fuite d’un compte `0`. Les projections filtrent et recherchent sans trier/muter les tableaux du serveur. |
| `architecture-avoid-boolean-props`, `patterns-explicit-variants` | `stage` et les previews sont discriminés par type ; les booléens des cartes décrivent sélection, disponibilité et progression, pas une matrice de variantes métier. `MasterRecovery` porte une action distincte de validation. |
| `state-decouple-implementation`, `state-context-interface`, `state-lift-state` | Vue → hooks d’interaction → callbacks typés de l’hôte. Aucune URL API ni politique d’autorisation imposée par le composant. État du projet fourni par le serveur ; raison facultative persistée localement par le hook, sans valeur d’approbation. Pas de provider ajouté sans consommateurs qui le nécessitent. |
| `client-localstorage-schema` | Règle locale lue lors du complément. Préfixe de clé v1 et payload minimal `{format:1,text}` ; identité workspace/proposition/base, longueur bornée, parse/lecture/écriture/suppression protégés. Aucune sauvegarde du projet complet, token ou accord. L’indisponibilité est visible, sans arrêt de saisie ni clé de repli commune. Détails et limites ci-dessous. |
| `patterns-children-over-render-props`, `react19-no-forwardref` | Composition JSX directe ; pas de `renderX`, `forwardRef` ni ancien contexte à convertir. Les composants partagent des props typées sans abstraction de composition supplémentaire. |
| `client-event-listeners` | Les nouveaux widgets ne souscrivent pas à un événement global. Les contrôleurs détruisent les racines React ; la synchronisation existante du filtre nettoie `popstate`. |
| `rendering-content-visibility`, optimisations `js-*` de collections | Écart restant : les listes du Parcours sont rendues entièrement. Des historiques de plus de 50 directions/écrans sont possibles ; ni virtualisation ni `content-visibility` n’est présent. Images lazy et listes courtes ne prouvent pas une bonne tenue des longues sessions. Aucun chiffre de latence ou de capacité annoncé. |

Hors contexte : Next.js/RSC, Server Actions, SSR, hydratation, streaming, cache serveur, Native
et déploiement. Leur absence ne compte pas comme une conformité. Aucun fetch React,
animation SVG ou calcul lourd n’est introduit par ces widgets ; les recettes
SWR, cache, listeners passifs, preload tiers et idle work ne justifient pas de nouvelle dépendance.

## Web Interface Guidelines : constats et écarts

- **Sémantique et clavier** : radios natifs dans un `fieldset` nommé, labels englobants,
  boutons pour les actions, ancres pour la navigation et références. SVG décoratif masqué,
  titres hiérarchiques et lien d’évitement existant du shell. Pas de handler clavier redondant
  sur un bouton natif. La fluidité réelle des flèches radio pendant la réponse réseau reste à
  vérifier dans le navigateur ; JSDOM ne certifie pas ce comportement.
- **Focus et retours** : règles `:focus-visible` du shell, focus composé via `:focus-within`,
  ancres avec `scroll-margin-top`. Les erreurs sont rendues près de l’action avec `role=alert`.
  Les labels « Enregistrement… » et « Validation en cours… » nomment l’attente. Ni lecteur
  d’écran ni absence de recouvrement du focus par le pied de carte n’ont été essayés ici.
- **Formulaires** : raison avec label, name, autocomplete off, longueur bornée, `value/onChange` ;
  aucun blocage du collage. La limite initiale « raison en mémoire seulement » est corrigée par
  le complément ci-dessous : reprise depuis localStorage, conservation après conflit. Si ce
  stockage échoue, la raison reste seulement en mémoire et l’avertissement demande de la copier
  avant de quitter ; aucune garantie de reprise dans ce cas, ni garde `beforeunload`.
  Les contrôles sans choix ou pendant requête sont désactivés explicitement.
- **Contenu et images** : états vides/capacités absentes explicites ; images locales avec alt,
  dimensions et lazy loading, liens de référence avec `noopener`. Les légendes longues ont
  une rupture CSS, mais aucune batterie navigateur de textes extrêmes n’a été exécutée. Une
  image reste une simulation et ne reçoit aucun contrôle d’une version différente.
- **Navigation** : `?workshop=<id>&form=join#workshop-<id>` ouvre au montage le formulaire ciblé,
  conserve les autres brouillons et n’inscrit personne. Les IDs absents/modes inconnus n’ouvrent
  rien. Limite explicite : ouvrir/fermer localement ce formulaire ne synchronise pas réciproquement
  `form` dans l’URL. Ce n’est pas un routage bidirectionnel de l’état du formulaire. Le filtre
  existant conserve sa synchronisation et son historique, testés séparément.
- **Animation, thème et disposition** : pas de nouvelle animation ; reduced-motion, thème sombre,
  toucher et focus viennent du shell. Pas de geste exclusif dans ces composants. Dimensions
  tactiles, safe areas, contraste après les derniers ajustements CSS/polices et responsive N
  restent des preuves navigateur à fournir par l’intégration.
- **Typographie et locale** : interface française et points de suspension typographiques ; la casse
  française remplace volontairement le Title Case anglais. Les faibles comptes entiers du Parcours
  utilisent une interpolation simple, sans promesse de grands nombres localisés. Aucun horodatage
  nouveau affiché ; les dates d’atelier conservent le formateur `Intl` existant.

## Contrôles réellement exécutés

`node --test` sur `studio-journey-ui`, `studio-decision-widget`, `studio-react-ui` et
`studio-workshop-filter` : **19 tests passent**. Ils montent React dans JSDOM ou vérifient les
transformations, avec réponses retardées et erreurs contrôlées. Ils couvrent choix distinct de
l’accord, raison conservée après conflit, source exacte des contrôles, master périmé/non validé,
reprise d’autorité, sélection de direction, deep-link sans mutation ni vol de focus, saisie
pendant enregistrement, confirmation d’annulation et historique du filtre.

TypeScript `tsc -p studio-ui/tsconfig.json --noEmit`, lint ciblé et format des fichiers corrigés
passent. Aucun nouveau modèle, navigateur, profilage, lecteur d’écran ou test utilisateur n’a
été lancé dans cette passe. Les preuves desktop/mobile de l’intégrateur restent distinctes.
Cette revue ne conclut pas « conforme Vercel » pour l’ensemble de Studio.

Empreintes SHA-256 des sources principales inspectées (les retouches ultérieures demandent une
relecture des points concernés) :

```text
44b7d34322928482be9bc63441643bf6510cce8f2691489c0826b79ed53e7228  decisions/components/DecisionCard.tsx
61a543e96cdaf9e834e1e7fba9ccbcaec2054b589fa96274a0258d2852e195c6  decisions/hooks/useDecisionAction.ts
2dc1e064b0cbb3710d44e844c24d71dce68727184426d174892e36bb0d752a30  journey/components/DesignJourney.tsx
e22f1b9580442435218025284c8fd38b2d2c006aed4317a7207f88876223ccaf  journey/model/journey.ts
d6a9da7da3feaa6384ab68c68cd71e0a8d4cf9602a1e50c6d504597663c42fba  journey/hooks/useJourneyActions.ts
ecdb99dce9abe8c4b19c97be79bd2065dc024d3afc4e478d0ef80cc0f41fcba1  examples/studio-ateliers-react/src/features/workshops/model/navigation.ts
ff80b17f5858cca6067f16260b7760c8cf97610a3b8bd4900a79162bad0027b3  examples/studio-ateliers-react/src/features/workshops/components/WorkshopCard.tsx
```

Les cinq premiers chemins sont relatifs à `studio-ui/src/features/`.

## Complément — raison de décision persistée

Le hook `useDecisionAction` possède maintenant la persistance ; la vue reste sans réseau.
Le contrôleur transmet `runtime.workspace` comme scope interne non affiché. La clé combine ce
scope, l’identifiant de proposition et sa `baseRevision`, sous `devmethod:decision-reason:v1:`.
Le changement de cette identité remonte un état privé distinct. Sans scope, aucune clé globale
n’est utilisée. La raison est limitée à 4 000 caractères ; une valeur stockée de plus de
32 768 caractères ou d’un autre schéma est refusée à la lecture. Ces bornes portent sur un
enregistrement, pas sur un budget global de stockage ou une purge automatique des brouillons.

La sélection ne supprime rien. Un accord refusé conserve la raison. Seul l’accord confirmé
efface la raison soumise, si aucune nouvelle frappe n’a eu lieu depuis l’envoi. Une autre valeur
présente dans le stockage n’est pas supprimée aveuglément. La lecture, l’écriture et la
suppression tolèrent les exceptions et exposent le repli en mémoire. Le stockage reste propre
à l’origine du navigateur : changer de port/origine ne transporte pas le brouillon ; aucune
synchronisation inter-onglets ou cloud n’est fournie. La raison stockée n’accorde aucune autorité.

La régression de persistance a été observée rouge, puis la suite
`tests/studio-decision-widget.test.mjs` a passé **9 tests**. Les nouveaux contrôles montent,
démontent et recréent un contexte JSDOM avec le stockage conservé ; ils vérifient les trois
dimensions d’isolation, la reprise sans sélection/accord, la borne, l’absence de scope, l’échec
de stockage, sélection/refus/succès et la frappe pendant une réponse tardive. Il s’agit d’une
preuve de composant et de stockage simulant le rechargement, pas d’un nouveau rechargement Chrome.
TypeScript strict, lint et format ciblés passent. Les 9 résultats complètent les 19 de la
première passe ; ils ne se cumulent pas en un nombre de tests uniques.

Empreintes qui remplacent les deux entrées `decisions` antérieures et identifient les raccords
du complément :

```text
aafb81d45cbedc12cdf6704f0007df420f3f2b5fa236fcb8289c8d7928130621  studio-ui/src/features/decisions/components/DecisionCard.tsx
fadcb40de7b8d8d0052e11a2f2a04fa5ade850a59fc88c07cbfb14c25d42547e  studio-ui/src/features/decisions/hooks/useDecisionAction.ts
4a433ee81b7bf5323f94fd489606a5387cfce8f1dbcf3922a494d2573ed5f873  studio-ui/src/features/decisions/model/contracts.ts
45d769e19193279e54d651666ce803d2583eede73fbd0eb64fd808b4a8e2a95d  scripts/studio/public/proposal-controller.js
f1290913698742f44b7308ff8959b3c9cc6931435df30c60b1dccdb269219d6a  tests/studio-decision-widget.test.mjs
```

## Preuves navigateur et redémarrage jointes par l’intégrateur

La [trace Chrome](browser.json), enregistrée à 20:20:51 UTC par l’agent intégrateur, rapporte
un desktop 1536 × 1024 et un mobile 390 × 843 sans largeur documentaire supérieure à 390.
Elle relève déplacement du séparateur de 444 à 460, défilement de l’activité sans déplacement
du haut de la décision, sélection d’une version comparée, sortie de comparaison sans résoudre
la proposition et mode Code agrandi. L’essai d’écriture dans l’aperçu de comparaison renvoie
405 visible, conserve la saisie et préserve les données. Les captures associées sont
[décision desktop](decision-desktop.png), [décision mobile](decision-mobile.png),
[Parcours Design](journey-design.png) et [Code backend](backend-code.png).

La [trace de redémarrage](restart.json) compare les états de deux workspaces entre 20:15:44 et
20:18:35 : révision active, empreintes des données et du brouillon serveur, mode/délégation,
parcours design et propositions en attente sont conservés. Ce brouillon serveur est distinct
de la raison locale ajoutée ensuite ; cette trace ne prouve donc pas sa reprise navigateur.

Les traces JSON ont été relues pour cette annexe, sans rejouer leurs actions ni effectuer une
nouvelle inspection visuelle des captures. Ces preuves portent sur les parcours et dimensions décrits, pas un score de fidélité N,
un audit WCAG global, une session de lecteur d’écran, une étude humaine ou une validation
exhaustive du clavier, des contrastes, du tactile et des longues listes.
