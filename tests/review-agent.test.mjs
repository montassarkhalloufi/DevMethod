import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { initialize, tools } from '../dist/init.js';
import { validateManifest, diagnose } from '../dist/doctor.js';

for (const host of Object.keys(tools)) for (const type of ['commonjs', 'module', 'absent']) {
  test(`installed report flow: ${host}, ${type}, no npm or source checkout`, t => {
    const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'review-agent-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    initialize({ destination: root, tool: host, selected: ['scoped-delivery'] });
    if (type !== 'absent') fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ type }));
    // Synthetic input for deterministic runtime testing, never a real review claim.
    const record = JSON.parse(fs.readFileSync('examples/review/review.json', 'utf8'));
    record.id = 'INSTALLED-FIXTURE'; record.title = 'Installed runtime test';
    fs.writeFileSync(path.join(root, 'input.json'), JSON.stringify(record));
    const script = path.join(root, tools[host], 'scoped-delivery/scripts/review-agent.mjs');
    // Intercept only the OS-opening boundary; exercise real generation and CLI flow.
    fs.writeFileSync(path.join(root, 'open-probe.mjs'), `import cp from 'node:child_process';
import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
cp.spawnSync = (command, args, options) => { fs.writeFileSync('opened.json', JSON.stringify({command,args,options})); return {status:process.env.REVIEW_TEST_OPEN_FAILURE ? 1 : 0}; }; syncBuiltinESMExports();`);
    const run = (args, failOpen = false) => spawnSync(process.execPath, ['--import', pathToFileURL(path.join(root, 'open-probe.mjs')).href, script, ...args], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PATH: '', REVIEW_TEST_OPEN_FAILURE: failOpen ? '1' : '' },
    });
    const args = ['--review', 'input.json', '--output', 'report.html', '--markdown', 'REVIEW.md', '--open'];
    const result = run(args);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).reviewId, 'INSTALLED-FIXTURE');
    assert.match(fs.readFileSync(path.join(root, 'report.html'), 'utf8'), /INSTALLED-FIXTURE/);
    assert.match(fs.readFileSync(path.join(root, 'REVIEW.md'), 'utf8'), /Installed runtime test/);
    const opened = JSON.parse(fs.readFileSync(path.join(root, 'opened.json')));
    assert.equal(opened.options.shell, false);
    assert.ok(opened.args.at(-1).endsWith('/report.html'));
    const before = fs.readFileSync(path.join(root, 'report.html'));
    assert.equal(run(args).status, 2);
    assert.deepEqual(fs.readFileSync(path.join(root, 'report.html')), before);
    assert.equal(run(['--demo']).status, 2);
    const failedOpen = run(['--review', 'input.json', '--output', 'retained.html', '--markdown', 'retained.md', '--open'], true);
    assert.equal(failedOpen.status, 2);
    assert.match(failedOpen.stderr, /preserved/);
    assert.ok(fs.existsSync(path.join(root, 'retained.html')));
    assert.ok(fs.existsSync(path.join(root, 'retained.md')));
    fs.writeFileSync(path.join(root, 'invalid.json'), '{}');
    assert.equal(run(['--review', 'invalid.json', '--output', 'invalid.html', '--markdown', 'invalid.md']).status, 2);
    assert.ok(!fs.existsSync(path.join(root, 'invalid.html')));
    assert.equal(diagnose(root).status, 'ok');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'kit-manifest.json')));
    manifest.files[`${tools[host]}/scoped-delivery/scripts/arbitrary.mjs`] = 'a'.repeat(64);
    assert.throws(() => validateManifest(manifest), /unsupported path/);
    fs.appendFileSync(script, '\n// Local customization\n');
    assert.throws(() => initialize({ destination: root, tool: host, selected: ['scoped-delivery'] }), /Conflict/);
  });
}
