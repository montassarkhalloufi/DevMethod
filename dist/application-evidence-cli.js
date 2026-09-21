import { parseArgs } from 'node:util';
import { inspectEvidence, runEvidence, evidenceStatus } from './evidence-runtime.js';
/** Explicit opt-in execution, separate from the legacy behavioral guard. */
export async function runApplicationEvidenceCli(args) {
    try {
        const { values, positionals } = parseArgs({
            args,
            strict: true,
            allowPositionals: true,
            options: {
                dest: { type: 'string' },
                contract: { type: 'string' },
                evaluator: { type: 'string' },
                session: { type: 'string' },
                permit: { type: 'string' },
                diagnosis: { type: 'string' },
                adjustment: { type: 'string' },
            },
        });
        const action = positionals[0];
        if (positionals.length !== 1 ||
            !['plan', 'run', 'status'].includes(action ?? '') ||
            !values.contract ||
            !values.evaluator ||
            (action !== 'plan' && !values.session) ||
            (action === 'run' && !values.permit))
            throw new Error('Invalid invocation.');
        const runOnly = ['permit', 'diagnosis', 'adjustment'];
        if (action !== 'run' && runOnly.some((flag) => values[flag] !== undefined))
            throw new Error('Execution arguments require run.');
        if (action === 'plan' && values.session !== undefined)
            throw new Error('Plan does not open a session.');
        const options = {
            root: values.dest ?? process.cwd(),
            contractPath: values.contract,
            evaluatorRoot: values.evaluator,
        };
        if (action === 'plan') {
            console.log(JSON.stringify(await inspectEvidence(options), null, 2));
            return;
        }
        const result = action === 'run'
            ? await runEvidence({
                ...options,
                session: values.session,
                permit: values.permit,
                diagnosis: values.diagnosis,
                adjustment: values.adjustment,
            })
            : await evidenceStatus({ ...options, session: values.session });
        console.log(JSON.stringify(result, null, 2));
        process.exitCode = result.status === 'supported' ? 0 : 1;
    }
    catch {
        console.log(JSON.stringify({
            format: 1,
            status: 'invalid',
            reason: 'invalid-evidence-invocation-or-input',
            nextAction: null,
        }));
        process.exitCode = 2;
    }
}
