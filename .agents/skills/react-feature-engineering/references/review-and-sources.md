# React review and sources

## Placement examples

- Filter/sort an in-memory list: pure function or local derivation, not a mirror effect.
- Load initial content for a public Next page: existing server boundary, not `useFetch` that removes useful HTML.
- Manage upload selection, progress, and cancellation: feature hook; transport in adapter; server validation and authorization.
- Calculate offer eligibility: domain/use case, even if an early UI check reuses a pure version.
- Open an accordion: local component state when no shared orchestration exists.
- Request A followed by B: prevent late A from replacing B through cache/framework or appropriate cancellation/request identity.
- Double-click a purchase: UI control is useful, but server entitlement and idempotency are essential.

## References verified on 12 September 2026

These public references are supplements. This kit neither redistributes nor claims to install third-party skills.

- [React: custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — share concrete React logic; do not turn pure functions into hooks.
- [React: effects are often unnecessary](https://react.dev/learn/you-might-not-need-an-effect) — derivations and events.
- [Next: server and client](https://nextjs.org/docs/app/getting-started/server-and-client-components) — composition and boundaries by version.
- [Vercel agent-skills](https://github.com/vercel-labs/agent-skills) — React best practices, composition, and web design.
- [Vercel next-skills](https://github.com/vercel-labs/next-skills) — conditional Next guidance.

## Versioned resolution

1. Read manifest and lockfile; identify the installed version.
2. Read required skills from the local pack and their approved pin. Follow their useful references.
3. For APIs, prefer available bundled documentation, then official documentation for that version.
4. An upstream link is not proof of loading. If the project requires an absent/incomplete local skill, report the scope blocker; do not fabricate an equivalent.
5. Adding/updating a skill is a dependency to review: source, commit/version, license, compatibility, conflicts, and behavior changes. Do not automatically run a floating `npx` command.
6. Cache Components/PPR applies only when adopted and supported. A skill's existence does not authorize a framework or hosting change.

## Focused review

- Can the business rule be tested without React rendering?
- Does the hook have one React responsibility and a short API?
- Do props/state remain immutable?
- Are network states and errors explicit?
- Does the server/client boundary preserve secrets and private data?
- Does sharing answer a stable responsibility rather than only a resemblance?
- Do components compose without an explosion of booleans?
- Do checks cover the changed boundary?
