# Compatibility evidence

Historical platform assessment date: 2026-09-12; those results apply only to their recorded revision. Release status: [published 0.2.0 validation](docs/RELEASE-0.2.0.md), [published 0.1.0 validation](docs/RELEASE-0.1.0.md); [rc.2 validation](docs/RC2-VALIDATION.md) remains a historical record. Target: local project skills, not every cloud or chat product carrying the same brand. Packaged installation passed on native Linux x64, macOS ARM64 and Windows Server 2025 x64 runners with Node.js 22.23.2; see [the operating-system results](VALIDATION.md#native-operating-system-results). These results do not establish authenticated coding-agent behavior.

| Host | Export directory | Invocation | Evidence |
|---|---|---|---|
| Codex | `.agents/skills/<name>/SKILL.md` | `$devmethod-status` (legacy `$project-foundation status`) | Local payload/export tests; method exercised with Codex in this session |
| Claude Code | `.claude/skills/<name>/SKILL.md` | `/devmethod-status` (legacy `/project-foundation status`) | Official format reviewed; export tests; authenticated native session pending |
| Cursor Agent | `.cursor/skills/<name>/SKILL.md` | `/devmethod-status` (legacy `/project-foundation status`) | Official format reviewed; export tests; authenticated native session pending |

The earlier validation environment lacked native executables/credentials. On 2026-09-13, version probes found Codex CLI 0.147.0 and Claude Code 2.1.238; Cursor CLI was not found on PATH. The subsequent delegated pilot executed six authenticated Codex invocations; see [reviewed native results](docs/NATIVE-PILOT-RESULTS.md) for the narrow fixture coverage, budget stop and incomplete comparison. Passing installer tests does not prove host discovery, model behavior or UI command completion. No Claude Code or Cursor version is claimed as runtime-tested. Therefore these profiles are provisionally compatible, not certified end-to-end.

Official references: [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code memory](https://code.claude.com/docs/en/memory), [Cursor skills](https://cursor.com/docs/skills), [Codex skills](https://developers.openai.com/codex/skills). A host version or organization policy may change discovery or execution.

Version 0.4.0 adds discoverable stage adapters; [current command validation](docs/COMMANDS-VALIDATION.md) distinguishes installation checks from unverified menu discovery and model execution. Historical native results above do not validate these new adapters.

## Native smoke protocol

Run separately in authenticated Codex, Claude Code and Cursor Agent sessions. Use a disposable local repo with only the chosen profile. Record date, exact host version, model, discovery result, commands, artifacts read, actual check output and observed next commands. Redact credentials and personal data. Keep the evaluation transcript local until reviewed for publication.

1. Create a fictional ticket DEMO-1 with an explicit unmet dependency, a local-only delivery scope and a documented test command. Invoke `ready DEMO-1` through the qualified skill command. Verify the dependency is read and blocks implementation without edits.
2. Invoke `status`, then an unknown stage. Verify status reflects the files and the unknown stage lists available stages without starting implementation.
3. Resolve the dependency explicitly. Invoke `ready`, `implement`, `review` and `verify` with the ticket argument. Independently inspect file changes and executed tests. Seed a failing assertion: verify must report failure and suggest correction, not integration.
4. Correct the assertion or implementation as justified, repeat review and verify, then invoke `integrate` with local-only scope. Verify it prepares a candidate without claiming merge or deployment.
5. Invoke `handoff`, reopen a session and invoke `next`. Verify the checkpoint and real files are read; completed scope must not invent new work.
6. For a complete host evaluation, additionally run `explore`, `frame`, `design`, `architecture`, `plan` and `correct-course` on a fresh fictional brief, preserving each output and its one qualified next command.

Read the project's CONTRIBUTING and accepted decisions throughout. Evaluate all fourteen stages before marking full native workflow coverage. An absent discovery entry, broken relative link, unexecuted check reported as passed, forbidden write or unexplained permission expansion is a failure, not a cosmetic issue.

Version 0.4.1 installs the offline report runtime with scoped-delivery. Tests execute it in all three exported layouts under CommonJS, ESM and package-less projects, intercepting only the OS-opening boundary. These tests validate report generation and dispatch, not native menu discovery or graphical browser rendering. See [release details](docs/RELEASE-0.4.1.md).
