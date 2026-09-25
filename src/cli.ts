#!/usr/bin/env node
// Keep the opt-in controller parser separate from the established inspection commands.
if (process.argv[2] === 'studio') {
  const studioUrl = new URL('../scripts/studio/cli.mjs', import.meta.url).href;
  const { runStudioCli } = await import(studioUrl);
  await runStudioCli(process.argv.slice(3));
} else if (process.argv[2] === 'evidence') {
  const { runApplicationEvidenceCli } = await import('./application-evidence-cli.js');
  await runApplicationEvidenceCli(process.argv.slice(3));
} else if (process.argv[2] === 'guard') {
  const { runGuardCli } = await import('./guard-cli.js');
  runGuardCli(process.argv.slice(3));
} else {
  await import('./cli-commands.js');
}

export {};
