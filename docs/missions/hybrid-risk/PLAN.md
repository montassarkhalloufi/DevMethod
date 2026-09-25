# Analyse de risque hybride

Mission autorisée le 25 septembre 2026 : choisir puis terminer une analyse de risque plus pertinente dans Studio. Le choix technique est délégué, y compris sa correction si les essais contredisent l’intérêt initial. Décision : [ADR 028](../../ADR-028-hybrid-risk-analysis.md).

## Résultat attendu

- Distinguer une modification de présentation, une interaction, des échanges asynchrones, des écritures concurrentes et des autorisations à partir du contenu réellement changé.
- Rendre les limites de couverture et les références inspectables ; les commentaires ne doivent pas créer de faux faits syntaxiques.
- Ajouter une analyse contextuelle IA explicite, bornée, sans outils ni droits d’écriture sur le projet, via le runner déjà configuré.
- Conserver les hypothèses séparées des preuves. Seules les vérifications réellement exécutées peuvent satisfaire les exigences de la politique.
- Dédupliquer les demandes, conserver les résultats historiques et bloquer les résultats périmés, invalides ou de consommation inconnue.
- Préserver les arrêts, permissions, délégations, historiques v1 et les vues existantes.

## Vérification

Tests de règles et contrats, tests d’intégration du runner et des routes, campagne réelle du modèle avec cas sains/défectueux et adverses, inspection navigateur desktop/tablette/mobile, gates complets et CI. Les réponses injectées attestent seulement le câblage ; les essais réels et leurs limites seront enregistrés séparément dans RESULTS.md.

Pas de nouveau fournisseur, dépendance payante, exécution des scripts du projet, publication npm ou déploiement. L’IA ne détermine ni un score de confiance autorisant une action ni la réussite d’un contrôle.

État du périmètre et preuves : [RESULTS.md](RESULTS.md). Implémentation sur `codex/hybrid-risk-engine`, base `ebc6640`. Les états distants de CI et d’intégration sont portés par la PR.
