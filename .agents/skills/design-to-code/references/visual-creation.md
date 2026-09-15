# Create a visual direction

Use this procedure during `project-foundation design` when the user needs a new visual direction, image mockups or a prototype. Skip creative exploration when an approved reference already exists. It is part of the existing six-module kit, not a new command or a bundled image service.

## Brief and alternatives

Read the product outcome, audience, primary journey, constraints and any supplied references. View referenced images before describing them. Reuse brand tokens and assets where established. Record only missing decisions in the canonical mission/design record. If no product is specified for a demonstration, identify the fictional assumption before producing assets; never apply it to a real product without a request.

For an open direction, first inspect relevant usability/accessibility evidence and current primary design examples for this audience and journey. Record consulted sources and dates, separate established guidance from aesthetic trends and your own hypotheses, and explain which decisions they inform. Do not claim scientific validation, user testing or a universal trend from attractive examples; missing research access limits those claims.

The default new-direction workflow produces exactly three creative alternatives as generated images of the same representative screen with the same content, unless the user explicitly requests a different count or format. Make the alternatives differ meaningfully in composition, information hierarchy or interaction emphasis as well as visual language; palette swaps on the same layout are insufficient. Explain hierarchy, typography, density, imagery and the user need each approach supports. Resolve the requested count and format once and preserve them through the master and derivatives. When generated images are in scope, check image-tool availability before claiming this stage can be delivered. If unavailable, leave image generation unfulfilled; an HTML/SVG preview may support discussion but is not a silent substitute for the required images. An approved identity or a bounded change skips new-direction exploration.

Request the user's choice on the visible alternatives; continue independent work while waiting. Unless selection was explicitly delegated, do not infer a choice from elapsed time, a default option or silence. Do not invent research or call a proposal approved.

## Master screen and page expansion

For a new product direction, keep three observable checkpoints within the existing `design` command: the comparable initial directions in the resolved count and format, a selected detailed master screen, then the key screens and states derived from that master. The master and derived screens are additional outputs, not replacements for the initial alternatives. An explicitly narrower user request retains its scope. These are natural-language scopes, not new CLI subcommands. Recommend `$project-foundation design` in Codex, or `/project-foundation design` in Claude Code/Cursor, with the next unfinished visual scope until the requested design work is complete; do not jump to architecture merely because a style direction was selected.

Use the same representative screen and content for the alternatives. After selection, finalize that screen as the master and record its asset/version plus the user's approval or the decision made under an existing explicit selection delegation, with its source and scope. Do not describe an agent-selected asset as directly approved by the user. For generated-image deliverables, derive the requested pages or states using the actual master image as tool input together with its shared tokens, components and copy. A prose style description alone is not evidence of reference-conditioned generation. For an explicit HTML/SVG or other non-raster workflow, reuse the actual selected artifact and its tokens for the derived screens; do not impose image generation or claim image-conditioned provenance. Map every requested page/state to its output file and master version in the existing record. Do not invent routes to turn states of a small app into a larger product.

Inspect cross-screen consistency and behavior before implementation. Reuse existing approvals and selection delegations for unchanged decisions; resolve additions outside their scope before treating them as accepted. Preserve page-specific content while sharing the master hierarchy, type, palette and components. When documenting a demonstration, distinguish generated page images, implemented screens and captures; do not present images generated after the code as proof that those images guided that earlier code.

## Selected mockups

After selection, record the chosen asset/version and any requested changes. Use an available image tool and its skill when raster mockups or generated illustrations are requested; check actual tool availability rather than promising that installation provides it. If requested image tooling is unavailable, report that the image step is unfulfilled; an explicit non-image workflow has no missing-image blocker. A prompt for an external tool is a handoff, not a generated image. Offer an appropriate HTML/SVG preview if useful, without presenting it as fulfilment of an explicit image request. Paid tools and external mutations follow the session's permissions.

Generate the key screens at agreed desktop/mobile sizes with real intended copy and necessary states. Inspect every output for legibility, omitted controls and invented content. Save project-bound selected assets in the project, with prompt, tool, version and source/reference paths linked from the design record. Preserve previous versions. Image metadata and synthetic content must not imply real product data. Correct image text in the design contract when needed; a raster image is not the authoritative specification for behavior.

Ask for approval of the selected detailed mockup before treating it as the implementation reference, unless that selection was already delegated. A direction choice alone does not approve unexpected additions in a later generated screen. Approval can be an explicit request to implement that visible version; no ceremonial extra approval is required. Do not create one document per stage.

## Prototype and implementation

For a new interactive product, follow the master and derived screens with a small working prototype of the primary journey, unless the user requested image-only/design-only output. Scope its data and integration honestly; it need not have the full backend. Keep a requested prototype, its real browser checks and the later production implementation distinct. Product or architectural uncertainties may be investigated alongside design without marking unfinished design as accepted.

Define intended behavior and empty/loading/error states independently of image appearance. Use a minimal interactive prototype when interaction needs validation; it may become the implementation rather than a throwaway copy. Label fixture data and simulated states. Controls must perform their declared behavior; do not fabricate success, network calls or persistence. For a reading tracker, a “Lire” control needs an actual reading destination; use “Commencer” for changing status instead of implying full books are available.

Pass the approved reference, tokens, exact content, states, assets and criterion IDs into the main design-to-code execution. Reuse the project's stack and components. Resolve differences between the mockup and product/accessibility constraints explicitly, keeping user authorization current.

## Fidelity and resumption

Capture actual browser output at reference viewport sizes. Compare reference and implementation for hierarchy, layout, type, colors, assets, copy and state. Test the main interaction, keyboard/focus, mobile overflow and relevant failure recovery separately. Attach observations and reference/capture paths to existing criterion evidence; name mismatches and corrections. Do not claim pixel-perfect output from compilation, DOM tests or image generation. A preview alone is not a browser verification.

On resume, load the chosen reference/version and current code, not every rejected direction. A changed reference or implementation invalidates affected visual evidence. A deliberate mismatch in a disposable evaluation can test whether the review detects it; restore the intended design and recheck before acceptance. Report selection, generation, prototype, implementation and visual verification separately, including unperformed steps.
