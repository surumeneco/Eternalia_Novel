/**
 * Language-specific script, sound connections and parts-of-speech masters.
 * All three are published under their Language's snapshot and visibility.
 */
export interface LanguageCharacter {
  id: string;
  glyph: string;
  pronunciation: string;
  canStart: boolean;
  canEnd: boolean;
  /** IDs of characters allowed immediately after this one. */
  nextIds: string[];
}
export interface LanguageWordClass {
  id: string;
  name: string;
  description: string;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function invalid(message: string): never { throw { code: 'bad-request', message }; }
function text(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || value.length > max) invalid(label + 'が不正です。');
  return value.trim();
}
function checkedId(value: unknown): string {
  if (typeof value !== 'string' || !uuid.test(value)) invalid('識別子が不正です。');
  return value;
}
export function parseLanguageCharacters(raw: string): LanguageCharacter[] {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { invalid('文字・音韻データを読めません。'); }
  if (!Array.isArray(data) || data.length > 120) invalid('文字は最大120件です。');
  const ids = new Set<string>();
  const characters = data.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) invalid('文字データが不正です。');
    const value = entry as Record<string, unknown>;
    const id = checkedId(value.id);
    if (ids.has(id)) invalid('文字IDが重複しています。');
    ids.add(id);
    const glyph = text(value.glyph, 40, '文字');
    if (!glyph) invalid('文字を入力してください。');
    const pronunciation = text(value.pronunciation ?? '', 100, '発音');
    if (typeof value.canStart !== 'boolean' || typeof value.canEnd !== 'boolean') invalid('語頭・語末の設定が不正です。');
    if (!Array.isArray(value.nextIds) || value.nextIds.length > 120) invalid('後続可能文字が不正です。');
    const nextIds = value.nextIds.map(checkedId);
    if (new Set(nextIds).size !== nextIds.length) invalid('後続可能文字が重複しています。');
    return { id, glyph, pronunciation, canStart: value.canStart, canEnd: value.canEnd, nextIds };
  });
  for (const character of characters) {
    if (character.nextIds.some(id => !ids.has(id))) invalid('後続可能文字が文字一覧に存在しません。');
  }
  return characters;
}
export function parseLanguageWordClasses(raw: string): LanguageWordClass[] {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { invalid('品詞データを読めません。'); }
  if (!Array.isArray(data) || data.length > 50) invalid('品詞は最大50件です。');
  const ids = new Set<string>();
  return data.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) invalid('品詞データが不正です。');
    const value = entry as Record<string, unknown>;
    const id = checkedId(value.id);
    if (ids.has(id)) invalid('品詞IDが重複しています。');
    ids.add(id);
    const name = text(value.name, 80, '品詞名');
    if (!name) invalid('品詞名を入力してください。');
    return { id, name, description: text(value.description ?? '', 2000, '品詞の説明') };
  });
}
