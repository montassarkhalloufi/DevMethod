# ADR 009: Discoverable workflow commands

Status: accepted for implementation under the user's explicit request, 2026-09-13.

The user requested that documented workflow commands, especially review, be exposed and execute in the agent without npx. Keeping only stage arguments meets neither discoverability nor the selected interaction. Registering bare review/plan commands could collide with host commands. Expose fourteen namespaced devmethod-* skills as short adapters to the existing stage contract and procedure modules. Preserve project-foundation invocations and the six-module selection contract. This amends ADR 001's entry-point restriction without changing its filesystem or permission boundaries.

A full installation ships all entry points; subsets include only entries backed by selected procedures. Manifest file hashes include adapters, while skills continues to identify selected procedure modules. Validation permits only the known applicable adapter paths and continues to accept old manifests without them. Initialization checks cross-host duplicates and preflights conflicts before writing. Update preview reports additions without overwriting existing installations.

The agent performs a review with installed instructions and resources; the optional presentation CLI does not perform checks. Install the structured format reference to remove the former dependence on package documentation. This release does not change the design workflow, browser UI, mission schemas or permission model.

Revisit if native-host testing shows ambiguous automatic routing, discovery limits or real demand for a different grouping. More commands do not establish superiority over another method. Automated packaging/integrity tests and manual instruction inspection are not native model execution evidence.
