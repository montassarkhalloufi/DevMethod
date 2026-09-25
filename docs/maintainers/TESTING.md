# Stratégie de test

## Choisir le niveau depuis le risque

- **Règle pure** : invariants, bornes et erreurs en test unitaire.
- **Persistance** : contrainte, conflit, reprise et limites en intégration.
- **HTTP** : schéma, origine, acteur, erreur et idempotence.
- **UI** : comportement DOM puis vrai rendu navigateur, clavier et responsive.
- **Package** : archive réelle installée dans un dossier jetable.
- **Compatibilité host** : session native authentifiée séparée des tests d'installation.

## Conventions du dépôt

Les tests Node sont dans `tests/*.test.mjs`. Les tests React TypeScript de l'exemple sont inclus par
`npm test`. Le build strict et les bundles Studio sont exécutés avant la suite complète.

Pour une correction reproductible, obtenir si possible rouge → correction → vert. Un import cassé
n'est pas la preuve rouge d'une règle métier. Une exécution verte antérieure ne couvre pas un commit
modifié.

## UI et documentation

Un test DOM ne certifie pas le layout. Pour une interface, vérifier au minimum le parcours principal,
le focus, le clavier, une largeur étroite, le débordement et les états d'erreur. Pour la documentation,
contrôler exactitude, liens, rendu réel et diff.

## Rapporter honnêtement

Conserver commande, environnement, révision, résultat et limite. Un nombre de tests ne remplace pas
la correspondance entre critères et scénarios. Une fixture explicitement simulée teste un contrat,
pas un fournisseur ou un navigateur réel.
