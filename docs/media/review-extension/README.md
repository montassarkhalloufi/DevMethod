# Ajout de la review au film existant

Le film principal conserve les séquences et la narration de Lisière provenant du tag `v0.3.0`. Six séquences de review sont insérées à 171,52 secondes, avant la conclusion originale. Aucun cadrage, choix artistique ni parcours de Lisière n'a été recréé.

Les captures proviennent de l'interface réelle, inspectée dans le navigateur à 1586 × 992 : constats, recherche « silencieux », correction, couverture, sources et menu d'export. Elles affichent la fixture **Atelier de lecture**, dont les résultats sont fictifs et explicitement signalés. Ce chapitre n'affirme pas qu'une review structurée de Lisière a été exécutée.

Le complément est un montage de captures avec transitions et narration française macOS Thomas, comme le film existant ; ce n'est pas une capture vidéo continue des interactions. Les plans conservent le contenu des captures, avec un redimensionnement proportionnel et un habillage explicatif. La commande d'ouverture affichée est documentée et testée séparément ; la limite de vérification `file://` reste dans le [guide](../../REVIEW-GUIDE.md).

[Film et sous-titres](../visual-chain/README.md) · [Scènes ajoutées et empreinte de l'original](scenes.json) · [Script de montage](../../../scripts/media/review-extension/extend.py)

Le script extrait le film original depuis le tag immuable `v0.3.0`, génère seulement les nouveaux plans, décale les sous-titres et déplace la conclusion après le chapitre. Il nécessite Python avec Pillow, ffmpeg/ffprobe et la voix macOS Thomas. Exécuter depuis la racine : `python3 scripts/media/review-extension/extend.py`. Le cache de travail est `/private/tmp/devmethod-review-film`. Les empreintes des images, des voix et des paramètres d’encodage déclenchent la régénération des plans modifiés. Le script de montage se lance depuis un clone Git comprenant les médias ; le paquet npm suffit uniquement pour utiliser la review.

La vidéo 4K est hébergée sur GitHub et liée depuis npm ; elle n'alourdit pas l'archive npm. Les captures explicatives, le guide et l'exemple de review sont distribués. Les captures sont des observations du navigateur ; la synthèse vocale n'est pas un enregistrement humain.

## Vérifications du montage final

- Durée mesurée : **243,216 secondes** ; 3840 × 2160, 25 images/s, H.264, audio AAC mono 48 kHz et sous-titres français intégrés.
- Décodage complet du MP4 terminé sans erreur. Les six nouveaux plans, un plan original et la conclusion déplacée ont été extraits du fichier encodé et inspectés visuellement.
- Les nouvelles captures montrent réellement les onglets et le filtre annoncé ; leur cadrage a été corrigé avant montage.
- Les sous-titres d’origine sont conservés, la conclusion est décalée et les nouvelles phrases sont synchronisées aux durées des voix générées.
- Pas de revendication d’écoute humaine intégrale ni de nouvel enregistrement continu de l’application.
