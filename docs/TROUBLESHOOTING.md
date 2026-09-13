# Troubleshooting

| Symptom | Diagnosis and recovery |
|---|---|
| npm command lacks mission/doctor | Check the exact package version. rc.1 predates these commands; use the reviewed candidate checkout or tarball. |
| init reports Conflict | No writes were applied. Keep filled profiles/instructions; install the candidate into a fresh directory, then preview and select a manual diff. |
| doctor reports customization | Expected for adopted profiles and skills. Review the diff; do not overwrite to obtain a green status. |
| update-preview reports conflict | Both upstream and local content changed. Retain both versions, select hunks manually, back up first, verify and restore selected files if needed. |
| context capture fails on Git | Use a committed repository, inspect unsafe/symbolic or oversized tracked files, and keep provenance under the documented limits. Legacy checkpoints without Git remain available. |
| context becomes stale immediately | Saving a report may change status. Use an existing ignored evidence directory; create/ignore it before capture. |
| resume says reverify | Inspect changed pins, Git state and affected evidence. Repeat only affected checks; never refresh hashes to hide a stale result. |
| plan says needs-reconciliation | Inspect the interrupted task's actual worktree and checkpoint; do not start it again automatically. |
| host does not discover a skill | Confirm the selected host directory and SKILL.md, avoid duplicate profiles, read the fallback prompt in START_HERE.md. Installation alone is not native validation. |
| database fixture cannot run | Check Docker and the documented local port. Keep database/e2e tests blocked if PostgreSQL is unavailable; unit tests do not replace them. |

No CLI operation applies updates, changes project instructions, dispatches models or grants merge/publication permission. See the specific command reference for exit codes.
