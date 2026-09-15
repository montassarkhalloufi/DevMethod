import { parseArgs } from 'node:util';
import { runGuard } from './guard.js';
import type { GuardCommand } from './commands.js';
import { text } from './records.js';

export function runGuardCli(args: string[]): void {
  try {
    const { values, positionals } = parseArgs({
      args,
      strict: true,
      allowPositionals: true,
      options: {
        command: { type: 'string' },
        dest: { type: 'string' },
        session: { type: 'string' },
        mission: { type: 'string' },
        report: { type: 'string' },
        artifacts: { type: 'string' },
        checkpoint: { type: 'string' },
        diagnosis: { type: 'string' },
        adjustment: { type: 'string' },
      },
    });
    if (
      positionals.length ||
      !values.session ||
      !values.mission ||
      !['/implement', '/verify', '/integrate'].includes(values.command ?? '')
    )
      throw new Error('Invalid guard invocation.');
    if ([values.diagnosis, values.adjustment].some((note) => note !== undefined && !text(note)))
      throw new Error('Invalid correction notes.');
    const result = runGuard({
      command: values.command as GuardCommand,
      root: values.dest ?? process.cwd(),
      session: values.session,
      missionPath: values.mission,
      reportPath: values.report,
      artifactPath: values.artifacts,
      checkpointPath: values.checkpoint,
      diagnosis: values.diagnosis,
      adjustment: values.adjustment,
    });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.allowed ? 0 : 1;
  } catch {
    console.log(
      JSON.stringify({
        format: 1,
        status: 'invalid',
        allowed: false,
        reason: 'invalid-guard-invocation',
        nextAction: null,
      }),
    );
    process.exitCode = 2;
  }
}
