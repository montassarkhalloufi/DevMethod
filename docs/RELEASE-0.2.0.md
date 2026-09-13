# DevMethod 0.2.0 — visual design through verified delivery

Status: candidate prepared for maintainer review. Not published on npm. The registry still serves 0.1.0 under `latest`; npm authentication is required to publish this candidate. GitHub updates and package preparation are separate from publication.

## Changes

- The existing `design` stage now explicitly covers comparable artistic directions, an approved master screen, derived screen images and browser comparison. Stay in design while requested visual references are missing.
- Existing approvals are retained for unchanged scope. Generated mockups, source references and browser captures are identified separately. The master is supplied as an actual image reference when the host supports it.
- Design works alongside technology and architecture decisions; no framework or stack is imposed. There are still six skills and fourteen workflow stages, with no new standalone master/pages commands.
- The README features the complete 2 min 58 s Lisière demonstration and two legible, complementary SVG diagrams for the overall workflow and delivery loop.
- Documentation, narration, subtitles and the runnable prototype evidence cover framing, visual design, architecture, readiness, implementation, review, verification and local handoff.

Image generation requires an available host tool; it is not bundled. The film contains illustrative commands and real generated images / application interactions, not a continuous Codex Desktop capture. The native pilot does not establish Claude Code or Cursor execution parity. The public CLI does not gain autonomous task dispatch.

## Adopt without overwriting project work

Until publication, use a reviewed GitHub revision:

```sh
npx --yes --package=github:montassarkhalloufi/DevMethod#<reviewed-commit> devmethod init --tool codex --dest ../devmethod-staging
```

After the registry confirms publication, the versioned command will be:

```sh
npx --yes devmethod-ai@0.2.0 init --tool codex --dest ../devmethod-staging
```

Stage and compare updates. Keep existing project decisions, customized skills, filled profiles and instructions. There is no automatic migration.

## Candidate verification

Local candidate checks passed: locked installation, 72 core tests, 24 greenfield tests, Markdown links, both diagrams rendered in Chrome, package-content inspection and installation smoke from the archive for all three host layouts, including a subset and customization preservation. Exact source revision, final archive digest and platform CI results are recorded in the release PR before publication. Platform installation checks do not prove authenticated agent behavior.

Native workflow evidence is retained in the [Lisière execution record](media/visual-chain/execution.fr.md) and [visual pilot](../examples/visual-pilot/README.md). The release reuses that evidence for the unchanged skills; it does not claim fresh model runs.

Publish only the reviewed archive with an explicit `latest` tag for an authorized final release. After publication, download the registry tarball, compare its integrity and run package smoke again. Keep 0.1.0 available as a rollback reference.
