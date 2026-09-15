import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkPath } from '../../dist/filesystem.js';
/** macOS-only verified fixture runner. No network or writable filesystem. */
export function verifyFixture(directory, args) {
  if (process.platform !== 'darwin')
    return {
      status: null,
      error: new Error('Native verification adapter currently supports macOS only.'),
      stdout: '',
      stderr: '',
    };
  directory = path.resolve(directory);
  checkPath(directory);
  const roots = [
    directory,
    path.dirname(process.execPath),
    '/System',
    '/usr',
    '/bin',
    '/Library',
    '/opt/homebrew',
    '/dev',
  ];
  const profile = `(version 1) (allow default) (deny network*) (deny file-write*) (deny file-read* (subpath "/Users") (subpath "/private/tmp") (subpath "/private/var/folders")) (allow file-read-metadata) (allow file-read* ${roots.map((p) => `(subpath ${JSON.stringify(p)})`).join(' ')}) (allow file-write* (literal "/dev/null"))`;
  return spawnSync('/usr/bin/sandbox-exec', ['-p', profile, process.execPath, ...args], {
    cwd: directory,
    env: { PATH: process.env.PATH, LANG: 'en_US.UTF-8' },
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  });
}
