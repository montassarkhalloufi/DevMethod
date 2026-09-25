# Contre-exemple à notre recherche d’un avantage

16 septembre 2026. Passe bornée, aucune modification du dépôt, aucun provider ou lancement de campagne. Un calcul local utilise le domaine existant ; aucune observation de préférence humaine n’est inventée.

**Nous n’avons pas établi une catégorie que « bon agent + Git + notes + tests » serait incapable de traiter.** Un agent doté des mêmes outils peut construire chacune des expériences proposées. La limite intéressante est informationnelle : une intention telle que « annuler ce choix sans perdre le reste » peut admettre plusieurs transformations correctes dont aucune n’est la volonté déductible du code. Git conserve des changements ; les tests vérifient les attentes déjà formulées. Ni l’un ni les autres ne décident quel engagement l’utilisateur veut sacrifier lorsque ses demandes se contredisent. Un bon agent doit alors obtenir une nouvelle information, éventuellement en fabriquant une situation concrète à modifier.

Je recommande **un seul mécanisme à essayer**, plutôt que deux nouveaux prototypes : retirer sélectivement une décision dans le produit réel, montrer le conflit résiduel et laisser la personne corriger la transformation. Il est intéressant uniquement si cette expérience découvre une intention que la bonne conversation ordinaire ne révèle pas aussi simplement.

## Ce que notre tâche a réellement montré

- Le moteur Atelier a donné des résultats techniques utiles pour permissions/transitions, puis n’a pas pu représenter temps, ordre et sorties du cas Séance. Cela réfute sa généralité proposée pour ce cas ; ce n’est pas une preuve que les moteurs sont inutiles.
- Un agent ordinaire a construit la séance avec JS et les outils habituels. Cette observation contredit la nécessité supposée d’une nouvelle couche DevMethod pour produire cette expérience ; elle ne mesure pas sa productivité comparée.
- Les premiers choix n’avaient pas gardé toutes leurs observations. Corriger les snapshots a réparé la conservation, pas démontré une découverte de besoin.
- Nous avons demandé à des agents de choisir dans des situations fictives, puis vérifié leurs calculs et leur interface. Nous avons donc principalement observé ce que nous savions déjà spécifier, pas ce que la manipulation apprend à un propriétaire réel.
- L’éditeur initial promis dans la réserve n’existait pas. La construction après révélation n’a pas été une reprise comparative. Ne pas reproduire ce biais : utiliser maintenant l’application Séance effectivement disponible.

Sources locales : docs/missions/product-alternatives/{RESULTS,REPRISE}.md. Ces faits justifient un déplacement de l’essai, pas une généralisation à tous les agents ni une conclusion de marché.

## Besoin et hypothèse

Besoin proposé : changer d’avis sur une décision ancienne tout en gardant les modifications ultérieures que l’utilisateur juge indépendantes. La difficulté n’est pas seulement de restaurer des lignes. La décision peut avoir modifié données, sorties diffusées et contraintes d’usage ; la retirer peut rendre l’ensemble impossible. « Annuler » doit alors devenir une nouvelle décision, sans effacer l’histoire.

Hypothèse falsifiable : voir le résultat concret d’un retrait partiel, avec les pertes et conflits réels, permet au propriétaire de préciser ce qu’il entendait par « annuler » et de conserver une intention mal exprimée. Un simple écran de dépendances ou la phrase « impossible » ne suffit pas. L’effet observé recherché est une correction ou précision réellement donnée par la personne, puis appliquée au produit. Aucun bénéfice humain n’est établi avant qu’une personne fasse cette action.

## Opération exécutable ici, sans grande fixture

Base : examples/seance/, servie localement comme documenté. Utiliser un workspace navigateur neuf ou une copie des données, sans écraser l’expérience laissée à l’utilisateur. Les étapes suivantes créent un historique **de démonstration écrit par l’opérateur**, pas un historique utilisateur retrouvé.

1. Publier v1 du programme initial.
2. Choisir le compromis « discussion conservée, F4 retiré, attente2 » et publier v2. L’appel reste20:05–20:20 ; salle vide21:10.
3. Effectuer deux changements ultérieurs visibles : titre « Films du quartier — septembre » ; F2 avant F1. Cet échange ne change pas le total avant l’appel. Publier v3 et conserver les trois exports.
4. Nouvelle demande : « Réintègre Le banc bleu. Garde mon nouveau titre, F2 avant F1 et l’appel à20:05. Montre-moi ce qui doit changer, ne choisis pas à ma place. » Si la personne exprime seulement « annule le choix précédent », il faut d’abord distinguer annuler la suppression de F4, annuler l’appel ou revenir entièrement au vieux programme. Ne pas décider arbitrairement que ces phrases signifient la même chose.

Un revert global de v2 remettrait aussi en cause l’appel et risquerait d’effacer les modifications ultérieures ; un simple ajout de F4 ne respecte pas la salle. Le domaine existant calcule effectivement cette réintégration seule : salle vide21:19, dépassement9 minutes. Même en supprimant les deux minutes d’attente par réorganisation, six films92 + entracte10 + discussion15 + appel15 + sortie5 =137 minutes, soit7 de trop dans la fenêtre130. Ce n’est donc pas une préférence technique que l’agent pourrait résoudre silencieusement.

