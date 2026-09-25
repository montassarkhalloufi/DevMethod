# Atelier — design and browser acceptance

Working audience: a creator making product decisions with agents. Primary action: try the same situation in materially different behaviors, inspect consequences, retain a reason, then change a need without losing it. Fictional data; no avatar or automatic agent-progress theater. Existing CLI/review UI remains unchanged.

## Earlier editorial direction and hypotheses

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

The earlier editorial implementation used local system sans and Georgia, without network font dependencies. Its tokens were: paper `#faf9f5`, ink `#182e2b`, green `#164d3e`, borders `#d8dfd9`; warm refusal uses words plus color. Accent text in imported data is not injected as CSS. Images are references, not required runtime assets.

Browser observations, errors and actual viewport checks are recorded in [RESULTS](RESULTS.md). The records distinguish capability, visual inspection and missing real-user validation. No pixel-perfect verdict.


## Current direction — user-selected blue panels, 16 September 2026

The user subsequently supplied two visual references and explicitly preferred their clearer separation of blocks. They answered “comme dans les image que j'ai envoyé” when asked to distinguish the light reference from the night-frame reference. The applied interpretation, announced before implementation, combines the second image's navy frame with the first image's separated white panels. This user selection supersedes the earlier agent-selected green editorial palette; no new image generation or design-choice confirmation was needed.

References actually viewed: `exec-c9035ed1-6fa2-4721-903a-2cf452f346a0.png` (light, separated blocks) and `exec-6670d707-e3e3-4e27-ad89-a2ed448a76aa.png` (navy outer frame, central products, intentions on the right). These are user-supplied design references, not browser captures or claims that their depicted functionality exists.

| Reference element | Implemented mapping | Boundary |
| --- | --- | --- |
| Navy frame and left navigation | Header and four anchors to the actual project, prototypes, situation and decision sections | No project library, fake progress indicator or invented route |
| White working surface | Central workbench containing distinct situation, prototype and decision panels | Actual data and controls remain visible; the page is taller than the illustrations |
| Framed prototypes with blue/cyan identities | Independent lane headers, bordered state groups, existing records/actions and explicit outcomes | Colours identify lanes, never replace success/refusal text; no invented dates or user avatars |
| Intentions at the side | Persistent desktop brief, collapsible constraints/questions and the real context editor | On narrow screens this follows the workbench; context remains directly accessible from the header |
| Compact creation affordance | Native “Ajouter un élément à essayer” disclosure with the existing creation form | The operation still creates actual local records and preserves its target selection |

The stylesheet replaces the previous palette/layout in one source, rather than layering a second theme over it. Current tokens: frame `#082540`, working surface `#f7f9fd`, panels `#ffffff`, ink `#122b49`, primary blue `#0868ed`, cyan `#38d5ee`, borders `#d6e1ee`. Typography uses local system sans. The existing data-supplied accent remains uninterpreted CSS. Desktop prototype data regions are independently scrollable and keyboard-focusable; mobile removes their internal height limit. Full constraints and architecture disclosures remain available.

### Observed QA on the blue implementation

Dedicated worktree server on port 4321, separate fictional session; the existing server and domain APIs were unchanged. Chrome was operated through the documented browser interface. Requested viewport sizes were 1536×1024, 1280×900 and 390×844; the browser's existing scaling yielded measured content widths of 1396, 1163 and 354 CSS pixels. Document scroll widths matched those measured widths in each inspected state. Temporary viewport overrides were reset afterward.

- Desktop: navy frame, left anchors, two bounded prototype panels and right intentions column visually inspected. Mobile: navigation becomes a single row, panels stack, context follows the workbench, and long native selects remain within their fields. Closed native selects truncate long labels; their options retain the full text.
- Actual journey: Nina's shared relecture was refused in the bureau and accepted among peers; a fictional item appeared in both lanes; a labelled QA choice was saved; revised intent marked it for reconsideration; reload preserved the item and choice. Sidebar context access and the creation disclosure worked.
- A real handoff file was prepared without launching an agent. Malformed JSON and a stale revision were rejected with the submitted text retained. The mobile error remained visible inside the dialog. No provider or proposal-generation call was made.
- A pre-existing focus defect appeared after preparing a request: the root rerender removed the dialog's original trigger, so Escape returned focus to the body. Stable trigger IDs and dialog-close restoration corrected it; repeating request → rejected import → Escape returned focus to `open-agent`. Canceling the replay dialog returned focus to `replay-trials` and retained the individual action.
- Simple mode retained targeted actions; a direct peer publication succeeded. The isolated variant route showed exactly one prototype. Keyboard Tab from its data region reached a real action with a visible outline. The inspected browser console contained no warning/error entries.
- Relevant verification: 16 domain/control tests and four HTTP/persistence tests passed; ESLint/Sonar at the existing threshold and Prettier checks passed. No tests were added merely to mirror colours or layout declarations.
- Independent review then found a creation-disclosure regression in simple mode: changing the target with an empty title closed the form and lost keyboard focus. The render now carries forward the actual disclosure state, independently of the draft title. A functional DOM test failed on the original code and passed after correction; it also checks that an intentionally closed form stays closed with a saved draft title. The resulting 17 domain/control/UI tests, targeted lint and formatting checks passed. In Chrome, changing a focused target select kept the empty form open and focus on `create-variant`; explicit closure with a draft title survived an actor change. No warning/error entries were returned. The browser automation's `selectOption` alone does not focus an initially unfocused select, so the focus check first clicked the real control.

These are agent-operated rendering and functional observations, not a target-user usability study, accessibility certification or a pixel-perfect claim. Screenshots were inspected during the browser session; they are not substituted for the supplied references. Functional completeness required preserving the real multi-state data rather than copying the illustrations' shortened article cards or decorative navigation.
