# Visual and Quick delivery pilot

Fictional Lisière reading library. The [mission](../../docs/missions/visual-workflow.md) owns current status, decisions and evidence. The user selected direction A and approved editorial-mockup-v1.png. The interactive implementation is in app/. Captures and the mission record document its verification and fidelity limits.

Start from the repository root: `python3 -m http.server 8765 --bind 127.0.0.1 --directory examples/visual-pilot/app`, then open http://127.0.0.1:8765. Stop with Ctrl-C. The prototype stores fictional books locally in your browser. Clear the `lisiere-demo-v1` localStorage key to reset.

Browser checks: `node examples/visual-pilot/browser-check.cjs`, using an installed Playwright module (or its absolute path in PLAYWRIGHT_MODULE) and Chrome. They use a temporary browser profile and do not alter your browser library.

The separate `quick-filter` exercise records an actual Codex subagent pass on a disposable project. Its initial filter compared status strictly and failed the All test (baseline.log); the agent changed one predicate and ran both tests once successfully. AGENT-RESULT.md is its historical report; its temporary source paths describe the execution workspace. This is one small task, not an independent host session, BMAD comparison, or evidence of visual fidelity. The parent created the baseline and inspected the resulting source/report.

Run the resulting filter checks with `node --test examples/visual-pilot/quick-filter/filter.test.mjs`. The report is evaluation output, not instructions for another agent. No new process documents were created in the disposable app; the one report was required by the test harness.
