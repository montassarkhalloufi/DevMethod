import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const assetRoot = path.resolve('studio-ui/src/features/connectors/assets/brands');
const manifest = JSON.parse(fs.readFileSync(path.join(assetRoot, 'manifest.json'), 'utf8'));
const compiled = await build({
  stdin: {
    contents: `import {createElement} from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import {ConnectorIcon} from './ConnectorIcon';
      export {connectorIconSource} from './connector-icon-sources';
      export const render = (props) => renderToStaticMarkup(createElement(ConnectorIcon, props));`,
    resolveDir: path.resolve('studio-ui/src/features/connectors/components'),
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  external: ['react', 'react-dom/server', 'react/jsx-runtime'],
  loader: { '.css': 'empty', '.svg': 'dataurl' },
});
const output = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: output,
  exports: output.exports,
  require: createRequire(import.meta.url),
});
const { render, connectorIconSource } = output.exports;

test('vendored brand SVGs match pinned provenance and contain no active or external content', () => {
  assert.deepEqual(
    fs
      .readdirSync(assetRoot)
      .filter((file) => file.endsWith('.svg'))
      .sort(),
    manifest.assets.map((asset) => asset.file).sort(),
  );
  let total = 0;
  for (const asset of manifest.assets) {
    assert.match(asset.file, /^[a-z0-9]+\.svg$/);
    const bytes = fs.readFileSync(path.join(assetRoot, asset.file));
    total += bytes.length;
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.equal(
      asset.upstream,
      `https://raw.githubusercontent.com/simple-icons/simple-icons/${manifest.version}/icons/${asset.file}`,
    );
    const dom = new JSDOM(bytes.toString('utf8'), { contentType: 'image/svg+xml' });
    const svg = dom.window.document.documentElement;
    assert.equal(svg.localName, 'svg');
    assert.equal(svg.getAttribute('viewBox'), '0 0 24 24');
    for (const element of [svg, ...svg.querySelectorAll('*')]) {
      assert.ok(['svg', 'title', 'path'].includes(element.localName));
      for (const attribute of element.getAttributeNames())
        assert.ok(['role', 'viewBox', 'xmlns', 'd'].includes(attribute));
    }
    dom.window.close();
    for (const optionId of asset.optionIds)
      assert.match(connectorIconSource(optionId), /^data:image\/svg\+xml[;,]/);
  }
  assert.ok(total < 65536, 'Keep the local icon subset bounded');
});

test('unknown or inherited identifiers render text without constructing an image URL', () => {
  for (const optionId of [
    '__proto__',
    'constructor',
    '../../outside.svg',
    'https://tracker.invalid/icon.svg',
    '<script>alert(1)</script>',
    'playwright',
    'application-mcp',
  ]) {
    assert.equal(connectorIconSource(optionId), undefined);
    const dom = new JSDOM(render({ optionId }));
    assert.equal(dom.window.document.querySelector('img, svg, script'), null);
    assert.ok(dom.window.document.querySelector('.connector-icon').textContent.length > 0);
    dom.window.close();
  }
});

test('brand icons are decorative by default and named only when requested', () => {
  const decorative = new JSDOM(render({ optionId: 'github' }));
  const wrapper = decorative.window.document.querySelector('.connector-icon');
  assert.equal(wrapper.getAttribute('aria-hidden'), 'true');
  assert.equal(wrapper.getAttribute('role'), null);
  assert.equal(wrapper.style.width, '32px');
  const image = wrapper.querySelector('img');
  assert.equal(image.alt, '');
  assert.equal(image.width, 21);
  assert.equal(image.height, 21);
  decorative.window.close();

  const named = new JSDOM(render({ optionId: 'github', title: 'GitHub <script>', size: 48 }));
  const icon = named.window.document.querySelector('.connector-icon');
  assert.equal(icon.getAttribute('role'), 'img');
  assert.equal(icon.getAttribute('aria-label'), 'GitHub <script>');
  assert.equal(icon.getAttribute('aria-hidden'), null);
  assert.equal(icon.style.width, '48px');
  assert.equal(named.window.document.querySelector('script'), null);
  named.window.close();
});

test('fallback icons preserve accessible names and finite, bounded dimensions', () => {
  for (const [size, expected] of [
    [0, 16],
    [1000, 96],
    [NaN, 32],
    [Infinity, 32],
  ]) {
    const dom = new JSDOM(render({ optionId: 'application-api', title: 'API existante', size }));
    const icon = dom.window.document.querySelector('.connector-icon');
    assert.equal(icon.textContent, 'API');
    assert.equal(icon.getAttribute('aria-label'), 'API existante');
    assert.equal(icon.style.width, expected + 'px');
    assert.equal(icon.style.height, expected + 'px');
    dom.window.close();
  }
});
