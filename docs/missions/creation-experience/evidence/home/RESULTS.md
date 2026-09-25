# Accueil Studio — vérification du 17 septembre 2026

Portée : accueil local « Créer / Importer / Reprendre », registre persistant, ouverture
des projets et retour préservant le brouillon. Base de développement : `708afdb` ;
code et dist de la tranche dans le commit contenant ce relevé. Décision :
[ADR 023](../../../../ADR-023-studio-home.md).

## Résultat observable

`devmethod studio` ouvre désormais la bibliothèque locale. Les trois parcours partagent
un formulaire en fenêtre dédiée. Les projets récents sont enregistrés sur disque et
recherchables ; un dossier Studio extérieur peut être ajouté. Le lancement direct
`studio --workspace /projet` reste disponible. Un projet ouvert par l’accueil présente
un lien « Mes projets » qui enregistre le brouillon avant de quitter.

Ce résultat ne met pas Studio en ligne : le serveur reste sur `127.0.0.1`, sans compte
multiutilisateur, partage de secrets ni hébergement public. L’URL publique demandée
nécessite encore un chantier d’accès et d’hébergement ; cet écran local en fournit le
parcours d’entrée, pas le déploiement.

## Recette dans Chrome

Bibliothèque de recette isolée, dossiers sous `/private/tmp`, trois cas fictifs :

| Critère | Manipulation et constat |
| --- | --- |
| HOME-1 Nouveau | Créer « Carnet des ateliers », idée conservée dans Conception ; état sur disque : zéro job et zéro révision. Aucune génération automatique |
| HOME-2 Import | Importer trois fichiers avec nom personnalisé « Courrier des ateliers » ; bon nom dans le Studio, référence importée, documentation/manifeste/dépendance/commande détectés et inconnues explicites ; zéro job, une baseline |
| HOME-3 Source préservée | Comparaison des octets source et copie de README, package.json et src/mail.js : identiques. Le dossier source contient toujours ces trois fichiers ; aucune dépendance installée |
| HOME-4 Reprendre | Ajouter la copie d’exemple « Les Ateliers » ; aperçu, huit demandes et six révisions existantes retrouvés, sans réinitialisation |
| HOME-5 Navigation | Saisir une demande puis cliquer immédiatement Mes projets ; réouverture : texte identique, sans devoir attendre le debounce |
| HOME-6 Recherche/erreur | Recherche sans résultat puis filtre « atelier » retrouve les trois entrées ; dossier inexistant : erreur actionnable, chemin saisi conservé et aucun ajout au registre |
| HOME-7 Persistance | Arrêt SIGTERM du seul lanceur de recette, sortie 0, puis relance sur la même bibliothèque et même port : trois entrées retrouvées ; ouvrir le nouveau projet restitue la demande exacte |
| HOME-8 Responsive | Bureau : largeur DOM et scroll 1562 px ; mobile : 390 px. Après correction, aucune largeur supplémentaire. Dialogue mobile dans le viewport, champs et actions visibles |

Captures finales : [ordinateur](desktop.png), [mobile](mobile.png).
La simulation de viewport ne constitue pas un essai sur téléphone physique ou lecteur
d’écran. Les interactions de clavier/focus et annulation du dialogue sont couvertes
par les tests UI ; la recette navigateur ci-dessus ne prétend pas les couvrir toutes.

## Vérifications automatisées et revue

- `npm test` : build inclus et **843 tests réussis, zéro échec, zéro ignoré** ; relance
  avec permission localhost après un premier échec de sandbox `listen EPERM`.
- Après extraction du lancement de workspace pour la complexité CLI : **9 tests CLI
  ciblés réussis**. Les autres sources JavaScript n’ont pas changé après la suite complète.
- Lint, formatage, liens de documentation, diff et paquet contrôlés ; commandes et
  périmètres précis dans [validation.json](validation.json).
- Le dernier correctif concerne uniquement les colonnes CSS. Il est vérifié par
  compilation CSS, formatage et nouvelle observation du navigateur, sans prétendre
  avoir relancé les 843 tests après ce changement de layout.

Défauts corrigés pendant la revue : nom personnalisé de l’import appliqué au workspace
copié ; retour à l’accueil attendant la sauvegarde et retenant la saisie sur erreur ;
libération du verrou acquis si son écriture initiale échoue. Les contrats ont leurs
régressions ciblées. Le contrôle visuel a ensuite révélé des colonnes de grille à minimum
automatique qui élargissaient l’accueil mobile à 515 px ; leur minimum est désormais
borné à zéro, recontrôlé à 390 px sans masquer le débordement.

## Limites conservées

Bibliothèque bornée à 200 projets, sessions gardées jusqu’à l’arrêt du lanceur. Les ports
des projets peuvent changer à la relance : la persistance vérifiée concerne les fichiers
Studio et leur brouillon, pas les données attachées à une origine navigateur. Import
par copie, sans historique Git ni exécution des scripts source. Aucun appel de modèle
produit ou de fournisseur externe requis par cette recette. Publication, auth native et
connecteurs directs restent hors du résultat livré.
