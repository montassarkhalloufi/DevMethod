# Independent method and Studio distribution

Date: 2026-09-25. Status: implemented and locally verified.
Decision: [ADR 029](../../ADR-029-independent-packages.md).

## Authorized outcome

One public repository, two installable npm packages. Installing `devmethod-ai`
must not download Studio code, UI, compiler or production dependencies. Installing
`devmethod-studio` must provide the existing Studio without a separate method install.
Keep MIT licensing, existing method behavior and source checkout commands.
Publication and unrelated work in the dirty checkout are outside scope.

## Acceptance and verification

- Inspect the actual method archive and install it offline with an empty npm cache.
  Check the installed dependency tree and exercise init/doctor for three hosts,
  subset adoption, review, update preservation, context and guard commands.
- Inspect and independently install the actual Studio archive. Exercise the CLI,
  HTML/ESM example, real React compilation, UI assets, persisted restart and export.
- Verify method-only guidance for `devmethod studio` and forwarding when both
  packages are explicitly installed; neither path automatically installs software.
- Run lint, formatting, full tests, documentation checks and package smoke checks.
  Record inspected archive sizes/digests and local environment; remote platform CI
  and native coding-agent behavior remain separate evidence.

## Existing work preserved

Before this change, README.md and scripts/check-docs.mjs were modified, and handbook,
architecture/product/method/studio docs, publication preparation and media artifacts
were untracked. Preserve these files and changes; update README only at the relevant
distribution statements. No changes to application behavior are planned.

## Evidence

See [verification results](RESULTS.md) and the linked raw outputs. All acceptance
criteria above passed locally. Publication, remote platform CI and native agent
validation remain outside this task.
