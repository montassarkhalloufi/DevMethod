# Checkpoint

Date / project / authorized scope:
Sources read and versions:
Branch / commit / PR / real status:
Delivered:
Checks actually run:
New decisions: accepted vs. proposed:
Changed files and ownership:
Scope-limited blockers:
Exact next action:
Authorizations and budget to respect:

Optional evidence pins (JSON format 1 companion or a human-readable table):
- Source ID / relative file / SHA-256 / role (code, test, contract, instructions, environment inventory):
- Evidence ID / saved artifact / SHA-256 / outcome / source IDs / prerequisite evidence IDs:
- Sources that must be refreshed from external systems before trusting local pins:
- Invalidated evidence and exact checks to repeat:

On resumption, compare actual source and artifact contents with their pins. Invalidate affected evidence and its dependents; keep independent evidence. Age alone does not invalidate evidence. Never refresh hashes without inspecting the change and repeating affected checks. Missing pins or dependencies require manual verification. Existing Markdown checkpoints remain valid for manual use.

Completed scope: no next action and no implicit authorization for new work. Recheck current permissions before any external action.
