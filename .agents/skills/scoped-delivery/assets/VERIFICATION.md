# Verification record

Use for a substantial slice or handoff; a small change may report the same evidence inline. This is a record, not an executable gate or independent certification.

- Slice and acceptance criteria:
- Repository / branch / commit:
- Uncommitted changes included in the checks (diff or artifact reference):
- Runtime / host / model when relevant:

| Criterion or risk | Check actually executed | Result and evidence reference | Remaining limitation |
|---|---|---|---|
| Describe observable behavior | Exact command or manual procedure | passed / failed / blocked / not run; log or artifact | What this check does not establish |

- Review: self-review or independent; reviewer and inspected revision when available:
- Changes after verification and affected checks invalidated:
- Delivery state: local / PR / merged / deployed / production-verified:
- Unresolved blockers and exact next action:

Do not record a planned command as executed, infer deployment from a merged PR, or reuse a green result after a relevant source change. Do not store secrets or raw sensitive application data in evidence.
