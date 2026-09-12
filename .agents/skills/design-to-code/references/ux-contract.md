# Contrat UX et vérification

## Référence verrouillée
Conserver proportions, densité, ordre, labels, position des actions, iconographie et traitement des données. Une image générique de design system n'autorise pas à inventer tous les écrans métier. Si une référence desktop ne décrit pas le mobile, adapter la composition avec les mêmes priorités et noter les choix déduits.

Matrice minimale : route/parcours, statut public/privé, action, données, référence approuvée, breakpoint, chargement, vide, erreur et recovery. Ajouter succès, données obsolètes, droits insuffisants ou incertitude seulement s'ils ont un sens.

## Rendu hybride quand le produit le demande
Choisir par surface : HTML public utile et indexable; îlots interactifs pour scénarios/personnalisation; workspace privé dynamique. Prévoir cache et invalidation selon visibilité et fraîcheur. Une page publique ne doit pas embarquer de données privées; noindex ne constitue pas un contrôle d'accès. Un prototype peut être noindex sans devenir un modèle de rendu production.

## Confiance et médias
Montrer valeur et prochaine action compréhensible avant la pression commerciale. Ne pas inventer témoignages, urgences, compteurs, précision scientifique ou résultats.

Pour une donnée visuelle factuelle, préserver l'identité de l'objet/personne, la provenance et les droits de réutilisation. Une image générée n'est pas une preuve de l'apparence exacte d'un produit. Pour des transformations personnelles, distinguer original, comparaison déterministe et simulation générative; appliquer le contrat spécifique du projet.

Pour un produit piloté par IA, composer via un registre de composants et des schémas validés quand cette architecture est retenue. Ne pas exécuter du JSX/HTML arbitraire provenant d'un modèle.

## QA proportionnée
Comparer même viewport, état et contenu; les données dynamiques doivent être stabilisées pour une comparaison utile. Examiner les écarts de structure avant les détails décoratifs. Tester débordements, zoom, texte long, focus visible, clavier, labels et information qui ne dépend pas uniquement de la couleur. Préférer les primitives accessibles existantes.

Classer les constats : défaut reproductible, conflit de décision ou préférence esthétique. Donner preuve, conséquence et correction. Conserver les captures dans la documentation du scope si utile; ne pas multiplier les screenbooks parallèles.

## Copie produit et accessibilité
Utiliser le catalogue de traduction du projet. Préserver annonces de statut/erreur, reduced motion, focus, clavier et mise en page étroite. Ne pas inventer un pourcentage de progression en l'absence d'événements mesurables. Préserver saisies et sélection en cas d'échec. Les constantes de géométrie et les tokens sémantiques ont un propriétaire explicite.
