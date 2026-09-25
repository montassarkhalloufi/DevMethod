import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';

export async function checkPackedAtelier(pkg, workspace) {
  const { createAtelierServer } = await import(
    pathToFileURL(path.join(pkg, 'scripts/atelier/server.mjs')).href
  );
  const project = JSON.parse(
    fs.readFileSync(path.join(pkg, 'scripts/atelier/gazette.json'), 'utf8'),
  );
  const server = createAtelierServer({ workspace, project });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + server.address().port;
    for (const asset of [
      '',
      'app.js',
      'views.js',
      'controls.js',
      'style.css',
      'discovery-view.js',
      'transfer',
      'transfer-app.js',
      'transfer.css',
      'discovery/search.mjs',
      'transfer/domain.mjs',
      'transfer/machine.mjs',
    ]) {
      const response = await fetch(url + '/' + asset);
      assert.equal(response.status, 200, 'Packed Atelier asset: ' + asset);
      assert.ok((await response.text()).length > 30);
    }
    const snapshot = await (await fetch(url + '/api/session')).json();
    const discovered = await fetch(url + '/api/discover', {
      method: 'POST',
      headers: { Origin: url, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: snapshot.storageVersion }),
    });
    assert.equal(discovered.status, 200);
    assert.equal((await discovered.json()).status, 'witness');
    assert.deepEqual(await (await fetch(url + '/api/session')).json(), snapshot);
    const response = await fetch(url + '/api/request', {
      method: 'POST',
      headers: { Origin: url, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: snapshot.storageVersion,
        question: 'Packed smoke: preserve existing records in a new proposal.',
      }),
    });
    assert.equal(response.status, 200);
    const handoff = (await response.json()).request;
    assert.match(handoff.task.contract, /applyProposal/);
    assert.equal(handoff.task.project.id, project.id);
    assert.equal(fs.existsSync(handoff.file), true);
    console.log(
      'Packed Atelier: real local assets, read-only discovery, numerical example, persistent project and agent request contract passed. No provider dispatch.',
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
