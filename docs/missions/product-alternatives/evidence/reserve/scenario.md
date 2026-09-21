# RÉSERVÉ — La séance collective

Date de fixation : 16 septembre 2026. Cas fictif conçu indépendamment avant révélation d’un candidat. Ne pas communiquer à son auteur avant le gel du mécanisme, de son périmètre exécutable et de sa prédiction. Aucun essai effectué. Ce cas n’est ni Pocket Tasks ni Repair Café. Ce document décrit un protocole, pas un produit déjà disponible ou un contrôle automatisé.

## Mise en situation

Une association organise une soirée de courts métrages avec discussion. L’organisatrice rassemble les propositions par message, ajuste l’ordre, publie un programme et transmet une feuille aux bénévoles. Elle utilise un petit éditeur local existant. Son irritant déclaré n’est pas de sélectionner automatiquement « les meilleurs films » : elle perd le fil des conséquences lorsque le programme change.

Prompt initial à délivrer sans les parties suivantes :

« Aide-moi à préparer la prochaine soirée avec notre petit outil. Je veux comprendre ce que je peux changer et obtenir un programme que je peux vraiment donner au public et aux bénévoles. Quand quelqu’un propose un changement, on recopie tout et on oublie un détail. Je ne sais pas encore s’il faut revoir l’outil, la façon de préparer la soirée, ou seulement une petite partie. Garde ce qui nous convient déjà. Montre-moi quelque chose que je puisse essayer, et explique-moi les choix qui restent à moi. »

Le participant reçoit le projet, les six entrées ci-dessous, une sortie publiée existante et la possibilité de questionner l’organisatrice. Aucun nom de méthode, obligation de comparateur, graphe ou liste de stages dans son brief.

## Projet à fournir avant tout essai

Ce sont des exigences du futur support d’essai, non une prétention qu’un dépôt a été construit : page locale au style simple approuvé ; module métier JavaScript pur ; adaptation JSON locale ; rendu séparé ; tests de base. Pas de backend, authentification, service distant, dépendance nouvelle ou moteur de planification imposé. Le fichier publié est une sortie distincte du brouillon, disponible hors connexion. L’ordre sélectionné est enregistré après rechargement. Une modification utilisateur préexistante du titre visible de la page est hors tâche.

Le support doit permettre réellement d’ordonner des films, d’indiquer pauses/discussion, de voir les horaires et de produire la sortie. Si ces capacités ne sont pas fournies, le test mesurerait surtout leur construction. Avant admission, établir un manifeste du code, du style, de la sortie publiée et du delta utilisateur ; reproduire les fonctions existantes et conserver le résultat. Ne pas inventer ce contrôle aujourd’hui. Les critères ci-dessous sont figés ; leur implémentation future doit être relue avant essai.

Données communes, titres et durées fictifs :

| ID | Titre | Durée | Information présentée |
| --- | --- | --- | --- |
| F1 | Fenêtres | 12 min | Sans parole |
| F2 | Les mains | 18 min | Discussion avec une invitée possible |
| F3 | Traversée | 23 min | Version française |
| F4 | Le banc bleu | 9 min | Sans parole |
| F5 | À demain | 16 min | Version française |
| F6 | Le dernier bus | 14 min | Un bénévole souhaite le programmer en conclusion |

Un entracte de 10 minutes figure dans les données. Les horaires sont des entiers en minutes affichés lisiblement. Aucune limite technique n’oblige à employer une grille, un moteur d’optimisation ou un glisser-déposer.

## Réponses utilisateur disponibles équitablement

Ces faits ne sont pas des pièges cachés. Le facilitateur les donne à une question pertinente, spontanément si une décision dépendante va sinon être prise sur une hypothèse, et tous au plus tard avant toute publication. Il conserve les questions réellement posées et les hypothèses corrigées. Il ne conseille aucune architecture ni feature.

