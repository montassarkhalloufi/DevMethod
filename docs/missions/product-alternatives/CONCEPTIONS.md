# DevMethod : trois architectures à mettre en contradiction

Statut : propositions de conception, 16 septembre 2026. Aucune n’est adoptée. Aucun prototype, appel modèle ni essai utilisateur n’a été exécuté pour ce document. Les observations sur le kit proviennent des fichiers locaux ; les bénéfices ci-dessous sont des hypothèses. Le scénario et ses événements sont réservés dans un dossier séparé jusqu’au gel d’un candidat.

## Ce qui doit changer pour l’utilisateur

L’utilisateur ne cherche pas une nouvelle manière de remplir exploration, cadrage, design et architecture. Il veut comprendre ce qui mérite d’être construit, choisir en connaissance de cause, essayer le résultat et pouvoir changer d’avis sans perdre ce qui fonctionne. Ces fonctions demeurent nécessaires ; leur ordre, leur interface et leurs propriétaires peuvent changer.

Le kit actuel n’impose déjà ni quatorze tours ni des documents vides. ADR 007 privilégie la conversation, les propriétaires uniques et des modèles Markdown ; ADR 009 expose les commandes de stage ; WORKFLOW-0.3 et work-sizing autorisent un chemin court. Une nouvelle interface autour de ces mêmes entrées serait une amélioration ergonomique possible, mais ne suffirait pas à démontrer une rupture.

Les choix ci-dessous portent donc sur l’unité qui déclenche et organise le travail, sur l’état que le logiciel possède réellement et sur ce que l’utilisateur peut faire. Ils ne remplacent aucune décision acceptée du dépôt à ce stade.

## A — Le changement est une transaction sur un projet existant

**Centre : une demande et son résultat utilisable.** DevMethod devient un adaptateur de travail intégré à l’agent et au dépôt. Il ne possède pas un parcours produit parallèle. Il rassemble juste les sources nécessaires, délimite les décisions déléguées, ouvre un changement réversible, puis rend le résultat dans l’application. Les connaissances restent dans leurs outils et fichiers actuels.

Interaction concrète : l’utilisateur demande une évolution, indique éventuellement son intention et ses interdits, puis utilise le résultat courant. L’agent demande une décision seulement lorsque deux issues matériellement différentes restent ouvertes. Il peut rechercher, dessiner, comparer une architecture, expérimenter ou simplement corriger une ligne selon ce qui bloque la demande. Après un changement de besoin, il reprend les parties affectées de cette même transaction. « Pourquoi ce changement ? », « revenir à la version précédente » et « conserver cette décision mais annuler cette réalisation » sont des opérations distinctes.

Architecture : adaptateurs de sources en lecture, sélection progressive de contexte, transaction Git isolée, orchestration d’outils ordinaires et révision d’autorisation. Un petit état durable identifie le résultat demandé, ses décisions actives et les propriétaires externes ; il n’est pas une copie de leur contenu. Les stages ne sont plus l’API principale. Les documents ne sont produits que s’ils servent un destinataire ou une règle existante.

Prototype honnête : prendre une vraie demande, modifier une application exécutable dans une branche, montrer son comportement, puis revenir à une décision antérieure en conservant une autre modification demandée. Un simple bouton qui change le texte d’un résumé ne démontre pas la transaction. La réversibilité après un effet externe reste une limite explicite ; un revert Git n’annule pas un e-mail ou une écriture distante.

Hypothèse favorable : le coût d’adoption baisse et la reprise reste utile dans un dépôt déjà structuré. Hypothèse contraire : un agent ordinaire bien briefé sait déjà faire presque tout cela ; l’adaptateur ajoute du contexte, des états et une maintenance qui coûtent plus qu’ils ne rapportent. La démonstration devrait montrer une reprise ou une préservation réellement meilleure, pas seulement un écran plus net.

Condition d’abandon : aucune différence utile face à l’agent ordinaire sur les tâches réelles, ou besoin de maintenir un second propriétaire pour chaque vérité du projet.

## B — Les choix produit sont des règles que l’on peut exécuter

**Centre : le comportement d’un produit sous des décisions concurrentes.** L’interface permet d’essayer une règle et ses conséquences sur les mêmes entrées, puis de retenir ou rejeter ce comportement. Une option n’est pas une vignette de design. Elle commande réellement le produit, ses résultats ou ses contraintes.

