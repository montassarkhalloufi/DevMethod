# React review and sources

## Required local sources

React is DevMethod's principal supported interactive frontend path, not an immutable choice for every project. Keep the installed framework/version and accepted UI unless their change is requested or delegated. These Vercel sources are redistributed at reviewed commits; their provenance, licenses and exact hashes are in [PROVENANCE.md](vercel/PROVENANCE.md).

- [React best practices](vercel/react-best-practices/SKILL.md), with the complete [rule collection](vercel/react-best-practices/AGENTS.md).
- [Composition patterns](vercel/composition-patterns/SKILL.md), with the complete [rule collection](vercel/composition-patterns/AGENTS.md).
- [Web Interface Guidelines](vercel/web-design-guidelines/command.md), pinned locally. Read this command directly; the unmodified upstream skill's request to fetch `main`/latest is superseded by DevMethod's reviewed pin.

Before implementation, inspect the indexes and read the relevant individual rules. During review, consider every applicable rule across the changed surface, using the complete collections where needed; inspect actual code and interactions. Record a concise applicability boundary (framework/version, changed surfaces), concrete findings, and material deviations with a reason. Rules about an absent runtime are inapplicable, not silently satisfied. Testing, reading, static inspection and browser observation are distinct evidence; do not write "Vercel compliant" without reporting the inspected scope and remaining limits.

## Placement examples

- Filter/sort an in-memory list: pure function or local derivation, not a mirror effect.
- Load initial content for a Next page: use the existing server boundary when supported; do not prescribe RSC for a Vite client application.
- Manage upload selection, progress and cancellation: feature hook, transport adapter, authoritative server validation and authorization.
- Calculate offer eligibility: domain/use case, even if an early UI check reuses a pure version.
- Open an accordion: local component state when no shared orchestration exists.
- Request A followed by B: prevent late A replacing B using the existing cache/framework or appropriate cancellation/request identity.
- Double-click a purchase: UI control helps, but server entitlement and idempotency remain essential.

Clean Architecture supplies dependency boundaries: business policy does not depend on React or transport. Introduce ports, adapters and layers only for an actual boundary or variation; do not create empty wrappers or six folders for a trivial interaction.

## Versioned resolution and updates

1. Read the manifest and lockfile; identify the installed framework/version and available runtime.
2. Load the local sources at their approved pin. Apply their rules within that context; document any material conflict and chosen resolution rather than silently ignoring a rule.
3. For API details, use bundled documentation or official documentation for the installed version. A newer API example does not authorize a version bump.
4. Missing required local guidance is an explicit limitation. An upstream URL is not proof that the agent read its content.
5. Updates require a reviewed diff of guidance, compatibility, license and behavior, then refreshed provenance/hashes and affected checks. No floating `npx` install or automatic latest fetch.
6. Next.js, Cache Components/PPR, React Native and hosting/deployment are conditional capabilities. Their existence in an upstream catalog neither installs them nor grants execution or deployment permission.

Additional official references: [React hooks](https://react.dev/learn/reusing-logic-with-custom-hooks), [effects](https://react.dev/learn/you-might-not-need-an-effect), [Next server/client boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components), and the separate [Vercel Next guidance](https://github.com/vercel-labs/next-skills). The last source is not bundled or claimed as supported runtime here.

## Focused review

- Can business rules be tested without React rendering?
- Does each hook have one coherent React responsibility and a short API?
- Are state/props immutable and errors explicit?
- Are stale requests, double submission, focus and draft recovery handled?
- Does the server/client boundary preserve secrets and private data?
- Does composition solve a stable responsibility rather than create wrappers or boolean proliferation?
- Are waterfall/bundle/rendering rules applied proportionately and deviations explained?
- Do tests and browser checks cover the changed boundaries and accepted visual reference?
