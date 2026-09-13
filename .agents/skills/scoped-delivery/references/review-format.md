# Review record format

## One versioned source

Use existing conventions, or `docs/missions/<mission-id>/reviews/<review-id>/review.json`, with generated `REVIEW.md` and deliberately included `preuves/`. Tickets link stable finding IDs; the report and UI derive results from the JSON. Do not maintain another independent score or status table.

Format 1 is shared by the optional CLI and browser validator. This installed reference supports authoring without fetching the npm package. Schema conformance never proves that a check ran.

| Object | Required fields and ownership |
|---|---|
| Review | format, id, title, project, mission, tickets, date, scope, exclusions, revision, technologies, sources, checks, findings, evidence, limits, policy, summary |
| revision | commit (recorded revision label), dirty (explicit uncommitted changes); no automatic Git execution |
| technologies | name, version, detectedFrom (actual manifest/lockfile/source evidence) |
| ticket | id, title, url (HTTPS or null; local/unpublished destinations remain unavailable) |
| source | id, title, kind (documentation/skill/project), publisher, technology, version, url, consultedAt, access (consulted/unavailable/unverified), usage, compatibility, provenance; consulted requires a date |
| check | id, title, domain, kind (automated/manual), status (passed/failed/not-run/blocked/out-of-scope), result, reason, evidenceIds, revision, targets; unexecuted/excluded checks need a reason |
| finding | id, title, domain, severity (critical/major/moderate/minor), severityReason, confidence (confirmed/suspected), resolution (open/in-progress/resolved/accepted-risk), location, trigger, expected, observed, impact, reproduction, evidenceIds, correction, tradeoffs, sourceIds, ticketIds, verification, resolutionEvidenceIds, targets |
| location | path or component description, line (positive integer or null), component (text or null); display metadata, never arbitrary file access |
| evidence | id, title, kind (text/log/screenshot/diagram), content (text alternative or excerpt), url (HTTPS or null), image (null or explicit PNG/JPEG object) |
| image | mime=image/png or image/jpeg, base64, alt, origin=captured/explanatory, privacyReviewed=true; only deliberately included reviewed images, not filesystem paths or remote images |
| policy | blockingSeverities, requireAllChecks, rationale; project-owned explicit policy, no numeric risk score |

A confirmed finding still needs evidence or reproduction. A resolved finding requires resolution evidence IDs; schema validation checks the references, **not the truth of execution or whether the fix really works**. Authors must retain the original evidence and supply fresh verification. Closing a panel never changes resolution. Finding counts include all resolution states and stay independent from filtered results; uncertain unresolved findings have a separate count. Failed-check counts are separate from finding counts.

A blocking confirmed open finding or a failed check requires corrections. Otherwise a blocked check yields blocked; no passed checks, an unresolved suspected finding, or required unrun checks yields incomplete. Otherwise the conclusion is ready **on the verified scope**, with exclusions and limits still visible. This conclusion does not authorize integration/deployment or replace repository policy.

