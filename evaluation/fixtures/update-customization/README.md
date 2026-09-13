# Customized legacy installation fixture

This deterministic package scenario uses the real published rc.1 tarball and the local candidate. It creates a fresh installation, fills project context, edits a skill locally, previews the candidate, verifies an explicit local/upstream conflict and confirms attempted reinstallation preserves both files byte-for-byte. There are no host/model calls or updates to the real project.

From the source checkout, prepare tarballs in an empty disposable directory:

```sh
npm pack devmethod-ai@0.1.0-rc.1 --pack-destination /absolute/disposable
npm pack --pack-destination /absolute/disposable
node scripts/package-smoke.mjs /absolute/disposable/devmethod-ai-0.1.0-rc.2.tgz /absolute/disposable/devmethod-ai-0.1.0-rc.1.tgz
```

The first command downloads the pinned public artifact; subsequent smoke checks are offline. Published rc.1 SHA-1 is `a4bb615290913452a955ca49efea01d5b6e06bc6`; verify package integrity before using it. The fixture cleans only its own temporary directories. No diff or hash authorizes overwriting a customization. The candidate has no update-apply operation.