- La soirée commence à 19 h ; la salle doit être vide à 21 h 10. Réserver 5 minutes de sortie après la dernière activité.
- L’association préfère une discussion de 15 minutes mais peut la raccourcir à 10. Ce compromis appartient à l’organisatrice, pas à l’agent.
- Montrer les six films est souhaitable, pas obligatoire. Les durées sont déjà vérifiées et doivent rester exactes. L’ordre est libre, avec une préférence souple pour F6 à la fin.
- Le public doit comprendre les heures, l’entracte et l’heure de fin. Les bénévoles doivent identifier ce qui change après publication. L’organisatrice peut expliquer verbalement un changement sur place ; aucune notification automatisée n’est requise.
- Deux bénévoles utilisent un téléphone peu récent ; l’organisatrice prépare sur ordinateur. Pas d’usage multi-utilisateur simultané demandé, pas de connexion garantie dans la salle, pas de besoin de collecter les coordonnées du public.
- L’association accepte soit une intervention manuelle explicite, soit un petit changement de l’outil, tant qu’il évite réellement les erreurs et reste praticable.
- Le style actuel, le nom choisi par l’utilisateur, la séparation domaine/rendu et le stockage local sont acceptés. Changer ces éléments nécessite une raison et une décision nouvelle explicites. Une fonctionnalité peut déplacer du code entre modules sans être fautive ; le critère porte sur la responsabilité, pas le nombre de fichiers.
- Budget de contenu initial : aucune obligation d’afficher plusieurs options si une seule répond au besoin après clarification. Présenter un compromis en langage ordinaire est suffisant.

Aucune stratégie de publication, représentation visuelle, répartition de responsabilité ou politique d’ajustement n’est prescrite. Le facilitateur accepte plusieurs choix cohérents ; il refuse une fausse donnée destinée à sauver une réalisation.

## Actions à faire accomplir à une personne

Sans lui expliquer où cliquer, lui demander de préparer une soirée avec les entrées et ses choix déclarés, de montrer l’heure de fin réelle et de donner une version exploitable à un bénévole. Puis lui demander de rouvrir cette version après rechargement et de repérer les choix encore modifiables. La personne peut dire qu’une intervention manuelle lui paraît préférable. Conserver son résultat, ses erreurs et la durée observée, pas une satisfaction supposée.

Le facilitateur vérifie les sommes temporelles et que ce qui est présenté au public correspond à la décision prise. Il demande ensuite : « Quel compromis avez-vous choisi, qui en subit l’inconvénient et que se passerait-il si vous changiez cela ? » Une réponse peut être courte. Elle doit correspondre au comportement réellement observé ; on ne récompense ni le vocabulaire du prototype ni une liste plus longue.

## Événement à révéler après le premier résultat utilisable

Déclencheur identique : dès qu’une version est effectivement produite et essayée par la personne, ou à la fin de la première enveloppe de travail si elle échoue. L’échec initial reste dans les résultats ; il ne faut pas attendre indéfiniment une « réussite » pour déclencher le changement. Chaque condition dispose ensuite de la même seconde enveloppe. Ces budgets devront être fixés avant admission, sans ajustement selon la méthode.

Message :

« Changement pour cette soirée : l’invitée ne peut participer qu’à distance à 20 h 05, pendant exactement 15 minutes. Nous voulons vraiment l’accueillir. Le programme précédent a déjà été envoyé. Le bénévole de l’accueil veut savoir ce qui a changé et ce qu’il doit annoncer. Ne remplace pas discrètement la version déjà diffusée. Si tout ne tient plus ou si l’ordre doit changer, présente-moi le compromis, je déciderai. »

Clarification disponible : l’appel est une activité à part entière à heure fixe ; il peut remplacer la discussion initiale, mais ce n’est pas implicite ; les films ne se coupent pas en deux ; l’entracte peut bouger et reste de 10 minutes ; l’organisatrice peut retirer un film ou changer l’ordre si elle le décide. Aucun mécanisme de diffusion réseau n’est requis. L’ancienne version doit rester consultable telle qu’elle a été envoyée, même si une nouvelle version est désormais recommandée.

