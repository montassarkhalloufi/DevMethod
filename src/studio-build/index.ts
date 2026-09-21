import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inside, manifest, publish, realDirectory, snapshot } from './snapshot.js';
import {
  MAX_BYTES,
  problem,
  type BuildOptions,
  type BuildResult,
  type CompilerInput,
  type CompilerOutput,
} from './types.js';

function runCompiler(
  input: CompilerInput,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<CompilerOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--max-old-space-size=512', fileURLToPath(new URL('./worker.js', import.meta.url))],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          TEMP: process.env.TEMP,
          TMP: process.env.TMP,
        },
      },
    );
    const chunks: Buffer[] = [];
    let size = 0;
    let stderr = '';
    const abort = () => {
      child.kill('SIGKILL');
      reject(new Error('Compilation annulée.'));
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Délai de compilation dépassé.'));
    }, timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BYTES * 2) {
        child.kill('SIGKILL');
        reject(new Error('Réponse du compilateur trop volumineuse.'));
      } else chunks.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(0, 2000);
    });
    child.on('error', reject);
    child.stdin.on('error', () => {
      /* The close event reports a stopped worker. */
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (code !== 0) {
        reject(new Error(`Le compilateur s’est arrêté (${code}): ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()) as CompilerOutput);
      } catch {
        reject(new Error('Réponse du compilateur invalide.'));
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}

export async function buildReactApp(options: BuildOptions): Promise<BuildResult> {
  const result: BuildResult = {
    ok: false,
    protocol: 'react-strict-v1',
    diagnostics: [],
    files: [],
    sourceManifest: [],
    versions: {},
  };
  try {
    if (options.signal?.aborted) throw new Error('Compilation annulée.');
    const sourceRoot = realDirectory(options.sourceRoot),
      outputRoot = realDirectory(options.outputRoot);
    if (inside(sourceRoot, outputRoot) || inside(outputRoot, sourceRoot))
      throw new Error('Les dossiers source et sortie doivent être séparés.');
    const timeout = options.timeoutMs ?? 15000;
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60000)
      throw new Error('Délai de compilation invalide (1–60000 ms).');
    const files = snapshot(sourceRoot);
    result.sourceManifest = manifest(files);
    const compiled = await runCompiler({ sourceRoot, files }, timeout, options.signal);
    result.diagnostics = compiled.diagnostics;
    result.versions = compiled.versions;
    if (!compiled.ok) return result;
    if (options.signal?.aborted) throw new Error('Compilation annulée.');
    if (JSON.stringify(manifest(snapshot(sourceRoot))) !== JSON.stringify(result.sourceManifest))
      throw new Error('La source a changé pendant la compilation.');
    result.files = publish(outputRoot, compiled.outputs);
    result.ok = true;
  } catch (error) {
    result.diagnostics.push(problem(error instanceof Error ? error.message : String(error)));
  }
  return result;
}
