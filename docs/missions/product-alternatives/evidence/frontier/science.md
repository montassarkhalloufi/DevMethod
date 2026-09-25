# DevMethod — trois mécanismes scientifiques pour découvrir une décision

Recherche indépendante du 16 septembre 2026, bornée à dix minutes. Sources primaires consultées ; aucun code, appel de fournisseur, utilisateur synthétique, contact ou expérimentation n’a été lancé. Les propositions ci-dessous sont des hypothèses de produit, pas des résultats de DevMethod.

## Recommandation

Construire un **essai de conséquences qui peut faire changer les critères eux-mêmes**, sur un problème concret du propriétaire. L’unité de travail serait une incertitude de décision : « quelle expérience permettrait de savoir quelle promesse nous voulons réellement faire ? ». L’agent produit une situation exécutable, le propriétaire la traverse, puis corrige une préférence, une exigence ou une hypothèse. Un prototype et son architecture deviennent les résultats provisoires de cette interaction.

Pour un premier essai distinct de l’Atelier livré, je recommande le **contre-jeu d’exigences** décrit au mécanisme 3, avec le droit de sortir du modèle emprunté au mécanisme 2. Son intérêt est observable avant de construire une plateforme : transforme-t-il une impossibilité expliquée verbalement en une décision mieux comprise et mieux assumée ? Ne pas implémenter d’abord une couche bayésienne générale. Le mécanisme 1 devient utile quand plusieurs questions ou expériences réellement réalisables rivalisent pour un temps utilisateur limité.

Le fait qu’un bon agent ordinaire puisse construire ces dispositifs ne réfute pas leur valeur. Un résultat favorable peut être une meilleure interaction, une décision avec moins de conséquences regrettées ou moins d’effort, même si les deux conditions sont techniquement capables. Inversement, coder un mécanisme exact n’en prouve pas l’utilité humaine.

## 1. Choisir la prochaine question pour son effet sur la décision

**Besoin.** L’agent peut continuer à clarifier longtemps sans apprendre ce qui ferait réellement changer le choix de produit ou d’architecture. Une incertitude très élevée peut concerner une différence sans importance pour le propriétaire.

**Modèle exact.** Pour des décisions réalisables `d`, un état inconnu `θ`, une utilité `U` et une question/expérience `q` donnant une observation `y`, la valeur attendue de l’information à un pas est :

`VOI(q) = E_y[max_d E[U(d,θ) | y,q]] − max_d E[U(d,θ)] − coût(q)`.

C’est une définition de décision bayésienne, pas la promesse qu’une question générée par un LLM soit optimale. La réduction d’entropie sur les préférences n’est pas identique à ce gain d’utilité. Sans distribution crédible, une alternative est le regret maximal : `MR(d,W)=max_{w∈W,d′}(U_w(d′)−U_w(d))`; demander ce qui resserre les préférences encore possibles. Cela exige encore une classe d’utilités, même sans probabilités.

