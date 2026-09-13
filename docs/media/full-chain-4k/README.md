# DevMethod — chaîne complète en 4K

[Voir ou télécharger le film](devmethod-chaine-complete-4k.fr.mp4) · [Sous-titres français](devmethod-chaine-complete.fr.srt) · [Code du prototype](lisiere-source.zip)

**10 min 10 s · 3840 × 2160 · 19 chapitres · voix française.**

Film pédagogique en français : installation, exploration, cadrage, directions artistiques, choix A, master screen approuvé, design des interactions, architecture, plan, readiness, implémentation, revue, navigateur, comparaison et clôture locale.

## Nature des images

Les commandes et sorties proviennent de véritables exécutions de Codex CLI sur un dossier neuf. Elles sont remises en page pour le film, avec les attentes retirées : **ce n'est pas une capture continue de l'interface Codex Desktop**. Les entrées complètes sont conservées dans [les transcriptions](transcripts.fr.md), tandis que le film affiche la commande de chaque étape et sa réponse. Les annotations pédagogiques sont séparées des réponses.

La planche des trois directions et le master screen ont réellement été générés dans la session préparatoire du [pilote Lisière](../../../examples/visual-pilot/README.md). Le même utilisateur a choisi « A », puis approuvé la maquette par « oui ». Le film identifie cette provenance ; ces décisions ne sont pas rejouées comme de nouveaux messages en direct. Le nouveau dossier reçoit le brief et ces images, sans le code du pilote précédent.

La vidéo est rendue en 3840 × 2160. Les références générées d'origine restent des images 1536 × 1024 ; leur inclusion dans un film 4K ne les transforme pas en images natives 4K. Les interactions de l'application sont enregistrées dans Chrome.

## Exécution et limites

Codex CLI 0.147.0, modèle `gpt-5.6-sol`, sessions éphémères successives, même mission canonique persistée sur disque. Le premier essai avec le modèle configuré par défaut était incompatible avec cette CLI ; le modèle a été changé uniquement pour cette exécution, sans modification de configuration globale.

La voix française est une synthèse système Thomas. Le texte de synthèse utilise « guit-hub » pour obtenir le g de « guitare » demandé par l'utilisateur ; l'orthographe GitHub reste utilisée dans les sous-titres. Pas de musique, témoignage ou résultat commercial inventé. La narration et les durées sont dans [scenes.json](scenes.json).

La livraison de l'application est locale. Les tests couvrent les comportements explicitement rapportés ; ce film ne constitue pas un audit universel. Le [guide source](../../VISUAL-WORKFLOW.md) précise l'installation de cette évolution, plus récente que npm 0.1.0.

## Repères et vérification

- 00:30 — installation ; 01:02 — premières commandes et sorties.
- 02:04 — directions ; 02:41 — choix A ; 03:13 — master screen.
- 03:49 — design ; 04:22 — architecture ; 04:54 — plan ; 05:23 — ready.
- 05:55 — implémentation ; 06:26 — revue ; 06:55 — correction.
- 07:25 — interaction réelle ; 08:01 — comparaison ; 08:33 — vérification ; 09:04 — clôture locale.

Le film sélectionne la vérification finale consolidée. Le premier passage de vérification et sa demande de preuves supplémentaires restent dans les transcriptions complètes.

MP4 H.264 3840 × 2160, AAC, piste française mov_text, 19 chapitres, durée610,52 secondes, taille30,84 Mo. Narration non silencieuse : moyenne−15,8 dB, pic−0,1 dB. Images des commandes, du master, de la comparaison et une image de l'interaction encodée inspectées ; aucune affirmation d'écoute humaine intégrale. Les sous-titres sont segmentés par phrase avec un minutage proportionnel, pas un alignement phonétique.

Le prototype passe27 tests de logique/stockage. Chrome confirme les parcours, les régressions, le clavier et le reflow à720/320px. Le zoom natif navigateur200% reste non vérifié. Voir les preuves incluses dans l'archive source. Le dépôt DevMethod passe72 tests et ses liens documentaires ; l'archive npm a été inspectée, sans publication. Les MP4, ZIP et captures marketing sont exclus du paquet npm pour ne pas alourdir l'installation.
