# ADR 003: Local provenance and read-only update previews

Status: proposed for maintainer review with this implementation.

## Context and decision

An installed format 2 manifest records file hashes but not the package version. Add optional package name/version and a deterministic host/subset payload digest without changing the format or rewriting legacy manifests. The bundled package metadata is the source of the new installation's version; an old installation without this record remains unknown.

Add `update-preview` to compare recorded baseline, local bytes and the current CLI's bundled payload. Reuse manifest path validation and diagnostics before reading payload. Keep the operation offline and read-only, with no runtime dependencies. Preserve all six modules, host profiling and subset semantics. Classification and hashes expose upstream differences separately from local customization; no automatic overwrite, deletion or context migration is introduced.

## Consequences and limits

Version alone cannot establish payload equality; the digest includes selected host-profiled contents. Neither version nor digest establishes authenticity because manifests and package files are locally mutable. Missing optional historical entries cannot be reconstructed. Local changes to removed files stay classified as customization. Legacy idempotence preserves the original manifest only when its installation contract matches the requested payload. Content review uses a separate fresh staging installation and intentional diff.

The filesystem contract inherits ADR 001 and ADR 002: reject symlinks and unsupported paths, assume no concurrent modification, and distinguish document/integrity checks from native-host behavior. Tests cover all host layouts and subsets, legacy/new idempotence, classification, preservation, path attacks and CLI results.
