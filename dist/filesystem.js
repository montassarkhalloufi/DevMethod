import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const HASH_BUFFER_BYTES = 64 * 1024;
export const MAX_MANIFEST_BYTES = 1024 * 1024;
/** Hash a regular file with a fixed read buffer; concurrent replacement is outside this contract. */
export function hashFileSha256(file) {
    checkPath(file);
    if (!stat(file)?.isFile())
        throw new Error('Expected a regular file.');
    const descriptor = fs.openSync(file, 'r');
    try {
        if (!fs.fstatSync(descriptor).isFile())
            throw new Error('Expected a regular file.');
        const hash = createHash('sha256');
        const buffer = Buffer.allocUnsafe(HASH_BUFFER_BYTES);
        let count;
        while ((count = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
            hash.update(buffer.subarray(0, count));
        }
        return hash.digest('hex');
    }
    finally {
        fs.closeSync(descriptor);
    }
}
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
/** Parse errors must never echo input bytes into logs or JSON reports. */
export function parseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error('Invalid JSON record; source text omitted.');
    }
}
