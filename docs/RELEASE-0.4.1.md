# DevMethod 0.4.1

Fix the incomplete review-to-report flow introduced in 0.4.0. Ask `devmethod-review` to review changes and open the report: the agent performs the review, generates real JSON/Markdown/HTML results and opens the HTML itself. README and review guides now lead with this agent workflow; terminal demos are secondary.

The scoped-delivery installation now includes a narrowly allowlisted offline renderer. It needs Node.js 22+ but no npm, network, global CLI or application package dependency. Explicit .mjs modules work in CommonJS, ESM and package-less projects. The existing trusted renderer and OS opening adapter are reused; the installed entry point accepts only an explicit real record and fresh report paths, with no demo mode. Invalid records and existing outputs remain protected. Opening failure retains the generated files.

Adopt through a fresh staging installation and intentional merging, including scoped-delivery/scripts and the updated review instructions. Preserve customized files and old manifests; new diagnostics support older installations. The legacy shell viewer remains compatible. Product code and design behavior are unchanged.

Automated verification covers all three host layouts and all three package modes, report content from a supplied fixture, schema rejection, overwrite protection, OS-opening dispatch and runtime path allowlisting. OS-opening dispatch is intercepted in tests and is not proof of a graphical browser opening. Full native agent behavior is separate from these runtime checks. Executed counts, CI and npm verification are recorded in the GitHub release.

Review instructions now trace relevant sensitive data to logs/errors/API/telemetry, probe failure and recovery scenarios, inspect affected consumers and old data beyond the diff, and require concrete impact for architecture criticism. Application leak detection remains distinct from report redaction. Controls stay proportionate to risk. The existing evaluation protocol gains four review cases with five reproducible seeded defects, a correct control and explicit missed/false-positive accounting. Fixture/scorer validation is not a measured model detection improvement.

A [bounded independent review](../evaluation/review-detection/observed-0.4.1/README.md) confirmed 4 of 5 expected defects with no observed false positive. The timeout scenario was mentioned as a risk but not reproduced and remains unconfirmed. One small run without a matched baseline does not establish improved general detection.
