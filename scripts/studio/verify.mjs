import { syntaxProtocol } from './admission.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { safeFile } from './files.mjs';
import { recordCheck } from './domain.mjs';

export const syntaxMode = (file) => (file.endsWith('.cjs') ? 'commonjs' : 'module');

export function checkJavaScript(file, milliseconds = 10000) {
  return checkJavaScriptSource(fs.readFileSync(file), syntaxMode(file), milliseconds);
}

export function checkJavaScriptSource(content, mode, milliseconds = 10000) {
  return new Promise((resolve) => {
    let output = '',
      settled = false;
    const child = spawn(process.execPath, [`--input-type=${mode}`, '--check'], {
      env: {},
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const finish = (code, error = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const location = /^\[(?:stdin|eval\d*)\]:(\d+)/m.exec(output);
      resolve({ code, error, output, line: location ? Number(location[1]) : undefined });
    };
    const timer = setTimeout(
      () => {
        child.kill('SIGKILL');
        output += '\nDélai de contrôle dépassé.';
        finish(1, true);
      },
      Math.max(1, milliseconds),
    );
    const collect = (chunk) => {
      output = (output + chunk).slice(-8000);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (error) => {
      output = error.message;
      finish(1, true);
    });
    child.on('close', (code) => finish(code));
    child.stdin.on('error', (error) => {
      output += `\nLecture stdin interrompue : ${error.message}`;
      finish(1, true);
    });
    child.stdin.end(content);
  });
}

export async function verifySyntax(store, revision) {
  const files = revision.files.filter((file) => /\.(?:m?js|cjs)$/.test(file.path));
  if (!files.length) return;
  const results = [],
    deadline = Date.now() + 10000;
  for (const file of files) {
    if (Date.now() >= deadline) {
      results.push({
        file: file.path,
        code: 1,
        output: 'Borne de 10 secondes atteinte ; ce fichier et les suivants ne sont pas vérifiés.',
      });
      break;
    }
    results.push({
      file: file.path,
      ...(await checkJavaScript(
        safeFile(store.root, `revisions/${revision.id}/app/${file.path}`),
        deadline - Date.now(),
      )),
    });
  }
  store.commit(store.read().version, (state) =>
    recordCheck(
      state,
      {
        revisionId: revision.id,
        label: `Syntaxe JavaScript (${files.length} fichiers) — comportement non évalué`,
        status: results.every((r) => r.code === 0) ? 'passed' : 'failed',
        kind: 'command',
        protocol: syntaxProtocol,
        command:
          'node --input-type=module --check (stdin: octets exacts de chaque .js/.mjs) ; node --input-type=commonjs --check (stdin: octets exacts de chaque .cjs) ; borne globale 10s',
        output: results
          .map((r) => `${r.file}: exit ${r.code}\n${r.output}`)
          .join('\n')
          .slice(0, 16000),
      },
      { executed: true },
    ),
  );
}

export async function candidateSyntaxChecks(root, files) {
  const applicable = files.filter((file) => /\.(?:m?js|cjs)$/.test(file.path));
  if (!applicable.length) return [];
  const deadline = Date.now() + 10000;
  const results = [];
  for (const file of applicable) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      results.push({ file: file.path, status: 'not-run', output: 'Borne globale atteinte.' });
      break;
    }
    const result = await checkJavaScript(safeFile(root, file.path), remaining);
    results.push({
      file: file.path,
      status: result.error ? 'error' : result.code === 0 ? 'passed' : 'failed',
      output: result.output,
    });
  }
  return [
    {
      label: `Syntaxe JavaScript (${applicable.length} fichiers) — comportement non évalué`,
      status: results.every((result) => result.status === 'passed') ? 'passed' : 'failed',
      kind: 'command',
      protocol: syntaxProtocol,
      command:
        'node --input-type=module --check (stdin: octets exacts de chaque .js/.mjs) ; node --input-type=commonjs --check (stdin: octets exacts de chaque .cjs) ; borne globale 10s',
      output: JSON.stringify({
        command: 'node --input-type=module|commonjs --check (stdin)',
        results,
      }).slice(0, 16000),
    },
  ];
}
