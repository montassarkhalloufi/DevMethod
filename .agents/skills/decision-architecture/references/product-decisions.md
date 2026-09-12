# Décisions produit et exploitation

## Tester la valeur avant d'ajouter de la complexité
Identifier l'utilisateur, le travail qu'il cherche à accomplir, l'alternative actuelle, la friction et le signal de succès. Pour un produit IA/comparatif, demander ce que le produit apporte au-delà d'un prompt public : données autorisées/fraîches, calcul vérifiable, contexte durable, historique, simulation, monitoring ou exécution d'un workflow. Cette question n'impose pas toutes ces fonctions dans le MVP.

Conserver les exclusions, critères métier et contrats déjà validés. Ne pas transformer « autonome » en promesse « zéro opération humaine » : décrire les exceptions, alertes, reprises et temps opérateur attendu. Choisir une architecture que l'équipe actuelle peut exploiter.

## Coût total
Comparer au minimum :
- coûts fixes mensuels et seuils minimums;
- unités facturées : appels, tokens, images, jobs, stockage, transferts;
- amplification : retries, fallback, rafraîchissement, polling;
- CI et consommation des agents de développement;
- travail d'exploitation, sauvegarde/restauration et dépendance fournisseur.

Utiliser les tarifs vérifiés pour une décision économique concrète. Séparer hypothèses et mesures. Définir un budget et une action à son dépassement : limiter, différer, servir un résultat précédent autorisé ou échouer explicitement. Un cache n'est pas gratuit ni toujours partageable.

## Choix techniques
Conserver la stack acceptée tant qu'aucun problème démontré ne justifie un changement. Sur un nouveau projet, comparer une solution simple et les alternatives justifiées. Ne pas imposer NestJS, Next.js, Cloudflare, GCP, PostgreSQL, D1, un monorepo ou des microservices par héritage.

Un découpage en services se justifie par des contraintes d'isolation, de responsabilité ou de déploiement; pas par le nombre de substantifs métier. Formaliser un déclencheur observable de scaling, puis différer ce qui n'est pas nécessaire aujourd'hui.

## Sources de vérité par question
La documentation décrit l'intention; le ticket le périmètre; la référence visuelle l'apparence approuvée; le code et les tests le comportement livré. Résoudre les divergences explicitement. Une date récente seule ne transforme pas une proposition en décision canonique.
