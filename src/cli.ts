#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { initialize, tools, type Tool } from './init.js';
import { diagnose } from './doctor.js';
import { readCheckpoint } from './checkpoint.js';
import { previewUpdate } from './update.js';

const help = `DevMethod — install and inspect reusable AI skills

devmethod init [--tool codex|claude|cursor] [--dest PATH]
               [--modules name,name] [--dry-run]
devmethod doctor [--dest PATH] [--json]
devmethod update-preview [--dest PATH] [--json]
devmethod resume --checkpoint RELATIVE_JSON [--dest PATH] [--json]

For init, an interactive terminal asks for the host when --tool is omitted.
Non-interactive init calls require --tool. Destination defaults to the current directory.
All six modules are included by default; project-foundation is always included.
Existing divergent files block installation; there is no overwrite option.
The installer is offline. npx may download the package before it runs.
Doctor is read-only. Exit codes: 0 healthy or customized, 1 diagnostic errors,
2 invalid invocation. Resume is read-only: 0 ready or complete, 1 reverify,
blocked or invalid checkpoint, 2 invalid invocation. File integrity does not prove native agent behavior.
`;

try {
  const { values, positionals } = parseArgs({ options: {
    tool: { type: 'string' }, dest: { type: 'string' }, modules: { type: 'string' },
    'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    json: { type: 'boolean' }, checkpoint: { type: 'string' },
  }, allowPositionals: true, strict: true });
  if (values.help) console.log(help);
  else {
    if (positionals.length !== 1 || !['init', 'doctor', 'update-preview', 'resume'].includes(positionals[0] ?? '')) throw new Error(help);
    if (positionals[0] !== 'resume' && values.checkpoint !== undefined) throw new Error('--checkpoint is supported only by resume');
    if (positionals[0] === 'resume') {
      if (values.tool !== undefined || values.modules !== undefined || values['dry-run'] !== undefined) throw new Error('resume accepts only --dest, --checkpoint and --json');
      if (!values.checkpoint?.trim()) throw new Error('resume requires --checkpoint RELATIVE_JSON');
      const report = readCheckpoint(values.dest ?? process.cwd(), values.checkpoint);
      if (values.json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`DevMethod resume: ${report.status}`);
        if (report.scope) console.log(`Scope: ${report.scope}`);
        for (const finding of report.findings) console.log(`${finding.code}${finding.path ? ` [${finding.path}]` : ''}: ${finding.message}`);
        if (report.nextAction) console.log(`Recorded next action: ${report.nextAction}`);
        console.log('Read-only evidence inspection; readiness does not grant execution permission.');
      }
      if (report.status !== 'ready' && report.status !== 'complete') process.exitCode = 1;
    } else if (positionals[0] === 'update-preview') {
      if (values.tool !== undefined || values.modules !== undefined || values['dry-run'] !== undefined) throw new Error('update-preview accepts only --dest and --json');
      const report = previewUpdate(values.dest ?? process.cwd());
      if (values.json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`DevMethod update preview: ${report.status}; installed ${report.installed?.packageVersion ?? 'unknown'} → bundled ${report.candidate?.packageVersion ?? 'unknown'}`);
        for (const entry of report.entries) console.log(`${entry.classification}: ${entry.path}${entry.collision ? ' (existing unrecorded file)' : ''}${entry.missing ? ' (missing locally)' : ''}; candidate changed: ${entry.candidateChanged}`);
        for (const finding of report.findings) console.log(`${finding.code}: ${finding.message}`);
        console.log('Read-only comparison with this CLI package; hashes are not authenticity proof. Review a fresh staging installation before any manual update.');
      }
      if (report.status === 'error') process.exitCode = 1;    } else if (positionals[0] === 'doctor') {
      if (values.tool !== undefined || values.modules !== undefined || values['dry-run'] !== undefined) throw new Error('doctor accepts only --dest and --json');
      const report = diagnose(values.dest ?? process.cwd());
      if (values.json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`DevMethod doctor: ${report.status} (${report.unchanged}/${report.checked} recorded files unchanged)`);
        for (const finding of report.findings) console.log(`${finding.severity}: ${finding.code}${finding.path ? ` [${finding.path}]` : ''} — ${finding.message}`);
        console.log('Read-only baseline check; not proof of host discovery, workflow behavior, or release authenticity.');
      }
      if (report.status === 'error') process.exitCode = 1;
    } else {
      if (values.json !== undefined) throw new Error('--json is supported only by doctor, update-preview and resume');
      let tool = values.tool;
      if (!tool && stdin.isTTY && stdout.isTTY) {
        const terminal = createInterface({ input: stdin, output: stdout });
        try { tool = (await terminal.question('Tool (codex / claude / cursor): ')).trim(); }
        finally { terminal.close(); }
      }
      if (!tool || !Object.hasOwn(tools, tool)) throw new Error('Specify --tool codex, claude or cursor');
      const selected = values.modules?.split(',').map(name => name.trim());
      const result = initialize({ destination: values.dest ?? process.cwd(), tool: tool as Tool, selected, dryRun: values['dry-run'] });
      console.log(JSON.stringify(result, null, 2));
      console.log('Next: read START_HERE.md, fill PROJECT_PROFILE.md and merge instructions intentionally.');
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
