/**
 * ST-04/ST-05: tags are non-hierarchical labels; related tips retain author order.
 * Stored as bounded JSON strings in the alpha's existing content.details column.
 */
type ErrorCode = 'bad-request';
function invalid(message: string): never {
  throw { code: 'bad-request' as ErrorCode, message };
}
function parseArray(raw: string, label: string, maximum: number): string[] {
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { return invalid(label + 'のJSONが不正です。'); }
  if (!Array.isArray(value) || value.length > maximum) invalid(label + 'の形式または件数が不正です。');
  if (!value.every(item => typeof item === 'string')) invalid(label + 'には文字列のみ指定できます。');
  return value as string[];
}
export function parseTipTags(raw: string): string[] {
  const tags = parseArray(raw, 'タグ', 30);
  if (tags.some(tag => !tag.trim() || tag !== tag.trim() || tag.length > 50)) {
    invalid('タグは前後の空白を除いた1〜50文字で指定してください。');
  }
  if (new Set(tags).size !== tags.length) invalid('同じタグは複数指定できません。');
  return tags;
}
export function parseTipRelationIds(raw: string): string[] {
  const ids = parseArray(raw, '関連設定', 30);
  if (ids.some(id => !id || id.length > 100)) invalid('関連先IDが不正です。');
  if (new Set(ids).size !== ids.length) invalid('同じ設定を複数関連付けできません。');
  return ids;
}
