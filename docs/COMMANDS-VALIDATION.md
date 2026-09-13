# Command validation

Candidate: 0.4.0, based on main 18e003f. Date: 2026-09-13.

Local checks on the candidate worktree: `npm ci --ignore-scripts`, `npm test` (95 passed), `npm run test:greenfield` (24 passed), `npm run check:docs`, skill-creator quick validation (14 adapters), `npm pack --dry-run`, and packed smoke tests passed. HTTP fixture tests required permission to bind localhost outside the filesystem/network sandbox; no assertion was bypassed.

Packed smoke used the actual npm 0.3.1 archive as its migration baseline. Full Codex/Claude/Cursor installations include all 14 adapters and the review format reference; hashes, subset installation, read-only diagnostics and local-customization conflicts passed. The legacy profile and customized foundation bytes remained intact. The public CLI still presents results rather than performing review.

Release CI and registry results are attached to the corresponding PR/GitHub release after execution. This file records local candidate evidence, not a prior assertion of remote success.

Manual instruction inspection: each adapter executes its named stage using the existing contract, preserves arguments and authorization, and does not automatically run the suggested next stage. Review points to the installed procedure and format; it distinguishes actual inspection from optional CLI rendering. Existing architecture dialogue, conditional plans, exploration and design rules remain in their owners.

Limits: no fresh authenticated Codex, Claude Code or Cursor invocation or menu-discovery check has been run for these adapters. File links, frontmatter and install checks alone do not establish conversational behavior. Existing comparative studies do not measure this release.
