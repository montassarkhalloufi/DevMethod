import fs from 'node:fs';
import path from 'node:path';
import { inside } from './snapshot.js';
import { packageRoot } from './resolution.js';
function bundledRoots(context, metafile) {
    const roots = new Set();
    for (const output of Object.values(metafile.outputs)) {
        for (const [input, contribution] of Object.entries(output.inputs)) {
            if (!input.startsWith('trusted:') || contribution.bytesInOutput === 0)
                continue;
            const file = input.slice('trusted:'.length);
            const owner = context.roots
                .filter((root) => inside(root, file))
                .sort((left, right) => right.length - left.length)[0];
            if (!owner)
                throw new Error('Provenance de bibliothèque compilée introuvable.');
            roots.add(owner);
        }
    }
    return roots;
}
function packageNotice(context, root) {
    const metadata = JSON.parse(context.read(path.join(root, 'package.json')) ?? 'null');
    if (typeof metadata?.name !== 'string' || typeof metadata.version !== 'string')
        throw new Error('Métadonnées de licence de bibliothèque invalides.');
    const files = fs
        .readdirSync(root)
        .filter((file) => /^(?:licen[cs]e|copying|notice)(?:\.[^.]+)?$/i.test(file))
        .sort();
    if (!files.some((file) => /^(?:licen[cs]e|copying)(?:\.[^.]+)?$/i.test(file)))
        throw new Error(`Licence complète absente : ${metadata.name}.`);
    const sections = files.map((file) => {
        const content = context.read(path.join(root, file));
        if (!content?.trim())
            throw new Error(`Notice de licence illisible : ${metadata.name}/${file}.`);
        return `${file}\n${content.replaceAll('\r\n', '\n').trim()}`;
    });
    return {
        name: metadata.name,
        text: `${metadata.name} ${metadata.version}\n${sections.join('\n\n')}`,
    };
}
/** Full local notices follow actual emitted JS contributions, including transitive packages. */
export function compiledNotices(context, metafile, hasCSS) {
    const roots = bundledRoots(context, metafile);
    // Styles go through Tailwind before esbuild, so it is absent from the JS metafile.
    if (hasCSS)
        roots.add(packageRoot('tailwindcss'));
    const notices = [...roots]
        .map((root) => packageNotice(context, root))
        .sort((left, right) => left.name.localeCompare(right.name, 'en'));
    const sections = [
        'DevMethod application — third-party notices',
        'JavaScript packages below contributed bytes to this bundle. Tailwind is included when CSS is produced. Versions and full license texts come from the locally installed trusted packages.',
        ...notices.map((notice) => notice.text),
    ];
    for (const name of ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.txt']) {
        const content = context.files.get(path.join(context.sourceRoot, name).replaceAll('\\', '/'));
        if (content)
            sections.push(`Project notice: ${name}\n${content.toString('utf8')}`);
    }
    return sections.join('\n\n-----\n\n') + '\n';
}
