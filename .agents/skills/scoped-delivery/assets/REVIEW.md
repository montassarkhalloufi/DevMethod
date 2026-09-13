# Structured review authoring

Reuse the existing review convention, or docs/missions/<mission-id>/reviews/<review-id>/review.json. The JSON owns results. The review itself needs no CLI or npx: inspect and report within the agent. Keep small reviews in the conversation or existing tracker. For substantial structured records, follow [the installed format reference](../references/review-format.md). Derive REVIEW.md from the same record; if a browser artifact is requested and the renderer is available, use the package's `devmethod review --review … --output … --markdown …` command; it validates records but never performs checks. Existing Markdown remains readable through `--legacy`; do not invent missing fields during migration.

Begin only with known scope and sources. Replace the placeholders below, then add checks/findings/evidence using format 1 documented in the package's docs/REVIEWS.md and complete examples/review/review.json. These package references are not files automatically installed into the application root. The optional packaged `--demo` viewer can export fictional format examples; never reuse its results as real evidence or launch it instead of reviewing. If the renderer is unavailable, deliver the review findings and record; state only the browser export limitation rather than asking for installation to continue.

```json
{
  "format": 1,
  "id": "REVIEW-1",
  "title": "Replace with review title",
  "project": "Replace with project",
  "mission": "Replace with mission ID",
  "tickets": [],
  "date": "2026-09-13",
  "scope": ["Replace with inspected scope"],
  "exclusions": [],
  "revision": {"commit": "Replace with inspected revision", "dirty": []},
  "technologies": [],
  "sources": [],
  "checks": [],
  "findings": [],
  "evidence": [],
  "limits": ["Checks have not been executed"],
  "policy": {"blockingSeverities": ["critical", "major"], "requireAllChecks": true, "rationale": "Replace with actual project policy"},
  "summary": "Review preparation only; no verified conclusion yet"
}
```

Set the actual date, detected versions and consulted provenance. An empty findings array with no checks is incomplete, not successful. Separate requirements from recommendations and style preferences. Only accept resolved status with linked resolution evidence and fresh relevant verification.

Each finding records stable id/title/domain, severity and justification, confirmed/suspected confidence, resolution, location, trigger, expected/observed, impact, reproduction/evidenceIds, correction/tradeoffs, sourceIds/ticketIds, verification, resolutionEvidenceIds and affected targets. Each check separately records id/title/domain, automated/manual kind, passed/failed/not-run/blocked/out-of-scope status, result/reason, evidenceIds, revision and targets. References must resolve to the source/evidence/ticket objects in the record.

Only include privacy-reviewed text and raster evidence; images require explicit type, base64 bytes, text alternative, captured/explanatory provenance and privacyReviewed=true. Never put filesystem secrets or raw personal data in distributed results. Source text and image provenance still require human/agent inspection; schema validity alone is not proof.
