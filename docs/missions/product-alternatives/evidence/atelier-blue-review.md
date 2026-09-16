# Revue indépendante — panneaux bleus de l’Atelier

Date : 2026-09-16. Commit inspecté `2b65dab9ad58adc29ae1abdc21e52b55186b1d83`, arbre `02e9e53cd835823a2910737ce8f8f8df11712183`, worktree `/private/tmp/devmethod-atelier-blue-panels`, propre avant/après la revue. Lecture seule des sources ; seul ce rapport est écrit. Aucun fournisseur, push, fichier root ou POST de modification de la session.

## Finding ouvert

**[P2] Le choix de cible referme le formulaire de création vide et perd le focus.** `scripts/atelier/public/app.js:250`, associé au rerender déclenché ligne 157.

Reproduction dans Chrome réel, onglet de revue indépendant, `http://127.0.0.1:4321/?mode=simple` : ouvrir « Ajouter un élément à essayer », laisser le titre vide, choisir « Relecture entre pairs » dans « Dans quel prototype ? ». Le `<details>` passe immédiatement de `open=true` à `open=false`, le formulaire disparaît et `document.activeElement` devient `BODY`. La cible reste correctement mémorisée (`relecture-pairs`), mais il faut retrouver et rouvrir le formulaire pour poursuivre. Ce nouvel emballage introduit la régression : l’ouverture est reconstruite seulement à partir de `draft.title`; la restauration du focus vers le select caché ne peut aboutir.

Correction proposée, sans revoir le design : conserver l’ouverture du disclosure indépendamment du titre (état suivi par `toggle` ou état lu avant le remplacement DOM), et garder le select visible/focalisable pendant son changement. Ajouter une seule régression fonctionnelle : ouvrir sans titre → changer de cible → formulaire toujours ouvert et focus préservé. Une soumission réussie peut fermer explicitement le disclosure si c’est voulu.

## Vérifications effectuées

- Diff complet des cinq fichiers et contexte des handlers/vues/CSS lus. Les fonctions domaine/API ne changent pas. Les 20 tests, lint et format déjà signalés par l’auteur n’ont pas été relancés.
- Les deux références ont été réellement vues : `exec-c9035ed1-6fa2-4721-903a-2cf452f346a0.png` et `exec-6670d707-e3e3-4e27-ad89-a2ed448a76aa.png`, sous `/Users/montassar/.codex/generated_images/01a0a8c0-b100-7fe2-b934-88663f06bd84/`. Leur préférence utilisateur est conservée. Le cadre marine, les panneaux blancs séparés et le panneau d’intentions se retrouvent dans le rendu inspecté. Aucun verdict de fidélité pixel à pixel ou d’utilisabilité humaine.
- Chrome, onglet créé pour cette revue sur le serveur 4321. Deux variantes réelles affichées ; `innerWidth=1562`, largeur de document `1562` : aucun débordement global horizontal à ce viewport. Les deux régions produits mesurent 480px de haut avec contenus de 569/748px, `overflow:auto`; elles sont nommées et focalisables.
- « Ouvrir le contexte » du panneau latéral ouvre le vrai dialogue de contexte. Échap le ferme et rend le focus à `open-intent-context`; observation DOM et capture inspectées. Aucun besoin enregistré pour ce contrôle.
- Viewport demandé 390×844, largeur CSS effectivement mesurée **354px** (scaling existant du navigateur), document **354px**. Les variantes passent en pile (`display:flex`), les produits ont `max-height:none` et une hauteur égale au contenu (863/819px dans la session affichée). Capture mobile inspectée : navigation, panneau projet et commandes sont lisibles et non coupés horizontalement. Ce contrôle n’est pas une preuve à exactement 390 CSS px. Override réinitialisé en fin de parcours.
- Mode simple : pas de commande commune « Essayer dans chaque prototype », cibles et actions locales conservées. Le défaut du formulaire ci-dessus a été observé sans créer d’élément ni modifier l’état serveur.
- Route isolée `?variant=relecture-pairs` : exactement une carte, bon titre, aucun bouton d’action commune, largeur document 354px. Depuis la région de données, Tab atteint le vrai bouton « Soumettre à la relecture — Portrait d’une bénévole de la bibliothèque — Relecture entre pairs », avec contour visible calculé `rgb(22, 141, 189) solid 2.72727px`.
- Console de cet onglet : aucune entrée warning/error retournée pendant le parcours.
- Contrôle DOM nouveau et ciblé, Node24.18/JSDOM, données synthétiques en mémoire issues du catalogue Gazette et validées par `createSession` : **2, 3 et 4 variantes**. L’application complète a rendu toutes les cartes, régions nommées focalisables, options de décision et lettres A–D, plus les intentions. Les trois contrôles passent. Fetch simulé en mémoire ; aucune nouvelle fixture source, installation ou session persistante. Ce contrôle prouve le rendu DOM de 3/4 variantes, pas une inspection visuelle navigateur à ces cardinalités. La grille CSS à deux colonnes laisse les autres variantes se placer sur les lignes suivantes.

