# DevMethod 0.2.0 — visual design through verified delivery

Status: published on npm as `devmethod-ai@0.2.0` under `latest`. The registry archive matches the reviewed candidate and passed package smoke after publication.

## Changes

- The existing `design` stage now explicitly covers comparable artistic directions, an approved master screen, derived screen images and browser comparison. Stay in design while requested visual references are missing.
- Existing approvals are retained for unchanged scope. Generated mockups, source references and browser captures are identified separately. The master is supplied as an actual image reference when the host supports it.
- Design works alongside technology and architecture decisions; no framework or stack is imposed. There are still six skills and fourteen workflow stages, with no new standalone master/pages commands.
- The README features the complete 2 min 58 s Lisière demonstration and two legible, complementary SVG diagrams for the overall workflow and delivery loop.
- Documentation, narration, subtitles and the runnable prototype evidence cover framing, visual design, architecture, readiness, implementation, review, verification and local handoff.

Image generation requires an available host tool; it is not bundled. The film contains illustrative commands and real generated images / application interactions, not a continuous Codex Desktop capture. The native pilot does not establish Claude Code or Cursor execution parity. The public CLI does not gain autonomous task dispatch.

## Adopt without overwriting project work

To pin a reviewed GitHub revision:

```sh
npx --yes --package=github:montassarkhalloufi/DevMethod#<reviewed-commit> devmethod init --tool codex --dest ../devmethod-staging
```

Install the published version:

```sh
npx --yes devmethod-ai@0.2.0 init --tool codex --dest ../devmethod-staging
```

Stage and compare updates. Keep existing project decisions, customized skills, filled profiles and instructions. There is no automatic migration.

## Candidate verification

Local candidate checks passed: locked installation, 72 core tests, 24 greenfield tests, Markdown links, both diagrams rendered in Chrome, package-content inspection and installation smoke from the archive for all three host layouts, including a subset and customization preservation. Exact source revision, final archive digest and platform CI results are recorded in the release PR before publication. Platform installation checks do not prove authenticated agent behavior.

Native workflow evidence is retained in the [Lisière execution record](media/visual-chain/execution.fr.md) and [visual pilot](../examples/visual-pilot/README.md). The release reuses that evidence for the unchanged skills; it does not claim fresh model runs.

Publish only the reviewed archive with an explicit `latest` tag for an authorized final release. After publication, download the registry tarball, compare its integrity and run package smoke again. Keep 0.1.0 available as a rollback reference.

## Exact published artifact — 2026-09-13

- Release preparation and review: [PR #17](https://github.com/montassarkhalloufi/DevMethod/pull/17), merged as `f374c5a02f2e339c47e126a8f8e5c2f28d785f9d`.
- [Platform CI](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34767104314): Linux, macOS and Windows passed.
- [Fullstack CI](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34767104287): passed.
- Archive: `devmethod-ai-0.2.0.tgz`, 230 files. SHA-256: `f8fa3ffe9c6d9cb0072dd3540a016dd8d36a582bde386a816eb5bd9bda0eca07`.
- npm SHA-1: `5e40705ce120987e3e3c271d1d00bca1a5be39a3`.
- npm integrity: `sha512-vV6DGt8v6xu6p42s7IaGKPPwcOMTBuUnH97E8W+FR809YFQtUw+n1hTZdoF3+5bq8tAvyslYMNGzAuBQ8bXVTg==`.

After browser authentication, npm confirmed publication. The fresh registry download matched the reviewed archive byte for byte and passed installation smoke for all host layouts, subset installation, preservation of customizations and context/planning checks. The `latest` tag is 0.2.0; 0.1.0 remains available. This post-publication record is not inside the immutable published archive.
