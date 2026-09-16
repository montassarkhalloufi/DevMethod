# Séance collective — adéquation et critères indépendants

16 septembre 2026. Lecture seule du candidat et du scénario ; pas de changement du scénario, du dépôt ou de prototype ici. Aucun provider. Cette fiche prépare une revue d’instrument ; elle ne décrit ni une comparaison admise, ni l’observation d’une personne.

## Révélation et recevabilité

Le hash de docs/missions/product-alternatives/CANDIDATE.json correspond à `c1ea319fb16e9eec4f145aadcb82b1ab34e237859dbc477384369bccb2fba952` ; ses 12 fichiers correspondent à leurs pins au moment de la lecture. La réserve `/private/tmp/devmethod-radical-reserve-20260916/RESERVE.json` correspond à `fb47d9dedd82289e76dbc16a0c55409d531ac0c38d6cc6e1eb9fdf468e5d6106` et ses deux fichiers sont inchangés. Scénario complet : `/private/tmp/devmethod-radical-reserve-20260916/scenario.md`.

Le candidat et sa prédiction ont été gelés avant lecture du scénario par son auteur. Pour cette étude d’adéquation, toutes les phases sont maintenant révélées aux auteurs : ce n’est pas une séquence aveugle de découverte du changement par une personne. La réserve demandait un éditeur initial, sa sortie publiée, un delta utilisateur et leur contrôle ; ce support n’a pas été fourni ni contrôlé. Cela empêche d’admettre la comparaison de reprise envisagée. Construire maintenant deux outils peut montrer une capacité d’instrument ou des obstacles, mais le temps de construction n’est pas un effet de méthode mesuré sur le même produit préexistant.

Les deux conditions doivent recevoir le même scénario intégral, les mêmes données et les mêmes inconnues. Une préférence de l’agent qui essaie l’instrument reste un choix de cet agent, pas une décision de l’organisatrice.

## Adéquation du candidat gelé

Le candidat peut conserver un texte d’intention, des contraintes textuelles, plusieurs règles de permission/transition, des observations, un choix motivé et des historiques. Cela peut servir à discuter qui soumet ou valide une proposition de programme.

Il ne représente pas le cœur du nouveau besoin : ses records n’ont que id/title/state/owner (schema.mjs:72), ses actions sont create/transition (schema.mjs:91), son observation modifie un état individuel (domain.mjs:64), et son rendu est une liste ou un tableau par état (views.js:85). Les contraintes restent du texte (schema.mjs:50) ; reviseIntent signale un réexamen sans calculer une conséquence temporelle (domain.mjs:160).

Il manque donc des durées, un ordre modifiable, le calcul des débuts/fins, l’activité à heure fixe, les contraintes entre activités, une sortie de programme réellement utilisable et la comparaison entre publications. Mettre « 20 h 05 » dans un titre ou représenter les films par proposé/validé/publié ne satisfait pas ces besoins. L’export d’une session/raison n’est pas automatiquement une feuille exploitable par le public ou le bénévole.

Conclusion prospective : la généralité sans changement de code prévue pour les contextes exprimables par le moteur ne couvre pas ce cas. C’est une limite du langage du candidat, pas une erreur de schéma à contourner. Ajouter un éditeur temporel ou réaliser une transaction produit est une adaptation après révélation, à conserver séparément du candidat gelé et de sa prédiction. Le serveur local d’Atelier appartient à l’instrument ; il ne faut pas le confondre avec l’architecture acceptée du produit à réaliser.

## Faits communs et mandat

Six films exacts : F1 Fenêtres 12 min, F2 Les mains 18 min, F3 Traversée 23 min, F4 Le banc bleu 9 min, F5 À demain 16 min, F6 Le dernier bus 14 min. Les six sont souhaités mais pas imposés. F6 dernier film est une préférence souple. L’entracte reste de 10 minutes. La discussion est préférée à 15 minutes, peut être réduite à 10 sur décision humaine. Les films restent entiers, sans durée inventée.

Début 19:00, salle vide au plus tard 21:10, avec 5 minutes pour sortir après la dernière activité. Les destinataires comprennent heures/entracte/fin ; les bénévoles identifient les changements. Préparation sur ordinateur, consultation possible sur vieux téléphone, pas de connexion garantie. Pas de notification automatique, de coordonnées du public, de collaboration simultanée, de service distant ou de dépendance nouvelle requis.

