# Release checklist

Public releases require maintainer review of the exact candidate under CONTRIBUTING.md. This checklist does not authorize publication.

1. Record the source revision and intended candidate version. Keep accepted contracts and English documentation consistent. Rebuild and commit `dist/` with source; do not claim new commands exist in an older npm tarball.
2. Run `npm ci`, `npm test`, and `npm pack --dry-run`. Also inspect `npm pack ./packages/studio --dry-run` after the build. The method must have no Studio files or production dependencies. Inspect both packages’ contents, MIT notices, executables and payloads. Run the packed CLI for every host, including a subset, conflict preservation, and `doctor --json`.
3. Record current platform CI run and job conclusions. Older green runs apply to their recorded commits; they do not certify a changed CLI on all systems.
4. Separately run the [native smoke protocol](../COMPATIBILITY.md#native-smoke-protocol). Record exact host/model versions and real behavior. Keep untested hosts labeled pending even if installation is green.
5. Check the [workflow evaluation protocol](EVALUATION.md) before publishing behavioral or comparative claims. Record what was actually run; do not substitute a written example for a transcript.
6. Update version and lockfile together for a new npm release, refresh release notes and compatibility evidence, and inspect the final candidate again. Use the `next` tag for release candidates; preserve the stable tag.
7. After authorized maintainer publication, verify the registry artifact/version and smoke-test that exact tarball. Record its digest and provenance. A pushed branch or merged PR is not an npm publication.

Keep the previous package available as a rollback reference. Adoption updates remain staged comparisons; this release does not automatically migrate user profiles or instructions.

## 0.5 hardening candidate gates

Record evidence for the final candidate in [the hardening ledger](HARDENING-0.5.md). Run offline behavioral fixtures separately from native sessions; passing a report scorer on authored cases demonstrates its rules, not agent compliance.

- Verify backward compatibility: existing invocations, six modules, optional records, customized files and offline operation. No mandatory external service, paid provider or telemetry.
- Reconcile every new CLI command, schema, exit code and limitation across source, generated `dist/`, help, examples and documentation. A read-only inspector must not be described as an executor or an independent truth oracle.
- Run current full tests, documentation checks and package inspection. Preserve exact commands and outputs. Evaluate failures before rerunning; do not carry forward an old success count.
- Create the actual candidate archive and record its SHA-256/SHA-512, version and source revision. Install and smoke-test that archive. Any subsequent source, payload, dependency or generated-output change requires a new archive and renewed affected checks; an older digest cannot identify the revised candidate.
- Record current platform CI separately from local layout tests. Record native discovery, editing, failure and resumption separately from deterministic tests. Missing executables/authentication keep native cells pending; do not improvise credentials or introduce paid services to clear a gate.
- Review the complete 27-workstream ledger. Distinguish shipped mechanisms, deterministic test results, authored scenarios, historical evidence and pending external validation. Narrow release claims to the evidence actually available; a complete ledger does not mean all workstreams are complete.
- Have the maintainer review the exact candidate archive/digest and diff under CONTRIBUTING.md. Prior approval of a plan or older archive is not review of changed bytes. Do all preparation and verification before this final review gate.
- After authorized publication, fetch the registry archive and verify it matches the reviewed archive. Record registry integrity and tag explicitly. If publication is not authorized or accessible, leave a reviewable candidate and state that publication is pending.

## Separate method and Studio candidates

Build once with `npm run build`, then create the method archive with `npm pack` and
the Studio archive with `npm run pack:studio`. The Studio prepack gate rejects
missing or stale generated payloads. Both manifests currently use the same candidate
version; align them before building.

Run `npm run test:package -- METHOD_TGZ` and
`npm run test:package:studio -- STUDIO_TGZ METHOD_TGZ`. Record both archive digests.
The method archive must install offline with an empty cache and no Studio dependency.
The Studio archive must work independently; the explicit combined install must
support `devmethod studio`. Verify registry name ownership/availability before the
first authorized Studio publication; a local package name is not a registry claim.
