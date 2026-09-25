# Lisibilité et priorité mobile — 16 septembre 2026

Cette passe traite les écarts UX de DESIGN-REVIEW.md. La palette olive reste provisoire : l’utilisateur l’a rejetée et la proposition L attend son accord. Ces corrections ne constituent donc pas une validation de la direction artistique.

## Changements

- Sur mobile, une application existante passe avant le fil : cap, critères neutres, cinq onglets, puis application réellement exécutée. Un premier projet sans application conserve le formulaire en premier.
- Des liens visibles ouvrent le brouillon de demande et reviennent au produit. La zone de demande précède l’historique sur mobile. Aucun formulaire n’est recréé pour ce réordonnancement.
- Les actions, politiques, critères, preuves et textes principaux passent à 13 px minimum dans les surfaces inspectées. Le code conserve sa typographie propre.
- Les trois demandes récentes montrent des extraits de 150 caractères, distinguant demande et résultat fourni. Chaque texte intégral et les demandes antérieures restent accessibles dans des détails natifs.
- La disponibilité d’un résultat et l’état actif d’une version n’emploient plus un badge de succès. Une version sans contrôle propre affiche « Non vérifié sur cette version » ; des contrôles enregistrés ne valent pas couverture complète.

## Vérifications observées

Chrome, onglet isolé sur le Studio local 4330, sans requête envoyée ni modification des données applicatives.

| Taille CSS | Constat |
| --- | --- |
| 390 × 843 | Cap à y=140, onglets à y=385, application visible à y=528. Avant correction, le cap commençait à y=1031. Aucun débordement horizontal. |
| 1280 × 900 | Aperçu et fil utilisables dans leurs panneaux ; aucun débordement horizontal. Textes des onglets, boutons et preuves mesurés à 13 px. |
| 1536 × 1000 | Aperçu réel visible, fil défilant et compositeur conservés ; aucun débordement horizontal. |

Le lien Discussion donne le focus au champ de demande réel. Le retour au produit et les onglets Code/Application fonctionnent. Le brouillon partagé conserve exactement son contenu. Les contrôles unitaires UI passent : 17/17, dont conservation du focus/draft/iframe après rafraîchissement, conflit 409, politiques et distinction disponibilité/preuves. ESLint ciblé et Prettier passent.

Captures : [mobile](olive-mobile-priority.png), [bureau](olive-desktop-readable.png). Mesures : [JSON](readability-mobile-metrics.json). Les captures natives JPEG du navigateur ont été réencodées en PNG sans redimensionnement ; elles ne sont pas des images générées.

Le navigateur conserve son zoom préexistant de 110 % ; les dimensions CSS sont mesurées, puis l’override de viewport a été réinitialisé. Une vérification indépendante du zoom à 200 % n’a pas été effectuée dans cette passe. Ces observations d’agent ne sont ni une étude humaine ni une preuve de supériorité comparative.