Le produit doit préserver le style et le titre utilisateur préexistants, séparer domaine/rendu/persistance et fonctionner localement. Faute de support initial, ces éléments ne peuvent être évalués comme des préservations observées : les nouveaux choix doivent être étiquetés authored, non hérités.

Événement révélé : appel exactement de 20:05 à 20:20. Il peut remplacer la discussion, mais uniquement si cela est décidé explicitement. Une discussion séparée, un film retiré ou un changement d’ordre restent des choix. L’ancienne sortie déjà envoyée reste consultable telle quelle ; aucune nouvelle publication ne la remplace silencieusement. Un travail manuel explicite est admissible si le résultat reste praticable.

## Calculs indépendants

L’origine est 19:00, minute 0. La salle ferme à minute 130 ; les activités doivent finir à minute 125 au plus tard. Les films totalisent 92 minutes. Le début de l’appel est minute 65 et sa fin minute 80.

| Hypothèse de contenu | Activités | Sortie comprise | Marge avant 21:10 |
| --- | ---: | ---: | ---: |
| Six films + entracte10 + discussion15, avant changement | 117 | 122 | 8 |
| Six films + entracte10 + appel15 remplaçant la discussion | 117 | 122 | 8 |
| Six films + entracte10 + appel15 + discussion15 séparée | 132 | 137 | −7 |
| Six films + entracte10 + appel15 + discussion10 séparée | 127 | 132 | −2 |

Les deux dernières lignes sont impossibles même sans temps mort. Une permutation ne répare pas cette borne inférieure. Respecter seulement l’heure de fin ne suffit pas : l’appel peut encore démarrer à la mauvaise heure ou chevaucher un film.

Exemples de faisabilité, pas réponses obligatoires ou préférences utilisateur :

1. **Tout conserver, F6 dernier, appel remplaçant la discussion.** F1 19:00–19:12 ; F2 19:12–19:30 ; F4 19:30–19:39 ; F5 19:39–19:55 ; entracte 19:55–20:05 ; appel 20:05–20:20 ; F3 20:20–20:43 ; F6 20:43–20:57 ; sortie jusqu’à21:02. 8 minutes de marge.
2. **Discussion15 séparée, F6 dernier, retrait de F5 accepté.** F2 19:00–19:18 ; F3 19:18–19:41 ; F4 19:41–19:50 ; discussion 19:50–20:05 ; appel 20:05–20:20 ; F1 20:20–20:32 ; entracte 20:32–20:42 ; F6 20:42–20:56 ; sortie jusqu’à21:01. 9 minutes de marge. Le retrait reste une décision humaine.
3. **Discussion15 séparée, F6 dernier, retrait de F4 et battement explicite.** F1 19:00–19:12 ; F2 19:12–19:30 ; F3 19:30–19:53 ; entracte 19:53–20:03 ; battement annoncé de2 minutes ; appel 20:05–20:20 ; F5 20:20–20:36 ; F6 20:36–20:50 ; discussion 20:50–21:05 ; sortie jusqu’à21:10. Aucune marge. Les 2 minutes ne doivent ni disparaître du programme ni modifier une durée de film ; l’organisatrice peut refuser ce compromis.

Ces trois séquences ont été recalculées localement par somme des durées et assertion du créneau de l’appel. Cela ne vaut ni exécution du futur produit, ni essai utilisateur. D’autres programmes sont admissibles.

## Critères de revue de la prochaine sortie

- **Résultat utilisable.** L’utilisateur peut réellement constituer/ordonner un programme, voir les horaires calculés et en obtenir une sortie pour les deux publics. Distinguer une page effectivement consultable d’une simple capture ou d’un JSON interne.
- **Vérité temporelle.** Durées exactes, pas de doublon de film non annoncé, début cohérent, intervalles sans chevauchement, entracte10, appel65–80, dernière activité≤125, sortie5 réellement comptée. Un intervalle vide est visible ou explicitement expliqué ; il ne masque pas un dépassement. L’affichage correspond à la donnée exportée.
- **Choix réel.** Une proposition retenue modifie le programme réellement utilisé. Le remplacement de discussion, une suppression de film, une réduction ou la renonciation à F6 dernier sont explicitement distingués. Une prévisualisation authored reste proposée tant que l’utilisateur n’a pas choisi.
- **Versions.** Avant/après consultables, ancienne sortie inchangée, version active identifiable, différences concrètes pour l’accueil : ordre, heures, retraits/ajouts, discussion et appel. L’historique des raisons seul ne suffit pas. Recharger ne perd ni le choix actif ni la sortie antérieure.
- **Actions au lieu d’un récit.** Les contrôles de sélection, export, rechargement et éventuel retour arrière sont utilisables et agissent sur de vraies données. Une fonction qui met simplement un label « choisi » n’établit pas cette propriété.
- **Architecture et exclusions.** Domaine pur séparé du rendu/stockage, pas de dépendance/service/authentification ajoutés pour sauver le scénario. Une concession doit être nommée et motivée. L’absence de l’original interdit les affirmations de style/delta « préservés ».
- **Compte rendu juste.** Montrer ce qui fonctionne, ce qui n’est pas couvert, les décisions encore humaines et les interventions réalisées. Aucun score de préférence, gain de temps humain, économie de tokens ou avantage causal sans observation correspondante.

