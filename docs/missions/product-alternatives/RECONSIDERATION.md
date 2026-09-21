# Recherche poursuivie après le premier prototype — 16 septembre 2026

Clarification ultérieure du propriétaire : [EMPOWERMENT](EMPOWERMENT.md) distingue la réussite d'une opération à partir d'un brief de préservation fourni et la contribution de la méthode à la construction de ce brief avec l'humain. La première est observée ci-dessous ; la seconde ne l'était pas. Le résultat ne réfute donc pas la valeur générale du guidage ou du contexte DevMethod.

La mission de recherche reste ouverte. La préférence UI donnée ensuite par le propriétaire est un travail parallèle : elle ne remplace pas la recherche de rupture. Ce document fixe les enseignements de la reprise ; [RESULTS](RESULTS.md) reste le propriétaire des conclusions générales.

## Une opération utile, obtenue par l’agent ordinaire

Hypothèse examinée : retirer un choix passé tout en conservant le travail ultérieur pourrait justifier une nouvelle unité de travail DevMethod. Avant de construire ce mécanisme, un agent ordinaire a reçu une opération concrète dans l’application Séance déjà disponible : retirer l’appel annulé, garder titre, ordre, durée de discussion, omissions indépendantes et programmes déjà publiés ; proposer un aperçu applicable ou abandonnable ; ne pas inventer les raisons historiques absentes.

Le [protocole fixé avant dispatch](evidence/reconsideration/PROTOCOL.md) donne douze minutes au travail, avec fichiers/Git/scripts/tests ordinaires. Aucun candidat DevMethod n’est fourni. Il s’agit d’une vérification de capacité dans un contexte connu, pas d’un A/B, d’un scénario aveugle, d’un essai humain ou d’une mesure de productivité. Les campagnes natives arrêtées restent closes.

L’agent a livré `491491a505665e6ca72eeb5839dc20d041b54f5c`, repris sans modification de contenu dans `6d73ee7`. Son intervalle observé est de **5 min 50 s** ; consommation et temps actif séparé inconnus. Cinq fichiers, 229 insertions et 5 suppressions. Le [journal](evidence/reconsideration/ordinary-result.md) rapporte 17 tests Séance, 330 tests complets, lint/format et pack dry-run réussis sous Node 24.18.0. L’exécution complète autorisée a résolu les refus de lancement locaux de la première exécution sandboxée ; ceux-ci ne sont pas qualifiés de défauts du produit.

La [revue indépendante](evidence/reconsideration/review.md) n’identifie pas de défaut majeur dans ce delta. Deux contrôles DOM nouveaux vérifient une obligation non encore intégrée et un appel existant en retard, avec préservation du document et des anciennes sorties. Ils complètent les contrôles de l’auteur sans répéter sa suite complète.

**Résultat : conserver l’amélioration métier et écarter la nécessité d’un moteur spécial pour cette annulation.** Le code retire explicitement l’appel et son obligation depuis l’état courant. Il ne retire pas arbitrairement une décision avec toutes ses conséquences : les omissions restent, et chaque ajout éventuel est demandé explicitement. Ce résultat ne prouve ni l’inutilité de tout produit DevMethod, ni un avantage humain.

## Vérification dans Chrome par le parent

Application isolée servie sur `http://127.0.0.1:9089/`, état de démonstration créé par l’agent, aucun historique utilisateur récupéré. Commit servi : `491491a`. Chemin effectivement exécuté :

1. Publier v1, intégrer l’obligation d’appel, choisir le compromis qui conserve la discussion en omettant F4, publier v2.
2. Placer F2 avant F1, retirer F5 et réduire la discussion à dix minutes. L’aperçu du retrait conserve ces choix, retire l’appel et ses deux minutes d’attente, et donne une salle vide à **20:32**. Les ajouts F4 et F5 sont proposés sans être exécutés.
3. Abandonner l’aperçu : l’appel reste dans le brouillon. Rouvrir, appliquer sans publier, recharger : ordre, omissions et durée restent, deux publications seulement.
4. Saisir « Séance après annulation » avec de vraies frappes clavier et Tab, recharger, réintroduire seulement l’obligation puis la retirer par aperçu. Après un nouveau rechargement le titre est conservé et la sortie vaut encore 20:32. La v1 reste sélectionnable avec son titre initial et sa sortie 21:02.

Le premier essai de saisie via CUA `fill` n’avait pas déclenché le gestionnaire `change`. Le texte visible ne persistait donc pas ; la frappe clavier l’a fait. C’est la même limite d’interaction déjà observée dans la construction initiale, pas un nouveau défaut d’annulation. Le premier parcours ne compte pas comme preuve de préservation d’un titre qui n’avait pas été enregistré.

