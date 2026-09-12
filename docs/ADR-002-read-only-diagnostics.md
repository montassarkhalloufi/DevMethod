# ADR 002: Read-only installation diagnostics

Status: proposed for maintainer review with this implementation.

## Problem

`init` safely refuses divergent files, but cannot explain whether an adopted installation is missing files, intentionally customized, or duplicated across hosts. Users need this diagnosis before comparing an update.

## Proposed contract

Add `devmethod doctor [--dest PATH] [--json]`. Infer the host from the existing format 2 manifest. Keep the existing manifest format and support installations made before this command. Do not compare an older installation against the current package's entire file list: that would confuse an upgrade with corruption.

Validate the manifest structure and permitted paths before reading payload files. Require the root templates, license and selected module entry points in the manifest. Inspect recorded SHA-256 hashes, missing or non-regular files, symbolic paths and duplicate selected modules in other host directories. No writes, subprocesses, repairs, network access, or host execution.

JSON report format 1 contains destination, status, optional inferred host/modules, checked/unchanged counts and findings with severity, code, optional path, and message. Codes identify categories; message wording may evolve. Exit 0 for a clean or customized installation, 1 for diagnostic errors, and 2 for invalid CLI invocation. Automation that requires pristine files must also inspect `status`, since customization is an expected warning.

## Alternatives and limits

Manual directory comparison remains useful for updates but does not offer a stable machine-readable diagnosis. Automatic repair would need a separate migration and ownership contract; it is excluded. Adding configuration/state engines is unnecessary for this diagnostic slice.

Manifest hashes compare with a local baseline, not a signed release. Someone who changes both files and manifest can conceal changes. Doctor does not certify host discovery, prompt behavior, workflow gates, project readiness, or authenticity. It does not inventory unrecorded payload files or discover deleted optional entries in a modified manifest. Use a reviewed staging installation for that comparison. As with init, inspect a directory that is not being concurrently modified; symlink preflight is not an operating-system sandbox.

## Validation

Test all three host layouts and subsets, byte preservation, customized templates/skills, missing files, duplicate hosts, invalid manifests, traversal and symbolic paths, JSON output and exit codes. Run the existing installer tests after extracting shared filesystem checks. Exercise the command from the actual packed tarball. Native coding-agent validation remains a separate gate.
