#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { initialize, tools } from './init.js';
const help = `DevMethod — initialize a project with reusable AI skills

devmethod init [--tool codex|claude|cursor] [--dest PATH]
               [--modules name,name] [--dry-run]

Without --tool, an interactive terminal asks which host to use.
Non-interactive calls require --tool. Destination defaults to the current directory.
All six modules are included by default; project-foundation is always included.
Existing divergent files block installation; there is no overwrite option.
The installer is offline. npx may download the package before it runs.
`;
try {
    const { values, positionals } = parseArgs({ options: {
            tool: { type: 'string' }, dest: { type: 'string' }, modules: { type: 'string' },
            'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
        }, allowPositionals: true, strict: true });
    if (values.help)
        console.log(help);
    else {
        if (positionals.length !== 1 || positionals[0] !== 'init')
            throw new Error(help);
        let tool = values.tool;
        if (!tool && stdin.isTTY && stdout.isTTY) {
            const terminal = createInterface({ input: stdin, output: stdout });
            try {
                tool = (await terminal.question('Tool (codex / claude / cursor): ')).trim();
            }
            finally {
                terminal.close();
            }
        }
        if (!tool || !Object.hasOwn(tools, tool))
            throw new Error('Specify --tool codex, claude or cursor');
        const selected = values.modules?.split(',').map(name => name.trim());
        const result = initialize({ destination: values.dest ?? process.cwd(), tool: tool, selected, dryRun: values['dry-run'] });
        console.log(JSON.stringify(result, null, 2));
        console.log('Next: read START_HERE.md, fill PROJECT_PROFILE.md and merge instructions intentionally.');
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
}
