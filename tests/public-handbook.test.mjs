import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

function markdownTargets(markdown) {
  return [...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    (match) => match[1],
  );
}

function headingIds(markdown) {
  const used = new Map();
  const ids = new Set();
  let fenced = false;
  for (const line of markdown.replaceAll('\r\n', '\n').split('\n')) {
    if (/^```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (!heading) continue;
    const base =
      heading[1]
        .replace(/\s+#+\s*$/, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'section';
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    ids.add(count ? `${base}-${count + 1}` : base);
  }
  return ids;
}

function assertPublishedReferencesResolve(manifest) {
  for (const relative of manifest.files.filter((file) => file.endsWith('.md'))) {
    const source = path.resolve(relative);
    const markdown = fs.readFileSync(source, 'utf8');
    for (const target of markdownTargets(markdown)) {
      if (/^(?:[a-z]+:|\/\/)/i.test(target)) continue;
      const [targetPath, rawFragment] = target.split('#', 2);
      const resolved = targetPath
        ? path.resolve(path.dirname(source), decodeURIComponent(targetPath))
        : source;
      assert.ok(fs.existsSync(resolved), `${relative}: missing local reference ${target}`);
      if (!rawFragment || path.extname(resolved).toLowerCase() !== '.md') continue;
      const ids = headingIds(fs.readFileSync(resolved, 'utf8'));
      const fragment = decodeURIComponent(rawFragment);
      assert.ok(ids.has(fragment), `${relative}: missing fragment ${target}`);
    }
  }
}

test('the public handbook build is autonomous and keeps code links on GitHub', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-handbook-'));
  const output = path.join(temporaryRoot, 'public-handbook');

  try {
    execFileSync(process.execPath, ['scripts/build-public-handbook.mjs', '--output', output], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const index = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    const reader = fs.readFileSync(path.join(output, 'reader.js'), 'utf8');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(output, 'public-handbook-manifest.json'), 'utf8'),
    );

    assert.match(index, /data-content-root="\.\/content\/"/);
    assert.match(index, /data-public-bundle="true"/);
    assert.match(index, /content\/docs\/product\/PROMISE\.md/);
    assert.match(
      index,
      /https:\/\/github\.com\/montassarkhalloufi\/DevMethod\/blob\/main\/src\/cli\.ts/,
    );
    assert.match(reader, /publicBundle/);
    assert.match(reader, /docs\\\/handbook\\\//);
    assert.equal(manifest.kind, 'devmethod-public-handbook');
    assert.ok(manifest.files.includes('docs/product/PROMISE.md'));
    assert.equal(
      manifest.files.some((file) => file.startsWith('.agents/')),
      false,
    );
    assert.equal(
      manifest.files.some((file) => file.startsWith('examples/')),
      false,
    );
    assert.ok(
      manifest.files.includes('docs/missions/control-plane/evidence/browser-overview-desktop.jpg'),
    );
    assert.ok(fs.existsSync(path.join(output, 'content', 'docs', 'product', 'PROMISE.md')));
    assert.ok(
      fs.existsSync(
        path.join(
          output,
          'content',
          'docs',
          'missions',
          'control-plane',
          'evidence',
          'browser-overview-desktop.jpg',
        ),
      ),
    );
    assertPublishedReferencesResolve(manifest);

    execFileSync(process.execPath, ['scripts/build-public-handbook.mjs', '--output', output], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('the builder refuses to replace an unrelated directory', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-handbook-'));
  const output = path.join(temporaryRoot, 'unrelated');
  fs.mkdirSync(output);
  fs.writeFileSync(path.join(output, 'keep.txt'), 'do not replace');

  try {
    assert.throws(() =>
      execFileSync(process.execPath, ['scripts/build-public-handbook.mjs', '--output', output], {
        cwd: process.cwd(),
        stdio: 'pipe',
      }),
    );
    assert.equal(fs.readFileSync(path.join(output, 'keep.txt'), 'utf8'), 'do not replace');
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
