# Codex adapter validation — 2026-09-13

The optional private stdio app-server adapter now supports native sandbox commands, per-thread usage collection and parent/child interruption. It never attaches to the desktop daemon. The offline installer and generic planner are unchanged. Protocol bindings were inspected from installed Codex 0.147.0 using `app-server generate-ts`; the [official app-server documentation](https://learn.chatgpt.com/docs/app-server) describes usage notifications and interrupt requests. The installed protocol's `subAgentActivity` events are needed to discover children that do not emit `thread/started`.

## Observations

- Native `command/exec`: `git add` is denied under the default workspace sandbox (exit 128), and succeeds (exit 0) when that fictional repository's `.git` is explicitly writable. Network and general temporary-root writes remain disabled. This does not authorize writes to any real project Git metadata.
- One parent/child probe completed with 49350 reported input/output tokens, including cached input. Cumulative updates are replaced per thread, not added repeatedly.
- One parent/child cancellation probe emitted both interrupted completions and reported 39465 tokens. Acknowledging `turn/interrupt` alone is not considered completion. Remote service billing cancellation is not guaranteed.
- The BMAD native task successfully ran its mandatory renderer and Git sanity checks. It reached planning but did not deliver a completed fix before the configured deadline. Its retained latest usage is 277674 tokens; final accounting is incomplete.

The three root invocations therefore have an **observed lower bound of 366489 tokens**, not a certified final total. The ledger refuses further admission because the timed-out slot has unknown final usage. No blind retry, budget reset or favorable comparison is recorded. The repeated comparison remains incomplete. [Machine-readable results](../evaluation/comparison-v2-results.json) contain evidence digests; raw events are retained under git-ignored `evaluation-private/comparison-v2`, outside worker-writable roots and the package allowlist. Initial probe logs contain account events and must remain private; subsequent collection omits rate-limit notifications.

## Corrections after the trial

Independent review identified premature RPC closure after interrupt acknowledgement and missing signal handling. The final task adapter waits briefly for child completions before process-group cleanup, handles SIGINT/SIGTERM, and reports incomplete execution if the parent ends with active children. Missing usage still blocks the next run. SIGKILL or machine loss can require manual reconciliation. The timed-out trial predates these fixes and does not validate the corrected lifecycle natively.

The final runner also requires a nonempty handoff for objective acceptance and pins the runner, RPC, meter, host configuration and fixture verifier sources. Acceptance remains subject to behavioral review. Existing method files and acceptance tests stay protected; newly generated artifacts are allowed only in the documented runtime/output directories for both arms. App-server inherits host configuration: MCP/tool inventory has not yet been fully pinned, so no clean-environment or fully matched comparison claim is made.

Focused deterministic tests cover cumulative accounting, missing child discovery, unmetered/unfinished turns, malformed RPC, pending-call rejection, timeouts and delayed child completion after interrupt acknowledgement. They do not substitute for a new native lifecycle validation. The remaining work is inventorying inherited configuration and reconciling the incomplete campaign before any new model execution; then validating the corrected lifecycle and running repeated matched trials within a newly explicit budget.
