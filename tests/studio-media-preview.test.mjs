import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPreview } from '../scripts/studio/preview.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { queueRequest, updateProject } from '../scripts/studio/domain.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

test('video and captions retain browser media types and exact bytes in live and exported previews', async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-media-'));
  const store = createStudioStore(path.join(root, 'source'));
  const servers = [];
  t.after(async () => {
    for (const server of servers) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Media',
      idea: 'Captioned film',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Add a local film' });
  });
  const jobs = createJobs(store);
  const claim = jobs.claim('fixture');
  const assets = [
    ['film.mp4', 'video/mp4', Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 255])],
    [
      'film.en.vtt',
      'text/vtt; charset=utf-8',
      Buffer.from('WEBVTT\n\n00:00.000 --> 00:02.000\nA clear direction.\n'),
    ],
  ];
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<video controls src="film.mp4"><track kind="captions" src="film.en.vtt" srclang="en"></video>',
  );
  for (const [name, , bytes] of assets)
    fs.writeFileSync(path.join(claim.workDirectory, name), bytes);
  jobs.finish({ jobId: claim.job.id, title: 'Captioned film', summary: 'Media response fixture' });
  fs.writeFileSync(
    path.join(store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  const restored = path.join(root, 'restored');
  restoreArchive(exportProject(store.root, store.read()), restored);
  const portable = await import(pathToFileURL(path.join(restored, 'runtime/preview.mjs')).href);
  for (const [workspace, factory] of [
    [store.root, createPreview],
    [restored, portable.createPreview],
  ]) {
    const server = factory({ workspace, getState: () => store.read() });
    servers.push(server);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    for (const [name, type, bytes] of assets) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/${name}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), type);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    }
  }
});
