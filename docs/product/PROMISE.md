# Promesse produit

## En une phrase

DevMethod aide une personne et un agent de code à transformer un besoin en changement vérifiable,
en conservant les décisions, les responsabilités, les preuves et la prochaine action utile.

## Le problème traité

Un agent peut produire rapidement du code, mais la vitesse ne répond pas à plusieurs questions :

- le besoin a-t-il été compris ?
- qui a autorisé les choix importants ?
- quelles preuves correspondent à quelle version ?
- que faut-il revérifier après un changement ?
- quand l'agent peut-il continuer et quand doit-il s'arrêter ?
- comment reprendre après une interruption sans reconstruire tout le contexte ?

DevMethod structure ces questions autour d'une **mission**, d'un périmètre explicite, de décisions
traçables et de vérifications liées à la révision inspectée.

## La promesse opérationnelle

La méthode vise à rendre un changement :

- **orienté résultat** : une mission représente un résultat utilisateur observable ;
- **borné** : portée, exclusions, dépendances et conditions d'arrêt sont explicites ;
- **décidé** : les compromis structurants sont discutés ou délégués avant les détails dépendants ;
- **vérifiable** : les affirmations importantes renvoient à des contrôles exécutés et à leurs limites ;
- **reprenable** : un checkpoint identifie sources, révision, état, preuves et prochaine action ;
- **intégrable** : implémentation, vérification, review, fusion et publication restent des états distincts.

## Le rôle de l'humain et de l'agent

L'humain définit la direction, les contraintes et les permissions. Il arbitre les décisions dont les
conséquences dépassent la délégation accordée. L'agent inspecte, propose, implémente et vérifie le
périmètre autorisé. Les preuves éclairent la décision mais ne déplacent pas la responsabilité.

Les modes **Guidé**, **DevAuto** et **Autonome** expriment une demande de délégation. Ils n'annulent
jamais les permissions, les responsabilités enregistrées ou les arrêts de sécurité.

## Ce qui différencie les composants

- La **méthode** définit le raisonnement et les gates de travail.
- Les **skills** rendent les étapes visibles dans l'agent.
- Le **CLI** installe et inspecte des artefacts locaux déterministes.
- Le **Studio** rend le parcours, le code, les décisions et les preuves manipulables dans une UI.
- Le **Control Plane** calcule une autonomie effective depuis le risque et les preuves observées.

## Promesses volontairement absentes

DevMethod ne prétend pas :

- garantir la correction d'un logiciel ;
- comprendre toutes les dépendances dynamiques ;
- remplacer un audit sécurité, métier ou production ;
- déployer, publier ou acheter un service sans autorisation ;
- être démontré supérieur à BMAD, Spec Kit ou d'autres approches ;
- transformer un mode « Autonome » en permission générale ;
- apprendre silencieusement une nouvelle politique depuis les décisions humaines.

La valeur recherchée est une collaboration plus explicable et vérifiable, pas une autonomie sans
limites.
