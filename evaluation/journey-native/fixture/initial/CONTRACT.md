# Repair Café local intake — delivery contract

Build a complete, small Node.js CLI in **app.mjs**, with no runtime dependencies, network, services, or visual UI. Reversible architecture choices are delegated. Keep implementation in that single entry file so its evidence boundary is explicit. Do not add a framework or a package installation.

The operator runs `node app.mjs DATA_FILE COMMAND [JSON_PAYLOAD]`. Each invocation is a new process. Operations are sequential; concurrent writers and power-loss guarantees are out of scope.

- `list` takes no payload and prints the full jobs array sorted by id (ASCII lexical order).
- `add` takes `{"id":"job-a","title":"Fix kettle"}` and prints that job. ID matches `^[a-z][a-z0-9-]{0,31}$`; title is a string trimmed to 1–80 characters. A new job is exactly `{id,title,status:"open"}`.
- An existing ID with the same normalized title is an idempotent retry: return the existing job, retaining its status. Different title: conflict, no mutation.
- `finish` takes `{"id":"job-a"}` and prints that job with status `done`. Finishing again returns the same done job. An unknown ID is not-found. `done` is terminal, including after add retries and process restart.
- Persist successful changes to DATA_FILE as JSON `{ "version": 1, "jobs": [...] }`. Missing DATA_FILE starts empty. Existing corrupt JSON, unsupported version, invalid job shape/status, or duplicate IDs is invalid-data and must remain byte-for-byte unchanged. Persisted jobs obey the same ID/title/status constraints. Existing stored titles are normalized.
- Success: exit 0, exactly one JSON value plus optional newline on stdout, empty stderr. Errors: nonzero exit, empty stdout, one JSON object `{"error":"CODE"}` on stderr. Codes: `invalid-input`, `conflict`, `not-found`, `invalid-data`, or `storage-error` for other filesystem failures. Reject malformed JSON, wrong argument counts, unknown commands/fields, empty titles, and invalid IDs without changing data. A storage failure must not report success.

Create meaningful tests (you may reuse the supplied independent acceptance.mjs). `node acceptance.mjs .` exercises the public CLI in real separate processes. Do not weaken that file to get green. Additional local tests may cover your own risks.

Create a concise HANDOFF.md with the working commands, storage/behavior decisions and assumptions, checks actually run, remaining limits and a specific next action or scoped-complete statement. This handoff is required for a fresh later session; avoid one document per stage. Finish with the delivered behavior and actual checks. Do not edit files outside the project, deploy, contact anyone, or publish.
