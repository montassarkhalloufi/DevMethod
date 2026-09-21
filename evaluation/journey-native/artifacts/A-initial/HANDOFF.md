# Repair Café CLI handoff

Run `node app.mjs DATA_FILE list`, `node app.mjs DATA_FILE add '{"id":"job-a","title":"Fix kettle"}'`, or `node app.mjs DATA_FILE finish '{"id":"job-a"}'`.

The dependency-free CLI strictly validates arguments, payload fields, and the complete stored schema. Titles are trimmed and measured as Unicode characters. Jobs are returned and persisted in ASCII ID order. Mutations use a same-directory temporary file followed by rename, so output is withheld until persistence succeeds. Missing data starts empty; invalid existing bytes are never rewritten.

Verification: pending final test run.

Limits: sequential processes and ordinary filesystem durability only, as scoped by the contract. No locking or power-loss guarantee. Next action: run the supplied acceptance suite and focused edge checks.
