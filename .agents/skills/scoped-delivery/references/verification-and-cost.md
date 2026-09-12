# Vérification et coût

## Vérifier au niveau du risque
- Documentation seule : exactitude, diff et liens; pas de build applicatif ou CI distante sans besoin.
- Logique pure : invariants, bornes et erreurs au test unitaire.
- Accès données : contrainte, transaction et concurrence au niveau intégration.
- Contrat externe : schéma, mapping, erreur, version et idempotence.
- UI : comportement accessible, rendu réel et référence approuvée.
- Frontière framework/SSR/auth : intégration/navigateur, pas seulement mocks.
- Paiement/droits/quota : sources serveur, doublons, accès croisé et atomicité.
- Migration/release : compatibilité, restauration ou forward-fix et vérification après changement.

Utiliser les gates du projet même s'ils sont plus stricts. Ne pas inventer une commande indisponible; rapporter la commande réellement exécutée et son issue. Une vérification non exécutée reste telle quelle.

## Revue bornée
Relier chaque constat à un emplacement, une conséquence observable, un scénario et une correction. Distinguer bug, risque démontré et préférence. Ne pas demander plusieurs avis identiques pour créer une apparence de certitude. Si une revue indépendante est nécessaire mais impossible, le signaler au lieu de la simuler.

Évaluer diff complet, frontières, comportement, sécurité et tests au commit annoncé. Réexaminer les zones touchées après corrections, et l'ensemble seulement si l'impact le justifie.

## Coût opérationnel
Travailler localement avant de pousser quand l'environnement le permet. Lire les logs d'un échec avant de relancer. Les agents cloud et CI distante consomment des ressources, même avec un worktree.

Conserver les politiques plus strictes déjà acceptées du projet, notamment les budgets CI et la revue d'un commit figé. Les plafonds précis restent dans le profil local; ne pas imposer une CI manuelle ou sa désactivation aux autres projets.

Ne pas lancer matrices, builds de containers, Terraform ou tests stateful lourds pour une retouche sans impact. Ne jamais supprimer un gate requis afin de faire baisser le coût. Respecter les autorisations pour les appels payants et les limites de consommation visibles.
