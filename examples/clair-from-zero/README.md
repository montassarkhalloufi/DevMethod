# Clair — an actual from-zero DevMethod pilot

Clair is a fictional French personal-priorities app created by a separate Codex subagent in a new directory containing only the installed DevMethod kit. The parent provided a bounded brief and delegated the detailed editorial visual choices. No application code or previous implementation was supplied. This is a same-host subagent test, not a fresh standalone Codex/Claude session or a comparative benchmark.

## Run

From this directory:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory app
node --test tests/*.test.mjs
```

Open http://127.0.0.1:8766. Stop the server with Ctrl-C. No npm dependencies, backend, external fonts, account or provider key. Browser storage uses `clair.tasks.v1`. The application starts empty; its demo button explicitly adds fictional tasks. Delete/undo covers the last deletion and does not survive reload. There is no cross-tab synchronization or daily reset.

## What was observed

The implementing agent grouped framing, design, architecture, planning and readiness in one mission. It created five app files, a test file, one mission and the requested evaluation snapshot; all installed kit files retained their hashes. Six logic/storage tests passed. The parent then exercised the actual Chrome UI: blank validation, add/note, completion/filters, persistence, delete/undo, demo, keyboard submission, 390px overflow and write-failure recovery.

[Agent report](AGENT-EVALUATION.md) is a historical observation. [Mission](MISSION.md) includes parent checks and disclosed limitations. A stale status sentence left by the implementing agent was reconciled by the parent; this was not perfect autonomous bookkeeping. The design was delegated, so this test does not repeat the user-choice/image steps of the separate [Lisière pilot](../visual-pilot/README.md).

Browser check from the DevMethod repository root: `node examples/clair-from-zero/browser-check.cjs`, with Playwright and Chrome available. Set PLAYWRIGHT_MODULE to an installed Playwright module path when needed. It writes captures under docs/media/from-zero/captures and uses a temporary browser profile.

[French video and transcript](../../docs/media/from-zero/README.md) show this app's actual interactions and separately identify the Lisière visual pilot. Neither demonstration establishes general code quality, production readiness, lower costs or superiority over BMAD.
