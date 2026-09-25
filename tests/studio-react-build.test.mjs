import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { buildReactApp } from '../scripts/studio/react-build.mjs';

function fixture(t, files = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-react-'));
  const sourceRoot = path.join(root, 'source'),
    outputRoot = path.join(root, 'compiled');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const sources = {
    'index.html':
      '<!doctype html><html><head><title>Counter</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
    'src/main.tsx':
      'import {createRoot} from "react-dom/client"; import {App} from "./features/counter/View"; import "./styles.css"; const root=document.getElementById("root"); if(!root)throw new Error("missing root");createRoot(root).render(<App/>);',
    'src/features/counter/View.tsx':
      'import {useCounter} from "./useCounter"; export function App(){const {count,increment}=useCounter(); return <button className="text-2xl bg-blue-500 p-4" onClick={increment}>{count}</button>}',
    'src/features/counter/useCounter.ts':
      'import {useState} from "react"; import {add} from "./domain"; export function useCounter(){const [count,setCount]=useState(0);return {count,increment:()=>setCount(value=>add(value,1))}}',
    'src/features/counter/domain.ts': 'export function add(a:number,b:number):number{return a+b}',
    'src/styles.css': '@import "tailwindcss";',
    ...files,
  };
  for (const [name, content] of Object.entries(sources)) {
    const file = path.join(sourceRoot, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return { root, sourceRoot, outputRoot };
}

test('strict React 19 and Tailwind build preserves separate sources and emits actual browser assets', async (t) => {
  const f = fixture(t),
    before = fs.readFileSync(path.join(f.sourceRoot, 'src/main.tsx'), 'utf8');
  const result = await buildReactApp(f);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.match(result.versions.react, /^19\./);
  assert.ok(result.files.some((file) => file.path.endsWith('.js')));
  const css = result.files
    .filter((file) => file.path.endsWith('.css'))
    .map((file) => fs.readFileSync(path.join(f.outputRoot, file.path), 'utf8'))
    .join('\n');
  assert.match(css, /\.text-2xl/);
  assert.match(css, /\.bg-blue-500/);
  assert.match(fs.readFileSync(path.join(f.outputRoot, 'index.html'), 'utf8'), /assets\/app\.js/);
  assert.equal(fs.readFileSync(path.join(f.sourceRoot, 'src/main.tsx'), 'utf8'), before);
});

test('a real strict type mismatch blocks all output even when app tsconfig disables strict', async (t) => {
  const f = fixture(t, {
    'src/features/counter/domain.ts':
      'export function add(a:number,b:number):number { const broken:number="wrong"; return a+b+broken; }',
    'tsconfig.json': '{"compilerOptions":{"strict":false}}',
  });
  const result = await buildReactApp(f);
  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some(
      (d) => d.severity === 'error' && d.file === 'src/features/counter/domain.ts' && d.line === 1,
    ),
  );
  assert.equal(fs.existsSync(f.outputRoot), false);
});

test('package scripts and application JS configuration never run during the trusted build', async (t) => {
  const f = fixture(t);
  const marker = path.join(f.root, 'MUST_NOT_RUN');
  fs.writeFileSync(
    path.join(f.sourceRoot, 'vite.config.js'),
    `import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(marker)},'bad');throw Error('config executed');`,
  );
  fs.writeFileSync(
    path.join(f.sourceRoot, 'package.json'),
    JSON.stringify({ scripts: { build: `node vite.config.js` } }),
  );
  const result = await buildReactApp(f);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(fs.existsSync(marker), false);
});

test('outside imports and Tailwind executable plugins cannot escape the input snapshot', async (t) => {
  const f = fixture(t, {
    'src/features/counter/domain.ts': 'export {add} from "../../../../outside";',
  });
  fs.writeFileSync(
    path.join(f.root, 'outside.ts'),
    'export const PRIVATE_OUTSIDE = "never read"; export const add=()=>0;',
  );
  const outside = await buildReactApp(f);
  assert.equal(outside.ok, false);
  assert.doesNotMatch(JSON.stringify(outside), /PRIVATE_OUTSIDE/);
  fs.writeFileSync(
    path.join(f.sourceRoot, 'src/features/counter/domain.ts'),
    'export const add=(a:number,b:number)=>a+b;',
  );
  fs.writeFileSync(
    path.join(f.sourceRoot, 'src/styles.css'),
    '@import "tailwindcss"; @plugin "../evil.js";',
  );
  fs.writeFileSync(path.join(f.sourceRoot, 'evil.js'), 'throw new Error("EXECUTED");');
  const plugin = await buildReactApp(f);
  assert.equal(plugin.ok, false);
  assert.ok(plugin.diagnostics.some((d) => /plugin|config|module/i.test(d.message)));
  assert.doesNotMatch(JSON.stringify(plugin), /EXECUTED/);
});

test('cancelled or expired compilation publishes no partial output', async (t) => {
  const f = fixture(t),
    controller = new AbortController();
  controller.abort();
  const result = await buildReactApp({ ...f, signal: controller.signal });
  assert.equal(result.ok, false);
  assert.equal(fs.existsSync(f.outputRoot), false);
  const expired = await buildReactApp({ ...f, timeoutMs: 1 });
  assert.equal(expired.ok, false);
  assert.equal(fs.existsSync(f.outputRoot), false);
});

test('the compiled React bundle runs, alias and shadcn dependencies resolve, and a click updates state', async (t) => {
  const f = fixture(t, {
    'src/features/counter/View.tsx': `import {Slot} from '@radix-ui/react-slot'; import {cva} from 'class-variance-authority'; import {clsx} from 'clsx'; import {twMerge} from 'tailwind-merge'; import {useCounter} from '@/features/counter/useCounter'; const variants=cva('p-4',{variants:{size:{large:'text-2xl'}}}); export function App(){const {count,increment}=useCounter(); return <Slot className={twMerge(clsx(variants({size:'large'}),'bg-blue-500'))}><button onClick={increment}>{count}</button></Slot>}`,
  });
  const result = await buildReactApp(f);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const dom = new JSDOM('<div id="root"></div>', {
    runScripts: 'outside-only',
    url: 'http://localhost/',
  });
  t.after(() => dom.window.close());
  dom.window.eval(fs.readFileSync(path.join(f.outputRoot, 'assets/app.js'), 'utf8'));
  await new Promise((resolve) => setTimeout(resolve, 50));
  const button = dom.window.document.querySelector('button');
  assert.equal(button?.textContent, '0');
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(button.textContent, '1');
  assert.match(button.className, /text-2xl/);
});

test('network CSS and unapproved packages fail closed without output', async (t) => {
  const f = fixture(t, { 'src/styles.css': '@import "https://example.invalid/style.css";' });
  const css = await buildReactApp(f);
  assert.equal(css.ok, false);
  assert.match(JSON.stringify(css.diagnostics), /CSS réseau/);
  fs.writeFileSync(path.join(f.sourceRoot, 'src/styles.css'), '@import "tailwindcss";');
  fs.writeFileSync(
    path.join(f.sourceRoot, 'src/main.tsx'),
    'import fs from "node:fs"; console.log(fs);',
  );
  const unsupported = await buildReactApp(f);
  assert.equal(unsupported.ok, false);
  assert.equal(fs.existsSync(f.outputRoot), false);
});

test('a source changed during compilation is rejected and an existing build is never overwritten', async (t) => {
  const f = fixture(t);
  const pending = buildReactApp(f);
  fs.appendFileSync(path.join(f.sourceRoot, 'src/main.tsx'), '\n// new source revision');
  const stale = await pending;
  assert.equal(stale.ok, false);
  assert.match(JSON.stringify(stale.diagnostics), /changé pendant/);
  assert.equal(fs.existsSync(f.outputRoot), false);
  const healthy = await buildReactApp(f);
  assert.equal(healthy.ok, true, JSON.stringify(healthy.diagnostics));
  const original = fs.readFileSync(path.join(f.outputRoot, 'assets/app.js'));
  const repeated = await buildReactApp(f);
  assert.equal(repeated.ok, false);
  assert.match(JSON.stringify(repeated.diagnostics), /doit être nouveau/);
  assert.deepEqual(fs.readFileSync(path.join(f.outputRoot, 'assets/app.js')), original);
});

test(
  'a symlinked source is refused before reading its target',
  {
    skip:
      process.platform === 'win32'
        ? 'Creating symlinks requires an account privilege on Windows.'
        : false,
  },
  async (t) => {
    const f = fixture(t);
    fs.writeFileSync(path.join(f.root, 'outside.ts'), 'PRIVATE_SYMLINK_CONTENT');
    fs.symlinkSync(path.join(f.root, 'outside.ts'), path.join(f.sourceRoot, 'src/linked.ts'));
    const result = await buildReactApp(f);
    assert.equal(result.ok, false);
    assert.match(JSON.stringify(result.diagnostics), /symbolique/);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SYMLINK_CONTENT/);
  },
);

