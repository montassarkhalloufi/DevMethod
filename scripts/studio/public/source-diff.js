const lines = (text) => text.match(/[^\n]*\n|[^\n]+$/g) || [];

function sharedEdges(oldLines, newLines) {
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  )
    prefix++;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - suffix - 1] === newLines[newLines.length - suffix - 1]
  )
    suffix++;
  return { prefix, suffix };
}

function commonSequenceLengths(oldLines, newLines, prefix, oldCount, newCount) {
  const width = newCount + 1;
  const lengths = new Uint32Array(oldCount && newCount ? (oldCount + 1) * width : 0);
  for (let oldIndex = oldCount - 1; oldIndex >= 0 && newCount; oldIndex--)
    for (let newIndex = newCount - 1; newIndex >= 0; newIndex--)
      lengths[oldIndex * width + newIndex] =
        oldLines[prefix + oldIndex] === newLines[prefix + newIndex]
          ? 1 + lengths[(oldIndex + 1) * width + newIndex + 1]
          : Math.max(
              lengths[(oldIndex + 1) * width + newIndex],
              lengths[oldIndex * width + newIndex + 1],
            );
  return lengths;
}

function differenceEntries(oldLines, newLines, prefix, suffix, lengths) {
  const oldCount = oldLines.length - prefix - suffix;
  const newCount = newLines.length - prefix - suffix;
  const width = newCount + 1;
  const entries = [];
  let beforeLine = 1;
  let afterLine = 1;
  const append = (type, text) => {
    entries.push({
      type,
      text,
      beforeLine: type === 'added' ? null : beforeLine++,
      afterLine: type === 'removed' ? null : afterLine++,
    });
  };
  for (let index = 0; index < prefix; index++) append('equal', oldLines[index]);
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldCount || newIndex < newCount) {
    if (
      oldIndex < oldCount &&
      newIndex < newCount &&
      oldLines[prefix + oldIndex] === newLines[prefix + newIndex]
    ) {
      append('equal', oldLines[prefix + oldIndex++]);
      newIndex++;
    } else if (
      oldIndex < oldCount &&
      (newIndex === newCount ||
        lengths[(oldIndex + 1) * width + newIndex] >= lengths[oldIndex * width + newIndex + 1])
    ) {
      append('removed', oldLines[prefix + oldIndex++]);
    } else {
      append('added', newLines[prefix + newIndex++]);
    }
  }
  for (let index = oldLines.length - suffix; index < oldLines.length; index++)
    append('equal', oldLines[index]);
  return entries;
}

// Exact line comparison within a fixed work budget. Line endings are retained,
// including the distinction between a final newline and an unterminated line.
export function compareLineSources(
  before,
  after,
  { maxCells = 2_000_000, maxCharacters = 524_288, maxLines = 12_000 } = {},
) {
  if (typeof before !== 'string' || typeof after !== 'string')
    throw new TypeError('Deux contenus textuels complets sont nécessaires.');
  if (before.length + after.length > maxCharacters)
    return {
      kind: 'limited',
      reason: 'Les fichiers dépassent la limite de taille de comparaison.',
    };
  const oldLines = lines(before);
  const newLines = lines(after);
  if (oldLines.length + newLines.length > maxLines)
    return { kind: 'limited', reason: 'Les fichiers contiennent trop de lignes pour cet aperçu.' };
  const { prefix, suffix } = sharedEdges(oldLines, newLines);
  const oldCount = oldLines.length - prefix - suffix;
  const newCount = newLines.length - prefix - suffix;
  if (oldCount && newCount && (oldCount + 1) * (newCount + 1) > maxCells)
    return { kind: 'limited', reason: 'La comparaison dépasse le budget de calcul de cet aperçu.' };
  const lengths = commonSequenceLengths(oldLines, newLines, prefix, oldCount, newCount);
  const entries = differenceEntries(oldLines, newLines, prefix, suffix, lengths);
  return {
    kind: 'available',
    entries,
    added: entries.filter((entry) => entry.type === 'added').length,
    removed: entries.filter((entry) => entry.type === 'removed').length,
  };
}
