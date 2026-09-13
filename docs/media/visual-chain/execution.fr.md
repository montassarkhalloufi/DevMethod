# Exécution réelle après génération des images

Le master approuvé et les deux images dérivées étaient présents avant le code. Le dossier neuf ne contenait pas l’ancien prototype. Les étapes d’architecture, plan et préparation sont regroupées dans cette instruction.

```text
$project-foundation implement VISUAL-1
Lis BRIEF.md et inspecte réellement les trois images de references/. Réalise le prototype décrit à partir de ces images, sans ancien code fourni. Fais la préparation et le plan proportionnés inline, implémente, teste puis relis et corrige les défauts locaux. Pas de navigateur : le parent le vérifie. Garde une mission compacte, pas un document par étape. Respecte la typographie légère et le master approuvé. Réponse finale française150 mots maximum avec preuves et prochaine commande.
```

## Sortie Codex CLI

VISUAL-1 est implémenté dans [app/](<projet>/app) avec :

- bibliothèque responsive fidèle au master ;
- couvertures recadrées depuis `master.png` ;
- filtres, transitions d’état et ajout par dialogue accessible ;
- persistance `localStorage` protégeant les données invalides ;
- état vide et erreurs visibles.

Preuves : 6/6 tests Node réussis dans [domain.test.mjs](<projet>/tests/domain.test.mjs), contrôles syntaxiques réussis, aucune requête externe. Relecture effectuée et recadrage responsive corrigé. `CONTRIBUTING.md` est absent, sans blocage. Le rendu navigateur reste volontairement non vérifié par cette mission.

Prochaine commande : `$project-foundation verify VISUAL-1`

## Vérification parent postérieure

Après correction CSS de hidden et conservation du focus lors des transitions : 6 tests Node réussis. Chrome confirme 3 livres initiaux, alerte masquée normalement, filtre terminé, rouvrir et état vide, dialogue, ajout, persistance après reload, mobile390px sans débordement, données locales illisibles non écrasées. Aucun pageerror dans le parcours normal. Captures inspected desktop/mobile/modal.

Livraison locale seulement. La scène integrate est une commande type associée à cette livraison, pas une preuve de déploiement.

Le CLI a omis le document de mission demandé. Le parent a créé le checkpoint MISSION.md après vérification ; ce test supervisé ne prouve pas une tenue autonome parfaite du contexte.
