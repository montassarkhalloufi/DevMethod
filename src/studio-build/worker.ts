import fs from 'node:fs';
import path from 'node:path';
import { bundle } from './bundle.js';
import { createResolution, packageRoot } from './resolution.js';
import { typecheck } from './typecheck.js';
import { MAX_BYTES, problem, type CompilerInput, type CompilerOutput } from './types.js';

function versions(): Record<string, string> {
  return Object.fromEntries(
    ['react', 'typescript', 'esbuild', 'tailwindcss'].map((name) => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(packageRoot(name), 'package.json'), 'utf8'),
      ) as { version: string };
      return [name, pkg.version];
    }),
  );
}

async function readInput(): Promise<CompilerInput> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BYTES * 2) throw new Error('Instantané trop volumineux.');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString()) as CompilerInput;
}

async function main(): Promise<CompilerOutput> {
  const result: CompilerOutput = { ok: false, diagnostics: [], outputs: [], versions: versions() };
  try {
    const input = await readInput();
    const context = createResolution(input);
    result.diagnostics = typecheck(context);
    if (result.diagnostics.some((item) => item.severity === 'error')) return result;
    result.outputs = await bundle(context);
    result.diagnostics.push({
      severity: 'info',
      file: 'build',
      message:
        'TypeScript strict et bundle React vérifiés. Les classes Tailwind doivent être écrites entièrement ; les scripts package et configurations du projet ne sont pas exécutés.',
      direction:
        'Vérifier le comportement et le rendu dans l’aperçu ; ces contrôles ne prouvent pas l’adéquation du produit.',
    });
    result.ok = true;
  } catch (error) {
    result.diagnostics.push(problem(error instanceof Error ? error.message : String(error)));
  }
  return result;
}

process.stdout.write(JSON.stringify(await main()));
