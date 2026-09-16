# Atelier — design and browser acceptance

Working audience: a creator making product decisions with agents. Primary action: try the same situation in materially different behaviors, inspect consequences, retain a reason, then change a need without losing it. Fictional data; no avatar or automatic agent-progress theater. Existing CLI/review UI remains unchanged.

## Evidence and creative hypotheses

The [research](RESEARCH.md) supports investigating intention and control; it does not prove this composition works. Replit already uses side-by-side alternatives; Figma offers direct annotations/properties. Retain familiar native selects, explicit action buttons, named states and source/context disclosure. These are conventions, not a novelty claim. The two-column composition, serif hierarchy, warm paper and forest green are **creative hypotheses** intended to keep the product and consequences more prominent than method stages. Text and icons accompany status colors. Responsive stacking, visible focus and native dialogs are implemented constraints, not proof of assistive-technology conformance. No target-user visual study was conducted.

## Three generated alternatives and delegated selection

Generated with the available image-generation tool, 2026-09-16, same Gazette comparison brief. The user explicitly delegated reversible product/design selection and instructed us to prototype the most promising proposal.

| Direction | Hierarchy / density / imagery | User hypothesis and tradeoff |
| --- | --- | --- |
| [Editorial](design/direction-editorial.png) | Light paper, serif project title, paired product windows, compact consequence and decision rows; minimal imagery | Put products before orchestration. More calm space, less visible chronology. **Selected by agent under delegation, not directly user-approved.** |
| [Stage](design/direction-stage.png) | Dark framing, central rehearsal space and timeline; contrast separates scene from controls | Emphasize sequence and repeated trials; risk of dashboard density and decorative theater. |
| [Notebook](design/direction-notebook.png) | Persistent context column, cobalt workspace, notes beside experiments | Make rationale continuously available; narrower products and competing reading tasks. |

Master: [master.png](design/master.png), generated using the selected editorial image as actual reference input. Prompt requested an experimental Atelier header, Gazette objective, shared actor/record/action controls, two board/list prototypes, outcomes, design/architecture disclosure, choice/reason, local-fiction notice and honest exploration handoff. No background agent connection was claimed.

Derived states: [context-mobile.png](design/context-mobile.png), generated from the actual master, covering context editing and a 390px-style stacked viewport. It arrived **after initial UI construction**; it is a consistency reference for inspection/correction, not evidence that it guided earlier code. All images are synthetic design assets, never browser captures.

## Corrections to image content and mapping

The image invented article dates and a single publishing editor, despite the intended brief. The executable seed instead has three explicitly fictional articles, two authorized publishers in the bureau, four named actors and no dates or real publication. Sam is not a contrived losing actor: Nina's relecture demonstrates a real difference. A document changes only local state. The master does not override these rules.

Topbar/project → `index.html` and project header; shared situation → controls; product windows → lane/record views; context → native dialog; decision → snapshot of reason/context/observations; exploration → request file plus JSON import. Board uses two state columns at wide sizes and stacks on narrow screens; list uses compact rows. Four/five states and complete disclosed assumptions make the actual page taller than the mockup. This deliberate departure favors legibility and genuine state coverage over squeezing all content into one screen.

Fonts are local system sans and Georgia; no network font dependency. Tokens: paper `#faf9f5`, ink `#182e2b`, green `#164d3e`, borders `#d8dfd9`; warm refusal uses words plus color. Accent text in imported data is not injected as CSS. Images are references, not required runtime assets.

Browser observations, errors and actual viewport checks are recorded in [RESULTS](RESULTS.md). The records distinguish capability, visual inspection and missing real-user validation. No pixel-perfect verdict.
