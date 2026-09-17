---
name: design-to-code
description: Create or apply visual directions and mockups, implement product UI, and verify visual and interaction fidelity. Use for new art direction, image mockups, prototypes, reference-driven screens and UX audits; preserve an already approved direction.
---

# Design to Code

An approved mockup is a visual contract. Do not “improve” its direction without a request. Product, accessibility, and security constraints still apply; make a conflict visible rather than hiding it.

## Select the design mode

For a new direction or requested image mockups, read [visual creation](references/visual-creation.md): brief → targeted research and synthesis → visible alternatives → user selection → selected mockups → prototype → implementation and comparison. Image generation depends on an available host tool; DevMethod does not bundle one. Keep choices and evidence in the existing mission/design record.

For an approved reference, continue directly below without reopening the direction.

## Execution

1. Read and actually view the reference: screen/version, viewport, tokens, hierarchy, content, media, and states. If it is missing, find the referenced asset; do not invent its geometry or a fidelity verdict.
2. Identify the journey, primary action, and required states. Read [the UX contract](references/ux-contract.md).
3. Extract existing tokens and primitives: typography, semantic colors, spacing, grid, borders, radii, shadows, and iconography. Preserve the existing UI library.
4. Map reference → components → data → interactions. Separate neutral primitives from business components; create only what the screen needs.
5. Implement required real behavior and useful empty/loading/error states. For a changed layout or interaction pattern, inspect the first representative slice in a browser before extending it across screens. This is an implementation review, not another approval gate. Label prototype fixtures; never leave a button that shows fake success.
6. Render in a browser and compare at the same desktop/mobile dimensions. Check legibility, scrolling, interactions, keyboard, and focus. A green compilation does not validate appearance.
7. Correct priority gaps and report checks actually performed, using relevant fields from [the record](assets/UI_ACCEPTANCE.md) in existing scope notes when useful. Never claim “pixel perfect” or “100% faithful” without a measurable basis.

If the request concerns React, resolve `react-feature-engineering` only for implementation. This skill imposes no framework, palette, or shared style across projects.