Les contrôles observables pourront combiner inspection source, calcul indépendant, interaction réelle et redémarrage. Ne pas relancer des suites globales pour cette revue. Toute conclusion restera attachée aux bytes inspectés et au niveau d’observation réellement atteint.

## Revue de la transaction après réalisation

Source inspectée : `/private/tmp/devmethod-seance-transaction`. Les pins exacts et les résultats bruts sont dans `/private/tmp/devmethod-seance-independent-review-results-20260916.json`. Cette réalisation et ses exemples ont été construits après révélation. Leurs v1/v2 ne sont pas les publications héritées d’un produit préexistant. Les exemples HTML portent bien la mention « Exemple généré pour contrôle technique » ; l’interface indique données fictives. Aucun comportement humain ni préférence utilisateur n’a été observé ici.

Cinq contrôles locaux indépendants passent : arithmétique exacte des deux propositions et dernier film ; absence de décision lors de la simple génération des propositions ; intégrité de la publication v1 et de son HTML après choix/v2/rechargement JSON ; impossibilité de garder six films avec discussion séparée et appel ; rejet de plusieurs violations de structure métier (doublon, entracte manquant, appel tardif, deux discussions). L’option qui garde la discussion termine à21:05 et laisse la salle vide à21:10, marge0 ; l’attente de2 minutes est réellement affichée. Les annonces calculées incluent retrait du film, appel, attente et nouvelle heure de sortie.

La sélection d’une proposition est déclenchée par un bouton explicite ; prendre en compte le changement exige ensuite un ajustement et ne choisit pas l’une des propositions. Un programme manuel peut être construit. La publication crée un snapshot distinct et les HTML sont autonomes sans script/ressource distante dans le rendu inspecté. Les snapshots et le brouillon ont un stockage séparé de la logique/rendu. Le backup JSON ne peut pas être réimporté, limite annoncée dans l’interface. Cette revue n’a pas rejoué le navigateur ; l’assertion de QA Chrome appartient à son auteur.

Défaut reproductible à corriger : `validateDocument` appelle `schedule(value.draft)` sans rejeter les identifiants inconnus signalés dans le résultat. Un brouillon local dont `order[0]` vaut `unknown-film` est accepté, puis `app.js` accède à `D.catalog[id].title` et lève une exception. Cela contredit le chemin annoncé « stockage illisible… le prototype s’arrête ». La correction doit valider forme/identifiants du brouillon sans rejeter les conflits horaires légitimes d’un travail en cours (par exemple nouvel appel requis pas encore intégré). Ne pas transformer toute erreur métier de `schedule` en corruption locale.

Ce défaut ne remet pas en cause les deux calculs ou l’intégrité v1/v2 des parcours contrôlés. Les autres conclusions restent limitées aux bytes épinglés. Le passage d’une conception par règles d’état à cette transaction temporelle est concret, mais constitue une adaptation connue ; ce n’est pas la généralisation du candidat gelé ni la preuve d’un avantage sur l’agent simple.

### Vérification de la correction

Le propriétaire a ajouté le rejet de l’ordre local structurellement invalide. Une vérification indépendante ciblée sous Node24.18.0 confirme : identifiant inconnu refusé ; brouillon structurellement valide mais horairement conflictuel encore rechargeable ; publication v1 et son HTML inchangés après v2/rechargement ; seconde option avec salle vide à21:10. Résultat et nouveaux pins : `/private/tmp/devmethod-seance-independent-review-correction-20260916.json`. Le constat initial est conservé ci-dessus et dans sa trace ; ce défaut est maintenant clos aux bytes réinspectés. Aucun autre défaut bloquant n’a été constaté dans cette revue ciblée ; ce n’est pas une certification de tous les parcours UI.
