# SAVE-1

Owner: fictional maintainer. [Milestone](../PLAN.md).
Outcome/value: retain a title for later retrieval.
Included: save and retrieve a title. Excluded: accounts, tags, sharing.
Status: conditional.
Dependencies/blocker: [storage choice](../../../../architecture/decisions/001-storage.md), owned by the maintainer, unresolved.
Rule: [R-01](../../../produit/REGLES.md#r-01--save-a-title).
Screen: no approved screen required by this nonvisual fixture; resolve design if visual scope is added.
Contract: persistence contract awaits the storage decision.
Acceptance AC-01: a valid saved title is retrievable. AC-02: whitespace-only input is rejected.
Verification: not run; there is no implementation or inspected code revision. Proposed check is a save/retrieve and blank-input test under the selected contract.
Review/integration/deployment: not performed.
Next action: resume the storage decision exchange in architecture; independent work may refine input examples.
