# DevMethod — démonstration visuelle courte

[Voir le film 4K](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/visual-chain/devmethod-visuel-4k.fr.mp4) · [Sous-titres](devmethod-visuel.fr.srt) · [Prototype source](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/visual-chain/lisiere-visual-source.zip)

**2 min 05 s · 3840 × 2160 · 17 séquences · voix française.**

Le film remplace le long documentaire comme démonstration principale : un seul projet, Lisière, une commande et son résultat visuel, puis l'étape suivante. Narration française courte, commandes tapées, apparitions successives, mouvements doux et interaction réelle. GitHub garde la prononciation « guit-hub » demandée.

## Ce qui est effectivement vérifié

| Passage | Preuve et portée |
| --- | --- |
| Trois directions → choix A → master approuvé | Assets et choix réels conservés du pilote Lisière antérieur ; pas une nouvelle décision utilisateur inventée |
| Master → images des écrans | Deux appels image_gen avec le master en référence : ajout et terminés ; une correction image du fond de la modale |
| Images → nouvelle application | Nouveau dossier contenant seulement le kit, le brief et les références ; Codex CLI implémente ensuite sans recevoir l'ancien code |
| Application → vérification | 6 tests Node ; parcours Chrome avec filtres, ajout, statut, focus après transition, sauvegarde, mobile et préservation de données illisibles |
| Livraison | Prototype local archivé, sans déploiement ni publication npm |

Les commandes visibles sont des formulations types réutilisables, pas une transcription littérale d'un unique chat ni une capture continue de Codex Desktop. Les résultats visuels et interactions sont réels. La préparation de la petite tranche neuve a été regroupée dans `implement` ; le film présente `plan` séparément pour expliquer son rôle. La narration n'affirme pas qu'il a été exécuté dans une session séparée.

Le parent a corrigé deux défauts de la réalisation neuve avant la vérification finale : la règle CSS `hidden` de l'alerte et le maintien du focus après changement de statut. Les images dérivées ajoutent seulement des états déjà prévus ; aucune nouvelle approbation utilisateur de ces images n'est revendiquée. Le master A conserve son approbation antérieure. Écarts restants : police système, dimensions adaptées et détails raster ; aucune identité pixel à pixel ni certification complète d'accessibilité.

## Revalidation du contenu

Le film précédent était trop détaillé et ne prouvait pas le passage master → pages : sa commande design réutilisait surtout une référence existante. Le skill explicite désormais les trois points de passage et recommande de rester dans design lorsque des visuels demandés manquent. Il ne crée aucune commande autonome « master » ou « pages ».

La génération d'images dépend toujours d'un outil disponible dans l'agent. Une instruction documentée ne suffit pas à prouver son exécution : le test présent conserve les prompts, les références, les images générées et la réalisation postérieure. Le [guide](../../VISUAL-WORKFLOW.md) contient les commandes correspondantes. Clair et Lisière ne sont plus mélangés dans la narration.

## Sources de montage

Les scripts sont dans [scripts/media/visual-short](../../../scripts/media/visual-short). Ils utilisent macOS Thomas, ffmpeg/ffprobe, Chrome et Playwright (PLAYWRIGHT_MODULE si nécessaire). Depuis la racine du dépôt : extraire le prototype dans /private/tmp/devmethod-shortfilm/project et le servir sur localhost:8768 ; exécuter check.cjs, story.py, record.cjs, record.cjs --only-app, puis encode.py. Les maquettes raster sont les assets générés déjà conservés, pas régénérées par ces scripts.

Le montage est en 4K ; les images source générées sont en1536×1024. Le texte et les transitions sont rendus dans Chrome à3840×2160.

Vérifications du média : MP4 H.264, AAC, sous-titres français mov_text ; 125,451 secondes. Plans explicatifs de6 à8 secondes environ, transitions et apparitions animées ; séquence navigateur de20 secondes avec plusieurs actions. Images du master, des déclinaisons, de la comparaison et de la persistance encodée inspectées. Les sous-titres ont un timing proportionnel par phrase. Pas de revendication d’écoute humaine complète.
