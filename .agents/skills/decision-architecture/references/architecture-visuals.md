# Architecture visuals

Use for explaining or comparing an architecture through diagrams, including an accepted architecture that only needs a clearer representation. Match the requested audience, detail and delivery surface. A quick inline explanation can use rendered Mermaid; a polished illustrated reference calls for a deliberately composed graphic, not an unrendered code block. No new architecture choice, stack migration or multi-option design ceremony is implied by drawing an existing system.

## Establish what the diagram means

Read the current decisions/contracts and inspect supplied images. Separate the reference's graphic language from its topology: card hierarchy, icons, spacing, line styles and palette may guide composition; its databases, brokers or service count do not become requirements. Preserve approved project identity and explicit format choices.

Before layout, establish the components and the important connections from the accepted or explicitly proposed architecture. For each relevant connection identify its actual initiator, destination, purpose and synchronous/asynchronous meaning; identify data owners, external systems, trust boundaries and local transactions. Preserve this compact model in the editable source or an adjacent record linked to the decision/version, without creating another live requirements ledger. Resolve contradictions or label the affected assumption rather than hiding it in a plausible arrow.

An overview explains the main path and responsibilities. When the requested detail would make it crowded, add coherent views of the critical flow, data/ownership, deployment or failure recovery as relevant; do not require every view for every system. Keep component IDs, names, colors and meanings consistent across views. A security badge, cloud outline or broker logo does not establish authorization, network isolation, resilience or delivery guarantees. Explain unshown relevant details and link their owner rather than presenting a simplified overview as exhaustive.

## Compose a readable illustrated view

For presentation-quality output, default to an editable vector graphic such as SVG with a PNG preview unless the user or existing project requires another format. Preserve source plus rendered output when using another suitable diagram tool. Exact technical text and topology belong in controllable diagram/vector elements; generated decorative imagery must not become the authority for connections, labels or guarantees.

Use a clear title and status/subtitle, aligned component cards with consistent pictograms, restrained category colors, strong type hierarchy and adequate whitespace. Choose icons for recognizable roles; labels carry the exact technology and responsibility. Use existing authorized brand assets when useful, or honest generic symbols rather than distorted invented logos. Subtle fills or shadows may match the reference, but must not weaken contrast or obscure boundaries. Do not rely on color alone for meaning.

Route connectors with visible endpoints, arrowheads and enough clearance from cards and text. Prefer simple orthogonal routes when appropriate; minimize crossings and label meaningful protocols/events/actions close to their paths. Distinguish sync calls, async delivery and other required relationships using line style plus a concise legend. Direction denotes the actual action: an API handles cache fallback, a relay publishes committed outbox work, and a consumer acknowledges according to its contract. Bidirectional arrows should not collapse distinct actions whose order or ownership matters.

Lay out for the actual viewing size, not only at extreme zoom. Keep body labels, legend and annotations readable when embedded in the intended report or slide. Split an overloaded view instead of shrinking type until it fits. Include the captured decision/version and distinguish conceptual/proposed/accepted topology from deployed or measured behavior. Only include sizing, prices, SLAs and technology versions that the source supports; link estimates to their assumptions rather than decorating the graphic with unsupported assurances.

## Render, inspect and keep it portable

Produce the requested files and open their actual rendered output. Inspect at intended reading size for clipped labels, overlaps, ambiguous crossings/arrowheads, low contrast, missing icons/fonts and inconsistent legend meanings. Separately compare every material component/path and the relevant error/recovery flow against the source contract. XML validation, a file count or a successful renderer alone does not establish graphic quality or semantic correctness. Correct concrete defects and re-render affected views before claiming verification.

Keep sources, icons/fonts where permitted, view-to-decision references and rendered previews together with relative paths. Prefer self-contained assets over external URLs that break offline. When embedded in a complete study, inspect the diagram again on the rendered document page; a legible standalone PNG can become unreadable after scaling. Refer to the existing study and handoff workflow rather than inventing an exporter command.

If the required rendering or inspection capability is unavailable, state what was produced and what remains unverified. Do not substitute a text description for a requested illustration or claim source-only Mermaid/SVG was visually inspected. Diagram correctness and visual quality are separate from application, security, load or recovery verification.
