# Résultats — parcours documentaire du nouvel arrivant au mainteneur expert

Date : 25 septembre 2026
Révision documentée : `ef539e5` (`0.6.0-beta.1`)
Support principal : [`../../handbook/index.html`](../../handbook/index.html)

## Livré

- un manuel HTML hors ligne en quatorze chapitres, avec navigation responsive, recherche locale et
  progression conservée dans le navigateur ;
- un lecteur HTML intégré pour toutes les références Markdown ouvertes depuis le manuel, avec
  décodage UTF-8 explicite, sommaire, typographie, tableaux, listes, code, images et liens internes ;
- trois parcours de lecture : utilisateur, contributeur et mainteneur expert ;
- une description séparée de la promesse, de l'état réel et du vocabulaire ;
- un guide de la méthode, du Studio et du Control Plane illustré par les captures finales déjà
  versionnées ;
- trois cartes complémentaires : système, code et flux de données ;
- des guides de développement, test, extension, diagnostic et release ;
- cinq traces de requêtes complètes, une référence d'invariants, une carte API/frontend, des recettes
  de changement, un playbook d'incident et dix laboratoires évaluables ;
- un point d'entrée textuel durable dans [`../../START-HERE.md`](../../START-HERE.md).

## Approfondissement après audit

- [`../../architecture/THEORY-TO-CODE.md`](../../architecture/THEORY-TO-CODE.md) distingue théorie,
  procédure agent, enforcement runtime, état durable et preuve ;
- [`../../architecture/ENGINE-ATLAS.md`](../../architecture/ENGINE-ATLAS.md) documente sept moteurs :
  méthode, exécution, création, intelligence, qualité, MCP et contrôle ;
- [`../../maintainers/CODE-DOSSIERS.md`](../../maintainers/CODE-DOSSIERS.md) fournit huit lectures
  annotées avec symboles, appelants, effets, invariants et tests ;
- le guide Studio contient désormais un tutoriel continu dans un workspace jetable ;
- les dix laboratoires indiquent préparation, commande, observation, réussite et remise à zéro ;
- la recherche indexe les chapitres et 28 références profondes ;
- le lecteur transforme les diagrammes Mermaid pris en charge en vues HTML accessibles et conserve
  leur source dépliable ;
- la progression a été renommée en progression de lecture : elle n'attribue plus un niveau expert ;
- `check:docs` vérifie aussi les ressources HTML et les références de l'index de recherche.

## Choix structurants

- Le HTML est une couche pédagogique, pas une nouvelle application produit : aucun build, CDN ou
  backend n'est nécessaire.
- Le Markdown reste la source canonique ; `read.html` le présente sans créer une seconde copie du
  contenu à maintenir.
- Les diagrammes sont écrits en HTML/CSS pour rester lisibles hors ligne et faciles à maintenir.
- Les captures de Studio sont des observations réelles ; les anciennes planches cibles ne sont pas
  présentées comme le produit livré.
- Le manuel relie chaque explication avancée à un propriétaire de code, un test ou une preuve.
- La progression `localStorage` aide le lecteur mais ne constitue ni une preuve DevMethod ni une
  mesure de compétence.
- Le rendu de diagrammes reste volontairement borné aux flux et séquences utilisés par ce manuel ;
  la source Mermaid reste disponible pour les syntaxes non reconnues.

## Limites explicites

- Le manuel décrit la révision citée ; une évolution des contrats impose de mettre à jour la
  documentation et les captures concernées.
- Il facilite la montée en compétence, mais ne remplace pas l'exécution des tests, la revue des ADR
  ou l'expérience de maintenance réelle.
- Aucun comportement du produit, numéro de version ou artefact de publication n'a été modifié.

Les contrôles exécutés sont consignés dans [`VERIFICATION.md`](VERIFICATION.md).
