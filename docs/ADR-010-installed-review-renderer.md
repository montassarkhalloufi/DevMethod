# ADR 010: Complete review delivery with an installed renderer

Status: accepted under the user's request to fix review generation/opening and update GitHub/npm documentation, 2026-09-13.

The previous adapter stopped at findings when the separate CLI was unavailable. Install a narrow report entry point and its existing renderer dependencies with scoped-delivery. This directly completes the requested interaction using the accepted offline HTML design. Asking the user to launch npx is no longer the primary workflow. A runtime download on every review would retain a network dependency; duplicating the rendering implementation would create competing behavior. Instead derive installed modules from the same compiled sources and preserve exact browser bytes.

Use explicit .mjs module filenames to work regardless of the adopting project's package type. The manifest permits only the enumerated runtime files in scoped-delivery/scripts, never arbitrary scripts. Installation preflight, hashes and update preview apply to these files. The helper accepts a real result JSON and fresh HTML/Markdown paths, optionally opening through the existing fixed OS adapter. It performs no review itself and has no demo mode. The agent owns inspection and evidence before calling it.

Keep quick reviews light and respect explicit report-only/headless requests. When opening is requested, execute generation and local opening under that authorization. Preserve files on opening failure and report the precise limit. Revisit only for demonstrated runtime portability problems or an actual need for live reports; no server, unrelated design change or extra command is introduced.
