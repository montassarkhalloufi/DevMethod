# Create a direction, then build it

DevMethod 0.2.0 and the current GitHub source include a visual-creation procedure in the existing `design` stage. It preserves six modules and does not install an image service. The published npm `0.1.0` package predates this evolution; reinstalling that version does not obtain it. See the [0.2.0 release record](RELEASE-0.2.0.md) before choosing the installation command.

## Start

From the target repository, install the current reviewed GitHub source into a staging directory:

```sh
npx --yes --package=github:montassarkhalloufi/DevMethod devmethod init --tool codex --dest ../devmethod-staging
```

For reproducibility, replace the repository reference with `github:montassarkhalloufi/DevMethod#<reviewed-commit>`. Inspect the staging files and preserve existing instructions and customized profiles during adoption. Claude Code uses `--tool claude`; Cursor uses `--tool cursor`.

In the agent conversation, not the terminal:

```text
$project-foundation design
Create a visual direction for [product and audience].
Show me alternatives, let me choose, then prepare the key screen mockups.
```

Use `/project-foundation design` in Claude Code or Cursor. An already approved direction skips new alternatives. A brief can specify that the agent chooses the direction if that is what you want.

## What the procedure delivers

1. A brief grounded in the product, audience and supplied references.
2. Two or three comparable visible directions when the choice is open.
3. A recorded user choice, or an explicitly delegated selection.
4. Key-screen image mockups when an image tool is available, with prompts and versioned assets. Missing tooling is reported; an external-tool prompt is not an image.
5. An interactive prototype for the behavior that needs checking. The prototype may become the implementation.
6. Browser captures and interaction evidence compared with the approved reference, with mismatches and limitations recorded.

A build passing is not visual acceptance. Image generation is performed by the host's tool, not by the installer. The workflow does not promise identical output across models, hosts or runs.

## Recorded examples

- [Lisière](../examples/visual-pilot/README.md): supervised visual pilot, generated directions, user-selected and approved mockup, implementation and browser checks. This is not an independent end-to-end agent evaluation.
- [Mission and evidence](missions/visual-workflow.md): scope, checks and known typography/spacing differences.

Source adoption is separate from npm publication. No new npm version is announced by this guide.

## Full filmed chain

The [4K French walkthrough](media/full-chain-4k/README.md) shows actual Codex CLI commands and outputs, the prior approved visual choices, a fresh implementation, review findings, corrections, browser interaction and verification. CLI transcripts are reformatted for legibility; the provenance and limitations are explicit.

## Master screen → images des écrans → application

Le parcours visuel reste dans `design` jusqu'à ce que les visuels demandés soient prêts. « Master » et « pages » désignent le contenu du travail, pas de nouvelles sous-commandes du CLI.

Dans la conversation Codex, on peut envoyer successivement :

```text
$project-foundation design
Propose trois directions comparables sur le même écran principal.
```

```text
$project-foundation design
Je choisis A. Finalise le master screen de cette direction.
```

Après examen et approbation du master :

```text
$project-foundation design
Décline ce master approuvé en images des écrans demandés.
Utilise le fichier du master comme référence visuelle.
```

Les écrans gardent la typographie, la palette et les composants du master. L'agent examine les résultats, identifie leur référence/version et soumet les ajouts inattendus à validation. Il n'invente pas de routes : bibliothèque, ajout et filtre peuvent être des états d'une seule application.

La suite est `architecture` si des décisions restent nécessaires, puis `plan`, préparation `ready`, `implement`, `review`/`verify` et `integrate`. Les petites tranches peuvent regrouper préparation et réalisation. Les images précèdent l'implémentation qu'elles sont censées guider ; les captures navigateur servent ensuite à la comparaison.

Le [film complet de 2 min 58 s](media/visual-chain/README.md) montre ce passage avec des images réellement générées à partir du master, puis une nouvelle implémentation. Il poursuit avec les choix d’architecture et de technologies, la préparation, l’implémentation, la revue, la vérification et la livraison locale. La génération exige un outil d'image disponible dans l'agent ; DevMethod fournit les instructions du parcours, pas un moteur d'image intégré au paquet npm.