La capture de l’aperçu a été affichée et inspectée : horaires, incertitude et ajouts sont lisibles. Aucun nouveau téléchargement, essai mobile, lecteur d’écran ou effort humain n’est revendiqué pour ce delta. Les tests automatiques et la revue vérifient séparément l’identité des HTML historiques.

## Les autres conceptions réexaminées

| Conception | Changement concret proposé | Ce que la reprise permet de décider |
| --- | --- | --- |
| Transaction produit | Annuler une opération depuis le produit courant sans revenir à une vieille copie | Simplifiée : l’agent ordinaire et une opération métier explicite suffisent ici. |
| Dépendances d’intentions | Reconnaître quelles conséquences d’un choix doivent être réexaminées | Indéterminée : les raisons des omissions manquent. Un graphe créé après coup ne peut les inventer. Ne pas construire le registre pour cette seule annulation. |
| Correction comme programmation | Une correction concrète devient un comportement durable, éprouvé sur de nouveaux cas | À tester seulement sur une règle répétée ; le retour UI unique établit une référence, pas une politique esthétique générale. |
| Outil augmenté pendant l’usage | La personne reçoit une nouvelle capacité dans son support de travail et la réutilise sans recopier ses données | Besoin crédible à explorer ; fortes antériorités, pas d’espace vide démontré ni d’avantage local mesuré. |
| Adoption sur l’état courant | Continuer à travailler pendant une évolution puis l’adopter sans perdre les actions intervenues entre-temps | Retenue comme exigence, runtime supplémentaire non justifié. Un agent avec sauvegarde/migration/rechargement reste un témoin valable. |

Les [trois mécanismes recherchés](evidence/opportunities-followup.md), les [contre-exemples](evidence/ordinary-counterexamples.md) et le [verdict sur la continuité](evidence/continuity-verdict.md) gardent les coûts, antériorités et critères d’abandon. Ces passes sont de la recherche par agents, jamais des participants simulés comptés comme des utilisateurs.

## Besoins et antériorités supplémentaires

La question intéressante devient la distance entre une gêne éprouvée pendant le travail et une capacité durable dans l’outil. Elle n’est pas neuve. Patchwork décrit la construction de petits outils sur un document existant ; Cambria traite la compatibilité entre schémas. Ces mécanismes ne révèlent pas automatiquement la préférence d’une personne face à un conflit métier. [Patchwork](https://www.inkandswitch.com/project/patchwork/), [Cambria](https://www.inkandswitch.com/cambria/).

Une étude exploratoire publiée en mai 2026 a suivi huit personnes pendant trois jours sur leurs propres e-mails. Elles ont surtout adapté des fonctionnalités connues à leurs pratiques. L’étude rapporte également des corrections successives et de l’incertitude sur les effets ; les chercheurs ont parfois aidé la réalisation avec un agent externe. Elle soutient l’intérêt d’étudier la modification pendant l’usage, sans établir une supériorité autonome ni un bénéfice de DevMethod. [Sreedhar, Kaul et Chilton, texte des auteurs](https://arxiv.org/html/2605.11149v1).

La séparation préparation/usage existe aussi dans des produits : Replit documente les checkpoints et Lovable distingue données Test et Live, avec des limites explicites sur les migrations de données. Leur documentation ne permet donc pas de leur attribuer une absence générale de préservation. Aucun de ces produits n’a été exécuté dans cette reprise. [Replit](https://docs.replit.com/learn/build-with-agent), [Lovable](https://docs.lovable.dev/features/environments).

## Prochain seuil de preuve

Ne pas remplacer la recherche par une nouvelle plateforme de démonstration. Le prochain essai doit porter sur une évolution utile d’un support réellement utilisé, avec son état initial effectivement disponible. Le propriétaire accomplit sa tâche, exprime une friction et essaie la capacité produite sur un travail ultérieur. Le bon agent ordinaire peut lui aussi modifier directement le support, faire un prototype, préserver les données et poser une question pertinente. Compter la préparation et l’intégration du candidat, pas seulement ses clics finaux.

Chercher un effet observable : moins de recopie ou de ressaisie, continuation réelle de la tâche, découverte d’une conséquence qui change un choix, réutilisation sans nouvelle explication. Aucun de ces bénéfices ne peut être obtenu en faisant répondre un agent à la place du propriétaire. Une question facultative a été adressée au propriétaire sur une tâche réelle encore trop coûteuse à piloter ; elle ne suspend pas les vérifications indépendantes ni l’UI déléguée.

Une réalisation par un agent ordinaire réfute une incapacité supposée, pas à elle seule la valeur de distribuer une bonne capacité. À l’inverse, rendre un bouton utilisable ne démontre pas cette valeur. **La rupture reste à démontrer ; aucune des observations de cette reprise ne permet de l’annoncer.**
