# DevMethod

From idea to delivery with your AI coding agents.

**New to the project?** Start with the [maintainer and user learning portal](docs/START-HERE.md),
which connects the product promise, method, illustrated Studio guide, architecture, code map,
testing and release responsibilities.

A reusable method for human–AI collaboration, organized around missions and supported by verification evidence. Start from a need, discuss important decisions, implement a bounded scope, and preserve what was checked and what comes next.

**The human sets the direction, agents execute, and evidence informs the decision.** Humans define goals and constraints, arbitrate consequential trade-offs and retain responsibility for authorizations. Agents carry out the authorized work, surface uncertainty and prepare reviewable outcomes. Reuse valid authorization instead of repeatedly interrupting routine work; ask at a meaningful decision boundary with concrete evidence. Automated checks and bounded loops support this collaboration without proving that the goal, tests or architecture are sufficient.

**[▶ Watch the review interface in action — 73 seconds, French voice and subtitles](#review-your-changes-and-open-the-report)** · [What the recorded example demonstrates](docs/media/review-r02/README.md)

[![npm](https://img.shields.io/npm/v/devmethod-ai?label=npm)](https://www.npmjs.com/package/devmethod-ai) [![license](https://img.shields.io/npm/l/devmethod-ai)](LICENSE) [![platform tests](https://github.com/montassarkhalloufi/DevMethod/actions/workflows/platform-tests.yml/badge.svg)](https://github.com/montassarkhalloufi/DevMethod/actions/workflows/platform-tests.yml)

## Watch DevMethod build Lisière, then inspect a review — 4 min 03 s

[![Play the extended 4K demo: Lisière and the review interface](https://raw.githubusercontent.com/montassarkhalloufi/DevMethod/main/docs/media/visual-chain/video-preview.jpg)](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/visual-chain/devmethod-du-besoin-au-produit-4k.fr.mp4)

**[▶ Watch the video — 4K, French narration](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/visual-chain/devmethod-du-besoin-au-produit-4k.fr.mp4)** · [Subtitles and execution evidence](docs/media/visual-chain/README.md) · [Download the working prototype](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/visual-chain/lisiere-visual-source.zip)

**Existing Lisière film, extended with the new review interface.** The original footage is retained, with an added narrated chapter showing real interface captures and a clearly fictional review example.

**Concrete example: Lisière, a personal reading library.** Start with an idea, compare three visual directions, approve a master screen, derive the other screen images, choose a suitable architecture, then build and verify the application.

| Step shown | Concrete result |
| --- | --- |
| Explore and frame | Add books, filter readings and track three statuses |
| Design | Three alternatives → selected editorial master → add-book and completed-reading images |
| Architecture | HTML/CSS/JavaScript, testable book rules and browser-local storage |
| Plan, ready and implement | Working form, filters, status changes and saved books |
| Review and verify | Corrected alert/focus behavior, 6 tests and real Chrome desktop/mobile journeys |
| New review chapter | Find and filter findings, inspect evidence/corrections, distinguish coverage, inspect sources and export |
| Integrate and handoff | Local prototype, references, evidence and resumption context |

The video uses illustrative Codex commands with real generated images and recorded application interactions. DevMethod guides the coding agent; image generation requires an available host tool. The visual workflow is included in npm 0.2.0. [Follow the visual workflow](docs/VISUAL-WORKFLOW.md).

![DevMethod workflow](docs/images/devmethod-flow.svg)

DevMethod provides fourteen installable `devmethod-*` stage adapters. Native discovery and skill-menu visibility depend on the host and remain separately evaluated in [compatibility evidence](COMPATIBILITY.md). The six procedure modules and existing `project-foundation <stage>` invocations remain supported.

A reusable workflow for taking a software project from exploration to delivery: decisions, UX, architecture, tickets, development, tests, review and handoff. Six focused skills support fourteen workflow stages, each ending with evidence, limitations and one suggested next command.

**DevMethod Studio 0.6.0-beta.1 integration candidate.** It combines the 0.5 evidence hardening with the experimental local Studio, while keeping native-host, browser, connector and comparative claims limited to their recorded evidence. [Hardening scope and evidence](docs/HARDENING-0.5.md) · [Studio scope and limits](docs/STUDIO.md) · [Behavioral evaluation](evaluation/behavioral/README.md). This is an integration candidate, not a published stable release; check the registry and exact release evidence before assuming availability.

For solo developers and small teams using coding agents, from a new prototype to changes in an existing repository. Requires Node.js 22+ and npm; Git is required for context provenance. Application examples have separate framework/database prerequisites. DevMethod records scope, decisions and verification; it does not certify agent output, infer all dependencies, deploy applications or run an autonomous backlog. Installation and deterministic fixture results are separate from native host validation. See [compatibility](COMPATIBILITY.md).

Start with [missions and the tested source quick start](docs/MISSIONS.md), the [tested from-zero Pocket Tasks project](examples/pocket-tasks/README.md), then the [complete Next.js/NestJS example](examples/fullstack/README.md). Advanced references: [context and sizing](docs/MISSIONS.md), [safe updates](docs/UPDATES.md), [resumption](docs/RESUMPTION.md), [optional stack profiles](docs/STACK-PROFILES.md), [bounded manual planning](docs/ORCHESTRATION.md), [troubleshooting](docs/TROUBLESHOOTING.md), and [release status and evidence](docs/RELEASE-0.1.0.md).

## Why this method?

**Local creation experience: Studio (unpublished candidate).** [Open the Studio guide](docs/STUDIO.md) for the three working modes, visual choices, running application, editable code and isolated draft preview, version-specific checks, restart and export. The [recorded Les Ateliers example](examples/studio-ateliers/README.md) includes a real generation attempt, its failure and corrections, persistent registrations and a later waiting-list requirement. [Results and limitations](docs/missions/creation-experience/RESULTS.md) distinguish implemented behavior from an unproven comparative advantage. The local runtime supports React 19 / strict TypeScript / Tailwind and existing HTML/CSS/JavaScript apps with JSON data. The [typed React checkpoint](docs/missions/creation-experience/REACT-CHECKPOINT.md) records editable Monaco source, controlled compilation and versioned Vercel guidance. Cloud deployment, authentication and arbitrary framework builds are not provided.

[Import an existing project](docs/STUDIO-IMPORT.md) as a separate, sourced baseline; unsupported runtimes remain editable and exportable as source snapshots. The [tools and services catalog](docs/STUDIO-CONNECTORS.md) offers provider choices and host-mediated checks, with configuration, observed availability and application integration kept distinct. [Live plans and actions](docs/STUDIO-PROGRESS.md) show actual progress published by connected agents.

**Experimental branch: application evidence lab.** [Run the local product demonstration](docs/EVIDENCE-LAB.md) to challenge application checks against known healthy/faulty controls and recheck evidence after changes. This opt-in research extension preserves the existing workflow. [The comparison](evaluation/evidence-lab/README.md) reduced some misleading green results but also withheld healthy candidates and missed unrepresented faults; it does not establish general superiority.

**Experimental product research: Atelier.** [Try the local experience](docs/ATELIER.md) to compare behavioral alternatives, retain a decision and its observations, and exercise a real agent proposal after changing the need. [Three different conceptions and their prior art](docs/missions/product-alternatives/RESEARCH.md) challenge how DevMethod could work. The bounded prototype cannot represent every product; an independent scheduling context exposed that limit. No breakthrough or comparative user benefit is established.

DevMethod grew from its creator’s own AI-assisted development practice: making the same way of working reusable across projects. The creator did not know BMAD when the idea began and discovered it afterwards. That origin explains the project; it is not evidence of uniqueness or superiority.

The central unit is a **mission with an observable outcome**. Larger missions can use milestones and coherent tickets; small changes can stay inline. Discuss decisions before dependent work, keep uncertain plans conditional, connect acceptance criteria to executed checks, and leave a dated handoff. The method does not require sprints and can fit an existing team process.

BMAD explicitly describes agile AI-driven development and includes specs, epics, stories, sprint planning and retrospectives. Its current planning guidance is also proportionate and supports small changes. DevMethod shares several of those principles; this positioning does not claim that BMAD lacks decisions, evidence or resumability. See [BMAD’s own planning documentation](https://docs.bmad-method.org/plan/choose-a-planning-path/).

For visual work, DevMethod can guide comparable alternatives, an approved master image, derived screens and an interactive prototype when useful. Image generation requires a host tool. The review viewer separately exposes recorded findings, evidence, corrections, coverage and sources; it is not an annotation-and-approval tool for individual screens. Try one bounded task and assess clarity, evidence and ease of resumption. No comparative productivity or cost advantage is established.

### A design observation from practice

In the creator’s own trials, exploring generated images before requesting HTML led to visual directions they found more varied and creative than starting directly with HTML. This is a personal observation, not a measured advantage or a claim that image-first design is always better.

The workflow uses comparable alternatives for the same screen, an explicitly selected master, derived screens and a working prototype when interactions need validation. The image is a visual reference; actual content, responsive behavior, accessibility and implementation fidelity still need browser checks. For a product with an approved identity and established components, start from those references instead of reopening the visual direction. See [the visual workflow](docs/VISUAL-WORKFLOW.md).

## Use DevMethod in its own repository

In a Codex session opened on this source checkout, the skills already live in `.agents/skills/`. Invoke `$devmethod-status` to inspect the repository, or `$devmethod-review` with the changes you want reviewed. No `init` or npm installation is needed to use these skills. The root `PROJECT_PROFILE.md` is a distributable template; keep task-specific context in the conversation for a small task, or in an existing mission record.

To test the installer itself, use the committed CLI with a fresh destination outside the source checkout:

```sh
node dist/cli.js init --tool codex --dest ../foundation-staging --dry-run
```

Inspect the preview, then remove `--dry-run` to create the staging installation. Use a different fresh destination if it already contains divergent files. Keep the repository's existing skills and instructions; installing into `.` is unnecessary for this workflow. For development checks, see [Verify the source checkout](#verify-the-source-checkout).

If `npx --yes devmethod-ai@0.4.1 ...` reports `sh: devmethod: command not found` inside this repository, use `node dist/cli.js ...` instead. With npm 11.16.0, the matching root package satisfies that version request, but its executable link is absent; this failure was reproduced without a registry download. It does not establish whether the published package works. To test the published package, run the installation command below from a separate project directory.

## Install in a project

Requires Node.js 22+ and npm. Install into a fresh staging directory first:

```bash
npx --yes devmethod-ai@0.4.1 init --tool codex --dest ../foundation-staging
```

Choose `codex`, `claude` or `cursor`. If you omit `--tool`, an interactive terminal asks. For example:

```bash
npx --yes devmethod-ai@0.4.1 init --tool claude --dest ../foundation-staging --dry-run
```

Remove `--dry-run` to write. Select a subset with `--modules decision-architecture,scoped-delivery`; `project-foundation` is always included. Without `--modules`, all six modules are installed. The installer refuses divergent files and duplicate skills across host directories. It never edits AGENTS.md, CLAUDE.md or your package.json. Review the staging output, then merge only what the project needs.

The method candidate has no runtime dependencies and its installer makes no network requests after npm obtains the package. Studio and its React/TypeScript dependencies are distributed separately as `devmethod-studio`. To pin the final version, use `npx --yes devmethod-ai@0.4.1 init ...`. To pin a reviewed repository commit instead, use: `npx --yes --package=github:montassarkhalloufi/DevMethod#<commit-sha> devmethod init ...`.

Complete PROJECT_PROFILE.md with your real stack, commands, scope, deployment permissions and data requirements. Merge AGENTS.foundation.md into the project's existing instructions only after review. Claude Code reads CLAUDE.md: preserve its current content and, if the project has AGENTS.md, optionally add `@AGENTS.md` to import it. Keep existing accepted architecture decisions authoritative.

The installer includes `DEVMETHOD-LICENSE` so it preserves your application's LICENSE. Retain that MIT notice with redistributed copies. Repository-level release documents and the CLI are not copied into your application.

Installation copies the reusable method and blank templates, not another project's context. Preserve filled profiles, decisions, tickets and instruction files separately. Manifest hashes describe the initial installation; local template customization is expected to change them. To install elsewhere, run the CLI again.

## Verify the source checkout

From a reviewed source checkout:

```sh
npm ci
npm run lint
npm run format:check
npm test
npm run check:docs
npm pack --dry-run
node dist/cli.js init --tool codex --dest ../candidate-staging
node dist/cli.js doctor --dest ../candidate-staging --json
node dist/cli.js update-preview --dest ../candidate-staging --json
```

The method archive includes skills, adoption templates, the CLI/review runtime and small resources required by its commands. `init` copies the selected skills, templates and review support, preserving the application. Studio code, UI, compiler and runtime dependencies are excluded. Full documentation, labs and examples remain in the [source repository](https://github.com/montassarkhalloufi/DevMethod); documentation links in this README refer to that checkout. Standalone example applications declare their own dependencies.

**Two packages, one public repository.** `devmethod-ai` installs the method; `devmethod-studio` installs the local Studio independently. The split is an unpublished candidate and does not change existing registry releases. Build with `npm run build`, pack the method with `npm pack`, and pack Studio with `npm run pack:studio`. Install the reviewed local Studio archive, then run `npx --offline devmethod-studio --help`. The compatibility command `devmethod studio` works in the source checkout or when both packages are explicitly installed together; otherwise it explains the separate installation without downloading anything. See [distribution boundaries](docs/ADR-029-independent-packages.md).

## Inspect an adopted installation

From a reviewed source checkout, inspect an installed project without changing it:

```bash
node dist/cli.js doctor --dest /path/to/project --json
```

Doctor reports missing files, changes from the initial manifest and duplicate host copies. Customized profiles and skills produce warnings; they are preserved. It does not execute an agent or certify application quality. See [diagnostic codes and exit statuses](docs/DOCTOR.md).

## Choose the amount of process

The stages below are available entry points, not fourteen mandatory conversations.

| Path | Typical work | Expected process |
|---|---|---|
| Quick | Clear bug fix inside existing contracts | Inline readiness, implementation, focused verification and review |
| Standard | Feature spanning components or sessions | Ready slice, relevant contracts, checks and resumable evidence |
| Major | New product decisions or consequential architecture changes | Resolve decisions, split into slices, verify integration |

Risk and repository policy override apparent size. Reuse accepted UI, architecture and project context; only fill actual gaps. See [work sizing](.agents/skills/project-foundation/references/work-sizing.md) and [starter exercises](examples/README.md).

## Run the workflow

In Codex: select `$devmethod-status` or `$devmethod-review TASK-1`.

In Claude Code or Cursor: select `/devmethod-status` or `/devmethod-review TASK-1`.

After installation, these commands run the workflow in your agent without npx. For example, `$devmethod-review` inspects actual changes, runs relevant checks and reports findings; it does not merely open the viewer. Existing `project-foundation <stage>` syntax remains valid. Partial module installs expose only stages supported by the selected modules. See [command discovery and updates](docs/COMMANDS.md).

Select an action below and add its target. These are prompts to the skill, not shell commands or standalone `/verify` commands. They do not create a background autonomous loop.

| Action | Result |
|---|---|
| `devmethod-explore` | Dated research on existing solutions, uncertainty and next direction |
| `devmethod-frame` | Product scope, exclusions and success measures |
| `devmethod-design` | Visual directions, selected mockups and UX criteria; image tooling depends on the host |
| `devmethod-architecture` | Conversation and explicit choice/delegation before dependent detail |
| `devmethod-plan` | Useful scope discussion, conditional milestones and near-term tickets |
| `devmethod-ready TASK-1` | Readiness assessment before implementation |
| `devmethod-implement TASK-1` | Scoped code, tests and corrections |
| `devmethod-review TASK-1` | Evidence-backed inspection, structured findings, checks, sources and report |
| `devmethod-verify TASK-1` | Executed checks and remaining gates |
| `devmethod-integrate TASK-1` | Delivery under existing permissions |
| `devmethod-correct-course` | Resolve changed scope or blocked decisions |
| `devmethod-next` | Select the next authorized slice |
| `devmethod-status` | Current evidenced implementation status |
| `devmethod-handoff` | Resumable checkpoint |

See [research, decision dialogue and mission migration](docs/WORKFLOW-0.3.md). See the [full command contract](.agents/skills/project-foundation/references/operating-commands.md). A failed check returns to correction; a blocked gate leads to handoff or replanning. Tests, code review and native permissions remain necessary.

Projects explicitly adopting the [optional local guard](docs/ADR-012-local-execution-guard.md) can enforce the implementation, verification and local acceptance gates through `devmethod guard`. Two identical consecutive behavioral failures stop its session and preserve declared context for human reconciliation. This strict profile uses committed code and verified behavioral reports; it does not dispatch agents or merge PRs.

![DevMethod delivery loop: accepted references, implementation, verification and correction](docs/images/devmethod-delivery.svg)

## More recorded examples

[Detailed recorded Lisière chain](docs/media/full-chain-4k/README.md) · [Short Clair demo](docs/media/from-zero/README.md) · [Run Clair](examples/clair-from-zero/README.md). Clair is a separate from-zero example. The featured film retains the Lisière story and adds an explicitly separate fictional review example.

## Review your changes and open the report

https://github.com/user-attachments/assets/0dc7db4d-4789-47b7-a20b-1348049429c4

**[Download the MP4 — 1 min 13 s, French narration](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/review-r02/review-r02.fr.mp4)** · [Subtitles, chapters and provenance](docs/media/review-r02/README.md)

Follow R-02 in Réservation Lab: an unauthorized cross-building booking, its recorded test evidence, the proposed correction and the checks to rerun. Real interface captures with an animated cursor and French subtitles. This controlled exercise contains intentional defects; the finding remains open, with no verified correction.

In your coding agent, ask:

```text
$devmethod-review the current changes, then open the report
```

In Claude Code or Cursor, use `/devmethod-review` with the same request. The agent inspects the actual changes, runs relevant checks, records evidence-backed findings and justified impact, then generates the Markdown and interactive HTML reports from the real review JSON and opens the HTML. You do not need to launch npx, a terminal command or a server. The renderer is installed with scoped-delivery and runs locally with Node.js 22+.

For a small review without a requested report, the result can stay in the conversation. On a headless machine or if browser opening fails, the generated artifacts are preserved and linked with the opening limitation. Existing reports are never overwritten. See [review workflow and report delivery](docs/REVIEWS.md).

The screenshots below use clearly fictional data to illustrate the interface; your review uses actual project results. The separate terminal viewer remains available for manual use and demos, as described in the [review guide](docs/REVIEW-GUIDE.md).

[![Actual DevMethod review interface — fictional demonstration data](https://raw.githubusercontent.com/montassarkhalloufi/DevMethod/main/docs/images/review-interface-desktop.jpg)](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/review-r02/review-r02.fr.mp4)

*Static interface preview. Use the video player above to watch the R-02 walkthrough, which uses a separate controlled example. The linked MP4 remains available for download.*

**[Follow the review walkthrough](https://github.com/montassarkhalloufi/DevMethod/blob/main/docs/REVIEW-GUIDE.md)** · [JSON, Markdown and HTML example](https://github.com/montassarkhalloufi/DevMethod/tree/main/examples/review) · [Review chapter provenance](https://github.com/montassarkhalloufi/DevMethod/blob/main/docs/media/review-extension/README.md)

The example contains two fictional findings and three separate checks. Severity, confidence and resolution remain distinct. Sources show whether they were actually consulted. The same structured record produces the UI and reports; tickets reference stable finding IDs.

![Coverage distinguishes passed, failed and unexecuted checks](https://raw.githubusercontent.com/montassarkhalloufi/DevMethod/main/docs/images/review-coverage.jpg)

## Visual design and architecture

DevMethod connects art-direction selection, an approved master screen, derived image mockups and browser fidelity checks with technology and architecture decisions. Follow the [visual workflow guide](docs/VISUAL-WORKFLOW.md) and [recorded Lisière pilot](examples/visual-pilot/README.md). These capabilities are included in npm 0.2.0; npm 0.1.0 predates them. See the [0.2.0 release record](docs/RELEASE-0.2.0.md) for publication status.

## Included modules

`project-foundation`, `decision-architecture`, `design-to-code`, `react-feature-engineering`, `reliable-ai-integration`, `scoped-delivery`.

Use the modules your project needs. Adapt the workflow to your stack, architecture and delivery process.

## Where DevMethod can improve

The target is a compact engineering workflow for verifiable changes in existing repositories. BMad already documents adaptive planning, existing-codebase workflows and broader automation; DevMethod has not demonstrated parity or superiority. Read the [sourced comparison](docs/BMAD-COMPARISON.md), [prioritized roadmap](docs/ROADMAP.md), and [evaluation protocol](docs/EVALUATION.md). We aim to measure correct outcomes, honest evidence, context cost and reliable resumption under matched conditions.

## Demo material

The workflow illustration above is kept in the repository as an SVG so it remains reviewable and usable in dark mode. Try the [runnable bug-fix exercise](examples/README.md), which includes an intentionally failing baseline and an explicit task. It is a fixture, not a recorded model success. A real demonstration should preserve the observed failures, changes and checks; use the [native smoke protocol](COMPATIBILITY.md#native-smoke-protocol) to assess the host workflow.

## Verify and contribute

```bash
npm ci
npm run lint
npm run format:check
npm test
npm pack --dry-run
```

Read [CONTRIBUTING.md](CONTRIBUTING.md), [COMPATIBILITY.md](COMPATIBILITY.md), and the [release checklist](docs/RELEASE-CHECKLIST.md). Licensed under [MIT](LICENSE).

A bounded [native Codex pilot](docs/NATIVE-PILOT-RESULTS.md) now records actual fixture execution and independent review. It covers one matched B1 triple and two DevMethod probes, not a completed comparative campaign or general autonomous dispatch.
