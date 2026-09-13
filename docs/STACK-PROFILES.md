# Optional stack profiles

DevMethod's six modules and offline CLI remain independent of a technology stack. Select only the profile relevant to a mission; profiles are reference guidance, not scaffolding commands, new personas or automatic dependency upgrades.

Start with the [profile index](../.agents/skills/project-foundation/references/profiles/README.md). It lists TypeScript, React/Next, Node/Nest, PostgreSQL/Drizzle, MongoDB, messaging, cloud/container/infrastructure and CI profiles with their evidence levels. The [fullstack fixture](../examples/fullstack/README.md) provides the first executable Next/Nest/PostgreSQL slice with pinned dependencies and real persistence tests.

In an existing project, first read its manifest/lockfile, runtime and infrastructure pins, accepted decisions and actual commands. Record installed versions, selected profile and relevant official sources in mission context. Preserve conventions unless the mission explicitly authorizes a change. Documentation availability and new upstream versions do not establish compatibility with an existing application.

The fullstack fixture has its own package and lockfile. It is development/evaluation input, not a DevMethod CLI runtime dependency. Other profiles are independently usable inspection guides with explicitly unexecuted checks. Installing the method does not provision services, migrate data, install Vercel skills or validate a native coding host.
