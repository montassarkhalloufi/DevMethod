import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { reviewOpenCommand } from '../dist/review-open.js';

test('browser opening preserves hostile filenames as a single encoded URL without a shell', () => {
  const file = process.platform === 'win32' ? 'C:\\tmp\\review $(touch unwanted); # & quote.html' : '/tmp/review $(touch unwanted); # & quote.html';
  for (const platform of ['darwin', 'linux', 'win32']) {
    const [command, args] = reviewOpenCommand(file, platform);
    assert.ok(command);
    assert.equal(args.at(-1), `file:///${process.platform === 'win32' ? 'C:/' : ''}tmp/review%20$(touch%20unwanted);%20%23%20&%20quote.html`);
    assert.equal(args.length, platform === 'win32' ? 2 : 1);
  }
  assert.throws(() => reviewOpenCommand(file, 'unsupported'), /unavailable/);
});
test('open requires an output before writing and is restricted to review', () => {
  for (const args of [['review', '--demo', '--open'], ['doctor', '--open']]) {
    assert.throws(() => execFileSync(process.execPath, ['dist/cli.js', ...args], {stdio:'pipe'}), e => e.status === 2 && /--open/.test(e.stderr.toString()));
  }
});
