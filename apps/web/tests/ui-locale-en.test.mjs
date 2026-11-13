import test from 'node:test';
import assert from 'node:assert/strict';
import { translateUiMessage, uiMessages } from '../app/composables/useUiLocale.ts';
import { enUiMessages } from '../app/composables/ui-messages-en.ts';

test('CM-08/AC-59: all existing fixed labels have a distinct complete English catalog', () => {
  const jaKeys=Object.keys(uiMessages.ja).sort();
  assert.deepEqual(Object.keys(enUiMessages).sort(),jaKeys,'no missing/extra English keys');
  for(const key of jaKeys){
    assert.ok(enUiMessages[key].trim(), 'empty English UI text: '+key);
    assert.equal(translateUiMessage(key,'en'),enUiMessages[key],key);
    assert.equal(translateUiMessage(key,'ja'),uiMessages.ja[key],key);
    assert.equal(translateUiMessage(key,'unknown'),uiMessages.ja[key],key);
  }
});
test('CM-08: injected catalog overrides built-in English and unknown names remain safe',()=>{
  assert.equal(translateUiMessage('home','en'),'Home');
  assert.equal(translateUiMessage('home','en',{en:{...enUiMessages,home:'Overrides'}}),'Overrides');
  for(const lang of ['','__proto__','constructor','zh','de']){
    assert.equal(translateUiMessage('home',lang),'ホーム');
  }
});
test('CM-08: content authorship is separate from fixed message keys',()=>{
  const manuscript='世界の最初の一頁｜漢字《かんじ》';
  assert.equal(translateUiMessage('chapter','en'),'Chapter');
  assert.ok(!Object.values(enUiMessages).includes(manuscript));
});
