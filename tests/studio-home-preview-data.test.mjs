import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { withHomeDataSnapshot } from '../scripts/studio/home-preview-data.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'home-data-'));
  fs.mkdirSync(path.join(root, '.devmethod'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('home snapshot renders saved data without network and refuses mutations without changing the file', async (t) => {
  const root = fixture(t),
    file = path.join(root, '.devmethod/data.json');
  const saved = { version: 3, data: { title: '</script><script>evil()</script>', seats: 6 } };
  fs.writeFileSync(file, JSON.stringify(saved));
  const original = fs.readFileSync(file);
  const html = withHomeDataSnapshot(
    Buffer.from('<!doctype html><script src="app.js"></script>'),
    root,
  ).toString();
  assert.ok(html.startsWith('<!doctype html><script>'));
  assert.doesNotMatch(html, /<script>evil/);
  const source = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>'));
  let network = 0;
  const context = vm.createContext({
    URL,
    Response,
    location: {
      href: 'http://127.0.0.1:5010/projects/p/revisions/r/index.html',
      origin: 'http://127.0.0.1:5010',
    },
    fetch: async () => {
      network++;
      throw new Error('CSP network blocked');
    },
  });
  vm.runInContext(source, context);
  assert.deepEqual(await (await context.fetch('/api/data')).json(), saved);
  const response = await context.fetch(new URL('http://127.0.0.1:5010/api/data'), {
    method: 'POST',
    body: '{}',
  });
  assert.equal(response.status, 405);
  assert.deepEqual(
    await (await context.fetch({ url: 'http://127.0.0.1:5010/api/data', method: 'GET' })).json(),
    saved,
  );
  assert.equal(network, 0);
  await assert.rejects(context.fetch('https://other.example/api/data'), /CSP/);
  assert.equal(network, 1);
  assert.deepEqual(fs.readFileSync(file), original);
});

test('missing, malformed, oversized or symlinked data are not invented or exposed', (t) => {
  const root = fixture(t),
    file = path.join(root, '.devmethod/data.json');
  const html = Buffer.from('<h1>Existing page</h1>');
  assert.equal(withHomeDataSnapshot(html, root), html);
  assert.equal(fs.existsSync(file), false);
  for (const invalid of [
    'broken',
    '{"version":1,"data":[]}',
    JSON.stringify({ version: 1, data: { text: 'x'.repeat(1024 * 1024) } }),
  ]) {
    fs.writeFileSync(file, invalid);
    assert.equal(withHomeDataSnapshot(html, root), html);
  }
  const outside = path.join(root, 'outside.json');
  fs.writeFileSync(outside, JSON.stringify({ version: 1, data: { secret: 'outside' } }));
  fs.unlinkSync(file);
  fs.symlinkSync(outside, file);
  assert.equal(withHomeDataSnapshot(html, root), html);
});
