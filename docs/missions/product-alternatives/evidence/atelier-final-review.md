# Revue finale ciblée — Atelier et séance

**Statut après réexamen : finding P2 clos sur le correctif non committé décrit en fin de rapport. Le constat au commit 61d9507 reste conservé comme observation antérieure.**

16 septembre 2026. Commit inspecté : `61d950706a8b3047687fbac8246bbf4853fe8157`, base demandée `98091340d7d95c25123f6bb1e9aa2a5d3d095365`. Le checkout était propre au début de la revue. Lecture du code et des preuves ; un seul nouveau contrôle local en mémoire sous Node24.18.0. Aucun fichier du dépôt modifié, aucun provider, aucune nouvelle campagne et aucune répétition des suites déjà vertes. Seul ce rapport a été écrit.

## Constat actionnable

**P2 — Une action commune disparaît quand deux variantes emploient le même identifiant avec des genres différents.** `scripts/atelier/public/controls.js:6–21` déduplique toutes les actions par `action.id`, puis sépare création et transition. La dernière variante remplace donc le genre de l’autre dans cette table.

Reproduction indépendante minimale sur le seed Gazette en mémoire : conserver `submit` comme transition dans bureau-editorial ; retirer l’ancien `submit` de relecture-pairs puis renommer sa création en `submit`. Le projet passe `validateProject`. `controlChoices(project, createSession(project).lanes).transitions` ne contient plus `submit`, alors que bureau possède toujours cette transition et son bouton direct. La liste de créations contient `create` et `submit`. L’utilisateur ne peut donc plus lancer le même `submit` sur un élément existant depuis le sélecteur commun. Le contrat actuel n’exige pas qu’un identifiant ait le même genre entre variantes.

Sortie observée : `{"validProject":true,"id":"submit","firstKind":"transition","secondKind":"create","sharedTransitionSelectorOmits":true,"sharedCreations":["create","submit"]}`.

Correction circonscrite proposée : filtrer par genre avant de dédupliquer les identifiants, ou employer une clé genre+identifiant. Conserver les refus par variante calculés par le domaine : ils font partie du résultat à comparer. Ajouter un contrôle de ce cas accepté par le schéma. Interdire désormais les genres différents serait un changement du contrat plutôt qu’une réparation neutre. Ce constat ne remet pas en cause les parcours Gazette retenus ; c’est une limite reproductible d’un import actuellement accepté.

## Points relus sans autre défaut bloquant constaté

- Les choix nouveaux conservent des clones de contexte et d’observations, indépendants de la situation commune. Le replay remplace les essais courants et conserve le snapshot du choix. La trace Gazette finale contient bien 4 records et 6 événements par lane dans les observations choisies, avec une décision historique ; RESULTS distingue la toute première décision sans ces observations au lieu de les réinventer.
- Les projets sans actions rendent des contrôles vides et désactivés, sans dépendre d’un premier élément inexistant. La création ciblée sélectionne les actions de la variante cible ; le constat ci-dessus concerne la déduplication entre genres dans le mode commun.
- Le remplacement d’essais individuels et le reset passent par un dialogue HTML explicite. Annuler ne déclenche pas la mutation ; confirmer la déclenche. Le chemin ne dépend plus de la boîte native `confirm`. Le déplacement du message dans le dialogue ouvert le rend présent dans ce sous-arbre ; cette lecture ne remplace pas la QA visuelle.
- La séance intégrée utilise de vrais modules ESM, avec imports relatifs et point d’entrée `type=module`, et annonce la nécessité de servir les fichiers par HTTP. Domaine, rendu, stockage et liaison UI restent séparés. Les équations et données des compromis précédemment revus sont conservées, ainsi que les snapshots/export et le rejet des identifiants locaux inconnus. Aucun nouveau bénéfice ne découle du refactoring ESM.
- RESEARCH et RESULTS distinguent hypothèse, fonctionnement réalisé, manipulation par des agents et bénéfice humain non mesuré. Ils conservent l’inadéquation du moteur fini au cas horaire, le support initial manquant, la révélation complète, la construction ultérieure, l’absence de comparaison admise et les limites de la mesure de temps. La transaction n’est pas présentée comme une généralisation réussie du candidat gelé.
- La confirmation native bloquée, le changement de surface autorisée vers Chrome et la correction vers un dialogue HTML sont décrits comme des limites/interventions d’outil, sans prétendre qu’une boîte bloquée aurait été validée. La séance et les copies publiées sont des réalisations après révélation, pas des états legacy récupérés.

