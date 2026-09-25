# Revue des surfaces React selon les guides Vercel

Date : 2026-09-16. Périmètre : `studio-ui/src/features/code/**` et
`examples/studio-ateliers-react/src/**`, React 19.3.0 et TypeScript strict.
Revue du code effectivement présent, suivie de corrections et de tests ; ce
document ne certifie ni toute l’interface Studio ni une conformité totale.
L’auteur de cette revue avait participé à l’implémentation : elle ne constitue
pas une évaluation indépendante ou une étude avec des utilisateurs.

Références lues : les trois `SKILL.md`, les guides compilés et les règles
pertinentes sur les effets, callbacks, stockage et composition, au commit
[agent-skills 063bee94](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills).
La [commande Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
a été récupérée pendant la revue ; le contenu retenu est le snapshot
[e3d624ba](https://github.com/vercel-labs/web-interface-guidelines/blob/e3d624baaf29dc1fc645aff3e38f03e564d2d6b1/command.md),
également livré dans les références locales. Leur `PROVENANCE.md` et
`MANIFEST.json` conservent les sources, licences et empreintes.

## Défauts et corrections

| Priorité | Emplacement | Déclencheur et résultat |
| --- | --- | --- |
| P1 corrigé | `useBookingDrafts.ts:35`, `WorkshopPage.tsx`, `WorkshopCard.tsx` | Une inscription reste en cours pendant que la personne saisit le nom suivant. L’ancien code effaçait cette nouvelle saisie et fermait le formulaire après succès. La suppression compare maintenant le texte soumis au texte courant ; un compteur d’éditions empêche la fermeture si la saisie a changé. Même protection lors d’un nouvel essai. Test monté avec React rouge avant correction, vert après. |
| P2 corrigé | `WorkshopCard.tsx` | Plusieurs brouillons restaurés déclenchaient `autoFocus`. Le focus ne se déplace plus au montage ; il suit une ouverture volontaire au clavier ou avec pointeur fin. Le test vérifie le focus initial et l’ouverture volontaire. |
| P2 corrigé | `Registrations.tsx:31` | Annuler supprimait immédiatement une inscription et pouvait attribuer sa place à une autre personne. Une confirmation locale explicite indique cette conséquence ; « Garder mon inscription » ne provoque aucune écriture. |
| P2 corrigé | `WorkshopCard.tsx` | Un nom composé seulement d’espaces passait `required` puis échouait loin du champ. L’erreur est maintenant adjacente, reliée par `aria-describedby`, annoncée et focalisée, sans requête. |
| P3 corrigé | `button.tsx:9`, `styles.css`, `WorkshopPage.tsx` | `transition-all` remplacé par `transition-colors` avec variante reduced-motion ; lien d’évitement ajouté avec cible focalisable. |
| Prévention, pas de bug reproduit | `useMonacoEditor.ts:38` | La ref des callbacks était écrite pendant le rendu. Elle est mise à jour après commit dans un layout effect, avant l’initialisation de l’éditeur ; pas de nouvelle souscription à chaque frappe. |
| P3 corrigé | `CodeEditor.tsx`, `WorkshopPage.tsx` | La surface de code et la marque sont explicitement exclues de la traduction automatique. |

## React Best Practices — registre d’applicabilité

« Inspecté » signifie examen du code et des preuves citées, pas mesure de
performance. Les recommandations dépendant d’un problème absent ne donnent pas
lieu à une nouvelle dépendance ou à une abstraction préventive.

| Règles | Applicabilité et constat |
| --- | --- |
| `async-cheap-condition-before-await`, `async-defer-await` | Inspecté : `perform` refuse absence de données, requête en cours et cycle interrompu avant toute écriture ; validation métier synchrone avant le transport. |
| `async-parallel`, `async-dependencies` | Pas de requêtes indépendantes actuellement sérialisées. Charger la version avant d’écrire et relire après conflit sont des dépendances réelles ; pas de `Promise.all` artificiel. |
| `async-api-routes`, `async-suspense-boundaries` | Non applicables : ces surfaces sont clientes, sans route Next.js ni streaming serveur. |
| `bundle-analyzable-paths`, `bundle-conditional` | Inspecté : modules et workers ont des chemins statiques ; le pont charge le widget Monaco lors de l’activation du code, les ouvriers sont locaux. |
| `bundle-dynamic-imports` | Intention applicable, adaptation au runtime : import dynamique local/Vite, pas `next/dynamic` dans une application qui n’utilise pas Next.js. |
| `bundle-barrel-imports` | Imports locaux directs, pas de bibliothèque d’icônes importée entièrement. Dérogation conservée : entrée publique `monaco-editor`, nécessaire à la configuration actuelle de ses contributions. Le bundle reste volumineux ; réduire les langages exige une mesure et une vérification dédiées, pas une conformité déclarée. |
| `bundle-defer-third-party`, `bundle-preload` | Pas d’analytics ou de tiers distant. Préchargement Monaco sur intention possible mais non ajouté : gain et transfert inutile non mesurés. |
| `server-auth-actions`, `server-cache-react`, `server-cache-lru`, `server-dedup-props`, `server-hoist-static-io`, `server-no-shared-module-state`, `server-serialization`, `server-parallel-fetching`, `server-parallel-nested-fetching`, `server-after-nonblocking` | Non applicables à ces surfaces CSR. Aucun RSC, Server Action, SSR ou service déployé. Le transport local reste soumis aux contrôles du serveur Studio, hors de cette revue. |
| `client-swr-dedup` | Intention examinée, SWR non ajouté. Un hook propriétaire charge un snapshot versionné ; il annule les lectures obsolètes et sérialise les mutations. L’instance de store au niveau module est un transport sans état utilisateur. StrictMode peut répéter une lecture de développement annulée ; aucune promesse de cache global. |
| `client-event-listeners`, `client-passive-event-listeners` | Souscriptions Monaco détruites au remplacement/disposal, écouteurs de marqueurs détruits au démontage. Aucun écouteur de défilement ajouté dans React. |
| `client-localstorage-schema` | Inspecté : clé `les-ateliers:drafts:v1`, valeurs texte filtrées, lecture/écriture protégées, avertissement d’indisponibilité. Les données métier autoritaires viennent du serveur. Les noms de brouillons restent locaux : pas d’authentification ni de gestion de données personnelles de production revendiquée. |
| `rerender-defer-reads`, `rerender-derived-state`, `rerender-derived-state-no-effect` | Filtres, places et file dérivés pendant le rendu ; pas d’effet recopiant ces valeurs. Le contenu du formulaire est nécessaire au rendu. |
| `rerender-functional-setstate`, `rerender-lazy-state-init` | Mises à jour des brouillons fonctionnelles ; restauration paresseuse. Le défaut de fermeture asynchrone est corrigé et reproduit par test. |
| `rerender-dependencies`, `rerender-memo-with-default-value` | Dépendances de chargement `store` et compteur de reprise stables. Aucun objet de configuration par défaut recréé dans la signature du hook. La ref des callbacks se synchronise après commit sans remonter Monaco. |
| `rerender-split-combined-hooks`, `rerender-move-effect-to-event` | Données asynchrones, brouillons persistants et intégration Monaco ont des hooks séparés. Inscrire, annuler et confirmer restent dans les handlers ; les effets gèrent le transport au montage, le stockage et les ressources DOM. |
| `rerender-use-ref-transient-values`, `rerender-no-inline-components` | Refs pour cycle de requête, verrou, version de saisie et ressources Monaco. `DateBlock` et `WaitingNote` sont définis au niveau module. `row` construit du JSX ; ce n’est pas un composant remonté via un type créé dans le rendu. |
| `rerender-memo`, `rerender-simple-expression-in-memo`, `rerender-transitions`, `rerender-use-deferred-value` | Aucun calcul coûteux démontré dans le programme de trois ateliers. Pas de `memo`, `useMemo` ou de transition ajouté aux frappes contrôlées. Latence sur gros jeu de données non mesurée. |
| `rendering-conditional-render` | Conditions numériques converties en booléens ou comparées à zéro ; absence de rendu accidentel du nombre `0`. Les ternaires servent aux états exclusifs. |
| `rendering-svg-precision`, `rendering-animate-svg-wrapper` | Petit logo SVG statique à coordonnées entières ; aucune animation SVG. |
| `rendering-hoist-jsx` | Logo statique petit et isolé ; pas de coût justifiant son extraction supplémentaire démontré. |
| `rendering-content-visibility`, `rendering-activity` | Pas de longues listes dans le cas livré. Les saisies sont possédées par le hook parent et conservées même si un formulaire est masqué ; pas de besoin démontré d’un `Activity`. La montée en charge reste non éprouvée. |
| `rendering-hydration-no-flicker`, `rendering-hydration-suppress-warning` | Non applicables : montage client, aucune hydratation. |
| `rendering-usetransition-loading` | Dérogation explicite : `busy` représente un verrou d’écriture versionnée, pas seulement un rendu non urgent. Le remplacer par une transition seule affaiblirait ce contrat. |
| `rendering-resource-hints`, `rendering-script-defer-async` | Pas de police/CDN externe à préconnecter. Les entrées sont des scripts modules ; import dynamique pour l’éditeur. |
| `js-batch-dom-css` | React et classes pour les vues ; les mises à jour impératives de l’éditeur passent par son API. Aucun enchaînement manuel lecture/écriture de layout dans le rendu. |
| `js-index-maps`, `js-set-map-lookups` | Maps pour modèles Monaco ; Sets pour unicité et références métier. Les recherches linéaires dans les inscriptions restent : coût sur de grandes listes non mesuré. |
| `js-cache-storage`, `js-cache-function-results` | Lecture du stockage à l’initialisation ; formateurs `Intl` au niveau module. Pas de cache général ajouté pour des résultats triviaux. |
| `js-cache-property-access`, `js-combine-iterations`, `js-flatmap-filter` | Boucles courtes et filtres lisibles conservés ; aucun profil ne désigne ces opérations comme goulot. |
| `js-early-exit`, `js-length-check-first` | Gardes précoces sur données invalides, requête concurrente et état absent. Pas de comparaison coûteuse d’ensembles nécessitant une nouvelle garde de longueur. |
| `js-hoist-regexp`, `js-min-max-loop`, `js-tosorted-immutable` | Pas de regexp créée dans une boucle, tri pour min/max ou tri mutable. Les transformations métier renvoient de nouveaux tableaux. |
| `js-request-idle-callback` | Pas de traitement non critique lourd observé. Persister une saisie et publier un résultat ne sont pas différés à un créneau idle sans garantie. |
| `advanced-event-handler-refs`, `advanced-use-latest` | Callbacks Monaco stockés dans une ref mise à jour après commit ; les abonnements gardent une identité stable. |
| `advanced-init-once` | Configuration de langage/thème au niveau module ; ressources d’éditeur par montage, avec destruction. Un éditeur par surface n’est pas une initialisation globale à dédupliquer. |
| `advanced-effect-event-deps` | Aucun `useEffectEvent` utilisé. |

## Composition Patterns

| Règle | Constat |
| --- | --- |
| `architecture-avoid-boolean-props` | Pas de matrice de modes booléens dans les composants métier. `busy` décrit un état et `waiting` distingue une opération métier. `asChild` est conservé dans le primitive adapté de shadcn, avec sa licence. |
| `architecture-compound-components` | Non nécessaire à cette échelle : composer un formulaire et une carte n’exige pas de contexte partagé implicite. |
| `state-decouple-implementation` | Vue, hooks, règles pures et transport séparés. Le composant ne connaît ni URL API ni validation du snapshot. |
| `state-context-interface` | Intention satisfaite par `WorkshopStore` injectable et `CodeWidgetHandle` typé ; pas de provider ajouté sans consommateurs distants. |
| `state-lift-state` | Les brouillons et données vivent au-dessus des cartes ; leur fermeture ne détruit pas la saisie. Ouverture et confirmation restent locales. |
| `patterns-explicit-variants` | Variantes nommées du bouton ; types discriminés pour les intentions métier. Pas de nouvelles combinaisons de drapeaux pour ajouter la confirmation. |
| `patterns-children-over-render-props` | Contenu des boutons via `children` ; pas de `renderX` artificiel. |
| `react19-no-forwardref` | React 19, aucune enveloppe `forwardRef`, pas de contexte ancien à convertir en `use()`. |

## Web Interface Guidelines : constats et limites

- Sémantique inspectée : vrais boutons et liens, labels associés, icônes décoratives cachées, titres, états vides, statut asynchrone annoncé. Les boutons natifs portent déjà le clavier ; aucun handler clavier redondant ajouté.
- Focus : lien d’évitement et focus visible ; restauration passive, ouverture volontaire et premier champ invalide vérifiés en DOM. Pas de lecteur d’écran, Safari mobile, clavier logiciel ou navigation complète au clavier testés dans cette passe.
- Formulaires : nom/autocomplete appropriés au nom d’une personne, collage permis, longueur bornée, enregistrement désactivé pendant la requête. Indication textuelle « Enregistrement… » conservée plutôt qu’un spinner seul. Les erreurs de transport restent globales, avec reprise ; une erreur du nom est locale.
- Navigation non sauvegardée : les brouillons sont persistés au fil de la saisie. Si localStorage échoue, un avertissement indique seulement une conservation en mémoire ; une protection `beforeunload` dans ce cas reste une amélioration possible, pas une garantie existante.
- Animation : suppression de `transition-all`, reduced-motion conservé, aucune vidéo, GIF, boucle ou geste exclusif. La palette et la composition approuvées ne sont pas changées par cette revue.
- Contenu : flex/grid et `min-width: 0`, rupture des longs titres/noms, contrôles de confirmation repliables sur petite largeur. Les nouvelles règles CSS de confirmation n’ont pas encore une preuve navigateur dédiée ; la revue de rendu finale doit les couvrir.
- Images : aucun `<img>` ni média significatif dans ces deux surfaces React ; les règles de dimensions/priorité/légendes ne s’appliquent donc pas ici.
- Performance : aucun accès de layout dans le rendu React. Les champs restent contrôlés pour la persistance et le conflit ; leur latence n’est pas mesurée. Monaco reste une charge lourde, même différée. Aucune affirmation de score Core Web Vitals.
- Navigation : ancres sémantiques disponibles. **P3 corrigé** — `useWorkshopFilter.ts` possède la synchronisation du filtre avec `?category=` via `useSyncExternalStore` ; `WorkshopPage` consomme cette source sans état miroir. Un choix ajoute une entrée d’historique, le choix courant n’en ajoute pas, « Tous » retire seulement `category` et une valeur inconnue affiche tous les ateliers. Les autres paramètres, leurs valeurs multiples, l’ancre et `history.state` sont conservés. Trois tests de `tests/studio-workshop-filter.test.mjs` passent : lien direct et vrais appels `history.back/forward` dans JSDOM, catégorie inconnue, rendu du hook sans objet `window`. Ils vérifient aussi l’absence d’écriture métier et la conservation des brouillons pendant le filtrage. Ce rendu serveur de contrôle n’ajoute pas un runtime SSR ; aucun nouvel essai navigateur réel ou état live n’est revendiqué pour cette correction.
- Touch/layout : aucune action réservée au glisser. Les confirmations utilisent les contrôles existants ; taille tactile, safe areas et débordements après modification à confirmer au navigateur. Pas de nouveau masquage global du débordement.
- Thème : l’application est claire et distincte du shell ; la surface Monaco conserve son thème d’éditeur. Native select, métadonnées de document et thème global ne sont pas dans ce périmètre de composants.
- Locale : interface volontairement française, dates via `Intl` avec fuseau explicite. Les heures éditoriales et le mois du cas de septembre sont des données de démonstration ; le numéro de jour à deux chiffres conserve la direction agenda. Pas de détection multilingue ou de formatage international des grands comptes revendiqués. Code et marque ont `translate="no"`.
- Hydratation : non applicable au montage client ; chaque champ contrôlé a un `onChange`. Pas de `suppressHydrationWarning`.
- Copy : libellés concrets et erreurs avec action suivante. La casse française est conservée au lieu d’appliquer mécaniquement le Title Case anglais ; « Mes inscriptions » est un libellé de destination déjà approuvé.

## Vérification effectuée

Tests : **23 passent**, dont quatre nouveaux tests de rendu React monté dans
JSDOM avec `StrictMode`, transport HTTP contrôlé et réponse retardée. Ils vérifient
la conservation de saisie et de localStorage, le focus, l’erreur inline et l’absence
d’écriture avant confirmation. Ce transport contrôlé n’est pas un faux fournisseur
IA et ne prouve pas un parcours réseau/navigateur complet.

```sh
node --experimental-strip-types --test tests/studio-react-ui.test.mjs \
  tests/studio-code-widget.test.mjs tests/studio-code-diagnostics.test.mjs \
  examples/studio-ateliers-react/tests/*.test.ts
npx tsc -p examples/studio-ateliers-react/tsconfig.json
npx tsc -p studio-ui/tsconfig.json
npx eslint studio-ui/src/features/code examples/studio-ateliers-react/src \
  tests/studio-react-ui.test.mjs --max-warnings 0
```

Les deux compilations strictes passent. La vérification ESLint inclut les règles
des hooks et la limite de complexité. Pas de benchmark A/B, de mesure de mémoire
Monaco, de test de 50+ inscriptions ni de validation humaine ajoutés ici. Le worker
n’a modifié ni les brouillons du Studio ouvert, ni sa base de données, ni ses
métadonnées de révision. À ce stade de la revue, une synchronisation par un vrai job restait nécessaire ;
la section suivante enregistre son exécution ultérieure.

## Suite observée par le parent

Les corrections ont été appliquées par un vrai travail Studio à la révision
`336de365-3d32-476e-9577-5d5798829ed8`, sans modifier la délégation ni les données.
Le filtre URL et la confirmation ont été essayés dans Chrome, dont une largeur
CSS de 354 pixels : voir [revue navigateur](LAYOUT-REVIEW.md). Le filtre manquant
est corrigé avec trois tests additionnels de navigation ; la suite globale finale
passe 532 tests. Les limites non mesurées ci-dessus restent valables.

Le template générique réutilisable reprend également `transition-colors` et
`motion-reduce:transition-none` pour son bouton ; ses compilations TypeScript et Vite passent.