test('unreferenced application sources cannot weaken strict index access or suppress checks', async (t) => {
  const f = fixture(t, {
    'src/unchecked.ts': 'export const first=(items:number[]):number=>items[0];',
    'src/loose.ts': 'export const identity=(value:any)=>value;',
    'src/suppressed.ts': '// @ts-nocheck\nexport const broken:number="wrong";',
  });
  const result = await buildReactApp(f);
  assert.equal(result.ok, false);
  for (const file of ['src/unchecked.ts', 'src/loose.ts', 'src/suppressed.ts']) {
    assert.ok(
      result.diagnostics.some((item) => item.file === file),
      file,
    );
  }
  assert.equal(fs.existsSync(f.outputRoot), false);
});

test('identical sources compile identically in separate roots and CSS loads without an explicit head', async (t) => {
  const files = {
    'index.html':
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>',
  };
  const first = fixture(t, files),
    second = fixture(t, files);
  const a = await buildReactApp(first),
    b = await buildReactApp(second);
  assert.equal(a.ok, true, JSON.stringify(a.diagnostics));
  assert.equal(b.ok, true, JSON.stringify(b.diagnostics));
  assert.deepEqual(a.files, b.files);
  const html = fs.readFileSync(path.join(first.outputRoot, 'index.html'), 'utf8');
  assert.match(html, /href="\.\/assets\/app\.css"/);
  assert.doesNotMatch(
    fs.readFileSync(path.join(first.outputRoot, 'assets/app.js'), 'utf8'),
    /studio-react-/,
  );
});
