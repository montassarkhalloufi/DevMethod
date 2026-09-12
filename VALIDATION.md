# Release candidate validation

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
