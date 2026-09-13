# Pocket Tasks — project profile

- Objective: complete the fictional local task-manager contract AC1–AC7 in BRIEF.md.
- Phase and scope: Standard greenfield implementation; no deployment, authentication, external services, purchases or worker commits.
- Sources and decisions: BRIEF.md and CONTRIBUTING.md supplied by owner, inspected 2026-09-13; docs/ADR-001.md records delegated implementation choice.
- Readiness: contract complete, no unresolved dependency; pre-implementation assessment retained in docs/MISSION.md.
- UI direction: light responsive local task workspace; no approved visual artifact supplied. Owner browser acceptance pending.
- Canonical code: this isolated `greenfield-v1/project` repository/worktree; working tree implementation, uncommitted by instruction.
- Stack: Node.js >=22 built-ins; npm scripts; HTML/CSS/browser JavaScript; zero dependencies and no lockfile needed.
- Boundaries: pure validation, serialized file storage, HTTP composition, browser UI. Single process owns the chosen task JSON file.
- Commands: `npm start`, `npm test`; PORT and DATA_FILE optional for startup.
- Risks: invalid input must not mutate state; persistence and failure recovery; HTML-looking titles; keyboard/narrow rendering; concurrent writes in one process.
- Data: fictional user-entered titles stored locally until deletion; no secrets used, retention/backups controlled by local operator.
- Integrations: loopback HTTP API defined in BRIEF.md; no cloud integration.
- Rendering: static public assets with interactive client; fixed allowlist, textContent title rendering.
- Policy and budget: no model child runs, no remote CI, no publication or commits by implementation worker. Loopback execution authorized for checks; no financial spend.
- Skills loaded: installed `.agents/skills/project-foundation`, `decision-architecture`, `scoped-delivery`; installer provenance and integrity in local DevMethod manifest. Other modules not relevant to this vanilla local app.
- Assumptions: single-user/process filesystem is sufficient as explicitly permitted; revisit for multiple concurrent server processes.
- Next independent action: owner acceptance/browser verification of PT-1; no unrelated feature backlog.
