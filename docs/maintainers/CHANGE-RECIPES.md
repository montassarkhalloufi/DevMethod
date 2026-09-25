# Recettes de changement vertical

Ces recettes ne remplacent pas une mission. Elles montrent l'ordre de modification qui limite les
duplications et rend la vérification interprétable.

## Ajouter un signal de risque

Exemple pédagogique : détecter une nouvelle zone critique déjà observable.

1. vérifier que l'information existe réellement dans une source Studio ;
2. ajouter ou réutiliser une catégorie dans `RiskSignal` ;
3. produire le signal dans l'adaptateur approprié (`control-sources` ou
   `control-observations`) ;
4. garder `assessRisk` générique si la règle est déjà « maximum des signaux » ;
5. relier `evidenceIds` aux nœuds qui justifient le signal ;
6. tester le cas positif, l'absence du signal et son invalidation ;
7. vérifier la vue Risques et l'attention si le signal est humainement résolvable ;
8. mettre à jour politique/ADR seulement si la sémantique change.

Erreur classique : calculer le signal une seconde fois dans React pour afficher une couleur.

## Ajouter un contrôle qualité

1. définir le contrôle dans le catalogue et sa capacité requise ;
2. implémenter l'adaptateur avec timeout, sortie bornée et statut explicite ;
3. attacher le résultat à la révision et aux dépendances pertinentes ;
4. exposer `canRun` uniquement lorsque l'environnement sait réellement l'exécuter ;
5. afficher `not-run`, `blocked`, `failed` et `passed` distinctement ;
6. tester absence de dépendance, échec outil, échec métier, succès et obsolescence ;
7. vérifier qu'un résultat externe ne devient pas un succès local sans import validé.

## Ajouter une action MCP

1. choisir une connexion et un outil déjà découverts ;
2. valider la permission capturée et la permission actuelle — la plus stricte gagne ;
3. créer un ticket/action idempotent ;
4. demander une décision humaine si la politique vaut `ask` ;
5. faire admettre l'effet externe par le Control Plane ;
6. valider le schéma des arguments ;
7. exécuter via le transport borné ;
8. journaliser statut et résultat public ;
9. réinjecter l'observation dans le graphe ;
10. tester les doubles appels et le changement de permission.

## Ajouter une vue Studio

1. écrire le parcours et l'action primaire ;
2. identifier le propriétaire serveur des données ;
3. définir un contrat de réponse versionné si nécessaire ;
4. ajouter la route et ses erreurs ;
5. écrire un hook qui annule les réponses périmées ;
6. garder navigation/sélection dans la vue, métier sur le serveur ;
7. traiter loading, empty, error et stale ;
8. vérifier clavier, focus, petit écran et lien profond ;
9. ajouter une capture réelle seulement après validation.

## Modifier le format de l'état Studio

C'est une modification à haut risque : `format: 1` est validé à la lecture et aucune migration
générique n'est implicitement fournie.

Avant d'agir :

- décider compatibilité ascendante, migration ou refus explicite ;
- conserver une fixture de l'ancien format ;
- tester ouverture, migration/erreur, interruption et non-destruction ;
- préserver écriture atomique et taille maximale ;
- mettre à jour export, archive, import et documentation ;
- enregistrer la décision architecturale.

## Modifier une règle de mission

Commencez par `Mission` et ses validations, puis suivez les consommateurs : capture de contexte,
planner, checkpoint, closure, CLI et tests. Une nouvelle propriété obligatoire peut casser les
missions existantes même si TypeScript compile.

Testez au minimum : forme valide, chaque forme invalide pertinente, statut dérivé, source changée,
source indisponible et message CLI.

## Définition de fini commune

- le comportement observable répond au critère autorisé ;
- chaque invariant touché possède un contrôle capable d'échouer ;
- les erreurs importantes sont testées, pas seulement le succès ;
- source et artefacts générés correspondent ;
- l'interface a été observée si elle change ;
- les documents publics et l'ADR propriétaire sont cohérents ;
- le diff ne contient ni secret, ni fichier personnel, ni reformatage étranger ;
- le rapport distingue local, commité, poussé, intégré, publié et vérifié en production.
