import * as fs from 'node:fs';
import path from 'node:path';
export function stat(file) {
    try {
        return fs.lstatSync(file);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return undefined;
        throw error;
    }
}
export function checkPath(file) {
    for (let current = file;; current = path.dirname(current)) {
        const info = stat(current);
        if (info?.isSymbolicLink())
            throw new Error(`Symbolic links are not accepted: ${current}`);
        if (current !== file && info && !info.isDirectory())
            throw new Error(`Not a directory: ${current}`);
        if (path.dirname(current) === current)
            break;
    }
}
