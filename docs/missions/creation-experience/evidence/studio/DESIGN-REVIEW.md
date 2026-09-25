# Revue visuelle et UX du shell Olive

16 septembre 2026. Relecteur agent distinct du réalisateur de cette interface ; aucun test
utilisateur ni avis humain inventé. Inspection des [captures desktop](olive-desktop.png) et
[mobile](olive-mobile.png), des [mesures conservées](olive-visual-metrics.json), du CSS et du
master K `exec-28bf2b7f-7dbd-44c9-babc-79d51dc5d769.png` réellement ouvert dans les images
générées de la mission. Application du skill design-to-code et de son contrat UX. Aucune
modification d’interface dans cette revue.

**Le retour « olive camouflage, blocs indistincts » est cohérent avec le rendu inspecté.**
Les bordures existent, mais des fonds olive proches recouvrent chrome, décision, historique
et saisie. Le master K différenciait davantage la bulle utilisateur slate, la proposition
structurée et l’alerte ambre. La présence des composants et l’absence de débordement ne
prouvent donc ni leur hiérarchie ni la réussite artistique. La mention antérieure « panneaux
nettement séparés » dans les mesures doit rester un jugement agent contesté par ce retour.

## Cinq écarts prioritaires

| Priorité | Écart observé et conséquence | Proposition et critère observable pour la prochaine revue |
| --- | --- | --- |
| 1 — haute | **Les plans visuels se confondent.** Chrome, « Qui décide ? », cap, cartes et composer partagent la même famille olive sombre. Les fines bordures portent presque seules leur distinction. | Attribuer une surface stable à chaque rôle : chrome navy, conversation slate, décisions légèrement surélevées, aperçu clair. À 1280 et 1536 px, puis en niveaux de gris, leurs limites doivent rester perceptibles sans dépendre du texte ou d’un survol. Faire choisir la nouvelle proposition avant la réalisation dépendante. |
| 2 — haute | **Le résultat disparaît du premier écran mobile.** À 390 × 843, la capture montre décisions, projet, deux cartes d’historique et seulement le début de la saisie ; ni cap ni application. C’est une adaptation par empilement, au détriment de « essayer le produit ». | Proposer une priorité mobile explicite : résumé court puis accès immédiat Application/Conversation, avec aperçu ou accès visible dès le premier écran. Le lecteur doit pouvoir atteindre le produit par une action explicite sans traverser les anciens messages ; vérifier également retour à la conversation, saisie et focus conservés. Hypothèse d’utilisabilité à éprouver, pas bénéfice humain acquis. |
| 3 — haute | **Les informations décisives sont trop petites et trop denses.** Métadonnées, détails de délégation et preuves emploient plusieurs tailles de 9–11 px dans le CSS ; le bas de page accumule version, compteurs, limites et budget sur deux lignes serrées. | Réserver les petites tailles aux métadonnées secondaires ; rendre décision, état courant et action suivante lisibles sans zoom. Vérifier les styles calculés, les contrastes réellement rendus et le zoom à 200 %, avec des libellés longs. Aucun état nécessaire à une décision ne doit être masqué, tronqué ou réduit à une couleur. |
| 4 — moyenne | **L’historique ressemble à un journal technique uniforme.** Les deux cartes visibles « Résultat disponible » donnent de longs détails de correction CSS. K proposait une demande courte, « avant / proposé », l’incertitude et ce qui reste à préserver. | Résumer d’abord ce que la demande change pour la personne, distinguer demande, proposition, décision et résultat avec des titres et compositions différents ; conserver les détails techniques dépliables. Sur un même scénario, pouvoir retrouver la dernière demande, le choix actif et le résultat correspondant sans ouvrir les détails. Ne pas inventer de conversation, d’avatar utilisateur ou de validation absente des événements. |
| 5 — haute | **La disponibilité visuelle domine les limites de preuve.** Les badges de résultat ont une teinte positive, alors que le bas affiche `0 contrôle(s) passé(s) · 0 échoué(s)` et un budget arrêté, en petits caractères. Rien n’établit que le lecteur distingue « actif » de « vérifié ». | Quand la version active n’a aucun contrôle, afficher explicitement « Non vérifié sur cette version » avec une action vers les preuves. Séparer disponible, actif, vérifié, échec et appel suspendu. Vérifier les cinq états avec de vraies données et une révision changée : ni compteur nul ni preuve d’une ancienne version ne doit produire un résumé de réussite. Le seuil atteint doit expliquer la prochaine action possible sans faire croire que le modèle travaille. |

## Direction à proposer, pas encore approuvée

Le gradient `#0F172A → #4338CA` peut apporter une présence plus nette dans l’arrière-plan
et le chrome. Les accents `#7C3AED → #2563EB` conviennent aux actions principales et à la
sélection, avec contraste à vérifier. Garder des surfaces majoritairement unies : navy
profond pour le cadre, slate pour la conversation, une surface différente pour la carte
active, et un aperçu clair distinct. Ne pas répandre le même gradient sur toutes les cartes :
cela reproduirait la confusion actuelle dans une autre teinte. Violet/bleu ne doit pas
signifier « vérifié » ; les états sémantiques gardent texte, icône et couleurs dédiées.

Cette proposition conserve l’articulation conversation/application de K et corrige sa
réalisation ; elle n’autorise pas à remplacer le design Agenda de l’application intégrée.
Une nouvelle image dans le médium demandé doit être présentée au propriétaire, puis son
choix exact enregistré avant les changements visuels dépendants. Les travaux indépendants
de l’éditeur et les corrections autorisées peuvent continuer.

## Contraintes et prochaine vérification

Conserver résultat attendu, « Qui décide ? » par responsabilité, choix révisables, références,
preuves liées à la version, vraies erreurs, limites et budget. Préserver les saisies, les
données et la distinction entre la version examinée et la version active. Un décor plus
expressif ne doit pas ajouter de contrôles fictifs ou masquer les incertitudes.

Dans cette mission, refaire une revue aux étapes significatives : proposition visuelle,
choix accepté, implémentation au même viewport, puis interaction modifiée ou régression.
Comparer les mêmes contenus et états sur desktop/mobile ; tester clavier, focus, zoom et
récupération d’erreur lorsque l’interaction est livrée. Ce sont des points de contrôle du
travail en cours, pas une automation périodique. Les tests techniques restent nécessaires,
mais ne valident ni l’expression artistique ni la préférence utilisateur.
