import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateUiMessage, uiMessages } from '../app/composables/useUiLocale.ts';
import { enUiMessages } from '../app/composables/ui-messages-en.ts';

test('READER-01: public labels, filters and error states are translated with full key parity',()=>{
 assert.deepEqual(Object.keys(uiMessages.ja).sort(),Object.keys(enUiMessages).sort());
 const keys=['readerStoryToc','readerErrorItem','readerErrorChapter','readerPeriodFilter',
  'readerDictionaryLanguageFilter','readerWordSearch','readerTipSearch','readerRefTitle',
  'readerEtymology','readerKindVolume','readerNoPublicInSection','readerLoadingContent'];
 for (const key of keys) {
  assert.ok(uiMessages.ja[key]?.trim(),key+' ja');
  assert.ok(enUiMessages[key]?.trim(),key+' en');
  assert.notEqual(translateUiMessage(key,'en'),translateUiMessage(key,'ja'),key);
  assert.equal(translateUiMessage(key,'xx'),uiMessages.ja[key]);
 }
});
