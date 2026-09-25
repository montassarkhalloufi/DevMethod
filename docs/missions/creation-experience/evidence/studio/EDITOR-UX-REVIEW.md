# Revue indépendante — éditeur compact

16 septembre 2026. Relecteur agent distinct des auteurs de l'interface. Application du skill
design-to-code et de son contrat UX. **Cette revue constate des propriétés rendues et des
interactions ; elle ne vaut ni approbation humaine ni validation artistique.** La palette
olive reste rejetée, et L reste une proposition en attente. Aucun changement de palette
n'a été appliqué pour cette revue.

## Protocole et résultat

Chrome réel, onglet dédié sur `http://127.0.0.1:4330/`, sans toucher l'onglet utilisateur
4335. Version applicative active `1aea70fe-1134-4dfa-a872-a79e3003b6aa`. Ouverture réelle
Application → Code → Modifier le code, à **1563 × 813**, puis **390 × 843 pixels CSS**.
Les dimensions ont été lues dans le navigateur ; son facteur d'échelle 1,1 a nécessité de
compenser l'override avant les relevés retenus. Le viewport a été restauré et l'onglet fermé.

Le code est visible dès l'ouverture desktop : **301,6 px non masqués**, soit environ
14 lignes à 21,45 px d'interligne ; police monospace 13 px. `html`, le panneau Code et le
champ ne sont pas préalablement descendus pour obtenir cette vue. Vérifier, Adopter et
Autres actions sont présents au-dessus du texte ; Adopter reste désactivé sans modification.
Le cap reste accessible, et le bandeau indique la couverture à établir sans transformer le
contrôle de syntaxe en succès fonctionnel. [Vue desktop après correction](editor-compact-desktop-corrected.jpg).

La première passe a trouvé deux défauts mobiles. Ils ont été transmis au réalisateur,
corrigés, puis réellement recontrôlés depuis une nouvelle ouverture. Les preuves négatives
restent conservées :

| Priorité et défaut observé | Correction observée et critère vérifié |
| --- | --- |
| **P2 — actions coupées.** À 390 px, le menu ouvert plaçait les boutons jusqu'à x462 ; « Récupérer mes modifications » et « Préparer une correction » étaient tronqués. [Avant](editor-compact-mobile-actions.jpg). | Menu aligné sur le bord droit : boutons de x102 à x360, entièrement dans le viewport. Leurs libellés sont lisibles sans défilement horizontal. [Après](editor-compact-mobile-actions-corrected.jpg). Les actions n'ont pas été exécutées, pour ne pas modifier l'état. |
| **P2 — code presque absent du premier écran.** Depuis une ouverture mobile neuve, le texte commençait à y796,8 : seulement 46,2 px visibles sur 843, après une liste de fichiers de 140 px. [Avant](editor-compact-mobile-fresh.jpg). | Le clic sur Modifier amène maintenant l'édition en haut, avec un défilement explicite de 355 px. La liste de fichiers devient une rangée de 49,5 px ; les **320 px du champ** sont visibles, de y351,3 à y671,3, ainsi que les actions principales. Le cap reste plus haut dans la page. [Après](editor-compact-mobile-corrected.jpg). |

Après correction, `scrollWidth` du document vaut sa largeur : 390 px sur mobile et 1563 px
sur desktop. Le défilement horizontal des longues lignes reste local au champ de code ;
celui des fichiers reste local à leur liste mobile. La densité du code desktop est restée
identique après ces corrections mobiles. L'aperçu est clairement distinct du champ et
porte désormais « Aperçu après contrôle de syntaxe. À essayer ; données d'essai uniquement ».

## Conservation et limites

Un aller-retour Application → Code et le redimensionnement ont conservé à l'identique le
contenu du fichier et la demande déjà présents. Le rechargement a retrouvé le brouillon
enregistré. Aucun texte n'a été ajouté, aucun build lancé, aucune version adoptée et aucune
donnée métier modifiée par cette revue. Elle **ne rééprouve donc pas la conservation d'une
nouvelle saisie non acquittée**, les conflits ni les erreurs d'exécution ; leurs preuves sont
dans le [parcours éditeur](editor-journey.json) et les tests correspondants.

Les [mesures brutes](editor-compact-review-metrics.json) calculent la hauteur visible en
tenant compte du viewport **et des ancêtres qui masquent leur contenu**, pas seulement de
la taille déclarée du champ. Les empreintes des textes permettent la comparaison sans
dupliquer le code dans cette preuve. Le relevé mobile intermédiaire à 391 px n'est pas la
preuve d'acceptation : les passes fraîche et corrigée utilisent bien 390 px.

Restent non évalués ici : téléphone physique et clavier virtuel, zoom 200 %, navigation
clavier exhaustive, lecteur d'écran, contraste chiffré et compréhension par des utilisateurs.
Le bandeau de preuves reste défilable, avec une partie des détails hors de ses 76 px desktop ;
la vue Preuves demeure accessible dans la navigation. Les longues lignes demandent un
défilement horizontal dans ce simple éditeur. Ces limites doivent rester visibles dans le
périmètre livré ; l'absence de débordement global ne constitue pas une qualité artistique
démontrée. La revue de fidélité à L ne pourra commencer qu'après le choix humain et son
implémentation autorisée.
