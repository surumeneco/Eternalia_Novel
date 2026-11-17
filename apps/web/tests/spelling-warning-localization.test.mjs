import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateUiMessage } from '../app/composables/useUiLocale.ts';
import { localizeSpellingWarning } from '../app/utils/spelling-warning-localization.ts';

test('CM-08: author spelling warnings are localized by stable code, not server-language message', () => {
  const cases = [
    ['duplicate-spelling','同じ言語内に同じスペルの単語が登録されています。保存できません。',
      'A word with the same spelling already exists in this language. You cannot save this spelling.'],
    ['phonotactics','登録された語頭・語末・後続文字の条件に一致しません。',
      'The spelling does not satisfy the registered start, end, or following-character rules.'],
    ['unknown-alphabet','綴りに登録済みの文字が見つかりません。',
      'The spelling contains no registered characters.'],
  ];
  for (const [code,ja,en] of cases) {
    assert.equal(localizeSpellingWarning(code,key=>translateUiMessage(key,'ja')),ja,code+' ja');
    assert.equal(localizeSpellingWarning(code,key=>translateUiMessage(key,'en')),en,code+' en');
    assert.equal(localizeSpellingWarning(code,key=>translateUiMessage(key,'de')),ja,code+' fallback');
  }
});
