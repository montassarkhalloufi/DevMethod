import fs from 'node:fs';
import path from 'node:path';
import { localMarkdownFileExists } from './markdown-links.mjs';
const skip = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'evaluation-private']);

function files(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((e) =>
      skip.has(e.name) || e.isSymbolicLink()
        ? []
        : e.isDirectory()
          ? files(path.join(root, e.name))
          : e.name.endsWith('.md')
            ? [path.join(root, e.name)]
            : [],
    );
}

const failures = [];
for (const file of files('.')) {
  for (const [, target] of fs
    .readFileSync(file, 'utf8')
    .matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    if (/^[a-z]+:|^#|^<|\$|\{/.test(target)) continue;
    const relative = decodeURIComponent(target.split('#')[0]);
    if (relative && !localMarkdownFileExists(file, relative)) failures.push(`${file}: ${target}`);
  }
}

function localAsset(file, target) {
  if (/^[a-z]+:|^#|^\/\//i.test(target)) return null;
  const relative = decodeURIComponent(target.split(/[?#]/)[0]);
  if (!relative) return null;
  const resolved = path.resolve(path.dirname(file), relative);
  return fs.existsSync(resolved) ? null : `${file}: ${target}`;
}

for (const file of ['docs/handbook/index.html', 'docs/handbook/read.html']) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [, , target] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    const failure = localAsset(file, target);
    if (failure) failures.push(failure);
  }
}

const handbookScript = fs.readFileSync('docs/handbook/handbook.js', 'utf8');
for (const [, target] of handbookScript.matchAll(/['"](docs\/[a-zA-Z0-9._/-]+\.md)['"]/g)) {
  if (!fs.existsSync(target)) failures.push(`docs/handbook/handbook.js: ${target}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'Local Markdown links, handbook assets and indexed deep references resolve (external URLs and anchors are not checked).',
  );
