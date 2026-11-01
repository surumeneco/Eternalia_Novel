export interface RichToken { base: string; reading?: string }

export function tokenizeRichContent(source: string): RichToken[] {
  const result: RichToken[] = [];
  const pattern = /｜([^｜《》\r\n\u0085\u2028\u2029]+)《([^｜《》\r\n\u0085\u2028\u2029]+)》/g;
  let offset = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    if (match.index > offset) result.push({ base: source.slice(offset, match.index) });
    result.push({ base: match[1] ?? '', reading: match[2] ?? undefined });
    offset = pattern.lastIndex;
  }
  if (offset < source.length) result.push({ base: source.slice(offset) });
  return result;
}
