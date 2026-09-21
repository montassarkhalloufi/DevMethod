# DevMethod Atelier — experimental product rehearsal

This local research prototype lets you try the same situation in different working policies, keep a choice and its reason, then reconsider it when the need changes. It is **not a replacement for the installed DevMethod workflow** or an autonomous application generator. [Research, alternatives and limits](missions/product-alternatives/RESEARCH.md).

The independent scheduling context led to a second usable experience, [La séance collective](../examples/seance/README.md): exact schedules, explicit compromises and preserved published programmes. It is a direct product transaction built with ordinary agent tools, not another claim for the finite-state engine.

From a checkout, use Node 22.13+ or 24+:

```sh
npm run atelier -- --workspace /absolute/path/to/my-atelier --port 4318
```

Open `http://127.0.0.1:4318`. The default Gazette case and its people/articles are fictional. No dependencies, account, provider key, telemetry or external publication are needed at runtime. `--project /absolute/path/project.json` accepts a project matching the [experimental contract](missions/product-alternatives/CONTRACT.md). A workspace belongs to one project. Use another folder to start a separate experience. An extracted package can run `node scripts/atelier.mjs` directly.

## Try the mechanism

**Find an experiment first.** In the comparison view, click **Chercher une situation révélatrice**. The tool searches for a short sequence that produces different observable consequences in the supplied policies. The preview leaves your current records and trials untouched. **Jouer cette situation** explicitly confirms replacing the current trials with a replay from the initial data. **Cette situation manque mon besoin** opens an editable exploration request; it does not invent a preferred alternative or start an agent. Search is bounded and may find a trivial or irrelevant difference. [Scientific basis, alternatives and prospective evaluation](missions/product-alternatives/FRONTIER.md).

**Try another domain.** The link **Essayer le cas d’un équipement partagé** opens `/transfer` on the same local server. Try rentals and pauses, compare two actual charge calculations, ask for a distinguishing sequence and replay it after confirmation. This fictional example uses the unchanged search core with a separate numerical/temporal adapter. Its trials live only in browser memory; reloading resets them. It neither writes the Gazette workspace nor processes payments. [Frozen domain and complete rules](../scripts/discovery/transfer/README.md).

1. Select **Nina**, the article **Réparer ensemble**, and **Relire**. Try the action in every prototype. The bureau refuses; the peer variant permits it. This follows the supplied rules, not a quality judgment.
2. Try direct buttons in either product or add a fictional item. Inspect **Design et architecture** for assumptions and limits.
3. Select a direction and explain the compromise you accept. Saving keeps its context, observations and reason; it does not declare the product correct. Download the decision dossier to inspect these snapshots.
4. Edit **Contexte du projet**. Records remain; the choice is marked for reconsideration. This mark is triggered by a declared revision, not inferred semantic impact.
5. **Préparer une exploration** writes a real local request containing the current project, lanes and choice, the recorded decision history, the shared scenario and the contract. Give the generated request to your host agent. Nothing starts automatically. Import its compatible JSON proposal or paste it in the form, then exercise the changed behavior.

Each prepared request is a retained snapshot. `history` carries the earlier decisions exactly as stored, including their reasons and any context/observations recorded at the time; `scenario` carries the current shared sequence, distinct from the lane-specific observations in `currentLanes`. These fields are additive to request format 1. Older request files remain readable and are not backfilled: missing historical context stays unknown. A recorded choice does not establish that a human made it. Later session edits and restart do not rewrite prepared files.

The full recorded history is included, without summarization or deduplication of its historical snapshots. Its size grows with the existing decision/observation limits and can substantially increase the handoff size; no token saving or context-window fit is claimed. The request is a local file for an agent to inspect, not proof that the agent consumed all of it.

The host agent may recommend a clarification or no code. Read that recommendation; there is no need to manufacture a variant to import. An import itself requires one or more valid variants and the current project revision. A rejected or outdated proposal leaves the session unchanged; request a fresh proposal rather than editing its revision number to bypass the check. Existing records cannot be silently migrated or deleted.

`?variant=VARIANT_ID` opens one prototype. `?mode=simple` exposes the same project, ordinary direct controls, context, agent handoff and decision notes without shared replay or generated situations. It is a controlled UI comparison aid, not a benchmark against an ordinary agent or a competing product. A real ordinary-agent comparator is free to write its own scripts and construct experiments.

## State and boundaries

State lives in the chosen workspace's `session.json`, with prepared requests in `requests/`. Changes are written before success is acknowledged. One server owns a workspace; stale browser writes are rejected. Stop with Ctrl+C, then restart with the same command. If a crashed process left `.atelier-lock`, first verify that its recorded process is no longer running; retain the session and remove only that stale lock. The tool does not guess that it is safe to take another process's workspace.

Replaying rebuilds current trials from initial records. Individual trials require confirmation before replacement. Explicit reset also asks for confirmation. Decision snapshots remain historical evidence; they are not rewritten to look as though an old choice used a later behavior.

The engine models bounded actors, records, states and permissions. It does not model arbitrary code, time allocation, relationships between records, content review, authentication, multi-user collaboration or real publishing. The separately proposed architecture is explanatory text, not a production implementation. A real second context exposed this boundary; see [results](missions/product-alternatives/RESULTS.md). Trials by agents do not establish user benefit or a demonstrated rupture.
