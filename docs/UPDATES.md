# Installed provenance and update previews

`devmethod update-preview [--dest PATH] [--json]` compares an installation with the payload bundled in the CLI you invoke. It infers the installed host and module subset, includes foundation, and performs no writes, downloads, migrations or model calls. It does not check a registry for a newer version.

New format 2 manifests include optional `provenance`: `packageName`, `packageVersion` and `payloadSha256`. The digest hashes JSON-encoded sorted `[path, sha256]` pairs for the host-profiled selected payload, excluding the manifest itself. This distinguishes payload changes even when package versions match. These are local records, not signatures or proof of release authenticity. Legacy manifests continue to work: an identical `init` preserves their original bytes and previews explicitly report unknown installed version. Never infer a legacy version from the CLI currently running.

The format 1 JSON report contains installed/candidate provenance, findings and entries:

| Classification | Meaning |
| --- | --- |
| unchanged | Local file, recorded baseline and candidate match. |
| updated | Local file matches its baseline; candidate differs. |
| customized | Local differs from baseline while upstream is unchanged, or local already equals the candidate. |
| conflict | Local and candidate both differ from baseline and differ from each other, including local edits to upstream-deleted files. |
| added | Candidate path was absent from the baseline; `collision` flags an existing local file. |
| removed | Baseline file is unchanged locally and absent from the candidate. |

Each entry includes available baseline, local and candidate SHA-256 hashes, plus `candidateChanged`. A locally customized file absent from the candidate is a conflict and has no candidate hash. The new conflict value is an additive report enum; consumers must handle unknown classifications conservatively. A missing file is explicit and retains a diagnostic error. Exit codes are 0 for a completed clean/warning preview, 1 for diagnostic or filesystem errors, and 2 for invalid invocation. Warnings require human review; exit 0 does not authorize applying changes.

To review content differences, install the candidate CLI into a fresh staging directory with the same host/subset, then use your normal diff tool against the project. Preserve project profiles, instructions, accepted decisions and customizations intentionally. There is no automatic apply command. Unrecorded files outside candidate paths are not inventoried. Inspect directories without concurrent modification; symbolic-path checks are not an OS sandbox. No native-host compatibility or behavioral claim follows from these tests.

## Verification checkpoint

Implementation validation on macOS with Node.js: `npm ci` and `npm test` pass (23 tests, including all three layouts and subsets). `npm pack --dry-run --cache /private/tmp/devmethod-provenance-npm-cache` passes; a freshly extracted tarball successfully runs a Claude subset installation and JSON update preview with matching provenance. This is a packaged CLI smoke test, not Claude host evidence. The default npm cache was unwritable, so packaging used an isolated temporary cache; no cache ownership changes were made.

Resume by reviewing ADR 003 and the CLI/manifest diff, then run the platform matrix against the exact candidate before claiming cross-platform execution. Do not apply updates automatically or publish this candidate without the release process.

## Manual application and recovery

Preview is the only update operation shipped. Before applying a reviewed staging diff manually, select exact paths/hunks, make a clean backup or Git commit of the current project (including filled profiles), and retain the old manifest. Apply only the selected content, preserving project instructions and decisions. Run project checks and doctor; customizations remain expected warnings. If verification fails, restore only those selected paths from the backup and re-run affected checks. Do not replace the baseline manifest to make intentional edits look pristine. There is no automatic apply or rollback command, and a hash difference is never overwrite authorization.
