#!/usr/bin/env node
// Keep the opt-in controller parser separate from the established inspection commands.
if (process.argv[2] === 'guard') {
  const { runGuardCli } = await import('./guard-cli.js');
  runGuardCli(process.argv.slice(3));
} else {
  await import('./cli-commands.js');
}

export {};
