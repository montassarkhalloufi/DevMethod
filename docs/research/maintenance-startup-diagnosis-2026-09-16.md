# Maintenance readiness: local startup diagnosis

The frozen readiness attempt at source `2ab754d` exited after 0.04 seconds with `Error: Operation not permitted (os error 1)`, empty JSONL and unchanged task files. Its campaign remains stopped. No new model invocation or campaign retry occurred during this diagnosis, and the original usage remains unknown. The unchanged faulty clamp is an unperformed repair, not evidence of a model's completed answer.

## Reproduced startup blocker

The original outer read profile denied `file-read*` throughout the campaign except the current worker. This also denied metadata for the campaign root and `workers` directory. Under the exact profile, environment and readiness cwd, `stat(worker)` succeeded but canonicalizing that path failed with EPERM while traversing its ancestors.

CLI `--version`, `--help`, `features list` and local `debug prompt-input` all succeeded under that profile, including the debug command with `-C`. Those probes alone therefore did not establish admission. The decisive comparison used the **exact native exec arguments with a final deliberately invalid boolean configuration override**, `allow_login_shell="invalid_boolean"`. A string cannot pass the pinned CLI's boolean parser, so this is a local configuration rejection probe, not a model turn:

| Outer profile | Exit | Standard output | Standard error |
| --- | ---: | --- | --- |
| Original | 1 | Empty | `Error: Operation not permitted (os error 1)` |
| Original plus metadata for exactly two ancestor directories | 1 | Empty | `Error loading config.toml: invalid type: string "invalid_boolean", expected a boolean` followed by `in allow_login_shell` |

Thus the metadata restriction is a demonstrated startup blocker on the exec path before typed configuration validation. Reaching the expected validation error does **not** establish that all later native startup stages or inference would succeed. No valid exec configuration was dispatched in this diagnosis.

## Small correction and retained protections

The simpler candidate was to replace the broad read denial with `file-read-data`, allowing metadata for every protected path. A local path probe confirmed it removes the canonicalization failure, but it exposes more metadata than necessary. The selected correction retains `file-read*` denial and permits only `file-read-metadata` for two literal paths: the campaign root and the worker's parent directory. This matches the fixed `campaign/workers/slot` layout.

A regression in a newly created fictional tree failed before the correction at `realpath(worker)` and passed afterward. It verifies that worker task reads succeed while protected file contents **and their metadata**, campaign directory listings and sibling-directory listings still fail with EPERM. Source package, fixture manifest, campaign freeze and sibling task are covered. The test uses a real macOS sandbox; other platforms skip it explicitly.

The runner also performs a short typed-invalid startup probe before reserving any future native slot. It requires the known config rejection from pinned CLI 0.147.0, empty stdout and exit 1; a generic EPERM or any different result blocks admission. This distinguishes expected validation failure from successful inference. The exported `maintenanceConfigPreflight` was run in a separate new tree and reached the expected rejection. It has a 10-second timeout and 64 KiB output limit and does not create a native campaign record.

## Evidence and limits

[Sanitized command templates, profiles, exact errors and raw hashes](../../evaluation/maintenance-diagnostics/startup-preflight.json) retain the comparison. Source, fixture, campaign and worker paths are replaced by documented placeholders; unchanged argument lists and global disabled-skill paths are elided explicitly. Environment contents, authentication material and account metadata are not published. The JSON was inspected before inclusion.

Private diagnostic outputs remain under `/private/tmp/devmethod-readiness-diagnostic-c3yjIs`; the fresh-tree config probe is `/private/tmp/devmethod-readiness-new-context-GT47L7`. The stopped campaign at `/private/tmp/devmethod-maintenance-campaign-20260916` was neither edited nor relaunched. No authentication file was inspected and no global configuration was changed.

Validation uses explicit Node 24.18.0 and installed Codex CLI 0.147.0. Four focused maintenance tests pass, including the red-to-green real sandbox regression, and the fresh-tree config probe reaches its expected typed rejection. Lint, formatting and local documentation links pass. This patch makes a future preparation reviewable; it supplies no A/B outcome, provider completion or new consumption measurement.
