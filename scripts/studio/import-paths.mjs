// Shared, filesystem-independent path contract, including ordinary Next route names.
export function validRelativePath(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 512 &&
    !value.includes('\\') &&
    value
      .split('/')
      .every(
        (part) =>
          part !== '.' && part !== '..' && /^[\p{L}\p{N}_. ()\u005b\u005d@+-]+$/u.test(part),
      )
  );
}
