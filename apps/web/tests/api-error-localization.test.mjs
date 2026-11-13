import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizeApiError } from '../app/utils/api-error-localization.ts';
import { translateUiMessage } from '../app/composables/useUiLocale.ts';

const tr = lang => key => translateUiMessage(key,lang);
const failure=(statusCode,message,code)=>({statusCode,data:{statusCode,message,...(code?{code}:{})}});
test('AC-59: Japanese preserves detailed server error strings and arrays',()=>{
  assert.equal(localizeApiError(failure(400,'名前が不正です。'),'ja',tr('ja'),'fallback'),'名前が不正です。');
  assert.equal(localizeApiError(failure(400,['Aが必要です。','Bが不正です。']),'ja',tr('ja'),'fallback'),'Aが必要です。 / Bが不正です。');
  assert.equal(localizeApiError(failure(409,'  '),'ja',tr('ja'),'fallback'),'fallback');
  assert.equal(localizeApiError({},'ja',tr('ja'),'fallback'),'fallback');
});
test('AC-59: English maps known HTTP status and code without Japanese leakage',()=>{
  for(const code of [400,401,403,404,409]){
    const result=localizeApiError(failure(code,'日本語の内部エラー'),'en',tr('en'),'fallback');
    assert.ok(/^[\x20-\x7e]+$/.test(result),String(code));
    assert.ok(result.includes(' '));
    assert.notEqual(result,'日本語の内部エラー');
  }
  assert.equal(localizeApiError(failure(409,'既に登録済み','duplicate-spelling'),'en',tr('en'),'fallback'),
    translateUiMessage('apiErrorDuplicateSpelling','en'));
  assert.equal(localizeApiError(failure(500,'サーバーの内部例外'),'en',tr('en'),'fallback'),'fallback');
  assert.equal(localizeApiError(new Error('ネットワーク障害'),'en',tr('en'),'fallback'),'fallback');
});
test('AC-59: unsupported language follows Japanese fallback without mutation',()=>{
  const err=failure(409,'変更が競合しています。');
  const before=JSON.stringify(err);
  assert.equal(localizeApiError(err,'other',tr('ja'),'fallback'),'変更が競合しています。');
  assert.equal(JSON.stringify(err),before);
});
