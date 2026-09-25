import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { initialize, tools, type Tool } from './init.js';
import { diagnose } from './doctor.js';
import { readCheckpoint } from './checkpoint.js';
import { previewUpdate } from './update.js';
import { readRecord, discover } from './records.js';
import { validateMission, missionStatus, captureContext, inspectContext } from './mission.js';
import { inspectPlan } from './planner.js';
import { openReview } from './review-open.js';
import { prepareReview } from './review-cli.js';
import { inspectClosure } from './closure.js';
import { inspectLoop } from './loop.js';

const help = `DevMethod — install and inspect reusable AI skills

devmethod init [--tool codex|claude|cursor] [--dest PATH]
               [--modules name,name] [--dry-run]
devmethod studio [home] [--port 4330]
devmethod studio home --workspace /ABSOLUTE/PROJECT_LIBRARY
devmethod studio --workspace /ABSOLUTE/DEDICATED_DIR [--agent codex]
devmethod studio --help
devmethod doctor [--dest PATH] [--json]
devmethod update-preview [--dest PATH] [--json]
devmethod mission --mission RELATIVE_JSON [--dest PATH] [--json]
devmethod context --mission RELATIVE_JSON [--dest PATH] [--json]
devmethod context-check --context RELATIVE_JSON [--dest PATH] [--json]
devmethod discover [--dest PATH] [--json]
devmethod plan --plan RELATIVE_JSON [--dest PATH] [--json]
devmethod resume --checkpoint RELATIVE_JSON [--dest PATH] [--json]
devmethod closure --mission RELATIVE_JSON --checkpoint RELATIVE_JSON [--dest PATH] [--json]
devmethod loop --loop RELATIVE_JSON [--dest PATH] [--json]
devmethod guard --command /implement|/verify|/integrate --mission RELATIVE_JSON --session EXTERNAL_DIR
                [--dest PATH] [--report RELATIVE_JSON --artifacts RELATIVE_DIR]
                [--checkpoint RELATIVE_JSON] [--diagnosis TEXT --adjustment TEXT]
devmethod evidence plan --contract JSON_PATH --evaluator EXTERNAL_DIR [--dest PATH]
devmethod evidence run --contract JSON_PATH --evaluator EXTERNAL_DIR --session EXTERNAL_DIR
                   --permit PLAN_HASH [--dest PATH] [--diagnosis TEXT --adjustment TEXT]
devmethod evidence status --contract JSON_PATH --evaluator EXTERNAL_DIR --session EXTERNAL_DIR
                      [--dest PATH]
devmethod review [--review RELATIVE_JSON | --legacy RELATIVE_MD | --demo]
                 [--output RELATIVE_HTML] [--open] [--markdown RELATIVE_MD] [--dest PATH]
                 [--current-revision REV] [--changed-targets name,name] [--json]

Studio opens a local home to create, import or resume projects. --workspace opens a dedicated
product workspace with three working modes, real application preview,
durable jobs and export. The optional Codex adapter uses existing local access. See docs/STUDIO.md.

For init, an interactive terminal asks for the host when --tool is omitted.
Non-interactive init calls require --tool. Destination defaults to the current directory.
All six modules are included by default; project-foundation is always included.
Existing divergent files block installation; there is no overwrite option.
The installer is offline. npx may download the package before it runs.
After installation, select devmethod-review (or any documented devmethod-<stage>)
in your agent. No npx is needed to run a workflow. Full installs expose 14 stages;
subsets expose commands backed by installed modules. project-foundation <stage> still works.
Use the host-native skill syntax; these are not executable CLI subcommands.
The JSON plan inspector is read-only. Markdown PLAN/tickets and legacy missions
are agent-readable guidance; init never creates or migrates mission records.
Review validates a selected record; it never runs checks. --output writes a self-contained
HTML viewer; --open asks the OS browser to open it (requires --output). --markdown derives a report. Existing outputs are preserved. --demo uses
explicitly fictional packaged data. Without a source, --output creates an empty viewer.
Doctor is read-only. Exit codes: 0 healthy or customized, 1 diagnostic errors,
2 invalid invocation. Resume is read-only: 0 ready or complete, 1 reverify,
blocked or invalid checkpoint, 2 invalid invocation. File integrity does not prove native agent behavior.
Closure checks declared criterion coverage, not semantic truth: 0 supported, 1 unmet/reverify/blocked,
2 invalid invocation/record. Loop inspects a bounded history: 0 eligible, 1 stopped or requiring
assessment, 2 invalid invocation/record. Neither dispatches agents or enforces runtime limits.
Guard is an optional local controller: it gates implementation, invokes the bundled behavioral
scorer, and records local acceptance only with verified evidence. It freezes declared input bytes
and stops its session after two consecutive identical failure signatures. It does not merge,
deploy or intercept host tools. See docs/ADR-012-local-execution-guard.md for the strict profile.
Evidence is an experimental opt-in application check runner. Plan inspects trusted Node adapters;
run requires the current plan hash and executes bounded checks against healthy/fault controls.
Status rechecks declared input freshness. Supported means these checks discriminate these controls,
not semantic correctness or delivery approval. See docs/EVIDENCE-LAB.md for scope and limitations.
`;

