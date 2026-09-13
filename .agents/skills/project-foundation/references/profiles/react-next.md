# React and Next.js profile

Apply to React features, Next routes or server/client boundaries. Inspect installed React/Next versions, router, build configuration, cache directives, server actions, existing state/query libraries, and approved local Vercel skills. Preserve the installed major and design system. A Vercel URL does not mean its skill is installed, read or validated.

Use the React feature engineering module. Views render typed inputs and emit intents; custom hooks own a concrete React responsibility; pure transformations remain pure functions. Authoritative rules stay at the server/domain boundary. Initial server access belongs at a server boundary; do not move an entire route to the client for one input. Avoid derived-state effects and duplicated server state.

Check private data exposure, caching scope, mutation invalidation, loading/error/empty states, stale responses, accessibility and hydration. Only apply version-specific caching features already adopted by the project. Use browser tests for actual interaction claims; an HTML response does not prove hydration or keyboard behavior.

Executable example: `examples/fullstack` pins Next 16.3.5 and React 19.3.0. `npm run test:e2e` builds a production Next page, starts Nest with real PostgreSQL, checks a created title in rendered HTML and checks the API-unavailable message. `useTaskFilter` owns query state; `filterTasks` derives visible tasks without an effect. Browser filtering remains a manual protocol in the example README, marked not run.

Sources consulted 2026-09-13: [React effects](https://react.dev/learn/you-might-not-need-an-effect), [Next server/client components](https://nextjs.org/docs/app/getting-started/server-and-client-components). Recheck against the installed major before adopting an API.