## Boutons et limites

Aucun bouton ajouté promettant une opération inexistante trouvé : la navigation comporte quatre ancres vers des sections présentes ; le nouveau bouton d’intentions appelle le vrai éditeur de contexte ; le disclosure contient le formulaire existant. Pas de bibliothèque, faux agent actif ou publication externe inventés. Les libellés de recherche et de données fictives restent explicites.

La sélection d’une variante dans le mode isolé et les actions locales restent les comportements existants. La revue n’a pas répété les mutations/persistance/déchargements déjà contrôlés par l’auteur. Les variantes synthétiques n’établissent aucune qualité métier, et les captures agent ne sont pas une étude utilisateur ni une certification d’accessibilité. L’hypothèse de meilleure clarté visuelle reste distincte de la préférence esthétique explicitement exprimée.

Aucun autre défaut majeur identifié dans ce delta borné. Le finding du disclosure reste ouvert sur ce pin ; aucune correction future n’est présumée.

## SHA-256 du code examiné

- `scripts/atelier/public/app.js` : `a092abb8b3d3114aed8f052674ac921aad5a79f5b22affd43d7050e8f05b1a91`
- `scripts/atelier/public/views.js` : `6144ab55b4c2356176b25a0921f95a9e79efa824af2540b3d8921c37d5d1e30f`
- `scripts/atelier/public/style.css` : `7481d581e34c4f9f895eff07cb7b071840edb17c214f0768a1a7053b7d8202a9`

## Clôture du finding — correctif `23871ab`

Revue de clôture limitée au delta du commit `23871abb5a68af4e5d716329de77f24b8df5deb7`, arbre `75fd3dec7d109c2f6627ef19fea2754b20cfaef8`, au-dessus du pin initial. Worktree propre. **Finding P2 fermé sur ce nouveau pin.** La section précédente reste le constat historique reproductible sur `2b65dab`.

Le rendu capture maintenant l’état réel `open` du disclosure avant de remplacer le DOM, puis le transmet à `commonControls`. L’ouverture ne dépend plus de la présence d’un titre ; le mécanisme existant de retour du focus retrouve donc un select visible. Le correctif préserve aussi la fermeture volontaire d’un formulaire dont le titre est déjà saisi.

Un seul contrôle indépendant ciblé Node24.18/JSDOM a été exécuté, en mémoire depuis les modules du worktree : mode simple, ouvrir le formulaire vide, focaliser le select cible, choisir `relecture-pairs`, déclencher le changement. Résultat : formulaire ouvert, titre toujours vide, cible retenue et `activeElement.id === 'create-variant'`. Puis saisir un titre, fermer volontairement le formulaire et changer l’acteur : formulaire toujours fermé, titre conservé. Processus terminé avec succès :

```text
PASS independent closure: open empty form + focused target preserved; explicit close with title preserved through actor change; Node v24.18.0
```

La régression ajoutée dans `tests/atelier-ui.test.mjs` et le complément de `DESIGN.md` ont été lus. Le rouge→vert et le parcours Chrome du correctif restent attribués à l’auteur ; cette clôture n’a pas répété de parcours navigateur ni les suites inchangées. Aucun autre périmètre de la revue initiale n’est rouvert.

Pins SHA-256 du correctif :

- `scripts/atelier/public/app.js` : `76c774802e6e89680ab56ae7d6b733156dbf6b4e601a30f2b18d2b9baf7dda77`
- `tests/atelier-ui.test.mjs` : `611484bc8405e4f52aea6894bf1b4b4da6f696154a782725b9383cef3ec84460`
