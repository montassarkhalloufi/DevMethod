# ADR-018 — Analyse du projet et espace technique du Studio

Date : 2026-09-17. Statut : retenu dans la délégation technique de la mission.

## Besoin et périmètre

Le Studio doit présenter le code frontend, backend, partagé et infrastructure du projet, son architecture, les parcours identifiables, l’impact des changements et des vérifications rattachées aux versions. Les trois références utilisateur du 17 septembre sont le contrat visuel. Le serveur qui héberge le Studio n’est jamais présenté comme le backend métier d’un projet.

## Choix

Conserver le contrôleur existant d’édition, ses brouillons persistants, Monaco, la compilation contrôlée et les règles d’application des versions. Ajouter des composants React 19 stricts, chargés à la demande, et un modèle partagé typé. L’éditeur reste la seule source de vérité des modifications en cours ; l’analyse peut consulter son brouillon enregistré sans le créer ou l’appliquer.

L’analyse déterministe utilise TypeScript déjà installé pour les sources JS/TS/JSX/TSX, les imports, les appels et routes reconnaissables, ainsi que des extracteurs bornés de configuration. Chaque relation conserve ses sources et sa méthode. Une lecture vérifie le manifeste immuable ; une empreinte différencie le brouillon de sa base. Le modèle ne prétend ni analyser tous les langages ni reconstituer les appels dynamiques. Les réponses tardives d’une autre version sont rejetées côté vue.

Le graphe utilise SVG et React, sans nouvelle dépendance de graphe ni service distant. Les positions sont stables par identité, les filtres limitent la densité et une liste reste utilisable au clavier. Flux et impact distinguent dépendance constatée, inférence, observation et inconnue. Une arête n’est jamais une preuve d’exécution.

Les vérifications réutilisent les preuves existantes et des adaptateurs locaux bornés. Un catalogue peut proposer une procédure externe ou signaler un outil absent. Il n’exécute pas arbitrairement les scripts fournis par un projet. Chaque résultat reste associé à son instantané, son outil, son périmètre et son environnement ; la fraîcheur ne remplace pas le statut.

## Alternatives examinées

- Réécrire l’éditeur et le Studio : rejeté, car cela invaliderait des mécanismes de sauvegarde, comparaison et délégation déjà éprouvés.
- Utiliser une plateforme distante d’analyse ou lancer les outils du projet sans isolation : rejeté dans cette mission locale, sans nouveau fournisseur ni contrat d’exécution de code arbitraire.
- Générer un graphe explicatif par IA : inadapté comme base factuelle. Une inférence future devra rester identifiée et distincte des extractions et observations.

## Garanties et limites

La présentation ne change ni la délégation, ni les données métier, ni la version appliquée. Modifier le code produit un brouillon compilé ; l’adoption reste soumise aux gardes existants. Une conception déclarée n’est pas automatiquement conforme à l’implémentation. Sans instrumentation réelle, les parcours sont déduits du code et aucune durée de production ou santé de service n’est inventée.

Les validations, captures navigateur et limites constatées sont consignées dans le checkpoint de la mission après exécution ; ce document n’est pas une preuve de tests réussis.
