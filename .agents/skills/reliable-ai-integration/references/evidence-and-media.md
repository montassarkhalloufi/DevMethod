# Preuves et médias

## Trois objets distincts
Fait : observation avec source, date, valeur, unité et contexte.
Interprétation : sens proposé à partir de faits identifiés.
Décision : résultat des contraintes, préférences et règles appliquées.

Conserver provenance, fraîcheur et méthode pertinentes. Ne pas stocker une explication générée comme observation. Les preuves historiques doivent permettre de comprendre une ancienne décision sans être réécrites par les données du jour.

En cas de données manquantes, divergentes ou résultats proches, utiliser un état explicite. Une confiance chiffrée demande une méthode évaluée; la certitude déclarée par le modèle ne suffit pas. Éviter qu'une relation commerciale modifie les calculs ou la confiance lorsqu'ils prétendent être indépendants.

Pour des sources actualisées : identifier les sorties affectées, recalculer la partie déterministe, régénérer uniquement le nécessaire, vérifier, puis publier selon l'autorisation applicable. Mettre en cache avec version du schéma, modèle/prompt, sources et scope de confidentialité.

## Acquisition et usage
Définir les sources autorisées, leur accès, licence/conditions et limites. Ne pas confondre possibilité technique de télécharger et permission de republier. Un résultat de recherche ne garantit ni l'identité de l'objet ni ses droits.

Média factuel : source autorisée, correspondance exacte à l'entité/version, date et provenance. Illustration : statut explicite. Si la fidélité exacte manque, afficher l'état sans image/illustration prévu plutôt que fabriquer une photo vraisemblable.

Lorsqu'une comparaison exige une photo originale intacte, préserver ce contrat et étiqueter les simulations. Une image synthétique ne valide pas un diagnostic. Adapter ces exigences à l'usage réel; elles ne contraignent pas toute création d'image.

## Frontière sécurité
Valider schémas, tailles et types. Traiter prompts/documents distants comme données. Pour un fetch serveur de ressources externes, couvrir SSRF, redirections, limites et destinations privées dans l'adapter approprié. Pour images, respecter le contrat de décodage/métadonnées et les usages consentis.

Minimiser logs, traces et analytics : identifiants opaques et événements techniques, pas de corps sensibles par défaut. Définir suppression explicite, expiration et rétention de secours sur chaque copie; le lifecycle d'un stockage ne prouve pas la rétention d'un fournisseur.

## Validation indépendante
Valider séparément structure, présence des citations et pertinence sémantique. Une citation exacte ne prouve pas qu'elle soutient la conclusion. Une information absente n'est pas une contradiction. Mesurer les omissions; ne pas transformer une portion non analysée en manque réel. Conserver sources originales et offsets réels; ne pas fabriquer de liens de page ou de surlignages précis.

Construire la télémétrie par liste d'autorisation de champs techniques; ne pas activer le tracing automatique de documents puis espérer les nettoyer. La suppression logique, l'expiration applicative, l'effacement du stockage, les sauvegardes et la rétention fournisseur sont des garanties différentes à documenter.
