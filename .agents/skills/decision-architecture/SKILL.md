---
name: decision-architecture
description: Resolve product or engineering trade-offs, record ADRs, and design or review domain, application and infrastructure boundaries. Use for architecture choices, backend slices or changes to accepted contracts; skip cosmetic and routine changes without a decision or boundary impact.
---

# Decision Architecture

Partir des contraintes et des décisions réelles. Préserver les choix acceptés du projet; les recommandations de ce skill sont des défauts adaptables, jamais un motif de migration globale.

Lire CONTRIBUTING.md et les décisions acceptées avant une modification. Pour TypeScript, préserver strict, valider les entrées non fiables, choisir des identifiants explicites et centraliser les constantes métier/configuration significatives. Appliquer SOLID avec des ports petits et définis par leur consommateur, sans factories ou héritage spéculatifs.

## Arbitrage proportionné
- Reformuler la décision concrète, son propriétaire, la contrainte bloquante et la date à laquelle elle doit être prise.
- Distinguer fait vérifié, hypothèse, préférence fondateur, proposition et décision acceptée.
- Vérifier les sources officielles actuelles quand versions, prix, contrats ou règles peuvent changer. Une recommandation réglementée requiert les sources et la compétence appropriées; ce skill ne fournit pas de validation juridique.
- Comparer les options viables sur les critères décisifs : valeur utilisateur, coût total, temps d'implémentation et d'exploitation, réversibilité, intégrité des données, risque de migration. Inclure la conservation de l'existant quand viable.
- Donner une recommandation, ses conditions et le signal qui justifierait de la revoir. Ne pas inventer un score numérique pour donner une précision artificielle.
- Ne créer un ADR que pour un choix structurant ou une exception durable. Utiliser [le modèle](assets/ADR.md). Déduire l'acceptation d'une décision explicite, jamais du fait que l'agent la recommande.
- Si une décision acceptée empêche la demande, expliquer précisément le conflit et proposer son remplacement; bloquer uniquement le travail qui en dépend.

Pour le cadrage produit et l'économie, lire [references/product-decisions.md](references/product-decisions.md). Pour des HTTP APIs, lire [references/api-contracts.md](references/api-contracts.md) avant retries ou async. Pour un backend ou des données, lire [references/backend-boundaries.md](references/backend-boundaries.md).

## Résultat attendu
Une décision/action utilisable, reliée à ses preuves et au scope. Pour une conception : frontières, contrats, invariants, erreurs, migration et vérifications nécessaires. Pour une demande d'implémentation, continuer à implémenter le périmètre autorisé dès qu'il est suffisamment défini; ne pas s'arrêter au diagramme.
