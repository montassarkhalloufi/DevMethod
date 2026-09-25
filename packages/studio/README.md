# DevMethod Studio

The local DevMethod creation environment, distributed independently from the
`devmethod-ai` method package. Includes the interface, evidence/control/risk engines,
trusted React/TypeScript compiler, connectors and recorded examples. MIT licensed.

This is an unpublished candidate. From the repository, build and inspect the archive:

```sh
npm ci
npm run build
npm run pack:studio
npm install /absolute/path/to/devmethod-studio-0.6.0-beta.1.tgz
npx --offline devmethod-studio --help
npx --offline devmethod-studio home
```

Studio installs its own runtime dependencies; `devmethod-ai` is not required.
It uses your separately configured coding-agent access. Installing or starting Studio
does not establish provider availability or authorize model calls.

The existing `devmethod studio` spelling also works when both packages are explicitly
installed together. The standalone executable is `devmethod-studio`. Existing project
workspaces remain compatible; no data migration or license change is introduced.

[Studio guide](https://github.com/montassarkhalloufi/DevMethod/blob/main/docs/STUDIO.md)
and [source repository](https://github.com/montassarkhalloufi/DevMethod).
