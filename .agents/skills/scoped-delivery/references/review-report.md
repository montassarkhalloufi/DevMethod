# Deliver the real review report

This is the final part of the review workflow, performed by the agent. First inspect actual work and record the checks, findings and limits using [the review format](review-format.md). A substantial review produces JSON, Markdown and HTML; a small review may stay in the conversation unless a report is requested. Use the actual inspected revision, and label synthetic test inputs only as test fixtures.

1. Write the real review JSON in the project's existing convention, or docs/missions/<mission-id>/reviews/<review-id>/review.json. Preserve previous review snapshots. Do not fabricate checks to make the report look complete.
2. Resolve the installed scoped-delivery folder from this skill, even if renamed. Its `scripts/review-agent.mjs` renderer ships with the installation and needs Node.js 22+, but no npm, npx, server or network. It works in ESM, CommonJS and projects without package.json. Execute it yourself, with separately quoted arguments, for example from the project root:

   ```sh
   node .agents/skills/scoped-delivery/scripts/review-agent.mjs --review docs/missions/my-mission/reviews/review-1/review.json --output docs/missions/my-mission/reviews/review-1/review.html --markdown docs/missions/my-mission/reviews/review-1/REVIEW.md --open
   ```

   Replace sample paths with the actual record and fresh output paths. Use an absolute script path if needed and `--dest` for the actual project root. Omit `--open` for a report-only request or a headless environment. A request to open/show the report already authorizes local browser opening. Do not add a second approval or show this command as work for the user to perform.
3. The renderer validates the real record before writing. Correct schema problems from actual evidence, preserving all review outcomes; never remove findings or change results to pass validation. Existing outputs are protected: select a new snapshot path. A valid rendering is not a passed code review.
4. Check that both output files exist and report the review conclusion, unresolved findings, coverage limits and clickable artifact paths. If opening fails, retain and link the generated files, explain that specific limitation and use an available host file/browser preview where supported. Do not claim the browser opened merely because generation passed.

The installed helper intentionally has no demo mode. For a legacy installation lacking the helper, use an available reviewed DevMethod CLI/source checkout internally; otherwise stage the published kit through the project's authorized installation procedure and use its renderer without overwriting the project. Never stop at telling the user to run npx. If Node.js, download access or browser support is genuinely unavailable, finish independent inspection and preserve the real record, naming the specific remaining export/opening blocker. An actual environment restriction is not permission to bypass it.
