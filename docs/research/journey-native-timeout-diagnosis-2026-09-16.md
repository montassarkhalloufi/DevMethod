# A-initial timeout: diagnosis and local shell correction

Inspected source: `5448fe8`; historical driver retained in `fe2d963`. No model invocation, replay, authentication change or historical evidence edit was performed for this diagnosis. This report supplements the [original results](../../evaluation/journey-native/README.md).

## What the 120-second stop means

The native process stopped at the fixed deadline, **not on a demonstrated product failure**. Its 16 retained events show two inspection commands, creation of the application and handoff, the supplied acceptance suite passing all four criteria through 27 separate CLI processes, then four successful supplemental checks. Independent post-stop acceptance also passed and protected inputs were unchanged. The handoff still said verification was pending; no final completion or token-usage event arrived.

| Observation | UTC | Elapsed from recorded start |
| --- | --- | ---: |
| Supervisor start | 06:04:50.249 | 0 s |
| App file modification | 06:06:01.912 | 71.663 s |
| Handoff file modification | 06:06:01.964 | 71.715 s |
| Last task-temp directory modification | 06:06:37.804 | 107.555 s |
| Supervisor deadline | derived from start + measured duration | 120.009 s |

The file times are observed filesystem metadata, not timestamps for every model event. The final temporary-directory change is consistent with cleanup of the last successful check, but does not prove the exact instant its result reached the model. Finishing the handoff and emitting a final response/accounting were the remaining visible work; their required duration is unknown. Do not infer that a longer deadline would necessarily have completed successfully.

## Confirmed shell friction

The first supplemental command failed with `can't create temp file for here document: operation not permitted`. The ordinary acceptance suite had already passed within that same command. The native worker changed to a `node -e` command, which passed the four supplemental cases. This detour cost a further interaction; its isolated time is not measured.

The configured task-local `TMPDIR` does not change zsh's default `TMPPREFIX=/tmp/zsh`. The worker sandbox deliberately excludes general `/tmp` writes. A local preflight reproduced exactly this combination: macOS sandbox allowing writes only under the fictional workspace's `.runtime/tmp`, `/bin/zsh -f -c`, task-local TMPDIR, heredoc exit 1 and the same denial message. No model or provider was involved.

The correction sets both TMPDIR and TMPPREFIX, with the latter under `.runtime/tmp/zsh`, while keeping both general temporary-root exclusions enabled. The same real shell/sandbox probe then exits 0, prints `heredoc-ok`, and leaves its temporary directory empty. This validates this shell boundary, not native completion, provider behavior or overall method benefit.

`nativeArguments(directory, disabledSkills)` is now exported for reuse. `nativeShellPreflight(directory)` returns the legacy and configured observations without starting Codex or reading authentication. The diagnostic uses a clean zsh startup to isolate the temporary-file behavior; a future native trial must still observe the full tool environment.

## Accounting recovery and other uncertainty

Thread: `01a0a8d1-679f-7423-a63a-e2c6e2cff695`. Read-only targeted searches found no matching persisted rollout, no `threads` row in the local state database, no log row keyed by this thread, and no matching log body during the invocation's time window. The runner used `--ephemeral` and stopped before `turn.completed`; the verified local sources cannot recover its consumption. Missing accounting remains null, never zero. Account-wide quota deltas cannot be attributed to this invocation while other work is active.

The retained stderr contains six model-cache schema errors about missing `supports_parallel_tool_calls`. A later read-only cache inspection shows the same missing field in the current shared model catalog. This supports a cache/CLI compatibility concern, but neither proves the historical cache bytes nor measures its latency impact. Do not delete the cache or blame the product based on this observation. Inspect admission/catalog compatibility separately before new inference.

Current read-only probes confirm Codex CLI 0.147.0, ChatGPT authentication, bundled `gpt-5.6-sol` support with low effort, and Node 24.18.0 at its resolved fnm installation path. The historical exact Node runtime remains unpinned. Future preparation should retain the actual executable/version and verify the sandbox-visible `node` separately from the parent process; login shells can resolve a different binary.

## Smallest next experiment

Keep the supervisor's 120-second limit. First admit **one tiny existing-code repair**: one faulty function, one independently frozen failing test, required passing verification, concise final result and final usage. Preserve this as host/protocol calibration, not a method-quality result. One invocation only, 2 MiB maximum output, no retry, no subagent, fixed model/effort and explicit runtime. A clean process exit, verified artifact and known final usage are three separate admission outcomes.

Only after that complete calibration, a separately frozen A/B schedule can use at most six slots with alternating order and no C intervention without a demonstrated gap. Count calibration and comparisons in the same new cumulative observed-token budget of 100000; this is an inter-invocation stop, not a hard in-flight cap. Any timeout, interruption, unknown usage or failed process stops further dispatch. Keep the historical interrupted ledger untouched. No dollars are inferred from tokens or subscription status.

For auditability, timestamp and stream events as they arrive, retain the owned process identity, and preserve partial accounting if the interface provides it. The current CLI collector only observes end-of-turn usage. The documented app-server interface offers token-usage notifications and an explicit interrupt lifecycle, but switching adapters requires its own bounded validation and does not guarantee provider-side billing cancellation. [Official app-server reference](https://learn.chatgpt.com/docs/app-server)

## Evidence and checks

Historical private root: `/private/tmp/devmethod-native-campaign-20260916`.

| File | SHA-256 |
| --- | --- |
| `private/A-initial.jsonl` | `ff499061fe2bfa256d5f82872ba1a6b2d4f7c8fc631941f908c852cff01fb061` |
| `private/A-initial.stderr` | `38c5e6f5511737f1a916633ad367aeace9145bb83b347b215e78c88b94fb168c` |
| `frozen.json` | `a53dc999765dd94aca67cd957f28edaea2ff27dd5a1f3a5114339fe5a3d49836` |
| `ledger/A-initial.json` | `86e215b5810b009680bd0e1bf0478e69b5d47cc1934196642d6279fdb7cb7c2f` |

The associated shell snapshot's hash is `f81ed18d9e46f099d93cdc217071014917963ae8ac4d339dd85ca0151f02730c`. Only named temporary-path/runtime environment entries were inspected; no credentials were read or copied.

Validation: legacy heredoc denial observed before the code change; corrected preflight observed afterward. Eighteen focused shell, journey and supervisor tests pass on the explicitly selected Node 24.18.0 runtime, including the real macOS sandbox probe. Maintained-file lint, formatting and Markdown links pass. Non-macOS runs skip the platform-specific shell probe explicitly; no cross-platform shell claim is made.
