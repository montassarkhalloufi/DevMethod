# DevMethod 0.1.0

Status: PRs #6–#10 merged; integrated validation and authorized npm publication in progress. This page is the current release record. Earlier rc.2 and native-pilot documents describe their recorded revisions, not the current validation state.

## Supported release scope

- Six reusable skills for new and existing projects, with staged adoption that preserves existing instructions, decisions and local customizations.
- Offline installation for Codex, Claude Code and Cursor folder layouts; diagnostics and read-only update comparison, including conflicts.
- Optional mission/context records, explicit provenance, Git-aware freshness checks and compatible checkpoint resumption.
- Read-only task planning with dependency, ownership and recovery checks.
- Optional stack profiles and a fictional runnable Next.js/NestJS/PostgreSQL example.

The CLI has no runtime dependencies. Agent execution, framework examples and native benchmark scripts have separate prerequisites. General automated task dispatch is not a stable CLI capability. Native Codex adapters remain experimental: inherited host configuration and interrupted usage reconciliation are unresolved. A complete repeated BMAD comparison is not available; no comparative superiority claim is part of this release.

## Adoption

Build and inspect the source checkout:

```sh
npm ci
npm test
npm run check:docs
npm pack
node scripts/package-smoke.mjs devmethod-ai-0.1.0.tgz
node dist/cli.js init --tool codex --dest ../devmethod-staging
node dist/cli.js doctor --dest ../devmethod-staging --json
```

For an existing project, stage the installation, complete the project profile from actual sources, and compare its instruction fragments with the existing policies. Preserve application decisions, local skills and filled templates. Use `update-preview` before replacing an earlier kit. There is no automatic migration.

For a new project, fill the profile with the product scope, stack, verification commands and deployment permissions, then invoke `project-foundation` with the intended goal. An installed skill is guidance, not proof that a host used it correctly.

After authorized publication, the version-pinned command will be `npx --yes devmethod-ai@0.1.0 init --tool codex --dest ../devmethod-staging`. Until registry verification, use the reviewed checkout or its local tarball.

## Validation record

Local release verification passed: clean locked dependency installation, 72 core tests plus 18 greenfield checks, Markdown links, package inspection and extracted-tarball smoke for all three host layouts, a subset, customization preservation and mission/context/planning. Independent review reproduced the JSON-error regression and found no remaining blocker in the inspected public CLI changes. The final commit, archive digest and exact platform jobs are recorded separately in the repository release evidence and the release PR to avoid a self-referential archive hash. Publication still requires those exact jobs to be green; earlier CI runs are not substitutes.

Native evidence: [first bounded pilot](NATIVE-PILOT-RESULTS.md), [subagent adapter validation](CODEX-ADAPTER-VALIDATION.md). The follow-up campaign remains stopped with incomplete final usage; no model runs are necessary to package the supported CLI scope.

## Publication and rollback

The maintainer authorized PR merges and final npm publication after successful integrated validation on 2026-09-13. PRs #6–#10 are merged. GitHub write mutations failed during the merge sequence; normal Git merges and non-force fast-forward pushes completed it, and GitHub confirmed every PR merged. ADR proposals remain proposals until maintainer acceptance.

For a reviewed final version, publish the exact verified archive rather than repacking a changed checkout. Select the npm tag explicitly after maintainer approval. Verify the registry version, integrity and installation afterward. Retain the prior package as a rollback reference; users choose when to adopt and reconcile their own files.

## From-zero application validation

[Pocket Tasks validation](GREENFIELD-VALIDATION.md) records a new project built from a frozen brief, independent review and API acceptance, real browser interaction, and a method improvement derived from a discovered defect. This is separate from the incomplete BMAD campaign.
