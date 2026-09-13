# Create a direction, then build it

The source version of DevMethod includes a visual-creation procedure in the existing `design` stage. It preserves six modules and does not install an image service. The published npm `0.1.0` package predates this evolution; reinstalling that version does not obtain it.

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
