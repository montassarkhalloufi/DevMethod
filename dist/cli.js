#!/usr/bin/env node
import { existsSync } from 'node:fs';
function studioEntry() {
    const source = new URL('../scripts/studio/cli.mjs', import.meta.url);
    if (existsSync(source))
        return source.href;
    try {
        return import.meta.resolve('devmethod-studio/cli');
    }
    catch (error) {
        if (error.code !== 'ERR_MODULE_NOT_FOUND')
            throw error;
        console.error('Studio is a separate package. Install devmethod-studio explicitly, then run devmethod-studio. Nothing was downloaded.');
        process.exitCode = 2;
        return null;
    }
}
// Keep the opt-in controller parser separate from the established inspection commands.
if (process.argv[2] === 'studio') {
    const studioUrl = studioEntry();
    if (studioUrl) {
        const { runStudioCli } = await import(studioUrl);
        await runStudioCli(process.argv.slice(3));
    }
}
else if (process.argv[2] === 'evidence') {
    const { runApplicationEvidenceCli } = await import('./application-evidence-cli.js');
    await runApplicationEvidenceCli(process.argv.slice(3));
}
else if (process.argv[2] === 'guard') {
    const { runGuardCli } = await import('./guard-cli.js');
    runGuardCli(process.argv.slice(3));
}
else {
    await import('./cli-commands.js');
}
