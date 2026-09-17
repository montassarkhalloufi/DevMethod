import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const outputDirectory = new URL('../dist/studio-ui/', import.meta.url);

function assertBundledDOMPurify(version) {
  const found = new Set();
  for (const file of fs.readdirSync(outputDirectory, { recursive: true })) {
    if (!file.endsWith('.js')) continue;
    const content = fs.readFileSync(new URL(file.replaceAll('\\', '/'), outputDirectory), 'utf8');
    // DOMPurify exposes these adjacent public fields even in the optimized bundle.
    const assignments = /\.version\s*=\s*["']([\d.]+)["']\s*[,;]\s*[\w$]+\.removed\s*=\s*\[\]/g;
    for (const match of content.matchAll(assignments)) found.add(match[1]);
    if (content.includes('monaco-editor/esm/vs/base/browser/dompurify/dompurify.js'))
      throw new Error('Le bundle contient encore la copie DOMPurify vendored de Monaco.');
  }
  if (found.size !== 1 || !found.has(version))
    throw new Error(
      `DOMPurify attendu ${version}, versions réellement embarquées : ${[...found].join(', ') || 'aucune détectée'}.`,
    );
}

const notices = ['DevMethod Studio code editor — bundled third-party notices\n'];
for (const name of ['monaco-editor', 'react', 'react-dom', 'scheduler', 'dompurify']) {
  const entry = require.resolve(name);
  let root = path.dirname(entry);
  while (!fs.existsSync(path.join(root, 'package.json'))) root = path.dirname(root);
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (name === 'dompurify') assertBundledDOMPurify(metadata.version);
  notices.push(`\n${metadata.name} ${metadata.version}\n`);
  for (const file of ['LICENSE', 'LICENSE.txt', 'ThirdPartyNotices.txt'])
    if (fs.existsSync(path.join(root, file)))
      notices.push(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n'));
}
fs.writeFileSync(
  new URL('../dist/studio-ui/THIRD_PARTY_NOTICES.txt', import.meta.url),
  [
    ...notices,
    fs.readFileSync(new URL('../docs/CONNECTOR-ICON-NOTICES.txt', import.meta.url), 'utf8'),
  ].join('\n'),
);
