# Verdict — adopter une évolution sur le travail actuel

16 septembre 2026. Suivi commencé à 10:34:40 UTC, limité à cinq minutes. Lecture et recherche seulement ; aucune nouvelle démonstration, modification du dépôt ou exécution de fournisseur. Les résultats de la passe ordinaire sont rapportés par le parent, pas revérifiés ici.

**Décision : retenir la continuité du travail comme exigence du produit métier ; ne pas construire maintenant un runtime DevMethod pour l'obtenir.** Le mécanisme distinctif et son avantage face à un bon agent avec rechargement et stockage local ne sont pas établis. Cela ne retire aucune valeur éventuelle à l'outil métier, ni au fait d'obtenir une petite évolution utile en quelques minutes.

## Ce que le retour réel du propriétaire permet de décider

Le propriétaire a dit que les images séparent mieux les blocs et a répondu « comme les images » à une tentative de choix entre deux directions. C'est une préférence réelle mais étroite : rendre cette séparation perceptible en suivant ces références. Ce n'est pas une préférence prouvée pour un système de cartes universel, une densité générale, toutes les couleurs des références ou une méthode de décision.

La réponse utile consiste à modifier effectivement l'interface, conserver les images comme références de cette modification, puis repartir de cet état approuvé lors des évolutions suivantes. La préférence doit vivre d'abord dans le produit — structure, espaces, limites visuelles et composants concernés — plutôt que seulement dans une note qui promet de la respecter. Une courte trace de provenance peut indiquer pourquoi ce choix a été fait et éviter sa réinterprétation. **Un bon agent, le code actuel et cette trace suffisent plausiblement pour ce seul retour.** Aucun nouveau questionnaire n'est nécessaire et aucune intelligence adaptative supplémentaire n'est démontrée.

Si une évolution suivante remet les blocs à plat malgré cet état approuvé, ce sera une régression concrète à examiner. Nous n'avons pas encore observé une série de corrections répétées justifiant un mécanisme d'apprentissage des préférences. Transformer ce retour unique en « profil propriétaire » inventerait de la connaissance.

## La conséquence qui serait réellement intéressante

La promesse à éprouver serait : **« Continuez votre travail ; quand l'amélioration est prête, vous pouvez l'adopter sur ce que vous avez maintenant, sans recopier ni perdre vos modifications. Si elle change le sens d'un choix déjà fait, ce point vous est présenté. »**

L'intérêt n'est pas l'absence de rechargement à elle seule. Si un rechargement bref retrouve tout et permet de continuer, le résultat utile est déjà obtenu. La frontière éventuelle est la combinaison suivante : l'agent prépare une capacité depuis un état antérieur ; le propriétaire continue à modifier et à publier son travail ; au moment de l'adoption, le changement s'applique à cet état courant et distingue les modifications compatibles d'un conflit métier.

Exemple contrefactuel, **non observé** : pendant la préparation d'une modification des règles d'annulation, l'organisatrice modifie le brouillon et diffuse une nouvelle version. Adopter la capacité ne doit ni restaurer le vieux brouillon de l'agent, ni réécrire la version diffusée, ni supposer quelles conséquences de l'annulation elle accepte. L'agent peut proposer une transformation du comportement sans fournir une copie périmée du travail comme nouvel état.

Cette conséquence est plus précise qu'un aperçu vivant ou une mémoire de préférences. Elle reste toutefois accessible à un développement ordinaire : données séparées du code, sauvegarde des entrées en cours, migration ciblée, validation au chargement et vérification de l'état courant avant application. Il ne faut pas rendre ce témoin artificiellement naïf, par exemple en oubliant volontairement de sauvegarder le champ actif.

## Pourquoi les antériorités empêchent de revendiquer une rupture

Patchwork décrit déjà l'ajout d'un outil opérant sur un document existant, avec mises à jour directes, et la conservation du code comme des données. Les auteurs discutent aussi les difficultés de forks et de composition. Cette proximité réduit fortement la nouveauté du récit « l'outil reçoit une capacité pendant qu'on travaille ». Ce sont des descriptions de recherche et d'usage des auteurs, pas une expérience reproduite ici. [Ink & Switch, Malleable Software, juin 2025](https://www.inkandswitch.com/essay/malleable-software/), [projet Patchwork 2024–2026](https://www.inkandswitch.com/project/patchwork/).

Cambria présente depuis octobre 2020 des traductions bidirectionnelles entre schémas et un prototype dont plusieurs versions peuvent collaborer. Les auteurs reconnaissent que certaines conversions ne peuvent représenter toute l'information dans un ancien client et qu'une mise à jour commune peut alors être préférable. C'est une antériorité forte pour la compatibilité en cours d'évolution ; elle ne décide pas du sens souhaité par un propriétaire lorsque deux décisions métier se contredisent. [Cambria, source primaire](https://www.inkandswitch.com/cambria/).

La visite de Backstitch a renvoyé une page sans contenu exploitable dans l'outil de lecture ; aucune capacité de ce produit n'est retenue comme preuve. Aucun outil externe cité n'a été installé ou essayé.

## Le seul test qui pourrait faire réviser cette décision

Lors de la prochaine évolution réellement demandée au produit, conserver un témoin compétent : même code, même état, mêmes références approuvées, mêmes modifications humaines pendant le travail de l'agent. Autoriser explicitement l'agent ordinaire à sauvegarder la saisie active, migrer les données, proposer l'adoption et recharger. Lui demander de préserver le travail est une consigne normale, pas un avantage à réserver au candidat.

Avant cette évolution, consigner l'état effectivement conservé par le produit et ce que la personne peut continuer à faire. Observer ensuite l'adoption sur l'état courant : données et sorties déjà diffusées conservées, quantité de ressaisie ou de recopie, interruptions nécessaires, capacité de poursuivre immédiatement, conflit de sens éventuellement laissé à la personne. Si elle n'est pas disponible, vérifier seulement la mécanique et ne pas annoncer de bénéfice humain.

**Résultat qui justifierait de rouvrir la piste :** un besoin réel et répété de continuer le travail pendant des transformations où le témoin correctement conçu impose encore une interruption ou une reconstruction matérielle, tandis qu'une adoption explicite sur l'état courant les évite sans perte ni décision cachée. Le coût de préparation, d'instrumentation et de maintenance du mécanisme doit compter. Un simple échec d'autosave ou une mauvaise migration du témoin doit d'abord être corrigé ; il ne constitue pas une preuve de nécessité d'un runtime.

**Résultat qui clôt la piste :** le bon agent avec stockage local et rechargement permet la même continuité, avec une intervention aussi courte et sans perte. Dans ce cas, livrer l'amélioration métier et garder la pratique de préservation ; ne pas créer une couche de produit supplémentaire. L'essai ordinaire annoncé par le parent — annulation, aperçu et préservation livrés en 5 min 50, commit `491491a`, revue encore en cours au moment du message — rend cette issue crédible, sans démontrer à lui seul toute la continuité concurrente.

La décision pour aujourd'hui reste donc **aucun runtime supplémentaire**. Appliquer la correction visuelle réelle, laisser le propriétaire utiliser l'outil, et traiter sa prochaine évolution comme du travail utile. L'absence actuelle de preuve différenciante est une limite de notre argument produit, pas une preuve que l'outil n'a pas de valeur.
