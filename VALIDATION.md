# Release candidate validation

Date: 2026-09-12. Candidate: 0.1.

Executed `npm test`: strict TypeScript build and 7 Node.js tests passed. Coverage: three host layouts, six skill names and relative references, SHA-256 manifests, MIT notice, selected modules, dry-run without writes, identical installation, conflict rejection before writes, preserved project instructions, invalid arguments, duplicate host detection, blocked paths and symlink rejection.

`npm pack` produced the compiled CLI and skill payload without runtime dependencies. An actual offline `npx --package=<local-tarball> devmethod init --tool claude` installed all six modules successfully. Installation never migrates existing project context; customized templates normally differ from initial manifest hashes.

These checks validate installation and documentation; they do not execute a Claude or Cursor model. Native authenticated evaluations remain pending, as documented in COMPATIBILITY.md. The installer has been exercised on Linux; macOS and Windows runtime checks remain pending.

Publication target: https://github.com/montassarkhalloufi/DevMethod. This report covers the 0.1 candidate source and local checks, not a stable release certification. Native authenticated compatibility remains pending.
