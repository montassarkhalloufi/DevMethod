# Les Ateliers — référence de conception

Date : 16 septembre 2026. Cas fictif d’une association proposant des ateliers de
réparation, cuisine et couture. Les images produites ici sont des propositions
générées, pas des captures d’une application exécutée.

## Intention et contraintes communes

Le participant doit trouver une activité, connaître sa date, son lieu et ses places,
puis s’inscrire. Les capacités, inscriptions et annulations appartiennent au produit
réel ; une composition visuelle ne prouve pas leur fonctionnement. Le périmètre
initial ne comprend ni paiement, ni authentification, ni envoi de courriel.

Les captures Lovable fournies par l’utilisateur servent de référence de parcours
(idée, choix facultatifs, réalisation visible, aperçu, modification), sans copier
leur identité. La direction navy/blanc approuvée de l’Atelier concerne le shell
DevMethod, distinct de l’identité du logiciel produit.

Avant génération : retenir les libellés explicites, le filtrage par activité, une
date et un nombre de places lisibles, une action d’inscription identifiable. Explorer
trois organisations réellement différentes du même contenu. Aucun utilisateur cible
n’a été interrogé ; les effets attendus ci-dessous sont des hypothèses de conception.

Sources primaires consultées le 16 septembre 2026 :

- [W3C, WCAG 2.2, compréhension de 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) : prévoir des cibles d’au moins 24 × 24 pixels CSS ou les espacements/conditions prévus ; viser 44 pixels de hauteur pour les actions principales. La mesure appartient au navigateur, pas à l’image générée.
- [W3C, WCAG 2.2, compréhension de 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) : rendre perceptibles les changements de statut sans imposer un changement de focus. Application envisagée : confirmation d’inscription, erreur et actualisation des places. Ce seul critère ne démontre pas une conformité complète.

## Trois hypothèses à comparer

| Direction | Organisation et effet attendu | Coût ou risque | Réfutation possible |
| --- | --- | --- | --- |
| Agenda clair | Liste chronologique, dates fortement alignées, détails pratiques prioritaires ; faciliter le choix d’un créneau disponible. | Moins expressif pour découvrir une activité inconnue. | Trouver un atelier de couture disponible prend plus d’étapes qu’avec les cartes ordinaires. |
| Catalogue chaleureux | Composition éditoriale et illustrations d’activités ; favoriser l’exploration et l’envie de participer. | Les images prennent la place des dates et des disponibilités. | Les participants choisissent une activité mais ne repèrent pas son horaire ou ses places. |
| Tableau opérationnel | Tableau compact, colonnes comparables et panneau d’inscription ; favoriser le suivi de plusieurs activités. | Densité élevée, moins adapté aux petits écrans et à un premier contact. | La densité augmente les erreurs de sélection sans améliorer le suivi. |

Ces propositions ne constituent ni une invention revendiquée, ni une preuve
d’avantage sur une interface ordinaire. La sélection est déléguée par la mission ;
elle sera consignée après inspection des fichiers, sans être attribuée à un vote
de l’utilisateur.

## Sélection et références livrées

Les trois propositions ont été générées puis inspectées. Sélection de l’agent sous
délégation explicite de la mission : **A, agenda clair**, pour rendre le choix d’un
créneau et de ses places prioritaire. Le catalogue B donne davantage d’espace à la
découverte ; le tableau C convient mieux à un gestionnaire régulier. Ce jugement
n’établit pas la préférence des participants ni un avantage mesuré.

| Sortie | Fichier | Dimensions réelles | Entrée image réelle |
| --- | --- | --- | --- |
| A — agenda | [direction-a-agenda.png](design/direction-a-agenda.png) | 1536 × 1024 | aucune |
| B — catalogue | [direction-b-catalogue.png](design/direction-b-catalogue.png) | 1536 × 1024 | aucune |
| C — tableau | [direction-c-tableau.png](design/direction-c-tableau.png) | 1536 × 1024 | aucune |
| Master retenu | [master-desktop.png](design/master-desktop.png) | 1536 × 1024 | direction A |
| Adaptation mobile | [mobile.png](design/mobile.png) | 887 × 1774 | master retenu |

Cinq appels au générateur intégré `image_gen.imagegen`, aucune CLI payante,
aucune retouche d’image par code. Les originaux ont été conservés et copiés dans
le dépôt. Les prompts complets, chemins d’origine et références de chaque appel
sont consignés dans [prompts.json](design/prompts.json). Les dimensions demandées
pour le mobile étaient approximatives ; le tableau rapporte les dimensions reçues,
pas celles souhaitées. Les coûts et jetons de ces appels ne sont pas exposés par
l’outil et ne sont pas déclarés nuls.

