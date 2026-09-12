---
name: react-feature-engineering
description: Implement or refactor React features with clear view, custom-hook, pure-logic and server boundaries. Use for React or Next.js feature code and architecture review; preserve the project's framework version, approved UI and installed Vercel guidance.
---

# React Feature Engineering

Preserve project conventions, accepted decisions, and the version actually installed. Complement approved Vercel skills; do not replace them or automatically import their latest version.

## Place each responsibility

| Responsibility | Conceptual location |
|---|---|
| Routes, layouts, composition, providers | `app` |
| Business view, typed props, intent callbacks | `feature/components` |
| React state, browser interaction, coherent subscription | `feature/hooks` |
| Pure transformation and view model | `feature/model` or named function |
| Authoritative business rule/calculation | domain / use case |
| Initial server access and authorized actions | `feature/server` or server boundary |
| Stable primitives without business meaning | shared UI |

Create only needed folders and respect existing names. Dependencies are `app → features → shared/contracts`; never the reverse or deep imports between features.

## View, hooks, and effects

The view describes rendering and emits intents. Keep simple local visual state there. Keep network/SDK orchestration outside presentation components. Server composition may call server services without an artificial hook.

A custom hook encapsulates a concrete React responsibility, such as `useDecisionDraft`, `usePhotoUpload`, or `useMonitoringControls`. A pure transformation is not a hook. Hooks do not host authoritative business rules.

Do not store a derivable value through an effect. Trigger a user action in its handler/action. Reserve effects for external synchronization, with cleanup and complete dependencies. Do not create `useMount`/`useEffectOnce` to bypass the React model. Avoid both giant components and fragmentation into empty wrappers.

Read [review and sources](references/review-and-sources.md) for sources, scenarios, and review priorities.

## Server, state, and performance

Choose boundaries for the installed framework: initial server data when useful, small client areas for interaction. Do not make the entire page client-side for one control.

Distinguish server/cache state, durable draft, and UI state. Avoid two mutable sources of truth for the same data. Verify cache keys, user scope, and invalidation.

Address waterfalls, unnecessary client JavaScript, and duplicate fetching first. Parallelize only independent work within resource limits. Add `memo`/`useMemo`/`useCallback` only with a measured reason or a necessary stable identity.

## Verification

Test pure rules without React, component-level interactions, and runtime boundaries in a browser when needed. Cover the concrete risk: stale request, double submission, mutation error, private cache, focus after action. Use repository commands; do not install a new test stack for a small adjustment. Report what ran and what did not.
