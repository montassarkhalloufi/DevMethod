# La séance collective — prototype autonome

Construction du 16 septembre 2026, après révélation complète du scénario fictif. Le support initial annoncé par le scénario n'existait pas : **ce travail ne démontre ni une maintenance préservée, ni un benchmark aveugle, ni la supériorité de DevMethod**. Aucun moteur Atelier, appel de modèle CLI, service distant ou dépendance n'est utilisé.

## Essayer

Ouvrir `index.html` dans un navigateur. Tous les scripts et styles sont locaux. Pour un stockage local avec une origine stable, servir ce dossier avec `python3 -m http.server 9087 --bind 127.0.0.1`, puis ouvrir `http://127.0.0.1:9087`. Ce serveur ne fournit que des fichiers ; il ne reçoit ni ne stocke les données métier. Une ouverture `file://` dépend des règles de stockage du navigateur : le message de sauvegarde indique les erreurs.

1. Modifier le titre et ordonner les activités avec les flèches ; retirer ou réajouter des films si souhaité. Discussion 15 ou 10 minutes, au choix. Les durées des films et de l'entracte sont fixes.
2. Vérifier les horaires réels et publier une première version. Au départ, aucune publication historique n'est fabriquée.
3. Activer l'appel à 20:05. Le brouillon reste inchangé et ne peut plus être publié tant que l'appel manque. Comparer les deux propositions, ou faire son propre arrangement.
4. Choisir explicitement un compromis pour le brouillon, relire les différences, publier une nouvelle version. Chaque version antérieure reste sélectionnable en lecture seule.
5. Exporter la version choisie en HTML : un fichier autonome contenant le programme et les annonces pour les bénévoles. Le transmettre est une action manuelle, extérieure au prototype. La sauvegarde JSON conserve également brouillon et publications ; sa réimportation n'est pas implémentée.

## Équations et arbitrages

Les heures sont des entiers en minutes depuis minuit. Début = 1140 (19:00), appel = 1205–1220 (20:05–20:20), salle vide au plus tard à 1270 (21:10). Pour chaque activité : `fin = début + durée` ; l'activité suivante commence à cette fin. Avant l'appel, une arrivée anticipée crée une attente explicite. Une arrivée tardive est affichée comme un conflit : aucun film n'est tronqué et aucun chevauchement n'est caché. `salleVide = finDernièreActivité + 5` ; publication admise seulement si `salleVide <= 1270` et toutes les autres contraintes sont respectées.

Films : `12 + 18 + 23 + 9 + 16 + 14 = 92 min`. Initial : `92 + 10 + 15 = 117 min`, fin20:57, salle vide21:02. Garder tous les films, l'appel et une discussion distincte de15 exige `92 + 10 + 15 + 15 + 5 = 137 min`, soit7min de trop, avant toute attente. Discussion10 :132min, soit2min de trop.

| Proposition | Avant l'appel | Après l'appel | Conséquence |
| --- | --- | --- | --- |
| Six films, discussion remplacée | F1,F2,F4,F5 =55min, entracte10 ; appel20:05 | F3 puis F6 =37min | Fin20:57, sortie21:02, marge8. La discussion libre est supprimée explicitement. |
| Discussion15 distincte conservée | F1,F2,F3 =53min, entracte10, attente2 ; appel20:05 | F5,discussion15,F6 =45min | F4 retiré ; fin21:05, sortie21:10, marge0. |

Les deux propositions sont écrites pour ces données connues ; elles ne constituent pas un optimiseur ni une preuve que ces choix sont les seuls possibles. Le retrait d'un film ou le remplacement d'une discussion n'est jamais appliqué automatiquement. Le dernier bus reste le dernier film dans les deux options. Le brouillon initial constitue seulement un point de départ modifiable.

## Responsabilités

- `code/domain.js` : catalogue fixe, calcul pur, conflits, propositions, différences, création de snapshots de publication. Aucun DOM, stockage ou accès réseau.
- `code/storage.js` : JSON en localStorage sous la clé isolée `devmethod-seance-transaction-v1`. Une corruption de lecture bloque l'ouverture sans écraser la valeur existante. Un échec d'écriture laisse une session en mémoire avec avertissement.
- `code/render.js` : tableau et export HTML autonome ; chaînes échappées.
- `code/app.js` : événements et rendu UI ; publication append-only par copie. `index.html` / `style.css` : structure et style sobres, grille passant en colonne sur petit écran.

« Immuable » signifie que l'interface et les opérations du domaine ne modifient jamais une publication créée. Ce n'est pas une protection contre l'édition manuelle du JSON, l'effacement du stockage du navigateur ou plusieurs onglets concurrents. Les exports HTML séparés restent la copie transmissible. Pas de synchronisation, authentification, migration de format ou historique d'annulation du brouillon.

## Contrôles et limites de preuve

`node --test code/test.cjs` : dix contrôles ciblés sur les sommes, les deux horaires, dépassement de2min, appel tardif, absence de choix implicite, publication/HTML historique inchangés, échappement, stockage/relecture et durées fixes. Runtime observé : Node24.18.0. Les fichiers `evidence/example-v*.html` sont des exemples **générés par les tests**, pas des programmes réellement envoyés. `evidence/calculated-options.json` permet une relecture indépendante.

Parcours Chrome réel effectué par l'agent sur données fictives : création v1 ; activation appel avec publication bloquée ; choix de démonstration « discussion conservée » ; publication v2 ; rechargement conservant le brouillon, les deux versions, l'appel20:05–20:20 et la sortie21:10. L'ancienne version affichait toujours sortie21:02 avant création v2. Le téléchargement via l'UI et la manipulation sur un vieux téléphone ne sont pas établis par ce parcours ; l'autonomie de l'HTML généré est vérifiée par les tests. Aucun participant humain n'a encore validé l'utilité ni choisi un compromis réel.

Limites fonctionnelles : catalogue et horaires de la soirée fixés dans le domaine ; pas d'édition des fiches films ; pas de temps de projection imprévu, technique d'appel ou retard en direct ; pas de restauration JSON par UI ; pas de gestion de plusieurs soirées. Les deux minutes d'attente sont un résultat visible de l'ancrage de l'appel, pas une durée de film falsifiée. Les choix modifiés manuellement remplacent la note de compromis par une note de vérification manuelle.

## Auteur et coût observé

Code, propositions et rédaction : agent `native_admission`, sur délégation du parent. Faits fictifs et contraintes : scénario indépendant `/private/tmp/devmethod-radical-reserve-20260916/scenario.md`, entièrement révélé avant construction. Une relecture indépendante des horaires est demandée par le parent ; elle n'est pas simulée ici.

Début observé par horloge : 2026-09-16 09:17:44 UTC ; enveloppe maximale autorisée15min. L'heure de fin et le manifeste de fichiers figurent dans `evidence/build.json`. Ce sont des bornes de temps écoulé, pas une mesure séparée du temps actif humain. Aucun token, prix ou gain économique n'est déduit de cette durée.
