#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { prepareReview } from './review-cli.js';
import { openReview } from './review-open.js';
// Installed with scoped-delivery. The agent supplies its real review record;
// no demo mode, package download or repository command is available here.
try {
    const { values, positionals } = parseArgs({ options: {
            dest: { type: 'string' }, review: { type: 'string' },
            output: { type: 'string' }, markdown: { type: 'string' }, open: { type: 'boolean' },
        }, allowPositionals: false });
    if (positionals.length || !values.review || !values.output || !values.markdown) {
        throw new Error('Expected --review REAL_JSON --output FRESH_HTML --markdown FRESH_MD [--dest PROJECT] [--open].');
    }
    const result = prepareReview({ destination: values.dest ?? process.cwd(), review: values.review,
        output: values.output, markdown: values.markdown });
    console.log(JSON.stringify(result, null, 2));
    if (values.open)
        openReview(result.outputs[0]);
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
}