Une possibilité concrète, **non adoptée**, est de retirer F5 plutôt que F4 : F2, F3, F4, discussion15, appel, F1, entracte, F6. Le calcul local existant confirme appel20:05–20:20, salle vide21:01, titre conservé et F2 avant F1. Une autre possibilité est que l’appel remplace la discussion ; cela touche un engagement distinct. L’outil doit permettre de refuser ces suggestions et d’exprimer autre chose. Ne pas prétendre qu’un solveur a trouvé « le meilleur » programme.

Le travail à construire est petit : un retrait proposé qui agit sur un brouillon copié, une vue de ce qui reste/de ce qui casse, et l’application explicite du compromis retenu. Les fonctions schedule/changes/publish, l’édition et les sorties existent déjà. L’agent peut réaliser cela directement dans le produit, sans schéma universel de décisions ni plateforme de replay. Préserver chaque ancienne publication byte pour byte et laisser les versions consultables. Un nouveau HTML réellement utilisable, pas une carte de ledger, termine l’opération.

## Pourquoi le bon agent ordinaire peut déjà suffire

Il a le code, toutes les versions, les mêmes données, la demande et les mêmes droits. Il peut lire les fonctions, constater l’impossibilité arithmétique, produire deux brouillons, poser la question de compromis, préserver les sorties et utiliser Git pour le code. Il peut construire une petite vue temporaire s’il le juge utile. Le priver de cette possibilité fabriquerait un avantage.

Le comparateur fort reçoit **exactement** les mêmes informations et le même accès à l’utilisateur ; il utilise sa conversation, le produit et ses outils habituels, sans obligation de créer un registre. Le mécanisme candidat ajoute seulement la commande située « retirer cette décision » et une transformation immédiatement inspectable. On ne peut pas créditer à l’interface l’excellente rédaction des propositions si le comparateur ne reçoit pas les mêmes explications factuelles.

Si l’agent ordinaire pose la bonne question, préserve les données et obtient la même révision en peu d’échanges, il gagne. S’il construit lui-même le même mécanisme sans effort significatif, la contribution éventuelle est une recette réutilisable ou une commodité d’intégration, pas une capacité fondamentale exclusive de DevMethod.

## Limite réellement observable et règle de poursuite

Sans personne : constater seulement calcul exact, conservation des changements indépendants et des publications, conflit signalé, absence de compromis imposé, commande qui applique réellement la décision. Le retrait sélectif de code **et** de données n’est pas démontré si ce cas ne change que les données. Ne pas ajouter une modification de code artificielle pour faire paraître la preuve plus large.

Avec le propriétaire réel : demander de réaliser le retrait dans le produit. Conserver ses mots initiaux, ce qu’il a réellement corrigé après l’essai, le résultat qu’il accepte et les interventions nécessaires. Une nouvelle préférence dictée par l’évaluateur ne compte pas comme découverte. Une personne/deux conditions reste un essai formatif sensible à l’ordre ; aucune économie de temps humaine, effet causal ou supériorité générale ne peut être déduite d’un parcours fait par l’agent.

Poursuivre seulement si une divergence concrète apparaît : une intention restée ambiguë dans la conversation est précisée par la manipulation, ou une perte non voulue est repérée grâce au résultat situé, à un coût jugé acceptable par cette personne. Si la conversation obtient cela aussi bien, conserver l’agent simple. Ne pas remplacer cet échec par un score de tests, une mesure de clics isolée ou un nouveau benchmark.

## Antériorités et contre-preuves utiles

L’annulation sélective n’est pas une invention à revendiquer : Azurite documente le retrait d’anciens changements de code en conservant les autres et propose plusieurs façons de sélectionner ce retrait. Cela ne résout pas automatiquement les engagements métier ou sorties déjà diffusées. [Projet primaire CMU](https://www.cs.cmu.edu/~azurite/).

Des travaux sur la programmation par exemples traitent déjà l’ambiguïté en faisant naviguer des programmes compatibles ou en posant des questions ciblées sur leurs différences. Ils donnent une raison d’essayer une désambiguïsation concrète ; ils ne valident pas notre usage ni un avantage d’un agent actuel. [Mayer et al., UIST2015, source des auteurs](https://www.microsoft.com/en-us/research/publication/user-interaction-models-disambiguation-programming-example/).

Potluck montre une transformation progressive de documents en outils ; ses auteurs reconnaissent ensuite, dans Embark, avoir produit beaucoup de démonstrations mais peu utilisé Potluck dans des situations sérieuses. Cette contre-preuve correspond précisément à notre risque : une expérience agréable et techniquement convaincante peut ne pas devenir un outil dont on a besoin. Leur réponse fut de travailler sur des usages réellement vécus, pas d’ajouter un évaluateur. [Potluck](https://www.inkandswitch.com/potluck/), [Embark](https://www.inkandswitch.com/embark/).

Sources primaires consultées le16septembre2026. Ces antériorités bornent la nouveauté ; aucune exécution de ces produits ni transposition de leurs résultats humains n’a été réalisée ici.
