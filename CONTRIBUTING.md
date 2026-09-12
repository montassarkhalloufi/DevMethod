# Contributing

Read this file and the accepted decisions in docs/ before changing the kit. Preserve existing project policy, accepted decisions and permissions. Keep examples fictional and modules independent of a specific business, tracker, provider or stack.

Use Node.js 22+, npm and strict TypeScript for the installer. Run `npm ci`, `npm test` and `npm pack --dry-run`. Commit generated dist/ alongside src/ so GitHub installation requires no build hooks or development dependencies. Review the full diff for private references, secrets, licensing and unintended files. Never describe document checks or simulated agent runs as native Claude Code/Cursor validation.

Keep each change in one coherent commit after checks, without rewriting published history. npm publication requires an authenticated maintainer: run the checks, inspect `npm pack --dry-run`, then `npm publish --tag next --access public`. Do not publish unverified compatibility claims or use the stable tag for this candidate.

Keep commands, documentation and tests consistent. Record architecture changes in an ADR. Public releases require maintainer review of the exact candidate. There is no deployment, paid service, telemetry, automatic update or migration in this repository.

Platform installation checks run on Linux, macOS and Windows through .github/workflows/platform-tests.yml. They test the packaged CLI, not authenticated coding-agent behavior. Record the workflow run and job conclusions before claiming an operating system passed.
