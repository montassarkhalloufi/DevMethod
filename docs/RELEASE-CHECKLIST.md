# Release checklist

Public releases require maintainer review of the exact candidate under CONTRIBUTING.md. This checklist does not authorize publication.

1. Record the source revision and intended candidate version. Keep accepted contracts and English documentation consistent. Rebuild and commit `dist/` with source; do not claim new commands exist in an older npm tarball.
2. Run `npm ci`, `npm test`, and `npm pack --dry-run`. Inspect the actual package contents, notice, executable and payload. Run the packed CLI for every host, including a subset, conflict preservation, and `doctor --json`.
3. Record current platform CI run and job conclusions. Older green runs apply to their recorded commits; they do not certify a changed CLI on all systems.
4. Separately run the [native smoke protocol](../COMPATIBILITY.md#native-smoke-protocol). Record exact host/model versions and real behavior. Keep untested hosts labeled pending even if installation is green.
5. Check the [workflow evaluation protocol](EVALUATION.md) before publishing behavioral or comparative claims. Record what was actually run; do not substitute a written example for a transcript.
6. Update version and lockfile together for a new npm release, refresh release notes and compatibility evidence, and inspect the final candidate again. Use the `next` tag for release candidates; preserve the stable tag.
7. After authorized maintainer publication, verify the registry artifact/version and smoke-test that exact tarball. Record its digest and provenance. A pushed branch or merged PR is not an npm publication.

Keep the previous package available as a rollback reference. Adoption updates remain staged comparisons; this release does not automatically migrate user profiles or instructions.
