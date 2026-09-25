# Ajouter une fonctionnalité

## 1. Trouver le propriétaire

Commencez par la [carte du code](../architecture/CODE-MAP.md). Une nouvelle fonctionnalité ne doit
pas dupliquer le registre, les permissions, le journal de jobs ou les types déjà partagés.

## 2. Définir la tranche verticale

Une tranche utile contient le plus petit parcours observable : contrat, règle, adaptation, interface
et contrôle. Évitez de livrer séparément plusieurs couches sans comportement utilisable.

## 3. Respecter les frontières

- les règles déterministes restent dans `src/` ;
- les accès disque, HTTP et services restent dans les adaptateurs ;
- React orchestre l'affichage et appelle les routes, sans réimplémenter la politique ;
- le store existant possède les écritures et les conflits ;
- les données non fiables sont validées aux frontières.

## 4. Exemple : nouveau signal du Control Plane

1. ajouter ou réutiliser la catégorie typée dans `contracts.ts` ;
2. produire le signal depuis la source qui l'observe réellement ;
3. décider explicitement s'il est humainement résolvable ;
4. tester le niveau, la justification et le cas négatif ;
5. vérifier l'attention et la décision effective ;
6. afficher la raison sans réduire l'information à une couleur ;
7. documenter l'heuristique et ses limites.

## 5. Mise à jour coordonnée

Mettez à jour le contrat/ADR si une frontière change, le code, les tests, le guide utilisateur et la
preuve de la révision. Une proposition visuelle ne devient pas une preuve navigateur après coup.
