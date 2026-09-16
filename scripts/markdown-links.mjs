import fs from 'node:fs';
import path from 'node:path';

const misplacedVercelRules = new Set([
  './async-defer-await.md',
  './async-cheap-condition-before-await.md',
  './server-hoist-static-io.md',
]);

export function localMarkdownFileExists(file, relative) {
  if (fs.existsSync(path.resolve(path.dirname(file), relative))) return true;

  // Pinned Vercel AGENTS.md omits rules/ in exactly these three links.
  // Preserve its source bytes and still require an actual target file.
  return (
    file
      .replaceAll('\\', '/')
      .endsWith('/react-feature-engineering/references/vercel/react-best-practices/AGENTS.md') &&
    misplacedVercelRules.has(relative) &&
    fs.existsSync(path.resolve(path.dirname(file), 'rules', relative))
  );
}
