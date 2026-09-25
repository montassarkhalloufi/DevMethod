# ADR 029 — Independent method and Studio packages

Date: 2026-09-25. Status: accepted for implementation.
Owner: maintainer, through the conversation request to implement the package split.
Updates the distribution boundary in [ADR 001](ADR-001-distribution.md).

## Decision and authorization

The maintainer asked whether installing the method also downloads Studio. After
inspection confirmed that the single npm package includes Studio and its runtime
dependencies, the proposed choice was one public repository with two independently
installed packages. The maintainer authorized this change: “tu peux faire ça?”.

Keep the root `devmethod-ai` package as the method distribution: skills, templates
embedded in those skills, dependency-free CLI and review runtime, and the resources
needed by existing method commands. Give it an explicit publication allowlist and
no production, optional or peer dependencies. Repository documentation, development
tests, media and Studio sources are not method installation payloads.

Prepare `devmethod-studio` in `packages/studio`, with its own manifest, executable,
MIT notice, compiled UI, control/risk/build engines, server, templates, recorded
examples and required method guidance. Studio alone owns its production dependencies.
The root retains development dependencies for building and testing both products.
Generated Studio package resources are copied from canonical sources by the build;
they are not a second editable source tree. Packing checks freshness before release.

The established `devmethod studio` command remains available in the source checkout
and can forward to an explicitly installed sibling Studio package. With only the
method installed it reports how to install/run Studio, without fetching it. Studio
also has an independent `devmethod-studio` executable and needs no method install.

## Alternatives and consequences

Keeping one npm package fails the lightweight installation requirement. Splitting
repositories would add source/version coordination without a separate team or
release requirement. Two packages in this repository preserve coordinated changes
while making distribution and dependencies independent. Existing root GitHub method
installation continues to use committed `dist/`, without build hooks.

The new package name is a local candidate; registry availability and publication
are separate maintainer work. No publication, license change or commercial feature
is authorized by this implementation. Existing published archives remain unchanged.

## Verification and revisit conditions

Inspect actual npm archives; install the method with an empty cache in offline mode;
exercise all three host profiles, review, customization preservation and guard;
install Studio independently and exercise its CLI, server, assets, example, React
compilation, restart and export/restore. Test explicit combined installation and
the method-only Studio guidance. Run repository quality gates and record local
results in [the package split mission](missions/package-split/PLAN.md).

Revisit repository separation when independent ownership or release cadence makes
shared development costly. Revisit package contents when a new runtime dependency
or resource is introduced; do not silently expand the method into Studio again.
