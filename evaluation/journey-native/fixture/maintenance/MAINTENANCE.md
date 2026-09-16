# Repair Café category change — maintenance contract

Continue the existing application and its HANDOFF.md. Keep every initial contract behavior. Architecture choices remain delegated. Stay with app.mjs and Node built-ins; no UI, dependencies or services.

Add an optional `category` field to `add`. When supplied it must be a string trimmed to 1–40 characters. Store and return the normalized field for a new job. When omitted, omit it from the job entirely (do not add a default). Idempotent retry requires the same normalized title and the same category presence/value; any mismatch is `conflict` without mutation. Reject an empty/nonstring/oversized category as invalid-input.

Previously saved version-1 jobs without a category stay readable and keep their exact fields, title and open/done status. List, finish, and an identical retry must not silently add category or reopen a done job. Do not rewrite all old jobs or change the version. Jobs with category must also survive new processes and finishing.

The operator may have supplied saved-jobs.json created by the previous implementation. Inspect and preserve it; if the earlier delivery failed and the fixture was substituted, operator-setup.json explicitly identifies that fact. The replacement acceptance.mjs checks initial behaviors plus category maintenance using independent temporary files and true separate CLI processes.

Run meaningful tests and update HANDOFF.md with the changed behavior, data compatibility, actual checks and remaining limits. Maintain scoped delivery; no unrelated features, publishing, or modification outside the project.
