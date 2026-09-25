import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const handbookDirectory = path.join(repositoryRoot, 'docs', 'handbook');
const repositoryURL = 'https://github.com/montassarkhalloufi/DevMethod/blob/main/';
const imageExtension = /\.(?:gif|jpe?g|png|svg|webp)$/i;
const documentExtension = /\.md$/i;
const markerName = 'public-handbook-manifest.json';
const allowedRootDocuments = new Set([
  'README.md',
  'CONTRIBUTING.md',
  'COMPATIBILITY.md',
  'VALIDATION.md',
  'START_HERE.md',
]);

function outputArgument(argv) {
  const inline = argv.find((value) => value.startsWith('--output='));
  if (inline) return inline.slice('--output='.length);
  const position = argv.indexOf('--output');
  return position >= 0 ? argv[position + 1] : undefined;
}

const outputDirectory = path.resolve(
  repositoryRoot,
  outputArgument(process.argv.slice(2)) || 'dist/public-handbook',
);

function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function assertSafeOutput() {
  if (outputDirectory === repositoryRoot || !path.dirname(outputDirectory)) {
    throw new Error(`Refusing unsafe output directory: ${outputDirectory}`);
  }
  if (fs.existsSync(outputDirectory) && !fs.existsSync(path.join(outputDirectory, markerName))) {
    throw new Error(
      `Refusing to replace ${outputDirectory}: it is not an existing public handbook bundle.`,
    );
  }
}

function repositoryPath(absolute) {
  if (!inside(repositoryRoot, absolute)) return null;
  return path.relative(repositoryRoot, absolute).split(path.sep).join('/');
}

function localReference(sourceFile, target) {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(target)) return null;
  const bare = decodeURIComponent(target.split(/[?#]/)[0]);
  if (!bare) return null;
  const absolute = path.resolve(path.dirname(sourceFile), bare);
  const relative = repositoryPath(absolute);
  return relative ? { absolute, relative } : null;
}

function references(markdown) {
  return [...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    (match) => match[1],
  );
}

function htmlReferences(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
}

function copyIntoContent(source, stagingDirectory, included) {
  const relative = repositoryPath(source);
  if (!relative || !fs.existsSync(source) || !fs.statSync(source).isFile()) return false;
  const destination = path.join(stagingDirectory, 'content', relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  included.add(relative);
  return true;
}

function publicDocument(relative) {
  return allowedRootDocuments.has(relative) || /^docs\/[a-zA-Z0-9._/-]+\.md$/.test(relative);
}

function collectReference(sourceFile, target, context) {
  const reference = localReference(sourceFile, target);
  if (!reference || !fs.existsSync(reference.absolute)) return;
  if (documentExtension.test(reference.relative) && publicDocument(reference.relative)) {
    context.pending.add(reference.absolute);
  } else if (imageExtension.test(reference.relative)) {
    copyIntoContent(reference.absolute, context.stagingDirectory, context.included);
  }
}

function collectDocument(source, context) {
  const relative = repositoryPath(source);
  if (!relative || context.visited.has(relative)) return;
  context.visited.add(relative);
  if (!copyIntoContent(source, context.stagingDirectory, context.included)) {
    throw new Error(`Referenced handbook document does not exist: ${relative}`);
  }
  const markdown = fs.readFileSync(source, 'utf8');
  for (const target of references(markdown)) collectReference(source, target, context);
}

function collectContent(indexHTML, handbookScript, stagingDirectory) {
  const context = {
    pending: new Set(),
    visited: new Set(),
    included: new Set(),
    stagingDirectory,
  };

  for (const target of htmlReferences(indexHTML)) {
    collectReference(path.join(handbookDirectory, 'index.html'), target, context);
  }

  for (const match of handbookScript.matchAll(/['"](docs\/[a-zA-Z0-9._/-]+\.md)['"]/g)) {
    context.pending.add(path.join(repositoryRoot, match[1]));
  }

  while (context.pending.size) {
    const source = context.pending.values().next().value;
    context.pending.delete(source);
    collectDocument(source, context);
  }

  return [...context.included].sort();
}

function publicHTML(sourceFile, html) {
  return html
    .replace('data-content-root="../../"', 'data-content-root="./content/"')
    .replace('data-public-bundle="false"', 'data-public-bundle="true"')
    .replace(/\b(href|src)="([^"]+)"/g, (attribute, name, target) => {
      const reference = localReference(sourceFile, target);
      if (!reference) return attribute;
      if (path.dirname(reference.absolute) === handbookDirectory) {
        return `${name}="${path.basename(reference.absolute)}"`;
      }
      if (documentExtension.test(reference.relative) || imageExtension.test(reference.relative)) {
        return `${name}="content/${reference.relative}"`;
      }
      return `${name}="${repositoryURL}${reference.relative}"`;
    });
}

function build() {
  assertSafeOutput();
  const stagingDirectory = `${outputDirectory}.tmp-${process.pid}`;
  fs.rmSync(stagingDirectory, { recursive: true, force: true });
  fs.mkdirSync(stagingDirectory, { recursive: true });

  try {
    const indexPath = path.join(handbookDirectory, 'index.html');
    const readerPath = path.join(handbookDirectory, 'read.html');
    const indexHTML = fs.readFileSync(indexPath, 'utf8');
    const readerHTML = fs.readFileSync(readerPath, 'utf8');
    const handbookScript = fs.readFileSync(path.join(handbookDirectory, 'handbook.js'), 'utf8');

    for (const asset of ['handbook.css', 'handbook.js', 'reader.css', 'reader.js']) {
      fs.copyFileSync(path.join(handbookDirectory, asset), path.join(stagingDirectory, asset));
    }
    fs.writeFileSync(
      path.join(stagingDirectory, 'index.html'),
      publicHTML(indexPath, indexHTML),
      'utf8',
    );
    fs.writeFileSync(
      path.join(stagingDirectory, 'read.html'),
      publicHTML(readerPath, readerHTML),
      'utf8',
    );

    const included = collectContent(indexHTML, handbookScript, stagingDirectory);
    const packageVersion = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
    ).version;
    fs.writeFileSync(
      path.join(stagingDirectory, markerName),
      `${JSON.stringify(
        {
          kind: 'devmethod-public-handbook',
          packageVersion,
          canonicalSource: 'repository Markdown and docs/handbook',
          publicPath: '/docs/handbook/',
          files: included,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    if (fs.existsSync(outputDirectory)) fs.rmSync(outputDirectory, { recursive: true });
    fs.renameSync(stagingDirectory, outputDirectory);
    console.log(`Public handbook built at ${outputDirectory} (${included.length} content files).`);
  } catch (error) {
    fs.rmSync(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

build();
