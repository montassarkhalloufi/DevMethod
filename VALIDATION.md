# Release candidate validation

## Diagnostics and workflow improvement candidate

Source change based on `758491c3e85621c6adae6b5c71d1b32c28a380af`; npm release pending. Local runtime: Linux x64, Node.js 24.19.0. The platform results below belong to the earlier candidate, not this change.

- `npm ci --ignore-scripts --prefer-offline`, `npm test` (strict TypeScript build and 16 passing tests), and `npm pack --dry-run` passed.
- The actual local tarball installed all three host profiles and their scoped-delivery subsets via offline npx. Packaged `doctor --json` returned healthy reports, and retained customized profiles with warning status.
- Doctor accepted a format 2 installation produced by the previous source CLI (29 recorded files), as well as the new payload (31 recorded files).
- Updated skill frontmatter passed the skill validator; local Markdown file links and `git diff --check` passed.
- The B1 exercise produced the expected two failing tests. A temporary reference implementation passed both, confirming fixture solvability. This was a fixture check, not an independent model or BMad benchmark.

The existing platform CI now also checks packaged diagnostics. Record that run's conclusions before claiming this change passed on macOS/Windows. Authenticated host behavior, matched comparative evaluations and npm publication remain separate pending gates. Review performed locally by the implementing agent; no independent review is claimed.

## Earlier 0.1 candidate

Date: 2026-09-12. Candidate: 0.1.

Executed `npm test`: strict TypeScript build and 7 Node.js tests passed. Coverage: three host layouts, six skill names and relative references, SHA-256 manifests, MIT notice, selected modules, dry-run without writes, identical installation, conflict rejection before writes, preserved project instructions, invalid arguments, duplicate host detection, blocked paths and symlink rejection.

`npm pack` produced the compiled CLI and skill payload without runtime dependencies. An actual offline `npx --package=<local-tarball> devmethod init --tool claude` installed all six modules successfully. Installation never migrates existing project context; customized templates normally differ from initial manifest hashes.

These checks validate installation and documentation; they do not execute a Claude or Cursor model. Native authenticated evaluations remain pending, as documented in COMPATIBILITY.md.

## Native operating-system results

[GitHub Actions run 34720121631](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34720121631) completed successfully for commit `0790845289eccfe4aa3cfd0fe9e849eeca11b0a7` with Node.js 22.23.2 on all three runners:

| System | Architecture | Unit tests | Packaged npx installations |
|---|---|---|---|
| Ubuntu | x64 | 7 passed | Codex, Claude Code, Cursor passed |
| macOS | ARM64 | 7 passed | Codex, Claude Code, Cursor passed |
| Windows Server 2025 | x64 | 7 passed | Codex, Claude Code, Cursor passed |

Each job rebuilt strict TypeScript, verified the committed build, packed the actual package and invoked npx against that tarball for each host. It checked all six installed modules and the SHA-256 manifest. Installation paths included spaces. This establishes the tested runtime combinations, not every OS version or an authenticated host session. Windows shell commands used Git Bash; PowerShell-specific interaction was not evaluated.

Publication target: https://github.com/montassarkhalloufi/DevMethod. This report covers the 0.1 candidate source and local checks, not a stable release certification. Native authenticated compatibility remains pending.