Interaction concrète : l’utilisateur réalise son travail avec une première règle. Il peut ensuite essayer une autre réponse à une ambiguïté métier, constater qui gagne ou perd quoi, et retenir un compromis. Le design porte sur la capacité à comprendre et agir dans chaque option. L’architecture isole seulement les variations utiles ; la sélection retenue est celle employée par le produit courant. Un changement de besoin peut supprimer une variation devenue inutile, plutôt qu’ajouter un nouveau panneau.

Architecture : domaine exécutable, jeu d’entrées réel ou explicitement fictif, stratégies métier substituables là où une décision le justifie, calcul observable des résultats et choix actif persistant. Les vérifications techniques entourent cette chaîne ; elles ne sont pas son principal produit. L’exploration peut commencer par une alternative manuelle ou un outil existant. Aucune règle ne doit être inventée pour remplir un comparateur.

Prototype honnête : une décision modifie l’état ou le résultat effectivement utilisé lors d’une tâche ; la recharger conserve ce choix ; les sorties et limites sont inspectables. Une animation, un tableau de chiffres codés en dur ou des variantes qui partagent la même implémentation ne valent pas essai de conséquences. Quand un effet dépend du comportement humain, on l’étiquette hypothèse et on cherche un essai réel ; on ne le simule pas comme une loi métier.

Hypothèse favorable : des compromis difficiles à comprendre dans un texte deviennent discutables sur des cas vécus. Hypothèses contraires : le modèle de conséquences omet le vrai problème ; construire plusieurs versions coûte trop cher ; l’utilisateur optimise ce qui est affiché en oubliant ce qui ne l’est pas ; des configurations incohérentes apparaissent. Certaines décisions ne sont ni paramétrables ni bon marché à matérialiser. Le prototype doit pouvoir conclure qu’une seconde variante ne vaut pas son coût.

Condition d’abandon : les conséquences affichées n’aident pas l’utilisateur à réussir une tâche ou à expliquer un compromis, ou le coût des variantes dépasse les reprises évitées. Le nombre de variantes ne compte pas comme bénéfice.

## C — Un moteur de dépendances entre intentions, contraintes et contrats

**Centre : les relations causales que l’équipe accepte de maintenir.** DevMethod possède un modèle limité des décisions et dépendances actives. Les conversations, maquettes, tickets et changements de code sont des vues ou des opérations liées à ce modèle. Une nouvelle source provoque une proposition ciblée de réexamen, pas le redémarrage d’un parcours.

Interaction concrète : l’utilisateur fournit une nouvelle contrainte. Le système présente ce qui semble incompatible, ce qui reste valide et les décisions encore nécessaires. Il peut contester la relation proposée. Accepter une nouvelle décision met à jour les contrats concernés et prépare ou exécute la modification autorisée. Il doit pouvoir ignorer le graphe pour accomplir son travail normal.

Architecture : petites entités typées — intention, contrainte, observation, choix, contrat — avec propriétaire et statut explicites ; relations justifiées par une source ; journal d’événements et calcul de dépendances ; adaptateurs vers les outils existants. Les liens extraits par le modèle restent proposés tant qu’ils ne sont pas établis par une convention fiable ou validés. Le moteur peut calculer l’impact d’un lien connu ; il ne peut garantir que tous les liens importants existent.

Prototype honnête : changer un fait réel, calculer les décisions affectées, demander uniquement la décision non déléguée, puis produire un comportement modifié observable. Marquer une carte « à revoir » sans faciliter la décision ou l’action ne démontre qu’un registre. La chaîne doit s’arrêter honnêtement là où elle n’a pas de réalisation ; elle ne doit pas afficher « appliqué » après un simple changement de graphe.

Hypothèse favorable : plusieurs sessions ou responsables peuvent conserver une cohérence difficile à porter dans une conversation. Hypothèses contraires : liens manquants, faux impacts, modèle de données trop coûteux, certitude visuelle injustifiée et doublon avec les ADR/tickets. Une équipe avec peu de décisions peut perdre du temps à maintenir le mécanisme.

Condition d’abandon : le nombre de réouvertures inutiles ou le travail de maintenance dépasse les erreurs de décision évitées, ou les décisions réelles continuent ailleurs sans réconciliation praticable.

## Différences architecturales décisives

| Question | A : transaction | B : règles exécutables | C : dépendances |
| --- | --- | --- | --- |
| Déclencheur principal | Une demande à livrer | Un compromis à essayer | Une source ou décision qui change |
| État appartenant au système | Travail autorisé, contexte et transaction | Règle active et comportement observable | Décisions et relations acceptées |
| Fonction de l’utilisateur | Demander, décider si nécessaire, utiliser | Agir, comparer des effets, choisir | Corriger les dépendances, résoudre les impacts |
| Ce qui peut rester en texte | Presque toute la méthode | Les dimensions non exécutables | Les sources et explications des liens |
| Risque structurel | Intermédiaire sans valeur face à l’agent | Monde réduit aux variables du simulateur | Modèle incomplet pris pour une vérité totale |
| Dépense caractéristique à mesurer | Assemblage de contexte et reprise | Construction/entretien des variantes | Création/réparation des dépendances |