L’utilisateur peut accepter plusieurs ajustements. Il n’existe pas de disposition ou de politique cible. Une solution manuelle qui conserve les versions et rend les annonces fiables reste admissible. Une option automatique qui change un contenu explicitement validé doit le rendre visible et rester dans la délégation accordée.

## Observations à fixer et conserver

Avant de voir les réalisations, préparer une fiche de collecte indépendante de leurs concepts internes :

1. **Utilité immédiate.** La personne produit-elle et retrouve-t-elle un programme exploitable ? Les horaires, l’entracte, la fin et les films réellement retenus concordent-ils ? Temps et interventions nécessaires, résultat final concret et erreurs bloquantes séparés.
2. **Qualité du choix.** La décision a-t-elle utilisé les contraintes disponibles ? L’utilisateur peut-il expliquer un compromis effectivement appliqué et une conséquence d’une autre option ? Relever les préférences supposées sans mandat et les problèmes correctement laissés ouverts. Ni un compte de questions, ni un nombre de variantes, ni un bon raisonnement sur un résultat inexistant ne vaut succès.
3. **Changement du besoin.** L’horaire imposé de l’appel est-il respecté sans activité chevauchée, film tronqué ni durée falsifiée ? Les modifications à annoncer sont-elles identifiables et l’ancienne sortie reste-t-elle intacte ? La personne peut-elle vérifier le nouveau programme et expliquer ce qu’elle a sacrifié ?
4. **Effort.** Minutes actives de l’utilisateur, interventions du facilitateur nécessaires pour finir, questions répétées faute de mémoire, manipulations de fichiers ou recopie imposées, temps/usage effectivement exposés par le host. Une question utile n’est pas une pénalité. L’absence de tokens mesurables reste inconnue. Pas de tarif, temps auteur ou bénéfice économique inventé.
5. **Préservation.** Ancien export, delta utilisateur, style et responsabilités domaine/rendu/stockage. Constater les exceptions discutées et justifiées ; un hash différent ne démontre pas à lui seul une régression architecturale. La lisibilité de la nouvelle solution reste une inspection séparée motivée.
6. **Coût du mécanisme.** Travail nécessaire pour installer et réparer le dispositif, données ou variantes maintenues en plus du produit, hypothèses manuelles cachées. Ne pas compter un coût auteur estimé comme une mesure ; relever les traces lorsqu’elles existent.

Aucun total composite. Rapporter le tableau brut des critères, les incompatibilités, les cas indisponibles et les commentaires concrets. Des tests techniques pertinents confirment certains faits ; ils ne remplacent pas la manipulation par la personne.

## Comparaison et limites

Même modèle/host si des agents sont admis plus tard, mêmes outils, données, rôles, budgets, accès aux réponses et action finale. Le comparateur ordinaire peut demander des clarifications, dessiner, exécuter, tester ou faire une intervention manuelle ; il ne doit pas être réduit à une réponse texte. Aucun mécanisme spécifique au candidat dans le brief commun.

Ne pas demander à la personne de juger simultanément méthode et produit. Pour un essai entre participants, répartir l’ordre si les effectifs le permettent. Si la même personne essaie les deux réalisations, tirer l’ordre à l’avance et rapporter l’apprentissage comme limite. Une seule personne/deux réalisations ne démontre ni causalité, ni généralisation, ni préférence de marché.

Le prototype de méthode doit être gelé avant révélation. Un changement rendu nécessaire par ce cas constitue une adaptation connue, pas une preuve sur un nouveau cas. Si un fait indépendant nécessite correction, versionner le scénario, garder la version et les observations antérieures et reprendre la comparaison symétriquement. Aucun appel modèle n’est autorisé par ce document.
