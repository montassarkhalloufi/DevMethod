# ADR-037 — English and French Studio interface

Status: accepted, 2026-09-21.

## Context

The user requested an English Studio to match the English public site and film,
with an optional French interface. Home and individual projects run on separate
local ports. Switching language must preserve drafts, source editors, selections,
open reviews and the historical record.

## Decision

Studio defaults to English and exposes an English/Français selector. A versioned
localStorage preference and a host-scoped cookie share the choice across local
ports. Existing tabs read that preference when focused. Persistence failures leave
the current selection usable without blocking the application.

A small shared runtime owns the supported locales, interpolation and subscriptions.
React consumes it with useSyncExternalStore. Legacy views bind explicitly authored
labels and attributes; translation never traverses arbitrary document text. Open
editors and reviews update their labels without remounting or submitting changes.

Catalog endpoints accept an explicit language for their display projection. Canonical
connector definitions, identifiers, permissions, snapshot fingerprints and persisted
history retain their original values. Known product errors can be translated through
an exact catalog; unknown errors and external diagnostics remain verbatim.

Project names, user input, source files, provider output and historical evidence keep
their authored language. Selecting English is not a translation of project content
or permission to regenerate it. New site and film editorial content is English;
new film recordings must show Studio in English with suitable English demo content.

## Consequences and verification

The interface remains usable without persistent browser storage. Translations add
no service, provider call, permission or billing path. Immutable provenance remains
comparable across language changes. Monaco's built-in menus use its bundled English
strings; surrounding Studio controls support both languages.

Verification covers the English default, cross-port preference, unavailable storage,
open dialogs, editor text and selection, preserved project input, canonical catalog
invariance and explicit error projection. Browser checks cover Home and a labeled
local project fixture; they are not native agent or human acceptance evidence.
