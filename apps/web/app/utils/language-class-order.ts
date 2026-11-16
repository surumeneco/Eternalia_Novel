/**
 * Reorder a language's part-of-speech master by one adjacent position.
 * New entries append in creation order; only the author may reorder the list.
 * Item objects and IDs remain intact. Word-list spelling order is unrelated.
 */
export function moveLanguageClass<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const result = [...items];
  const destination = index + direction;
  if (!Number.isInteger(index) || index < 0 || index >= result.length ||
    destination < 0 || destination >= result.length) return result;
  [result[index], result[destination]] = [result[destination]!, result[index]!];
  return result;
}
