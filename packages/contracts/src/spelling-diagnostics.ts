import { type Library } from './novel.js';
import { parseLanguageCharacters, type LanguageCharacter } from './language-structure.js';

export interface SpellingWarning {
  code: 'duplicate-spelling' | 'phonotactics' | 'unknown-alphabet';
  message: string;
}

/**
 * Diagnostics only; rejected vs accepted spellings have not been normatively
 * decided. Never mutate a word or overwrite author content.
 */
export function diagnoseWordSpelling(library: Library, wordId: string, rawSpell: string): SpellingWarning[] {
  const target=library.nodes.find(node => node.id===wordId && node.kind==='word');
  if (!target || !target.parentId || typeof rawSpell!=='string') return [];
  const spell=rawSpell.trim();
  if (!spell) return [];
  const warnings:SpellingWarning[]=[];
  const duplicates=library.nodes.filter(node =>
    node.id!==wordId && node.kind==='word' && node.parentId===target.parentId &&
    node.draft.title.trim()===spell);
  if (duplicates.length) warnings.push({
    code:'duplicate-spelling',
    message:'同じ言語内に同じ綴りの単語があります。意味と登録対象を確認してください。',
  });
  const language=library.nodes.find(node => node.id===target.parentId && node.kind==='language');
  if (!language?.draft.details.characters) return warnings;
  let alphabet:LanguageCharacter[];
  try { alphabet=parseLanguageCharacters(language.draft.details.characters); }
  catch { return warnings; }
  if (!alphabet.length) return warnings;
  // Accept a spelling if any sequence of registered glyphs satisfies the
  // language's start, transition and end constraints, even for multi-codepoint
  // script glyphs. No fixed one-character segmentation is assumed.
  const positions:Array<Set<string>>=Array.from({length:spell.length+1},()=>new Set<string>());
  const starts=alphabet.filter(character=>character.canStart);
  for(const character of starts) {
    if(spell.startsWith(character.glyph)) positions[character.glyph.length]!.add(character.id);
  }
  const byId=new Map(alphabet.map(character=>[character.id,character]));
  for(let pos=1;pos<spell.length;pos++) {
    for(const id of positions[pos]!) {
      const previous=byId.get(id);
      if (!previous) continue;
      for(const nextId of previous.nextIds) {
        const character=byId.get(nextId);
        if(character && spell.startsWith(character.glyph,pos)) {
          positions[pos+character.glyph.length]!.add(character.id);
        }
      }
    }
  }
  if ([...positions[spell.length]!].some(id=>byId.get(id)?.canEnd)) return warnings;
  const recognized=alphabet.some(character=>spell.includes(character.glyph));
  warnings.push(recognized?{
    code:'phonotactics',message:'登録された語頭・語末・後続文字の条件に一致しません。',
  }:{
    code:'unknown-alphabet',message:'綴りに登録済みの文字が見つかりません。',
  });
  return warnings;
}
