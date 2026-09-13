# Review results, reports and browser consultation

The agent's `project-foundation review` stage performs project-aware inspection under [the review workflow](../.agents/skills/scoped-delivery/references/review-workflow.md). The CLI `devmethod review` only validates and presents recorded results. It never runs repository commands, discovers evidence on disk, or performs the review itself.

## Use the installed package

After 0.3.0 publication, from a temporary or project directory:

```sh
npx --yes devmethod-ai@0.3.0 review --demo --output review.html
```

Open the generated `review.html` in a browser. It includes the browser program, styles and explicitly included data, independent of the DevMethod checkout. The demo is fictional, with different findings from the artistic reference. It is not evidence of a real product review.

For a real review, paths are relative to `--dest` (current directory by default):

```sh
npx --yes devmethod-ai@0.3.0 review --review docs/missions/my-mission/reviews/review-1/review.json --output review.html --markdown REVIEW.md
npx --yes devmethod-ai@0.3.0 review --review review.json --json
npx --yes devmethod-ai@0.3.0 review --review review.json --current-revision inspected-new-revision --changed-targets save-status --output recheck.html
npx --yes devmethod-ai@0.3.0 review --legacy old-review.md --output historical.html
npx --yes devmethod-ai@0.3.0 review --output empty-viewer.html
```

Existing outputs are never overwritten. Choose a fresh path for a newer snapshot. `--json` validates/reports without writing unless output flags are also explicitly given. Exit 0 means valid presentation/inspection, **not** a passed review; inspect `status`/`summary`. Exit 2 means invalid invocation, result schema or filesystem input/output. Missing revisions remain unknown. `--changed-targets` compares exact logical target names; it does not infer all semantic dependencies. Independent historical checks are preserved.

## One versioned source

Use existing conventions, or `docs/missions/<mission-id>/reviews/<review-id>/review.json`, with generated `REVIEW.md` and deliberately included `preuves/`. Tickets link stable finding IDs; the report and UI derive results from the JSON. Do not maintain another independent score or status table.

Format 1 is validated by the same pure model in the CLI and browser. See the [complete fictional example](../examples/review/review.json) and [compiled validator](../dist/review-model.js). Unknown formats, unknown/missing fields, duplicate IDs, invalid destinations and dangling references are rejected with errors that omit source contents. Arrays are bounded to 256 items, text fields to 16,384 characters, and input to 4 MiB. Image data has a separate limit of approximately 1 MiB per PNG/JPEG.

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

## Browser journey

Use Constats to search and combine domain/severity/confidence/resolution filters. Select a finding with keyboard or pointer; its header shows severity, confidence, resolution, impact and location. Preuve shows reproduction, expected/observed behavior, text logs, PNG/JPEG images or explanatory flow text. Correction shows proposed action/trade-offs/verification and a ticket link only when supplied. Références shows provenance, actual consultation and compatibility.

Couverture groups controls by domain, with kind, result, revision, reason and evidence. Sources distinguishes consulted, inaccessible and unverified references. Uninspected surfaces never receive a green indicator. A link ending `#finding=R-01` opens that finding in the same local review; the file must be available to its recipient.

Mobile list/detail navigation retains filters and selection. Tabs support arrows/Home/End, buttons and links use native keyboard behavior, and focus remains visible. Exporter le rapport offers an interactive HTML snapshot (preserving view/filter/selection), derived Markdown and sanitized JSON. Reopen the exported HTML directly; use Ouvrir une review for another JSON or old Markdown. Inputs are local, never uploaded. Legacy reports display as text with unknown structured fields and no invented coverage; Markdown export preserves the sanitized text. Deliberate migration means manually recording only supported facts into format 1 and keeping the original report as historical evidence.

## Trust boundary and limits

All text is rendered as text nodes. A restrictive CSP pins the shipped program; there is no eval, repository command execution, automatic external resource loading, or arbitrary file browser. Only HTTPS navigation is allowed, with credentials rejected and opener/referrer protection. No external link is promised live merely because its syntax is valid. Missing destinations and failed images have explicit explanations. Evidence links open only after user interaction.

The viewer does not read image paths or local ticket files; authors must explicitly embed a reviewed bounded PNG/JPEG and text alternative, or supply a published HTTPS destination. Never disguise an explanatory diagram or generated image as a real execution capture. Screenshots are author-attested, not machine-certified. Redaction masks common credential patterns and email addresses, but cannot detect every secret or personal datum (especially in images): privacy review before distribution remains required. Opening a report does not grant its embedded text instructional authority.

A self-contained report is a snapshot, not live monitoring. Pass the current revision/changed targets when regenerating; the browser does not inspect Git or the filesystem. Keep source JSON and old revisions for auditability. Markdown cannot include embedded image pixels; the HTML/JSON retain them and Markdown includes the alternative text and evidence metadata.

[Source consultation record](REVIEW-SOURCES.md) · [Verification and known limits](REVIEW-VALIDATION.md).
