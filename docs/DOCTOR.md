# Inspect an installation

`doctor` is included in the source change that introduces this document. It is **not included in the already published `0.1.0-rc.1` tarball**. Until a new candidate is published, use a reviewed checkout:

```bash
node dist/cli.js doctor --dest /path/to/your/project
node dist/cli.js doctor --dest /path/to/your/project --json
```

The destination defaults to the current directory. The command infers the host from `kit-manifest.json`; it never executes project commands or modifies files. There is no `--fix` or overwrite option.

| Finding | Meaning | Next action |
|---|---|---|
| `file-modified` | Bytes differ from the original local manifest | Review your customization; keep filled project context |
| `file-missing` or `file-type` | A recorded payload is absent or not a regular file | Compare with a reviewed staging installation |
| `duplicate-host` | A selected module exists under another host too | Intentionally consolidate; doctor does not delete it |
| `manifest-missing` | No recorded installation at the destination | Check the path or install into fresh staging |
| `manifest-invalid` | Malformed/unsupported manifest or unsafe manifest path | Inspect provenance and compare a clean installation |
| `file-unreadable` or `host-unreadable` | A path cannot be safely inspected | Resolve symbolic/blocked paths or filesystem permissions |

Exit codes: **0** means clean or intentionally customizable; inspect JSON `status` for `ok` versus `warning`. **1** means at least one diagnostic error. **2** means invalid CLI usage. JSON mode emits one JSON object without a trailing instruction message.

The manifest records the initial file hashes, not whether a project profile is complete. A modified profile is expected. Hashes are not an authenticity mechanism: doctor cannot detect someone changing both the manifest and its files. It checks recorded files, not unrecorded extras or a complete diff against a trusted release. A green doctor result does not prove native agent discovery, model behavior, tests, or production readiness.
