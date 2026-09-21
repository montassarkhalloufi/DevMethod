import path from 'node:path';
import { compile } from 'tailwindcss';
import { inside } from './snapshot.js';
import { packageRoot, type Resolution } from './resolution.js';

function checkDirectives(css: string): void {
  if (/@(?:plugin|config|source)\b/i.test(css))
    throw new Error(
      'Les directives Tailwind @plugin, @config et @source externes ne sont pas exécutées dans Studio.',
    );
  if (/@import\s+(?:url\s*\(|["'](?:[a-z]+:|\/\/))/i.test(css))
    throw new Error('Les imports CSS réseau ou url() ne sont pas pris en charge.');
}

export async function compileStyles(
  css: string,
  file: string,
  context: Resolution,
): Promise<string> {
  const tailwindRoot = packageRoot('tailwindcss');
  checkDirectives(css);
  const compiled = await compile(css, {
    base: path.dirname(file),
    from: file,
    loadModule: async () => {
      throw new Error('Module Tailwind exécutable refusé (@plugin/@config).');
    },
    loadStylesheet: async (id, base) => {
      let resolved: string;
      if (id === 'tailwindcss') resolved = path.join(tailwindRoot, 'index.css');
      else if (inside(tailwindRoot, base) && id.startsWith('.')) resolved = path.resolve(base, id);
      else if (id.startsWith('.') || id.startsWith('@/'))
        resolved = context.local(id, path.join(base, '_style.css'));
      else throw new Error(`Import CSS non autorisé : ${id}`);
      const content = context.read(resolved);
      if (content === undefined) throw new Error(`Feuille de style absente : ${id}`);
      checkDirectives(content);
      return { path: resolved, base: path.dirname(resolved), content };
    },
  });
  if (compiled.sources.length || (compiled.root && compiled.root !== 'none'))
    throw new Error(
      'Une source Tailwind externe est refusée. Les classes sont recherchées dans le seul instantané.',
    );
  const candidates = new Set<string>();
  for (const [name, bytes] of context.files) {
    const relative = path.relative(context.sourceRoot, name).replaceAll('\\', '/');
    if (relative !== 'index.html' && !relative.startsWith('src/')) continue;
    if (!/\.(?:tsx?|jsx?|html)$/.test(name)) continue;
    for (const token of bytes.toString().split(/[\s"'`<>]/))
      if (token.length < 200) candidates.add(token);
  }
  return compiled.build([...candidates]);
}