Inspection visuelle : les trois alternatives présentent des structures distinctes,
le contenu métier demandé et l’absence de paiement/authentification. A et B ont
ajouté des slogans décoratifs non demandés ; ceux de A ont été retirés du master.
Le master garde la date et la disponibilité dans chaque ligne. Le mobile réemploie
la même hiérarchie et empile les lignes. Il a inventé un bouton hamburger : **ne pas
l’implémenter**, les deux destinations sont déjà visibles. Sa troisième ligne est
coupée au bord inférieur : dans le produit elle doit rester atteignable par défilement.
Les légers gradients/textures de génération ne sont pas requis ; utiliser les
couleurs pleines ci-dessous. Aucune conformité, fidélité navigateur ou performance
d’usage n’est déduite de ces observations d’images.

## Contrat d’implémentation

La référence active est `master-desktop.png`, avec `mobile.png` pour l’empilement.
Les images guident la construction ; elles ne doivent pas être placées comme fond
d’une page en remplacement de vrais contrôles.

- Typographie : Georgia ou serif système pour marque, titre, titres d’ateliers et
  dates ; sans-serif système pour navigation, filtres, horaires, lieux et formulaires.
- Couleurs : fond `#f5f4ef`, cartes `#ffffff`, texte `#182a26`, action et accent
  `#234b43`, secondaire `#52605c`, bordures `#d9dedb`. Texte blanc sur action verte.
- Desktop : entête horizontal, introduction environ 30 % et agenda environ 70 % ;
  filtres au-dessus de trois cartes horizontales ; ordre date → informations →
  disponibilité et action. Les espaces doivent s’adapter à l’aperçu dans le shell,
  sans imposer la largeur de 1536 pixels.
- Mobile : introduction au-dessus de l’agenda, cartes empilées, retour à la ligne
  des filtres si nécessaire, disponibilité et action sous les informations. Aucun
  défilement horizontal requis. Conserver les deux destinations en clair.
- Surfaces : bordures fines, coins 10–14 pixels, espacements de 8/16/24/32 pixels,
  boutons principaux d’au moins 44 pixels de haut, état de focus visible. Les
  catégories comportent du texte ; la couleur seule ne porte aucun statut.

Contenu métier initial canonique (les capacités numériques totales sont décidées
dans les données, ces chiffres expriment uniquement les places restantes visibles) :

| Atelier | Catégorie | Date 2026 | Horaire | Lieu | Places restantes |
| --- | --- | --- | --- | --- | --- |
| Réparer son vélo | Réparation | samedi 19 septembre | 10 h – 12 h | Maison de quartier | 4 |
| Cuisine de saison | Cuisine | dimanche 20 septembre | 14 h – 16 h | Cuisine partagée | 0, « Complet » |
| Premiers points de couture | Couture | mercredi 23 septembre | 18 h – 20 h | Maison de quartier | 6 |

Le programme, la sélection de catégorie et « Mes inscriptions » sont de vrais
états d’application. « S’inscrire » ouvre un formulaire nommé pour l’atelier choisi
et demande un nom, avec annulation et confirmation. Un clic isolé ne fabrique pas
une inscription réussie. La vue des inscriptions permet une annulation réelle et
actualise les places. Ce formulaire et la vue d’inscriptions sont des adaptations
d’implémentation décrites ici, pas des maquettes raster supplémentaires prétendues.
La liste d’attente relève du changement de besoin ultérieur ; elle est absente du
master initial et ne doit pas apparaître silencieusement dès la première version.

## États et observations à effectuer dans l’application

| Situation | Comportement attendu | Preuve attendue |
| --- | --- | --- |
| Première visite | Programme, lieux, horaires, disponibilités et données fictives identifiables. | Capture desktop et parcours navigateur. |
| Filtre | Catégorie sélectionnée et nombre de résultats cohérents ; état vide explicite si aucun résultat. | Filtrer puis rétablir « Tous ». |
| Inscription | Formulaire accessible, saisie validée, état occupé pendant écriture, résultat annoncé ; décrément après succès réel. | Inscription, rechargement et consultation des données. |
| Échec d’écriture/conflit | Message compréhensible, nom et choix conservés, possibilité de réessayer ; aucun faux succès. | Erreur récupérable réellement provoquée. |
| Annulation | Retrait persistant de l’inscription et place rendue disponible. | Vérifier après rechargement. |
| Atelier complet | État textuel « Complet », inscription impossible dans la version initiale. | Essai sur Cuisine de saison. |
| Reprise | Inscriptions retrouvées après arrêt puis redémarrage du serveur. | Deux processus distincts et trace du résultat. |
| Petit écran/clavier | Contenu atteignable, contrôles utilisables, focus visible ; pas d’action réservée au survol. | Capture mobile et parcours clavier. |

Les vérifications navigateur et fonctionnelles sont à rattacher aux captures et
traces de la mission, produites après cette livraison visuelle. À ce stade elles ne
sont pas exécutées par cette sous-tâche. Le test d’intérêt de l’agenda consiste à
faire trouver un atelier de couture disponible et à s’y inscrire, puis comparer
erreurs, étapes et temps avec une liste ordinaire. Aucun recrutement, participant
humain simulé ou résultat de ce test n’est revendiqué.