**Antériorités et limites scientifiques.** L’élicitation par regret en optimisation contrainte est déjà étudiée par Boutilier et collègues ; leurs questions portent sur les paramètres d’un modèle d’utilité graphique. Ce cadre n’infère pas les dimensions omises du problème. [Article IJCAI 2005](https://www.cs.toronto.edu/~cebly/Papers/elicConstraintsIJCAI05.pdf).

Plus directement, **DECISIVE, ACL 2026** associe une matrice de scores issue de documents, une inférence de préférences et des questions sur les compromis, orientées vers la décision finale. Son existence interdit de présenter « LLM + préférences + questions ciblées » comme une nouveauté DevMethod. Les auteurs signalent des facteurs fixes, un modèle linéaire qui représente mal les interdépendances et une évaluation sur utilisateurs simulés ; qualité d’usage et satisfaction humaine restent à établir. Je ne transpose pas leur gain de benchmark à notre propriétaire. [Article et publication](https://aclanthology.org/2026.acl-long.1465/), [limites dans le PDF, p.9](https://aclanthology.org/2026.acl-long.1465.pdf).

Le travail **Model-Free Preference Elicitation, IJCAI 2024** apprend modèles de réponses/utilité depuis des données existantes et emploie une recherche à horizon limité. Ses expériences reposent sur des épisodes simulés depuis MovieLens/Amazon. « Model-free » ne signifie donc ni absence de données ni connaissance magique du propriétaire ; le répliquer ici sans traces pertinentes serait mal fondé. [Source primaire](https://www.ijcai.org/proceedings/2024/0387.pdf).

**Entrées nécessaires.** Au moins deux décisions réalisables, leurs conséquences mesurées ou explicitement hypothétiques, des questions possibles, une hypothèse de préférences et un coût de question. Séparer l’incertitude factuelle (« que fait la synchronisation ? », à expérimenter) de la préférence (« une réservation peut-elle être retirée ? », à demander au propriétaire). Ne jamais transformer un vote de modèles en fréquence humaine. Si le coût cognitif n’est pas convertible dans les unités de `U`, conserver séparément gain et effort au lieu de fabriquer un score monétaire.

**Mécanisme codable proposé.** Sur trois ou quatre politiques exécutables, maintenir quelques modèles de préférences explicitement provisoires ; chercher le couple situation/options qui change le plus souvent la décision recommandée. Montrer les conséquences qui divergent, proposer « aucun de ces critères » et « je ne sais pas », puis réviser. Un classement heuristique de ces questions peut être utile mais doit être nommé heuristique ; une probabilité de 90 % issue d’un prior arbitraire n’est pas une confiance utilisateur calibrée.

**Hypothèses/risque de transfert.** Dimensions et conséquences suffisamment couvertes, préférences approximativement cohérentes pendant la session, modèle de réponse plausible, scénarios compréhensibles. Une nouvelle dimension ou préférence contextuelle invalide le modèle courant et demande de rouvrir l’espace, pas de forcer une mise à jour numérique.

**Expérience contre conversation + prototypes.** Même propriétaire et mêmes options, mais cas indépendants et ordre contrebalancé si l’on veut une comparaison. Budget égal d’interaction et même accès aux outils. Le bon agent libre choisit ses questions et expériences ; le candidat applique sa politique. Après choix, le propriétaire juge des conséquences nouvelles non utilisées dans les questions. Comparer l’effort et les comportements qu’il regrette effectivement ; le regret calculé par notre modèle est une mesure secondaire. Si le modèle pose des questions incompréhensibles ou ignore le vrai critère, c’est un échec, même si sa variance diminue.

## 2. Construire une alternative qui fait émerger un critère absent

**Besoin.** « Je veux que ce soit simple » n’identifie pas nécessairement les situations dans lesquelles la personne accepte une attente, une restriction ou un travail de rattrapage. Raffiner uniquement les poids de critères déjà nommés enfermerait cette découverte.

**Modèle exact et analogie.** L’*example-critiquing with suggestions* représente des options et des préférences partielles ; les suggestions visent à stimuler des préférences encore inexprimées. Le calcul d’une suggestion dépend d’un espace d’attributs et d’hypothèses sur les préférences cachées. Le transfert à DevMethod serait une **analogie explicitement proposée** : remplacer l’objet de catalogue par un comportement logiciel exécutable, et permettre au propriétaire d’introduire une nouvelle dimension. Cela n’offre aucune garantie que le critère découvert soit le bon ou qu’il n’ait pas été induit par notre mise en scène.

**Antériorité.** Viappiani, Faltings et Pu décrivent cette approche dans JAIR **2006** ; le dépôt arXiv date de 2011. Leur étude concerne la recherche d’options dans des catalogues et combine simulations et utilisateurs réels. Elle étaye l’intérêt d’exemples conçus pour susciter des critiques, pas l’efficacité de DevMethod face à un agent contemporain. [Article original](https://arxiv.org/pdf/1110.0026), [métadonnées de publication](https://arxiv.org/abs/1110.0026).

Une antériorité conversationnelle plus récente doit faire partie d’une baseline ambitieuse : **GATE, ICLR 2025** génère des questions/exemples pour éliciter les préférences. L’étude préenregistrée inclut 388 participants sur recommandation de contenus, jugement moral et validation d’emails. Elle mesure l’accord avec leurs jugements sur des cas de test ; toutes les différences ne sont pas significatives dans tous les domaines. Elle ne compare pas une conversation experte avec prototypes fonctionnels à notre dispositif. [Source primaire, sections 4 et limites de l’évaluation](https://proceedings.iclr.cc/paper_files/paper/2025/file/c9867d5a22653ce98b02595061e40f12-Paper-Conference.pdf).

**Entrées nécessaires.** Travail que le propriétaire veut accomplir, un petit échantillon de cas qu’il reconnaît, options ayant des conséquences réellement différentes, critères déjà exprimés et faculté de les critiquer librement. Aucun profil latent rédigé par nous ne remplace une réponse du propriétaire.

**Mécanisme codable proposé.** Pour une préférence courante, produire un contre-exemple utile : deux petites implémentations accomplissent l’action normale mais divergent sur une situation limite pertinente. Faire agir le propriétaire, montrer l’état concret obtenu, puis offrir une correction libre du comportement. Cette correction doit changer la génération des prochaines options, éventuellement la structure des données et des responsabilités. Ce n’est pas seulement un bouton A/B ni trois habillages de la même règle. Garder visibles « préférence observée », « reformulation par l’agent » et « nouvelle proposition » afin que la reformulation soit corrigeable.

**Hypothèses/risques.** Le cas doit réellement appartenir au travail du propriétaire ; l’alternative ne doit pas être volontairement dégradée pour fabriquer un gagnant. Une préférence peut se construire pendant l’essai plutôt qu’être simplement révélée. Ne pas attribuer toute reformulation à une vérité cachée antérieure. Une nouvelle préférence n’est pas en soi une amélioration : elle peut augmenter inutilement la complexité.

**Observable et expérience.** L’agent doit produire une modification fonctionnelle utilisable depuis la critique, puis le propriétaire l’appliquer à un autre cas. Comparer avec un agent libre de poser des questions ouvertes, d’esquisser et de modifier les mêmes prototypes. Mesures : conséquences rejetées après transfert au second cas, effort actif, compréhension des sacrifices et conservation du travail déjà utile. Le nombre de nouveaux critères est un indice descriptif, pas la métrique de victoire.

## 3. Jouer la contradiction avant de choisir la promesse

**Besoin.** Des exigences individuellement raisonnables peuvent être incompatibles sous une certaine concurrence, panne ou action utilisateur. Lire « il faut arbitrer » ne suffit pas forcément à comprendre quelle promesse modifier. Le propriétaire peut n’avoir jamais imaginé la séquence qui rend ce choix nécessaire.

**Modèle exact.** Dans un jeu fini à deux acteurs, l’environnement choisit certaines entrées et le logiciel ses réponses ; la réalisabilité signifie qu’une stratégie système respecte les exigences pour toutes les entrées admises. Une contre-stratégie de l’environnement montre pourquoi aucune stratégie système ne convient. C’est plus fort qu’une unique mauvaise exécution, et différent de l’insatisfiabilité d’une simple liste de contraintes. Les garanties portent uniquement sur le modèle formel, ses observations disponibles et ses hypothèses.

**Antériorité directe.** **Counter Play-Out, ICSE 2013**, inverse les rôles : un contrôleur joue l’environnement et l’ingénieur joue le système. L’interaction rend exécutable la cause d’une spécification irréalisable. L’article décrit notamment un distributeur où une correction provoque encore un autre conflit. C’est précisément une antériorité du mécanisme envisagé, pas une invention DevMethod. L’article présente méthode, prototype et cas ; je n’en tire pas une preuve d’avantage pour un propriétaire non technique. [PDF auteur](https://www.cs.tau.ac.il/~maozs/papers/counterplayout-icse13.pdf).

**Entrées nécessaires.** Actions possibles, état et information visibles à chaque acteur, hypothèses d’environnement, promesses en langage utilisateur reliées à des propriétés vérifiables, et situations que le propriétaire accepte comme pertinentes. Le propriétaire doit pouvoir contester l’abstraction : l’agent ne peut pas choisir une hypothèse artificielle uniquement pour prouver une impossibilité.

**Mécanisme codable proposé.** Commencer par un jeu minuscule lié à deux vrais clients de démonstration et à une ressource partagée, pas par un solveur général de tout DevMethod. L’agent cherche un conflit, lance la situation dans le logiciel et laisse le propriétaire choisir une réponse. Dès qu’une promesse doit céder, afficher les engagements concernés et laisser modifier l’un d’eux ou proposer un autre fonctionnement. Rejouer ensuite le même conflit et un cas voisin sur l’implémentation modifiée.

Si seule une exploration bornée des traces est implémentée, écrire « conflit trouvé jusqu’à N étapes » et non « irréalisable ». Une trace testée dans deux navigateurs établit un comportement réel de ces prototypes ; seule une preuve sur un modèle adéquat justifie une affirmation d’impossibilité. Aucun besoin d’ajouter stages, documents ou nouveau laboratoire générique.

**Expérience.** Baseline : un bon agent reçoit les mêmes engagements et peut expliquer, dessiner, coder et lancer lui-même tout scénario. Candidat : contre-jeu + liaison des promesses aux traces. Même temps et accès. Critère principal : le propriétaire choisit une politique, prédit ses conséquences sur un scénario voisin et accepte effectivement le sacrifice lorsque celui-ci arrive. Mesurer séparément effort humain et préparation du dispositif. Une explication ordinaire tout aussi bien comprise et moins coûteuse invaliderait l’intérêt du dispositif pour ce cas ; sa simple capacité à reproduire le mécanisme ne l’invalide pas.

## Essai concret recommandé : la dernière ressource hors connexion

**Cas proposé, pas besoin observé ni nouvelle fixture créée.** Un logiciel de prêt gère le dernier kit de tournage d’un collectif. Deux personnes préparent des demandes sur deux appareils momentanément sans connexion. Ne pas présupposer que « réserver » signifie engagement ferme, que tout le monde doit pouvoir confirmer hors ligne ou que l’annulation ultérieure est interdite : ces termes sont précisément à établir avec le propriétaire.

Le dispositif peut faire vivre trois politiques plausibles, sans gagnant prédéfini : demande locale provisoire puis arbitrage au retour ; confirmation seulement avec une autorité joignable ; droit de confirmer hors ligne préalloué à un détenteur déterminé. Elles impliquent des attentes, disponibilités et responsabilités différentes. Une autre politique proposée par le propriétaire doit rester admissible.

Séquence utile : obtenir une interprétation initiale ; faire deux demandes sur la même ressource ; déconnecter/reconnecter effectivement les clients de démonstration ; montrer qui pense disposer du kit et quand ; demander quelle promesse doit changer ; construire la politique retenue ; exécuter une nouvelle séquence, par exemple une annulation avant synchronisation. Si le propriétaire juge la concurrence hors ligne sans intérêt pour son travail, abandonner ce cas plutôt que rendre l’agent candidat artificiellement nécessaire.

**Frontière de preuve réalisable ici.** Sans réponse humaine, on peut seulement établir que les variantes fonctionnent, que les conséquences divergent et qu’un conflit est correctement exposé. Avec le propriétaire présent, on peut observer sa nouvelle formulation et son usage ; une seule séance reste exploratoire. Faire successivement la baseline puis le candidat sur le même problème entraîne un apprentissage irréversible : ce n’est pas un A/B causal. Une comparaison sérieuse exige des problèmes distincts contrebalancés ou plusieurs propriétaires. Pas de bénéfice simulé en attendant.

Un premier succès raisonnable serait modeste mais substantiel : une promesse ambiguë devient une politique choisie après expérience, le propriétaire prévoit correctement un effet non montré, et le logiciel l’exécute sur le cas voisin sans perdre les données. Une note de décision et des tests peuvent accompagner ce résultat ; ils ne le remplacent pas.

## Ce qui change dans notre manière de chercher

Les essais précédents ont démontré des capacités locales : programmer une annulation explicite, conserver des éditions indépendantes, présenter et choisir des variantes. Ils n’ont pas démontré que le propriétaire découvre une meilleure décision. Le cas Séance a aussi montré qu’un espace de représentation trop étroit exclut le besoin. Ce sont des observations de cette tâche, pas une loi générale contre les interfaces structurées.

La prochaine hypothèse doit donc rester ouverte à deux résultats utiles : une interaction préparée améliore réellement le choix ; ou une conversation compétente accompagnée de prototypes obtient aussi bien avec moins de préparation. La comparaison porte sur ces résultats et leur coût complet, jamais sur une prétendue incapacité universelle de l’agent ordinaire.
