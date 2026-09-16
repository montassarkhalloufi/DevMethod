import fs from 'node:fs';
import path from 'node:path';
import { localMarkdownFileExists } from './markdown-links.mjs';
const skip = new Set(['.git', 'node_modules', '.next', 'dist', 'evaluation-private']);

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
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log('Local Markdown file links resolve (external URLs and anchors are not checked).');