Ces architectures peuvent partager des outils mais ne doivent pas être assemblées d’emblée. Les combiner avant une discrimination ferait payer tous leurs coûts sans savoir lequel produit une utilité. Un petit prototype de B peut être utile pour rendre la question concrète ; cela n’adopte pas B, ne justifie pas un graphe derrière lui et ne permet pas d’affirmer A inutile.

## Le comparateur simple doit pouvoir gagner

Le comparateur fort est le même agent ordinaire, dans le même host, avec les mêmes capacités de lecture, recherche, questions, exécution, design et modification. Il reçoit une demande commune concise, le dépôt, les politiques existantes, les limites de délégation et les mêmes réponses utilisateur. Il peut faire une maquette ou plusieurs réalisations lorsqu’il juge cela utile, utiliser les outils existants, tenir des notes légères et reprendre son travail. Pas de privation artificielle de tests, de contexte, d’accès utilisateur ou de budget. Aucune obligation de suivre un stage, créer un registre ou construire des variantes.

Le maintien de DevMethod actuel constitue une seconde comparaison informative si le budget le permet ; il ne faut pas le confondre avec le comparateur simple. La campagne précédente arrêtée techniquement ne fournit aucune mesure permettant de classer ces options.

## Essai discriminant proposé

Un nouveau cas réservé fixe une intention utilisateur, des artefacts existants, des faits disponibles sur demande, des contraintes acceptées et un changement ultérieur du besoin. Il ne prescrit ni UI, ni nombre d’options, ni solution métier gagnante. Les choix plausibles ont des avantages et des sacrifices différents. Le changement peut rendre utile une autre décision, une réduction de portée ou une intervention manuelle. Il ne récompense pas automatiquement le mécanisme de B ou de C.

Avant sa révélation, figer pour chaque candidat : le mécanisme concret promis, ce que son prototype exécute, ses limites, le budget, les capacités du comparateur, et une prédiction réfutable qui ne dépend pas du contenu réservé. L’auteur du candidat ne reçoit pas le scénario réservé pour ajuster ses leviers. Un évaluateur distinct délivre ensuite les mêmes informations aux deux conditions. Les informations essentielles sont accessibles aux participants ; le changement n’est pas un piège portant sur une règle qu’ils devaient deviner.

Le test principal consiste à faire accomplir à une personne une tâche réelle dans les réalisations, puis à changer le besoin et à recommencer. Mesurer séparément : résultat exploitable, compréhension du compromis retenu, effort humain, erreurs récupérées, reprise nécessaire et conservation des choix/contrats établis. Les tests et traces aident à expliquer une défaillance ; ils ne remplacent pas ce résultat. Aucun score combiné pondéré a posteriori.

Une personne jouant un rôle fictif permet un essai de manipulation ; elle n’établit pas la demande du marché, la satisfaction des futurs utilisateurs ou une économie réelle. Une observation par condition est descriptive. Réutiliser la même personne et le même scénario crée un effet d’apprentissage ; le document réservé prévoit de le rendre visible plutôt que le faire disparaître dans une moyenne.

## Ce qu’un premier prototype doit nous apprendre

Vérifier que l’utilisateur peut accomplir et modifier son travail avec un mécanisme différent de la conversation habituelle, que les choix affectent réellement le produit et que ce mécanisme apporte quelque chose que le comparateur simple n’obtient pas à moindre effort. Un résultat négatif valable est : l’agent ordinaire livre aussi bien, le dispositif nouveau n’ajoute qu’un écran et des explications. Un autre est : les personnes préfèrent l’expérience, mais l’entretien supplémentaire la rend peu intéressante pour de petits projets. Les conserver vaut mieux que déplacer le critère vers le nombre de documents ou de contrôles.

Sources locales inspectées : CONTRIBUTING.md ; docs/ADR-007-conversation-and-mission-ownership.md ; docs/ADR-009-visible-workflow-commands.md ; docs/WORKFLOW-0.3.md ; docs/ROADMAP.md ; .agents/skills/project-foundation/references/work-sizing.md ; .agents/skills/decision-architecture/references/product-decisions.md. Ces sources décrivent l’existant et ses contraintes, pas la validation des propositions.
