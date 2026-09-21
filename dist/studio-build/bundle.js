import path from 'node:path';
import * as esbuild from 'esbuild';
import { compileStyles } from './styles.js';
import { ALLOWED_PACKAGES } from './types.js';
import { packageName } from './resolution.js';
import { compiledNotices } from './notices.js';
function loader(file) {
    const extension = path.extname(file).slice(1);
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'css'].includes(extension))
        return extension;
    if (['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'woff', 'woff2', 'ico'].includes(extension))
        return 'file';
    throw new Error(`Format importé non pris en charge : ${extension}`);
}
function resolver(context) {
    return {
        name: 'studio-snapshot',
        setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
                if (args.kind === 'entry-point')
                    return {
                        path: context.local('/src/main.tsx', context.sourceRoot + '/index.html'),
                        namespace: 'source',
                    };
                if (args.namespace === 'source') {
                    if (args.path.startsWith('.') || args.path.startsWith('/') || args.path.startsWith('@/'))
                        return { path: context.local(args.path, args.importer), namespace: 'source' };
                    if (!ALLOWED_PACKAGES.includes(packageName(args.path)))
                        throw new Error(`Import non autorisé : ${args.path}`);
                    return { path: context.external(args.path), namespace: 'trusted' };
                }
                return { path: context.external(args.path, args.importer), namespace: 'trusted' };
            });
            build.onLoad({ filter: /.*/, namespace: 'source' }, async (args) => {
                const bytes = context.files.get(args.path);
                if (!bytes)
                    throw new Error('Fichier absent de l’instantané.');
                const kind = loader(args.path);
                const contents = kind === 'css' ? await compileStyles(bytes.toString(), args.path, context) : bytes;
                return { contents, loader: kind, resolveDir: path.dirname(args.path) };
            });
            build.onLoad({ filter: /.*/, namespace: 'trusted' }, (args) => {
                const contents = context.read(args.path);
                if (contents === undefined)
                    throw new Error('Bibliothèque hors des dépendances autorisées.');
                return { contents, loader: loader(args.path), resolveDir: path.dirname(args.path) };
            });
        },
    };
}
function compiledHTML(context, css) {
    const input = context.read(path.join(context.sourceRoot, 'index.html'));
    if (!input)
        throw new Error('index.html est requis.');
    const scripts = [...input.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)];
    const entry = scripts[0]?.[0];
    if (scripts.length !== 1 ||
        !entry ||
        !/\btype\s*=\s*["']module["']/i.test(entry) ||
        !/\bsrc\s*=\s*["']\/?(?:\.\/)?src\/main\.tsx["']/i.test(entry)) {
        throw new Error('index.html doit contenir un seul script module src="/src/main.tsx" ; les scripts supplémentaires ne sont pas vérifiés.');
    }
    let html = input.replace(entry, '<script type="module" src="./assets/app.js"></script>');
    if (css) {
        const link = '<link rel="stylesheet" href="./assets/app.css">';
        html = /<\/head\s*>/i.test(html)
            ? html.replace(/<\/head\s*>/i, link + '</head>')
            : html.replace(/^(\s*<!doctype[^>]*>)?/i, '$&' + link);
    }
    return html;
}
export async function bundle(context) {
    const outdir = path.join(context.sourceRoot, '__studio_output');
    const built = await esbuild.build({
        entryPoints: { app: 'src/main.tsx' },
        outdir,
        entryNames: 'assets/[name]',
        assetNames: 'assets/[name]-[hash]',
        bundle: true,
        platform: 'browser',
        format: 'esm',
        target: 'es2022',
        jsx: 'automatic',
        jsxImportSource: 'react',
        define: { 'process.env.NODE_ENV': '"production"' },
        minify: true,
        legalComments: 'eof',
        metafile: true,
        write: false,
        logLevel: 'silent',
        tsconfigRaw: {
            compilerOptions: { experimentalDecorators: false, useDefineForClassFields: true },
        },
        plugins: [resolver(context)],
    });
    const outputs = built.outputFiles.map((file) => ({
        path: path.relative(outdir, file.path).replaceAll('\\', '/'),
        content: Buffer.from(file.contents).toString('base64'),
    }));
    const html = compiledHTML(context, outputs.some((file) => file.path === 'assets/app.css'));
    outputs.push({
        path: 'THIRD_PARTY_NOTICES.txt',
        content: Buffer.from(compiledNotices(context, built.metafile, outputs.some((file) => file.path.endsWith('.css')))).toString('base64'),
    });
    outputs.push({ path: 'index.html', content: Buffer.from(html).toString('base64') });
    for (const [file, bytes] of context.files) {
        const relative = path
            .relative(path.join(context.sourceRoot, 'public'), file)
            .replaceAll('\\', '/');
        if (relative.startsWith('../') || path.isAbsolute(relative))
            continue;
        if (outputs.some((output) => output.path === relative))
            throw new Error(`Conflit de fichier public : ${relative}`);
        outputs.push({ path: relative, content: bytes.toString('base64') });
    }
    return outputs;
}
