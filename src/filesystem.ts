import * as fs from 'node:fs';
import path from 'node:path';

export function stat(file: string): fs.Stats | undefined {
  try { return fs.lstatSync(file); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

export function checkPath(file: string): void {
  for (let current = file; ; current = path.dirname(current)) {
    const info = stat(current);
    if (info?.isSymbolicLink()) throw new Error(`Symbolic links are not accepted: ${current}`);
    if (current !== file && info && !info.isDirectory()) throw new Error(`Not a directory: ${current}`);
    if (path.dirname(current) === current) break;
  }
}