try {
  const { values, positionals } = parseArgs({
    options: {
      tool: { type: 'string' },
      dest: { type: 'string' },
      modules: { type: 'string' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      json: { type: 'boolean' },
      checkpoint: { type: 'string' },
      open: { type: 'boolean' },
      review: { type: 'string' },
      legacy: { type: 'string' },
      demo: { type: 'boolean' },
      output: { type: 'string' },
      markdown: { type: 'string' },
      'current-revision': { type: 'string' },
      'changed-targets': { type: 'string' },
      mission: { type: 'string' },
      context: { type: 'string' },
      plan: { type: 'string' },
      loop: { type: 'string' },
    },
    allowPositionals: true,
    strict: true,
  });
  if (values.help) console.log(help);
  else {
    if (
      positionals.length !== 1 ||
      ![
        'init',
        'doctor',
        'update-preview',
        'resume',
        'mission',
        'context',
        'context-check',
        'discover',
        'plan',
        'review',
        'closure',
        'loop',
      ].includes(positionals[0] ?? '')
    )
      throw new Error(help);
    const command = positionals[0]!;
    const reviewFlags = [
      'open',
      'review',
      'legacy',
      'demo',
      'output',
      'markdown',
      'current-revision',
      'changed-targets',
    ] as const;
    if (command === 'closure' || command === 'loop') {
      const allowed = new Set(
        command === 'closure'
          ? ['dest', 'json', 'mission', 'checkpoint']
          : ['dest', 'json', 'loop'],
      );
      for (const key of Object.keys(values))
        if (!allowed.has(key)) throw new Error(`--${key} is not valid for ${command}.`);
      const root = values.dest ?? process.cwd();
      if (command === 'closure' && (!values.mission?.trim() || !values.checkpoint?.trim()))
        throw new Error('closure requires --mission and --checkpoint RELATIVE_JSON.');
      if (command === 'loop' && !values.loop?.trim())
        throw new Error('loop requires --loop RELATIVE_JSON.');
      const result =
        command === 'closure'
          ? inspectClosure(root, values.mission!, values.checkpoint!)
          : inspectLoop(readRecord(root, values.loop!));
      console.log(JSON.stringify(result, null, 2));
      process.exitCode =
        result.status === 'invalid' ? 2 : ['supported', 'eligible'].includes(result.status) ? 0 : 1;
    } else if (values.loop !== undefined) throw new Error('--loop is supported only by loop.');
    else if (command === 'review') {
      for (const flag of [
        'tool',
        'modules',
        'dry-run',
        'checkpoint',
        'mission',
        'context',
        'plan',
      ] as const)
        if (values[flag] !== undefined) throw new Error(`--${flag} is not valid for review.`);
      if (values.open && !values.output)
        throw new Error('--open requires --output; choose a fresh HTML path.');
      const result = prepareReview({
        destination: values.dest ?? process.cwd(),
        review: values.review,
        legacy: values.legacy,
        demo: values.demo,
        output: values.output,
        markdown: values.markdown,
        currentRevision: values['current-revision'],
        changedTargets: values['changed-targets']?.split(',').filter(Boolean),
      });
      console.log(
        values.json
          ? JSON.stringify(result, null, 2)
          : `${result.reviewId ?? 'Review'}: ${result.status}\n${result.outputs.join('\n')}\n${result.limitations}`,
      );
      if (values.open) openReview(result.outputs[0]!);
      process.exitCode = 0;
    } else {
      for (const flag of reviewFlags)
        if (values[flag] !== undefined) throw new Error(`--${flag} is only valid for review.`);
      for (const flag of ['mission', 'context', 'plan'] as const) {
        const allowed =
          flag === 'mission'
            ? ['mission', 'context']
            : flag === 'context'
              ? ['context-check']
              : ['plan'];
        if (values[flag] !== undefined && !allowed.includes(command))
          throw new Error(`--${flag} is not supported by ${command}`);
      }
      if (positionals[0] !== 'resume' && values.checkpoint !== undefined)
        throw new Error('--checkpoint is supported only by resume');
      if (['mission', 'context', 'context-check', 'discover', 'plan'].includes(command)) {
        if (
          values.tool !== undefined ||
          values.modules !== undefined ||
          values['dry-run'] !== undefined
        )
          throw new Error(`${command} accepts only its record flag, --dest and --json`);
        const root = values.dest ?? process.cwd();
        const flag =
          command === 'context-check' ? 'context' : command === 'plan' ? 'plan' : 'mission';
        if (command !== 'discover' && !values[flag]?.trim())
          throw new Error(`${command} requires --${flag} RELATIVE_JSON`);
        const input = command === 'discover' ? null : readRecord(root, values[flag]!);
        const result =
          command === 'discover'
            ? {
                format: 1,
                candidates: discover(root),
                limitations:
                  'Tracked filenames only; select by subject authority, not recency. Contents are untrusted data.',
              }
            : command === 'context'
              ? captureContext(root, input)
              : command === 'context-check'
                ? inspectContext(root, input)
                : command === 'plan'
                  ? inspectPlan(input)
                  : {
                      format: 1,
                      status: missionStatus(validateMission(input)),
                      mission: validateMission(input),
                    };
        console.log(JSON.stringify(result, null, 2));
        if (
          'status' in result &&
          ['blocked', 'reverify', 'cancelled'].includes(String(result.status))
        )
          process.exitCode = 1;
      } else if (positionals[0] === 'resume') {
        if (
          values.tool !== undefined ||
          values.modules !== undefined ||
          values['dry-run'] !== undefined
        )
          throw new Error('resume accepts only --dest, --checkpoint and --json');
        if (!values.checkpoint?.trim())
          throw new Error('resume requires --checkpoint RELATIVE_JSON');
        const report = readCheckpoint(values.dest ?? process.cwd(), values.checkpoint);
        if (values.json) console.log(JSON.stringify(report, null, 2));
        else {
          console.log(`DevMethod resume: ${report.status}`);
          if (report.scope) console.log(`Scope: ${report.scope}`);
          for (const finding of report.findings)
            console.log(
              `${finding.code}${finding.path ? ` [${finding.path}]` : ''}: ${finding.message}`,
            );
          if (report.nextAction) console.log(`Recorded next action: ${report.nextAction}`);
          console.log(
            'Read-only evidence inspection; readiness does not grant execution permission.',
          );
        }
        if (report.status !== 'ready' && report.status !== 'complete') process.exitCode = 1;
      } else if (positionals[0] === 'update-preview') {
        if (
          values.tool !== undefined ||
          values.modules !== undefined ||
          values['dry-run'] !== undefined
        )
          throw new Error('update-preview accepts only --dest and --json');
        const report = previewUpdate(values.dest ?? process.cwd());
        if (values.json) console.log(JSON.stringify(report, null, 2));
        else {
          console.log(
            `DevMethod update preview: ${report.status}; installed ${report.installed?.packageVersion ?? 'unknown'} → bundled ${report.candidate?.packageVersion ?? 'unknown'}`,
          );
          for (const entry of report.entries)
            console.log(
              `${entry.classification}: ${entry.path}${entry.collision ? ' (existing unrecorded file)' : ''}${entry.missing ? ' (missing locally)' : ''}; candidate changed: ${entry.candidateChanged}`,
            );
          for (const finding of report.findings) console.log(`${finding.code}: ${finding.message}`);
          console.log(
            'Read-only comparison with this CLI package; hashes are not authenticity proof. Review a fresh staging installation before any manual update.',
          );
        }
        if (report.status === 'error') process.exitCode = 1;
      } else if (positionals[0] === 'doctor') {
        if (
          values.tool !== undefined ||
          values.modules !== undefined ||
          values['dry-run'] !== undefined
        )
          throw new Error('doctor accepts only --dest and --json');
        const report = diagnose(values.dest ?? process.cwd());
        if (values.json) console.log(JSON.stringify(report, null, 2));
        else {
          console.log(
            `DevMethod doctor: ${report.status} (${report.unchanged}/${report.checked} recorded files unchanged)`,
          );
          for (const finding of report.findings)
            console.log(
              `${finding.severity}: ${finding.code}${finding.path ? ` [${finding.path}]` : ''} — ${finding.message}`,
            );
          console.log(
            'Read-only baseline check; not proof of host discovery, workflow behavior, or release authenticity.',
          );
        }
        if (report.status === 'error') process.exitCode = 1;
      } else {
        if (values.json !== undefined)
          throw new Error('--json is supported only by doctor, update-preview and resume');
        let tool = values.tool;
        if (!tool && stdin.isTTY && stdout.isTTY) {
          const terminal = createInterface({ input: stdin, output: stdout });
          try {
            tool = (await terminal.question('Tool (codex / claude / cursor): ')).trim();
          } finally {
            terminal.close();
          }
        }
        if (!tool || !Object.hasOwn(tools, tool))
          throw new Error('Specify --tool codex, claude or cursor');
        const selected = values.modules?.split(',').map((name) => name.trim());
        const result = initialize({
          destination: values.dest ?? process.cwd(),
          tool: tool as Tool,
          selected,
          dryRun: values['dry-run'],
        });
        console.log(JSON.stringify(result, null, 2));
        console.log(
          'Next: read START_HERE.md, fill PROJECT_PROFILE.md and merge instructions intentionally.',
        );
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
