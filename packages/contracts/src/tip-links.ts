/**
 * ST-04/ST-05: author tags reference site-wide stable catalog IDs.
 * Reader-facing tag names are copied into an explicit published snapshot;
 * related tips retain author-selected order.
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
/** Validate author-side stable references. No legacy name-to-ID adapter. */
export function parseTipTagIds(raw: string): string[] {
  const ids = parseArray(raw, 'タグID', 30);
  if (ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    invalid('タグは登録済みのマスタIDで指定してください。');
  }
  const normalized = ids.map(id => id.toLowerCase());
  if (new Set(normalized).size !== normalized.length) invalid('同じタグIDは複数指定できません。');
  return normalized;
}

export function parseTipRelationIds(raw: string): string[] {
  const ids = parseArray(raw, '関連設定', 30);
  if (ids.some(id => !id || id.length > 100)) invalid('関連先IDが不正です。');
  if (new Set(ids).size !== ids.length) invalid('同じ設定を複数関連付けできません。');
  return ids;
}
