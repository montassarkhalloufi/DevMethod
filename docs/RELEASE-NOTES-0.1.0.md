# DevMethod 0.1.0 — prepared, not published

DevMethod packages a reusable six-module workflow for starting projects and improving existing ones. The release includes safe staged installation, read-only diagnostics and upgrade comparison, structured mission/context inspection, Git-aware checkpoint resumption, bounded manual planning and optional stack profiles with a runnable fullstack example.

The final review corrected error messages that could expose malformed JSON content. A CLI regression verifies that checkpoint, manifest, diagnostics and update errors omit input bytes and preserve project files. The welcome guide now correctly describes partial and direct installations.

The CLI runs offline after acquisition and has no runtime dependencies. Node.js 22+ is required; Git supports provenance features. Existing customizations are not overwritten or automatically migrated. Read [the adoption and release record](RELEASE-0.1.0.md) for commands and validation.

Native agent evaluation remains separate. Codex fixture and child-process probes have recorded evidence, but repeated BMAD comparison is incomplete and general automatic dispatch is experimental. This release makes no superiority or universal native-host compatibility claim.

No npm publication or main-branch merge has occurred. Maintainer review covers the exact archive and current CI before either action.
