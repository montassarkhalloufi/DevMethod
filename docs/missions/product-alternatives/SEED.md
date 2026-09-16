# Choix de conception du cas La Gazette

Date : 16 septembre 2026. Entrée : contrat `docs/missions/product-alternatives/CONTRACT.md`, v1, lu dans le dépôt parent. Livrable : `/private/tmp/devmethod-atelier-gazette.json`. Aucun fichier du parent modifié, aucune réserve consultée, aucun appel modèle CLI. Ce journal couvre seulement l’état initial ; il ne propose pas une réponse à une future demande de changement.

## Besoin et identités

La Gazette est un magazine associatif entièrement fictif. L’objectif est de publier avec plusieurs relais tout en conservant une responsabilité lisible. Quatre identités stables permettent de voir qui fait réellement chaque action : Camille, auteur ; Nina, rédactrice ; Sam, relecteur et relais de publication ; Lou, relectrice. Ces titres expliquent leur position dans le scénario ; les permissions restent explicitement définies par identité dans chaque variante. Leurs compétences ne sont pas des faits observés.

Trois articles fictifs ont des propriétaires différents. Un est déjà soumis et deux sont des brouillons. Ces états ne prétendent pas reconstruire une histoire antérieure ; le prototype ne contient ni texte d’article ni faux témoignage de relecture.

## Deux choix plausibles

**Bureau et circuit éditorial.** Sam et Lou peuvent relire un texte d’un autre membre ; Nina et Sam peuvent publier un texte prêt. Le relais ne dépend donc pas d’une seule identité, mais les personnes habilitées concentrent la charge et portent une responsabilité identifiable. Quand Lou est propriétaire d’un texte, Sam reste le seul relecteur habilité pour ce texte dans ce petit effectif : c’est une limite visible, pas une promesse de disponibilité garantie.

**Relecture entre pairs.** Les quatre membres peuvent relire un texte d’un autre membre et publier un texte prêt. La participation est plus distribuée ; la cohérence de jugement exige un accord que le moteur ne peut prouver. L’autorisation technique n’est pas une évaluation de compétence.

Aucune gagnante n’est inscrite dans le fichier : pas de score, recommandation, sélection initiale ou scénario choisi pour conclure à une supériorité. Les quatre mêmes intentions sont disponibles des deux côtés : créer, soumettre, relire, publier. Les différences portent sur qui peut relire et publier, pas sur une action absente ou une panne artificielle.

## Compromis volontaire du scope

Les deux variantes ont les mêmes quatre états et les mêmes données initiales. Cela rend les observations comparables. La relecture est un simple passage d’état par une personne différente de la propriétaire. On ne simule ni qualité éditoriale, ni consentement, ni contrôle des faits. La préparation et la soumission restent collectives : `otherOwner:false` ne signifie pas « propriétaire uniquement », et le contrat v1 ne fournit pas ce prédicat.

Le bureau utilise un board pour lire les attentes par état ; les pairs une liste pour lire les contributions et états par article. Ces présentations sont des propositions de design, pas des conséquences nécessaires de leurs règles. Deux accents de familles différentes évitent le code rouge/vert d’une mauvaise et d’une bonne option. Aucune couleur n’est une preuve fonctionnelle.

Les limites d’architecture sont explicites dans chaque variante : état local, identités non authentifiées, pas de notification ni publication externe, pas de texte intégral, quorum, planning ou droits dynamiques. Le retour en correction et l’arbitrage des désaccords restent hors du parcours initial. Ce sont des limites de représentation et de périmètre, pas des besoins définitivement rejetés.

## Sources et questions

La liste `sources` est vide. Les faits inventés sont explicitement marqués fictifs dans le brief, les prémisses et la contrainte de simulation. La précision reçue du parent réserve les sources à de véritables liens consultés : les trois entrées de scénario fictif initialement envisagées ont donc été retirées avant livraison. Aucun faux entretien ni faux lien documentaire ne fait partie du projet.

Trois questions restent visibles dans le projet : conditions pour devenir référent ou pair relecteur ; contenu d’une relecture suffisante ; décision de publication et traitement du désaccord. Elles peuvent conduire l’utilisateur à confirmer, combiner ou modifier les choix. Aucune réponse n’est présupposée.

## Validation attendue

Le seed ne contient que les champs déclaratifs du contrat v1 : aucun code, expression exécutable ou HTML. IDs sûrs, quatre acteurs, trois records, deux variantes, quatre états et quatre actions par variante ; les états initiaux et propriétaires sont admis dans les deux variantes. Le fichier doit être importé comme projet initial, pas comme paquet `applyProposal`.

Lors de la première vérification, `scripts/atelier/domain.mjs` n’était pas encore disponible dans le dépôt parent. Le contrôle local vérifie donc la structure et les invariants statiques du contrat ; il n’est pas présenté comme une exécution du futur moteur. Le parent doit encore passer le JSON dans `validateProject` dès que cette implémentation est disponible.

Contrôle statique exécuté sous Node 24.18.0 : JSON lisible, format 1, identifiants uniques et sûrs, acteurs/états référencés existants, titres d’articles dans la limite de 140 caractères, mêmes états et intentions entre variantes, relecture avec `otherOwner:true`, au moins deux identités autorisées pour chaque action. Résultat : passé. SHA-256 du seed livré : `d79b0ceb8d9a5e31615611e62791c752aab895858cb50b37370df06942cb7ccb`.
