#!/usr/bin/env node
import { runStudioCli } from './studio/cli.mjs';
await runStudioCli(process.argv.slice(2));
