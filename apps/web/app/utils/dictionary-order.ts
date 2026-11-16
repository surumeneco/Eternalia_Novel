/**
 * Reader dictionary words are ordered by their published spelling only.
 * Manual author order and the part-of-speech master order are unrelated.
 * A stable ID tie-break avoids engine-dependent swaps of collation-equivalent
 * spellings; it does not change the public filtering or grouping boundaries.
 */
export function compareDictionaryWordSpelling(
  left: { id: string; content: { title: string } },
  right: { id: string; content: { title: string } },
): number {
  const spellingOrder = left.content.title.localeCompare(right.content.title, 'ja');
  if (spellingOrder !== 0) return spellingOrder;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}
