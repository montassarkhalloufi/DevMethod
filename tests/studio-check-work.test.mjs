import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fileManifest } from '../scripts/studio/files.mjs';
import { serializeWorkReport } from '../scripts/studio/check-work.mjs';

const script = fileURLToPath(new URL('../scripts/studio/check-work.mjs', import.meta.url));

function fixture(t, sources) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-check-work-'));
  const source = path.join(root, 'app');
  for (const [file, content] of Object.entries(sources)) {
    const target = path.join(source, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, source };
}

function run(args) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [script, ...args],
      { timeout: 30000, maxBuffer: 65536 },
      (error, stdout, stderr) => {
        if (error && typeof error.code !== 'number') return reject(error);
        resolve({
          code: error?.code ?? 0,
          report: JSON.parse(stdout),
          stderr,
          bytes: Buffer.byteLength(stdout),
        });
      },
    );
  });
}

test('CLI reports static syntax success without executing application or package scripts or modifying sources', async (t) => {
  const f = fixture(t, {
    'index.html': '<script>throw new Error("DO NOT EXECUTE")</script>',
    'package.json': '{"scripts":{"test":"touch NEVER_RUN"}}',
  });
  const before = fileManifest(f.source);
  const result = await run(['--source', f.source]);
  assert.equal(result.code, 0);
  assert.equal(result.report.admissionReceipt, false);
  assert.equal(result.report.provenance, 'agent-executed-local-check');
  assert.match(result.report.sourceFingerprint, /^[a-f0-9]{64}$/);
  assert.ok(
    result.report.checks.every((check) => !('executor' in check) && !('revisionId' in check)),
  );
  assert.deepEqual(fileManifest(f.source), before);
  assert.deepEqual(fs.readdirSync(f.root), ['app']);
  assert.ok(result.bytes <= 32769);
});

test('invalid JSON and inline module syntax return failure diagnostics and clean up the temporary snapshot', async (t) => {
  const f = fixture(t, {
    'index.html': '<script type="module">const broken = ;</script>',
    'data.json': '{invalid',
  });
  const before = fileManifest(f.source);
  const result = await run(['--source', f.source]);
  assert.equal(result.code, 1);
  assert.equal(result.report.ok, false);
  assert.ok(result.report.checks.some((check) => check.status === 'failed'));
  assert.match(JSON.stringify(result.report.checks), /SyntaxError|JSON/);
  assert.deepEqual(fileManifest(f.source), before);
  assert.deepEqual(fs.readdirSync(f.root), ['app']);
});

for (const invalid of [false, true])
  test(`React strict compilation ${invalid ? 'rejects type errors' : 'passes supported source'} through the CLI`, async (t) => {
    const f = fixture(t, {
      'index.html': '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
      'package.json': '{"devmethod":{"profile":"react-ts"}}',
      'src/main.tsx': `import {createRoot} from 'react-dom/client';const label:number=${invalid ? '"invalid"' : '1'};createRoot(document.getElementById('root')!).render(<h1>{label}</h1>);`,
    });
    const before = fileManifest(f.source);
    const result = await run(['--source', f.source]);
    assert.equal(result.code, invalid ? 1 : 0);
    assert.equal(result.report.profile, 'react-ts');
    assert.equal(result.report.checks.at(-1).status, invalid ? 'failed' : 'passed');
    if (invalid) assert.match(result.report.checks.at(-1).diagnostics, /src\/main.tsx/);
    assert.deepEqual(fileManifest(f.source), before);
    assert.deepEqual(fs.readdirSync(f.root), ['app']);
  });

test('invalid CLI inputs return bounded JSON failure', async () => {
  for (const args of [
    [],
    ['--source', 'relative'],
    ['--source', '/missing-source-fixture', '--extra'],
  ]) {
    const result = await run(args);
    assert.equal(result.code, 1);
    assert.equal(result.report.ok, false);
    assert.ok(result.report.error);
  }
  const bounded = serializeWorkReport({
    ok: false,
    checks: [{ protocol: 'fixture', status: 'failed', diagnostics: 'x'.repeat(100000) }],
  });
  assert.ok(Buffer.byteLength(bounded) <= 32768);
  assert.equal(JSON.parse(bounded).diagnosticsTruncated, true);
});