## Limites de cette revue

Les 325 tests et les parcours Chrome/mobile/export sont rapportés par le parent et leurs éléments ont été lus ; ils n’ont pas été réexécutés ici. Aucun essai avec personne, lecteur d’écran ou ancien téléphone. Les URL et conclusions externes de la recherche n’ont pas fait l’objet d’une nouvelle revue bibliographique dans cette passe de 10 minutes. Pas de revue exhaustive du serveur, de la sécurité ou de toutes les combinaisons du schéma. L’absence d’autre finding dans ce périmètre n’est pas une certification générale.

Conclusion au commit inspecté : les conclusions empiriques restent correctement bornées ; un défaut de sélection d’action sur import valide est à corriger. Toute correction ultérieure doit être identifiée et vérifiée séparément de ce constat.

Pins de lecture : arbre `c571d58a88f92c641e88fa2e327e46be1b0ec2be` ; controls.js SHA256 `866257aaefbae161f1361170511abe8533e2e61ea9aa2aa5c50d51f86d423328` ; app.js `e3664f0fe92ff21451fb550d1d6fa268fac86f458410cd00229df2ae8babc87b` ; domain.mjs `ca29932ab8c72cae83e02f5946db778ac9c9ced75a6d633291ccf8c075a237e1` ; domaine séance ESM `c177a752aec4e90bdf825ec7baa179c1f86ed66624079a1da32d90ed38ee74c9` ; RESEARCH.md `584727e588d79c92cf80eba224e5422d940cfcb8ca22bbf9437d1ed4f30884b7` ; RESULTS.md `883f426d7907af7be280a73d4717f67d631a50ebbe0e1ee04aa532a5402845aa`.

## Réexamen du correctif non committé

Référence inchangée : `61d950706a8b3047687fbac8246bbf4853fe8157`, complétée uniquement, pour cette vérification, par le diff de `scripts/atelier/public/controls.js` et `tests/atelier-controls.test.mjs`. SHA256 de ce diff Git contre 61d9507 : `dffa21b734c0821c5de1014e32854a9244a6afa16c2b8e24e195e1b04af09aba`.

Le filtre de genre est maintenant appliqué avant la déduplication par identifiant. Une même action `submit` reste donc disponible dans les deux familles sans modifier le schéma ou les résultats métier par variante. La sélection préalable de la variante cible reste en place. La régression reproduit le cas valide constaté ; les logs du parent montrent son échec sur l’assertion de présence de transition avant correction, puis 3/3 tests ciblés passants après correction. Logs lus : `/private/tmp/atelier-kind-red.log` et `/private/tmp/atelier-kind-green.log`. Je n’ai pas réexécuté de suite inchangée.

**Finding clos pour ce diff inspecté.** La conclusion initiale demeure attachée au commit initial ; elle ne prétend pas que le correctif était déjà dans 61d9507. Les modifications concomitantes de PLAN.md et le nouveau REPRISE.md observés dans le checkout sont hors de cette passe ciblée et ne sont pas inclus dans ce pin.

Pins du correctif :

- `scripts/atelier/public/controls.js` : `fa6607d2c511c13f8466efe0a618dea0020e891e37b007e8aa4b1b3218e3cc8a`.
- `tests/atelier-controls.test.mjs` : `1d0f085d0b036c814d5b87b2172f24a5ab930d45cbd91a918233022537411b08`.
- `atelier-kind-red.log` : `7d70a9e5b1b3238f5c2cf015ceeaa2db9cf29ea6046671995433dbc83911282c`.
- `atelier-kind-green.log` : `c02285e11d97dd8fb82393a8689954e13eadd7aefdd66eaaa6a8970c2a2b1ac5`.
