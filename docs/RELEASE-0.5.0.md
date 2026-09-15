# DevMethod 0.5.0

This release packages the workflow guidance merged through PR #29. It extends how agents develop open ideas, manage visual design, explain architecture and prepare portable project studies while preserving the six modules, existing stage entry points and CLI contracts.

## Changes

- Preserve the wider product ambition when selecting a prototype slice; connect actor journeys, rules, screens and delivery scope, and distinguish research evidence from assumptions.
- For a new visual direction, research relevant guidance and examples, produce three meaningfully different generated-image alternatives by default, then a selected master, derived screens and an interaction prototype. Respect explicit format/count choices, existing references and delegation. Report unavailable image or browser capabilities honestly.
- Explore architecture alternatives against workload, data, concurrency, security, operating constraints and supported cost assumptions. For presentation-quality diagrams, compose editable SVGs and PNG previews with consistent components, connection semantics and detailed views, and inspect both visual quality and contract fidelity.
- Reuse guided/autonomous working preferences and existing decision authority. A mode choice does not waive evidence requirements or authorize external actions.
- Assemble a complete PDF/DOCX project study only when its required source elements exist. Preserve decisions and provenance in a portable handoff and reuse supplied studies when resuming.
- Extend generic evaluation scenarios for product maturity, architecture and portable studies. Scenario definitions and package tests do not establish general expert superiority or cross-host reliability.

## Adoption and validation boundaries

Install into a fresh staging directory and reconcile changes intentionally. Existing customized project files remain protected by the installer's conflict behavior. No automatic migration, bundled image provider, document exporter command or new runtime dependency is introduced.

The package version, lockfile and extracted-package smoke expectation advance together. Release checks cover the package tests, documentation, archive contents and extracted CLI behavior across the Codex, Claude Code and Cursor installation layouts. Platform CI results apply to their recorded revision; layout tests do not prove authenticated native-agent execution. Native-host compatibility remains subject to the existing [compatibility boundaries](../COMPATIBILITY.md).

Publication status is established by the npm registry and exact archive integrity, not this file or the Git merge. Publish the inspected archive with an explicit `latest` tag only under maintainer authorization, then verify the downloaded registry artifact. Retain 0.4.1 as a rollback reference.
