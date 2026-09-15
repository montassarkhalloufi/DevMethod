# Verification record

Use for a substantial slice or handoff; a small change may report the same evidence inline. This is a record, not an executable gate or independent certification.

- Slice and acceptance criteria:
- Repository / branch / commit:
- Uncommitted changes included in the checks (diff or artifact reference):
- Runtime / host / model when relevant:

| Criterion / failure scenario / invariant | Enforcement and guarantee scope | Check actually executed | Result and evidence reference | Remaining limitation |
|---|---|---|---|---|
| Describe the required behavior and distinguishing failure | Responsible boundary/commit point; relevant process, instance or restart scope | Exact command or manual procedure; relevant topology/data/workload | passed / failed / blocked / not run; log or artifact | What this check does not establish |

Omit inapplicable detail for a small change. Keep quality-tool versions/configuration and measured metric units with their output; absent measurements remain explicit. For a regression correction retain the observed red failure and its cause, then the green result, or the concrete reproduction blocker. Link existing evidence rather than duplicate logs or current status.

- Review: self-review or independent; reviewer and inspected revision when available:
- Changes after verification and affected checks invalidated:
- Delivery state: local / PR / merged / deployed / production-verified:
- Unresolved blockers and exact next action:

Do not record a planned command as executed, infer deployment from a merged PR, or reuse a green result after a relevant source change. Do not store secrets or raw sensitive application data in evidence.
