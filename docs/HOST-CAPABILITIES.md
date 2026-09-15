# Host capabilities and evidence boundaries

Assessment: 2026-09-15, 0.5 hardening source candidate. This is a repository-evidence matrix, not a live inventory of every product sold under a host's brand. Native CLI executables `codex`, `claude` and `cursor` are absent from the current hardening environment. Their current authentication, versions, hooks, menus and execution controls are therefore not verified here.

## Meaning of the labels

- **Instruction:** exported skill guidance that the host agent must interpret; not an enforced boundary.
- **Deterministic check:** local offline code evaluates recorded inputs when explicitly invoked. It does not prove an agent followed the workflow or that declared evidence is truthful.
- **Historical pilot:** a dated, pinned, narrowly scoped native experiment, not a result for this candidate.
- **Unavailable in DevMethod:** no general implementation in the repository. A host may have its own capability, but that does not make it a DevMethod control.
- **Pending:** requires a current authenticated native session or independent external validation.

| Capability | Codex | Claude Code | Cursor Agent |
|---|---|---|---|
| Exported skills and stage guidance | Instruction, `.agents/skills` | Instruction, `.claude/skills` | Instruction, `.cursor/skills` |
| Installer/doctor/update comparison | Deterministic check of exported files | Same local CLI check | Same local CLI check |
| Mission, checkpoint and task graph inspection | Deterministic check, when invoked | Same local CLI check | Same local CLI check |
| Correct/verify/stop behavior | Instruction; current native behavior pending | Instruction; native behavior pending | Instruction; native behavior pending |
| Automatic stage discovery/menu presentation | Current native discovery pending | Native discovery pending | Native discovery pending |
| General graph dispatch and agent spawning | Unavailable in DevMethod | Unavailable in DevMethod | Unavailable in DevMethod |
| Fixture dispatch and local process supervision | Historical opt-in macOS exec pilot and separate private stdio app-server trials | No DevMethod native adapter validated | No DevMethod native adapter validated |
| Isolation and tool permissions | Host-owned; historical pilot settings only | Host-owned, not verified here | Host-owned, not verified here |
| Current hard token/dollar cap | No general DevMethod implementation | No general DevMethod implementation | No general DevMethod implementation |
| Cancellation and interrupted-run recovery | Historical POSIX pilot evidence; current host pending | No native DevMethod evidence | No native DevMethod evidence |
| Parent/child usage and interruption | Experimental `codex-task` / RPC / meter adapter; corrected lifecycle only deterministically checked | No native DevMethod evidence | No native DevMethod evidence |
| Research, image, browser or document tools | Host/tool dependent, not installed by DevMethod | Same dependency | Same dependency |
| Fourteen-stage workflow and fresh-session resumption | Current complete coverage pending | Pending | Pending |

The same deterministic CLI can run against all exported layouts. That is layout compatibility, not proof of equivalent model behavior. The optional [closure and loop inspectors](CLOSURE-AND-LOOPS.md) are also read-only checks: `devmethod closure --mission relative/mission.json --checkpoint relative/checkpoint.json` and `devmethod loop --loop relative/loop.json`. They do not intercept host actions. See the candidate's CLI help and [hardening ledger](HARDENING-0.5.md) for validation status.

## Historical pilot scope

[Native pilot results](NATIVE-PILOT-RESULTS.md) document six Codex invocations on the recorded 2026-09-13 configuration. The pilot used local process-time/output/run limits and an observed-token threshold checked **between** invocations. It reported 549327 tokens against a 500000 threshold before stopping further admissions. This is neither a hard per-call token limit nor measured dollar spend. Windows process-tree cancellation, server-side cancellation and arbitrary project dispatch are unverified. Installing or invoking a skill never implicitly starts this development script.

A separate [private stdio app-server adapter](CODEX-ADAPTER-VALIDATION.md), implemented in `scripts/hosts/codex-task.mjs`, `codex-rpc.mjs` and `codex-meter.mjs`, records parent/child events and interruption. Its three historical root invocations have an observed lower bound of 366489 tokens; the last trial is incomplete and final usage is unknown. Its corrected lifecycle has deterministic tests, not a subsequent native validation. These three roots are distinct from the six-run exec pilot. Neither path provides arbitrary task-graph dispatch; incomplete inherited configuration also prevents a fully matched comparison claim. The follow-up admission fix retains malformed/unmetered/incomplete histories as blockers without resetting their budgets.

## Revalidation record

For each current native run, record candidate archive integrity, source revision, date, OS, actual executable/model versions, allowed tools, authentication method without secrets, task fixture, observed discovery, executed checks, failure handling, resumption, usage availability and reviewer conclusion. Preserve failed attempts and confounders. Run the [native protocol](../COMPATIBILITY.md#native-smoke-protocol) with existing authority and available tools; unavailable capabilities remain pending, not simulated passes.

No account, provider, paid service, telemetry or permission change is required to use the offline method. An instruction to honor authorization cannot itself prevent a host from acting. Claims of enforcement require a tested boundary at the actual execution layer.
