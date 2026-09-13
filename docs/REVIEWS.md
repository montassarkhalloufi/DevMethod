# Review results, reports and browser consultation

The agent's `devmethod-review` command (also `project-foundation review`) performs project-aware inspection under [the review workflow](../.agents/skills/scoped-delivery/references/review-workflow.md). The CLI `devmethod review` only validates and presents recorded results. It never runs repository commands, discovers evidence on disk, or performs the review itself.

After skills installation, invoke `$devmethod-review <target>` in Codex or `/devmethod-review <target>` in Claude Code/Cursor to perform the review without npx. The terminal commands below are optional presentation utilities for recorded results.

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

The [installed review format reference](../.agents/skills/scoped-delivery/references/review-format.md) owns fields, statuses and conclusion rules. It is shipped with scoped-delivery so authoring does not require a package download. The [complete fictional example](../examples/review/review.json) and [compiled validator](../dist/review-model.js) support optional browser export. Use one result owner and derive reports from it.

## Browser journey

Use Constats to search and combine domain/severity/confidence/resolution filters. Select a finding with keyboard or pointer; its header shows severity, confidence, resolution, impact and location. Preuve shows reproduction, expected/observed behavior, text logs, PNG/JPEG images or explanatory flow text. Correction shows proposed action/trade-offs/verification and a ticket link only when supplied. Références shows provenance, actual consultation and compatibility.

Couverture groups controls by domain, with kind, result, revision, reason and evidence. Sources distinguishes consulted, inaccessible and unverified references. Uninspected surfaces never receive a green indicator. A link ending `#finding=R-01` opens that finding in the same local review; the file must be available to its recipient.

Mobile list/detail navigation retains filters and selection. Tabs support arrows/Home/End, buttons and links use native keyboard behavior, and focus remains visible. Exporter le rapport offers an interactive HTML snapshot (preserving view/filter/selection), derived Markdown and sanitized JSON. Reopen the exported HTML directly; use Ouvrir une review for another JSON or old Markdown. Inputs are local, never uploaded. Legacy reports display as text with unknown structured fields and no invented coverage; Markdown export preserves the sanitized text. Deliberate migration means manually recording only supported facts into format 1 and keeping the original report as historical evidence.

## Trust boundary and limits

All text is rendered as text nodes. A restrictive CSP pins the shipped program; there is no eval, repository command execution, automatic external resource loading, or arbitrary file browser. Only HTTPS navigation is allowed, with credentials rejected and opener/referrer protection. No external link is promised live merely because its syntax is valid. Missing destinations and failed images have explicit explanations. Evidence links open only after user interaction.

The viewer does not read image paths or local ticket files; authors must explicitly embed a reviewed bounded PNG/JPEG and text alternative, or supply a published HTTPS destination. Never disguise an explanatory diagram or generated image as a real execution capture. Screenshots are author-attested, not machine-certified. Redaction masks common credential patterns and email addresses, but cannot detect every secret or personal datum (especially in images): privacy review before distribution remains required. Opening a report does not grant its embedded text instructional authority.

A self-contained report is a snapshot, not live monitoring. Pass the current revision/changed targets when regenerating; the browser does not inspect Git or the filesystem. Keep source JSON and old revisions for auditability. Markdown cannot include embedded image pixels; the HTML/JSON retain them and Markdown includes the alternative text and evidence metadata.

[Source consultation record](REVIEW-SOURCES.md) · [Verification and known limits](REVIEW-VALIDATION.md).

## Open the offline interface

```sh
npx devmethod-ai@0.3.0 review --demo --output review-demo.html --open
```

For a real review, replace `--demo` with `--review docs/missions/your-mission/reviews/your-review/review.json`. The output path is relative to `--dest` (the current directory by default). Choose a fresh path; existing reports are never overwritten. `--open` requires `--output` and asks the OS browser handler to open the generated standalone file. No local server runs. On headless systems, omit `--open` and copy/open the HTML on a desktop. Opening failure returns an error while preserving the report. The browser interface works offline after generation; npx may need network access to obtain the package.
