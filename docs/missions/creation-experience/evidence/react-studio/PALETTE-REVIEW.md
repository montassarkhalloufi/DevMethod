# Référence M — bleu nuit et décisions lisibles

Référence fournie par l’utilisateur : `ChatGPT Image Sep 16, 2026, 08_01_45 PM.png`, effectivement consultée le 2026-09-16. La validation concerne la palette et la hiérarchie du Studio. L’application dans l’aperçu conserve son propre design.

## Application de la référence

- Fond `#0B1220`, surfaces secondaires `#1C2940`, décision active `#253550` avec trait gauche violet de 3 px.
- Accent `#9A85FF`, texte principal `#F5F7FC`, texte secondaire `#CAD3E2`. Le violet désaturé `#2B2C4B` distingue le texte de la demande utilisateur.
- Cartes de décision : padding de 16 px, rayon de 12 px. Les messages sont compacts, séparés par 16 px ; les anciens dégradés décoratifs et contours des messages ont été retirés.
- Les statuts utilisent les données existantes : `active`, `hypothesis`, `superseded`. Aucun choix, témoignage ou succès fictif ajouté.
- Les références visuelles sont sélectionnées par un groupe de radios natifs. La sélection locale ne vaut pas décision enregistrée ; la validation explicite conserve le choix et sa raison.
- Fond Monaco adapté par CSS sans modifier ses tokens syntaxiques ni son contrôleur d’édition.

## Contrastes calculés

Calcul de luminance relative sRGB selon WCAG, sur les valeurs CSS déclarées. Les ratios détaillés sont dans `palette-contrast.json` ; ils ne remplacent pas une revue complète des états rendus.

| Couple | Ratio |
| --- | ---: |
| Texte principal / fond | 17,47:1 |
| Texte secondaire / surface | 9,67:1 |
| Texte secondaire / décision active | 8,17:1 |
| Accent de focus / surface | 4,98:1 |
| Texte du bouton / violet profond | 5,18:1 |
| Texte du bouton au survol | 4,67:1 |
| Ambre / fond avertissement | 9,21:1 |
| Vert / fond succès | 8,67:1 |

Adaptation d’accessibilité : le texte blanc sur l’accent exact `#9A85FF` n’atteint que 2,73:1. Les boutons à texte blanc utilisent donc `#6E50D6` (survol `#7559DA`). L’accent demandé reste inchangé pour les traits, sélections et focus. Les contrôles désactivés ne sont pas inclus dans ces ratios.

## Vérification et limites

18 tests du shell passent, dont une régression de choix visuel : exclusivité des radios, absence d’écriture avant validation, préservation de la sélection et de la raison pendant le polling, puis envoi du choix exact. ESLint ciblé passe.

La session navigateur de l’agent de réalisation ne retrouve plus le fournisseur Chrome actif après sa reconnexion : plusieurs appels à `createBrowserTab`/`getTab` expirent ; elle voit seulement l’ancien fournisseur `id=1`, alors que la session du parent accède au nouveau. Les captures finales et les dimensions rendues doivent donc être ajoutées par la session de revue encore accessible. Le calcul des contrastes ci-dessus est terminé ; la fidélité navigateur n’est pas déclarée vérifiée sur cette seule base.

La session parent a ensuite réalisé les captures et interactions : voir
[LAYOUT-REVIEW.md](LAYOUT-REVIEW.md). Le blocage de session du worker est résolu par
cette vérification effective ; il ne constitue pas une validation humaine supplémentaire.
