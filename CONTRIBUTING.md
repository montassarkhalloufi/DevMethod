# Contributing

Read this file and the accepted decisions in docs/ before changing the kit. Preserve existing project policy, accepted decisions and permissions. Keep examples fictional and modules independent of a specific business, tracker, provider or stack.

For development use Node.js 22.13+ on the 22 line, or Node.js 24+, npm and strict TypeScript. The packaged CLI runtime remains Node.js 22+. Run `npm ci`, `npm test` and `npm pack --dry-run`. Commit generated dist/ alongside src/ so GitHub installation requires no build hooks or development dependencies. Review the full diff for private references, secrets, licensing and unintended files. Never describe document checks or simulated agent runs as native Claude Code/Cursor validation.

Keep each change in one coherent commit after checks, without rewriting published history. npm publication requires an authenticated maintainer: run the checks, inspect `npm pack --dry-run`, then publish the exact verified archive with an explicit tag: `next` for release candidates, `latest` for an authorized final release. Do not publish unverified compatibility claims.

Keep commands, documentation and tests consistent. Record architecture changes in an ADR. Public releases require maintainer review of the exact candidate. There is no deployment, paid service, telemetry, automatic update or migration in this repository.

Follow [the release checklist](docs/RELEASE-CHECKLIST.md) for new candidates. The intentionally failing exercise under `examples/bugfix` is evaluation input, not part of the package test suite. Keep its starting implementation defective and label any generated solution or transcript separately. Comparative claims require the [evaluation protocol](docs/EVALUATION.md), not installer test counts.

Platform installation checks run on Linux, macOS and Windows through .github/workflows/platform-tests.yml. They test the packaged CLI, not authenticated coding-agent behavior. Record the workflow run and job conclusions before claiming an operating system passed.

## Code quality in this repository

Use `npm run lint`, `npm run format:check` and `npm test` before submitting maintained code. ESLint, TypeScript ESLint, SonarJS and Prettier are pinned development tools. The platform workflow checks lint and formatting as well as the generated build and tests. The method has no production dependencies. Studio owns its pinned runtime dependencies in `packages/studio/package.json`; root development dependencies supply the shared build and tests. Keep matching dependency versions consistent. The skill installer itself makes no network requests after npm installation. development uses Node.js 22.13+ on the 22 line or 24+ as required by the pinned tools (CI uses current Node 22). Maintained text paths have LF attributes so formatting checks are portable across platform checkouts.

`npm run quality:report` prints measured cognitive complexity with analyzer versions and scope. The lint threshold is 15 per function, a project review heuristic rather than a proof of readability or correctness. Decompose by responsibilities and explicit inputs; avoid opaque chains, gratuitous classes and tiny forwarding methods created solely to improve a score. Separate logical blocks and keep meaningful names. Review long functions/files even below the threshold; declarative schemas and test tables do not have the same reading cost as nested control flow.

For a reproducible defect with an available test boundary, capture a failing regression before its correction, then observe green. Use small test-first steps for stable rules where useful. A covered refactor uses green → refactor → green; uncertain requirements can need a bounded exploratory step. Tests should assert observable requirements or invariants and fail on a plausible defect. Do not count duplicates, empty assertions, invented requirements or mocks of the behavior under test as useful coverage. DOM integration tests exercise generated viewer event bindings; they do not certify layout, accessibility in actual assistive technology or browser CSP enforcement.

Retained experiments, deliberate defect fixtures and generated files preserve their required identities. They are not a template for new production code. Add a new maintained source path to the relevant quality scope rather than disabling checks broadly.

## Independent package verification

`npm run build` also prepares the ignored `packages/studio/build/` payload from canonical sources. Edit canonical sources only. `npm pack` creates the method archive; `npm run pack:studio` verifies payload freshness and creates the Studio archive. Inspect both with `npm pack --dry-run` and `npm pack ./packages/studio --dry-run`. Run `npm run test:package -- METHOD_TGZ` and `npm run test:package:studio -- STUDIO_TGZ METHOD_TGZ` against those exact archives. The method check installs offline with an empty cache; Studio installs independently and then tests the explicit combined installation. No test publishes either package. See [ADR 029](docs/ADR-029-independent-packages.md).
