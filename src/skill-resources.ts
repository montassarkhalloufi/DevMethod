const vercelResources = new Set([
  'references/vercel/MANIFEST.json',
  'references/vercel/LICENSE-agent-skills.txt',
  'references/vercel/upstream-agent-skills-README.txt',
  'references/vercel/upstream-web-interface-README.txt',
  'references/vercel/react-best-practices/metadata.json',
  'references/vercel/composition-patterns/metadata.json',
  'references/vercel/web-design-guidelines/LICENSE.txt',
]);

/** Additional non-Markdown files shipped by the reviewed React guidance. */
export function isVercelResource(skill: string, relative: string): boolean {
  return skill === 'react-feature-engineering' && vercelResources.has(relative);
}
