# ADR 001: Portable skill distribution

Status: accepted, 2026-09-12.

Distribute six Markdown skills with a strict TypeScript installer compiled to JavaScript. Require Node.js 22+ and npm, with no runtime dependencies. Store the source skills in `.agents/skills`; install one chosen host profile. Keep one copy of each skill per project to avoid ambiguous discovery. Commit dist/ alongside src/ so GitHub installation requires no build hooks. Use a lockfile for development dependencies.

The fourteen workflow stages are arguments to the project-foundation skill. They are model instructions, not deterministic executable commands. Native host permissions and project decisions remain authoritative. A next-command suggestion never grants execution permission.

Claude Code and Cursor each have a native installation profile. Format compliance and authenticated behavioral validation are separate gates. Personal interface metadata and icons are excluded. Installation conflicts fail before any file is written; existing project instructions must be merged intentionally.

The init command chooses a host and optional modules, always includes project-foundation, and defaults to the current project. Non-interactive calls require an explicit host. Include a separately named MIT notice and reject symbolic paths and duplicate host copies. Install into directories that are not being concurrently modified: rollback covers files and directories created by this process, not concurrent external changes or process termination.

Installation is offline after npm obtains the package. No telemetry, model call, credential storage or deployment is introduced. GitHub installation and npm registry publication are separate; registry publication requires maintainer authentication. Upgrade through a staging directory and intentional review of differences. Project context is never migrated automatically.
