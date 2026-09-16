# Vercel guidance provenance

Imported for DevMethod at the user's explicit request on 2026-09-16. The three
skill directories are unmodified upstream files, verified byte for byte against
`vercel-labs/agent-skills` commit
`063bee94c3f4df8453406c830b0a7df0f2860278` (91 files).

- [Agent Skills source](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills).
- [Pinned upstream README](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/README.md) declares MIT; exact copy: `upstream-agent-skills-README.txt`.
- Full MIT terms and attribution: `LICENSE-agent-skills.txt`. Upstream provides no separate root LICENSE or copyright line at this pin; the notice explains that distinction.
- [Web Interface command](https://github.com/vercel-labs/web-interface-guidelines/blob/e3d624baaf29dc1fc645aff3e38f03e564d2d6b1/command.md) is preserved as [command.md](web-design-guidelines/command.md).
- Its [upstream MIT license](https://github.com/vercel-labs/web-interface-guidelines/blob/e3d624baaf29dc1fc645aff3e38f03e564d2d6b1/LICENSE), including Copyright (c) 2025 Vercel Labs, is preserved byte for byte as `web-design-guidelines/LICENSE.txt`. The exact README is `upstream-web-interface-README.txt`.

`MANIFEST.json` records repository, full commit, upstream path, byte count and
SHA-256 for each copied source and notice. DevMethod's wrapper and this policy
are adaptations and are not represented as unmodified Vercel guidance.

## Applying and updating

Read the local pinned command, not `main`. The unchanged upstream
`web-design-guidelines/SKILL.md` says to fetch the latest command; **this local
version policy supersedes that instruction**. A network failure does not prevent
reading the distributed reference and must not be reported as a completed review.

Rules applicable to the installed framework/version and changed surface are
required. Explain material exceptions, retain the approved design and user
authorizations, and distinguish a static review from observed runtime behavior.
Next.js, React Native, hosting and deployment remain conditional; no additional
framework or service is imported by this skill.

Updates are explicit dependency changes: review upstream differences, licensing,
compatibility and behavior; then replace the selected files, retain notices,
regenerate hashes and run affected checks. Do not silently replace this pin.
These files are guidance, not a benchmark or evidence of DevMethod superiority.

## Known upstream reference defect

At this pin, `react-best-practices/AGENTS.md` has three links without their
`rules/` prefix: `async-defer-await.md`, `async-cheap-condition-before-await.md`
and `server-hoist-static-io.md`. The rule files are present in `rules/`. Vendor
bytes remain unchanged; DevMethod's documentation checker resolves only these
three exact targets in that directory. Other missing links remain errors.
